"use client";

import { memo, useCallback, useRef } from "react";
import MathContent from "../examUtils/MathContent";
import QuestionImage from "./questionImage";

interface AnswerData {
	answer_id: number;
	answer_name?: string;
	answer_name_html?: string;
	answer_img?: string;
	source_img?: string;
	is_true?: boolean;
}

interface SingleSelectQuestionProps {
	questionId: number;
	questionText?: string;
	questionImage?: string;
	answers: AnswerData[];
	selectedAnswer?: number | null;
	onAnswerChange?: (questionId: number, answerId: number) => void; // ✅ null хасав — parent шийдэх
	/** true үед сонголт өөрчлөх боломжгүй (цаг дууссан г.м.) */
	disabled?: boolean;
}

function SingleSelectQuestion({
	questionId,
	questionImage,
	answers,
	selectedAnswer,
	onAnswerChange,
	disabled = false,
}: SingleSelectQuestionProps) {
	// ✅ Ref — стale closure-аас хамгаалах
	const selectedAnswerRef = useRef(selectedAnswer);
	selectedAnswerRef.current = selectedAnswer;

	const handleSelect = useCallback(
		(answerId: number) => {
			if (!onAnswerChange || disabled) return;
			// ✅ Ref-ээс уншина — үргэлж шинэ утга
			if (selectedAnswerRef.current === answerId) return; // toggle хийхгүй — parent шийдэх
			onAnswerChange(questionId, answerId);
		},
		[questionId, onAnswerChange, disabled], // ✅ selectedAnswer dependency хасагдсан
	);

	return (
		<div className="w-full space-y-4">
			{questionImage && (
				<div className="mb-4 flex justify-center">
					<div className="w-full max-w-md">
						<QuestionImage src={questionImage} alt="Асуултын зураг" />
					</div>
				</div>
			)}
			<div className="space-y-2.5">
				<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
					Нэг хариулт сонгох боломжтой
				</p>
				{/* Хариултууд 2 баганаар (утсан дээр 1) */}
				<div className="grid gap-2.5 sm:grid-cols-2">
					{answers.map((option, idx) => {
						const isSelected = selectedAnswer === option.answer_id;
						const hasContent = option.answer_name_html || option.answer_name;
						const hasImage = option.answer_img || option.source_img;
						const imageUrl = option.answer_img || option.source_img;

						return (
							<div
								key={option.answer_id}
								className={`relative h-full w-full overflow-hidden rounded-2xl border transition-colors duration-150 ${
									isSelected
										? "border-primary/30 bg-primary-soft/25 text-foreground"
										: "border-border/70 bg-card hover:border-primary/25 hover:bg-muted/40"
								}`}
							>
								<button
									type="button"
									onClick={() => handleSelect(option.answer_id)}
									disabled={disabled}
									className="flex h-full w-full cursor-pointer items-start gap-3 border-0 bg-transparent p-3.5 text-left font-semibold disabled:cursor-not-allowed sm:p-4"
									// ✅ Давхар дарахаас хамгаалах
									aria-pressed={isSelected}
								>
									<span
										className={`flex size-8 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black transition-all ${
											isSelected
												? "border-transparent bg-primary-soft/70 text-primary-soft-foreground"
												: "border-transparent bg-muted text-muted-foreground"
										}`}
									>
										{String.fromCharCode(65 + idx)}
									</span>
									<div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden pt-0.5">
										{hasContent && (
											<div
												className={`w-full text-left text-sm sm:text-base ${
													isSelected ? "text-foreground" : "text-foreground"
												}`}
												style={{ lineHeight: "1.8" }}
											>
												{option.answer_name_html ? (
													<MathContent html={option.answer_name_html} />
												) : (
													<span>{option.answer_name}</span>
												)}
											</div>
										)}
										{!hasImage && !hasContent && (
											<span className="text-sm font-semibold italic text-muted-foreground">
												Хариулт байхгүй
											</span>
										)}
									</div>
								</button>
								{hasImage && imageUrl && (
									<div className="flex justify-center px-3 pb-3 sm:px-4 sm:pb-4">
										<div className="w-full max-w-xs">
											<QuestionImage src={imageUrl} alt="Хариултын зураг" />
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default memo(
	SingleSelectQuestion,
	(prev, next) =>
		// ✅ Зөвхөн шаардлагатай prop өөрчлөгдөхөд re-render
		prev.selectedAnswer === next.selectedAnswer &&
		prev.questionId === next.questionId &&
		prev.answers === next.answers &&
		prev.onAnswerChange === next.onAnswerChange &&
		prev.disabled === next.disabled,
);
