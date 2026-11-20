import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	computeElapsedSeconds,
	formatHMS,
	getServerNowMs,
	parseServerDate,
} from "./examTime";

describe("parseServerDate", () => {
	it('treats "YYYY-MM-DD HH:mm:ss" as UTC', () => {
		expect(parseServerDate("2024-01-02 03:04:05").toISOString()).toBe(
			"2024-01-02T03:04:05.000Z",
		);
	});

	it("passes ISO strings through unchanged", () => {
		expect(parseServerDate("2024-01-02T03:04:05Z").toISOString()).toBe(
			"2024-01-02T03:04:05.000Z",
		);
		expect(parseServerDate("2024-01-02T03:04:05+08:00").toISOString()).toBe(
			"2024-01-01T19:04:05.000Z",
		);
	});

	it("returns Invalid Date for garbage", () => {
		expect(Number.isNaN(parseServerDate("not a date").getTime())).toBe(true);
	});
});

describe("formatHMS", () => {
	it.each([
		[0, "00:00:00"],
		[59, "00:00:59"],
		[60, "00:01:00"],
		[3661, "01:01:01"],
		[59.9, "00:00:59"],
		[-5, "00:00:00"],
		[100 * 3600, "100:00:00"],
	])("%s → %s", (sec, expected) => {
		expect(formatHMS(sec)).toBe(expected);
	});
});

describe("computeElapsedSeconds", () => {
	const start = "2024-01-01 10:00:00";
	const startMs = Date.UTC(2024, 0, 1, 10, 0, 0);
	const base = {
		localNowMs: startMs + 999_999_000,
		fallbackStartMs: startMs + 999_999_000 - 42_000,
	};

	it("uses server time minus starteddate", () => {
		expect(
			computeElapsedSeconds({
				...base,
				startedDate: start,
				serverNowMs: startMs + 300_500,
			}),
		).toBe(300);
	});

	it("uses local time when server time is unknown", () => {
		expect(
			computeElapsedSeconds({
				startedDate: start,
				serverNowMs: null,
				localNowMs: startMs + 61_000,
				fallbackStartMs: 0,
			}),
		).toBe(61);
	});

	it("falls back to page-load time when starteddate is missing or invalid", () => {
		for (const startedDate of [undefined, null, "", "garbage"]) {
			expect(
				computeElapsedSeconds({ ...base, startedDate, serverNowMs: null }),
			).toBe(42);
		}
	});

	it("falls back when starteddate is in the future (negative elapsed)", () => {
		expect(
			computeElapsedSeconds({
				...base,
				startedDate: start,
				serverNowMs: startMs - 10_000,
			}),
		).toBe(42);
	});

	it("falls back when elapsed exceeds 24h (insane value)", () => {
		expect(
			computeElapsedSeconds({
				...base,
				startedDate: start,
				serverNowMs: startMs + 25 * 3600 * 1000,
			}),
		).toBe(42);
		// exactly 24h is still accepted
		expect(
			computeElapsedSeconds({
				...base,
				startedDate: start,
				serverNowMs: startMs + 24 * 3600 * 1000,
			}),
		).toBe(24 * 3600);
	});

	it("never returns a negative fallback", () => {
		expect(
			computeElapsedSeconds({
				startedDate: null,
				serverNowMs: null,
				localNowMs: 1000,
				fallbackStartMs: 5000,
			}),
		).toBe(0);
	});

	it("clamps to maxSeconds when positive, ignores 0", () => {
		const input = {
			...base,
			startedDate: start,
			serverNowMs: startMs + 3600_000,
		};
		expect(computeElapsedSeconds({ ...input, maxSeconds: 600 })).toBe(600);
		expect(computeElapsedSeconds({ ...input, maxSeconds: 0 })).toBe(3600);
	});
});

describe("getServerNowMs", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns null when serverTime is not cached", () => {
		expect(getServerNowMs(new QueryClient())).toBeNull();
	});

	it("advances the cached server time by local time passed since fetch", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
		const qc = new QueryClient();
		qc.setQueryData(["serverTime"], "2024-05-05T12:00:00Z");
		vi.advanceTimersByTime(5000);
		expect(getServerNowMs(qc)).toBe(Date.UTC(2024, 4, 5, 12, 0, 5));
	});

	it("returns null for an unparseable cached value", () => {
		const qc = new QueryClient();
		qc.setQueryData(["serverTime"], "nope");
		expect(getServerNowMs(qc)).toBeNull();
	});
});
