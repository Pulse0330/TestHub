import { motion } from "framer-motion";
import { Check, Clock, Trash2 } from "lucide-react";
import Image from "next/image";
import { memo, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Course {
	palnid: number;
	title: string;
	expired: string;
	amount: number;
	ispay: number;
	filename: string;
	ispurchased: number;
	bill_type: number;
}

interface CourseCardProps {
	course: Course;
	isSelected?: boolean;
	/** Called with the course's palnid when toggled */
	onSelect?: (planid: number) => void;
	/** Only relevant for purchased courses */
	onView?: () => void;
	onExtend?: () => void;
	disabled?: boolean;
	/** "shelf" = compact card for the purchased-courses shelf */
	variant?: "catalog" | "shelf";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUR_PLACEHOLDER =
	"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

const EXPIRY_WARN_DAYS = 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONGOLIAN_MONTHS = [
	"1-р сар",
	"2-р сар",
	"3-р сар",
	"4-р сар",
	"5-р сар",
	"6-р сар",
	"7-р сар",
	"8-р сар",
	"9-р сар",
	"10-р сар",
	"11-р сар",
	"12-р сар",
];

function formatMongolianDate(date: Date): string {
	return `${date.getFullYear()} оны ${MONGOLIAN_MONTHS[date.getMonth()]}-ын ${date.getDate()}`;
}

type ExpiryInfo = {
	diffDays: number;
	isExpired: boolean;
	isExpiringSoon: boolean;
	expiryDate: string;
};

function computeExpiryInfo(expired: string): ExpiryInfo {
	const expiryDate = new Date(expired);
	const diffTime = expiryDate.getTime() - Date.now();
	const diffDays = Math.ceil(diffTime / 86_400_000); // ms per day

	return {
		diffDays: Math.abs(diffDays),
		isExpired: diffDays < 0,
		isExpiringSoon: diffDays >= 0 && diffDays <= EXPIRY_WARN_DAYS,
		expiryDate: formatMongolianDate(expiryDate),
	};
}

// ─── Component ────────────────────────────────────────────────────────────────

function CourseCard({
	course,
	isSelected = false,
	onSelect,
	onExtend,
	disabled = false,
	variant = "catalog",
}: CourseCardProps) {
	const isPurchased = course.ispurchased === 1;
	const isSelectable = !isPurchased && !disabled;

	// Stable handler — identity changes only when palnid or disabled changes
	const handleClick = useCallback(() => {
		if (isSelectable) onSelect?.(course.palnid);
	}, [isSelectable, onSelect, course.palnid]);

	const handleExtend = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onExtend?.();
		},
		[onExtend],
	);

	const handleDeselect = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onSelect?.(course.palnid);
		},
		[onSelect, course.palnid],
	);

	// Only compute expiry for purchased courses
	const expiryInfo = useMemo<ExpiryInfo | null>(
		() => (isPurchased ? computeExpiryInfo(course.expired) : null),
		[isPurchased, course.expired],
	);

	const showExtendButton =
		isPurchased && (expiryInfo?.isExpired || expiryInfo?.isExpiringSoon);

	const isShelf = variant === "shelf";

	return (
		<motion.div
			onClick={handleClick}
			className={cn(
				"relative h-full",
				isSelectable ? "cursor-pointer" : "cursor-default",
			)}
		>
			<div
				className={cn(
					"group card-pop relative h-full flex flex-col overflow-hidden rounded-3xl transition-all duration-200",
					isSelected &&
						"border-pop-coral bg-pop-coral-soft/40 shadow-[0_4px_0_0_var(--pop-coral)]",
					isSelectable &&
						!isSelected &&
						"hover:-translate-y-1 hover:border-pop-coral/60 hover:shadow-[0_7px_0_0_var(--border)]",
				)}
			>
				{/* ── Image ── */}
				<div
					className={cn(
						"relative m-2 mb-0 overflow-hidden rounded-2xl bg-pop-coral-soft",
						isShelf ? "aspect-16/9" : "aspect-4/2",
					)}
				>
					<Image
						src={course.filename}
						alt={course.title}
						fill
						loading="lazy"
						placeholder="blur"
						blurDataURL={BLUR_PLACEHOLDER}
						className="object-cover transition-transform duration-500 group-hover:scale-105"
					/>

					{/* Purchased check */}
					{isPurchased && (
						<StatusBadge color="green">
							<Check className="size-4 text-primary-foreground" strokeWidth={3} />
						</StatusBadge>
					)}

					{/* Selected check */}
					{isSelected && !isPurchased && (
						<StatusBadge color="blue">
							<Check className="size-4 text-primary-foreground" strokeWidth={3} />
						</StatusBadge>
					)}

					{/* Max-selection overlay */}
					{disabled && (
						<Overlay>
							<Badge variant="secondary" className="text-[10px] font-extrabold">
								Дээд тал нь 4
							</Badge>
						</Overlay>
					)}

					{/* Expired overlay */}
					{expiryInfo?.isExpired && (
						<Overlay>
							<Clock className="size-5 text-destructive mb-1" strokeWidth={2.5} />
							<Badge variant="destructive" className="text-[10px] font-extrabold">
								Дууссан
							</Badge>
						</Overlay>
					)}
				</div>

				{/* ── Info ── */}
				<div className="flex flex-1 flex-col p-3 sm:p-4">
					<h3 className="text-sm sm:text-base font-extrabold mb-2 line-clamp-2 leading-snug min-h-10 text-foreground">
						{course.title}
					</h3>

					{isPurchased && expiryInfo && !expiryInfo.isExpired && (
						<div
							className={cn(
								"mb-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
								expiryInfo.isExpiringSoon
									? "bg-pop-sun-soft text-pop-sun-ink"
									: "bg-pop-mint-soft text-pop-mint-ink",
							)}
						>
							<Clock className="size-3" strokeWidth={2.5} />
							<span className="font-bold">
								{expiryInfo.diffDays} хоног үлдлээ
							</span>
						</div>
					)}

					<div className="mt-auto flex items-center justify-between gap-2">
						{showExtendButton ? (
							<Button
								size="sm"
								onClick={handleExtend}
								className="w-full gap-1 bg-pop-coral text-primary-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-coral)_60%,black)]"
							>
								Сунгах
							</Button>
						) : isSelected ? (
							<Button
								size="sm"
								variant="destructive"
								onClick={handleDeselect}
								className="w-full gap-1"
							>
								<Trash2 className="size-3.5" strokeWidth={2.5} />
								Хасах
							</Button>
						) : !isPurchased ? (
							<Button
								size="sm"
								onClick={handleClick}
								className="w-full"
								disabled={disabled}
							>
								Сонгох
							</Button>
						) : null}
					</div>
				</div>
			</div>
		</motion.div>
	);
}

// ─── Small internal primitives ────────────────────────────────────────────────

function StatusBadge({
	color,
	children,
}: {
	color: "green" | "blue";
	children: React.ReactNode;
}) {
	return (
		<div className="absolute top-1.5 right-1.5 z-20">
			<div
				className={cn(
					"flex items-center justify-center size-7 rounded-xl border-2 border-card animate-pop-in",
					color === "green" ? "bg-success" : "bg-pop-coral",
				)}
			>
				{children}
			</div>
		</div>
	);
}

function Overlay({ children }: { children: React.ReactNode }) {
	return (
		<div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-20">
			{children}
		</div>
	);
}

// Wrap in React.memo so parent re-renders don't cascade unless props change
export default memo(CourseCard);
