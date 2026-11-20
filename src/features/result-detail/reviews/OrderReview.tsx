"use client";

import { memo } from "react";
import { AnswerContent } from "../AnswerContent";
import type { AnswerReviewProps } from "./types";

/** Дараалал тогтоох асуулт (que_type_id === 5). */
export const OrderReview = memo(function OrderReview({
	questionAnswers,
	userSelectedAnswers,
	showTrueAns,
}: AnswerReviewProps) {
	return (
		<div className="space-y-4">
			{/* Хэрэглэгчийн оруулсан дараалал */}
			<div className="space-y-3">
				<p className="mb-3 text-sm font-extrabold text-pop-sky-ink">
					Таны оруулсан дараалал:
				</p>

				{[...questionAnswers]
					.sort((a, b) => {
						// Хэрэглэгчийн оруулсан дарааллаар эрэмбэлэх
						const userA = userSelectedAnswers.find(
							(ua) => ua.answer_id === a.answer_id,
						);
						const userB = userSelectedAnswers.find(
							(ua) => ua.answer_id === b.answer_id,
						);
						const posA = userA ? parseInt(userA.answer, 10) : 999;
						const posB = userB ? parseInt(userB.answer, 10) : 999;
						return posA - posB;
					})
					.map((answer) => {
						const userInput = userSelectedAnswers.find(
							(ua) => ua.answer_id === answer.answer_id,
						);

						// Зөв дараалал (refid)
						const correctPosition = answer.refid;
						const userPosition = userInput
							? parseInt(userInput.answer, 10)
							: null;
						const isCorrect = userPosition === correctPosition;

						return (
							<div
								key={answer.answer_id}
								className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-4 font-bold transition-all duration-300 ${
									!userInput
										? "border-dashed border-pop-sun bg-pop-sun-soft"
										: isCorrect
											? "border-success bg-success/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_35%,transparent)]"
											: "border-destructive bg-destructive/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_35%,transparent)]"
								}`}
							>
								{/* Хариултын текст */}
								<div className="flex-1 min-w-0">
									<div className="text-base font-medium text-foreground">
										<AnswerContent
											html={answer.answer_name_html}
											text={answer.answer_name || "Хариулт"}
										/>
									</div>
								</div>

								{/* Status badge */}
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
									{!userInput && (
										<div className="rounded-full border-2 border-pop-sun bg-card px-3 py-1 text-sm font-extrabold text-pop-sun-ink">
											! Хариулаагүй
										</div>
									)}
								</div>
							</div>
						);
					})}
			</div>

			{/* Зөв дараалал */}
			{showTrueAns && (
				<div className="mt-4 rounded-2xl border-2 border-dashed border-success bg-success/5 p-4 md:p-5">
					<p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-success">
						Зөв дараалал:
					</p>
					<div className="space-y-3">
						{[...questionAnswers]
							.sort((a, b) => a.refid - b.refid)
							.map((answer) => (
								<div
									key={answer.answer_id}
									className="flex items-center gap-3 rounded-xl border-2 border-success/40 bg-card p-3 font-bold"
								>
									<div className="text-base font-medium text-foreground">
										<AnswerContent
											html={answer.answer_name_html}
											text={answer.answer_name || "Хариулт"}
										/>
									</div>
								</div>
							))}
					</div>
				</div>
			)}
		</div>
	);
});
