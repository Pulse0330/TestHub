"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { memo, useCallback, useRef } from "react";
import QuestionImage from "@/app/exam/component/question/questionImage";
import { MathContent } from "./matContent";

interface AnswerData {
	answer_id: number;
	answer_name_html: string;
	answer_img?: string;
	is_true?: boolean;
	refid?: number;
}

interface SingleSelectQuestionProps {
	questionId: number;
	questionText?: string;
	questionImage?: string;
	answers: AnswerData[];
	mode: "exam" | "review";
	selectedAnswer?: number | null;
	correctAnswerId?: number | null;
	onAnswerChange?: (questionId: number, answerId: number | null) => void;
}

function SingleSelectQuestion({
	questionId,
	questionImage,
	answers,
	mode,
	selectedAnswer,
	correctAnswerId,
	onAnswerChange,
}: SingleSelectQuestionProps) {
	const isReviewMode = mode === "review";
	const showAnswerFeedback = mode === "exam" && selectedAnswer !== null;

	// Ref ашиглан stale closure-аас сэргийлсэн handleSelect
	const selectedAnswerRef = useRef(selectedAnswer);
	selectedAnswerRef.current = selectedAnswer;

	const handleSelect = useCallback(
		(answerId: number) => {
			if (isReviewMode || !onAnswerChange) return;
			// toggle logic
			const newValue = selectedAnswer === answerId ? null : answerId;
			onAnswerChange(questionId, newValue);
		},
		[questionId, isReviewMode, onAnswerChange, selectedAnswer], // dependency-д нэмэх
	);

	return (
		<div className="space-y-3 sm:space-y-4 w-full">
			{questionImage && (
				<div className="mb-4 flex justify-center">
					<div className="w-full max-w-md">
						<QuestionImage src={questionImage} alt="Асуултын зураг" />
					</div>
				</div>
			)}

			<div className="space-y-2.5 sm:space-y-3">
				<p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs sm:text-sm font-bold text-muted-foreground">
					Нэг хариулт сонгоно уу
				</p>

				{answers.map((option, optionIndex) => {
					const isSelected = selectedAnswer === option.answer_id;
					const isCorrect =
						option.is_true || correctAnswerId === option.answer_id;
					const hasContent = !!option.answer_name_html;
					const imageUrl = option.answer_img;
					const letter = String.fromCharCode(65 + optionIndex);

					const colorClass = isReviewMode
						? isCorrect
							? "border-success bg-success/10 shadow-[0_4px_0_0_var(--success)]"
							: isSelected
								? "border-destructive bg-destructive/10 shadow-[0_4px_0_0_var(--destructive)]"
								: "border-border bg-card shadow-[0_4px_0_0_var(--border)]"
						: showAnswerFeedback
							? isSelected
								? isCorrect
									? "border-success bg-success/10 shadow-[0_4px_0_0_var(--success)]"
									: "border-destructive bg-destructive/10 shadow-[0_4px_0_0_var(--destructive)] animate-wiggle"
								: isCorrect
									? "border-success/60 bg-success/5 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_45%,transparent)]"
									: "border-border bg-card shadow-[0_4px_0_0_var(--border)]"
							: isSelected
								? "border-primary bg-primary/10 text-primary shadow-[0_4px_0_0_var(--primary)]"
								: "border-border bg-card shadow-[0_4px_0_0_var(--border)] hover:border-primary/40 hover:bg-accent/40 hover:-translate-y-0.5";

					const badgeClass =
						isReviewMode || showAnswerFeedback
							? isCorrect && (isSelected || isReviewMode || showAnswerFeedback)
								? isSelected || isReviewMode
									? "border-success bg-success text-primary-foreground"
									: "border-success text-success bg-card"
								: isSelected
									? "border-destructive bg-destructive text-primary-foreground"
									: "border-border bg-muted text-muted-foreground"
							: isSelected
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-muted text-muted-foreground group-hover:border-primary/40 group-hover:text-primary";

					return (
						<label
							key={option.answer_id}
							className={`group relative flex flex-col w-full rounded-2xl border-2 font-bold transition-all duration-150 text-left overflow-hidden has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20 ${colorClass} ${
								isReviewMode
									? "cursor-default"
									: "active:translate-y-0.5 active:shadow-none cursor-pointer"
							}`}
						>
							{/* ✅ Visually hidden native radio — a11y + keyboard free */}
							<input
								type="radio"
								name={`question-${questionId}`}
								value={option.answer_id}
								checked={isSelected}
								disabled={isReviewMode}
								onChange={() => handleSelect(option.answer_id)}
								className="sr-only"
							/>

							{/* Дээд хэсэг */}
							<div className="flex items-start sm:items-center gap-3 p-3 sm:p-4 w-full">
								<div className="shrink-0">
									<div
										className={`size-8 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-colors ${badgeClass}`}
										aria-hidden="true"
									>
										{letter}
									</div>
								</div>

								{hasContent && (
									<div className="flex-1 min-w-0 text-sm sm:text-base font-bold leading-relaxed">
										<div className="flex-1 min-w-0 text-sm sm:text-base font-bold leading-relaxed">
											<div className="math-container block w-full">
												{/* option.answer_id-г key болгож өгөх нь маш чухал */}
												<MathContent
													// Маш чухал: key дотор isSelected-ийг оруулснаар
													// сонголт хийх үед компонентыг хүчээр дахин "мэндлүүлнэ"
													key={`${option.answer_id}-${isSelected}`}
													html={option.answer_name_html}
												/>
											</div>
										</div>
									</div>
								)}

								{(isReviewMode || showAnswerFeedback) && (
									<div className="shrink-0 ml-auto self-start sm:self-center">
										{isCorrect ? (
											<div className="flex items-center gap-1.5 text-success animate-pop-in">
												<CheckCircle2
													className="size-6 sm:size-7"
													strokeWidth={2.75}
												/>
												{!isReviewMode && (
													<span className="hidden sm:inline text-xs font-bold uppercase"></span>
												)}
											</div>
										) : isSelected ? (
											<XCircle
												className="text-destructive size-6 sm:size-7 animate-pop-in"
												strokeWidth={2.75}
											/>
										) : null}
									</div>
								)}
							</div>

							{imageUrl && (
								<div className="px-3 sm:px-4 pb-3 sm:pb-4 flex justify-center">
									<div className="w-full max-w-xs overflow-hidden rounded-xl">
										<QuestionImage src={imageUrl} alt="Хариултын зураг" />
									</div>
								</div>
							)}

							{!hasContent && !imageUrl && (
								<div className="px-14 pb-4 text-xs font-semibold text-muted-foreground italic">
									Хоосон хариулт
								</div>
							)}
						</label>
					);
				})}
			</div>
		</div>
	);
}

export default memo(SingleSelectQuestion);
