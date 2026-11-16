import { describe, expect, it } from "vitest";
import { queryKeys } from "../queryKeys";

describe("queryKeys", () => {
	it("exam and soril result lists never share a cache key (regression)", () => {
		const exam = queryKeys.results.examList(1, 5);
		const soril = queryKeys.results.sorilList(1, 5);
		expect(exam).not.toEqual(soril);
		expect(JSON.stringify(exam)).not.toBe(JSON.stringify(soril));
	});

	it("result list keys differ from the exam/soril lists themselves", () => {
		const all = [
			queryKeys.results.examList(1, 5),
			queryKeys.results.sorilList(1, 5),
			queryKeys.exams.list(1, 5),
			queryKeys.sorils.list(1, 5),
		].map((k) => JSON.stringify(k));
		expect(new Set(all).size).toBe(all.length);
	});

	it("result keys are scoped under results.all for prefix invalidation", () => {
		const prefix = queryKeys.results.all;
		for (const key of [
			queryKeys.results.examList(1, 5),
			queryKeys.results.sorilList(1, 5),
			queryKeys.results.summary(3),
			queryKeys.results.detail(3, 4, 1),
			queryKeys.results.dun(80),
		]) {
			expect(key.slice(0, prefix.length)).toEqual([...prefix]);
		}
	});

	it("keys include their parameters", () => {
		expect(queryKeys.results.examList(1, 5)).not.toEqual(
			queryKeys.results.examList(1, 6),
		);
		expect(queryKeys.results.examList(1, 5)).not.toEqual(
			queryKeys.results.examList(2, 5),
		);
		expect(queryKeys.exams.list(1, 5)).toEqual(["exams", "list", 1, 5]);
	});
});
