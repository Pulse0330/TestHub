"use client";

import { ChevronDown } from "lucide-react";
import { memo } from "react";
import { QuestionPrompt } from "./QuestionPrompt";
import { EssayReview } from "./reviews/EssayReview";
import { FillInReview } from "./reviews/FillInReview";
import { MatchingReview } from "./reviews/MatchingReview";
import { MultiChoiceReview } from "./reviews/MultiChoiceReview";
import { OrderReview } from "./reviews/OrderReview";
import { SingleChoiceReview } from "./reviews/SingleChoiceReview";
import {
	getQuestionPreview,
	getQuestionTypeLabel,
	type QuestionEntry,
} from "./scoring";
import { STATUS_META } from "./status";

export interface QuestionCardProps {
	entry: QuestionEntry;
	isOpen: boolean;
	onToggle: (examQueId: number) => void;
	showTrueAns: boolean;
	showSourceBlock: boolean;
}

export const QuestionCard = memo(function QuestionCard({
	entry,
	isOpen,
	onToggle,
	showTrueAns,
	showSourceBlock,
}: QuestionCardProps) {
	const {
		question,
		index,
		questionAnswers,
		userSelectedAnswers,
		status: answerStatus,
		earnedPoints,
	} = entry;
	const statusMeta = STATUS_META[answerStatus];
	return (
		<div
			id={`q-${question.exam_que_id}`}
			className={`card-pop overflow-hidden scroll-mt-40 transition-colors ${isOpen ? "border-primary/40" : ""}`}
		>
			<button
				type="button"
				onClick={() => onToggle(question.exam_que_id)}
				aria-expanded={isOpen}
				className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent/50 md:gap-4 md:p-4"
			>
				<span className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-pop-violet bg-pop-violet-soft text-base font-black text-pop-violet-ink">
					{index + 1}
				</span>
				<span
					className={`flex size-8 shrink-0 items-center justify-center rounded-full ${statusMeta.chip}`}
					title={statusMeta.label}
				>
					<statusMeta.Icon className="size-5" strokeWidth={2.5} />
				</span>
				<span className="min-w-0 flex-1">
					<span className="block truncate text-sm font-bold text-foreground md:text-base">
						{getQuestionPreview(question.question_name) ||
							getQuestionTypeLabel(question.que_type_id)}
					</span>
					<span className="mt-0.5 block text-xs font-semibold text-muted-foreground">
						{getQuestionTypeLabel(question.que_type_id)} · {statusMeta.label}
					</span>
				</span>
				<span
					className={`hidden shrink-0 rounded-lg px-2 py-0.5 text-sm font-black tabular-nums sm:inline-block ${statusMeta.chip}`}
				>
					{answerStatus === "correct" || answerStatus === "partial"
						? earnedPoints
						: answerStatus === "pending"
							? "-"
							: 0}
					/{question.que_onoo}
				</span>
				<ChevronDown
					className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>
			{isOpen && (
				<div className="animate-in fade-in-0 slide-in-from-top-1 border-t-2 border-border p-4 duration-200 md:p-6">
					<QuestionPrompt
						question={question}
						index={index}
						answerStatus={answerStatus}
						earnedPoints={earnedPoints}
						showSourceBlock={showSourceBlock}
					/>
					<div className="space-y-4 md:pl-14">
						{question.que_type_id === 1 ? (
							<SingleChoiceReview
								questionAnswers={questionAnswers}
								userSelectedAnswers={userSelectedAnswers}
								showTrueAns={showTrueAns}
							/>
						) : question.que_type_id === 2 ? (
							<MultiChoiceReview
								question={question}
								questionAnswers={questionAnswers}
								userSelectedAnswers={userSelectedAnswers}
								showTrueAns={showTrueAns}
							/>
						) : question.que_type_id === 3 ? (
							<FillInReview
								questionAnswers={questionAnswers}
								userSelectedAnswers={userSelectedAnswers}
								showTrueAns={showTrueAns}
							/>
						) : question.que_type_id === 4 ? (
							<EssayReview
								question={question}
								userSelectedAnswers={userSelectedAnswers}
							/>
						) : question.que_type_id === 5 ? (
							<OrderReview
								questionAnswers={questionAnswers}
								userSelectedAnswers={userSelectedAnswers}
								showTrueAns={showTrueAns}
							/>
						) : question.que_type_id === 6 ? (
							<MatchingReview
								questionAnswers={questionAnswers}
								userSelectedAnswers={userSelectedAnswers}
								showTrueAns={showTrueAns}
							/>
						) : (
							<p className="text-sm text-muted-foreground">
								Энэ төрлийн асуулт хараахан дэмжигдээгүй байна
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
});
