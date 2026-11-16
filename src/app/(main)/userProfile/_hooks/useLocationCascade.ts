import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAimags, getClasses, getDistricts, getSchools } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type {
	AimagItem,
	ClassItem,
	DistrictItem,
	SchoolItem,
	SelectedSchool,
	UserData,
} from "../_lib/types";

const NO_PREFILL = {
	aimag: false,
	district: false,
	school: false,
	class: false,
};
const ALL_PREFILL = { aimag: true, district: true, school: true, class: true };

/** Нэрээр (эхлээд яг, дараа нь том/жижиг үсэг үл харгалзан) хайх */
function findByName<T>(
	list: T[],
	getName: (item: T) => string,
	name: string,
): T | undefined {
	const target = name.trim().toLowerCase();
	return (
		list.find((item) => getName(item) === name) ??
		list.find((item) => getName(item)?.trim().toLowerCase() === target)
	);
}

/**
 * Аймаг → сум/дүүрэг → сургууль → анги гэсэн хамааралтай сонголтууд,
 * тэдгээрийн жагсаалтын query болон edit горимд орох үеийн prefill.
 */
export function useLocationCascade(isEditing: boolean, user: UserData) {
	// ─── Хэрэглэгчийн сонголт ────────────────────────────────────────────────
	const [selectedAimag, setSelectedAimag] = useState("");
	const [selectedDistrict, setSelectedDistrict] = useState("");
	const [selectedSchoolInfo, setSelectedSchoolInfo] =
		useState<SelectedSchool | null>(null);
	const selectedSchool = selectedSchoolInfo?.name ?? "";
	const [selectedClass, setSelectedClass] = useState("");

	// Edit горимд орох үед хэрэглэгчийн одоогийн байршлыг автоматаар сонгох
	// алхмууд. Хэрэглэгч гараар сонговол доод түвшний prefill цуцлагдана.
	const prefillRef = useRef({ ...NO_PREFILL });

	const userRef = useRef(user);
	useEffect(() => {
		userRef.current = user;
	}, [user]);

	// ─── Dropdown lists (parent id-аар key хийсэн dependent query) ─────────────
	// Key нь parent сонголтоос хамаардаг тул хуучин хариу шинэ сонголтыг
	// дарж бичих (race) боломжгүй.
	const aimagQuery = useQuery({
		queryKey: queryKeys.profile.aimags,
		queryFn: async (): Promise<AimagItem[]> =>
			(await getAimags()).RetData ?? [],
		enabled: isEditing,
		staleTime: Number.POSITIVE_INFINITY,
	});
	const aimagList: AimagItem[] = aimagQuery.data ?? [];
	const aimagLoading = aimagQuery.isFetching;
	const selectedAimagItem = aimagList.find(
		(a) => a.mID.toString() === selectedAimag,
	);
	const aimagId = selectedAimagItem?.mID;

	const districtQuery = useQuery({
		queryKey: queryKeys.profile.districts(aimagId),
		queryFn: async (): Promise<DistrictItem[]> =>
			(await getDistricts(aimagId ?? 0)).RetData ?? [],
		enabled: isEditing && !!aimagId,
		staleTime: Number.POSITIVE_INFINITY,
	});
	const districtList: DistrictItem[] = (aimagId && districtQuery.data) || [];
	const districtLoading = districtQuery.isFetching;
	const districtId = selectedDistrict ? Number(selectedDistrict) : undefined;

	const schoolQuery = useQuery({
		queryKey: queryKeys.profile.schools(aimagId, districtId),
		queryFn: async (): Promise<SchoolItem[]> =>
			(await getSchools(aimagId ?? 0, districtId ?? 0)).RetData ?? [],
		enabled: isEditing && !!aimagId && !!districtId,
		staleTime: Number.POSITIVE_INFINITY,
	});
	const schoolList: SchoolItem[] =
		(aimagId && districtId && schoolQuery.data) || [];
	const schoolLoading = schoolQuery.isFetching;

	const schoolDb = selectedSchoolInfo?.db ?? "";
	const schoolIp = selectedSchoolInfo?.serverip ?? "";
	const classQuery = useQuery({
		queryKey: queryKeys.profile.classes(schoolDb, schoolIp),
		queryFn: async (): Promise<ClassItem[]> =>
			((await getClasses(schoolDb, schoolIp)).RetData ?? []).filter(
				(c: ClassItem) => c.studentgroupid && c.studentgroupid !== "0",
			),
		enabled: isEditing && !!schoolDb,
		staleTime: Number.POSITIVE_INFINITY,
	});
	const classList: ClassItem[] = (schoolDb && classQuery.data) || [];
	const classLoading = classQuery.isFetching;

	useEffect(() => {
		setSelectedAimag("");
		setSelectedDistrict("");
		setSelectedSchoolInfo(null);
		setSelectedClass("");
		prefillRef.current = isEditing ? { ...ALL_PREFILL } : { ...NO_PREFILL };
	}, [isEditing]);

	// Prefill: аймаг
	useEffect(() => {
		if (!isEditing || !prefillRef.current.aimag || !aimagQuery.data) return;
		prefillRef.current.aimag = false;
		const name = userRef.current.aimag_name;
		const aimag = name
			? findByName(aimagQuery.data, (a) => a.mName, name)
			: undefined;
		if (aimag) setSelectedAimag(aimag.mID.toString());
		else prefillRef.current = { ...NO_PREFILL };
	}, [isEditing, aimagQuery.data]);

	// Prefill: сум / дүүрэг
	useEffect(() => {
		if (!prefillRef.current.district || !aimagId || !districtQuery.data) return;
		prefillRef.current.district = false;
		const u = userRef.current;
		const symIdStr = String(u.sym_id ?? "").trim();
		const district =
			(symIdStr
				? districtQuery.data.find((d) => String(d.id) === symIdStr)
				: undefined) ??
			(u.sym_name
				? findByName(districtQuery.data, (d) => d.name, u.sym_name)
				: undefined);
		if (district) {
			setSelectedDistrict(district.id.toString());
		} else {
			prefillRef.current.school = false;
			prefillRef.current.class = false;
		}
	}, [aimagId, districtQuery.data]);

	// Prefill: сургууль
	useEffect(() => {
		if (!prefillRef.current.school || !districtId || !schoolQuery.data) return;
		prefillRef.current.school = false;
		const u = userRef.current;
		const school = u.sch_name
			? findByName(schoolQuery.data, (s) => s.sName, u.sch_name)
			: undefined;
		if (school) {
			setSelectedSchoolInfo({
				name: school.sName,
				db: school.dbname,
				serverip: school.serverip || "",
			});
		} else if (u.sch_name) {
			// Жагсаалтад байхгүй ч хэрэглэгчийн хадгалсан сургуулийг үлдээнэ
			setSelectedSchoolInfo({
				name: u.sch_name,
				db: u.schooldb ?? "",
				serverip: "",
			});
		} else {
			prefillRef.current.class = false;
		}
	}, [districtId, schoolQuery.data]);

	// Prefill: анги
	useEffect(() => {
		if (!prefillRef.current.class || !schoolDb || !classQuery.data) return;
		prefillRef.current.class = false;
		const userGroupId = String(userRef.current.studentgroupid ?? "").trim();
		const matched = userGroupId
			? classQuery.data.find(
					(c) => String(c.studentgroupid).trim() === userGroupId,
				)
			: undefined;
		if (matched) setSelectedClass(matched.studentgroupid);
	}, [schoolDb, classQuery.data]);

	// ─── Хэрэглэгч өөрчлөхөд ─────────────────────────────────────────────────
	const onAimag = useCallback((val: string) => {
		prefillRef.current = { ...NO_PREFILL };
		setSelectedAimag(val);
		setSelectedDistrict("");
		setSelectedSchoolInfo(null);
		setSelectedClass("");
	}, []);

	const onDistrict = useCallback((val: string) => {
		prefillRef.current = { ...NO_PREFILL };
		setSelectedDistrict(val);
		setSelectedSchoolInfo(null);
		setSelectedClass("");
	}, []);

	const onSchool = useCallback(
		(val: string) => {
			prefillRef.current = { ...NO_PREFILL };
			setSelectedClass("");
			const schoolData = schoolList.find((s) => s.sName === val);
			setSelectedSchoolInfo(
				schoolData
					? {
							name: schoolData.sName,
							db: schoolData.dbname,
							serverip: schoolData.serverip || "",
						}
					: null,
			);
		},
		[schoolList],
	);

	const onClass = useCallback((val: string) => {
		prefillRef.current = { ...NO_PREFILL };
		setSelectedClass(val);
	}, []);

	return {
		selectedAimag,
		selectedDistrict,
		selectedSchool,
		selectedClass,
		selectedAimagItem,
		schoolDb,
		aimagList,
		aimagLoading,
		districtList,
		districtLoading,
		schoolList,
		schoolLoading,
		classList,
		classLoading,
		onAimag,
		onDistrict,
		onSchool,
		onClass,
	};
}

export type LocationCascade = ReturnType<typeof useLocationCascade>;
