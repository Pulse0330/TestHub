"use client";

import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import {
	ArrowRight,
	Clock,
	CreditCard,
	FileText,
	Loader2,
	Lock,
	Timer,
	Unlock,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback, useMemo, useState } from "react";
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
			badgeClass: "bg-emerald-500 hover:bg-emerald-600 text-white",
		};
		case 0: return {
			label: "Эхлээгүй", Icon: Timer,
			badgeClass: "bg-blue-500/90 hover:bg-blue-600 text-white",
		};
		default: return {
			label: "Дууссан", Icon: Clock,
			badgeClass: "bg-slate-500/80 text-white",
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
					"group h-full w-full flex flex-col rounded-xl overflow-hidden border bg-card text-left transition-all duration-200",
					isLocked
						? "border-amber-400/30 hover:border-amber-400/60 hover:shadow-md hover:shadow-amber-500/10"
						: "border-border/50 hover:border-border hover:shadow-md",
					(!canTakeExam || isNavigating) && "opacity-60 cursor-not-allowed",
				)}
			>
				{/* Header — өнгөт strip */}
				<div className={cn(
					"relative w-full h-1.5 shrink-0",
					exam.flag === 1 ? "bg-emerald-500" :
					exam.flag === 0 ? "bg-blue-500" : "bg-slate-400",
				)} />

				{/* Body */}
				<div className="flex flex-col flex-1 p-3 gap-2.5">
					{/* Badge row */}
					<div className="flex items-start justify-between gap-1.5">
						{isLocked ? (
							<Badge className="bg-amber-500 text-white border-0 text-[9px] px-1.5 py-0.5 shrink-0">
								<Lock className="w-2.5 h-2.5 mr-0.5" />Төлбөртэй
							</Badge>
						) : isPurchased ? (
							<Badge className="bg-emerald-500 text-white border-0 text-[9px] px-1.5 py-0.5 shrink-0">
								<Unlock className="w-2.5 h-2.5 mr-0.5" />Төлөгдсөн
							</Badge>
						) : (
							<Badge className={cn("border-0 text-[9px] px-1.5 py-0.5 shrink-0", flagConfig.badgeClass)}>
								<flagConfig.Icon className="w-2.5 h-2.5 mr-0.5" />
								{flagConfig.label}
							</Badge>
						)}
					</div>

					{/* Title */}
					<Tooltip>
						<TooltipTrigger asChild>
							<h3 className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
								{exam.title}
							</h3>
						</TooltipTrigger>
						<TooltipContent><p className="max-w-[200px]">{exam.title}</p></TooltipContent>
					</Tooltip>

					{exam.lesson_name && (
						<p className="text-[9px] text-muted-foreground truncate uppercase tracking-wide">
							{exam.lesson_name}
						</p>
					)}

					{/* Dates */}
					<div className="mt-auto space-y-1 pt-2 border-t border-border/40">
						<div className="flex justify-between text-[10px] text-muted-foreground">
							<span>Эхлэх</span>
							<span className="tabular-nums">{start.date} {start.time}</span>
						</div>
						<div className="flex justify-between text-[10px] text-muted-foreground">
							<span>Дуусах</span>
							<span className="tabular-nums">{end.date} {end.time}</span>
						</div>
					</div>

					{/* Stats */}
					<div className="flex items-center justify-between pt-1.5 border-t border-border/40">
						<div className="flex items-center gap-1 text-muted-foreground">
							<Clock className="w-3 h-3" />
							<span className="text-[10px]">{exam.exam_minute} мин</span>
						</div>
						<div className="flex items-center gap-1 text-muted-foreground">
							<FileText className="w-3 h-3" />
							<span className="text-[10px]">{exam.que_cnt} асуулт</span>
						</div>
						<ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
					</div>

					{/* Pay button */}
					{isLocked && isActive && (
						<Button
							onClick={(e) => onCreateInvoice(exam, e)}
							disabled={isThisCardLoading}
							size="sm"
							className="w-full h-8 text-[10px] bg-amber-500 hover:bg-amber-600 border-0"
						>
							{isThisCardLoading
								? <Loader2 className="w-3 h-3 animate-spin" />
								: <><CreditCard className="w-3 h-3 mr-1.5" />Төлбөр төлөх</>
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

// ── Parent ───────────────────────────────────────────────────────
const ExamList = memo(function ExamList({ exams, onPaymentSuccess }: ExamListProps) {
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
		</TooltipProvider>
	);
});

export default ExamList;