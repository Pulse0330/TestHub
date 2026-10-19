"use client";

import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	Dumbbell,
	Flag,
	ListChecks,
	RotateCcw,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import StyledBackButton from "@/components/backButton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { gettTestFill } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ExamFinishResponse } from "@/types/exercise/testGetFill";
import type { SelectedAnswer } from "./component/questionItem";
import QuestionItem from "./component/questionItem";

export default function ExercisePage() {
	const { userId } = useAuthStore();
	const router = useRouter();
	const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswer[]>([]);
	const [submittedQuestions, setSubmittedQuestions] = useState<Set<number>>(
		new Set(),
	);

	const { data, isLoading } = useQuery<ExamFinishResponse>({
		queryKey: ["testFill", userId],
		queryFn: () => gettTestFill(userId || 0),
		enabled: !!userId,
	});

	const { examInfo, questions, answers, choosedAnswers } = useMemo(
		() => ({
			examInfo: data?.ExamInfo?.[0],
			questions: data?.Questions || [],
			answers: data?.Answers || [],
			choosedAnswers: data?.ChoosedAnswer || [],
		}),
		[data],
	);

	// Focus mode UI state
	const [currentIndex, setCurrentIndex] = useState(0);
	const [showSummary, setShowSummary] = useState(false);

	const answeredCount = useMemo(
		() => selectedAnswers.length,
		[selectedAnswers],
	);

	// answers өөрчлөгдөхөд л дахин тооцно, selectedAnswers өөрчлөгдөхөд биш
	const getQuestionAnswers = useCallback(
		(questionId: number) => {
			const filtered = answers.filter((a) => a.question_id === questionId);
			const unique = filtered.filter(
				(answer, index, self) =>
					index === self.findIndex((a) => a.answer_id === answer.answer_id),
			);
			return unique
				.sort((a, b) => {
					if (a.refid === undefined || b.refid === undefined) return 0;
					return a.refid - b.refid;
				})
				.map((a) => ({
					answer_id: a.answer_id,
					question_id: a.question_id,
					answer_name: a.answer_name || "",
					answer_name_html: a.answer_name_html,
					answer_descr: a.answer_descr || "",
					answer_img: a.answer_img || undefined,
					answer_type: a.answer_type,
					refid: a.refid,
					// CHANGE THIS: Ensure it's a number to match ConvertedAnswer
					ref_child_id: a.ref_child_id !== null ? Number(a.ref_child_id) : null,
					is_true: a.is_true === 1,
				}));
		},
		[answers],
	);

	// ─── Answer handlers ────────────────────────────────────────────────────────

	const handleSingleSelect = useCallback(
		(questionId: number, answerId: number | null) => {
			setSelectedAnswers((prev) => {
				const filtered = prev.filter((a) => a.questionId !== questionId);
				return answerId
					? [...filtered, { questionId, answerIds: [answerId] }]
					: filtered;
			});
		},
		[],
	);

	const handleMultiSelect = useCallback(
		(questionId: number, answerIds: number[]) => {
			setSelectedAnswers((prev) => {
				const filtered = prev.filter((a) => a.questionId !== questionId);
				return answerIds.length > 0
					? [...filtered, { questionId, answerIds }]
					: filtered;
			});
		},
		[],
	);

	const handleFillInBlank = useCallback((questionId: number, text: string) => {
		setSelectedAnswers((prev) => {
			const filtered = prev.filter((a) => a.questionId !== questionId);
			return text.trim()
				? [...filtered, { questionId, answerIds: [], textAnswer: text }]
				: filtered;
		});
	}, []);

	const handleOrdering = useCallback(
		(questionId: number, orderedIds: number[]) => {
			setSelectedAnswers((prev) => {
				const filtered = prev.filter((a) => a.questionId !== questionId);
				return orderedIds.length > 0
					? [...filtered, { questionId, answerIds: [], order: orderedIds }]
					: filtered;
			});
		},
		[],
	);

	const handleMatching = useCallback(
		(
			questionId: number,
			matches: Record<number, number | string | number[]>,
		) => {
			setSelectedAnswers((prev) => {
				const filtered = prev.filter((a) => a.questionId !== questionId);
				return Object.keys(matches).length > 0
					? [...filtered, { questionId, answerIds: [], matches }]
					: filtered;
			});
		},
		[],
	);

	// selectedAnswers-г dependency-д оруулахгүйн тулд setSelectedAnswers(prev => ...) ашигладаг
	const handleSubmitQuestion = useCallback((questionId: number) => {
		setSelectedAnswers((prev) => {
			const selected = prev.find((a) => a.questionId === questionId);
			if (
				selected &&
				(selected.order?.length || Object.keys(selected.matches || {}).length)
			) {
				setSubmittedQuestions((s) => new Set(s).add(questionId));
			}
			return prev; // state өөрчлөхгүй, зөвхөн уншина
		});
	}, []);

	const handleRestart = useCallback((questionId: number) => {
		setSubmittedQuestions((prev) => {
			const newSet = new Set(prev);
			newSet.delete(questionId);
			return newSet;
		});
	}, []);

	// ─── Focus mode: derived status + navigation ────────────────────────────────

	const questionStatus = useMemo(() => {
		const map = new Map<
			number,
			"unanswered" | "answered" | "correct" | "wrong"
		>();
		for (const q of questions) {
			const sel = selectedAnswers.find((a) => a.questionId === q.question_id);
			if (!sel) {
				map.set(q.question_id, "unanswered");
				continue;
			}
			const type = Number(q.que_type_id);
			if (type === 1 || type === 2) {
				const qa = getQuestionAnswers(q.question_id);
				const trueIds = qa.filter((a) => a.is_true).map((a) => a.answer_id);
				if (trueIds.length === 0) {
					map.set(q.question_id, "answered");
					continue;
				}
				const ok =
					sel.answerIds.length === trueIds.length &&
					sel.answerIds.every((id) => trueIds.includes(id));
				map.set(q.question_id, ok ? "correct" : "wrong");
			} else {
				map.set(q.question_id, "answered");
			}
		}
		return map;
	}, [questions, selectedAnswers, getQuestionAnswers]);

	const statusCounts = useMemo(() => {
		let correct = 0;
		let wrong = 0;
		for (const st of questionStatus.values()) {
			if (st === "correct") correct++;
			else if (st === "wrong") wrong++;
		}
		return { correct, wrong };
	}, [questionStatus]);

	const lastIndex = Math.max(0, questions.length - 1);
	const safeIndex = Math.min(currentIndex, lastIndex);

	const goTo = useCallback(
		(index: number) => {
			setShowSummary(false);
			setCurrentIndex(Math.max(0, Math.min(lastIndex, index)));
			if (typeof window !== "undefined") {
				window.scrollTo({ top: 0, behavior: "smooth" });
			}
		},
		[lastIndex],
	);

	const goPrev = useCallback(() => {
		if (showSummary) {
			setShowSummary(false);
			return;
		}
		goTo(safeIndex - 1);
	}, [showSummary, safeIndex, goTo]);

	const goNext = useCallback(() => {
		if (showSummary) return;
		if (safeIndex >= lastIndex) {
			setShowSummary(true);
			if (typeof window !== "undefined") {
				window.scrollTo({ top: 0, behavior: "smooth" });
			}
			return;
		}
		goTo(safeIndex + 1);
	}, [showSummary, safeIndex, lastIndex, goTo]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.altKey || e.ctrlKey || e.metaKey) return;
			const target = e.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.tagName === "SELECT" ||
					target.isContentEditable)
			) {
				return;
			}
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				goPrev();
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				goNext();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [goPrev, goNext]);

	// ─── Loading / Error states ──────────────────────────────────────────────────

	if (!userId) {
		return (
			<div className="min-h-[70vh] flex items-center justify-center p-4">
				<div className="card-pop p-8 max-w-md w-full text-center animate-pop-in">
					<div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-pop-violet-soft text-4xl">
						🔒
					</div>
					<h2 className="text-xl font-black text-foreground mb-2">
						Нэвтрэх шаардлагатай
					</h2>
					<p className="font-semibold text-muted-foreground">
						Энэ хуудсыг үзэхийн тулд эхлээд нэвтэрнэ үү.
					</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-[70vh] flex items-center justify-center p-4">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full size-16 border-[5px] border-pop-mint border-t-transparent mb-4" />
					<p className="text-lg font-bold text-muted-foreground">
						Дасгал ачааллаж байна...
					</p>
				</div>
			</div>
		);
	}

	if (!examInfo || questions.length === 0) {
		return (
			<div className="min-h-[70vh] flex items-center justify-center p-4">
				<div className="card-pop p-8 sm:p-12 max-w-md w-full text-center animate-pop-in">
					<div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-full bg-pop-mint-soft text-5xl animate-float">
						🧩
					</div>
					<h3 className="text-xl font-black text-foreground mb-2">
						Дасгал олдсонгүй
					</h3>
					<p className="font-semibold text-muted-foreground mb-6">
						Эхлээд тестийн бүлгээс тест сонгоно уу.
					</p>
					<Button
						onClick={() => router.push("/Lists/testGroup")}
						size="lg"
						className="w-full"
					>
						Тест сонгох
					</Button>
				</div>
			</div>
		);
	}

	const progressValue =
		questions.length > 0
			? Math.min(100, Math.round((answeredCount / questions.length) * 100))
			: 0;

	const currentQuestion = questions[safeIndex];
	const positionValue = showSummary
		? 100
		: Math.round(((safeIndex + 1) / questions.length) * 100);
	const unansweredCount = questions.length - answeredCount;

	return (
		<div className="min-h-screen pb-10">
			<div className="max-w-3xl mx-auto">
				{/* Compact header + progress */}
				<div className="mb-4 sm:mb-6 card-pop p-4 sm:p-5">
					<div className="flex items-start gap-3 sm:gap-4">
						<div className="shrink-0">
							<StyledBackButton
								variant="default"
								showIcon={true}
								showConfirm={true}
								confirmTitle="Дасгалаас гарах уу?"
								confirmMessage="Таны өгсөн хариултууд хадгалагдахгүй байж болно. Та итгэлтэй байна уу?"
								ariaLabel="Дасгалын жагсаалт руу буцах"
							/>
						</div>
						<div
							className="hidden sm:flex size-12 shrink-0 items-center justify-center rounded-2xl bg-pop-mint-soft text-pop-mint-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-mint)_35%,transparent)]"
							aria-hidden="true"
						>
							<Dumbbell className="size-6" strokeWidth={2.5} />
						</div>
						<div className="min-w-0 flex-1">
							<h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-foreground break-words">
								{examInfo.title}
							</h1>
							<div className="mt-2 flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center gap-1.5 rounded-full bg-pop-violet-soft px-3 py-1 text-xs sm:text-sm font-bold text-pop-violet-ink">
									{examInfo.exam_type_name}
								</span>
								<span className="inline-flex items-center gap-1.5 rounded-full bg-pop-sky-soft px-3 py-1 text-xs sm:text-sm font-bold text-pop-sky-ink">
									<ListChecks className="size-3.5" strokeWidth={2.5} />
									{questions.length} асуулт
								</span>
								<span className="inline-flex items-center gap-1.5 rounded-full bg-pop-mint-soft px-3 py-1 text-xs sm:text-sm font-bold text-pop-mint-ink">
									<CheckCircle2 className="size-3.5" strokeWidth={2.5} />
									{answeredCount} хариулт өгсөн
								</span>
							</div>
						</div>
					</div>

					{/* Position progress */}
					<div className="mt-4 flex items-center gap-3">
						<Progress
							value={positionValue}
							className="h-3 flex-1"
							aria-label="Асуултын байрлал"
						/>
						<span className="shrink-0 text-sm font-black tabular-nums text-foreground">
							{showSummary ? questions.length : safeIndex + 1}
							<span className="text-muted-foreground">/{questions.length}</span>
						</span>
					</div>
					<Progress
						value={progressValue}
						className="mt-2 h-1.5 [&>[data-slot=progress-indicator]]:bg-pop-mint"
						aria-label="Хариулсан асуултын явц"
					/>

					{/* Question navigator */}
					<div
						className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-none pb-1"
						role="tablist"
						aria-label="Асуултууд"
					>
						{questions.map((q, i) => {
							const st = questionStatus.get(q.question_id);
							const isCurrent = !showSummary && i === safeIndex;
							return (
								<button
									key={q.question_id}
									type="button"
									role="tab"
									aria-selected={isCurrent}
									aria-label={`${i + 1}-р асуулт`}
									onClick={() => goTo(i)}
									className={cn(
										"flex size-8 shrink-0 items-center justify-center rounded-xl border-2 text-xs font-black tabular-nums transition-colors",
										st === "correct" &&
											"border-success bg-success/10 text-success",
										st === "wrong" &&
											"border-destructive bg-destructive/10 text-destructive",
										st === "answered" &&
											"border-pop-mint bg-pop-mint-soft text-pop-mint-ink",
										st === "unanswered" &&
											"border-border bg-card text-muted-foreground",
										isCurrent &&
											"ring-2 ring-primary ring-offset-2 ring-offset-card",
									)}
								>
									{i + 1}
								</button>
							);
						})}
						<button
							type="button"
							role="tab"
							aria-selected={showSummary}
							aria-label="Хураангуй"
							onClick={() => {
								setShowSummary(true);
							}}
							className={cn(
								"flex size-8 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-card text-muted-foreground",
								showSummary &&
									"ring-2 ring-primary ring-offset-2 ring-offset-card text-primary",
							)}
						>
							<Flag className="size-3.5" strokeWidth={2.75} />
						</button>
					</div>
				</div>

				{showSummary ? (
					/* Final summary */
					<div className="card-pop overflow-hidden animate-pop-in">
						<div className="bg-gradient-to-br from-pop-violet to-pop-pink p-6 sm:p-8 text-center text-primary-foreground">
							<div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-card/20 text-4xl animate-float">
								{unansweredCount === 0 ? "🎉" : "📋"}
							</div>
							<p className="text-4xl sm:text-5xl font-black tabular-nums">
								{answeredCount}
								<span className="text-2xl sm:text-3xl opacity-80">
									/{questions.length}
								</span>
							</p>
							<p className="mt-1 font-bold opacity-90">хариулт өгсөн</p>
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6">
							<div className="rounded-2xl bg-pop-mint-soft p-4">
								<p className="text-2xl font-black text-pop-mint-ink tabular-nums">
									{answeredCount}
								</p>
								<p className="text-xs font-bold uppercase tracking-wide text-pop-mint-ink">
									Хариулсан
								</p>
							</div>
							<div className="rounded-2xl bg-pop-sun-soft p-4">
								<p className="text-2xl font-black text-pop-sun-ink tabular-nums">
									{unansweredCount}
								</p>
								<p className="text-xs font-bold uppercase tracking-wide text-pop-sun-ink">
									Хариулаагүй
								</p>
							</div>
							<div className="rounded-2xl bg-success/10 p-4">
								<p className="text-2xl font-black text-success tabular-nums">
									{statusCounts.correct}
								</p>
								<p className="text-xs font-bold uppercase tracking-wide text-success">
									Зөв
								</p>
							</div>
							<div className="rounded-2xl bg-destructive/10 p-4">
								<p className="text-2xl font-black text-destructive tabular-nums">
									{statusCounts.wrong}
								</p>
								<p className="text-xs font-bold uppercase tracking-wide text-destructive">
									Буруу
								</p>
							</div>
						</div>
						<p className="px-4 sm:px-6 text-xs font-semibold text-muted-foreground">
							Зөв/буруу нь сонголттой асуултаар тооцогдоно. Дугаар дээр дарж
							асуулт руу буцна уу.
						</p>
						<div className="flex flex-wrap gap-2 p-4 sm:p-6">
							{questions.map((q, i) => {
								const st = questionStatus.get(q.question_id);
								return (
									<button
										key={q.question_id}
										type="button"
										onClick={() => goTo(i)}
										aria-label={`${i + 1}-р асуулт руу очих`}
										className={cn(
											"flex size-10 items-center justify-center rounded-xl border-2 text-sm font-black tabular-nums lift",
											st === "correct" &&
												"border-success bg-success/10 text-success",
											st === "wrong" &&
												"border-destructive bg-destructive/10 text-destructive",
											st === "answered" &&
												"border-pop-mint bg-pop-mint-soft text-pop-mint-ink",
											st === "unanswered" &&
												"border-border bg-card text-muted-foreground",
										)}
									>
										{i + 1}
									</button>
								);
							})}
						</div>
						<div className="p-4 sm:p-6 pt-0 sm:pt-0">
							<Button
								variant="outline"
								size="lg"
								className="w-full"
								onClick={() => {
									const firstOpen = questions.findIndex(
										(q) =>
											questionStatus.get(q.question_id) === "unanswered",
									);
									goTo(firstOpen >= 0 ? firstOpen : 0);
								}}
							>
								<RotateCcw className="size-4" strokeWidth={2.75} />
								{unansweredCount > 0
									? "Хариулаагүй асуулт руу очих"
									: "Эхнээс нь харах"}
							</Button>
						</div>
					</div>
				) : (
					currentQuestion && (
						<div key={currentQuestion.question_id}>
							{/* Instant feedback banner (single/multi select) */}
							{(() => {
								const st = questionStatus.get(currentQuestion.question_id);
								if (st === "correct")
									return (
										<div className="mb-3 flex items-center gap-2 rounded-2xl border-2 border-success bg-success/10 px-4 py-2.5 font-extrabold text-success animate-pop-in">
											<CheckCircle2 className="size-5" strokeWidth={2.75} />
											Зөв хариулт!
										</div>
									);
								if (st === "wrong")
									return (
										<div className="mb-3 flex items-center gap-2 rounded-2xl border-2 border-destructive bg-destructive/10 px-4 py-2.5 font-extrabold text-destructive animate-pop-in">
											<XCircle className="size-5" strokeWidth={2.75} />
											Буруу хариулт
										</div>
									);
								return null;
							})()}
							<QuestionItem
								question={currentQuestion}
								index={safeIndex}
								questionAnswers={getQuestionAnswers(currentQuestion.question_id)}
								selected={selectedAnswers.find(
									(a) => a.questionId === currentQuestion.question_id,
								)}
								bodolt={choosedAnswers.find(
									(c) => c.question_id === currentQuestion.question_id,
								)}
								isSubmitted={submittedQuestions.has(currentQuestion.question_id)}
								onSingleSelect={handleSingleSelect}
								onMultiSelect={handleMultiSelect}
								onFillInBlank={handleFillInBlank}
								onOrdering={handleOrdering}
								onMatching={handleMatching}
								onSubmit={handleSubmitQuestion}
								onRestart={handleRestart}
							/>
						</div>
					)
				)}

				{/* Sticky prev / next */}
				<div className="sticky bottom-24 lg:bottom-6 z-40 mt-6">
					<div className="card-pop flex items-center gap-2 p-2">
						<Button
							variant="outline"
							size="lg"
							onClick={goPrev}
							disabled={!showSummary && safeIndex === 0}
							className="flex-1 sm:flex-none"
							aria-label="Өмнөх асуулт (←)"
						>
							<ArrowLeft className="size-4" strokeWidth={2.75} />
							Өмнөх
						</Button>
						<p className="hidden sm:block flex-1 text-center text-xs font-bold text-muted-foreground">
							← → товчоор шилжинэ
						</p>
						{showSummary ? (
							<Button
								size="lg"
								onClick={() => goTo(0)}
								className="flex-1 sm:flex-none"
							>
								<RotateCcw className="size-4" strokeWidth={2.75} />
								Эхнээс
							</Button>
						) : (
							<Button
								size="lg"
								variant={safeIndex >= lastIndex ? "success" : "default"}
								onClick={goNext}
								className="flex-1 sm:flex-none"
								aria-label="Дараагийн асуулт (→)"
							>
								{safeIndex >= lastIndex ? (
									<>
										<Flag className="size-4" strokeWidth={2.75} />
										Дуусгах
									</>
								) : (
									<>
										Дараах
										<ArrowRight className="size-4" strokeWidth={2.75} />
									</>
								)}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
