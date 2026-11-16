"use client";

import { memo } from "react";
import type { Question, UserAnswer } from "@/types/exam/examResultMore";

interface EssayReviewProps {
	question: Question;
	userSelectedAnswers: UserAnswer[];
}

/** Задгай даалгавар (que_type_id === 4). */
export const EssayReview = memo(function EssayReview({
	question,
	userSelectedAnswers,
}: EssayReviewProps) {
	return (
		<div className="space-y-4">
			{/* Хэрэглэгчийн бичсэн хариулт */}
			<div className="rounded-2xl border-2 border-pop-sky bg-pop-sky-soft p-4 md:p-5">
				<div className="flex items-start gap-4">
					{/* Icon */}
					<div className="shrink-0">
						<div className="flex size-10 items-center justify-center rounded-xl bg-pop-sky text-pop-on">
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Хариулт</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</div>
					</div>

					{/* Хариултын агуулга */}
					<div className="flex-1 min-w-0">
						<p className="mb-3 text-sm font-extrabold text-pop-sky-ink">
							Таны бичсэн хариулт:
						</p>
						{userSelectedAnswers.length > 0 &&
						userSelectedAnswers[0]?.answer ? (
							<div className="rounded-xl border-2 border-border bg-card p-4">
								<p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
									{userSelectedAnswers[0].answer}
								</p>
							</div>
						) : (
							<div className="rounded-xl border-2 border-dashed border-pop-sun bg-pop-sun-soft p-4">
								<p className="font-bold text-pop-sun-ink">
									Хариулт бичээгүй байна
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Багшийн үнэлгээ */}
			{question.unelsen === 1 ? (
				// ✅ БАГШ ҮНЭЛСЭН ТОХИОЛДОЛ
				<div
					className={`rounded-2xl border-2 p-4 md:p-5 ${
						question.zad_onoo > 0
							? "border-success bg-success/10"
							: "border-destructive bg-destructive/10"
					}`}
				>
					<div className="flex items-start gap-3">
						<div className="shrink-0">
							<div
								className={`flex size-8 items-center justify-center rounded-xl text-primary-foreground ${
									question.zad_onoo > 0 ? "bg-success" : "bg-destructive"
								}`}
							>
								{question.zad_onoo > 0 ? (
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Зөв</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M5 13l4 4L19 7"
										/>
									</svg>
								) : (
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Буруу</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								)}
							</div>
						</div>
						<div className="flex-1">
							<p
								className={`mb-2 text-sm font-extrabold ${
									question.zad_onoo > 0 ? "text-success" : "text-destructive"
								}`}
							>
								✓ Багш үнэлгээ өгсөн
							</p>

							{/* Авсан оноо */}
							<div className="flex items-center gap-2 mb-3">
								<span className="text-sm text-muted-foreground">
									Авсан оноо:
								</span>
								<span
									className={`text-2xl font-black ${
										question.zad_onoo > 0 ? "text-success" : "text-destructive"
									}`}
								>
									{question.zad_onoo}
								</span>
								<span className="text-sm text-muted-foreground">
									/ {question.que_onoo}
								</span>
							</div>

							{/* Багшийн тайлбар */}
							{question.zad_descr &&
								question.zad_descr.trim() !== "" &&
								question.zad_descr !== "." && (
									<div className="mt-3 rounded-xl border-2 border-border bg-card p-3">
										<p className="text-xs font-semibold text-muted-foreground mb-1">
											Багшийн тайлбар:
										</p>
										<p className="text-sm text-foreground leading-relaxed">
											{question.zad_descr}
										</p>
									</div>
								)}
						</div>
					</div>
				</div>
			) : (
				// ❌ БАГШ ҮНЭЛЭЭГҮЙ ТОХИОЛДОЛ
				<div className="rounded-2xl border-2 border-pop-sun bg-pop-sun-soft p-4 md:p-5">
					<div className="flex items-start gap-3">
						<div className="shrink-0">
							<div className="flex size-8 items-center justify-center rounded-xl border-2 border-pop-sun bg-card text-pop-sun-ink">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Хүлээгдэж байна</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
						</div>
						<div className="flex-1">
							<p className="mb-2 text-sm font-extrabold text-pop-sun-ink">
								⏳ Багшийн үнэлгээ хүлээгдэж байна
							</p>
							<p className="text-sm font-semibold text-pop-sun-ink">
								Задгай даалгавар нь багш шууд үнэлдэг тул оноо хараахан
								тооцогдоогүй байна. Багш үнэлсний дараа оноо харагдах болно.
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
});
