// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiExamResponse, ChoosedAnswer } from "@/types/exam/exam";

vi.mock("@/lib/api", () => ({
	saveExamAnswer: vi.fn(),
	deleteExamAnswer: vi.fn(),
}));

import { deleteExamAnswer, saveExamAnswer } from "@/lib/api";
import {
	areAnswersEqual,
	isAnswerFilled,
	parseChoosedAnswers,
	useAnswerSync,
} from "./useAnswerSync";

const saveMock = vi.mocked(saveExamAnswer);
const deleteMock = vi.mocked(deleteExamAnswer);

const ca = (
	QueID: number,
	QueType: number | null,
	AnsID: number | null,
	Answer: string | null = null,
): ChoosedAnswer => ({ QueID, QueType, AnsID, Answer, PageNum: null });

// ============================================================
// Pure helpers
// ============================================================

describe("isAnswerFilled", () => {
	it.each([
		[undefined, false],
		[null, false],
		[[], false],
		[[1], true],
		["", false],
		["   ", false],
		["a", true],
		[0, false],
		[Number.NaN, false],
		[5, true],
		[{}, false],
		[{ 1: "x" }, true],
	])("%j → %s", (value, expected) => {
		// biome-ignore lint/suspicious/noExplicitAny: table-driven test input
		expect(isAnswerFilled(value as any)).toBe(expected);
	});
});

describe("areAnswersEqual", () => {
	it("handles identity and nullish values", () => {
		expect(areAnswersEqual(1, 1)).toBe(true);
		expect(areAnswersEqual(null, null)).toBe(true);
		expect(areAnswersEqual(undefined, undefined)).toBe(true);
		expect(areAnswersEqual(null, undefined)).toBe(false);
		expect(areAnswersEqual(1, null)).toBe(false);
		expect(areAnswersEqual(undefined, "a")).toBe(false);
	});

	it("does not coerce between types", () => {
		expect(areAnswersEqual(1, "1")).toBe(false);
		expect(areAnswersEqual([1], { 0: 1 })).toBe(false);
	});

	it("compares arrays element-wise and order-sensitively", () => {
		expect(areAnswersEqual([1, 2], [1, 2])).toBe(true);
		expect(areAnswersEqual([1, 2], [2, 1])).toBe(false);
		expect(areAnswersEqual([1, 2], [1, 2, 3])).toBe(false);
	});

	it("compares records including nested arrays", () => {
		expect(areAnswersEqual({ 1: "a", 2: "b" }, { 2: "b", 1: "a" })).toBe(true);
		expect(areAnswersEqual({ 1: "a" }, { 1: "b" })).toBe(false);
		expect(areAnswersEqual({ 1: "a" }, { 2: "a" })).toBe(false);
		expect(areAnswersEqual({ 1: "a" }, { 1: "a", 2: "b" })).toBe(false);
		expect(areAnswersEqual({ 10: [1, 2] }, { 10: [1, 2] })).toBe(true);
		expect(areAnswersEqual({ 10: [1, 2] }, { 10: [2, 1] })).toBe(false);
		expect(areAnswersEqual({ 10: [1, 2] }, { 10: [1] })).toBe(false);
	});
});

describe("parseChoosedAnswers", () => {
	it("returns empty structures for empty input", () => {
		const { answers, serverIds } = parseChoosedAnswers([]);
		expect(answers).toEqual({});
		expect(serverIds.size).toBe(0);
	});

	it("type 1: last row wins, invalid id → null", () => {
		expect(parseChoosedAnswers([ca(1, 1, 11), ca(1, 1, 12)]).answers[1]).toBe(
			12,
		);
		expect(parseChoosedAnswers([ca(1, 1, null)]).answers[1]).toBeNull();
		expect(parseChoosedAnswers([ca(1, 1, 0)]).answers[1]).toBeNull();
	});

	it("type 2: de-duplicates and drops invalid ids", () => {
		expect(
			parseChoosedAnswers([
				ca(2, 2, 21),
				ca(2, 2, 22),
				ca(2, 2, 21),
				ca(2, 2, null),
			]).answers[2],
		).toEqual([21, 22]);
	});

	it("type 3: map of answer_id → text", () => {
		expect(
			parseChoosedAnswers([ca(3, 3, 31, "5"), ca(3, 3, 32, null)]).answers[3],
		).toEqual({ 31: "5", 32: "" });
	});

	it("type 4: last text, empty string fallback", () => {
		expect(
			parseChoosedAnswers([ca(4, 4, 41, "draft"), ca(4, 4, 41, "final")])
				.answers[4],
		).toBe("final");
		expect(parseChoosedAnswers([ca(4, 4, 41, null)]).answers[4]).toBe("");
	});

	it("type 5: sorted by position, non-numeric positions last", () => {
		expect(
			parseChoosedAnswers([
				ca(5, 5, 53, "3"),
				ca(5, 5, 50, "x"),
				ca(5, 5, 51, "1"),
				ca(5, 5, 52, "2"),
			]).answers[5],
		).toEqual([51, 52, 53, 50]);
	});

	it("type 6: groups answer ids by matched question refid", () => {
		expect(
			parseChoosedAnswers([
				ca(6, 6, 61, "100"),
				ca(6, 6, 62, "200"),
				ca(6, 6, 63, "100"),
				ca(6, 6, 64, "0"),
				ca(6, 6, 65, null),
			]).answers[6],
		).toEqual({ 100: [61, 63], 200: [62] });
	});

	it("collects server answer ids per question, skipping invalid ids", () => {
		const { serverIds } = parseChoosedAnswers([
			ca(1, 1, 11),
			ca(2, 2, 21),
			ca(2, 2, 22),
			ca(2, 2, null),
			ca(3, 3, 0, "x"),
		]);
		expect([...(serverIds.get(1) ?? [])]).toEqual([11]);
		expect([...(serverIds.get(2) ?? [])]).toEqual([21, 22]);
		expect(serverIds.has(3)).toBe(false);
	});

	it("skips rows without QueID", () => {
		const { answers } = parseChoosedAnswers([
			// biome-ignore lint/suspicious/noExplicitAny: simulating bad backend data
			ca(null as any, 1, 11),
		]);
		expect(answers).toEqual({});
	});
});

// ============================================================
// Hook (fake timers, mocked API)
// ============================================================

const USER_ID = 7;
const EXAM_ID = 99;

const makeExamData = (choosed: ChoosedAnswer[] = []): ApiExamResponse =>
	({
		RetResponse: {},
		ExamInfo: [{ id: EXAM_ID, starteddate: "" }],
		Questions: [
			{ question_id: 1, que_type_id: 1, row_num: "1" },
			{ question_id: 2, que_type_id: 2, row_num: "2" },
		],
		Answers: [
			{ question_id: 1, answer_id: 11, answer_type: 1 },
			{ question_id: 1, answer_id: 12, answer_type: 1 },
			{ question_id: 2, answer_id: 21, answer_type: 2 },
			{ question_id: 2, answer_id: 22, answer_type: 2 },
		],
		ChoosedAnswer: choosed,
		ChoosedFiles: [],
		RetData: [],
	}) as unknown as ApiExamResponse;

interface Deferred {
	promise: Promise<never>;
	resolve: () => void;
	reject: (e: unknown) => void;
}
const deferred = (): Deferred => {
	let resolve!: () => void;
	let reject!: (e: unknown) => void;
	const promise = new Promise<never>((res, rej) => {
		resolve = () => res(undefined as never);
		reject = rej;
	});
	return { promise, resolve, reject };
};

/** answer_id values passed to saveExamAnswer, in call order. */
const savedAnswerIds = () => saveMock.mock.calls.map((c) => c[3]);

const setup = (choosed: ChoosedAnswer[] = []) => {
	const examData = makeExamData(choosed);
	return renderHook(() => useAnswerSync({ userId: USER_ID, examData }));
};

const advance = (ms: number) =>
	act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});

describe("useAnswerSync hook", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		saveMock.mockReset().mockResolvedValue({} as never);
		deleteMock.mockReset().mockResolvedValue({} as never);
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("initialises selectedAnswers from ChoosedAnswer", () => {
		const { result } = setup([ca(1, 1, 11), ca(2, 2, 21), ca(2, 2, 22)]);
		expect(result.current.selectedAnswers).toEqual({ 1: 11, 2: [21, 22] });
	});

	it("debounces and coalesces saves to the latest value per question", async () => {
		const { result } = setup();

		act(() => result.current.handleAnswerChange(1, 11));
		act(() => result.current.handleAnswerChange(1, 12));
		expect(result.current.selectedAnswers[1]).toBe(12);
		expect(result.current.pendingCount).toBe(1);

		await advance(999);
		expect(saveMock).not.toHaveBeenCalled();

		await advance(1);
		expect(saveMock).toHaveBeenCalledTimes(1);
		expect(saveMock).toHaveBeenCalledWith(USER_ID, EXAM_ID, 1, 12, 1, "1", 1);
		expect(result.current.pendingCount).toBe(0);
		expect(result.current.isSaving).toBe(false);
	});

	it("deletes previously saved server ids before saving the new value", async () => {
		const { result } = setup([ca(1, 1, 11)]);

		act(() => result.current.handleAnswerChange(1, 12));
		await advance(1000);

		expect(deleteMock).toHaveBeenCalledWith(USER_ID, EXAM_ID, 1, 11);
		expect(savedAnswerIds()).toEqual([12]);
	});

	it("reverting to the saved value clears the queued save", async () => {
		const { result } = setup([ca(1, 1, 11)]);

		act(() => result.current.handleAnswerChange(1, 12));
		expect(result.current.pendingCount).toBe(1);

		act(() => result.current.handleAnswerChange(1, 11));
		expect(result.current.pendingCount).toBe(0);

		await advance(5000);
		expect(saveMock).not.toHaveBeenCalled();
		expect(deleteMock).not.toHaveBeenCalled();
	});

	it("does not lose an edit made while a save is in flight", async () => {
		const first = deferred();
		saveMock.mockImplementationOnce(() => first.promise);
		const { result } = setup();

		act(() => result.current.handleAnswerChange(1, 11));
		await advance(1000);
		expect(savedAnswerIds()).toEqual([11]);
		expect(result.current.isSaving).toBe(true);

		// Edit while the first save is still pending
		act(() => result.current.handleAnswerChange(1, 12));

		await act(async () => {
			first.resolve();
		});
		await advance(1000);

		expect(savedAnswerIds()).toEqual([11, 12]);
		// The stale id 11 is removed before 12 is written
		expect(deleteMock).toHaveBeenCalledWith(USER_ID, EXAM_ID, 1, 11);
		expect(result.current.pendingCount).toBe(0);
		expect(result.current.isSaving).toBe(false);
	});

	it("an edit back to the in-flight value is still saved (server state unknown)", async () => {
		const first = deferred();
		saveMock.mockImplementationOnce(() => first.promise);
		const { result } = setup([ca(1, 1, 11)]);

		act(() => result.current.handleAnswerChange(1, 12));
		await advance(1000);
		// While 12 is being saved, user goes back to 11 (the previously saved value)
		act(() => result.current.handleAnswerChange(1, 11));
		expect(result.current.pendingCount).toBe(1);

		await act(async () => {
			first.resolve();
		});
		await advance(1000);
		expect(savedAnswerIds()).toEqual([12, 11]);
		expect(result.current.pendingCount).toBe(0);
	});

	it("flush() saves immediately and resolves only after saves complete", async () => {
		const pending = deferred();
		saveMock.mockImplementationOnce(() => pending.promise);
		const { result } = setup();

		act(() => result.current.handleAnswerChange(2, [21, 22]));

		let flushed: boolean | undefined;
		let flushPromise!: Promise<boolean>;
		act(() => {
			flushPromise = result.current.flush().then((v) => {
				flushed = v;
				return v;
			});
		});

		await advance(0);
		expect(saveMock).toHaveBeenCalledTimes(2); // 21 and 22
		expect(flushed).toBeUndefined();

		await act(async () => {
			pending.resolve();
			await flushPromise;
		});
		expect(flushed).toBe(true);
		expect(result.current.pendingCount).toBe(0);
	});

	it("flush() with nothing pending resolves true without API calls", async () => {
		const { result } = setup();
		let value: boolean | undefined;
		await act(async () => {
			value = await result.current.flush();
		});
		expect(value).toBe(true);
		expect(saveMock).not.toHaveBeenCalled();
	});

	it("retries a failed save with backoff and clears the error on success", async () => {
		saveMock.mockRejectedValueOnce(new Error("network"));
		const { result } = setup();

		act(() => result.current.handleAnswerChange(1, 11));
		await advance(1000);

		expect(saveMock).toHaveBeenCalledTimes(1);
		expect(result.current.hasSaveError).toBe(true);
		expect(result.current.pendingCount).toBe(1);

		// First retry after 2s backoff (1000 * 2^1)
		await advance(1999);
		expect(saveMock).toHaveBeenCalledTimes(1);
		await advance(1);
		expect(saveMock).toHaveBeenCalledTimes(2);
		expect(savedAnswerIds()).toEqual([11, 11]);
		expect(result.current.hasSaveError).toBe(false);
		expect(result.current.pendingCount).toBe(0);
	});

	it("ignores changes once locked and for unknown questions", async () => {
		const examData = makeExamData();
		const { result, rerender } = renderHook(
			({ locked }) => useAnswerSync({ userId: USER_ID, examData, locked }),
			{ initialProps: { locked: false } },
		);

		act(() => result.current.handleAnswerChange(999, 1));
		expect(result.current.selectedAnswers[999]).toBeUndefined();

		rerender({ locked: true });
		act(() => result.current.handleAnswerChange(1, 11));
		expect(result.current.selectedAnswers[1]).toBeUndefined();

		// lock is sticky even if the prop goes back to false
		rerender({ locked: false });
		act(() => result.current.handleAnswerChange(1, 11));
		expect(result.current.selectedAnswers[1]).toBeUndefined();

		await advance(5000);
		expect(saveMock).not.toHaveBeenCalled();
	});

	it("sends remaining answers on unmount", async () => {
		const { result, unmount } = setup();
		act(() => result.current.handleAnswerChange(1, 12));
		unmount();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(savedAnswerIds()).toEqual([12]);
	});
});
