"use client";

import {
	type QueryKey,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type ApiResponse, isApiSuccess, type Paged } from "@/lib/api-client";
import { useAuthStore } from "@/stores/useAuthStore";

/** Багш (4) болон менежер (3) — багшийн хэсэгт нэвтрэх эрхтэй ugroup-ууд. */
export const TEACHER_GROUPS = [3, 4] as const;
export const isTeacherGroup = (ugroup?: number | string | null) =>
	TEACHER_GROUPS.includes(Number(ugroup) as 3 | 4);

/** Нэвтэрсэн багшийн мэдээлэл (user_id, school_id ...). */
export function useTeacher() {
	const user = useAuthStore((s) => s.user);
	const userId = useAuthStore((s) => s.userId) ?? 0;
	// persist hydrate болтол хүлээнэ (SSR-д user null байдаг)
	const [hydrated, setHydrated] = useState(false);
	useEffect(() => setHydrated(true), []);
	return {
		hydrated,
		user,
		userId,
		schoolId: user?.school_id ?? 0,
		schoolName: user?.sch_name ?? "",
		loginName: user?.login_name ?? "",
		isManager: Number(user?.ugroup) === 3,
		isTeacher: isTeacherGroup(user?.ugroup),
	};
}

/** Багшийн хэсгийн query key — `["teacher", ...]` */
export const teacherKey = (...parts: unknown[]): QueryKey => [
	"teacher",
	...parts,
];

/** Жагсаалтын хариуг массив болгоно (ResponseCode "11" хоосон → []). */
export function listOf<T = Record<string, unknown>>(
	res: ApiResponse<unknown> | undefined,
): T[] {
	const d = res?.RetData;
	if (Array.isArray(d)) return d as T[];
	if (d && typeof d === "object" && Array.isArray((d as Paged).rows)) {
		return (d as Paged<T>).rows;
	}
	return [];
}

/** Хуудаслалттай хариу (`{ total, page, size, rows }`). */
export function pagedOf<T = Record<string, unknown>>(
	res: ApiResponse<unknown> | undefined,
): Paged<T> {
	const d = res?.RetData as Partial<Paged<T>> | T[] | undefined;
	if (Array.isArray(d))
		return { total: d.length, page: 1, size: d.length, rows: d };
	return {
		total: Number(d?.total ?? 0),
		page: Number(d?.page ?? 1),
		size: Number(d?.size ?? 0),
		rows: (d?.rows ?? []) as T[],
	};
}

/** Нэг объект буцаадаг хариу (`RetData` нь объект эсвэл 1 мөртэй массив). */
export function itemOf<T = Record<string, unknown>>(
	res: ApiResponse<unknown> | undefined,
): T | undefined {
	const d = res?.RetData;
	if (Array.isArray(d)) return d[0] as T | undefined;
	return (d ?? undefined) as T | undefined;
}

/** ResponseCode "10" биш бол backend-ийн мессежтэй алдаа шиднэ. */
export function unwrap<T extends ApiResponse<unknown>>(res: T): T {
	if (!isApiSuccess(res)) {
		throw new Error(res.RetResponse?.ResponseMessage || "Алдаа гарлаа");
	}
	return res;
}

/**
 * Хадгалах/устгах үйлдэл: амжилттай бол toast + холбогдох query-г
 * шинэчилнэ, алдаа бол backend-ийн мессежийг харуулна.
 */
export function useTeacherMutation<V, R extends ApiResponse<unknown>>(
	fn: (vars: V) => Promise<R>,
	opts: {
		success?: string;
		invalidate?: QueryKey[];
		onSuccess?: (res: R, vars: V) => void;
	} = {},
) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (vars: V) => unwrap(await fn(vars)),
		onSuccess: (res, vars) => {
			toast.success(
				opts.success ?? (res.RetResponse?.ResponseMessage || "Амжилттай"),
			);
			for (const key of opts.invalidate ?? []) {
				qc.invalidateQueries({ queryKey: key });
			}
			opts.onSuccess?.(res, vars);
		},
		onError: (err: Error) => {
			toast.error(err.message || "Алдаа гарлаа");
		},
	});
}
