"use client";

import { memo } from "react";
import type { AnswerReviewProps } from "./types";

/** Тоо оруулах асуулт (que_type_id === 3). */
export const FillInReview = memo(function FillInReview({
	questionAnswers,
	userSelectedAnswers,
	showTrueAns,
}: AnswerReviewProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-3">
				{questionAnswers.map((answer) => {
					const userInput = userSelectedAnswers.find(
						(ua) => ua.answer_id === answer.answer_id,
					);
					const correctAnswer = answer.answer_name_html || answer.answer_name;
					const isCorrect = userInput?.answer === correctAnswer;

					return (
						<div
							key={answer.answer_id}
							className={`relative flex flex-wrap items-center gap-3 rounded-2xl border-2 p-4 transition-all duration-300 ${
								userInput
									? isCorrect
										? "border-success bg-success/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_35%,transparent)]"
										: "border-destructive bg-destructive/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_35%,transparent)]"
									: "border-dashed border-pop-sun bg-pop-sun-soft"
							}`}
						>
							{/* Асуултын label ба зураг */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-4">
									{/* answer_name (a, b, c label) */}
									{answer.answer_name && answer.answer_name.trim() !== "" && (
										<div className="text-base font-extrabold text-muted-foreground">
											{answer.answer_name} =
										</div>
									)}

									{/* Хэрэглэгчийн оруулсан хариулт */}
									{userInput ? (
										<div className="flex items-center gap-3">
											<span className="text-sm text-muted-foreground">
												Таны хариулт:
											</span>
											<span
												className={`font-bold text-2xl ${
													isCorrect ? "text-success" : "text-destructive"
												}`}
											>
												{userInput.answer}
											</span>
										</div>
									) : (
										<span className="font-bold text-pop-sun-ink">
											Хариулаагүй
										</span>
									)}
								</div>
							</div>

							{/* Status Badge */}
							<div className="shrink-0">
								{userInput && isCorrect && (
									<div className="rounded-full bg-success px-3 py-1 text-sm font-extrabold text-primary-foreground">
										✓ Зөв
									</div>
								)}
								{userInput && !isCorrect && (
									<div className="rounded-full bg-destructive px-3 py-1 text-sm font-extrabold text-primary-foreground">
										✗ Буруу
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Зөв хариултууд */}
			{showTrueAns && (
				<div className="mt-4 rounded-2xl border-2 border-dashed border-success bg-success/5 p-4 md:p-5">
					<p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-success">
						★ Зөв хариултууд:
					</p>
					<div className="space-y-3">
						{questionAnswers.map((answer) => {
							const correctAnswer =
								answer.answer_name_html || answer.answer_name;
							return (
								<div key={answer.answer_id} className="flex items-center gap-4">
									<div className="text-base">
										{answer.answer_name && answer.answer_name.trim() !== "" && (
											<span className="text-muted-foreground font-semibold mr-2">
												{answer.answer_name} =
											</span>
										)}
										<span className="text-lg font-black text-success">
											{correctAnswer}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
});
