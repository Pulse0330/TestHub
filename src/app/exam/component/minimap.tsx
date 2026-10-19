"use client";

import { Bookmark, CheckCircle2, X } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { AnswerValue } from "@/types/exam/exam";

interface ExamMinimapProps {
	totalCount: number;
	answeredCount: number;
	currentQuestionIndex: number;
	selectedAnswers: Record<number, AnswerValue>;
	questions: Array<{
		question_id: number;
		que_type_id: number;
		question_name?: string;
	}>;
	onQuestionClick: (index: number) => void;
	bookmarkedQuestions: Set<number>;
	isMobileOverlay?: boolean;
	onClose?: () => void;
}

// ✅ FIX 1: render бүрт new Set() үүсгэхгүй — module-level constant
const EMPTY_BOOKMARKS = new Set<number>();

const ExamMinimap = memo(function ExamMinimap({
	totalCount,
	answeredCount,
	currentQuestionIndex,
	selectedAnswers,
	questions,
	onQuestionClick,
	bookmarkedQuestions = EMPTY_BOOKMARKS,
	isMobileOverlay = false,
	onClose,
}: ExamMinimapProps) {
	// ✅ FIX 2: useCallback — render бүрт шинэ функц үүсгэхгүй
	const isQuestionAnswered = useCallback(
		(questionId: number): boolean => {
			const answer = selectedAnswers[questionId];
			if (Array.isArray(answer)) return answer.length > 0;
			if (typeof answer === "string") return answer.trim() !== "";
			if (typeof answer === "object" && answer !== null) {
				return Object.keys(answer).length > 0;
			}
			return answer !== null && answer !== undefined;
		},
		[selectedAnswers],
	);

	// ✅ FIX 3: stats-аас bookmarked тооцооллыг салга — тус бүр өөрийн dependency-тэй
	const bookmarkedCount = useMemo(
		() =>
			questions.filter((q) => bookmarkedQuestions.has(q.question_id)).length,
		[questions, bookmarkedQuestions],
	);

	const bookmarkedQuestionsArray = useMemo(
		() => questions.filter((q) => bookmarkedQuestions.has(q.question_id)),
		[questions, bookmarkedQuestions],
	);

	// ✅ bookmarkedQuestionsArray-аас index хайх O(n) → Map болгох
	const questionIndexMap = useMemo(() => {
		return new Map(questions.map((q, idx) => [q.question_id, idx]));
	}, [questions]);

	const _progressPercentage =
		totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

	const squareClass = (answered: boolean, isCurrent: boolean) =>
		`relative flex aspect-square w-full items-center justify-center rounded-xl text-sm font-black tabular-nums transition-all active:scale-90 ${
			answered
				? "bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--primary-shade)] hover:brightness-110"
				: "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
		} ${isCurrent ? "ring-4 ring-primary/30 ring-offset-2 ring-offset-card" : ""}`;

	if (isMobileOverlay) {
		return (
			<div className="fixed inset-0 z-50 flex items-end bg-foreground/40 animate-in fade-in duration-200">
				<div className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-2 border-b-0 border-border bg-card animate-in slide-in-from-bottom duration-300">
					<div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-border bg-card p-4">
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-lg">
								🧭
							</div>
							<div>
								<h3 className="text-lg font-black text-foreground">Асуултууд</h3>
								<p className="text-sm font-semibold text-muted-foreground">
									{answeredCount}/{totalCount} хариулсан
								</p>
							</div>
						</div>
						<Button
							onClick={onClose}
							variant="outline"
							size="icon"
							className="rounded-xl"
						>
							<X className="size-5" />
						</Button>
					</div>

					<div className="space-y-4 p-4">
						<div className="grid grid-cols-2 gap-3">
							<div className="rounded-2xl bg-pop-mint-soft p-3 text-center">
								<div className="text-2xl font-black text-pop-mint-ink">
									{answeredCount}
								</div>
								<div className="text-xs font-bold uppercase tracking-wide text-pop-mint-ink">
									Хариулсан
								</div>
							</div>
							<div className="rounded-2xl bg-pop-coral-soft p-3 text-center">
								<div className="text-2xl font-black text-pop-coral-ink">
									{totalCount - answeredCount}
								</div>
								<div className="text-xs font-bold uppercase tracking-wide text-pop-coral-ink">
									Үлдсэн
								</div>
							</div>
						</div>

						<div className="card-pop p-4">
							<div className="mb-3 flex items-center justify-between">
								<span className="text-sm font-extrabold text-foreground">
									Бүх асуултууд
								</span>
								<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
									{questions.length}
								</span>
							</div>
							<div className="grid grid-cols-5 gap-2.5">
								{questions.map((q, idx) => {
									const answered = isQuestionAnswered(q.question_id);
									const isBookmarked = bookmarkedQuestions.has(q.question_id);
									const isCurrent = currentQuestionIndex === idx;

									return (
										<button
											type="button"
											key={q.question_id}
											onClick={() => {
												onQuestionClick(idx);
												onClose?.();
											}}
											className={squareClass(answered, isCurrent)}
										>
											{idx + 1}
											{isBookmarked && (
												<span className="absolute -top-1.5 -right-1.5 z-10">
													<div className="rounded-full border-2 border-card bg-warning p-0.5">
														<Bookmark className="size-2.5 fill-current text-[color-mix(in_oklch,var(--warning)_22%,black)]" />
													</div>
												</span>
											)}
											{answered && (
												<CheckCircle2 className="absolute right-0.5 bottom-0.5 size-3 text-primary-foreground opacity-70" />
											)}
										</button>
									);
								})}
							</div>
						</div>

						{bookmarkedQuestionsArray.length > 0 && (
							<div className="rounded-2xl bg-pop-sun-soft p-4">
								<div className="mb-3 flex items-center gap-2">
									<Bookmark className="size-4 fill-current text-pop-sun-ink" />
									<span className="text-sm font-extrabold text-pop-sun-ink">
										Тэмдэглэсэн ({bookmarkedCount})
									</span>
								</div>
								<div className="flex flex-wrap gap-2">
									{bookmarkedQuestionsArray.map((q) => {
										// ✅ FIX 4: O(n) findIndex → O(1) Map.get()
										const questionIndex =
											questionIndexMap.get(q.question_id) ?? -1;
										return (
											<button
												type="button"
												key={q.question_id}
												onClick={() => {
													onQuestionClick(questionIndex);
													onClose?.();
												}}
												className="rounded-full border-2 border-warning bg-card px-3 py-1 text-sm font-bold text-pop-sun-ink transition-all hover:-translate-y-0.5 active:scale-95"
											>
												#{questionIndex + 1}
											</button>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	// Desktop Version
	return (
		<div className="w-full space-y-3">
			<div className="card-pop overflow-hidden">
				<div className="@container p-4">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-sm font-extrabold text-foreground">
							Асуултууд
						</span>
						<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
							{questions.length}
						</span>
					</div>
					<div className="grid grid-cols-5 gap-2 @xs:grid-cols-6 @md:grid-cols-8 @2xl:grid-cols-10">
						{questions.map((q, idx) => {
							const answered = isQuestionAnswered(q.question_id);
							const isBookmarked = bookmarkedQuestions.has(q.question_id);
							const isCurrent = currentQuestionIndex === idx;

							return (
								<button
									type="button"
									key={q.question_id}
									onClick={() => onQuestionClick(idx)}
									className={squareClass(answered, isCurrent)}
								>
									{idx + 1}
									{isBookmarked && (
										<span className="absolute -top-1.5 -right-1.5 z-10">
											<div className="rounded-full border-2 border-card bg-warning p-0.5">
												<Bookmark className="size-2 fill-current text-[color-mix(in_oklch,var(--warning)_22%,black)]" />
											</div>
										</span>
									)}
									{answered && (
										<CheckCircle2 className="absolute right-0.5 bottom-0.5 size-2.5 text-primary-foreground opacity-70" />
									)}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2">
				<div className="rounded-2xl bg-pop-mint-soft p-3 text-center">
					<div className="text-2xl font-black text-pop-mint-ink">
						{answeredCount}
					</div>
					<div className="text-[10px] font-bold uppercase tracking-wide text-pop-mint-ink sm:text-xs">
						Хариулсан
					</div>
				</div>
				<div className="rounded-2xl bg-pop-coral-soft p-3 text-center">
					<div className="text-2xl font-black text-pop-coral-ink">
						{totalCount - answeredCount}
					</div>
					<div className="text-[10px] font-bold uppercase tracking-wide text-pop-coral-ink sm:text-xs">
						Үлдсэн
					</div>
				</div>
			</div>

			{bookmarkedQuestionsArray.length > 0 && (
				<div className="overflow-hidden rounded-2xl bg-pop-sun-soft">
					<div className="p-3">
						<div className="mb-2 flex items-center gap-1.5">
							<Bookmark className="size-3.5 fill-current text-pop-sun-ink" />
							<span className="text-xs font-extrabold text-pop-sun-ink">
								Тэмдэглэсэн ({bookmarkedCount})
							</span>
						</div>
						<div className="flex flex-wrap gap-1.5">
							{bookmarkedQuestionsArray.map((q) => {
								// ✅ FIX 4: O(n) findIndex → O(1) Map.get()
								const questionIndex = questionIndexMap.get(q.question_id) ?? -1;
								return (
									<button
										type="button"
										key={q.question_id}
										onClick={() => onQuestionClick(questionIndex)}
										className="rounded-full border-2 border-warning bg-card px-2.5 py-0.5 text-xs font-bold text-pop-sun-ink transition-all hover:-translate-y-0.5 active:scale-95"
									>
										#{questionIndex + 1}
									</button>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</div>
	);
});

export default ExamMinimap;
