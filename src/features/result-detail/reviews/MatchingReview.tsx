"use client";

import Image from "next/image";
import { memo } from "react";
import type { AnswerReviewProps } from "./types";

/** Харгалзуулах асуулт (que_type_id === 6). */
export const MatchingReview = memo(function MatchingReview({
	questionAnswers,
	userSelectedAnswers,
	showTrueAns,
}: AnswerReviewProps) {
	// Separate into questions (б column) and answers (а column)
	const questionsOnly = questionAnswers.filter((a) => a.ref_child_id === -1);
	const answersOnly = questionAnswers.filter(
		(a) => a.ref_child_id && a.ref_child_id >= 1,
	);

	return (
		<div className="space-y-4">
			{/* Хэрэглэгчийн харгалзуулсан хариултууд */}
			<div className="space-y-3">
				<p className="mb-3 text-sm font-extrabold text-pop-sky-ink">
					Таны харгалзуулсан хариултууд:
				</p>

				{questionsOnly.map((questionItem) => {
					// ЗАСВАР: answer-ын ref_child_id нь question-ий refid-тай тэнцүү байх
					const correctAnswer = answersOnly.find(
						(a) => a.ref_child_id === questionItem.refid,
					);

					// Find user's selection for this question
					// User data format: answer_id points to the answer item (а column)
					const userMatch = correctAnswer
						? userSelectedAnswers.find(
								(ua) => ua.answer_id === correctAnswer.answer_id,
							)
						: null;

					// Find which question the user matched to
					// ЗАСВАР: User-ын answer утга нь question-ий refid
					const userSelectedQuestion = userMatch
						? questionsOnly.find(
								(q) => q.refid === parseInt(userMatch.answer, 10),
							)
						: null;

					const isCorrect =
						userMatch &&
						userSelectedQuestion &&
						userSelectedQuestion.refid === questionItem.refid;

					return (
						<div
							key={questionItem.answer_id}
							className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-4 font-bold transition-all duration-300 ${
								!userMatch
									? "border-dashed border-pop-sun bg-pop-sun-soft"
									: isCorrect
										? "border-success bg-success/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_35%,transparent)]"
										: "border-destructive bg-destructive/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_35%,transparent)]"
							}`}
						>
							{/* Right side - Answer (а column) */}
							<div className="flex items-center gap-3 flex-1">
								{correctAnswer?.answer_img &&
								correctAnswer.answer_img.trim() !== "" ? (
									<Image
										src={correctAnswer.answer_img}
										alt="Answer"
										width={120}
										height={90}
										className="rounded-xl border-2 border-border object-contain"
									/>
								) : (
									<div className="text-base font-medium">
										{correctAnswer?.answer_name_html ||
											correctAnswer?.answer_name ||
											"Хариулт"}
									</div>
								)}
							</div>

							{/* Arrow */}
							<div className="shrink-0 text-2xl font-black text-muted-foreground">
								→
							</div>

							{/* Left side - Question (б column) - User's selection */}
							<div className="flex items-center gap-3 flex-1">
								{userSelectedQuestion ? (
									userSelectedQuestion.answer_img &&
									userSelectedQuestion.answer_img.trim() !== "" ? (
										<Image
											src={userSelectedQuestion.answer_img}
											alt="Selected Question"
											width={120}
											height={90}
											className="rounded-xl border-2 border-border object-contain"
										/>
									) : (
										<div className="text-base font-medium">
											{userSelectedQuestion.answer_name_html ||
												userSelectedQuestion.answer_name}
										</div>
									)
								) : (
									<span className="font-bold text-pop-sun-ink">
										Харгалзуулаагүй
									</span>
								)}
							</div>

							{/* Status badge */}
							<div className="shrink-0">
								{userMatch && isCorrect && (
									<div className="rounded-full bg-success px-3 py-1 text-sm font-extrabold text-primary-foreground">
										✓ Зөв
									</div>
								)}
								{userMatch && !isCorrect && (
									<div className="rounded-full bg-destructive px-3 py-1 text-sm font-extrabold text-primary-foreground">
										✗ Буруу
									</div>
								)}
								{!userMatch && (
									<div className="rounded-full border-2 border-pop-sun bg-card px-3 py-1 text-sm font-extrabold text-pop-sun-ink">
										! Хариулаагүй
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
						★ Зөв харгалзуулалт:
					</p>
					<div className="space-y-3">
						{/* ЗАСВАР: 
                                                                                дээр loop хийх (А багана) */}
						{answersOnly.map((answerItem) => {
							// answerItem.ref_child_id нь зөв question-ий refid
							const correctQuestion = questionsOnly.find(
								(q) => q.refid === answerItem.ref_child_id,
							);

							return (
								<div
									key={answerItem.answer_id}
									className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-success/40 bg-card p-3 font-bold"
								>
									{/* Answer (а column) - Зүүн тал */}
									<div className="flex items-center gap-3 flex-1">
										{answerItem.answer_img &&
										answerItem.answer_img.trim() !== "" ? (
											<Image
												src={answerItem.answer_img}
												alt="Answer"
												width={120}
												height={90}
												className="rounded-xl border-2 border-border object-contain"
											/>
										) : (
											<div className="text-base font-medium">
												{answerItem.answer_name_html ||
													answerItem.answer_name ||
													"Хариулт"}
											</div>
										)}
									</div>

									{/* Arrow */}
									<div className="shrink-0 text-2xl font-black text-success">
										→
									</div>

									{/* Question (б column) - Баруун тал */}
									<div className="flex items-center gap-3 flex-1">
										{correctQuestion?.answer_img &&
										correctQuestion.answer_img.trim() !== "" ? (
											<Image
												src={correctQuestion.answer_img}
												alt="Question"
												width={120}
												height={90}
												className="rounded-xl border-2 border-border object-contain"
											/>
										) : (
											<div className="text-base font-medium">
												{correctQuestion?.answer_name_html ||
													correctQuestion?.answer_name ||
													"Хариулт"}
											</div>
										)}
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
