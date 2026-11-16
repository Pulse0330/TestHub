import type {
	Answer,
	ExamResponseMoreApiResponse,
	Question,
	UserAnswer,
} from "@/types/exam/examResultMore";

/**
 * Шалгалт/сорилын дүнгийн дэлгэрэнгүйд ашиглах цэвэр (pure) тооцооллын
 * логик. examResult болон sorilResult хоёулаа энэ модулийг ашиглана.
 */

export type AnswerStatus =
	| "unanswered"
	| "pending" // Задгай даалгавар — багшийн үнэлгээ хүлээгдэж байна
	| "correct"
	| "partial"
	| "incorrect";

export interface QuestionEntry {
	question: Question;
	index: number;
	questionAnswers: Answer[];
	userSelectedAnswers: UserAnswer[];
	isQuestionCorrect: boolean;
	status: AnswerStatus;
	earnedPoints: number;
}

const QUESTION_TYPE_LABELS: Record<number, string> = {
	1: "Нэг сонголттой",
	2: "Олон сонголттой",
	3: "Тоо оруулах",
	4: "Задгай даалгавар",
	5: "Дараалал",
	6: "Харгалзуулах",
};

export const getQuestionTypeLabel = (typeId: number) =>
	QUESTION_TYPE_LABELS[typeId] || "Бусад";

export const getQuestionPreview = (html?: string | null) =>
	(html || "")
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/\\[()[\]]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const findUserInput = (userSelectedAnswers: UserAnswer[], answerId: number) =>
	userSelectedAnswers.find((ua) => ua.answer_id === answerId);

const correctInputValue = (answer: Answer) =>
	answer.answer_name_html || answer.answer_name;

const matchingAnswersOnly = (questionAnswers: Answer[]) =>
	questionAnswers.filter((a) => a.ref_child_id && a.ref_child_id >= 1);

export function isQuestionCorrect(
	question: Question,
	questionAnswers: Answer[],
	userSelectedAnswers: UserAnswer[],
): boolean {
	if (userSelectedAnswers.length === 0) return false;

	switch (question.que_type_id) {
		case 1: {
			const correctAnswer = questionAnswers.find((a) => a.is_true === 1);
			const userAnswer = userSelectedAnswers[0];
			return (
				!!userAnswer &&
				!!correctAnswer &&
				userAnswer.answer_id === correctAnswer.answer_id
			);
		}
		case 2: {
			const correctAnswers = questionAnswers.filter((a) => a.is_true === 1);
			return (
				correctAnswers.length === userSelectedAnswers.length &&
				correctAnswers.every((ca) =>
					userSelectedAnswers.some((ua) => ua.answer_id === ca.answer_id),
				)
			);
		}
		case 3:
			// Хариултын мөр ирээгүй бол зөв гэж тооцохгүй ([].every === true)
			return (
				questionAnswers.length > 0 &&
				questionAnswers.every((answer) => {
					const userInput = findUserInput(
						userSelectedAnswers,
						answer.answer_id,
					);
					return !!userInput && userInput.answer === correctInputValue(answer);
				})
			);
		case 4:
			// Задгай даалгавар — багш үнэлсэн бол бүтэн оноо авсан эсэх
			return question.unelsen === 1 && question.zad_onoo === question.que_onoo;
		case 5:
			return (
				questionAnswers.length > 0 &&
				questionAnswers.every((answer) => {
					const userInput = findUserInput(
						userSelectedAnswers,
						answer.answer_id,
					);
					// Зөв дараалал нь refid-тай тэнцүү байх ёстой
					return (
						!!userInput &&
						Number.parseInt(userInput.answer, 10) === answer.refid
					);
				})
			);
		case 6: {
			const rows = matchingAnswersOnly(questionAnswers);
			return (
				rows.length > 0 &&
				rows.every((answerItem) => {
					const userInput = findUserInput(
						userSelectedAnswers,
						answerItem.answer_id,
					);
					return (
						!!userInput &&
						Number.parseInt(userInput.answer, 10) === answerItem.ref_child_id
					);
				})
			);
		}
		default:
			return false;
	}
}

export function calculatePartialPoints(
	question: Question,
	questionAnswers: Answer[],
	userSelectedAnswers: UserAnswer[],
): number {
	if (userSelectedAnswers.length === 0) return 0;

	switch (question.que_type_id) {
		case 4:
			// Багш үнэлсэн бол түүний өгсөн оноог буцаах
			return question.unelsen === 1 ? question.zad_onoo || 0 : 0;
		case 2: {
			const correctAnswers = questionAnswers.filter((a) => a.is_true === 1);
			const totalCorrect = correctAnswers.length;
			if (totalCorrect === 0) return 0;
			// truecnt-ээс илүү хариулт сонговол шууд 0 оноо
			if (userSelectedAnswers.length > question.truecnt) return 0;

			const correctIds = new Set(correctAnswers.map((ca) => ca.answer_id));
			let correctSelected = 0;
			let incorrectSelected = 0;
			for (const ua of userSelectedAnswers) {
				if (correctIds.has(ua.answer_id)) correctSelected++;
				else incorrectSelected++;
			}
			// Буруу хариулт сонговол penalty-тэй
			const basePoints = (correctSelected / totalCorrect) * question.que_onoo;
			const penalty = (incorrectSelected / totalCorrect) * question.que_onoo;
			return Math.max(0, Math.round((basePoints - penalty) * 10) / 10);
		}
		case 3: {
			let correctInputs = 0;
			let incorrectInputs = 0;
			for (const answer of questionAnswers) {
				const userInput = findUserInput(userSelectedAnswers, answer.answer_id);
				if (!userInput) continue;
				if (userInput.answer === correctInputValue(answer)) correctInputs++;
				else incorrectInputs++;
			}
			const basePoints =
				(correctInputs / questionAnswers.length) * question.que_onoo;
			const penalty =
				(incorrectInputs / questionAnswers.length) * question.que_onoo;
			return Math.max(0, Math.round((basePoints - penalty) * 10) / 10);
		}
		case 5: {
			let correctOrders = 0;
			for (const answer of questionAnswers) {
				const userInput = findUserInput(userSelectedAnswers, answer.answer_id);
				if (
					userInput &&
					Number.parseInt(userInput.answer, 10) === answer.refid
				) {
					correctOrders++;
				}
			}
			// Penalty байхгүй — зөвхөн зөв тооноос оноо тооцно
			const points =
				(correctOrders / questionAnswers.length) * question.que_onoo;
			return Math.round(points * 10) / 10;
		}
		case 6: {
			const questionsOnly = questionAnswers.filter(
				(a) => a.ref_child_id === -1,
			);
			const answersOnly = matchingAnswersOnly(questionAnswers);
			if (answersOnly.length === 0) return 0;

			let correctMatches = 0;
			for (const answerItem of answersOnly) {
				const correctQuestion = questionsOnly.find(
					(q) => q.refid === answerItem.ref_child_id,
				);
				if (!correctQuestion) continue;
				const userInput = findUserInput(
					userSelectedAnswers,
					answerItem.answer_id,
				);
				if (
					userInput &&
					Number.parseInt(userInput.answer, 10) === correctQuestion.refid
				) {
					correctMatches++;
				}
			}
			// Penalty байхгүй — зөвхөн зөв тооноос оноо тооцно
			const points = (correctMatches / answersOnly.length) * question.que_onoo;
			return Math.round(points * 10) / 10;
		}
		default:
			return 0;
	}
}

interface AnswerCheck {
	hasCorrect: boolean;
	hasUnanswered: boolean;
}

function checkAnswerCoverage(
	question: Question,
	questionAnswers: Answer[],
	userSelectedAnswers: UserAnswer[],
): AnswerCheck {
	const countItems = (
		items: Answer[],
		isCorrect: (item: Answer, userAnswer: UserAnswer) => boolean,
	): AnswerCheck => {
		let correctCount = 0;
		let answeredCount = 0;
		for (const item of items) {
			const userInput = findUserInput(userSelectedAnswers, item.answer_id);
			if (!userInput) continue;
			answeredCount++;
			if (isCorrect(item, userInput)) correctCount++;
		}
		return {
			hasCorrect: correctCount > 0,
			hasUnanswered: answeredCount < items.length,
		};
	};

	switch (question.que_type_id) {
		case 2: {
			const correctIds = new Set(
				questionAnswers.filter((a) => a.is_true === 1).map((a) => a.answer_id),
			);
			const correctSelected = userSelectedAnswers.filter((ua) =>
				correctIds.has(ua.answer_id),
			).length;
			return {
				hasCorrect: correctSelected > 0,
				hasUnanswered: userSelectedAnswers.length < correctIds.size,
			};
		}
		case 3:
			return countItems(
				questionAnswers,
				(a, ua) => ua.answer === correctInputValue(a),
			);
		case 5:
			return countItems(
				questionAnswers,
				(a, ua) => Number.parseInt(ua.answer, 10) === a.refid,
			);
		case 6:
			return countItems(
				matchingAnswersOnly(questionAnswers),
				(a, ua) => Number.parseInt(ua.answer, 10) === a.ref_child_id,
			);
		default:
			return { hasCorrect: false, hasUnanswered: false };
	}
}

export function getAnswerStatus(
	question: Question,
	questionAnswers: Answer[],
	userSelectedAnswers: UserAnswer[],
	isFullyCorrect: boolean,
): AnswerStatus {
	// 1. Хариулаагүй
	if (userSelectedAnswers.length === 0) return "unanswered";

	// 2. Задгай даалгавар — багшийн үнэлгээнээс хамаарна
	if (question.que_type_id === 4) {
		if (question.unelsen !== 1) return "pending";
		if (question.zad_onoo === question.que_onoo) return "correct";
		return question.zad_onoo > 0 ? "partial" : "incorrect";
	}

	// 3. Бүгдэд зөв хариулсан
	if (isFullyCorrect) return "correct";

	// 4. Дутуу хариулсан (зарим нь хариулаагүй эсвэл зарим нь зөв)
	const check = checkAnswerCoverage(
		question,
		questionAnswers,
		userSelectedAnswers,
	);
	if (check.hasUnanswered || check.hasCorrect) return "partial";

	// 5. Бүгдэд хариулсан ч бүгд буруу
	return "incorrect";
}

function groupByQuestion<T extends { exam_que_id: number }>(
	items: T[] | null | undefined,
): Map<number, T[]> {
	const map = new Map<number, T[]>();
	for (const item of items ?? []) {
		const list = map.get(item.exam_que_id);
		if (list) list.push(item);
		else map.set(item.exam_que_id, [item]);
	}
	return map;
}

const EMPTY: never[] = [];

/** Асуулт бүрийн хариулт, төлөв, оноог нэг удаа тооцоолно. */
export function buildQuestionEntries(
	data: ExamResponseMoreApiResponse | undefined,
): QuestionEntry[] {
	const questions = data?.RetDataSecond;
	if (!questions?.length) return [];

	const answersByQ = groupByQuestion(data?.RetDataThirt);
	const userAnswersByQ = groupByQuestion(data?.RetDataFourth);

	return questions.map((question, index) => {
		const questionAnswers = answersByQ.get(question.exam_que_id) ?? EMPTY;
		const userSelectedAnswers =
			userAnswersByQ.get(question.exam_que_id) ?? EMPTY;
		const correct = isQuestionCorrect(
			question,
			questionAnswers,
			userSelectedAnswers,
		);
		const status = getAnswerStatus(
			question,
			questionAnswers,
			userSelectedAnswers,
			correct,
		);
		const earnedPoints = correct
			? question.que_onoo
			: calculatePartialPoints(question, questionAnswers, userSelectedAnswers);

		return {
			question,
			index,
			questionAnswers,
			userSelectedAnswers,
			isQuestionCorrect: correct,
			status,
			earnedPoints,
		};
	});
}
