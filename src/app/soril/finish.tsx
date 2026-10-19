"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
import { forwardRef, useImperativeHandle, useState } from "react";
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
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
	FinishExamRequest,
	FinishExamResponse,
} from "@/types/exam/examFinish";

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
	elapsedSeconds: number; // ✅ секундээр
	answeredCount: number;
	totalCount: number;
	/** Өгөгдвөл "Сорил дуусгах" товч шууд баталгаажуулалт нээхийн оронд үүнийг дуудна (жишээ нь шалгах самбар). */
	onRequestFinish?: () => void;
	triggerClassName?: string;
}

export interface FinishExamDialogHandle {
	triggerFinish: () => void;
	/** Баталгаажуулах цонхыг (дуусгах урсгал) нээнэ. */
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
			elapsedSeconds,
			answeredCount,
			totalCount,
			onRequestFinish,
			triggerClassName,
		},
		ref,
	) => {
		const { userId } = useAuthStore();
		const router = useRouter();
		const [open, setOpen] = useState(false);
		const [finishedTestId, setFinishedTestId] = useState<number | null>(null);

		const isDadlaga = examType === 2;

		const finishMutation = useMutation<
			FinishExamResponse,
			Error,
			FinishExamRequest
		>({
			mutationFn: (payload) => finishExam(payload),
			onSuccess: (res) => {
				if (res.RetResponse.ResponseCode === "10") {
					const testId = res.RetData;

					if (isDadlaga) {
						toast.success("✅ Сорил амжилттай дууслаа!");
						setTimeout(() => {
							router.push("/home");
						}, 1500);
					} else {
						toast.success("✅ Сорил амжилттай дууслаа");
						if (testId) setFinishedTestId(testId);
					}
				} else {
					toast.error(res.RetResponse.ResponseMessage);
					setOpen(false);
				}
			},
			onError: () => {
				toast.error(
					isDadlaga
						? "Сорил дуусгах үед алдаа гарлаа"
						: "Сорил дуусгах үед алдаа гарлаа",
				);
				setOpen(false);
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

		// ✅ finish.tsx дээр console.log нэмээд шалгах
		const handleFinish = () => {
			if (!userId) {
				toast.error("Хэрэглэгчийн мэдээлэл олдсонгүй");
				return;
			}

			// ✅ elapsedSeconds нь одоо үнэхээр секунд байна
			const hours = Math.floor(elapsedSeconds / 3600);
			const minutes = Math.floor((elapsedSeconds % 3600) / 60);
			const seconds = elapsedSeconds % 60;

			const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

			const payload = {
				exam_id: examId,
				exam_type: examType,
				start_eid: startEid,
				exam_time: formattedTime, // ✅ Одоо зөв утгатай байх болно
				user_id: userId,
			};

			console.log("📤 Илгээж буй payload:", payload);
			finishMutation.mutate(payload);
		};
		// Expose triggerFinish method to parent via ref
		useImperativeHandle(ref, () => ({
			triggerFinish: () => {
				setOpen(true);
				// Auto-trigger finish after showing dialog
				setTimeout(handleFinish, 100);
			},
			openConfirm: () => {
				setOpen(true);
			},
		}));

		const triggerButton = (
			<Button
				size="lg"
				className={cn(
					"group w-full flex-1 text-base font-extrabold",
					triggerClassName,
				)}
				onClick={
					onRequestFinish
						? (e) => {
								e.preventDefault();
								onRequestFinish();
							}
						: undefined
				}
			>
				<span>{isDadlaga ? "Сорил дуусгах" : "Сорил дуусгах"}</span>
				<Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
			</Button>
		);

		const progressPercentage =
			totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
		const unansweredCount = totalCount - answeredCount;
		const resultInfo = resultsData?.RetData?.[0];

		const handleCloseResults = () => {
			setFinishedTestId(null);
			setOpen(false);
		};

		// Result Dialog
		if (finishedTestId && !isDadlaga) {
			if (isLoadingResults) {
				return (
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger asChild>{triggerButton}</DialogTrigger>

						<DialogContent className="w-full sm:max-w-[550px] p-4 sm:p-6">
							<div className="flex flex-col justify-center items-center gap-4 py-10">
								<div className="flex size-16 items-center justify-center rounded-2xl bg-pop-violet-soft text-pop-violet-ink">
									<Loader2 className="size-8 animate-spin" strokeWidth={2.5} />
								</div>
							</div>
						</DialogContent>
					</Dialog>
				);
			}

			if (!resultInfo) {
				return (
					<Dialog open={true} onOpenChange={handleCloseResults}>
						<DialogContent className="w-full sm:max-w-[450px] p-6">
							<DialogHeader className="text-center sm:text-center items-center">
								<div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-destructive/10">
									<XCircle className="size-9 text-destructive" strokeWidth={2.5} />
								</div>
								<DialogTitle className="text-xl font-black">
									Үр дүн олдсонгүй
								</DialogTitle>
								<DialogDescription className="font-semibold">
									Мэдээлэл хоосон байна. Дахин оролдоно уу.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									onClick={handleCloseResults}
									className="w-full sm:w-auto"
								>
									Хаах
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				);
			}

			const isPassed = resultInfo.point_perc >= 60;
			const isExcellent = resultInfo.point_perc >= 90;

			return (
				<Dialog open={true} onOpenChange={handleCloseResults}>
					<DialogContent className="w-full sm:max-w-[550px] max-h-[92vh] overflow-y-auto p-0 gap-0">
						<div
							className={`relative overflow-hidden rounded-t-[inherit] px-5 pt-8 pb-6 sm:px-6 ${
								isExcellent
									? "bg-gradient-to-br from-pop-sun-soft to-pop-pink-soft"
									: isPassed
										? "bg-gradient-to-br from-pop-mint-soft to-pop-sky-soft"
										: "bg-gradient-to-br from-pop-violet-soft to-pop-sky-soft"
							}`}
						>
							<div className="pointer-events-none absolute inset-0 bg-dots opacity-60" />
							<span className="pointer-events-none absolute left-6 top-5 text-2xl animate-float">
								🎉
							</span>
							<span
								className="pointer-events-none absolute right-6 top-8 text-2xl animate-float"
								style={{ animationDelay: "0.6s" }}
							>
								✨
							</span>
							<DialogHeader className="relative text-center sm:text-center items-center space-y-3">
								<div
									className={`flex size-20 items-center justify-center rounded-3xl text-white animate-pop-in ${
										isExcellent
											? "bg-pop-sun shadow-[0_5px_0_0_color-mix(in_oklch,var(--pop-sun)_60%,black)]"
											: isPassed
												? "bg-pop-mint shadow-[0_5px_0_0_color-mix(in_oklch,var(--pop-mint)_60%,black)]"
												: "bg-pop-violet shadow-[0_5px_0_0_color-mix(in_oklch,var(--pop-violet)_60%,black)]"
									}`}
								>
									<Trophy
										className={`size-11 ${isExcellent ? "animate-wiggle" : ""}`}
										strokeWidth={2.5}
									/>
								</div>

								<div>
									<DialogTitle className="text-3xl sm:text-4xl font-black text-gradient">
										Сорилын үр дүн
									</DialogTitle>
									<DialogDescription className="text-base sm:text-lg font-bold text-foreground mt-2">
										{isExcellent
											? "🌟 Гайхалтай! Та маш сайн өгүүлэв!"
											: isPassed
												? "🎉 Баяр хүргэе! Та сорилд тэнцлээ!"
												: "💪 Дараагийн удаад амжилт хүсье!"}
									</DialogDescription>
								</div>
							</DialogHeader>
						</div>

						<div className="space-y-4 px-5 py-5 sm:px-6">
							<div
								className={`rounded-2xl border-2 p-5 ${
									isPassed
										? "border-success/40 bg-success/10"
										: "border-destructive/40 bg-destructive/10"
								}`}
							>
								<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
									<div className="flex items-center gap-3">
										<div
											className={`flex size-12 items-center justify-center rounded-2xl ${
												isPassed
													? "bg-success text-white"
													: "bg-destructive text-white"
											}`}
										>
											<Award className="size-6" strokeWidth={2.5} />
										</div>
										<div>
											<p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
												Нийт оноо
											</p>
											<p className="text-sm font-bold text-foreground">
												{resultInfo.point} / {resultInfo.ttl_point} оноо
											</p>
										</div>
									</div>
									<div
										className={`text-6xl font-black tracking-tight text-center sm:text-right tabular-nums ${
											isPassed ? "text-success" : "text-destructive"
										}`}
									>
										{resultInfo.point_perc}%
									</div>
								</div>
							</div>

							<div className="grid grid-cols-3 gap-2 sm:gap-3">
								<div className="rounded-2xl bg-pop-sky-soft p-3 sm:p-4 text-center">
									<Target className="w-6 h-6 mx-auto mb-1.5 text-pop-sky-ink" strokeWidth={2.5} />
									<p className="text-[11px] font-bold uppercase tracking-wide text-pop-sky-ink/80 mb-0.5">
										Нийт
									</p>
									<p className="text-2xl font-black text-pop-sky-ink">
										{resultInfo.test_ttl}
									</p>
								</div>

								<div className="rounded-2xl bg-pop-mint-soft p-3 sm:p-4 text-center">
									<CheckCircle className="w-6 h-6 mx-auto mb-1.5 text-pop-mint-ink" strokeWidth={2.5} />
									<p className="text-[11px] font-bold uppercase tracking-wide text-pop-mint-ink/80 mb-0.5">
										Зөв
									</p>
									<p className="text-2xl font-black text-pop-mint-ink">
										{resultInfo.correct_ttl}
									</p>
								</div>

								<div className="rounded-2xl bg-pop-coral-soft p-3 sm:p-4 text-center">
									<XCircle className="w-6 h-6 mx-auto mb-1.5 text-pop-coral-ink" strokeWidth={2.5} />
									<p className="text-[11px] font-bold uppercase tracking-wide text-pop-coral-ink/80 mb-0.5">
										Буруу
									</p>
									<p className="text-2xl font-black text-pop-coral-ink">
										{resultInfo.wrong_ttl}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3 rounded-2xl bg-pop-sun-soft p-4 text-sm">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pop-sun text-white">
									<Zap className="size-5" strokeWidth={2.5} />
								</div>
								<span className="font-bold text-pop-sun-ink">
									{resultInfo.unelgee}
								</span>
							</div>
						</div>

						<DialogFooter className="flex flex-col sm:flex-row gap-3 border-t-2 border-border px-5 py-4 sm:px-6">
							<Button
								variant="outline"
								onClick={() => router.push("/Lists/sorilResult")}
								className="flex-1 h-12"
							>
								Гарах
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			);
		}

		// Confirmation Dialog
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>{triggerButton}</DialogTrigger>

				<DialogContent className="w-full sm:max-w-[550px] max-h-[92vh] overflow-y-auto p-4 sm:p-6">
					<DialogHeader className="text-center sm:text-center items-center space-y-3">
						<div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-pop-violet-soft text-pop-violet-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_35%,transparent)]">
							<Flag className="size-8" strokeWidth={2.5} />
						</div>
						<DialogTitle className="text-2xl font-black">
							{isDadlaga ? "Дадлага дуусгах уу?" : "Сорилыг дуусгах уу?"}
						</DialogTitle>
						<DialogDescription className="font-semibold">
							{isDadlaga
								? "Дуусгасны дараа дадлага дууссан тул нүүр хуудас руу шилжих болно."
								: "Дуусгасны дараа хариултуудыг өөрчлөх боломжгүй болно."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="rounded-2xl border-2 border-border bg-muted/50 p-4">
							<div className="flex items-center justify-between mb-4">
								<span className="text-sm font-extrabold text-foreground flex items-center gap-2">
									<span className="flex size-8 items-center justify-center rounded-xl bg-pop-sky-soft text-pop-sky-ink">
										<Target className="size-4" strokeWidth={2.5} />
									</span>
									Нийт асуулт
								</span>
								<span className="text-3xl font-black text-pop-sky-ink">
									{totalCount}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-3 mb-4">
								<div className="flex items-center gap-3 rounded-2xl bg-pop-mint-soft p-3 sm:p-4">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pop-mint text-white">
										<CheckCircle className="size-5" strokeWidth={2.5} />
									</div>
									<div className="min-w-0">
										<p className="text-[11px] font-bold uppercase tracking-wide text-pop-mint-ink/80">
											Хариулсан
										</p>
										<p className="text-2xl font-black text-pop-mint-ink">
											{answeredCount}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3 rounded-2xl bg-pop-coral-soft p-3 sm:p-4">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pop-coral text-white">
										<XCircle className="size-5" strokeWidth={2.5} />
									</div>
									<div className="min-w-0">
										<p className="text-[11px] font-bold uppercase tracking-wide text-pop-coral-ink/80">
											Хариулаагүй
										</p>
										<p className="text-2xl font-black text-pop-coral-ink">
											{unansweredCount}
										</p>
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex justify-between text-sm font-bold text-muted-foreground">
									<span className="flex items-center gap-2">
										<Zap className="w-4 h-4 text-pop-sun" strokeWidth={2.5} />
										Гүйцэтгэл
									</span>
									<span className="font-black text-lg text-foreground">
										{progressPercentage}%
									</span>
								</div>
								<Progress value={progressPercentage} className="h-3" />
							</div>

							{/* ✅ НЭМЭГДСЭН: Үргэлжилсэн хугацааг харуулах */}
							<div className="mt-4 pt-4 border-t-2 border-dashed border-border">
								<div className="flex items-center justify-between gap-3">
									<span className="text-xs font-bold text-muted-foreground flex items-center gap-2">
										<Clock className="w-4 h-4 text-pop-sky-ink" strokeWidth={2.5} />
										Үргэлжилсэн хугацаа
									</span>
									<span className="rounded-full bg-pop-sky-soft px-3 py-1 text-sm font-extrabold text-pop-sky-ink text-right">
										{(() => {
											const h = Math.floor(elapsedSeconds / 3600);
											const m = Math.floor((elapsedSeconds % 3600) / 60);
											const s = elapsedSeconds % 60;
											if (h > 0) return `${h} цаг ${m} минут ${s} секунд`;
											if (m > 0) return `${m} минут ${s} секунд`;
											return `${s} секунд`;
										})()}
									</span>
								</div>
							</div>
						</div>

						{unansweredCount > 0 && (
							<div className="flex items-start gap-3 rounded-2xl border-2 border-warning/50 bg-warning/10 p-4">
								<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-xl">
									⚠️
								</div>
								<div className="flex-1">
									<p className="font-extrabold text-foreground text-sm mb-1">
										Анхааруулга
									</p>
									<p className="text-xs font-semibold text-muted-foreground">
										Танд {unansweredCount} хариулаагүй асуулт байна. Дуусгахаас
										өмнө шалгана уу.
									</p>
								</div>
							</div>
						)}
					</div>

					<DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-border">
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={finishMutation.isPending}
							className="flex-1 h-12"
						>
							Үгүй, буцах
						</Button>
						<Button
							onClick={handleFinish}
							disabled={finishMutation.isPending}
							variant="success"
							className="flex-1 h-12"
						>
							{finishMutation.isPending ? (
								<>
									<Loader2 className="h-5 w-5 animate-spin" />
									Дуусгаж байна...
								</>
							) : (
								<>
									<Send className="h-5 w-5" />
									Тийм, дуусгах
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
