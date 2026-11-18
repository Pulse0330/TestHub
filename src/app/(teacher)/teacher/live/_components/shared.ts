import { toast } from "sonner";
import { teacherKey } from "@/features/teacher/hooks";
import { uploadImage } from "@/lib/api";

/** Live жагсаалтын мөр (`/live/list`). */
export interface LiveRow {
	id: number;
	live_title?: string;
	lesson_name?: string;
	typename?: string;
	sdate?: string;
	edate?: string;
	url?: string;
	title?: string;
	pass?: string;
	help?: string;
	logo?: string;
	live_file_id?: number;
	[key: string]: unknown;
}

/** `/live/info` → RetDataFirst */
export interface LiveInfo extends LiveRow {
	lesson_id?: number;
	contime?: number;
	ltype?: number;
	descr?: string;
	ispay?: number;
	amount?: number;
	optype?: number;
	stu_live?: number;
	teach_name?: string;
}

export interface LiveContentItem {
	kind: "url" | "file";
	url: string;
	embed_id?: string;
	filename?: string;
}

export interface LiveContent {
	descr?: string;
	is_open?: boolean | number;
	items?: LiveContentItem[];
}

export const liveKeys = {
	all: teacherKey("live"),
	list: (p: Record<string, unknown>) => teacherKey("live", "list", p),
	info: (id: number) => teacherKey("live", "info", id),
	students: (id: number, p: Record<string, unknown>) =>
		teacherKey("live", "students", id, p),
	content: (id: number) => teacherKey("live", "content", id),
};

/** "YYYY-MM-DD HH:mm[:ss]" → Date */
export function parseDate(v: unknown): Date | null {
	if (!v) return null;
	const d = new Date(String(v).replace(" ", "T"));
	return Number.isNaN(d.getTime()) ? null : d;
}

export type LiveState = "live" | "upcoming" | "ended";

export function liveState(row: Pick<LiveRow, "sdate" | "edate">): LiveState {
	const now = Date.now();
	const s = parseDate(row.sdate)?.getTime() ?? 0;
	const e = parseDate(row.edate)?.getTime() ?? s;
	if (s && now < s) return "upcoming";
	if (e && now > e) return "ended";
	return "live";
}

/** YouTube холбоосоос video id гаргана. */
export function youtubeId(url: string): string | null {
	const m = url.match(
		/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i,
	);
	return m ? m[1] : null;
}

export const isAllowedRecordingUrl = (url: string) =>
	!!youtubeId(url) || /^https?:\/\/([\w-]+\.)*cdn\.esis\.edu\.mn\//i.test(url);

export const VIDEO_EXT = ["mp4", "webm", "mov"];

/** Файлыг uploads.ecm.mn руу байршуулж бүтэн URL буцаана. */
export async function uploadFile(
	file: File,
): Promise<{ url: string; name: string }> {
	const fd = new FormData();
	fd.append("file", file);
	const res = await uploadImage(fd);
	if (res.fileStatus !== 0 || !res.file?.url) {
		throw new Error(res.message || "Файл байршуулж чадсангүй");
	}
	const url = /^https?:\/\//i.test(res.file.url)
		? res.file.url
		: new URL(res.file.url, "https://uploads.ecm.mn").href;
	return { url, name: res.file.name || file.name };
}

export const extOf = (name: string) =>
	name.split(".").pop()?.toLowerCase() ?? "";

export async function copyText(text: string, label: string) {
	try {
		await navigator.clipboard.writeText(text);
		toast.success(`${label} хуулагдлаа`);
	} catch {
		toast.error("Хуулж чадсангүй");
	}
}
