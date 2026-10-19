"use client";

import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
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
import QPayDialog from "@/app/(main)/Lists/examList/qpayDialog";
import ExamRulesDialog from "@/components/examRuleDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Exam } from "@/types/home";
import type { QPayInvoiceResponse } from "@/types/Qpay/qpayinvoice";

interface ExamListProps {
	exams: Exam[];
	onPaymentSuccess?: () => void;
}

const MONGOLIAN_MONTHS = [
	"1-р сарын","2-р сарын","3-р сарын","4-р сарын",
	"5-р сарын","6-р сарын","7-р сарын","8-р сарын",
	"9-р сарын","10-р сарын","11-р сарын","12-р сарын",
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

const getFlagConfig = (flag: number) => {
	switch (flag) {
		case 1: return {
			label: "Идэвхтэй", Icon: Zap,
			badgeClass: "bg-card text-pop-mint-ink",
		};
		case 0: return {
			label: "Эхлээгүй", Icon: Timer,
			badgeClass: "bg-card text-pop-sky-ink",
		};
		default: return {
			label: "Дууссан", Icon: Clock,
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
	onExamClick: (examId: number, canTake: boolean) => void;
	onCreateInvoice: (exam: Exam, e: React.MouseEvent) => void;
}

const ExamCardItem = memo(({
	exam, index, isNavigating, loadingExamId, onExamClick, onCreateInvoice,
}: ExamCardItemProps) => {
	const { isActive, isPurchased, isLocked, canTakeExam } = useMemo(
		() => computeExamStatus(exam), [exam],
	);
	const flagConfig = getFlagConfig(exam.flag);
	const isThisCardLoading = loadingExamId === exam.exam_id;
	const start = formatMongolianDateTime(exam.ognoo);
	const end = formatMongolianDateTime(exam.enddate);

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: index * 0.05 }}
			className="h-full"
		>
			<button
				type="button"
				onClick={() => onExamClick(exam.exam_id, canTakeExam)}
				className={cn(
					"group card-pop lift flex h-full w-full flex-col overflow-hidden p-2 text-left",
					isLocked && "border-pop-sun/60",
					(!canTakeExam || isNavigating) && "opacity-60 cursor-not-allowed",
				)}
			>
				{/* Header — өнгөт banner */}
				<div className={cn(
					"relative flex w-full shrink-0 items-start justify-between gap-2 rounded-2xl p-3",
					exam.flag === 1 ? "bg-pop-mint-soft" :
					exam.flag === 0 ? "bg-pop-sky-soft" : "bg-muted",
				)}>
					<span className={cn(
						"flex size-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground",
						exam.flag === 1 ? "bg-pop-mint shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-mint)_60%,black)]" :
						exam.flag === 0 ? "bg-pop-sky shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-sky)_60%,black)]" :
						"bg-muted-foreground/60",
					)}>
						<FileText className="size-5" strokeWidth={2.5} />
					</span>

					{/* Badge row */}
					{isLocked ? (
						<Badge className="shrink-0 border-0 bg-pop-sun px-2 py-0.5 text-[10px] text-pop-sun-ink dark:text-background">
							<Lock className="size-3" strokeWidth={2.75} />Төлбөртэй
						</Badge>
					) : isPurchased ? (
						<Badge className="shrink-0 border-0 bg-card px-2 py-0.5 text-[10px] text-pop-mint-ink">
							<Unlock className="size-3" strokeWidth={2.75} />Төлөгдсөн
						</Badge>
					) : (
						<Badge className={cn("shrink-0 border-0 px-2 py-0.5 text-[10px]", flagConfig.badgeClass)}>
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
						<TooltipContent><p className="max-w-[200px]">{exam.title}</p></TooltipContent>
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
							<span className="tabular-nums font-bold text-foreground">{start.date} {start.time}</span>
						</div>
						<div className="flex justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
							<span>Дуусах</span>
							<span className="tabular-nums font-bold text-foreground">{end.date} {end.time}</span>
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
							{isThisCardLoading
								? <Loader2 className="size-4 animate-spin" />
								: <><CreditCard className="size-4" strokeWidth={2.5} />Төлбөр төлөх</>
							}
						</Button>
					)}
				</div>
			</button>
		</motion.div>
	);
}, (prev, next) =>
	prev.exam === next.exam &&
	prev.isNavigating === next.isNavigating &&
	(prev.loadingExamId === next.loadingExamId ||
		(prev.loadingExamId !== prev.exam.exam_id && next.loadingExamId !== next.exam.exam_id)),
);

ExamCardItem.displayName = "ExamCardItem";

// ── Shared actions (invoice / rules dialog / navigation) ─────────
function useExamActions(onPaymentSuccess?: () => void) {
	const router = useRouter();
	const { userId } = useAuthStore();
	const queryClient = useQueryClient();

	const [qpayDialogOpen, setQpayDialogOpen] = useState(false);
	const [qpayData, setQpayData] = useState<QPayInvoiceResponse | null>(null);
	const [loadingExamId, setLoadingExamId] = useState<number | null>(null);
	const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
	const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
	const [isNavigating, setIsNavigating] = useState(false);

	const handleCreateInvoice = useCallback(async (exam: Exam, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!userId) return;
		setLoadingExamId(exam.exam_id);
		try {
			const response = await axios.post("/api/examqpay/invoice", {
				amount: exam.amount?.toString() ?? "0",
				userid: userId.toString(),
				device_token: "",
				orderid: exam.bill_type?.toString() ?? "0",
				bilid: exam.exam_id.toString(),
				classroom_id: "0",
			});
			if (response.data) { setQpayData(response.data); setQpayDialogOpen(true); }
		} catch { /* silent */ }
		finally { setLoadingExamId(null); }
	}, [userId]);

	const handlePaymentSuccess = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["homeScreen"] });
		queryClient.invalidateQueries({ queryKey: ["examList"] });
		onPaymentSuccess?.();
	}, [onPaymentSuccess, queryClient]);

	const handleExamClick = useCallback((examId: number, canTake: boolean) => {
		if (!canTake || isNavigating) return;
		setSelectedExamId(examId);
		setRulesDialogOpen(true);
	}, [isNavigating]);

	const handleRulesConfirm = useCallback(async () => {
		if (!selectedExamId) return;
		try {
			setIsNavigating(true);
			await router.replace(`/exam/${selectedExamId}`);
		} catch { /* silent */ }
		finally { setIsNavigating(false); }
	}, [selectedExamId, router]);

	const dialogs = (
		<>
			<QPayDialog
				open={qpayDialogOpen}
				onOpenChange={setQpayDialogOpen}
				qpayData={qpayData}
				userId={userId}
				onPaymentSuccess={handlePaymentSuccess}
			/>
			<ExamRulesDialog
				open={rulesDialogOpen}
				onOpenChange={setRulesDialogOpen}
				onConfirm={handleRulesConfirm}
				isMobile={false}
			/>
		</>
	);

	return { isNavigating, loadingExamId, handleExamClick, handleCreateInvoice, dialogs };
}

// ── Parent ───────────────────────────────────────────────────────
const ExamList = memo(function ExamList({ exams, onPaymentSuccess }: ExamListProps) {
	const { isNavigating, loadingExamId, handleExamClick, handleCreateInvoice, dialogs } =
		useExamActions(onPaymentSuccess);

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
	exam, onPaymentSuccess, className,
}: NextExamHeroProps) {
	const { isNavigating, loadingExamId, handleExamClick, handleCreateInvoice, dialogs } =
		useExamActions(onPaymentSuccess);
	const { isActive, isPurchased, isLocked, canTakeExam } = useMemo(
		() => computeExamStatus(exam), [exam],
	);
	const flagConfig = getFlagConfig(exam.flag);
	const start = formatMongolianDateTime(exam.ognoo);
	const end = formatMongolianDateTime(exam.enddate);
	const now = useNow();

	const target = exam.flag === 1 ? exam.enddate : exam.flag === 0 ? exam.ognoo : null;
	const targetMs = target ? new Date(target).getTime() : Number.NaN;
	const countdown = now !== null && !Number.isNaN(targetMs) ? splitCountdown(targetMs - now) : null;
	const countdownLabel = exam.flag === 1 ? "Дуусахад" : "Эхлэхэд";
	const isPaying = loadingExamId === exam.exam_id;

	return (
		<div
			className={cn(
				"relative flex h-full flex-col overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-[0_6px_0_0_var(--primary-shade)] sm:p-6",
				className,
			)}
		>
			{/* Decorative shapes */}
			<div aria-hidden className="pointer-events-none absolute inset-0">
				<div className="absolute -right-12 -top-16 size-52 rounded-full bg-primary-foreground/10" />
				<div className="absolute -bottom-20 -left-10 size-44 rounded-full bg-primary-foreground/10" />
				<div className="absolute right-10 top-24 size-3 rounded-full bg-pop-sun" />
				<div className="absolute right-24 top-10 size-2 rounded-full bg-pop-mint" />
			</div>

			<div className="relative flex flex-1 flex-col gap-5">
				{/* Top row */}
				<div className="flex items-center justify-between gap-3">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-extrabold">
						<span aria-hidden>🎯</span>
						Дараагийн шалгалт
					</span>
					{isLocked ? (
						<Badge className="shrink-0 border-0 bg-pop-sun px-2.5 py-0.5 text-[11px] text-pop-sun-ink dark:text-background">
							<Lock className="size-3" strokeWidth={2.75} />Төлбөртэй
						</Badge>
					) : isPurchased ? (
						<Badge className="shrink-0 border-0 bg-card px-2.5 py-0.5 text-[11px] text-pop-mint-ink">
							<Unlock className="size-3" strokeWidth={2.75} />Төлөгдсөн
						</Badge>
					) : (
						<Badge className={cn("shrink-0 border-0 px-2.5 py-0.5 text-[11px]", flagConfig.badgeClass)}>
							<flagConfig.Icon className="size-3" strokeWidth={2.75} />
							{flagConfig.label}
						</Badge>
					)}
				</div>

				{/* Title */}
				<div className="min-w-0 space-y-2">
					{exam.lesson_name && (
						<span className="inline-block max-w-full truncate rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">
							{exam.lesson_name}
						</span>
					)}
					<h2 className="line-clamp-3 break-words text-2xl font-black leading-tight tracking-tight sm:text-3xl">
						{exam.title}
					</h2>
				</div>

				{/* Countdown */}
				{target && (
					<div className="space-y-2">
						<p className="text-xs font-bold uppercase tracking-wide text-primary-foreground/75">
							{countdownLabel}
						</p>
						<div className="flex gap-2">
							{[
								{ k: "d", v: countdown?.days, l: "өдөр" },
								{ k: "h", v: countdown?.hours, l: "цаг" },
								{ k: "m", v: countdown?.minutes, l: "мин" },
							].map(({ k, v, l }) => (
								<div
									key={k}
									className="flex min-w-[4.25rem] flex-col items-center rounded-2xl bg-card px-3 py-2 text-foreground shadow-[0_4px_0_0_var(--primary-shade)]"
								>
									<span className="text-2xl font-black tabular-nums text-primary sm:text-3xl">
										{v === undefined ? "–" : String(v).padStart(2, "0")}
									</span>
									<span className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{l}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Dates + stats */}
				<div className="flex flex-wrap gap-2 text-[11px] font-bold">
					<span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1">
						<CalendarClock className="size-3.5" strokeWidth={2.5} />
						Эхлэх <span className="tabular-nums">{start.date} {start.time}</span>
					</span>
					<span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1">
						<CalendarClock className="size-3.5" strokeWidth={2.5} />
						Дуусах <span className="tabular-nums">{end.date} {end.time}</span>
					</span>
					<span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1">
						<Clock className="size-3.5" strokeWidth={2.5} />
						{exam.exam_minute} мин
					</span>
					<span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1">
						<FileText className="size-3.5" strokeWidth={2.5} />
						{exam.que_cnt} асуулт
					</span>
				</div>

				{/* CTA */}
				<div className="mt-auto pt-1">
					{isLocked && isActive ? (
						<Button
							size="lg"
							onClick={(e) => handleCreateInvoice(exam, e)}
							disabled={isPaying}
							className="w-full bg-pop-sun text-base text-pop-sun-ink shadow-[0_5px_0_0_color-mix(in_oklch,var(--pop-sun)_60%,black)] active:shadow-[0_1px_0_0_color-mix(in_oklch,var(--pop-sun)_60%,black)] dark:text-background"
						>
							{isPaying
								? <Loader2 className="size-5 animate-spin" />
								: <><CreditCard className="size-5" strokeWidth={2.5} />Төлбөр төлөх</>
							}
						</Button>
					) : (
						<Button
							size="lg"
							onClick={() => handleExamClick(exam.exam_id, canTakeExam)}
							disabled={!canTakeExam || isNavigating}
							className="w-full bg-card text-base text-primary shadow-[0_5px_0_0_var(--primary-shade)] hover:bg-accent hover:brightness-100 active:shadow-[0_1px_0_0_var(--primary-shade)]"
						>
							{isNavigating ? (
								<Loader2 className="size-5 animate-spin" />
							) : canTakeExam ? (
								<><Play className="size-5 fill-current" strokeWidth={2.5} />Шалгалт эхлүүлэх<ArrowRight className="size-5" strokeWidth={2.75} /></>
							) : (
								<><flagConfig.Icon className="size-5" strokeWidth={2.5} />{flagConfig.label}</>
							)}
						</Button>
					)}
				</div>
			</div>
			{dialogs}
		</div>
	);
});
