"use client";

import { memo, useCallback } from "react";
import MathContent from "@/app/exam/component/examUtils/MathContent";
import { SourceBlock } from "@/app/exam/component/examUtils/sourceCard";
import QuestionImage from "@/app/exam/component/question/questionImage";
import { Button } from "@/components/ui/button";
import FillInTheBlankQuestion from "./fillinblank";
import NumberInputQuestion from "./inutNumber";
import MatchingByLine from "./matching";
import MultiSelectQuestion from "./multiselect";
import DragAndDropWrapper from "./order";
import SingleSelectQuestion from "./singleselect";

type QuestionType = 1 | 2 | 3 | 4 | 5 | 6;

const QUESTION_TYPE_CONFIG: Record<
	QuestionType,
	{ name: string; color: string }
> = {
	1: {
		name: "Нэг сонголттой",
		color: "bg-pop-sky-soft text-pop-sky-ink",
	},
	2: {
		name: "Олон сонголттой",
		color: "bg-pop-violet-soft text-pop-violet-ink",
	},
	3: {
		name: "Тоо оруулах",
		color: "bg-pop-sun-soft text-pop-sun-ink",
	},
	4: {
		name: "Нөхөх",
		color: "bg-pop-coral-soft text-pop-coral-ink",
	},
	5: {
		name: "Дараалал",
		color: "bg-pop-mint-soft text-pop-mint-ink",
	},
	6: {
		name: "Хослуулах",
		color: "bg-pop-pink-soft text-pop-pink-ink",
	},
};

export interface ConvertedAnswer {
	answer_id: number;
	question_id: number;
	answer_name: string;
	answer_name_html: string;
	answer_descr: string;
	answer_img?: string;
	answer_type: number;
	refid: number;
	ref_child_id: number | null;
	is_true: boolean;
}

export interface SelectedAnswer {
	questionId: number;
	answerIds: number[];
	textAnswer?: string;
	matches?: Record<number, number | string | number[]>;
	order?: number[];
}

export interface BodoltAnswer {
	question_id: number;
	descr: string;
}

interface QuestionData {
	question_id: number;
	que_type_id: number;
	question_name: string;
	que_onoo: number;
	question_img: string | null;
	source_name?: string | null;
	source_title?: string | null;
	source_img?: string | null;
	src_audio?: string | null;
}

interface QuestionItemProps {
	question: QuestionData;
	index: number;
	questionAnswers: ConvertedAnswer[];
	selected: SelectedAnswer | undefined;
	bodolt: BodoltAnswer | undefined;
	isSubmitted: boolean;
	onSingleSelect: (questionId: number, answerId: number | null) => void;
	onMultiSelect: (questionId: number, answerIds: number[]) => void;
	onFillInBlank: (questionId: number, text: string) => void;
	onOrdering: (questionId: number, orderedIds: number[]) => void;
	onMatching: (
		questionId: number,
		matches: Record<number, number | string | number[]>,
	) => void;
	onSubmit: (questionId: number) => void;
	onRestart: (questionId: number) => void;
}

const QuestionItem = memo(function QuestionItem({
	question,
	index,
	questionAnswers,
	selected,
	bodolt,
	isSubmitted,
	onSingleSelect,
	onMultiSelect,
	onFillInBlank,
	onOrdering,
	onMatching,
	onSubmit,
	onRestart,
}: QuestionItemProps) {
	const questionType = Number(question.que_type_id) as QuestionType;

	const typeConfig = QUESTION_TYPE_CONFIG[questionType];
	const typeName = typeConfig?.name || `Тодорхойгүй (${questionType})`;
	const typeColor =
		typeConfig?.color || "bg-muted text-muted-foreground";

	const showAnswerFeedback =
		((questionType === 1 || questionType === 2 || questionType === 4) &&
			!!selected) ||
		((questionType === 3 || questionType === 5 || questionType === 6) &&
			isSubmitted);

	// Stable callbacks — questionId is captured from props (stable per item)
	const handleNumberInputChange = useCallback(
		(answers: Record<number, number | string>) => {
			onMatching(question.question_id, answers);
		},
		[onMatching, question.question_id],
	);

	const handleRestartClick = useCallback(() => {
		onRestart(question.question_id);
	}, [onRestart, question.question_id]);

	const handleSubmitClick = useCallback(() => {
		onSubmit(question.question_id);
	}, [onSubmit, question.question_id]);

	const handleOrderChange = useCallback(
		(orderedIds: number[]) => {
			onOrdering(question.question_id, orderedIds);
		},
		[onOrdering, question.question_id],
	);

	const handleMatchChange = useCallback(
		(matches: Record<number, number | string | number[]>) => {
			onMatching(question.question_id, matches);
		},
		[onMatching, question.question_id],
	);

	const correctAnswers = questionAnswers
		.slice()
		.sort((a, b) => a.refid - b.refid)
		.map((a) => a.answer_id);

	const Bodolt =
		showAnswerFeedback && bodolt ? (
			<div className="mt-4">
				<div className="bg-pop-sky-soft border-2 border-pop-sky/40 p-4 rounded-2xl animate-pop-in">
					<p className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-pop-sky-ink mb-2">
						📝 Бодолт:
					</p>
					<div className="text-xs sm:text-sm text-foreground bg-card p-3 rounded-xl border-2 border-border">
						<MathContent html={bodolt.descr} />
					</div>
				</div>
			</div>
		) : null;

	const SubmittedBodolt =
		isSubmitted && bodolt ? (
			<div className="mt-4">
				<div className="bg-pop-sky-soft border-2 border-pop-sky/40 p-4 rounded-2xl animate-pop-in">
					<p className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-pop-sky-ink mb-2">
						📝 Бодолт:
					</p>
					<div className="text-xs sm:text-sm text-foreground bg-card p-3 rounded-xl border-2 border-border">
						<MathContent html={bodolt.descr} />
					</div>
				</div>
			</div>
		) : null;

	return (
		<div
			className="card-pop p-4 sm:p-6 md:p-8 animate-pop-in"
			style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
		>
			{/* Question Header */}
			<div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
				<div className="size-9 sm:size-11 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shrink-0 font-black text-sm sm:text-lg shadow-[0_3px_0_0_var(--primary-shade)]">
					{index + 1}
				</div>
				<div className="flex-1 min-w-0">
					<div className="text-base sm:text-lg font-semibold text-foreground w-full min-w-0">
						<MathContent html={question.question_name} />
					</div>
					{question.question_img && (
						<div className="w-full max-w-3xl mx-auto h-40 sm:h-50">
							<QuestionImage src={question.question_img} alt="Асуултын зураг" />
						</div>
					)}
					<SourceBlock
						sourceName={question.source_name}
						sourceTitle={question.source_title}
						sourceImg={question.source_img}
						srcAudio={question.src_audio}
					/>
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<span className="text-xs sm:text-sm font-bold text-pop-sun-ink bg-pop-sun-soft px-3 py-1 rounded-full">
							⭐{" "}
							Оноо: {question.que_onoo}
						</span>
						<span
							className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full ${typeColor}`}
						>
							{typeName}
						</span>
					</div>
				</div>
			</div>

			{/* Question Content */}
			<div className="col-span-4 space-y-5">
				{/* Type 1: Single Select */}
				{questionType === 1 && (
					<>
						<SingleSelectQuestion
							questionId={question.question_id}
							questionText={question.question_name}
							answers={questionAnswers}
							mode="exam"
							selectedAnswer={selected?.answerIds[0] || null}
							onAnswerChange={onSingleSelect}
						/>
						{showAnswerFeedback && selected && Bodolt}
					</>
				)}

				{/* Type 2: Multi Select */}
				{questionType === 2 && (
					<>
						<MultiSelectQuestion
							questionId={question.question_id}
							questionText={question.question_name}
							answers={questionAnswers}
							mode="exam"
							selectedAnswers={selected?.answerIds || []}
							onAnswerChange={onMultiSelect}
						/>
						{showAnswerFeedback && selected && Bodolt}
					</>
				)}

				{/* Type 3: Number Input */}
				{questionType === 3 && (
					<>
						<NumberInputQuestion
							questionId={question.question_id}
							answers={questionAnswers}
							userAnswers={
								(selected?.matches || {}) as Record<number, number | string>
							}
							onAnswerChange={handleNumberInputChange}
							showResults={isSubmitted}
							onRestart={handleRestartClick}
						/>
						{!isSubmitted &&
							selected?.matches &&
							Object.keys(selected.matches).length > 0 && (
								<div className="mt-4">
									<Button
										onClick={handleSubmitClick}
										size="lg"
										className="w-full sm:w-auto"
									>
										Хариултаа шалгах
									</Button>
								</div>
							)}
						{SubmittedBodolt}
					</>
				)}

				{/* Type 4: Fill in Blank */}
				{questionType === 4 && (
					<>
						<FillInTheBlankQuestion
							questionId={question.question_id}
							questionText={question.question_name}
							value={selected?.textAnswer || ""}
							mode="exam"
							onAnswerChange={onFillInBlank}
						/>
						{showAnswerFeedback && selected && Bodolt}
					</>
				)}

				{/* Type 5: Ordering */}
				{questionType === 5 && (
					<>
						<DragAndDropWrapper
							questionId={question.question_id}
							answers={questionAnswers.map((a) => ({
								answer_id: a.answer_id,
								answer_name_html: a.answer_name_html || a.answer_name,
							}))}
							mode={isSubmitted ? "review" : "exam"}
							userAnswers={selected?.order || []}
							correctAnswers={correctAnswers}
							onOrderChange={handleOrderChange}
						/>
						{!isSubmitted && selected?.order && selected.order.length > 0 && (
							<div className="mt-4">
								<Button
									onClick={handleSubmitClick}
									variant="success"
									size="lg"
									className="w-full sm:w-auto"
								>
									Хариултаа илгээх
								</Button>
							</div>
						)}
						{SubmittedBodolt}
					</>
				)}

				{/* Type 6: Matching */}
				{questionType === 6 && (
					<>
						<MatchingByLine
							answers={questionAnswers.map((a) => ({
								refid: a.refid,
								answer_id: a.answer_id,
								question_id: a.question_id,
								answer_name_html: a.answer_name_html,
								answer_descr: a.answer_descr,
								answer_img: a.answer_img || null,
								ref_child_id: a.ref_child_id || null,
								is_true: a.is_true,
							}))}
							onMatchChange={handleMatchChange}
							userAnswers={
								(selected?.matches || {}) as Record<number, number | number[]>
							}
						/>
						{!isSubmitted &&
							selected?.matches &&
							Object.keys(selected.matches).length > 0 && (
								<div className="mt-4">
									<Button
										onClick={handleSubmitClick}
										variant="success"
										size="lg"
										className="w-full sm:w-auto"
									>
										Хариултаа илгээх
									</Button>
								</div>
							)}
						{SubmittedBodolt}
					</>
				)}
			</div>
		</div>
	);
});

export default QuestionItem;
