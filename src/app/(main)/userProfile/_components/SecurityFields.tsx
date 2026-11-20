import { Lock, Phone } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import type { EditFormState } from "../_lib/types";
import { IconChip, SectionTitle } from "./ui";

interface SecurityFieldsProps {
	editForm: EditFormState;
	setEditForm: Dispatch<SetStateAction<EditFormState>>;
	phoneError: string;
	setPhoneError: Dispatch<SetStateAction<string>>;
	passwordError: string;
	setPasswordError: Dispatch<SetStateAction<string>>;
}

/** Card 1: Утас + Нууц үг */
export function SecurityFields({
	editForm,
	setEditForm,
	phoneError,
	setPhoneError,
	passwordError,
	setPasswordError,
}: SecurityFieldsProps) {
	return (
		<div className="card-pop p-5 sm:p-6">
			<SectionTitle
				tone="coral"
				icon={<Lock strokeWidth={2.5} />}
				title="Утас ба нууц үг"
			/>
			<div className="space-y-4">
				<div
					className={`flex items-start gap-3 rounded-2xl p-4 ${phoneError ? "bg-destructive/10" : "bg-muted"}`}
				>
					<IconChip tone={phoneError ? "coral" : "sky"}>
						<Phone strokeWidth={2.5} />
					</IconChip>
					<div className="min-w-0 flex-1">
						<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
							Утасны дугаар <span className="text-destructive">*</span>
						</p>
						<p className="mt-0.5 text-xs font-semibold text-muted-foreground">
							Одоо ашиглаж байгаа утасны дугаараа оруулна уу. Энэ дугаараар нууц
							үг сэргээх боломжтой
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
	);
}
