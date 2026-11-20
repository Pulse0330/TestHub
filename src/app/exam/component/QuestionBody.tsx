"use client";

import dynamic from "next/dynamic";
import { memo, useCallback } from "react";
import type {
	Answer,
	AnswerValue,
	ApiExamResponse,
	Question,
} from "@/types/exam/exam";
import { SourceBlock } from "./examUtils/sourceCard";
import FillInTheBlankQuestion from "./question/fillblank";
import type { MatchingItem } from "./question/matching";
import MultiSelectQuestion from "./question/multiselect";
import NumberInputQuestion from "./question/numberinput";
import QuestionImage from "./question/questionImage";
import SingleSelectQuestion from "./question/singleSelect";

function QuestionSkeleton() {
	return (
		<div
			className="h-40 w-full animate-pulse rounded-2xl border-2 border-border bg-muted/60"
			aria-hidden="true"
		/>
	);
}

// Хүнд drag/arrow сангуудыг зөвхөн хэрэгтэй үед client дээр ачаална.
const MatchingByLine = dynamic(() => import("./question/matching"), {
	ssr: false,
	loading: () => <QuestionSkeleton />,
});
const DragAndDropQuestion = dynamic(() => import("./question/order"), {
	ssr: false,
	loading: () => <QuestionSkeleton />,
});

const SUPPORTED_TYPES = new Set([1, 2, 3, 4, 5, 6]);
const EMPTY_IDS: number[] = [];
const EMPTY_VALUES: Record<number, string> = {};
const EMPTY_MATCHES: Record<number, number[]> = {};

export type PreparedAnswer = Omit<Answer, "answer_img"> & {
	answer_img?: string;
	is_true: boolean;
};

export interface PreparedQuestion extends Question {
	answers: PreparedAnswer[];
	/** Matching (6) асуултад зориулсан, урьдчилан бэлтгэсэн мөрүүд. */
	matchingItems: MatchingItem[];
	/** Эрэмбэлэх (5) асуултад зориулсан, урьдчилан бэлтгэсэн мөрүүд. */
	orderItems: { answer_id: number; answer_name_html: string }[];
}

/** API өгөгдлөөс асуултуудыг (хариултын жагсаалттай нь) нэг удаа бэлтгэнэ. */
export function prepareQuestions(
	examData: ApiExamResponse | undefined,
): PreparedQuestion[] {
	if (!examData?.Questions || !examData?.Answers) return [];

	const answersByQuestionId = new Map<number, Answer[]>();
	for (const answer of examData.Answers) {
		const list = answersByQuestionId.get(answer.question_id);
		if (list) list.push(answer);
		else answersByQuestionId.set(answer.question_id, [answer]);
	}

	return examData.Questions.filter((q) =>
		SUPPORTED_TYPES.has(q.que_type_id),
	).map((q) => {
		const answers: PreparedAnswer[] = (
			answersByQuestionId.get(q.question_id) ?? []
		)
			.filter((a) => a.answer_type === q.que_type_id)
			.map((a) => ({
				...a,
				answer_img: a.answer_img || undefined,
				is_true: false,
			}));

		return {
			...q,
			question_img: q.question_img || "",
			answers,
			matchingItems:
				q.que_type_id === 6
					? answers.map((a) => ({
							refid: a.refid,
							answer_id: a.answer_id,
							question_id: a.question_id,
							answer_name_html: a.answer_name_html,
							answer_descr: a.answer_descr,
							answer_img: a.answer_img || null,
							ref_child_id: a.ref_child_id,
							is_true: a.is_true,
						}))
					: [],
			orderItems:
				q.que_type_id === 5
					? answers.map((a) => ({
							answer_id: a.answer_id,
							answer_name_html: a.answer_name_html || a.answer_name || "",
						}))
					: [],
		};
	});
}

interface QuestionBodyProps {
	question: PreparedQuestion;
	/** Зөвхөн энэ асуултын хариулт (бусад асуулт өөрчлөгдөхөд re-render хийхгүй). */
	answer: AnswerValue | undefined;
	/** Тогтвортой (stable) callback байх ёстой. */
	onAnswerChange: (questionId: number, answer: AnswerValue) => void;
	disabled?: boolean;
}

const isRecord = (v: AnswerValue | undefined): v is Record<number, never> =>
	typeof v === "object" && v !== null && !Array.isArray(v);

/** Асуултын зураг, эх сурвалж болон төрлөөс хамаарсан хариулах хэсэг. */
function QuestionBodyImpl({
	question: q,
	answer,
	onAnswerChange,
	disabled = false,
}: QuestionBodyProps) {
	const questionId = q.question_id;

	const handleMatchChange = useCallback(
		(matches: Record<number, number[]>) => onAnswerChange(questionId, matches),
		[onAnswerChange, questionId],
	);
	const handleOrderChange = useCallback(
		(orderedIds: number[]) => onAnswerChange(questionId, orderedIds),
		[onAnswerChange, questionId],
	);

	return (
		<>
			{q.question_img && (
				<QuestionImage src={q.question_img} alt="Асуултын зураг" />
			)}
			<SourceBlock
				sourceName={q.source_name}
				sourceTitle={q.source_title}
				sourceImg={q.source_img}
				srcAudio={q.src_audio}
			/>

			{q.que_type_id === 1 && (
				<SingleSelectQuestion
					questionId={questionId}
					questionText={q.question_name}
					answers={q.answers}
					selectedAnswer={typeof answer === "number" ? answer : null}
					onAnswerChange={onAnswerChange}
					disabled={disabled}
				/>
			)}
			{q.que_type_id === 2 && (
				<MultiSelectQuestion
					questionId={questionId}
					questionText={q.question_name}
					answers={q.answers}
					mode="exam"
					selectedAnswers={
						Array.isArray(answer) ? (answer as number[]) : EMPTY_IDS
					}
					onAnswerChange={onAnswerChange}
					readOnly={disabled}
				/>
			)}
			{q.que_type_id === 3 && (
				<NumberInputQuestion
					questionId={questionId}
					questionText={q.question_name}
					answers={q.answers}
					selectedValues={
						isRecord(answer) ? (answer as Record<number, string>) : EMPTY_VALUES
					}
					onAnswerChange={onAnswerChange}
					readOnly={disabled}
				/>
			)}
			{q.que_type_id === 4 && (
				<FillInTheBlankQuestion
					questionId={questionId}
					questionText={q.question_name}
					value={typeof answer === "string" ? answer : ""}
					onAnswerChange={onAnswerChange}
					readOnly={disabled}
				/>
			)}
			{q.que_type_id === 5 && (
				<DragAndDropQuestion
					questionId={questionId}
					answers={q.orderItems}
					userAnswers={Array.isArray(answer) ? (answer as number[]) : EMPTY_IDS}
					onOrderChange={handleOrderChange}
					disabled={disabled}
				/>
			)}
			{q.que_type_id === 6 && (
				<MatchingByLine
					answers={q.matchingItems}
					userAnswers={
						isRecord(answer)
							? (answer as Record<number, number[]>)
							: EMPTY_MATCHES
					}
					onMatchChange={handleMatchChange}
					readonly={disabled}
				/>
			)}
		</>
	);
}

export const QuestionBody = memo(QuestionBodyImpl);
export default QuestionBody;
