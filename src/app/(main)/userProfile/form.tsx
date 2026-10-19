"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	Camera,
	Check,
	CheckCircle2,
	Edit2,
	Loader2,
	Lock,
	Mail,
	MapPin,
	Phone,
	School,
	User2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import { getUserUpdateProfile } from "@/lib/api";
import { uploadImage } from "@/utils/upload";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AimagItem {
	mAcode: string;
	mName: string;
	mID: number;
	sort: number;
	miid: string;
	mid1: number;
}
interface DistrictItem {
	id: number;
	name: string;
	sort: number;
}
interface SchoolItem {
	sName: string;
	conn: string;
	dbname: string;
	sort: number;
	district_id: number;
	serverip: string;
}
interface ClassItem {
	id: number;
	class_name: string;
	studentgroupid: string;
	sort: number;
}

interface UserData {
	lastname: string;
	firstname: string;
	email: string;
	Phone: string | null;
	img_url: string | null;
	username: string;
	ugroup: number;
	password: string | null;
	aimag_name?: string | null;
	aimag_id?: string | number | null;
	sym_name?: string | null;
	sym_id?: string | number | null;
	sch_name?: string | null;
	schooldb?: string | null;
	studentgroupname?: string | null;
	studentgroupid?: string | null;
}

interface ProfileContentProps {
	user: UserData;
	userId: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiAimag() {
	const r = await fetch("/api/sign/aimag", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({}),
	});
	if (!r.ok) throw new Error("Аймгийн мэдээлэл авахад алдаа гарлаа");
	return r.json();
}
async function apiDistrict(aimagId: number) {
	const r = await fetch("/api/sign/district", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ aimag_id: aimagId }),
	});
	if (!r.ok) throw new Error("Дүүргийн мэдээлэл авахад алдаа гарлаа");
	return r.json();
}
async function apiSchool(aimagId: number, districtId: number) {
	const r = await fetch("/api/sign/surguuli", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ aimag_id: aimagId, district_id: districtId }),
	});
	if (!r.ok) throw new Error("Сургуулийн мэдээлэл авахад алдаа гарлаа");
	return r.json();
}
async function apiClass(database: string, serverip: string) {
	const r = await fetch("/api/sign/angi", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ database, serverip }),
	});
	if (!r.ok) throw new Error("Ангийн мэдээлэл авахад алдаа гарлаа");
	return r.json();
}

// ─── Visual helpers ───────────────────────────────────────────────────────────
type Tone = "violet" | "sky" | "mint" | "sun" | "coral" | "pink";
const TONE_CHIP: Record<Tone, string> = {
	violet: "bg-pop-violet-soft text-pop-violet-ink",
	sky: "bg-pop-sky-soft text-pop-sky-ink",
	mint: "bg-pop-mint-soft text-pop-mint-ink",
	sun: "bg-pop-sun-soft text-pop-sun-ink",
	coral: "bg-pop-coral-soft text-pop-coral-ink",
	pink: "bg-pop-pink-soft text-pop-pink-ink",
};

function IconChip({
	tone,
	children,
	className = "",
}: {
	tone: Tone;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<span
			className={`flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5 ${TONE_CHIP[tone]} ${className}`}
		>
			{children}
		</span>
	);
}

function SectionTitle({
	tone,
	icon,
	title,
}: {
	tone: Tone;
	icon: React.ReactNode;
	title: string;
}) {
	return (
		<div className="mb-5 flex items-center gap-3">
			<IconChip tone={tone}>{icon}</IconChip>
			<h3 className="text-lg font-black tracking-tight">{title}</h3>
		</div>
	);
}

// ─── SelectField ──────────────────────────────────────────────────────────────
interface SelectFieldProps {
	label: string;
	placeholder: string;
	options: { value: string; label: string }[];
	value: string;
	onValueChange: (v: string) => void;
	disabled?: boolean;
	loading?: boolean;
	icon: React.ReactNode;
}
function SelectField({
	label,
	placeholder,
	options,
	value,
	onValueChange,
	disabled,
	loading,
	icon,
}: SelectFieldProps) {
	return (
		<div className="flex items-start gap-3 rounded-2xl bg-muted p-4">
			<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card [&_svg]:size-5">
				{icon}
			</span>
			<div className="min-w-0 flex-1">
				<p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
					{label}
					{loading && (
						<Loader2 className="size-3 animate-spin text-primary" />
					)}
				</p>
				{disabled && !value ? (
					<p className="text-sm font-bold text-foreground">
						<span className="font-semibold text-muted-foreground">—</span>
					</p>
				) : (
					<Select
						value={value}
						onValueChange={onValueChange}
						disabled={disabled || loading}
					>
						<SelectTrigger className="h-10 w-full rounded-xl border-2 border-input bg-card text-sm font-bold text-foreground">
							<span className="block truncate text-left text-sm">
								{value && options.length === 0 ? (
									<Loader2 className="inline size-3 animate-spin text-primary" />
								) : value ? (
									(options.find((o) => o.value === value)?.label ?? value)
								) : (
									placeholder
								)}
							</span>
						</SelectTrigger>
						<SelectContent className="max-w-(--radix-select-trigger-width)">
							{options
								.filter((o) => o.value !== "")
								.map((o) => (
									<SelectItem
										key={o.value}
										value={o.value}
										className="whitespace-normal"
									>
										{o.label}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				)}
			</div>
		</div>
	);
}

function InfoTile({
	tone,
	icon,
	label,
	children,
	className = "",
}: {
	tone: Tone;
	icon: React.ReactNode;
	label: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`flex items-start gap-3 rounded-2xl bg-muted p-4 ${className}`}>
			<IconChip tone={tone}>{icon}</IconChip>
			<div className="min-w-0 flex-1">
				<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
					{label}
				</p>
				<p className="mt-0.5 break-words text-sm font-bold text-foreground">
					{children}
				</p>
			</div>
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProfileContent({ user, userId }: ProfileContentProps) {
	const queryClient = useQueryClient();
	const isTeacher = user.ugroup === 3 || user.ugroup === 4;
	const [showToast, setShowToast] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [phoneError, setPhoneError] = useState("");
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>("");
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
	const [locationError, setLocationError] = useState("");

	// ─── Dropdown lists ───────────────────────────────────────────────────────
	const [aimagList, setAimagList] = useState<AimagItem[]>([]);
	const aimagListRef = useRef<AimagItem[]>([]);
	const pendingAimagIdRef = useRef<string>("");
	const [districtList, setDistrictList] = useState<DistrictItem[]>([]);
	const [schoolList, setSchoolList] = useState<SchoolItem[]>([]);
	const [classList, setClassList] = useState<ClassItem[]>([]);

	const [aimagLoading, setAimagLoading] = useState(false);
	const [districtLoading, setDistrictLoading] = useState(false);
	const [schoolLoading, setSchoolLoading] = useState(false);
	const [classLoading, setClassLoading] = useState(false);

	// ─── Хэрэглэгчийн сонголт ────────────────────────────────────────────────
	const [selectedAimag, setSelectedAimag] = useState("");
	const [selectedDistrict, setSelectedDistrict] = useState("");
	const [selectedSchool, setSelectedSchool] = useState("");
	const selectedSchoolDbRef = useRef("");
	const selectedSchoolServerIpRef = useRef("");
	const [selectedClass, setSelectedClass] = useState("");

	const pendingDistrictIdRef = useRef<string>("");
	const pendingSchoolNameRef = useRef<string>("");
	const pendingSchoolDbRef = useRef<string>("");
	const pendingSchoolServerIpRef = useRef<string>("");
	const pendingClassIdRef = useRef<string>("");

	const [editForm, setEditForm] = useState({
		lastname: user.lastname || "",
		firstname: user.firstname || "",
		email: user.email || "",
		Phone: user.Phone || "",
		password: "",
		confirmPassword: "",
	});

	const userRef = useRef(user);
	useEffect(() => {
		userRef.current = user;
	}, [user]);

	useEffect(() => {
		if (pendingAimagIdRef.current && aimagList.length > 0) {
			const id = pendingAimagIdRef.current;
			pendingAimagIdRef.current = "";
			if (aimagList.some((a) => a.mID.toString() === id)) {
				setSelectedAimag(id);
			}
		}
	}, [aimagList]);

	useEffect(() => {
		if (pendingDistrictIdRef.current && districtList.length > 0) {
			const id = pendingDistrictIdRef.current;
			pendingDistrictIdRef.current = "";
			if (districtList.some((d) => d.id.toString() === id)) {
				setSelectedDistrict(id);
			}
		}
	}, [districtList]);

	const schoolListLengthRef = useRef(0);
	useEffect(() => {
		if (schoolList.length === schoolListLengthRef.current) return;
		schoolListLengthRef.current = schoolList.length;
		if (pendingSchoolNameRef.current) {
			const name = pendingSchoolNameRef.current;
			const db = pendingSchoolDbRef.current;
			const ip = pendingSchoolServerIpRef.current;
			pendingSchoolNameRef.current = "";
			pendingSchoolDbRef.current = "";
			pendingSchoolServerIpRef.current = "";
			setSelectedSchool(name);
			selectedSchoolDbRef.current = db;
			selectedSchoolServerIpRef.current = ip;
		}
	}, [schoolList]);

	useEffect(() => {
		if (pendingClassIdRef.current && classList.length > 0) {
			const id = pendingClassIdRef.current;
			pendingClassIdRef.current = "";
			if (classList.some((c) => c.studentgroupid === id)) {
				setSelectedClass(id);
			}
		}
	}, [classList]);

	// ─── Edit горим ──────────────────────────────────────────────────────────
	useEffect(() => {
		if (!isEditing) {
			setEditForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
			setSelectedAimag("");
			setSelectedDistrict("");
			setSelectedSchool("");
			setSelectedClass("");
			selectedSchoolDbRef.current = "";
			pendingAimagIdRef.current = "";
			selectedSchoolServerIpRef.current = "";
			pendingDistrictIdRef.current = "";
			pendingSchoolNameRef.current = "";
			pendingSchoolDbRef.current = "";
			pendingSchoolServerIpRef.current = "";
			pendingClassIdRef.current = "";
			setDistrictList([]);
			setSchoolList([]);
			setClassList([]);
			return;
		}

		const u = userRef.current;

		setEditForm({
			lastname: u.lastname || "",
			firstname: u.firstname || "",
			email: u.email || "",
			Phone: u.Phone || "",
			password: "",
			confirmPassword: "",
		});

		const cachedList = aimagListRef.current;
		if (cachedList.length > 0) {
			setAimagList(cachedList);
		}

		// ── comma operator-г async IIFE-ээр орлуулав ──────────────────────────
		const aimagPromise: Promise<AimagItem[]> =
			cachedList.length > 0
				? Promise.resolve(cachedList)
				: (async () => {
						setAimagLoading(true);
						try {
							const d = await apiAimag();
							const list: AimagItem[] = d.RetData ?? [];
							setAimagList(list);
							aimagListRef.current = list;
							return list;
						} catch {
							return [] as AimagItem[];
						} finally {
							setAimagLoading(false);
						}
					})();

		aimagPromise.then((list) => {
			if (!u.aimag_name) return;

			const aimag =
				list.find((a) => a.mName === u.aimag_name) ??
				list.find(
					(a) =>
						a.mName.trim().toLowerCase() === u.aimag_name?.trim().toLowerCase(),
				);
			if (!aimag) return;
			setSelectedAimag(aimag.mID.toString());
			pendingAimagIdRef.current = aimag.mID.toString();

			setDistrictLoading(true);
			apiDistrict(aimag.mID)
				.then((dd) => {
					const dlist: DistrictItem[] = dd.RetData ?? [];

					const symIdStr = String(u.sym_id ?? "").trim();
					const district =
						(symIdStr
							? dlist.find((dv) => String(dv.id) === symIdStr)
							: undefined) ??
						dlist.find((dv) => dv.name === u.sym_name) ??
						dlist.find(
							(dv) =>
								dv.name.trim().toLowerCase() ===
								u.sym_name?.trim().toLowerCase(),
						);

					if (district) {
						pendingDistrictIdRef.current = district.id.toString();
					}

					setDistrictList(dlist);

					if (!district) return;

					setSchoolLoading(true);
					apiSchool(aimag.mID, district.id)
						.then((sd) => {
							const slist: SchoolItem[] = sd.RetData ?? [];

							const school =
								slist.find((s) => s.sName === u.sch_name) ??
								slist.find(
									(s) =>
										s.sName.trim().toLowerCase() ===
										u.sch_name?.trim().toLowerCase(),
								);

							if (school) {
								pendingSchoolNameRef.current = school.sName;
								pendingSchoolDbRef.current = school.dbname;
								pendingSchoolServerIpRef.current = school.serverip || "";
							} else if (u.sch_name) {
								pendingSchoolNameRef.current = u.sch_name;
								pendingSchoolDbRef.current = u.schooldb ?? "";
								pendingSchoolServerIpRef.current = "";
							}

							setSchoolList(slist);

							const targetDb = school?.dbname ?? (u.schooldb || "");
							const targetIp = school?.serverip ?? "";
							if (!targetDb) return;

							setClassLoading(true);
							apiClass(targetDb, targetIp)
								.then((cd) => {
									console.log("Бүх анги:", cd.RetData);
									const clist = (cd.RetData ?? []).filter(
										(c: ClassItem) =>
											c.studentgroupid && c.studentgroupid !== "0",
									);

									const userGroupId = String(u.studentgroupid ?? "").trim();
									const matched = clist.find(
										(c: ClassItem) =>
											userGroupId &&
											String(c.studentgroupid).trim() === userGroupId,
									);

									if (matched) {
										pendingClassIdRef.current = matched.studentgroupid;
									}

									setClassList(clist);
								})
								.catch(() => setClassList([]))
								.finally(() => setClassLoading(false));
						})
						.catch(() => setSchoolList([]))
						.finally(() => setSchoolLoading(false));
				})
				.catch(() => setDistrictList([]))
				.finally(() => setDistrictLoading(false));
		});
	}, [isEditing]);

	// ─── Хэрэглэгч өөрчлөхөд ─────────────────────────────────────────────────
	const onAimag = useCallback(
		async (val: string) => {
			setSelectedAimag(val);
			setSelectedDistrict("");
			setSelectedSchool("");
			setSelectedClass("");
			selectedSchoolDbRef.current = "";
			selectedSchoolServerIpRef.current = "";
			pendingDistrictIdRef.current = "";
			pendingSchoolNameRef.current = "";
			pendingClassIdRef.current = "";
			setDistrictList([]);
			setSchoolList([]);
			setClassList([]);
			if (!val) return;
			const a = aimagList.find((x) => x.mID.toString() === val);
			if (!a) return;
			setDistrictLoading(true);
			try {
				const d = await apiDistrict(a.mID);
				setDistrictList(d.RetData ?? []);
			} catch {
				setDistrictList([]);
			} finally {
				setDistrictLoading(false);
			}
		},
		[aimagList],
	);

	const onDistrict = useCallback(
		async (val: string) => {
			setSelectedDistrict(val);
			setSelectedSchool("");
			setSelectedClass("");
			selectedSchoolDbRef.current = "";
			selectedSchoolServerIpRef.current = "";
			pendingSchoolNameRef.current = "";
			pendingClassIdRef.current = "";
			setSchoolList([]);
			setClassList([]);
			if (!val) return;
			const currentAimag = aimagList.find(
				(x) => x.mID.toString() === selectedAimag,
			);
			if (!currentAimag) return;
			setSchoolLoading(true);
			try {
				const d = await apiSchool(currentAimag.mID, Number(val));
				setSchoolList(d.RetData ?? []);
			} catch {
				setSchoolList([]);
			} finally {
				setSchoolLoading(false);
			}
		},
		[selectedAimag, aimagList],
	);

	const onSchool = useCallback(
		async (val: string) => {
			setSelectedSchool(val);
			setSelectedClass("");
			setClassList([]);
			selectedSchoolDbRef.current = "";
			selectedSchoolServerIpRef.current = "";
			pendingClassIdRef.current = "";

			const schoolData = schoolList.find((s) => s.sName === val);
			if (!schoolData) return;

			selectedSchoolDbRef.current = schoolData.dbname;
			selectedSchoolServerIpRef.current = schoolData.serverip || "";

			setClassLoading(true);
			try {
				const d = await apiClass(schoolData.dbname, schoolData.serverip);
				setClassList(
					(d.RetData ?? []).filter(
						(c: ClassItem) => c.studentgroupid && c.studentgroupid !== "0",
					),
				);
			} catch {
				setClassList([]);
			} finally {
				setClassLoading(false);
			}
		},
		[schoolList],
	);

	// ─── Mutation ─────────────────────────────────────────────────────────────
	const updateMutation = useMutation({
		mutationFn: async (data: {
			firstname: string;
			lastname: string;
			phone: string;
			email: string;
			aimag_id: number;
			aimagname: string;
			sym_id: number;
			symname: string;
			regnumber: string;
			password?: string;
			schoolname: string;
			schooldb: string;
			studentgroupid: string;
			studentgroupname: string;
			user_id: number;
			img_url: string;
		}) => {
			return getUserUpdateProfile(
				data.firstname,
				data.lastname,
				data.phone,
				data.email,
				data.aimag_id,
				data.aimagname,
				data.sym_id,
				data.symname,
				data.regnumber,
				data.password ?? "",
				data.schoolname,
				data.schooldb,
				data.studentgroupid,
				data.studentgroupname,
				data.user_id,
				data.img_url ?? "",
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userProfilePage", userId] });
			setShowToast(true);
			setTimeout(() => setShowToast(false), 3000);
			setSelectedImage(null);
			setImagePreview("");
			setUploadedImageUrl("");
			setIsEditing(false);
		},
	});

	const convertToWebP = useCallback(
		async (
			file: File,
			quality = 0.85,
			maxWidth = 1920,
			maxHeight = 1080,
		): Promise<Blob> => {
			return new Promise((resolve, reject) => {
				const img = new Image();
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				img.onload = () => {
					let { width, height } = img;
					if (width > maxWidth || height > maxHeight) {
						const ratio = Math.min(maxWidth / width, maxHeight / height);
						width = width * ratio;
						height = height * ratio;
					}
					canvas.width = width;
					canvas.height = height;
					ctx?.drawImage(img, 0, 0, width, height);
					canvas.toBlob(
						(blob) =>
							blob
								? resolve(blob)
								: reject(new Error("WebP хөрвүүлэлт амжилтгүй")),
						"image/webp",
						quality,
					);
				};
				img.onerror = () => reject(new Error("Зураг уншихад алдаа гарлаа"));
				img.src = URL.createObjectURL(file);
			});
		},
		[],
	);

	const handleImageChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			if (!file.type.startsWith("image/")) {
				alert("Зөвхөн зураг файл сонгоно уу");
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				alert("Зургийн хэмжээ 10MB-аас бага байх ёстой");
				return;
			}
			try {
				setIsUploadingImage(true);
				const webpBlob = await convertToWebP(file);
				setImagePreview(URL.createObjectURL(webpBlob));
				const formData = new FormData();
				formData.append(
					"file",
					webpBlob,
					file.name.replace(/\.[^/.]+$/, ".webp"),
				);
				const result = await uploadImage(formData);
				if (result.fileStatus !== 0)
					throw new Error(result.message || "Upload амжилтгүй боллоо");
				const imageUrl = result.file?.url;
				if (!imageUrl) throw new Error("Upload хариуд URL байхгүй байна");
				setUploadedImageUrl(imageUrl);
				setSelectedImage(file);
			} catch (error: unknown) {
				alert(
					error instanceof Error
						? error.message
						: "Зураг upload хийхэд алдаа гарлаа",
				);
				setImagePreview("");
				setSelectedImage(null);
				setUploadedImageUrl("");
			} finally {
				setIsUploadingImage(false);
			}
		},
		[convertToWebP],
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!editForm.Phone || editForm.Phone.trim() === "") {
			setPhoneError("Утасны дугаар оруулна уу");
			return;
		}
		setPhoneError("");

		if (editForm.password && editForm.password !== editForm.confirmPassword) {
			setPasswordError("Нууц үг таарахгүй байна");
			return;
		}
		if (editForm.password && editForm.password.length < 6) {
			setPasswordError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
			return;
		}
		setPasswordError("");

		let finalImageUrl = "";
		if (uploadedImageUrl) {
			finalImageUrl =
				typeof uploadedImageUrl === "string"
					? uploadedImageUrl
					: (uploadedImageUrl as { FileWebUrl?: string }).FileWebUrl || "";
		} else if (user.img_url) {
			finalImageUrl =
				typeof user.img_url === "string"
					? user.img_url
					: (user.img_url as unknown as { FileWebUrl?: string }).FileWebUrl ||
						"";
		}

		const selectedAimagItem = aimagList.find(
			(a) => a.mID.toString() === selectedAimag,
		);
		const aimagName = selectedAimagItem?.mName ?? "";
		const aimagId = selectedAimagItem?.mID ?? 0;
		if (!aimagName || aimagId === 0) {
			setLocationError("Аймаг / Нийслэл сонгоно уу");
			return;
		}

		const selectedDistrictItem = districtList.find(
			(d) => d.id.toString() === selectedDistrict,
		);
		const symName = selectedDistrictItem?.name ?? "";
		const symId = selectedDistrictItem?.id ?? 0;
		if (!symName || symId === 0) {
			setLocationError("Сум / Дүүрэг сонгоно уу");
			return;
		}

		if (!selectedSchool) {
			setLocationError("Сургууль сонгоно уу");
			return;
		}
		const schoolDb = selectedSchoolDbRef.current;
		if (!schoolDb) {
			alert("Сургуулийн мэдээлэл алдаатай байна. Дахин сонгоно уу");
			return;
		}

		const selectedClassItem = isTeacher
			? undefined
			: classList.find((c) => c.studentgroupid === selectedClass);
		const studentgroupname = selectedClassItem?.class_name ?? "";

		if (!isTeacher && !studentgroupname) {
			setLocationError("Анги / Бүлэг сонгоно уу");
			return;
		}

		setLocationError("");
		updateMutation.mutate({
			firstname: editForm.firstname || user.firstname,
			lastname: editForm.lastname || user.lastname,
			phone: editForm.Phone,
			email: editForm.email || user.email,
			aimag_id: aimagId,
			aimagname: aimagName,
			sym_id: symId,
			symname: symName,
			regnumber: "",
			schoolname: selectedSchool,
			schooldb: schoolDb,
			studentgroupid: isTeacher ? "" : selectedClass,
			studentgroupname,
			user_id: userId,
			img_url: finalImageUrl,
			password: editForm.password || undefined,
		});
	};

	const getInitials = (name: string) => {
		if (!name) return "??";
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<div className="w-full">
			{showToast && (
				<div className="fixed right-4 top-6 z-50 animate-in fade-in slide-in-from-top-5 duration-500 sm:right-6">
					<div className="flex min-w-[280px] items-center gap-3 rounded-2xl border-2 border-success bg-success px-5 py-3 text-white shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_65%,black)]">
						<span className="flex size-9 items-center justify-center rounded-xl bg-white/20">
							<CheckCircle2 className="size-5" strokeWidth={2.5} />
						</span>
						<div className="flex-1">
							<p className="text-sm font-black">Амжилттай!</p>
							<p className="text-xs font-semibold opacity-90">Мэдээлэл шинэчлэгдлээ</p>
						</div>
						<Button
							onClick={() => setShowToast(false)}
							variant="ghost"
							size="icon"
							className="size-7 text-white hover:bg-white/20 hover:text-white"
						>
							<X className="size-4" />
						</Button>
					</div>
				</div>
			)}

			<div className="w-full">
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* ── Header card ── */}
					<div className="card-pop overflow-hidden animate-pop-in">
						{/* Colorful banner */}
						<div className="relative h-28 overflow-hidden bg-gradient-to-br from-pop-violet to-pop-pink sm:h-36">
							<div aria-hidden className="pointer-events-none absolute inset-0">
								<div className="absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
								<div className="absolute -bottom-12 left-1/4 size-32 rounded-full bg-white/10" />
								<div className="absolute right-1/3 top-6 size-3 rounded-full bg-pop-sun" />
								<div className="absolute right-[18%] bottom-5 size-6 rotate-12 rounded-lg bg-pop-sky/80" />
								<div className="absolute left-[12%] top-5 size-4 rounded-full bg-pop-mint/80" />
							</div>
						</div>

						<div className="relative px-5 pb-6 sm:px-8">
							<div className="-mt-14 flex flex-col items-center gap-4 sm:-mt-16 sm:flex-row sm:items-end">
								{/* Avatar */}
								<div className="flex flex-col items-center">
									<div className="relative group">
										<Avatar className="size-28 border-4 border-card bg-card shadow-[0_4px_0_0_var(--border)] sm:size-32">
											<AvatarImage
												src={imagePreview || user.img_url || undefined}
												className="object-cover"
											/>
											<AvatarFallback className="bg-pop-violet-soft text-3xl font-black text-pop-violet-ink">
												{getInitials(user.username)}
											</AvatarFallback>
										</Avatar>
										{isEditing && (
											<>
												<label
													htmlFor="image-upload"
													className="absolute bottom-1 right-1 flex size-10 cursor-pointer items-center justify-center rounded-full border-[3px] border-card bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--primary-shade)] transition-all hover:scale-110"
												>
													<Camera className="size-5" strokeWidth={2.5} />
												</label>
												{selectedImage && (
													<button
														type="button"
														onClick={() => {
															setSelectedImage(null);
															setImagePreview(user.img_url || "");
															setUploadedImageUrl("");
														}}
														className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full border-2 border-card bg-destructive text-white transition-all hover:scale-110"
													>
														<X className="size-4" strokeWidth={2.75} />
													</button>
												)}
											</>
										)}
									</div>
									{isEditing && (
										<>
											<Input
												id="image-upload"
												type="file"
												accept="image/*"
												className="hidden"
												onChange={handleImageChange}
												disabled={isUploadingImage}
											/>
											{isUploadingImage && (
												<p className="mt-2 animate-pulse text-xs font-bold text-primary">
													Уншиж байна...
												</p>
											)}
										</>
									)}
								</div>

								{/* Name + email */}
								<div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
									<h2 className="break-words text-2xl font-black tracking-tight text-foreground sm:text-3xl">
										{user.username}
									</h2>
									<p className="break-all text-sm font-semibold text-muted-foreground">
										{user.email}
									</p>
								</div>

								{/* Actions */}
								<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:pb-1">
									<Button
										type="button"
										onClick={() => {
											setIsEditing(!isEditing);
											setPasswordError("");
											setPhoneError("");
										}}
										variant={isEditing ? "outline" : "default"}
										className="w-full sm:w-auto"
									>
										<Edit2 className="size-4" strokeWidth={2.5} />
										{isEditing ? "Буцах" : "Засах"}
									</Button>

									{isEditing && (
										<Button
											type="submit"
											variant="success"
											disabled={updateMutation.isPending}
											className="w-full sm:w-auto"
										>
											{updateMutation.isPending ? (
												<>
													<div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
													Хадгалж байна...
												</>
											) : (
												<>
													<Check className="size-4" strokeWidth={2.75} />
													Хадгалах
												</>
											)}
										</Button>
									)}
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						{/* ── Left Column ── */}
						<div className="lg:col-span-1">
							<div className="card-pop space-y-3 p-5 sm:p-6">
								<InfoTile tone="violet" icon={<User2 strokeWidth={2.5} />} label="Нэр">
									{user.lastname} {user.firstname}
								</InfoTile>
								<InfoTile tone="mint" icon={<Mail strokeWidth={2.5} />} label="Имэйл">
									<span className="break-all">{user.email}</span>
								</InfoTile>
								{user.Phone && (
									<InfoTile tone="sky" icon={<Phone strokeWidth={2.5} />} label="Утас">
										{user.Phone}
									</InfoTile>
								)}
							</div>
						</div>

						{/* ── Right Column ── */}
						<div className="lg:col-span-2">
							{isEditing && (
								<div className="space-y-6">
									{/* Card 1: Утас + Нууц үг */}
									<div className="card-pop p-5 sm:p-6">
										<SectionTitle tone="coral" icon={<Lock strokeWidth={2.5} />} title="Утас ба нууц үг" />
										<div className="space-y-4">
											<div
												className={`flex items-start gap-3 rounded-2xl p-4 ${phoneError ? "bg-destructive/10" : "bg-muted"}`}
											>
												<IconChip tone={phoneError ? "coral" : "sky"}>
													<Phone strokeWidth={2.5} />
												</IconChip>
												<div className="min-w-0 flex-1">
													<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
														Утасны дугаар{" "}
														<span className="text-destructive">*</span>
													</p>
													<p className="mt-0.5 text-xs font-semibold text-muted-foreground">
														Одоо ашиглаж байгаа утасны дугаараа оруулна уу.
														Энэ дугаараар нууц үг сэргээх боломжтой
													</p>
													<Input
														type="tel"
														value={editForm.Phone}
														onChange={(e) => {
															setEditForm({
																...editForm,
																Phone: e.target.value,
															});
															setPhoneError("");
														}}
														className={`mt-2 h-10 bg-card text-sm font-bold ${
															phoneError
																? "border-destructive focus-visible:border-destructive"
																: ""
														}`}
														placeholder="Утасны дугаар"
													/>
													{phoneError && (
														<p className="mt-1.5 text-xs font-bold text-destructive">
															{phoneError}
														</p>
													)}
												</div>
											</div>

											<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
												<div className="flex items-start gap-3 rounded-2xl bg-muted p-4">
													<IconChip tone="coral">
														<Lock strokeWidth={2.5} />
													</IconChip>
													<div className="min-w-0 flex-1">
														<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
															Нууц үг
														</p>
														<Input
															type="password"
															value={editForm.password}
															autoComplete="new-password"
															onChange={(e) => {
																setEditForm({
																	...editForm,
																	password: e.target.value,
																});
																setPasswordError("");
															}}
															className="mt-2 h-10 bg-card text-sm font-bold"
															placeholder="Шинэ нууц үг"
														/>
													</div>
												</div>

												<div className="flex items-start gap-3 rounded-2xl bg-muted p-4">
													<IconChip tone="pink">
														<Lock strokeWidth={2.5} />
													</IconChip>
													<div className="min-w-0 flex-1">
														<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
															Нууц үг давтах
														</p>
														<Input
															type="password"
															value={editForm.confirmPassword}
															autoComplete="new-password"
															onChange={(e) => {
																setEditForm({
																	...editForm,
																	confirmPassword: e.target.value,
																});
																setPasswordError("");
															}}
															className="mt-2 h-10 bg-card text-sm font-bold"
															placeholder="Нууц үг давтах"
														/>
														{passwordError && (
															<p className="mt-1.5 text-xs font-bold text-destructive">
																{passwordError}
															</p>
														)}
													</div>
												</div>
											</div>
										</div>
									</div>

									{/* Card 2: Байршил мэдээлэл */}
									<div className="card-pop p-5 sm:p-6">
										<SectionTitle tone="mint" icon={<MapPin strokeWidth={2.5} />} title="Байршил мэдээлэл" />
										<div className="mb-5 flex items-start gap-3 rounded-2xl bg-pop-sun-soft p-3.5 text-pop-sun-ink">
											<span aria-hidden className="text-lg leading-none">💡</span>
											<p className="text-xs font-semibold leading-relaxed">
												Та өөрийн мэдээлэлээ үнэн зөв оруулсан үед таны шалгалт
												идэвхтэй харагдах тул{" "}
												<span className="font-black">заавал оруулна уу</span>
											</p>
										</div>

										{/* locationError харуулах */}
										{locationError && (
											<div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
												<AlertCircle className="size-4 shrink-0" />
												{locationError}
											</div>
										)}

										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<SelectField
												label="Аймаг / Нийслэл"
												placeholder={
													aimagLoading ? "Уншиж байна..." : "— Аймаг сонгох —"
												}
												options={aimagList
													.filter((a) => a.mID)
													.map((a) => ({
														value: a.mID.toString(),
														label: a.mName,
													}))}
												value={selectedAimag}
												onValueChange={onAimag}
												disabled={false}
												loading={aimagLoading}
												icon={
													<MapPin className="text-pop-mint-ink" strokeWidth={2.5} />
												}
											/>
											<SelectField
												label="Сум / Дүүрэг"
												placeholder={
													districtLoading
														? "Уншиж байна..."
														: !selectedAimag
															? "Эхлээд аймаг сонгоно уу"
															: "— Дүүрэг сонгох —"
												}
												options={districtList
													.filter((d) => d.id)
													.map((d) => ({
														value: d.id.toString(),
														label: d.name,
													}))}
												value={selectedDistrict}
												onValueChange={onDistrict}
												disabled={!selectedAimag}
												loading={districtLoading}
												icon={
													<MapPin className="text-pop-sky-ink" strokeWidth={2.5} />
												}
											/>
											<SelectField
												label="Сургууль"
												placeholder={
													schoolLoading
														? "Уншиж байна..."
														: !selectedDistrict
															? "Эхлээд дүүрэг сонгоно уу"
															: "— Сургууль сонгох —"
												}
												options={schoolList
													.filter((s) => s.sName && s.sName !== "Сонгоно уу")
													.map((s) => ({ value: s.sName, label: s.sName }))}
												value={selectedSchool}
												onValueChange={onSchool}
												disabled={!selectedDistrict}
												loading={schoolLoading}
												icon={
													<School className="text-pop-violet-ink" strokeWidth={2.5} />
												}
											/>
											{!isTeacher && (
												<SelectField
													label="Анги / Бүлэг"
													placeholder={
														classLoading
															? "Уншиж байна..."
															: !selectedSchool
																? "Эхлээд сургууль сонгоно уу"
																: "— Анги сонгох —"
													}
													options={classList.map((c) => ({
														value: c.studentgroupid,
														label: c.class_name,
													}))}
													value={selectedClass}
													onValueChange={setSelectedClass}
													disabled={!selectedSchool}
													loading={classLoading}
													icon={
														<School className="text-pop-pink-ink" strokeWidth={2.5} />
													}
												/>
											)}
										</div>
									</div>
								</div>
							)}

							{/* View Mode */}
							{!isEditing && (
								<div className="space-y-6">
									<div className="card-pop p-5 sm:p-6">
										<SectionTitle tone="violet" icon={<User2 strokeWidth={2.5} />} title="Хувийн мэдээлэл" />
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
											<InfoTile tone="violet" icon={<User2 strokeWidth={2.5} />} label="Овог">
												{user.lastname}
											</InfoTile>
											<InfoTile tone="pink" icon={<User2 strokeWidth={2.5} />} label="Нэр">
												{user.firstname}
											</InfoTile>
											<InfoTile tone="mint" icon={<Mail strokeWidth={2.5} />} label="Имэйл">
												<span className="break-all">{user.email}</span>
											</InfoTile>
											{user.Phone && (
												<InfoTile tone="sky" icon={<Phone strokeWidth={2.5} />} label="Утас">
													{user.Phone}
												</InfoTile>
											)}
										</div>
									</div>

									<div className="card-pop p-5 sm:p-6">
										<SectionTitle tone="mint" icon={<MapPin strokeWidth={2.5} />} title="Байршил мэдээлэл" />
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
											<InfoTile tone="mint" icon={<MapPin strokeWidth={2.5} />} label="Аймаг/Нийслэл">
												{user.aimag_name || (
													<span className="font-semibold text-muted-foreground">
														—
													</span>
												)}
											</InfoTile>
											<InfoTile tone="sky" icon={<MapPin strokeWidth={2.5} />} label="Сум/Дүүрэг">
												{user.sym_name || (
													<span className="font-semibold text-muted-foreground">
														—
													</span>
												)}
											</InfoTile>
											<InfoTile tone="violet" icon={<School strokeWidth={2.5} />} label="Сургууль">
												{user.sch_name || (
													<span className="font-semibold text-muted-foreground">
														—
													</span>
												)}
											</InfoTile>
											{!isTeacher && (
												<InfoTile tone="sun" icon={<School strokeWidth={2.5} />} label="Анги">
													{user.studentgroupname || (
														<span className="font-semibold text-muted-foreground">
															—
														</span>
													)}
												</InfoTile>
											)}
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</form>

				{updateMutation.isError && (
					<div className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4">
						<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive text-white">
							<AlertCircle className="size-5" strokeWidth={2.5} />
						</span>
						<div>
							<p className="text-sm font-black text-destructive">
								Алдаа гарлаа
							</p>
							<p className="mt-1 text-xs font-semibold text-destructive">
								{(updateMutation.error as Error).message}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
