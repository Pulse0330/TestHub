import { AlertCircle, MapPin, School } from "lucide-react";
import type { LocationCascade } from "../_hooks/useLocationCascade";
import { SectionTitle, SelectField } from "./ui";

interface LocationFieldsProps {
	cascade: LocationCascade;
	locationError: string;
	isTeacher: boolean;
}

/** Card 2: Байршил мэдээлэл (аймаг → дүүрэг → сургууль → анги). */
export function LocationFields({
	cascade,
	locationError,
	isTeacher,
}: LocationFieldsProps) {
	const {
		selectedAimag,
		selectedDistrict,
		selectedSchool,
		selectedClass,
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
	} = cascade;
	return (
		<div className="card-pop p-5 sm:p-6">
			<SectionTitle
				tone="mint"
				icon={<MapPin strokeWidth={2.5} />}
				title="Байршил мэдээлэл"
			/>
			<div className="mb-5 flex items-start gap-3 rounded-2xl bg-pop-sun-soft p-3.5 text-pop-sun-ink">
				<span aria-hidden className="text-lg leading-none">
					💡
				</span>
				<p className="text-xs font-semibold leading-relaxed">
					Та өөрийн мэдээлэлээ үнэн зөв оруулсан үед таны шалгалт идэвхтэй
					харагдах тул <span className="font-black">заавал оруулна уу</span>
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
					placeholder={aimagLoading ? "Уншиж байна..." : "— Аймаг сонгох —"}
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
					icon={<MapPin className="text-pop-mint-ink" strokeWidth={2.5} />}
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
					icon={<MapPin className="text-pop-sky-ink" strokeWidth={2.5} />}
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
					icon={<School className="text-pop-violet-ink" strokeWidth={2.5} />}
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
						onValueChange={onClass}
						disabled={!selectedSchool}
						loading={classLoading}
						icon={<School className="text-pop-pink-ink" strokeWidth={2.5} />}
					/>
				)}
			</div>
		</div>
	);
}
