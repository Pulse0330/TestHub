import {
	AlignLeft,
	ClipboardCheck,
	FileText,
	Globe,
	Image as ImageIcon,
	ListChecks,
	Music,
	PlaySquare,
	Presentation,
	Video,
} from "lucide-react";
import type { ElementType } from "react";
import { teacherKey } from "@/features/teacher/hooks";
import { uploadImage } from "@/lib/api";
import type { ElibContentKind } from "@/lib/teacher-api";

/** `/elib/list` мөр */
export interface ElibRow {
	id: number;
	l_name?: string;
	l_desc?: string;
	l_image?: string;
	l_date?: string;
	l_flag?: number;
	is_owner?: number | boolean;
	teach_name?: string;
	class_name?: string;
	lesson_name?: string;
	rlesson_id?: number;
	topic_name?: string;
	ulesson_id?: number;
	unit_cnt?: number;
	test_cnt?: number;
	[key: string]: unknown;
}

export interface TreeUnit {
	ulesson_id: number;
	ulesson_name: string;
	topics: { rlesson_id: number; title: string }[];
}

export const elibKeys = {
	all: teacherKey("elib"),
	classes: (u: number) => teacherKey("elib", "classes", u),
	lessons: (u: number, c: number) => teacherKey("elib", "lessons", u, c),
	tree: (c: number, l: number) => teacherKey("elib", "tree", c, l),
	list: (p: Record<string, unknown>) => teacherKey("elib", "list", p),
	get: (id: number) => teacherKey("elib", "get", id),
	contents: (id: number) => teacherKey("elib", "contents", id),
	report: (id: number) => teacherKey("elib", "report", id),
};

export const isOwner = (r?: { is_owner?: unknown }) =>
	r?.is_owner === true || Number(r?.is_owner) === 1;

export const isColor = (v?: string) => !!v && /^#[0-9a-f]{3,8}$/i.test(v);

/** Тайван pastel өнгөнүүд (хавтасны нүүр). */
export const SWATCHES = [
	"#dbe7f7",
	"#dcefe6",
	"#f6ecd2",
	"#f3dfdc",
	"#e6e0f3",
	"#f2e1ec",
	"#e1ecee",
	"#ebe8e2",
];

// ============================================================
// Файл
// ============================================================
export const EXT = {
	image: ["jpg", "jpeg", "png", "gif", "webp"],
	video: ["mp4", "webm", "mov"],
	audio: ["mp3", "wav", "ogg", "m4a"],
	document: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"],
} as const;

export const extOf = (name: string) =>
	name.split("?")[0].split(".").pop()?.toLowerCase() ?? "";

export const isOfficeExt = (ext: string) =>
	["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext);

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
	return { url, name: file.name || res.file.name };
}

export function youtubeId(url?: string): string | null {
	if (!url) return null;
	const m = url.match(
		/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i,
	);
	return m ? m[1] : null;
}

// ============================================================
// Контентын төрөл
// ============================================================
export const KIND_META: Record<
	ElibContentKind,
	{ label: string; icon: ElementType; upload?: keyof typeof EXT }
> = {
	text: { label: "Текст", icon: AlignLeft },
	link: { label: "Холбоос", icon: Globe },
	youtube: { label: "YouTube", icon: PlaySquare },
	image: { label: "Зураг", icon: ImageIcon, upload: "image" },
	video: { label: "Видео", icon: Video, upload: "video" },
	audio: { label: "Аудио", icon: Music, upload: "audio" },
	document: { label: "Баримт бичиг", icon: FileText, upload: "document" },
	gdoc: { label: "Google баримт", icon: Presentation },
	test: { label: "Тест", icon: ListChecks },
	soril: { label: "Сорил", icon: ClipboardCheck },
};

export const KINDS = Object.keys(KIND_META) as ElibContentKind[];

export const kindOf = (v: unknown): ElibContentKind =>
	KINDS.includes(v as ElibContentKind) ? (v as ElibContentKind) : "text";
