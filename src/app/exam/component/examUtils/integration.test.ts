import { describe, expect, it } from "vitest";
import { formatIntegrationExamTime, parseExamIntegration } from "./integration";

describe("parseExamIntegration", () => {
	it("dbname, userid байвал integration горим", () => {
		expect(
			parseExamIntegration(
				"ikh_test_ub33",
				"77439",
				"3216",
				"https://big.nuudelms.mn/ExamEnd/40/77439",
			),
		).toEqual({
			dbname: "ikh_test_ub33",
			userId: 77439,
			classroomId: 3216,
			returnUrl: "https://big.nuudelms.mn/ExamEnd/40/77439",
		});
	});

	it("dbname эсвэл userid байхгүй / буруу бол null (системийн горим)", () => {
		expect(parseExamIntegration(null, "1", null, null)).toBeNull();
		expect(parseExamIntegration("  ", "1", null, null)).toBeNull();
		expect(parseExamIntegration("db", null, null, null)).toBeNull();
		expect(parseExamIntegration("db", "-5", null, null)).toBeNull();
		expect(parseExamIntegration("db", "1.5", null, null)).toBeNull();
		expect(parseExamIntegration("db", "abc", null, null)).toBeNull();
	});

	it("classroom_id буруу бол null", () => {
		expect(parseExamIntegration("db", "1", "x", null)?.classroomId).toBeNull();
		expect(parseExamIntegration("db", "1", "0", null)?.classroomId).toBeNull();
	});

	it("буцах хаяг зөвхөн http(s) — javascript: гэх мэтийг хаана", () => {
		expect(
			parseExamIntegration("db", "1", null, "javascript:alert(1)")?.returnUrl,
		).toBeNull();
		expect(
			parseExamIntegration("db", "1", null, "not a url")?.returnUrl,
		).toBeNull();
		expect(
			parseExamIntegration("db", "1", null, "http://example.mn/x")?.returnUrl,
		).toBe("http://example.mn/x");
	});
});

describe("formatIntegrationExamTime", () => {
	it("мм:сс хэлбэр", () => {
		expect(formatIntegrationExamTime(0)).toBe("00:00");
		expect(formatIntegrationExamTime(65)).toBe("01:05");
		expect(formatIntegrationExamTime(45 * 60 + 12)).toBe("45:12");
		expect(formatIntegrationExamTime(125 * 60)).toBe("125:00");
	});

	it("хасах, NaN утгыг 0 болгоно", () => {
		expect(formatIntegrationExamTime(-10)).toBe("00:00");
		expect(formatIntegrationExamTime(Number.NaN)).toBe("00:00");
	});
});
