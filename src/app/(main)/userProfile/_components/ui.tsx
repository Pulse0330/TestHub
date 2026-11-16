import { Loader2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";

// ─── Visual helpers ───────────────────────────────────────────────────────────
export type Tone = "violet" | "sky" | "mint" | "sun" | "coral" | "pink";
const TONE_CHIP: Record<Tone, string> = {
	violet: "bg-pop-violet-soft text-pop-violet-ink",
	sky: "bg-pop-sky-soft text-pop-sky-ink",
	mint: "bg-pop-mint-soft text-pop-mint-ink",
	sun: "bg-pop-sun-soft text-pop-sun-ink",
	coral: "bg-pop-coral-soft text-pop-coral-ink",
	pink: "bg-pop-pink-soft text-pop-pink-ink",
};

export function IconChip({
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

export function SectionTitle({
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
export function SelectField({
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
					{loading && <Loader2 className="size-3 animate-spin text-primary" />}
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

export function InfoTile({
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
		<div
			className={`flex items-start gap-3 rounded-2xl bg-muted p-4 ${className}`}
		>
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
