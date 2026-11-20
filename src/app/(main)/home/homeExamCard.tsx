"use client";

import { useQueryClient } from "@tanstack/react-query";
import { m } from "framer-motion";
import {
	ArrowRight,
	CalendarClock,
	Clock,
	CreditCard,
	FileText,
	Loader2,
	Lock,
	Play,
	Timer,
	Unlock,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
	ExamDetailDialog,
	type ExamDetailStatus,
} from "@/components/ExamDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import QPayDialog from "@/features/qpay";
import { createExamInvoice } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Exam } from "@/types/home";
import type { QPayInvoiceResponse } from "@/types/Qpay/qpayinvoice";

interface ExamListProps {
	exams: Exam[];
	onPaymentSuccess?: () => void;
}

const MONGOLIAN_MONTHS = [
	"1-р сарын",
	"2-р сарын",
	"3-р сарын",
	"4-р сарын",
	"5-р сарын",
	"6-р сарын",
	"7-р сарын",
	"8-р сарын",
	"9-р сарын",
	"10-р сарын",
	"11-р сарын",
	"12-р сарын",
] as const;

const dateFormatCache = new Map<string, { date: string; time: string }>();

function formatMongolianDateTime(dateString: string) {
	const cached = dateFormatCache.get(dateString);
	if (cached) return cached;
	const d = new Date(dateString);
	const result = {
		date: `${MONGOLIAN_MONTHS[d.getMonth()]} ${d.getDate()}`,
		time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
	};
	dateFormatCache.set(dateString, result);
	return result;
}

function computeExamStatus(exam: Exam) {
	const isActive = exam.flag === 1;
	const descr = exam.ispaydescr?.toLowerCase() ?? "";
	const isPaid = descr.includes("төлбөртэй") || descr.includes("paid");
	const isPurchased = exam.ispurchased === 1;
	const isLocked = isPaid && !isPurchased;
	const canTakeExam = isActive && (!isPaid || isPurchased);
	return { isActive, isPaid, isPurchased, isLocked, canTakeExam };
}

/** Дэлгэрэнгүй dialog-ийн төлөв — карт дээрх төлбөрийн дүрэмтэй ижил. */
function getDetailStatus(exam: Exam): ExamDetailStatus {
	const { isActive, isPurchased, isLocked, canTakeExam } =
		computeExamStatus(exam);
	return {
		isLocked,
		isPurchased,
		isExpired: exam.flag >= 2,
		canPay: isLocked && isActive,
		canTakeExam,
	};
}

const getFlagConfig = (flag: number) => {
	switch (flag) {
		case 1:
			return {
				label: "Идэвхтэй",
				Icon: Zap,
				badgeClass: "bg-card text-pop-mint-ink",
			};
		case 0:
			return {
				label: "Эхлээгүй",
				Icon: Timer,
				badgeClass: "bg-card text-pop-sky-ink",
			};
		default:
			return {
				label: "Дууссан",
				Icon: Clock,
				badgeClass: "bg-card text-muted-foreground",
			};
	}
};

// ── Single Card ─────────────────────────────────────────────────
interface ExamCardItemProps {
	exam: Exam;
	index: number;
	isNavigating: boolean;
	loadingExamId: number | null;
	onExamClick: (exam: Exam) => void;
	onCreateInvoice: (exam: Exam, e?: React.MouseEvent) => void;
}

const ExamCardItem = memo(
	({
		exam,
		index,
		isNavigating,
		loadingExamId,
		onExamClick,
		onCreateInvoice,
	}: ExamCardItemProps) => {
		const { isActive, isPurchased, isLocked, canTakeExam } = useMemo(
			() => computeExamStatus(exam),
			[exam],
		);
		const flagConfig = getFlagConfig(exam.flag);
		const isThisCardLoading = loadingExamId === exam.exam_id;
		const start = formatMongolianDateTime(exam.ognoo);
		const end = formatMongolianDateTime(exam.enddate);

		return (
			<m.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, delay: index * 0.05 }}
				className="h-full"
			>
				<button
					type="button"
					onClick={() => onExamClick(exam)}
					className={cn(
						"group card-pop lift flex h-full w-full flex-col overflow-hidden p-2 text-left",
						isLocked && "border-pop-sun/60",
						(!canTakeExam || isNavigating) && "opacity-60",
					)}
				>
					{/* Header — өнгөт banner */}
					<div
						className={cn(
							"relative flex w-full shrink-0 items-start justify-between gap-2 rounded-2xl p-3",
							exam.flag === 1
								? "bg-pop-mint-soft"
								: exam.flag === 0
									? "bg-pop-sky-soft"
									: "bg-muted",
						)}
					>
						<span
							className={cn(
								"flex size-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground",
								exam.flag === 1
									? "bg-pop-mint shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-mint)_60%,black)]"
									: exam.flag === 0
										? "bg-pop-sky shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-sky)_60%,black)]"
										: "bg-muted-foreground/60",
							)}
						>
							<FileText className="size-5" strokeWidth={2.5} />
						</span>

						{/* Badge row */}
						{isLocked ? (
							<Badge className="shrink-0 border-0 bg-pop-sun px-2 py-0.5 text-[10px] text-pop-sun-ink dark:text-background">
								<Lock className="size-3" strokeWidth={2.75} />
								Төлбөртэй
							</Badge>
						) : isPurchased ? (
							<Badge className="shrink-0 border-0 bg-card px-2 py-0.5 text-[10px] text-pop-mint-ink">
								<Unlock className="size-3" strokeWidth={2.75} />
								Төлөгдсөн
							</Badge>
						) : (
							<Badge
								className={cn(
									"shrink-0 border-0 px-2 py-0.5 text-[10px]",
									flagConfig.badgeClass,
								)}
							>
								<flagConfig.Icon className="size-3" strokeWidth={2.75} />
								{flagConfig.label}
							</Badge>
						)}
					</div>

					{/* Body */}
					<div className="flex flex-1 flex-col gap-2.5 px-1.5 pb-1 pt-3">
						{/* Title */}
						<Tooltip>
							<TooltipTrigger asChild>
								<h3 className="line-clamp-2 text-sm font-extrabold leading-snug transition-colors group-hover:text-primary">
									{exam.title}
								</h3>
							</TooltipTrigger>
							<TooltipContent>
								<p className="max-w-[200px]">{exam.title}</p>
							</TooltipContent>
						</Tooltip>

						{exam.lesson_name && (
							<span className="w-fit max-w-full truncate rounded-full bg-pop-violet-soft px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-pop-violet-ink">
								{exam.lesson_name}
							</span>
						)}

						{/* Dates */}
						<div className="mt-auto space-y-1.5 rounded-xl bg-muted p-2.5">
							<div className="flex justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
								<span>Эхлэх</span>
								<span className="tabular-nums font-bold text-foreground">
									{start.date} {start.time}
								</span>
							</div>
							<div className="flex justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
								<span>Дуусах</span>
								<span className="tabular-nums font-bold text-foreground">
									{end.date} {end.time}
								</span>
							</div>
						</div>

						{/* Stats */}
						<div className="flex flex-wrap items-center gap-1.5">
							<span className="inline-flex items-center gap-1 rounded-full bg-pop-sky-soft px-2 py-0.5 text-[10px] font-bold text-pop-sky-ink">
								<Clock className="size-3" strokeWidth={2.5} />
								{exam.exam_minute} мин
							</span>
							<span className="inline-flex items-center gap-1 rounded-full bg-pop-pink-soft px-2 py-0.5 text-[10px] font-bold text-pop-pink-ink">
								<FileText className="size-3" strokeWidth={2.5} />
								{exam.que_cnt} асуулт
							</span>
							<span className="ml-auto flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:translate-x-0.5">
								<ArrowRight className="size-3.5" strokeWidth={2.75} />
							</span>
						</div>

						{/* Pay button */}
						{isLocked && isActive && (
							<Button
								onClick={(e) => onCreateInvoice(exam, e)}
								disabled={isThisCardLoading}
								size="sm"
								className="w-full bg-pop-sun text-pop-sun-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_60%,black)] active:shadow-[0_1px_0_0_color-mix(in_oklch,var(--pop-sun)_60%,black)] dark:text-background"
							>
								{isThisCardLoading ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<>
										<CreditCard className="size-4" strokeWidth={2.5} />
										Төлбөр төлөх
									</>
								)}
							</Button>
						)}
					</div>
				</button>
			</m.div>
		);
	},
	(prev, next) =>
		prev.exam === next.exam &&
		prev.isNavigating === next.isNavigating &&
		(prev.loadingExamId === next.loadingExamId ||
			(prev.loadingExamId !== prev.exam.exam_id &&
				next.loadingExamId !== next.exam.exam_id)),
);

ExamCardItem.displayName = "ExamCardItem";

// ── Shared actions (invoice / detail+rules dialog / navigation) ──
function useExamActions(onPaymentSuccess?: () => void) {
	const router = useRouter();
	const { userId } = useAuthStore();
	const queryClient = useQueryClient();

	const [qpayDialogOpen, setQpayDialogOpen] = useState(false);
	const [qpayData, setQpayData] = useState<QPayInvoiceResponse | null>(null);
	const [loadingExamId, setLoadingExamId] = useState<number | null>(null);
	// Дэлгэрэнгүй → дүрэм → эхлүүлэх dialog (нэг л instance)
	const [detailExam, setDetailExam] = useState<Exam | null>(null);
	const [detailStep, setDetailStep] = useState<"details" | "rules">("details");
	const [isNavigating, setIsNavigating] = useState(false);

	const handleCreateInvoice = useCallback(
		async (exam: Exam, e?: React.MouseEvent) => {
			e?.stopPropagation();
			if (!userId) return;
			setLoadingExamId(exam.exam_id);
			try {
				const invoice = await createExamInvoice(exam, userId);
				if (invoice) {
					setQpayData(invoice);
					setQpayDialogOpen(true);
				}
			} catch {
				/* silent */
			} finally {
				setLoadingExamId(null);
			}
		},
		[userId],
	);

	const handlePaymentSuccess = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
		queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
		onPaymentSuccess?.();
	}, [onPaymentSuccess, queryClient]);

	/** Карт дээр дарахад дэлгэрэнгүй, «Шалгалт эхлүүлэх»-ээс шууд дүрмийн алхам нээгдэнэ */
	const handleExamClick = useCallback(
		(exam: Exam, step: "details" | "rules" = "details") => {
			if (isNavigating) return;
			setDetailStep(step);
			setDetailExam(exam);
		},
		[isNavigating],
	);

	const handleDetailOpenChange = useCallback((open: boolean) => {
		if (!open) setDetailExam(null);
	}, []);

	// QPay нэхэмжлэх хүсэлт дууссаны дараа dialog-ийг хааж QPay dialog-ийг харуулна
	const handlePayFromDetail = useCallback(
		async (exam: Exam) => {
			await handleCreateInvoice(exam);
			setDetailExam(null);
		},
		[handleCreateInvoice],
	);

	const handleStartExam = useCallback(
		async (exam: Exam) => {
			setDetailExam(null);
			try {
				setIsNavigating(true);
				await router.replace(`/exam/${exam.exam_id}`);
			} catch {
				/* silent */
			} finally {
				setIsNavigating(false);
			}
		},
		[router],
	);

	const dialogs = (
		<>
			<QPayDialog
				open={qpayDialogOpen}
				onOpenChange={setQpayDialogOpen}
				qpayData={qpayData}
				userId={userId}
				onPaymentSuccess={handlePaymentSuccess}
				successMessage="Таны төлбөр амжилттай төлөгдлөө. Та шалгалт өгөх боломжтой боллоо."
			/>
			<ExamDetailDialog
				exam={detailExam}
				getStatus={getDetailStatus}
				onOpenChange={handleDetailOpenChange}
				onPay={handlePayFromDetail}
				onStart={handleStartExam}
				isCreatingInvoice={
					detailExam !== null && loadingExamId === detailExam.exam_id
				}
				initialStep={detailStep}
			/>
		</>
	);

	return {
		isNavigating,
		loadingExamId,
		handleExamClick,
		handleCreateInvoice,
		dialogs,
	};
}

// ── Parent ───────────────────────────────────────────────────────
const ExamList = memo(function ExamList({
	exams,
	onPaymentSuccess,
}: ExamListProps) {
	const {
		isNavigating,
		loadingExamId,
		handleExamClick,
		handleCreateInvoice,
		dialogs,
	} = useExamActions(onPaymentSuccess);

	if (!exams?.length) return null;

	return (
		<TooltipProvider>
			{exams.map((exam, index) => (
				<ExamCardItem
					key={exam.exam_id}
					exam={exam}
					index={index}
					isNavigating={isNavigating}
					loadingExamId={loadingExamId}
					onExamClick={handleExamClick}
					onCreateInvoice={handleCreateInvoice}
				/>
			))}
			{dialogs}
		</TooltipProvider>
	);
});

export default ExamList;

// ============================================================================
// NEXT EXAM HERO — "Дараагийн шалгалт" bento tile
// ============================================================================

/** Хамгийн яаралтай шалгалтыг сонгоно: өгөх боломжтой идэвхтэй → идэвхтэй → удахгүй эхлэх. */
export function pickNextExam(exams: Exam[] | null | undefined): Exam | null {
	if (!exams?.length) return null;
	const time = (s: string) => {
		const t = new Date(s).getTime();
		return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
	};
	const active = exams
		.filter((e) => e.flag === 1)
		.sort((a, b) => {
			const ta = computeExamStatus(a).canTakeExam ? 0 : 1;
			const tb = computeExamStatus(b).canTakeExam ? 0 : 1;
			return ta - tb || time(a.enddate) - time(b.enddate);
		});
	if (active.length) return active[0];
	const upcoming = exams
		.filter((e) => e.flag === 0)
		.sort((a, b) => time(a.ognoo) - time(b.ognoo));
	return upcoming[0] ?? exams[0];
}

function useNow(intervalMs = 30_000) {
	const [now, setNow] = useState<number | null>(null);
	useEffect(() => {
		setNow(Date.now());
		const id = window.setInterval(() => setNow(Date.now()), intervalMs);
		return () => window.clearInterval(id);
	}, [intervalMs]);
	return now;
}

function splitCountdown(ms: number) {
	const totalMin = Math.max(0, Math.floor(ms / 60_000));
	return {
		days: Math.floor(totalMin / 1440),
		hours: Math.floor((totalMin % 1440) / 60),
		minutes: totalMin % 60,
	};
}

interface NextExamHeroProps {
	exam: Exam;
	onPaymentSuccess?: () => void;
	className?: string;
}

export const NextExamHero = memo(function NextExamHero({
	exam,
	onPaymentSuccess,
	className,
}: NextExamHeroProps) {
	const {
		isNavigating,
		loadingExamId,
		handleExamClick,
		handleCreateInvoice,
		dialogs,
	} = useExamActions(onPaymentSuccess);
	const { isActive, isPurchased, isLocked, canTakeExam } = useMemo(
		() => computeExamStatus(exam),
		[exam],
	);
	const flagConfig = getFlagConfig(exam.flag);
	const start = formatMongolianDateTime(exam.ognoo);
	const end = formatMongolianDateTime(exam.enddate);
	const now = useNow();

	const target =
		exam.flag === 1 ? exam.enddate : exam.flag === 0 ? exam.ognoo : null;
	const targetMs = target ? new Date(target).getTime() : Number.NaN;
	const countdown =
		now !== null && !Number.isNaN(targetMs)
			? splitCountdown(targetMs - now)
			: null;
	const countdownLabel = exam.flag === 1 ? "Дуусахад" : "Эхлэхэд";
	const isPaying = loadingExamId === exam.exam_id;

	return (
		<section
			aria-label="Дараагийн шалгалт"
			className={cn(
				"relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,var(--pop-sky-soft),var(--pop-violet-soft))] p-5 sm:p-8 lg:p-10",
				className,
			)}
		>
			{/* Зөөлөн чимэглэл */}
			<div aria-hidden className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -right-16 size-72 rounded-full bg-card/40" />
				<div className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-card/30" />
			</div>

			<div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-12">
				{/* Зүүн: гарчиг, мэдээлэл, үйлдэл */}
				<div className="flex min-w-0 flex-col gap-5">
					<div className="flex flex-wrap items-center gap-2">
						<span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 text-xs font-extrabold text-pop-sky-ink">
							<CalendarClock className="size-3.5" strokeWidth={2.5} />
							Дараагийн шалгалт
						</span>
						{isLocked ? (
							<Badge className="border-0 bg-pop-sun-soft px-2.5 py-0.5 text-[11px] text-pop-sun-ink">
								<Lock className="size-3" strokeWidth={2.75} />
								Төлбөртэй
							</Badge>
						) : isPurchased ? (
							<Badge className="border-0 bg-card px-2.5 py-0.5 text-[11px] text-pop-mint-ink">
								<Unlock className="size-3" strokeWidth={2.75} />
								Төлөгдсөн
							</Badge>
						) : (
							<Badge
								className={cn(
									"border-0 px-2.5 py-0.5 text-[11px]",
									flagConfig.badgeClass,
								)}
							>
								<flagConfig.Icon className="size-3" strokeWidth={2.75} />
								{flagConfig.label}
							</Badge>
						)}
					</div>

					<div className="min-w-0 space-y-2">
						{exam.lesson_name && (
							<p className="truncate text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
								{exam.lesson_name}
							</p>
						)}
						<h2 className="line-clamp-3 break-words text-3xl leading-tight font-black tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
							{exam.title}
						</h2>
					</div>

					<div className="flex flex-wrap gap-2 text-xs font-bold text-foreground/80">
						<span className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5">
							<CalendarClock className="size-3.5" strokeWidth={2.5} />
							Эхлэх{" "}
							<span className="tabular-nums">
								{start.date} {start.time}
							</span>
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5">
							<CalendarClock className="size-3.5" strokeWidth={2.5} />
							Дуусах{" "}
							<span className="tabular-nums">
								{end.date} {end.time}
							</span>
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5">
							<Clock className="size-3.5" strokeWidth={2.5} />
							{exam.exam_minute} мин
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5">
							<FileText className="size-3.5" strokeWidth={2.5} />
							{exam.que_cnt} асуулт
						</span>
					</div>

					<div className="flex flex-col gap-2 pt-1 sm:flex-row">
						{isLocked && isActive ? (
							<Button
								size="lg"
								onClick={(e) => handleCreateInvoice(exam, e)}
								disabled={isPaying}
								className="bg-pop-sun-soft text-pop-sun-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_70%,transparent)] active:shadow-[0_1px_0_0_color-mix(in_oklch,var(--pop-sun)_70%,transparent)] sm:min-w-56"
							>
								{isPaying ? (
									<Loader2 className="size-5 animate-spin" />
								) : (
									<>
										<CreditCard className="size-5" strokeWidth={2.5} />
										Төлбөр төлөх
									</>
								)}
							</Button>
						) : (
							<Button
								size="lg"
								onClick={() => handleExamClick(exam, "rules")}
								disabled={!canTakeExam || isNavigating}
								className="sm:min-w-56"
							>
								{isNavigating ? (
									<Loader2 className="size-5 animate-spin" />
								) : canTakeExam ? (
									<>
										<Play className="size-5 fill-current" strokeWidth={2.5} />
										Шалгалт эхлүүлэх
									</>
								) : (
									<>
										<flagConfig.Icon className="size-5" strokeWidth={2.5} />
										{flagConfig.label}
									</>
								)}
							</Button>
						)}
						<Button
							size="lg"
							variant="outline"
							onClick={() => handleExamClick(exam)}
						>
							Дэлгэрэнгүй
							<ArrowRight className="size-4" strokeWidth={2.75} />
						</Button>
					</div>
				</div>

				{/* Баруун: тоолуур */}
				{target && (
					<div className="rounded-3xl bg-card/80 p-5 backdrop-blur-sm sm:p-6">
						<p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
							{countdownLabel}
						</p>
						<div className="grid grid-cols-3 gap-2 sm:gap-3">
							{[
								{ k: "d", v: countdown?.days, l: "өдөр" },
								{ k: "h", v: countdown?.hours, l: "цаг" },
								{ k: "m", v: countdown?.minutes, l: "минут" },
							].map(({ k, v, l }) => (
								<div
									key={k}
									className="flex flex-col items-center rounded-2xl bg-pop-sky-soft py-3 sm:py-5"
								>
									<span className="text-3xl font-black tabular-nums text-pop-sky-ink sm:text-5xl">
										{v === undefined ? "–" : String(v).padStart(2, "0")}
									</span>
									<span className="mt-1 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
										{l}
									</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
			{dialogs}
		</section>
	);
});
