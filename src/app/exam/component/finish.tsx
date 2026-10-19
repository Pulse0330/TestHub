"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	Award,
	CheckCircle,
	Clock,
	Flag,
	Loader2,
	Send,
	Target,
	Trophy,
	XCircle,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { finishExam, getExamResults } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";

interface FinishExamRequest {
	exam_id: number;
	exam_type: number;
	start_eid: number;
	exam_time: string;
	user_id: number;
}

interface FinishExamResponse {
	RetResponse: {
		ResponseMessage: string;
		StatusCode: string;
		ResponseCode: string;
		ResponseType: boolean;
	};
	RetData: number;
}

interface ExamResultData {
	test_id: number;
	title: string;
	test_date: string;
	test_time: string;
	fname: string;
	test_ttl: number;
	correct_ttl: number;
	wrong_ttl: number;
	ttl_point: number;
	point: number;
	point_perc: number;
	unelgee: string;
}

interface ExamResultsResponse {
	RetResponse: {
		ResponseMessage: string;
		StatusCode: string;
		ResponseCode: string;
		ResponseType: boolean;
	};
	RetData: ExamResultData[];
}

interface FinishExamResultDialogProps {
	examId: number;
	examType: number;
	startEid: number;
	examTime: number;
	answeredCount: number;
	totalCount: number;
	/**
	 * When true, the component renders no inline trigger button; open the
	 * confirmation dialog through the ref (`openConfirm`) instead.
	 */
	hideTrigger?: boolean;
}

export interface FinishExamDialogHandle {
	triggerFinish: () => void;
	/** Opens the manual "finish exam?" confirmation dialog. */
	openConfirm: () => void;
}

const FinishExamResultDialog = forwardRef<
	FinishExamDialogHandle,
	FinishExamResultDialogProps
>(
	(
		{
			examId,
			examType,
			startEid,
			examTime,
			answeredCount,
			totalCount,
			hideTrigger = false,
		},
		ref,
	) => {
		const { userId } = useAuthStore();
		const router = useRouter();
		const [open, setOpen] = useState(false);
		const [finishedTestId, setFinishedTestId] = useState<number | null>(null);
		const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
		const autoRedirectTimerRef = useRef<NodeJS.Timeout | null>(null); // ✅ Auto-redirect timer // ✅ Auto-submit state

		const isDadlaga = examType === 1 || examType === 2;

		const finishMutation = useMutation<
			FinishExamResponse,
			Error,
			FinishExamRequest
		>({
			mutationFn: (payload) => {
				console.log("📡 finishExam API дуудаж байна:", payload);
				return finishExam(payload);
			},
			onSuccess: (res) => {
				if (res.RetResponse.ResponseCode === "10") {
					const testId = res.RetData;

					if (isDadlaga) {
						toast.success("✅ Шалгалт амжилттай дууслаа!");
						setTimeout(() => {
							router.push("/Lists/examResult");
						}, 1500);
						setIsAutoSubmitting(false);
						return;
					}

					if (isAutoSubmitting) {
						toast.success("⏰ Цаг дууслаа. Шалгалт автоматаар дууслаа!");
					} else {
						toast.success("✅ Шалгалт амжилттай дууслаа");
					}

					if (testId) {
						setFinishedTestId(testId);
						if (isAutoSubmitting) {
							autoRedirectTimerRef.current = setTimeout(() => {
								router.push("/Lists/examResult");
							}, 500);
						}
					}

					setIsAutoSubmitting(false);
				} else if (res.RetResponse.ResponseMessage?.includes("илгээгдсэн")) {
					// Аль хэдийн дуусгасан → шууд redirect
					toast.info("Шалгалтын дүн аль хэдийн илгээгдсэн байна.");
					setOpen(false);
					setIsAutoSubmitting(false);
					setTimeout(() => {
						router.push("/Lists/examResult");
					}, 1500);
				} else {
					toast.error(res.RetResponse.ResponseMessage);
					setOpen(false);
					setIsAutoSubmitting(false);
				}
			},
			onError: () => {
				toast.error(
					isDadlaga
						? "Шалгалт дуусгах үед алдаа гарлаа"
						: "Шалгалт дуусгах үед алдаа гарлаа",
				);
				setOpen(false);
				router.push("/Lists/examResult");
			},
		});

		const { data: resultsData, isLoading: isLoadingResults } =
			useQuery<ExamResultsResponse>({
				queryKey: ["examResults", finishedTestId],
				queryFn: () => {
					if (finishedTestId !== null) return getExamResults(finishedTestId);
					return Promise.reject("finishedTestId олдсонгүй");
				},
				enabled: !!finishedTestId && !isDadlaga,
				retry: 3,
				retryDelay: 1000,
			});

		const handleFinish = () => {
			if (!userId) {
				toast.error("Хэрэглэгчийн мэдээлэл олдсонгүй");
				return;
			}

			console.log("📤 finishMutation.mutate() дуудаж байна");

			finishMutation.mutate({
				exam_id: examId,
				exam_type: examType,
				start_eid: startEid,
				exam_time: format(examTime, "HH:mm:ss"),
				user_id: userId,
			});
		};

		// ✅ ЗАСВАРЛАСАН: Expose triggerFinish method - AUTO SUBMIT
		useImperativeHandle(ref, () => ({
			triggerFinish: () => {
				console.log(
					"🔴 triggerFinish дуудагдлаа - Автоматаар дуусгаж байна...",
				);

				setIsAutoSubmitting(true);
				setOpen(true); // Dialog нээх (loading харуулах)

				// Шууд дуусгах (confirmation харуулахгүй)
				setTimeout(() => {
					handleFinish();
				}, 500); // 500ms хүлээх (UX-ийн хувьд)
			},
			openConfirm: () => {
				setOpen(true);
			},
		}));

		const progressPercentage =
			totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
		const unansweredCount = totalCount - answeredCount;
		const resultInfo = resultsData?.RetData?.[0];

		const formattedPercentage = resultInfo
			? Number(resultInfo.point_perc).toFixed(2)
			: "0.00";

		const handleCloseResults = () => {
			// ✅ Cleanup timer
			if (autoRedirectTimerRef.current) {
				clearTimeout(autoRedirectTimerRef.current);
			}
			setFinishedTestId(null);
			setOpen(false);
		};

		// ✅ Auto-submitting Loading Dialog - зөвхөн API дуудаж байх үед
		if (isAutoSubmitting && finishMutation.isPending) {
			return (
				<Dialog open={true} onOpenChange={() => {}}>
					{!hideTrigger && (
					<DialogTrigger asChild>
						<Button
							variant="success"
							size="lg"
							className="flex w-full flex-1 items-center justify-center gap-2"
						>
							<span className="hidden sm:inline">
								{isDadlaga ? "Шалгалт дуусгах" : "Шалгалт дуусгах"}
							</span>
							<span className="sm:hidden">Дуусгах</span>
							<Send className="size-4 sm:size-5" />
						</Button>
					</DialogTrigger>
					)}
					{!hideTrigger && (
					<Button
						variant="outline"
						onClick={() => router.push("/Lists/examList")}
						className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						Шалгалтаас гарах
					</Button>
					)}
					<DialogContent className="w-[95vw] max-w-[450px] p-5 sm:max-w-[520px] sm:p-6">
						<div className="flex flex-col items-center justify-center space-y-4 py-8">
							<div className="flex size-20 items-center justify-center rounded-3xl bg-destructive/10">
								<Loader2 className="size-10 animate-spin text-destructive" />
							</div>
							<p className="text-center text-sm font-bold text-muted-foreground sm:text-base">
								⏰ Цаг дууслаа. Автоматаар дуусгаж байна...
							</p>
						</div>
					</DialogContent>
				</Dialog>
			);
		}

		// Result Dialog - Loading State
		if (finishedTestId && !isDadlaga && isLoadingResults) {
			return (
				<Dialog open={open} onOpenChange={setOpen}>
					{!hideTrigger && (
					<DialogTrigger asChild>
						<Button
							variant="success"
							size="lg"
							className="flex w-full flex-1 items-center justify-center gap-2"
						>
							<span className="hidden sm:inline">Шалгалт дуусгах</span>
							<span className="sm:hidden">Дуусгах</span>
							<Send className="size-4 sm:size-5" />
						</Button>
					</DialogTrigger>
					)}
					<DialogContent className="w-[95vw] max-w-[450px] p-5 sm:max-w-[520px] sm:p-6">
						<div className="flex flex-col items-center justify-center space-y-4 py-8">
							<div className="flex size-20 animate-float items-center justify-center rounded-3xl bg-primary/10 text-4xl">
								🧮
							</div>
							<Loader2 className="size-6 animate-spin text-primary" />
							<p className="text-sm font-bold text-muted-foreground sm:text-base">
								Үр дүн тооцоолж байна...
							</p>
						</div>
					</DialogContent>
				</Dialog>
			);
		}
		<Button
			variant="outline"
			onClick={() => router.push("/Lists/examList")}
			className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
		>
			Шалгалтаас гарах
		</Button>;
		// Result Dialog - No Data
		if (finishedTestId && !isDadlaga && !isLoadingResults && !resultInfo) {
			return (
				<Dialog open={true} onOpenChange={handleCloseResults}>
					<DialogContent className="w-[95vw] max-w-[400px] p-5 sm:max-w-[450px] sm:p-6">
						<DialogHeader className="space-y-3 text-center sm:text-center">
							<div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-destructive/10">
								<XCircle className="size-8 text-destructive" strokeWidth={2.5} />
							</div>
							<DialogTitle className="text-lg font-black sm:text-xl">
								Үр дүн олдсонгүй
							</DialogTitle>
							<DialogDescription className="text-sm">
								Мэдээлэл хоосон байна. Дахин оролдоно уу.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="mt-4">
							<Button
								onClick={handleCloseResults}
								size="lg"
								className="w-full"
							>
								Хаах
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			);
		}

		// Result Dialog - Success (same as before...)
		if (finishedTestId && !isDadlaga && resultInfo) {
			const isPassed = resultInfo.point_perc >= 60;
			const isExcellent = resultInfo.point_perc >= 90;

			return (
				<Dialog open={true} onOpenChange={handleCloseResults}>
					<DialogContent
						className={`max-h-[90vh] w-[95vw] max-w-[500px] overflow-y-auto p-5 sm:max-w-[560px] sm:p-7 ${
							isPassed ? "border-success/50" : "border-border"
						}`}
					>
						<DialogHeader className="space-y-3 text-center sm:space-y-4 sm:text-center">
							<div className="relative mx-auto inline-flex items-center justify-center">
								<span
									aria-hidden="true"
									className="absolute -top-3 -left-7 animate-float text-2xl"
								>
									🎉
								</span>
								<span
									aria-hidden="true"
									className="absolute -top-2 -right-7 animate-float text-2xl"
									style={{ animationDelay: "0.4s" }}
								>
									✨
								</span>
								<div
									className={`flex size-20 items-center justify-center rounded-3xl sm:size-24 ${
										isExcellent
											? "bg-pop-sun-soft shadow-[0_5px_0_0_color-mix(in_oklch,var(--pop-sun)_55%,transparent)]"
											: isPassed
												? "bg-pop-mint-soft shadow-[0_5px_0_0_color-mix(in_oklch,var(--pop-mint)_45%,transparent)]"
												: "bg-muted shadow-[0_5px_0_0_var(--border)]"
									}`}
								>
									<Trophy
										className={`size-10 sm:size-12 ${
											isExcellent
												? "animate-bounce text-pop-sun-ink"
												: isPassed
													? "text-pop-mint-ink"
													: "text-muted-foreground"
										}`}
										strokeWidth={2.25}
									/>
								</div>
							</div>

							<div>
								<DialogTitle className="text-gradient px-2 text-2xl font-black sm:text-3xl md:text-4xl">
									Шалгалтын үр дүн
								</DialogTitle>
								<DialogDescription className="mt-2 px-2 text-base font-bold text-foreground sm:text-lg">
									{isExcellent
										? "🌟 Гайхалтай!"
										: isPassed
											? "🎉 Баяр хүргэе! Та шалгалтад тэнцлээ!"
											: "💪 Дараагийн удаад амжилт хүсье!"}
								</DialogDescription>
							</div>
						</DialogHeader>

						<div className="space-y-3 py-2 sm:space-y-4 sm:py-4">
							{/* Main Score Card */}
							<div
								className={`relative overflow-hidden rounded-3xl border-2 p-5 text-center sm:p-6 ${
									isPassed
										? "border-success/40 bg-pop-mint-soft"
										: "border-destructive/30 bg-pop-coral-soft"
								}`}
							>
								<div
									className={`text-6xl font-black leading-none tracking-tight tabular-nums sm:text-7xl ${
										isPassed ? "text-pop-mint-ink" : "text-pop-coral-ink"
									}`}
								>
									{formattedPercentage}%
								</div>
								<div className="mt-4 flex items-center justify-center gap-2.5">
									<span
										className={`flex size-9 items-center justify-center rounded-xl bg-card ${
											isPassed ? "text-pop-mint-ink" : "text-pop-coral-ink"
										}`}
									>
										<Award className="size-5" strokeWidth={2.5} />
									</span>
									<div className="text-left">
										<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
											Нийт оноо
										</p>
										<p className="text-sm font-extrabold text-foreground">
											{resultInfo.point} / {resultInfo.ttl_point} оноо
										</p>
									</div>
								</div>
							</div>

							{/* Stats Grid */}
							<div className="grid grid-cols-3 gap-2 sm:gap-3">
								<div className="rounded-2xl bg-pop-sky-soft p-3 text-center sm:p-4">
									<Target className="mx-auto mb-1 size-5 text-pop-sky-ink sm:mb-2 sm:size-6" />
									<p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-pop-sky-ink sm:text-xs">
										Нийт
									</p>
									<p className="text-2xl font-black text-pop-sky-ink">
										{resultInfo.test_ttl}
									</p>
								</div>

								<div className="rounded-2xl bg-pop-mint-soft p-3 text-center sm:p-4">
									<CheckCircle className="mx-auto mb-1 size-5 text-pop-mint-ink sm:mb-2 sm:size-6" />
									<p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-pop-mint-ink sm:text-xs">
										Зөв
									</p>
									<p className="text-2xl font-black text-pop-mint-ink">
										{resultInfo.correct_ttl}
									</p>
								</div>

								<div className="rounded-2xl bg-pop-coral-soft p-3 text-center sm:p-4">
									<XCircle className="mx-auto mb-1 size-5 text-pop-coral-ink sm:mb-2 sm:size-6" />
									<p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-pop-coral-ink sm:text-xs">
										Буруу
									</p>
									<p className="text-2xl font-black text-pop-coral-ink">
										{resultInfo.wrong_ttl}
									</p>
								</div>
							</div>

							{/* Additional Info */}
							<div className="flex flex-col justify-between gap-2 text-xs sm:flex-row sm:gap-3 sm:text-sm">
								<div className="flex items-center justify-center gap-2 rounded-full bg-muted px-3 py-1.5 font-bold sm:justify-start">
									<Clock className="size-4 shrink-0 text-muted-foreground" />
									<span className="text-foreground">
										{resultInfo.test_time}
									</span>
								</div>
								<div className="flex items-center justify-center gap-2 rounded-full bg-pop-violet-soft px-3 py-1.5 font-bold sm:justify-start">
									<Zap className="size-4 shrink-0 text-pop-violet-ink" />
									<span className="text-center text-pop-violet-ink sm:text-left">
										{resultInfo.unelgee}
									</span>
								</div>
							</div>
						</div>

						<DialogFooter className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-3">
							<Button
								variant="default"
								size="lg"
								onClick={() => router.push("/Lists/examList")}
								className="w-full"
							>
								Гарах
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			);
		}

		// Confirmation Dialog (Manual Submit)
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				{!hideTrigger && (
				<DialogTrigger asChild>
					<Button
						variant="success"
						size="lg"
						className="flex w-full flex-1 items-center justify-center gap-2"
					>
						<span className="hidden sm:inline">
							{isDadlaga ? "Шалгалт дуусгах" : "Шалгалт дуусгах"}
						</span>
						<span className="sm:hidden">Дуусгах</span>
						<Send className="size-4 sm:size-5" />
					</Button>
				</DialogTrigger>
				)}

				<DialogContent className="max-h-[90vh] w-[95vw] max-w-[500px] overflow-y-auto p-5 sm:max-w-[560px] sm:p-6">
					<DialogHeader className="space-y-2 text-center sm:space-y-3 sm:text-center">
						<div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-pop-mint-soft text-pop-mint-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-mint)_40%,transparent)]">
							<Flag className="size-8" strokeWidth={2.5} />
						</div>
						<DialogTitle className="px-2 text-xl font-black sm:text-2xl">
							{isDadlaga ? "Шалгалт дуусгах уу?" : "Шалгалт дуусгах уу?"}
						</DialogTitle>
						<DialogDescription className="px-2 text-sm font-semibold">
							{isDadlaga
								? "Дуусгасны дараа шалгалтын үр дүн харах хуудас руу шилжих болно."
								: "Дуусгасны дараа хариултуудыг өөрчлөх боломжгүй болно."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
						<div className="rounded-3xl border-2 border-border bg-muted/40 p-4">
							<div className="mb-3 flex items-center justify-between sm:mb-4">
								<span className="flex items-center gap-2 text-xs font-bold text-muted-foreground sm:text-sm">
									<span className="flex size-8 items-center justify-center rounded-xl bg-pop-sky-soft text-pop-sky-ink">
										<Target className="size-4" strokeWidth={2.5} />
									</span>
									<span className="hidden sm:inline">Нийт асуулт</span>
									<span className="sm:hidden">Нийт</span>
								</span>
								<span className="text-2xl font-black text-foreground sm:text-3xl">
									{totalCount}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
								<div className="flex items-center gap-2 rounded-2xl bg-pop-mint-soft p-3 sm:gap-3 sm:p-4">
									<div className="shrink-0 rounded-xl bg-card p-1.5 sm:p-2">
										<CheckCircle className="size-4 text-pop-mint-ink sm:size-5" />
									</div>
									<div className="min-w-0">
										<p className="truncate text-[10px] font-bold uppercase tracking-wide text-pop-mint-ink sm:text-xs">
											Хариулсан
										</p>
										<p className="text-2xl font-black text-pop-mint-ink">
											{answeredCount}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-2 rounded-2xl bg-pop-coral-soft p-3 sm:gap-3 sm:p-4">
									<div className="shrink-0 rounded-xl bg-card p-1.5 sm:p-2">
										<XCircle className="size-4 text-pop-coral-ink sm:size-5" />
									</div>
									<div className="min-w-0">
										<p className="truncate text-[10px] font-bold uppercase tracking-wide text-pop-coral-ink sm:text-xs">
											Хариулаагүй
										</p>
										<p className="text-2xl font-black text-pop-coral-ink">
											{unansweredCount}
										</p>
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<Progress
									value={progressPercentage}
									className="h-3"
								/>
							</div>
						</div>

						{unansweredCount > 0 && (
							<div className="flex items-start gap-3 rounded-2xl border-2 border-warning/60 bg-pop-sun-soft p-3 sm:p-4">
								<div className="shrink-0 rounded-xl bg-warning p-1.5">
									<XCircle className="size-4 text-[color-mix(in_oklch,var(--warning)_22%,black)] sm:size-5" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="mb-1 text-xs font-extrabold text-pop-sun-ink sm:text-sm">
										Анхааруулга
									</p>
									<p className="text-[11px] font-semibold text-pop-sun-ink sm:text-xs">
										Танд {unansweredCount} хариулаагүй асуулт байна. Дуусгахаас
										өмнө шалгана уу.
									</p>
								</div>
							</div>
						)}
					</div>

					<DialogFooter className="flex flex-col gap-2 pt-1 sm:flex-row sm:gap-3">
						<Button
							onClick={handleFinish}
							disabled={finishMutation.isPending}
							variant="success"
							size="lg"
							className="order-1 w-full sm:order-2"
						>
							{finishMutation.isPending ? (
								<>
									<Loader2 className="size-4 animate-spin sm:size-5" />
									<span className="text-sm sm:text-base">Дуусгаж байна...</span>
								</>
							) : (
								<>
									<Send className="size-4 sm:size-5" />
									<span className="text-sm sm:text-base">Тийм, дуусгах</span>
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);

FinishExamResultDialog.displayName = "FinishExamResultDialog";

export default FinishExamResultDialog;
