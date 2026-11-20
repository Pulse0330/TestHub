import type { SelectOption } from "@/features/teacher/components";
import { teacherKey } from "@/features/teacher/hooks";

export type Row = Record<string, unknown>;

export const str = (v: unknown) =>
	v === null || v === undefined ? "" : String(v);
export const num = (v: unknown) => Number(v ?? 0) || 0;
export const bool = (v: unknown) =>
	v === true || v === 1 || v === "1" || v === "true" || v === "True";

/** Мөрөөс эхний хоосон биш утгыг авна (backend-ийн талбарын нэр тогтворгүй). */
export function pick(row: Row | undefined, ...keys: string[]): unknown {
	if (!row) return undefined;
	for (const k of keys) {
		const v = row[k];
		if (v !== null && v !== undefined && v !== "") return v;
	}
	return undefined;
}

const ID_KEYS = ["id", "value", "typeid", "type_id", "code"];
const LABEL_KEYS = ["title", "name", "typename", "type_name", "text", "label"];

/** Үл мэдэгдэх хэлбэртэй лавлахыг Select-ийн сонголт болгоно. */
export function optionsOf(rows: Row[]): SelectOption[] {
	if (!rows.length) return [];
	const first = rows[0];
	const keys = Object.keys(first);
	const idKey =
		ID_KEYS.find((k) => k in first) ??
		keys.find((k) => /id$/i.test(k)) ??
		keys[0];
	const labelKey =
		LABEL_KEYS.find((k) => k in first) ??
		keys.find((k) => /name$/i.test(k)) ??
		keys[1] ??
		idKey;
	return rows.map((r) => ({
		value: r[idKey] as string | number,
		label: str(r[labelKey]),
	}));
}

export const planKey = (...parts: unknown[]) => teacherKey("plan", ...parts);
