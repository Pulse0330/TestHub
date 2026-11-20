// Backend (clickup.ecm.mn/api) руу дуудах нийтлэг helper ба хариуны төрлүүд.
// DB холболтыг backend өөрийн .env-ээс авдаг — body-д `conn` явуулахгүй.

import api from "@/lib/axios";

/** Backend-ийн стандарт хариуны толгой. ResponseCode "10" амжилттай, "11" алдаа/хоосон. */
export interface ApiRetResponse {
	ResponseMessage: string;
	StatusCode: string;
	ResponseCode: string;
	ResponseType: boolean;
}

/**
 * Backend-ийн стандарт хариу. Нэг хүснэгттэй бол `RetData`,
 * хоёр хүснэгттэй бол `RetDataFirst` / `RetDataSecond`.
 */
export interface ApiResponse<T = unknown, F = unknown, S = unknown> {
	RetResponse: ApiRetResponse;
	RetData?: T;
	RetDataFirst?: F;
	RetDataSecond?: S;
}

/** Хуудаслалттай жагсаалт (`RetData`). */
export interface Paged<T = unknown> {
	total: number;
	page: number;
	size: number;
	rows: T[];
}

/** Хуудаслалтын параметр. */
export interface PageParams {
	page?: number;
	size?: number;
}

/** Хариу амжилттай эсэх (ResponseCode "10"). */
export const isApiSuccess = (res: Pick<ApiResponse, "RetResponse">) =>
	res.RetResponse?.ResponseCode === "10";

/** POST /api/{path} — body-г JSON-оор илгээж хариуны body-г буцаана. */
export async function apiPost<T = unknown, F = unknown, S = unknown>(
	path: string,
	body: object = {},
): Promise<ApiResponse<T, F, S>> {
	const { data } = await api.post<ApiResponse<T, F, S>>(path, body);
	return data;
}

/** GET /api/{path}. */
export async function apiGet<T = unknown>(
	path: string,
): Promise<ApiResponse<T>> {
	const { data } = await api.get<ApiResponse<T>>(path);
	return data;
}
