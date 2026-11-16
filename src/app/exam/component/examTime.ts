import type { QueryClient } from "@tanstack/react-query";

/** Үргэлжилсэн хугацааны "боломжгүй" дээд хязгаар (ийм утга ирвэл fallback ашиглана). */
const MAX_SANE_ELAPSED_SEC = 24 * 60 * 60;

/**
 * Backend-ийн огноог parse хийнэ. "YYYY-MM-DD HH:mm:ss" хэлбэрийг UTC гэж
 * үзнэ (ExamTimer-тэй ижил дүрэм — тоолуур болон илгээх хугацаа нийцнэ).
 */
export const parseServerDate = (dateStr: string): Date => {
	if (dateStr.includes("T") || dateStr.endsWith("Z")) {
		return new Date(dateStr);
	}
	return new Date(`${dateStr.replace(" ", "T")}Z`);
};

/** Секундийг "HH:mm:ss" болгоно. */
export const formatHMS = (totalSec: number): string => {
	const sec = Math.max(0, Math.floor(totalSec));
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	const s = sec % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/**
 * `useServerTime`-ийн ["serverTime"] cache-аас серверийн одоогийн цагийг
 * (ms) тооцно. Cache байхгүй бол null.
 */
export function getServerNowMs(queryClient: QueryClient): number | null {
	const state = queryClient.getQueryState<string>(["serverTime"]);
	if (!state?.data || !state.dataUpdatedAt) return null;
	const serverMs = new Date(state.data).getTime();
	if (Number.isNaN(serverMs)) return null;
	return serverMs + (Date.now() - state.dataUpdatedAt);
}

interface ElapsedInput {
	/** Шалгалт эхэлсэн серверийн огноо (ExamInfo.starteddate). */
	startedDate?: string | null;
	/** Серверийн одоогийн цаг (ms), мэдэгдэхгүй бол null. */
	serverNowMs: number | null;
	/** Төхөөрөмжийн одоогийн цаг (ms). */
	localNowMs: number;
	/** starteddate байхгүй/буруу үед ашиглах эхлэл (хуудас ачаалсан цаг). */
	fallbackStartMs: number;
	/** Шалгалтын нийт хугацаа (секунд) — үүнээс хэтрэхгүй. */
	maxSeconds?: number;
}

/**
 * Шалгалтын үргэлжилсэн хугацааг (секунд) тооцно:
 * серверийн цаг − starteddate, боломжгүй бол хуудас ачаалснаас хойших хугацаа.
 */
export function computeElapsedSeconds({
	startedDate,
	serverNowMs,
	localNowMs,
	fallbackStartMs,
	maxSeconds,
}: ElapsedInput): number {
	let elapsed: number | null = null;

	if (startedDate) {
		const startMs = parseServerDate(startedDate).getTime();
		if (!Number.isNaN(startMs)) {
			const now = serverNowMs ?? localNowMs;
			const sec = Math.floor((now - startMs) / 1000);
			if (sec >= 0 && sec <= MAX_SANE_ELAPSED_SEC) elapsed = sec;
		}
	}

	if (elapsed === null) {
		elapsed = Math.max(0, Math.floor((localNowMs - fallbackStartMs) / 1000));
	}

	if (maxSeconds !== undefined && maxSeconds > 0) {
		elapsed = Math.min(elapsed, maxSeconds);
	}
	return elapsed;
}
