"use client";

import { useEffect, useRef, useState } from "react";
import { LocationFields } from "./_components/LocationFields";
import { ProfileHeaderCard } from "./_components/ProfileHeaderCard";
import { ProfileSidebar } from "./_components/ProfileSidebar";
import { ProfileToast } from "./_components/ProfileToast";
import { ProfileViewSections } from "./_components/ProfileViewSections";
import { SecurityFields } from "./_components/SecurityFields";
import { UpdateErrorBanner } from "./_components/UpdateErrorBanner";
import { useLocationCascade } from "./_hooks/useLocationCascade";
import { useProfileImage } from "./_hooks/useProfileImage";
import { useUpdateProfile } from "./_hooks/useUpdateProfile";
import type { EditFormState, UserData } from "./_lib/types";

interface ProfileContentProps {
	user: UserData;
	userId: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProfileContent({ user, userId }: ProfileContentProps) {
	const isTeacher = user.ugroup === 3 || user.ugroup === 4;
	const [showToast, setShowToast] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [phoneError, setPhoneError] = useState("");
	const [locationError, setLocationError] = useState("");
	const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Unmount үед toast timer-ийг цэвэрлэнэ
	useEffect(
		() => () => {
			if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		},
		[],
	);

	const {
		selectedImage,
		imagePreview,
		isUploadingImage,
		uploadedImageUrl,
		handleImageChange,
		resetImage,
		cancelImage,
	} = useProfileImage();

	const [editForm, setEditForm] = useState<EditFormState>({
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

	// Байршлын сонголт (аймаг → дүүрэг → сургууль → анги) + prefill
	const cascade = useLocationCascade(isEditing, user);
	const {
		selectedAimagItem,
		selectedDistrict,
		selectedSchool,
		selectedClass,
		schoolDb,
		districtList,
		classList,
	} = cascade;

	// ─── Edit горим ──────────────────────────────────────────────────────────
	useEffect(() => {
		if (!isEditing) {
			setEditForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
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
	}, [isEditing]);

	// ─── Mutation ─────────────────────────────────────────────────────────────
	const updateMutation = useUpdateProfile(userId, () => {
		setShowToast(true);
		if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
		resetImage();
		setIsEditing(false);
	});

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

		const aimagName = selectedAimagItem?.mName ?? "";
		const submitAimagId = selectedAimagItem?.mID ?? 0;
		if (!aimagName || submitAimagId === 0) {
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
			aimag_id: submitAimagId,
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

	const handleCancelImage = () => cancelImage(user.img_url || "");
	const handleToggleEdit = () => {
		setIsEditing(!isEditing);
		setPasswordError("");
		setPhoneError("");
	};

	return (
		<div className="w-full">
			{showToast && <ProfileToast onClose={() => setShowToast(false)} />}

			<div className="w-full">
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* ── Header card ── */}
					<ProfileHeaderCard
						user={user}
						isEditing={isEditing}
						imagePreview={imagePreview}
						hasSelectedImage={!!selectedImage}
						isUploadingImage={isUploadingImage}
						onImageChange={handleImageChange}
						onCancelImage={handleCancelImage}
						onToggleEdit={handleToggleEdit}
						isSaving={updateMutation.isPending}
					/>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						{/* ── Left Column ── */}
						<ProfileSidebar user={user} />

						{/* ── Right Column ── */}
						<div className="lg:col-span-2">
							{isEditing && (
								<div className="space-y-6">
									<SecurityFields
										editForm={editForm}
										setEditForm={setEditForm}
										phoneError={phoneError}
										setPhoneError={setPhoneError}
										passwordError={passwordError}
										setPasswordError={setPasswordError}
									/>
									<LocationFields
										cascade={cascade}
										locationError={locationError}
										isTeacher={isTeacher}
									/>
								</div>
							)}

							{/* View Mode */}
							{!isEditing && (
								<ProfileViewSections user={user} isTeacher={isTeacher} />
							)}
						</div>
					</div>
				</form>

				{updateMutation.isError && (
					<UpdateErrorBanner
						message={(updateMutation.error as Error).message}
					/>
				)}
			</div>
		</div>
	);
}
