import { Camera, Check, Edit2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserData } from "../_lib/types";

function getInitials(name: string) {
	if (!name) return "??";
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

interface ProfileHeaderCardProps {
	user: UserData;
	isEditing: boolean;
	imagePreview: string;
	hasSelectedImage: boolean;
	isUploadingImage: boolean;
	onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onCancelImage: () => void;
	onToggleEdit: () => void;
	isSaving: boolean;
}

/** Толгой карт: баннер, аватар (зураг солих), нэр, засах/хадгалах товч. */
export function ProfileHeaderCard({
	user,
	isEditing,
	imagePreview,
	hasSelectedImage,
	isUploadingImage,
	onImageChange,
	onCancelImage,
	onToggleEdit,
	isSaving,
}: ProfileHeaderCardProps) {
	return (
		<div className="card-pop overflow-hidden animate-pop-in">
			{/* Colorful banner */}
			<div className="relative h-28 overflow-hidden bg-[linear-gradient(135deg,var(--pop-sky-soft),var(--pop-violet-soft))] sm:h-36">
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
										className="absolute bottom-1 right-1 flex size-10 cursor-pointer items-center justify-center rounded-full border-[3px] border-card bg-primary-soft text-primary-soft-foreground shadow-[0_3px_0_0_var(--primary-soft-shade)] transition-all hover:scale-110"
									>
										<Camera className="size-5" strokeWidth={2.5} />
									</label>
									{hasSelectedImage && (
										<button
											type="button"
											onClick={onCancelImage}
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
									onChange={onImageChange}
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
							onClick={onToggleEdit}
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
								disabled={isSaving}
								className="w-full sm:w-auto"
							>
								{isSaving ? (
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
	);
}
