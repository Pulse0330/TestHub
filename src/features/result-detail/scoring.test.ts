import { describe, expect, it } from "vitest";
import type {
	Answer,
	ExamResponseMoreApiResponse,
	Question,
	UserAnswer,
} from "@/types/exam/examResultMore";
import {
	buildQuestionEntries,
	calculatePartialPoints,
	getAnswerStatus,
	getQuestionPreview,
	getQuestionTypeLabel,
	isQuestionCorrect,
} from "./scoring";

// ------------------------------------------------------------
// Factories
// ------------------------------------------------------------

const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
	exam_id: 1,
	row_num: "1",
	exam_que_id: 1,
	question_img: "",
	que_zaawar: "",
	que_type_id: 1,
	que_onoo: 10,
	question_name: "",
	is_src: 0,
	source_html: "",
	shinjilgee: 0,
	bodolt: 0,
	source_name: null,
	source_img: null,
	unelsen: 0,
	zad_onoo: 0,
	zad_descr: "",
	urltype: "",
	truecnt: 0,
	...overrides,
});

const makeAnswer = (
	answer_id: number,
	overrides: Partial<Answer> = {},
): Answer => ({
	answer_id,
	answer_name: "",
	answer_name_html: "",
	answer_descr: "",
	answer_img: "",
	is_true: 0,
	exam_que_id: 1,
	answer_type: 1,
	refid: 0,
	ref_child_id: null,
	test_id: 1,
	...overrides,
});

const ua = (answer_id: number, answer = "1", exam_que_id = 1): UserAnswer => ({
	exam_que_id,
	answer_id,
	answer,
	quetype: 0,
});

/** Runs the same pipeline as buildQuestionEntries for one question. */
const evaluate = (q: Question, answers: Answer[], user: UserAnswer[]) => {
	const correct = isQuestionCorrect(q, answers, user);
	return {
		correct,
		points: calculatePartialPoints(q, answers, user),
		status: getAnswerStatus(q, answers, user, correct),
	};
};

// ------------------------------------------------------------
// Type 1 — single choice
// ------------------------------------------------------------

describe("type 1 (single choice)", () => {
	const q = makeQuestion({ que_type_id: 1, que_onoo: 10 });
	const answers = [
		makeAnswer(11, { is_true: 1 }),
		makeAnswer(12, { is_true: 0 }),
		makeAnswer(13, { is_true: 0 }),
	];

	it("correct choice → correct", () => {
		expect(evaluate(q, answers, [ua(11)])).toMatchObject({
			correct: true,
			status: "correct",
		});
	});

	it("wrong choice → incorrect, 0 points", () => {
		expect(evaluate(q, answers, [ua(12)])).toEqual({
			correct: false,
			points: 0,
			status: "incorrect",
		});
	});

	it("unanswered → unanswered, 0 points", () => {
		expect(evaluate(q, answers, [])).toEqual({
			correct: false,
			points: 0,
			status: "unanswered",
		});
	});

	it("no correct answer defined → never correct", () => {
		const none = [makeAnswer(11), makeAnswer(12)];
		expect(isQuestionCorrect(q, none, [ua(11)])).toBe(false);
	});

	it("single choice has no partial credit", () => {
		expect(calculatePartialPoints(q, answers, [ua(11)])).toBe(0);
	});
});

// ------------------------------------------------------------
// Type 2 — multiple choice
// ------------------------------------------------------------

describe("type 2 (multiple choice)", () => {
	const q = makeQuestion({ que_type_id: 2, que_onoo: 10, truecnt: 2 });
	const answers = [
		makeAnswer(21, { is_true: 1 }),
		makeAnswer(22, { is_true: 1 }),
		makeAnswer(23, { is_true: 0 }),
		makeAnswer(24, { is_true: 0 }),
	];

	it("all correct answers selected (any order) → correct", () => {
		expect(isQuestionCorrect(q, answers, [ua(21), ua(22)])).toBe(true);
		expect(isQuestionCorrect(q, answers, [ua(22), ua(21)])).toBe(true);
		expect(getAnswerStatus(q, answers, [ua(22), ua(21)], true)).toBe("correct");
	});

	it("one of two correct → partial, half points", () => {
		expect(evaluate(q, answers, [ua(21)])).toEqual({
			correct: false,
			points: 5,
			status: "partial",
		});
	});

	it("one correct + one wrong → penalty cancels out to 0, status partial", () => {
		expect(evaluate(q, answers, [ua(21), ua(23)])).toEqual({
			correct: false,
			points: 0,
			status: "partial",
		});
	});

	it("selecting more than truecnt → 0 points and not correct", () => {
		const user = [ua(21), ua(22), ua(23)];
		expect(isQuestionCorrect(q, answers, user)).toBe(false);
		expect(calculatePartialPoints(q, answers, user)).toBe(0);
	});

	it("all wrong, full count → incorrect", () => {
		expect(evaluate(q, answers, [ua(23), ua(24)])).toEqual({
			correct: false,
			points: 0,
			status: "incorrect",
		});
	});

	it("fewer selections than correct answers counts as partial (current rule), even if all wrong", () => {
		// Documents current behaviour: under-selection → hasUnanswered → "partial".
		expect(evaluate(q, answers, [ua(23)])).toEqual({
			correct: false,
			points: 0,
			status: "partial",
		});
	});

	it("points never go negative and are rounded to 1 decimal", () => {
		const q3 = makeQuestion({ que_type_id: 2, que_onoo: 10, truecnt: 3 });
		const three = [
			makeAnswer(1, { is_true: 1 }),
			makeAnswer(2, { is_true: 1 }),
			makeAnswer(3, { is_true: 1 }),
			makeAnswer(4),
		];
		expect(calculatePartialPoints(q3, three, [ua(1)])).toBe(3.3);
		expect(calculatePartialPoints(q3, three, [ua(1), ua(2)])).toBe(6.7);
		expect(calculatePartialPoints(q3, three, [ua(4)])).toBe(0);
	});

	it("no correct answers defined → 0 points", () => {
		expect(calculatePartialPoints(q, [makeAnswer(1)], [ua(1)])).toBe(0);
	});

	it("unanswered → unanswered", () => {
		expect(evaluate(q, answers, [])).toEqual({
			correct: false,
			points: 0,
			status: "unanswered",
		});
	});
});

// ------------------------------------------------------------
// Type 3 — fill-in / number input
// ------------------------------------------------------------

describe("type 3 (fill-in / number)", () => {
	const q = makeQuestion({ que_type_id: 3, que_onoo: 10 });
	const answers = [
		// answer_name_html is preferred; falls back to answer_name when empty
		makeAnswer(31, { answer_type: 3, answer_name: "5", answer_name_html: "" }),
		makeAnswer(32, { answer_type: 3, answer_name: "x", answer_name_html: "7" }),
	];

	it("all inputs right → correct", () => {
		expect(evaluate(q, answers, [ua(31, "5"), ua(32, "7")])).toMatchObject({
			correct: true,
			status: "correct",
		});
	});

	it("uses answer_name_html over answer_name", () => {
		expect(isQuestionCorrect(q, answers, [ua(31, "5"), ua(32, "x")])).toBe(
			false,
		);
	});

	it("one right, one missing → partial with half points", () => {
		expect(evaluate(q, answers, [ua(31, "5")])).toEqual({
			correct: false,
			points: 5,
			status: "partial",
		});
	});

	it("one right, one wrong → penalty → 0 points, partial", () => {
		expect(evaluate(q, answers, [ua(31, "5"), ua(32, "8")])).toEqual({
			correct: false,
			points: 0,
			status: "partial",
		});
	});

	it("all wrong → incorrect", () => {
		expect(evaluate(q, answers, [ua(31, "4"), ua(32, "8")])).toEqual({
			correct: false,
			points: 0,
			status: "incorrect",
		});
	});

	it("comparison is exact (whitespace is not trimmed)", () => {
		expect(isQuestionCorrect(q, answers, [ua(31, " 5"), ua(32, "7")])).toBe(
			false,
		);
	});

	it("unanswered → unanswered", () => {
		expect(evaluate(q, answers, []).status).toBe("unanswered");
	});
});

// ------------------------------------------------------------
// Type 4 — essay (teacher graded)
// ------------------------------------------------------------

describe("type 4 (essay)", () => {
	const answers = [makeAnswer(41, { answer_type: 4 })];
	const user = [ua(41, "My essay text")];

	it("ungraded essay → pending, 0 points, not correct", () => {
		const q = makeQuestion({ que_type_id: 4, unelsen: 0, zad_onoo: 0 });
		expect(evaluate(q, answers, user)).toEqual({
			correct: false,
			points: 0,
			status: "pending",
		});
	});

	it("ungraded essay stays pending even if zad_onoo is pre-filled", () => {
		const q = makeQuestion({ que_type_id: 4, unelsen: 0, zad_onoo: 10 });
		expect(evaluate(q, answers, user)).toEqual({
			correct: false,
			points: 0,
			status: "pending",
		});
	});

	it("graded with full points → correct", () => {
		const q = makeQuestion({
			que_type_id: 4,
			que_onoo: 10,
			unelsen: 1,
			zad_onoo: 10,
		});
		expect(evaluate(q, answers, user)).toEqual({
			correct: true,
			points: 10,
			status: "correct",
		});
	});

	it("graded with some points → partial, teacher's score", () => {
		const q = makeQuestion({
			que_type_id: 4,
			que_onoo: 10,
			unelsen: 1,
			zad_onoo: 4,
		});
		expect(evaluate(q, answers, user)).toEqual({
			correct: false,
			points: 4,
			status: "partial",
		});
	});

	it("graded with 0 → incorrect", () => {
		const q = makeQuestion({
			que_type_id: 4,
			que_onoo: 10,
			unelsen: 1,
			zad_onoo: 0,
		});
		expect(evaluate(q, answers, user)).toEqual({
			correct: false,
			points: 0,
			status: "incorrect",
		});
	});

	it("unanswered essay → unanswered (not pending)", () => {
		const q = makeQuestion({ que_type_id: 4, unelsen: 0 });
		expect(evaluate(q, answers, []).status).toBe("unanswered");
	});
});

// ------------------------------------------------------------
// Type 5 — ordering
// ------------------------------------------------------------

describe("type 5 (order)", () => {
	const q = makeQuestion({ que_type_id: 5, que_onoo: 9 });
	const answers = [
		makeAnswer(51, { answer_type: 5, refid: 1 }),
		makeAnswer(52, { answer_type: 5, refid: 2 }),
		makeAnswer(53, { answer_type: 5, refid: 3 }),
	];

	it("correct order → correct", () => {
		expect(
			evaluate(q, answers, [ua(51, "1"), ua(52, "2"), ua(53, "3")]),
		).toMatchObject({ correct: true, status: "correct" });
	});

	it("one position right → partial, proportional points (no penalty)", () => {
		expect(
			evaluate(q, answers, [ua(51, "2"), ua(52, "1"), ua(53, "3")]),
		).toEqual({ correct: false, points: 3, status: "partial" });
	});

	it("all positions wrong → incorrect", () => {
		expect(
			evaluate(q, answers, [ua(51, "2"), ua(52, "3"), ua(53, "1")]),
		).toEqual({ correct: false, points: 0, status: "incorrect" });
	});

	it("missing positions → partial", () => {
		expect(evaluate(q, answers, [ua(51, "1"), ua(52, "2")])).toEqual({
			correct: false,
			points: 6,
			status: "partial",
		});
	});

	it("unanswered → unanswered", () => {
		expect(evaluate(q, answers, []).status).toBe("unanswered");
	});
});

// ------------------------------------------------------------
// Type 6 — matching
// ------------------------------------------------------------

describe("type 6 (matching)", () => {
	const q = makeQuestion({ que_type_id: 6, que_onoo: 10 });
	const answers = [
		// "question" side (ref_child_id === -1), identified by refid
		makeAnswer(1, { answer_type: 6, refid: 100, ref_child_id: -1 }),
		makeAnswer(2, { answer_type: 6, refid: 200, ref_child_id: -1 }),
		// "answer" side, ref_child_id points at the matching question's refid
		makeAnswer(61, { answer_type: 6, refid: 1, ref_child_id: 100 }),
		makeAnswer(62, { answer_type: 6, refid: 2, ref_child_id: 200 }),
	];

	it("all matched correctly → correct", () => {
		expect(evaluate(q, answers, [ua(61, "100"), ua(62, "200")])).toMatchObject({
			correct: true,
			status: "correct",
		});
	});

	it("one right one wrong → partial, half points (no penalty)", () => {
		expect(evaluate(q, answers, [ua(61, "100"), ua(62, "100")])).toEqual({
			correct: false,
			points: 5,
			status: "partial",
		});
	});

	it("swapped → incorrect", () => {
		expect(evaluate(q, answers, [ua(61, "200"), ua(62, "100")])).toEqual({
			correct: false,
			points: 0,
			status: "incorrect",
		});
	});

	it("one right, one unanswered → partial", () => {
		expect(evaluate(q, answers, [ua(61, "100")])).toEqual({
			correct: false,
			points: 5,
			status: "partial",
		});
	});

	it("question-side rows are ignored when checking correctness", () => {
		// The user answer rows only reference the answer side; question rows
		// (ref_child_id -1) must not make the question fail.
		expect(isQuestionCorrect(q, answers, [ua(61, "100"), ua(62, "200")])).toBe(
			true,
		);
	});

	it("no answer-side rows → 0 partial points", () => {
		const onlyQuestions = answers.filter((a) => a.ref_child_id === -1);
		expect(calculatePartialPoints(q, onlyQuestions, [ua(61, "100")])).toBe(0);
	});

	it("unanswered → unanswered", () => {
		expect(evaluate(q, answers, []).status).toBe("unanswered");
	});
});

describe("unknown question type", () => {
	it("is never correct and earns 0", () => {
		const q = makeQuestion({ que_type_id: 99 });
		expect(evaluate(q, [makeAnswer(1, { is_true: 1 })], [ua(1)])).toEqual({
			correct: false,
			points: 0,
			status: "incorrect",
		});
	});
});

// ------------------------------------------------------------
// buildQuestionEntries
// ------------------------------------------------------------

describe("buildQuestionEntries", () => {
	const makeData = (
		questions: Question[],
		answers: Answer[] | null,
		userAnswers: UserAnswer[] | null,
	) =>
		({
			RetResponse: {
				ResponseMessage: "",
				StatusCode: "200",
				ResponseCode: "10",
				ResponseType: true,
			},
			RetDataFirst: [],
			RetDataSecond: questions,
			RetDataThirt: answers,
			RetDataFourth: userAnswers,
			RetDataFifth: [],
			RetDataSixth: null,
		}) as unknown as ExamResponseMoreApiResponse;

	it("returns [] for undefined / empty data", () => {
		expect(buildQuestionEntries(undefined)).toEqual([]);
		expect(buildQuestionEntries(makeData([], [], []))).toEqual([]);
	});

	it("groups answers by question and computes status + points per question", () => {
		const q1 = makeQuestion({ exam_que_id: 1, que_type_id: 1, que_onoo: 5 });
		const q2 = makeQuestion({
			exam_que_id: 2,
			que_type_id: 2,
			que_onoo: 10,
			truecnt: 2,
		});
		const q3 = makeQuestion({ exam_que_id: 3, que_type_id: 4, unelsen: 0 });
		const q4 = makeQuestion({ exam_que_id: 4, que_type_id: 1 });

		const answers = [
			makeAnswer(11, { exam_que_id: 1, is_true: 1 }),
			makeAnswer(12, { exam_que_id: 1 }),
			makeAnswer(21, { exam_que_id: 2, is_true: 1 }),
			makeAnswer(22, { exam_que_id: 2, is_true: 1 }),
			makeAnswer(31, { exam_que_id: 3, answer_type: 4 }),
			makeAnswer(41, { exam_que_id: 4, is_true: 1 }),
		];
		const userAnswers = [
			ua(11, "1", 1),
			ua(21, "1", 2),
			ua(31, "essay", 3),
			// q4 unanswered
		];

		const entries = buildQuestionEntries(
			makeData([q1, q2, q3, q4], answers, userAnswers),
		);

		expect(entries.map((e) => e.index)).toEqual([0, 1, 2, 3]);
		expect(entries.map((e) => e.status)).toEqual([
			"correct",
			"partial",
			"pending",
			"unanswered",
		]);
		expect(entries.map((e) => e.earnedPoints)).toEqual([5, 5, 0, 0]);
		expect(entries.map((e) => e.isQuestionCorrect)).toEqual([
			true,
			false,
			false,
			false,
		]);
		expect(entries[0].questionAnswers.map((a) => a.answer_id)).toEqual([
			11, 12,
		]);
		expect(entries[1].userSelectedAnswers.map((a) => a.answer_id)).toEqual([
			21,
		]);
		expect(entries[3].userSelectedAnswers).toEqual([]);
	});

	it("correct question earns full que_onoo", () => {
		const q = makeQuestion({ exam_que_id: 7, que_type_id: 1, que_onoo: 3 });
		const entries = buildQuestionEntries(
			makeData(
				[q],
				[makeAnswer(70, { exam_que_id: 7, is_true: 1 })],
				[ua(70, "1", 7)],
			),
		);
		expect(entries[0].earnedPoints).toBe(3);
	});

	it("tolerates null answer / user-answer arrays", () => {
		const q = makeQuestion({ exam_que_id: 1 });
		const entries = buildQuestionEntries(makeData([q], null, null));
		expect(entries).toHaveLength(1);
		expect(entries[0].status).toBe("unanswered");
		expect(entries[0].questionAnswers).toEqual([]);
	});
});

describe("labels / preview", () => {
	it("getQuestionTypeLabel falls back for unknown types", () => {
		expect(getQuestionTypeLabel(1)).toBe("Нэг сонголттой");
		expect(getQuestionTypeLabel(6)).toBe("Харгалзуулах");
		expect(getQuestionTypeLabel(42)).toBe("Бусад");
	});

	it("getQuestionPreview strips tags, nbsp, latex delimiters and whitespace", () => {
		expect(getQuestionPreview("<p>Solve&nbsp;\\(x+1\\)</p>\n<b>now</b>")).toBe(
			"Solve x+1 now",
		);
		expect(getQuestionPreview(null)).toBe("");
		expect(getQuestionPreview(undefined)).toBe("");
	});
});

describe("isQuestionCorrect — хариултын мөр байхгүй үед", () => {
	it.each([3, 5, 6])(
		"type %i: backend мөр ирээгүй бол зөв гэж тооцохгүй",
		(type) => {
			const question = { que_type_id: type } as Parameters<
				typeof isQuestionCorrect
			>[0];
			const userAnswers = [
				{ answer_id: 1, answer: "1" },
			] as unknown as Parameters<typeof isQuestionCorrect>[2];
			expect(isQuestionCorrect(question, [], userAnswers)).toBe(false);
		},
	);
});
