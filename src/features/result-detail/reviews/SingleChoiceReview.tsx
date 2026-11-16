"use client";

import Image from "next/image";
import { memo } from "react";
import { AnswerContent } from "../AnswerContent";
import type { AnswerReviewProps } from "./types";

/** Нэг сонголттой асуулт (que_type_id === 1). */
export const SingleChoiceReview = memo(function SingleChoiceReview({
	questionAnswers,
	userSelectedAnswers,
	showTrueAns,
}: AnswerReviewProps) {
	return questionAnswers.length === 0 ? (
		<p className="text-sm text-muted-foreground">Хариулт олдсонгүй</p>
	) : (
		<div className="space-y-4">
			<div className="space-y-3">
				{questionAnswers.map((answer) => {
					const isCorrect = answer.is_true === 1;
					const isUserSelected = userSelectedAnswers.some(
						(ua) => ua.answer_id === answer.answer_id,
					);
					const isWrongSelection = isUserSelected && !isCorrect;
					const hasImage = answer.answer_img && answer.answer_img.trim() !== "";

					return (
						<div
							key={answer.answer_id}
							className={`relative flex items-center gap-3 rounded-2xl border-2 p-4 font-bold transition-all duration-300 ${
								isWrongSelection
									? "border-destructive bg-destructive/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_35%,transparent)]"
									: isUserSelected
										? "border-success bg-success/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_35%,transparent)]"
										: "border-border bg-card"
							}`}
						>
							<div className="flex-1 min-w-0">
								<div className="text-base font-bold leading-relaxed">
									{hasImage && (
										<Image
											src={answer.answer_img}
											alt="Answer"
											width={300}
											height={200}
											className="mt-2 rounded-2xl border-2 border-border"
										/>
									)}
									<AnswerContent
										html={answer.answer_name_html}
										text={answer.answer_name}
									/>
									{!hasImage &&
										!answer.answer_name_html?.trim() &&
										!answer.answer_name?.trim() &&
										"Хариулт байхгүй"}
								</div>
							</div>
							<div className="shrink-0">
								{isUserSelected && isCorrect && (
									<div className="rounded-full bg-success px-3 py-1 text-sm font-extrabold text-primary-foreground">
										✓ Зөв
									</div>
								)}
								{isWrongSelection && (
									<div className="rounded-full bg-destructive px-3 py-1 text-sm font-extrabold text-primary-foreground">
										✗ Буруу
									</div>
								)}
								{isUserSelected && !isCorrect && !isWrongSelection && (
									<div className="rounded-full bg-primary px-3 py-1 text-sm font-extrabold text-primary-foreground">
										✓ Та сонгосон
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{showTrueAns && (
				<div className="mt-4 rounded-2xl border-2 border-dashed border-success bg-success/5 p-4 md:p-5">
					<p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-success">
						Зөв хариулт:
					</p>
					{questionAnswers
						.filter((answer) => answer.is_true === 1)
						.map((answer) => {
							const hasImage =
								answer.answer_img && answer.answer_img.trim() !== "";
							return (
								<div
									key={answer.answer_id}
									className="mb-2 flex items-start gap-3 rounded-xl border-2 border-success/40 bg-card p-3 font-bold"
								>
									<div className="text-base leading-relaxed">
										{hasImage && (
											<Image
												src={answer.answer_img}
												alt="Correct Answer"
												width={300}
												height={200}
												className="mt-2 rounded-2xl border-2 border-border"
											/>
										)}
										<AnswerContent
											html={answer.answer_name_html}
											text={answer.answer_name}
										/>
										{!hasImage &&
											!answer.answer_name_html?.trim() &&
											!answer.answer_name?.trim() &&
											"Хариулт байхгүй"}
									</div>
								</div>
							);
						})}
				</div>
			)}
		</div>
	);
});
