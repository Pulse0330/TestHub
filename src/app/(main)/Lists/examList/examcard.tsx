"use client";

import { m } from "framer-motion";
import {
	ArrowRight,
	CalendarClock,
	ChevronRight,
	Clock,
	CreditCard,
	FileText,
	Hourglass,
	Lock,
	Play,
	Timer,
	Unlock,
	User,
	Zap,
} from "lucide-react";
import {
	formatExamDate as formatDate,
	formatRemaining,
	parseExamDate,
} from "@/components/ExamDetailDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExamlistsData } from "@/types/exam/examList";

export type ExamCardVariant = "featured" | "compact" | "row";

interface ExamCardProps {
	exam: ExamlistsData;
	isPaid: boolean;
	isExpired: boolean;
	/** Карт дээр дарахад — эцэг компонент дэлгэрэнгүй dialog-ийг нээнэ */
	onSelect: (exam: ExamlistsData) => void;
	/** Layout variant. featured = active, compact = upcoming, row = finished */
	variant?: ExamCardVariant;
	/** Server-synced current time (for countdowns) */
	now?: Date | null;
}

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

// flag: 0 = Эхлээгүй (sky), 1 = Идэвхтэй (mint), 2+ = Дууссан (muted)
const getFlagConfig = (flag: number) => {
	switch (flag) {
		case 1:
			return {
				label: "Идэвхтэй",
				Icon: Zap,
				badgeVariant: "mint" as const,
			};
		case 0:
			return {
				label: "Эхлээгүй",
				Icon: Timer,
				badgeVariant: "sky" as const,
			};
		default:
			return {
				label: "Та энэ шалгалтанд оролцоогүй байна",
				Icon: Clock,
				badgeVariant: "secondary" as const,
			};
	}
};

export default function ExamCard({
	exam,
	isPaid,
	isExpired,
	onSelect,
	variant = "featured",
	now,
}: ExamCardProps) {
	const canTakeExam = !isPaid && !isExpired && exam.flag === 1;
	const flagConfig = getFlagConfig(exam.flag);
	const isPurchased = exam.ispurchased === 1;
	const isLocked = isPaid && !isPurchased;

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

	const handleClick = () => onSelect(exam);

	return (
		<m.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className="h-full"
		>
			{variant === "featured" && (
				<button
					type="button"
					onClick={handleClick}
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
					onClick={handleClick}
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
					onClick={handleClick}
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
		</m.div>
	);
}
