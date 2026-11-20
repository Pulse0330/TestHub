import type { Answer, Question, UserAnswer } from "@/types/exam/examResultMore";

/** Асуултын төрөл бүрийн хариултын харагдацад дамжих нийтлэг props. */
export interface AnswerReviewProps {
	questionAnswers: Answer[];
	userSelectedAnswers: UserAnswer[];
	showTrueAns: boolean;
}

export interface QuestionAnswerReviewProps extends AnswerReviewProps {
	question: Question;
}
