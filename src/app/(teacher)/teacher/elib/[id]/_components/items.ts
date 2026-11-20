import { formatDateTime } from "@/features/teacher/components";
import type { ElibContentInput, ElibContentKind } from "@/lib/teacher-api";
import { kindOf, youtubeId } from "../../_components/shared";

/** Засварлагч дахь нэг контент (локал түлхүүртэй). */
export interface EditItem {
	key: string;
	id: number | null;
	kind: ElibContentKind;
	title: string;
	descr: string;
	text: string;
	url: string;
	filename: string;
	is_homework: boolean;
	my_test_id: number;
	test_title: string;
	is_date: boolean;
	/** datetime-local утга ("YYYY-MM-DDTHH:mm") */
	exam_edate: string;
}

let seq = 0;
export const newKey = () => `n${Date.now().toString(36)}${++seq}`;

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const b = (v: unknown) => v === true || Number(v) === 1;

export function emptyItem(kind: ElibContentKind): EditItem {
	return {
		key: newKey(),
		id: null,
		kind,
		title: "",
		descr: "",
		text: "",
		url: "",
		filename: "",
		is_homework: false,
		my_test_id: 0,
		test_title: "",
		is_date: false,
		exam_edate: "",
	};
}

/** `/elib/contents` → RetDataSecond мөрийг засварлагчийн мөр болгоно. */
export function fromRow(r: Record<string, unknown>): EditItem {
	const id = Number(r.id ?? r.content_id ?? 0);
	return {
		key: id ? `i${id}` : newKey(),
		id: id || null,
		kind: kindOf(r.kind ?? r.ctype),
		title: s(r.title),
		descr: s(r.descr),
		text: s(r.text),
		url: s(r.url),
		filename: s(r.filename),
		is_homework: b(r.is_homework),
		my_test_id: Number(r.my_test_id ?? 0),
		test_title: s(r.test_title ?? r.test_name),
		is_date: b(r.is_date),
		exam_edate: formatDateTime(r.exam_edate).replace(" ", "T"),
	};
}

export function toInput(it: EditItem): ElibContentInput {
	const isTest = it.kind === "test" || it.kind === "soril";
	return {
		id: it.id,
		kind: it.kind,
		title: it.title.trim(),
		descr: it.descr.trim() || undefined,
		text: it.kind === "text" ? it.text : undefined,
		url: !isTest && it.kind !== "text" ? it.url.trim() : undefined,
		filename: it.filename || undefined,
		is_homework: it.is_homework,
		my_test_id: isTest ? it.my_test_id : undefined,
		is_date: isTest ? it.is_date : undefined,
		exam_edate:
			isTest && it.is_date ? it.exam_edate.replace("T", " ") : undefined,
	};
}

/** Хадгалахаас өмнөх шалгалт — алдаатай мөрийн мессеж. */
export function validate(it: EditItem): string | undefined {
	if (!it.title.trim()) return "Гарчиг оруулна уу";
	switch (it.kind) {
		case "text":
			return it.text.trim() ? undefined : "Текст оруулна уу";
		case "test":
		case "soril":
			if (!it.my_test_id) return "Тест сонгоно уу";
			if (it.is_date && !it.exam_edate) return "Дуусах хугацаа оруулна уу";
			return undefined;
		case "youtube":
			return youtubeId(it.url) ? undefined : "YouTube холбоос буруу";
		default:
			if (!it.url.trim()) return "Холбоос эсвэл файл оруулна уу";
			if (!/^https?:\/\//i.test(it.url.trim()))
				return "http(s):// -ээр эхэлсэн холбоос";
			return undefined;
	}
}
