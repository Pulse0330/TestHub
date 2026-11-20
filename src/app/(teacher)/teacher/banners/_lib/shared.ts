// Баннерын хэсгийн туслахууд.

import { teacherKey } from "@/features/teacher/hooks";
import { type UploadFileResult, uploadImage } from "@/lib/api";

export const bannersKey = (...p: unknown[]) => teacherKey("banners", ...p);

export type Row = Record<string, unknown>;

/** Эхний хоосон биш талбарын утга. */
export function pick(row: Row | undefined | null, ...keys: string[]): unknown {
	if (!row) return undefined;
	for (const k of keys) {
		const v = row[k];
		if (v !== undefined && v !== null && v !== "") return v;
	}
	return undefined;
}
export const str = (row: Row | undefined | null, ...keys: string[]) =>
	String(pick(row, ...keys) ?? "");
export const num = (row: Row | undefined | null, ...keys: string[]) =>
	Number(pick(row, ...keys) ?? 0) || 0;
export const bool = (row: Row | undefined | null, ...keys: string[]) => {
	const v = pick(row, ...keys);
	return v === true || v === 1 || v === "1" || v === "true";
};

export const BANNER_TYPES = [
	{ value: 1, label: "Splash" },
	{ value: 2, label: "Нүүр" },
	{ value: 3, label: "Popup" },
];
export const PLATFORMS = [
	{ value: 3, label: "Апп + Вэб" },
	{ value: 1, label: "Апп" },
	{ value: 2, label: "Вэб" },
];
export const FLAGS = [
	{ value: -1, label: "Бүгд" },
	{ value: 1, label: "Идэвхтэй" },
	{ value: 0, label: "Идэвхгүй" },
];

const VIDEO_EXT = ["mp4", "webm", "mov", "m4v", "ogg"];
export function fileExt(name: string): string {
	const clean = name.split("?")[0];
	const i = clean.lastIndexOf(".");
	return i >= 0 ? clean.slice(i + 1).toLowerCase() : "";
}
export const isVideo = (nameOrExt: string, fileType?: number) =>
	fileType === 2 ||
	VIDEO_EXT.includes(nameOrExt.includes(".") ? fileExt(nameOrExt) : nameOrExt);

/** "2026-11-20 10:00:00" → "2026-11-20" (date input) */
export const toDateInput = (v: unknown) => (v ? String(v).slice(0, 10) : "");

/** Файл upload хийж бүтэн URL буцаана. */
export async function uploadFile(file: File): Promise<UploadFileResult> {
	const fd = new FormData();
	fd.append("file", file);
	const res = await uploadImage(fd);
	if (!res?.file?.url) throw new Error(res?.message || "Файл илгээж чадсангүй");
	return res;
}
