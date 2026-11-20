// Захидлын хэсгийн туслахууд. Backend-ийн мөрийн талбарын нэр
// процедур бүрт өөр байж болох тул `pick`-ээр хэд хэдэн нэрээс авна.

import { teacherKey } from "@/features/teacher/hooks";
import { type UploadFileResult, uploadImage } from "@/lib/api";

export const lettersKey = (...p: unknown[]) => teacherKey("letters", ...p);

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

export const LETTER_STATUS = [
	{ value: -1, label: "Бүгд" },
	{ value: 0, label: "Ноорог" },
	{ value: 1, label: "Илгээсэн" },
	{ value: 2, label: "Товлосон" },
] as const;

export const statusTone = (s: number) =>
	s === 1 ? "mint" : s === 2 ? "sky" : "muted";
export const statusLabel = (s: number) =>
	LETTER_STATUS.find((x) => x.value === s)?.label ?? "Ноорог";

export const RECIPIENT_FILTERS = [
	{ value: 0, label: "Бүгд" },
	{ value: 1, label: "Уншаагүй" },
	{ value: 2, label: "Уншсан" },
	{ value: 3, label: "Танилцсан" },
] as const;

/** "2026-11-20 10:00:00" / ISO → datetime-local input-ийн утга */
export function toLocalInput(v: unknown): string {
	if (!v) return "";
	return String(v).replace(" ", "T").slice(0, 16);
}
/** datetime-local → backend "YYYY-MM-DD HH:mm" (хоосон бол undefined) */
export function fromLocalInput(v: string): string | undefined {
	if (!v) return undefined;
	return `${v.replace("T", " ")}${v.length === 16 ? ":00" : ""}`;
}

export function fileExt(name: string): string {
	const i = name.lastIndexOf(".");
	return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function formatSize(bytes: number): string {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Файл upload хийж бүтэн URL буцаана. */
export async function uploadFile(file: File): Promise<UploadFileResult> {
	const fd = new FormData();
	fd.append("file", file);
	const res = await uploadImage(fd);
	if (!res?.file?.url) throw new Error(res?.message || "Файл илгээж чадсангүй");
	return res;
}
