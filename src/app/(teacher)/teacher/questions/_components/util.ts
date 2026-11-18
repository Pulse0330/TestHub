"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { SelectOption } from "@/features/teacher/components";
import { listOf, teacherKey, useTeacher } from "@/features/teacher/hooks";
import { teacherApi, uploadImage } from "@/lib/api";
import type { QuestionRefName } from "@/lib/teacher-api";

export type Row = Record<string, unknown>;

export const str = (v: unknown) =>
	v === null || v === undefined ? "" : String(v);
export const num = (v: unknown) => Number(v ?? 0) || 0;
export const bool = (v: unknown) =>
	v === true || v === 1 || v === "1" || v === "true" || v === "True";
/** 0 / "" → undefined (шүүлтүүрт "бүгд") */
export const optId = (v: unknown) => num(v) || undefined;

/** Мөрөөс эхний хоосон биш утгыг авна (backend-ийн талбарын нэр тогтворгүй). */
export function pick(row: Row | undefined, ...keys: string[]): unknown {
	if (!row) return undefined;
	for (const k of keys) {
		const v = row[k];
		if (v !== null && v !== undefined && v !== "") return v;
	}
	return undefined;
}

const ID_KEYS = ["id", "value", "code", "typeid", "type_id"];
const LABEL_KEYS = ["title", "name", "typename", "type_name", "text", "label"];

/** Үл мэдэгдэх хэлбэртэй лавлахыг Select-ийн сонголт болгоно. */
export function optionsOf(rows: Row[], idKeys = ID_KEYS): SelectOption[] {
	if (!rows.length) return [];
	const first = rows[0];
	const keys = Object.keys(first);
	const idKey =
		idKeys.find((k) => k in first) ??
		keys.find((k) => /(id|code)$/i.test(k)) ??
		keys[0];
	const labelKey =
		LABEL_KEYS.find((k) => k in first) ??
		keys.find((k) => /name$/i.test(k)) ??
		keys.find((k) => k !== idKey) ??
		idKey;
	return rows
		.map((r) => ({
			value: r[idKey] as string | number,
			label: str(r[labelKey]),
		}))
		.filter((o) => str(o.value) !== "");
}

export const qKey = (...parts: unknown[]) => teacherKey("question", ...parts);

/** Даалгаврын төрлүүд (que_types лавлах ирэхгүй үед). */
export const QUE_TYPES: Record<number, string> = {
	1: "Нэг сонголттой",
	2: "Олон сонголттой",
	3: "Нөхөх / тоо",
	4: "Задгай",
	5: "Эрэмбэлэх",
	6: "Харгалзуулах",
};
export const DEFAULT_TYPE_OPTIONS: SelectOption[] = Object.entries(
	QUE_TYPES,
).map(([value, label]) => ({ value: Number(value), label }));

/** question.ref лавлахын сонголтууд. */
export function useQuestionRef(
	name: QuestionRefName,
	params: {
		lesson_id?: number;
		curr_id?: number;
		ulesson_id?: number;
		teacher_id?: number;
	} = {},
	enabled = true,
) {
	const { userId, schoolId } = useTeacher();
	const q = useQuery({
		queryKey: qKey("ref", name, params),
		queryFn: () =>
			teacherApi.question.ref({
				name,
				...params,
				user_id: userId,
				school_id: schoolId,
			}),
		enabled: enabled && !!userId,
		staleTime: 5 * 60_000,
	});
	const options = useMemo(() => optionsOf(listOf<Row>(q.data)), [q.data]);
	return { options, isLoading: q.isLoading && enabled };
}

/** Зураг upload хийгээд бүтэн URL буцаана. */
export async function uploadFile(file: File): Promise<string> {
	const fd = new FormData();
	fd.append("file", file);
	const res = await uploadImage(fd);
	const url = res?.file?.url;
	if (!url) throw new Error(res?.message || "Файл хуулахад алдаа гарлаа");
	return url;
}
