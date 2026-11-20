import { describe, expect, it } from "vitest";
import {
	formatSorilDate,
	getSorilStatus,
	type SorilDetail,
} from "../SorilDetailDialog";

const soril = (overrides: Partial<SorilDetail> = {}): SorilDetail => ({
	exam_id: 1,
	soril_name: "Test",
	sorildate: "2024-01-01T00:00:00Z",
	minut: 60,
	que_cnt: 10,
	isguitset: 0,
	test_resid: 0,
	ispay: 0,
	paid: 0,
	isopensoril: 0,
	...overrides,
});

describe("getSorilStatus", () => {
	it("fresh free soril: nothing set", () => {
		expect(getSorilStatus(soril())).toEqual({
			isCompleted: false,
			isLocked: false,
			isInProgress: false,
		});
	});

	it("completed", () => {
		expect(getSorilStatus(soril({ isguitset: 1, test_resid: 5 }))).toEqual({
			isCompleted: true,
			isLocked: false,
			isInProgress: false,
		});
	});

	it("paid soril not yet paid → locked", () => {
		expect(getSorilStatus(soril({ ispay: 1, paid: 0 })).isLocked).toBe(true);
	});

	it("paid soril already paid → not locked", () => {
		expect(getSorilStatus(soril({ ispay: 1, paid: 1 })).isLocked).toBe(false);
	});

	it("open soril is never locked even if unpaid", () => {
		expect(
			getSorilStatus(soril({ ispay: 1, paid: 0, isopensoril: 1 })).isLocked,
		).toBe(false);
	});

	it("completed soril is never locked", () => {
		expect(
			getSorilStatus(soril({ ispay: 1, paid: 0, isguitset: 1 })).isLocked,
		).toBe(false);
	});

	it("started but not completed → in progress", () => {
		expect(getSorilStatus(soril({ test_resid: 123 })).isInProgress).toBe(true);
	});
});

/**
 * Zero padding of `month/day: "numeric"` in the en-CA locale depends on the
 * ICU build (Node gives "2024/03/05", other engines may give "2024/3/5"),
 * so compare with leading zeros stripped.
 */
const fmt = (d: string | Date) =>
	formatSorilDate(d).replace(/(^|\/)0+(\d)/g, "$1$2");

describe("formatSorilDate (Asia/Ulaanbaatar, UTC+8)", () => {
	it("formats as Y/M/D", () => {
		expect(formatSorilDate("2024-03-05T04:00:00Z")).toMatch(/^2024\/0?3\/0?5$/);
	});

	it("rolls over to the next day in Ulaanbaatar time", () => {
		// 20:00 UTC on Dec 31 is 04:00 on Jan 1 in UB
		expect(fmt("2024-12-31T20:00:00Z")).toBe("2025/1/1");
		// 15:59 UTC is 23:59 UB — still the same day
		expect(fmt("2024-12-31T15:59:00Z")).toBe("2024/12/31");
		expect(fmt("2024-12-31T16:00:00Z")).toBe("2025/1/1");
	});

	it("accepts Date objects", () => {
		expect(fmt(new Date(Date.UTC(2024, 6, 9, 12)))).toBe("2024/7/9");
	});

	it("returns a placeholder for invalid dates", () => {
		expect(formatSorilDate("not a date")).toBe("Огноо тодорхойгүй");
		expect(formatSorilDate("")).toBe("Огноо тодорхойгүй");
	});
});
