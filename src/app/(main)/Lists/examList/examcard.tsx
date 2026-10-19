"use client";

import { motion } from "framer-motion";
import {
	ArrowRight,
	BookOpen,
	CalendarClock,
	CalendarX,
	ChevronRight,
	Clock,
	CreditCard,
	FileText,
	Hourglass,
	Info,
	Lock,
	Play,
	Timer,
	Unlock,
	User,
	Wallet,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import ExamRulesDialog from "@/components/examRuleDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { ExamlistsData } from "@/types/exam/examList";

export type ExamCardVariant = "featured" | "compact" | "row";

interface ExamCardProps {
	exam: ExamlistsData;
	isPaid: boolean;
	isExpired: boolean;
	onPayClick?: () => void;
	isCreatingInvoice?: boolean;
	/** Layout variant. featured = active, compact = upcoming, row = finished */
	variant?: ExamCardVariant;
	/** Server-synced current time (for countdowns) */
	now?: Date | null;
}
const formatDate = (dateStr: string) => {
	const cleaned = dateStr.replace("T", " ").replace("Z", "").split(".")[0];
	return cleaned.slice(0, 16); // "2026-03-12 17:23"
};

/**
 * Parses a backend date as a wall-clock time (same convention as
 * useServerTime, which parses the server ISO string directly as UTC).
 */
export const parseExamDate = (dateStr?: string | null): number | null => {
	if (!dateStr) return null;
	const m = dateStr.match(
		/(\d{4})[-./](\d{1,2})[-./](\d{1,2})[ T]?(\d{1,2})?:?(\d{2})?:?(\d{2})?/,
	);
	if (m) {
		return Date.UTC(
			Number(m[1]),
			Number(m[2]) - 1,
			Number(m[3]),
			Number(m[4] ?? 0),
			Number(m[5] ?? 0),
			Number(m[6] ?? 0),
		);
	}
	const t = Date.parse(dateStr);
	return Number.isNaN(t) ? null : t;
};

const MN_MONTHS = [
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
] as const;

const dateParts = (dateStr: string) => {
	const t = parseExamDate(dateStr);
	if (t === null) return null;
	const d = new Date(t);
	return {
		month: MN_MONTHS[d.getUTCMonth()],
		day: d.getUTCDate(),
		time: `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
	};
};

/** "2 өдөр 3 цаг" / "3 цаг 12 мин" / "12:05" */
export const formatRemaining = (ms: number) => {
	if (ms <= 0) return "0 мин";
	const totalSec = Math.floor(ms / 1000);
	const days = Math.floor(totalSec / 86400);
	const hours = Math.floor((totalSec % 86400) / 3600);
	const mins = Math.floor((totalSec % 3600) / 60);
	const secs = totalSec % 60;
	if (days > 0) return `${days} өдөр ${hours} цаг`;
	if (hours > 0) return `${hours} цаг ${mins} мин`;
	return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// flag: 0 = Эхлээгүй (sky), 1 = Идэвхтэй (mint), 2+ = Дууссан (muted)
const getFlagConfig = (flag: number) => {
	switch (flag) {
		case 1:
			return {
				label: "Идэвхтэй",
				Icon: Zap,
				badgeVariant: "mint" as const,
				banner: "bg-pop-mint-soft text-pop-mint-ink",
				titleHover: "group-hover:text-pop-mint-ink",
			};
		case 0:
			return {
				label: "Эхлээгүй",
				Icon: Timer,
				badgeVariant: "sky" as const,
				banner: "bg-pop-sky-soft text-pop-sky-ink",
				titleHover: "group-hover:text-pop-sky-ink",
			};
		default:
			return {
				label: "Та энэ шалгалтанд оролцоогүй байна",
				Icon: Clock,
				badgeVariant: "secondary" as const,
				banner: "bg-muted text-muted-foreground",
				titleHover: "group-hover:text-foreground",
			};
	}
};

export default function ExamCard({
	exam,
	isPaid,
	isExpired,
	onPayClick,
	isCreatingInvoice,
	variant = "featured",
	now,
}: ExamCardProps) {
	const canTakeExam = !isPaid && !isExpired && exam.flag === 1;
	const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
	const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const payRequestedRef = useRef(false);
	const router = useRouter();
	const isMobile = useIsMobile();

	const flagConfig = getFlagConfig(exam.flag);
	const isPurchased = exam.ispurchased === 1;
	const isLocked = isPaid && !isPurchased;
	const showPayButton = isPaid && !isExpired && !isPurchased;

	// Close the detail sheet once the QPay invoice request finishes
	useEffect(() => {
		if (!isCreatingInvoice && payRequestedRef.current) {
			payRequestedRef.current = false;
			setSheetOpen(false);
		}
	}, [isCreatingInvoice]);

	const handleRulesConfirm = () => {
		if (selectedExamId) {
			router.replace(`/exam/${selectedExamId}`);
		}
	};

	const handleCardClick = () => {
		if (canTakeExam) {
			setSelectedExamId(exam.exam_id);
			setRulesDialogOpen(true);
		}
	};

	const handleStartFromSheet = () => {
		setSheetOpen(false);
		handleCardClick();
	};

	const handlePayFromSheet = () => {
		payRequestedRef.current = true;
		onPayClick?.();
	};

	// Time helpers
	const nowMs = now ? now.getTime() : null;
	const startMs = parseExamDate(exam.ognoo);
	const endMs = parseExamDate(exam.enddate);
	const endsIn =
		nowMs !== null && endMs !== null && endMs > nowMs ? endMs - nowMs : null;
	const startsIn =
		nowMs !== null && startMs !== null && startMs > nowMs
			? startMs - nowMs
			: null;
	const start = dateParts(exam.ognoo);
	const end = dateParts(exam.enddate);

	const statusBadge = isLocked ? (
		<Badge variant="sun" className="border-2 border-pop-sun/40 bg-card">
			<Lock />
			Төлбөртэй
		</Badge>
	) : isPurchased ? (
		<Badge variant="mint" className="border-2 border-pop-mint/40 bg-card">
			<Unlock />
			Төлөгдсөн
		</Badge>
	) : (
		<Badge
			variant={flagConfig.badgeVariant}
			className="max-w-full whitespace-normal border-2 bg-card text-left"
		>
			<flagConfig.Icon />
			{flagConfig.label}
		</Badge>
	);

	const openSheet = () => setSheetOpen(true);

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className="h-full"
		>
			{variant === "featured" && (
				<button
					type="button"
					onClick={openSheet}
					aria-label={`${exam.title} шалгалт`}
					className={cn(
						"card-pop lift group relative flex h-full w-full cursor-pointer flex-col gap-4 overflow-hidden p-5 text-left",
						isLocked && "border-pop-sun",
					)}
				>
					{/* Top: status + icon */}
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0 space-y-2">
							{statusBadge}
							<p className="line-clamp-1 text-xs font-bold uppercase tracking-wide text-primary">
								{exam.lesson_name}
							</p>
						</div>
						<div
							className={cn(
								"flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6",
								isLocked
									? "bg-pop-sun text-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-sun)_60%,black)]"
									: "bg-pop-mint text-primary-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-mint)_60%,black)]",
							)}
						>
							{isLocked ? (
								<Lock className="size-6" strokeWidth={2.5} />
							) : (
								<FileText className="size-6" strokeWidth={2.5} />
							)}
						</div>
					</div>

					<h3 className="break-words text-lg font-black leading-snug text-foreground sm:text-xl">
						{exam.title}
					</h3>

					{/* Countdown / end time */}
					<div
						className={cn(
							"flex items-center gap-3 rounded-2xl p-3",
							isLocked
								? "bg-pop-sun-soft text-pop-sun-ink"
								: "bg-pop-mint-soft text-pop-mint-ink",
						)}
					>
						<Hourglass className="size-5 shrink-0" strokeWidth={2.5} />
						<div className="min-w-0 flex-1">
							<p className="text-[11px] font-extrabold uppercase tracking-wide opacity-80">
								{endsIn !== null ? "Дуусахад үлдсэн" : "Дуусах огноо"}
							</p>
							<p className="truncate text-lg font-black tabular-nums">
								{endsIn !== null
									? formatRemaining(endsIn)
									: formatDate(exam.enddate)}
							</p>
						</div>
						{endsIn !== null && (
							<p className="shrink-0 text-right text-xs font-bold opacity-80">
								{end ? `${end.month} ${end.day}` : ""}
								<br />
								{end?.time}
							</p>
						)}
					</div>

					{/* Meta chips */}
					<div className="flex flex-wrap items-center gap-1.5 text-xs">
						<span className="inline-flex items-center gap-1 rounded-full bg-pop-sky-soft px-2.5 py-1 font-bold text-pop-sky-ink">
							<Clock className="size-3.5" />
							{exam.exam_minute} минут
						</span>
						<span className="inline-flex items-center gap-1 rounded-full bg-pop-violet-soft px-2.5 py-1 font-bold text-pop-violet-ink">
							<FileText className="size-3.5" />
							{exam.que_cnt} асуулт
						</span>
						<span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-pop-pink-soft px-2.5 py-1 font-bold text-pop-pink-ink">
							<User className="size-3.5 shrink-0" />
							<span className="truncate">{exam.teach_name}</span>
						</span>
					</div>

					{/* CTA hint */}
					<span
						className={cn(
							"mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all",
							isLocked
								? "bg-pop-sun text-foreground shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_65%,black)]"
								: "bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--primary-shade)]",
						)}
					>
						{isLocked ? (
							<>
								<CreditCard className="size-4" />
								Төлбөр төлөх
							</>
						) : canTakeExam ? (
							<>
								<Play className="size-4" />
								Шалгалт өгөх
							</>
						) : (
							<>
								Дэлгэрэнгүй
								<ArrowRight className="size-4" />
							</>
						)}
					</span>
				</button>
			)}

			{variant === "compact" && (
				<button
					type="button"
					onClick={openSheet}
					aria-label={`${exam.title} шалгалт`}
					className={cn(
						"card-pop lift group flex h-full w-full cursor-pointer items-stretch gap-3 overflow-hidden p-3 text-left",
						isLocked && "border-pop-sun",
					)}
				>
					{/* Start date tile */}
					<div
						className={cn(
							"flex w-16 shrink-0 flex-col items-center justify-center rounded-2xl py-2 text-center",
							isLocked
								? "bg-pop-sun-soft text-pop-sun-ink"
								: "bg-pop-sky-soft text-pop-sky-ink",
						)}
					>
						{start ? (
							<>
								<span className="text-[10px] font-extrabold uppercase leading-none">
									{start.month}
								</span>
								<span className="text-2xl font-black leading-tight">
									{start.day}
								</span>
								<span className="text-[11px] font-bold leading-none tabular-nums">
									{start.time}
								</span>
							</>
						) : (
							<CalendarClock className="size-6" />
						)}
					</div>

					<div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
						<p className="line-clamp-1 text-[11px] font-bold uppercase tracking-wide text-primary">
							{exam.lesson_name}
						</p>
						<h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-foreground">
							{exam.title}
						</h3>
						<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold text-muted-foreground">
							<span className="inline-flex items-center gap-1">
								<Clock className="size-3" />
								{exam.exam_minute} мин
							</span>
							<span className="inline-flex items-center gap-1">
								<FileText className="size-3" />
								{exam.que_cnt} асуулт
							</span>
							{isLocked && (
								<span className="inline-flex items-center gap-1 text-pop-sun-ink">
									<Lock className="size-3" />
									Төлбөртэй
								</span>
							)}
						</div>
						{startsIn !== null && (
							<p className="text-[11px] font-extrabold text-pop-sky-ink">
								Эхлэхэд {formatRemaining(startsIn)}
							</p>
						)}
					</div>
					<ChevronRight className="size-5 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5" />
				</button>
			)}

			{variant === "row" && (
				<button
					type="button"
					onClick={openSheet}
					aria-label={`${exam.title} шалгалт`}
					className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
				>
					<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
						{isLocked ? (
							<Lock className="size-4" />
						) : (
							<FileText className="size-4" />
						)}
					</span>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-bold text-foreground/80">
							{exam.title}
						</p>
						<p className="truncate text-xs font-semibold text-muted-foreground">
							{exam.lesson_name} · {formatDate(exam.enddate)}
						</p>
					</div>
					<span className="hidden shrink-0 text-xs font-bold text-muted-foreground sm:inline">
						{exam.que_cnt} асуулт · {exam.exam_minute} мин
					</span>
					<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
				</button>
			)}

			{/* Detail sheet */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent
					side={isMobile ? "bottom" : "right"}
					className={cn(
						"gap-0 border-border p-0",
						isMobile
							? "max-h-[90dvh] rounded-t-3xl border-t-2"
							: "w-full border-l-2 sm:max-w-md",
					)}
				>
					{isMobile && (
						<div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />
					)}
					<div className="flex-1 overflow-y-auto">
						<SheetHeader className="gap-3 p-5 pb-3">
							<div
								className={cn(
									"flex items-center justify-between gap-3 rounded-2xl p-3 pr-10",
									isLocked ? "bg-pop-sun-soft text-pop-sun-ink" : flagConfig.banner,
								)}
							>
								{statusBadge}
								{isLocked ? (
									<Lock className="size-6 shrink-0" strokeWidth={2.5} />
								) : (
									<FileText className="size-6 shrink-0" strokeWidth={2.5} />
								)}
							</div>
							<p className="text-xs font-bold uppercase tracking-wide text-primary">
								{exam.lesson_name}
							</p>
							<SheetTitle className="text-xl font-black leading-snug">
								{exam.title}
							</SheetTitle>
							<SheetDescription className="sr-only">
								{exam.lesson_name} · {exam.teach_name}
							</SheetDescription>
						</SheetHeader>

						<div className="space-y-4 px-5 pb-5">
							{/* Stat tiles */}
							<div className="grid grid-cols-2 gap-2">
								<div className="rounded-2xl bg-pop-sky-soft p-3">
									<p className="text-2xl font-black text-pop-sky-ink">
										{exam.exam_minute}
									</p>
									<p className="text-[11px] font-bold uppercase tracking-wide text-pop-sky-ink/80">
										минут
									</p>
								</div>
								<div className="rounded-2xl bg-pop-violet-soft p-3">
									<p className="text-2xl font-black text-pop-violet-ink">
										{exam.que_cnt}
									</p>
									<p className="text-[11px] font-bold uppercase tracking-wide text-pop-violet-ink/80">
										асуулт
									</p>
								</div>
							</div>

							{(endsIn !== null || startsIn !== null) && (
								<div
									className={cn(
										"flex items-center gap-3 rounded-2xl p-3",
										startsIn !== null
											? "bg-pop-sky-soft text-pop-sky-ink"
											: "bg-pop-mint-soft text-pop-mint-ink",
									)}
								>
									<Hourglass className="size-5 shrink-0" strokeWidth={2.5} />
									<p className="text-sm font-extrabold">
										{startsIn !== null
											? `Эхлэхэд ${formatRemaining(startsIn)}`
											: `Дуусахад ${formatRemaining(endsIn ?? 0)}`}
									</p>
								</div>
							)}

							{/* Info rows */}
							<div className="divide-y-2 divide-border overflow-hidden rounded-2xl border-2 border-border bg-card">
								<InfoRow
									icon={<User className="size-4" />}
									tone="bg-pop-pink-soft text-pop-pink-ink"
									label="Багш"
									value={exam.teach_name}
								/>
								<InfoRow
									icon={<BookOpen className="size-4" />}
									tone="bg-primary/10 text-primary"
									label="Хичээл"
									value={exam.lesson_name}
								/>
								<InfoRow
									icon={<CalendarClock className="size-4" />}
									tone="bg-pop-mint-soft text-pop-mint-ink"
									label="Эхлэх огноо"
									value={exam.ognoo}
								/>
								<InfoRow
									icon={<CalendarX className="size-4" />}
									tone="bg-pop-coral-soft text-pop-coral-ink"
									label="Дуусах огноо"
									value={formatDate(exam.enddate)}
								/>
								<InfoRow
									icon={<Wallet className="size-4" />}
									tone="bg-pop-sun-soft text-pop-sun-ink"
									label={exam.ispaydescr || "Төлбөр"}
									value={
										isPaid
											? `${exam.amount ?? 0}₮ · ${
													exam.ispurchaseddescr ||
													(isPurchased ? "Төлөгдсөн" : "Төлөгдөөгүй")
												}`
											: exam.ispurchaseddescr || "—"
									}
								/>
								{exam.plan_name && (
									<InfoRow
										icon={<Info className="size-4" />}
										tone="bg-pop-sky-soft text-pop-sky-ink"
										label="Төлөвлөгөө"
										value={exam.plan_name}
									/>
								)}
							</div>

							{exam.help && (
								<div className="rounded-2xl border-2 border-dashed border-border bg-muted/50 p-4">
									<p className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
										<Info className="size-3.5" />
										Тайлбар
									</p>
									<p className="whitespace-pre-line text-sm font-semibold text-foreground/90">
										{exam.help}
									</p>
								</div>
							)}
						</div>
					</div>

					<SheetFooter className="border-t-2 border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
						{showPayButton && (
							<p className="text-center text-xs font-semibold text-muted-foreground">
								QPay төлбөрийн QR код үүсгэх
							</p>
						)}
						{showPayButton ? (
							<Button
								onClick={handlePayFromSheet}
								disabled={isCreatingInvoice}
								size="lg"
								className="w-full bg-pop-sun text-foreground shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_65%,black)] hover:bg-pop-sun/90 active:shadow-[0_1px_0_0_color-mix(in_oklch,var(--pop-sun)_65%,black)]"
							>
								{isCreatingInvoice ? (
									"Уншиж байна..."
								) : (
									<>
										<CreditCard className="size-4" />
										Төлбөр төлөх
									</>
								)}
							</Button>
						) : canTakeExam ? (
							<Button size="lg" className="w-full" onClick={handleStartFromSheet}>
								<Play className="size-4" />
								Шалгалт эхлүүлэх
							</Button>
						) : (
							<Button size="lg" variant="secondary" className="w-full" disabled>
								<flagConfig.Icon className="size-4" />
								{isExpired ? exam.flag_name || flagConfig.label : flagConfig.label}
							</Button>
						)}
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<ExamRulesDialog
				open={rulesDialogOpen}
				onOpenChange={setRulesDialogOpen}
				onConfirm={handleRulesConfirm}
				isMobile={false}
			/>
		</motion.div>
	);
}

function InfoRow({
	icon,
	tone,
	label,
	value,
}: {
	icon: ReactNode;
	tone: string;
	label: string;
	value: ReactNode;
}) {
	return (
		<div className="flex items-center gap-3 px-3 py-2.5">
			<span
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-xl",
					tone,
				)}
			>
				{icon}
			</span>
			<span className="shrink-0 text-xs font-bold text-muted-foreground">
				{label}
			</span>
			<span className="ml-auto min-w-0 truncate text-right text-sm font-extrabold text-foreground">
				{value}
			</span>
		</div>
	);
}
