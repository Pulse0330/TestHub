"use client";

// Тест/шалгалт/сорилын хэсгийн дотоод туслахууд (зөвхөн /teacher/exams-д).

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import MathContent from "@/components/MathContent";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { SelectOption } from "@/features/teacher/components";
import { listOf, teacherKey, useTeacher } from "@/features/teacher/hooks";
import { type ApiResponse, teacherApi, uploadImage } from "@/lib/api";
import type { TestType } from "@/lib/teacher-api";
import { cn } from "@/lib/utils";

export type Row = Record<string, unknown>;

// ============================================================
// Тогтмолууд
// ============================================================
export const TEST_TYPES: { value: TestType; label: string; plural: string }[] =
	[
		{ value: 1, label: "Тест", plural: "Тестүүд" },
		{ value: 2, label: "Шалгалт", plural: "Шалгалтууд" },
		{ value: 3, label: "Сорил", plural: "Сорилууд" },
	];

export const testTypeLabel = (t: TestType) =>
	TEST_TYPES.find((x) => x.value === t)?.label ?? "Тест";

export const parseTestType = (v: string | null | undefined): TestType => {
	const n = Number(v);
	return n === 2 || n === 3 ? n : 1;
};

export const QUE_TYPES: SelectOption[] = [
	{ value: 1, label: "Нэг сонголттой" },
	{ value: 2, label: "Олон сонголттой" },
	{ value: 3, label: "Тоо/хариу оруулах" },
	{ value: 4, label: "Нөхөх" },
	{ value: 5, label: "Дараалал" },
	{ value: 6, label: "Хослуулах" },
];
export const queTypeLabel = (t: number) =>
	QUE_TYPES.find((x) => Number(x.value) === t)?.label ?? "Даалгавар";

export const LEVELS: SelectOption[] = [
	{ value: 1, label: "Мэдлэг" },
	{ value: 2, label: "Ойлгох" },
	{ value: 3, label: "Хэрэглэх" },
	{ value: 4, label: "Задлан шинжлэх" },
];

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ============================================================
// Мөрөөс талбар уян хатан унших (backend-ийн нэршил тогтворгүй)
// ============================================================
export function pick(row: Row | undefined | null, ...keys: string[]): unknown {
	if (!row) return undefined;
	for (const k of keys) {
		const v = row[k];
		if (v !== undefined && v !== null && v !== "") return v;
	}
	return undefined;
}
export const str = (row: Row | undefined | null, ...keys: string[]) => {
	const v = pick(row, ...keys);
	return v === undefined ? "" : String(v);
};
export const num = (row: Row | undefined | null, ...keys: string[]) => {
	const v = Number(pick(row, ...keys));
	return Number.isFinite(v) ? v : 0;
};
export const bool = (row: Row | undefined | null, ...keys: string[]) => {
	const v = pick(row, ...keys);
	return v === true || v === 1 || v === "1" || v === "true" || v === "Y";
};

/** Хадгалсны дараах шинэ id (RetData.RtrID / NewID / RetID). */
export function savedIdOf(res: ApiResponse<unknown> | undefined): number {
	const d = res?.RetData;
	const r = (Array.isArray(d) ? d[0] : d) as Row | undefined;
	return num(r, "RtrID", "NewID", "RetID", "id");
}

/** RetData-г объект болгоно (массив бол эхний мөр). */
export function objOf(v: unknown): Row {
	if (Array.isArray(v)) return (v[0] as Row) ?? {};
	if (v && typeof v === "object") return v as Row;
	return {};
}
export function arrOf(v: unknown): Row[] {
	if (Array.isArray(v)) return v as Row[];
	if (typeof v === "string" && v.trim().startsWith("[")) {
		try {
			const p = JSON.parse(v);
			return Array.isArray(p) ? p : [];
		} catch {
			return [];
		}
	}
	if (v && typeof v === "object" && Array.isArray((v as Row).rows))
		return (v as { rows: Row[] }).rows;
	return [];
}

// ============================================================
// Огноо
// ============================================================
const pad = (n: number) => String(n).padStart(2, "0");
export const yearStart = () => `${new Date().getFullYear()}-01-01`;
export const yearEnd = () => `${new Date().getFullYear()}-12-31`;
/** Backend-ийн огноог datetime-local утга болгоно. */
export function toLocalInput(v: unknown): string {
	if (!v) return "";
	const s = String(v).replace(" ", "T");
	return s.length >= 16 ? s.slice(0, 16) : s;
}
/** datetime-local → "YYYY-MM-DD HH:mm:ss" */
export function toApiDateTime(v: string): string {
	if (!v) return "";
	const s = v.replace("T", " ");
	return s.length === 16 ? `${s}:00` : s;
}
export function nowLocalInput(addMinutes = 0): string {
	const d = new Date(Date.now() + addMinutes * 60_000);
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export const dateOnly = (v: unknown) => (v ? String(v).slice(0, 10) : "");

// ============================================================
// Лавлах (exam.ref) → SelectOption[]
// ============================================================
export function rowsToOptions(rows: Row[]): SelectOption[] {
	return rows
		.map((r) => ({
			value: pick(r, "id", "value", "code") as string | number,
			label: str(r, "title", "name", "label", "text"),
		}))
		.filter((o) => o.value !== undefined && o.value !== null);
}

type ExamRefArgs = Parameters<typeof teacherApi.exam.ref>[0];

/**
 * `teacherApi.exam.ref` — нэр + нэмэлт параметрээр сонголт авна.
 * Тайлбар: aimag_id, sym_id зэрэг нь API-ийн төрөлд байхгүй тул local cast.
 */
export function useExamRef(
	name: string,
	extra: Record<string, unknown> = {},
	enabled = true,
) {
	const { userId, schoolId } = useTeacher();
	const q = useQuery({
		queryKey: teacherKey("exam-ref", name, extra, userId, schoolId),
		queryFn: () =>
			teacherApi.exam.ref({
				name,
				user_id: userId,
				school_id: schoolId,
				...extra,
			} as ExamRefArgs),
		enabled: enabled && !!userId,
		staleTime: 5 * 60_000,
	});
	return {
		...q,
		rows: listOf<Row>(q.data),
		options: rowsToOptions(listOf<Row>(q.data)),
	};
}

export const optionLabel = (opts: SelectOption[], v: unknown) =>
	opts.find((o) => String(o.value) === String(v))?.label ?? "";

// ============================================================
// Асуултын нэгдсэн бүтэц (test.get / practice / export)
// ============================================================
export interface NAnswer {
	id: number;
	text: string;
	html: string;
	isTrue: boolean;
	refid: number;
	childId: number;
	descr: string;
	img: string;
}
export interface NQuestion {
	id: number;
	type: number;
	html: string;
	img: string;
	score: number;
	answers: NAnswer[];
	raw: Row;
}

const QID_KEYS = ["exam_que_id", "que_id", "question_id", "test_id_que"];
const qidOf = (r: Row) => num(r, ...QID_KEYS);

export function normalizeAnswer(a: Row): NAnswer {
	const html = str(
		a,
		"answer_name_html",
		"answer_html",
		"html",
		"answer_name",
		"text",
	);
	return {
		id: num(a, "answer_id", "id"),
		text: str(a, "answer_name", "text", "answer_text") || stripHtml(html),
		html,
		isTrue: bool(a, "is_true", "istrue", "true_ans"),
		refid: num(a, "refid", "ref_id"),
		childId: num(a, "ref_child_id", "match"),
		descr: str(a, "answer_descr", "descr"),
		img: str(a, "answer_img"),
	};
}

/** Төрөл бүрийн хариуг асуултын жагсаалт болгоно. */
export function normalizeQuestions(data: unknown): NQuestion[] {
	let qs: Row[] = [];
	let ans: Row[] = [];
	if (Array.isArray(data)) qs = data as Row[];
	else if (data && typeof data === "object") {
		const d = data as Row;
		qs = arrOf(pick(d, "questions", "rows", "tests", "items"));
		ans = arrOf(pick(d, "answers"));
	}
	// Хавтгай (асуулт × хариулт) мөрүүд бол бүлэглэнэ
	const flat =
		qs.length > 0 &&
		ans.length === 0 &&
		qs.every((r) => r.answer_id !== undefined && r.answers === undefined);
	if (flat) {
		ans = qs;
		const seen = new Map<number, Row>();
		for (const r of qs) if (!seen.has(qidOf(r))) seen.set(qidOf(r), r);
		qs = [...seen.values()];
	}
	return qs.map((q) => {
		const id = qidOf(q);
		const nested = arrOf(q.answers);
		let own = nested.length ? nested : ans.filter((a) => qidOf(a) === id);
		// Ганц асуулттай бол хариултууд id-гүй ирж болно
		if (!own.length && qs.length === 1) own = ans;
		return {
			id,
			type: num(q, "que_type_id", "que_type") || 1,
			html: str(
				q,
				"question_html",
				"question_name_html",
				"question_name",
				"que_html",
				"title",
			),
			img: str(q, "question_img", "que_img"),
			score: num(q, "onoo", "que_onoo", "score"),
			answers: own.map(normalizeAnswer),
			raw: q,
		};
	});
}

export function stripHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/** Хослуулах: зүүн тал (ref_child_id ≥ 1) ба баруун тал. */
export function splitPairs(answers: NAnswer[]) {
	const left = answers.filter((a) => a.childId >= 1);
	const right = answers.filter((a) => !(a.childId >= 1));
	return { left, right };
}

/** Зөв хариуг уншигдахуйц болгоно (хэвлэх/шалгах). */
export function correctSummary(q: NQuestion): string {
	if (q.type === 1 || q.type === 2) {
		return q.answers
			.map((a, i) => (a.isTrue ? LETTERS[i] : ""))
			.filter(Boolean)
			.join(", ");
	}
	if (q.type === 5) {
		const sorted = [...q.answers].sort((a, b) => a.refid - b.refid);
		return sorted.map((a) => LETTERS[q.answers.indexOf(a)] ?? "").join(" → ");
	}
	if (q.type === 6) {
		const { left, right } = splitPairs(q.answers);
		return left
			.map((l, i) => {
				const r = right.findIndex((x) => x.refid === l.childId);
				return `${i + 1}–${r >= 0 ? LETTERS[r] : "?"}`;
			})
			.join(", ");
	}
	return q.answers
		.map((a) => a.text)
		.filter(Boolean)
		.join("; ");
}

// ============================================================
// Жижиг UI
// ============================================================
export function ToggleRow({
	label,
	hint,
	checked,
	onChange,
}: {
	label: string;
	hint?: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	const id = useId();
	return (
		<div className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
			<label htmlFor={id} className="min-w-0 cursor-pointer">
				<span className="block text-sm font-bold">{label}</span>
				{hint && (
					<span className="block text-xs font-semibold text-muted-foreground">
						{hint}
					</span>
				)}
			</label>
			<Switch id={id} checked={checked} onCheckedChange={onChange} />
		</div>
	);
}

/** HTML/MathJax бичих — Textarea + урьдчилан харах. */
export function HtmlEditor({
	value,
	onChange,
	placeholder,
	rows = 3,
	label,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	rows?: number;
	label?: string;
}) {
	const [preview, setPreview] = useState(false);
	return (
		<div className="grid gap-1.5">
			<div className="flex items-center justify-between gap-2">
				{label && <span className="text-sm font-bold">{label}</span>}
				<button
					type="button"
					onClick={() => setPreview((p) => !p)}
					className="ml-auto rounded-lg px-2 py-0.5 text-xs font-bold text-primary hover:bg-muted"
					aria-pressed={preview}
				>
					{preview ? "Засах" : "Харах"}
				</button>
			</div>
			{preview ? (
				<div className="min-h-16 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
					{value.trim() ? (
						<MathContent html={value} />
					) : (
						<span className="text-muted-foreground">Хоосон</span>
					)}
				</div>
			) : (
				<Textarea
					value={value}
					rows={rows}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					aria-label={label ?? placeholder}
					className="font-mono text-sm"
				/>
			)}
		</div>
	);
}

export function ImageField({
	value,
	onChange,
	label = "Зураг",
}: {
	value: string;
	onChange: (url: string) => void;
	label?: string;
}) {
	const ref = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState(false);
	const onFile = async (file: File | undefined) => {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Зөвхөн зураг сонгоно уу");
			return;
		}
		setBusy(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const res = await uploadImage(fd);
			if (!res?.file?.url) throw new Error();
			onChange(res.file.url);
		} catch {
			toast.error("Зураг оруулахад алдаа гарлаа");
		} finally {
			setBusy(false);
			if (ref.current) ref.current.value = "";
		}
	};
	return (
		<div className="flex items-center gap-3">
			{value ? (
				// biome-ignore lint/performance/noImgElement: гадны upload URL
				<img
					src={value}
					alt={label}
					className="size-14 rounded-xl border border-border object-cover"
				/>
			) : null}
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={busy}
				onClick={() => ref.current?.click()}
			>
				{busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
				{value ? "Солих" : label}
			</Button>
			{value && (
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Зураг арилгах"
					onClick={() => onChange("")}
				>
					<X />
				</Button>
			)}
			<input
				ref={ref}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => onFile(e.target.files?.[0])}
			/>
		</div>
	);
}

/** Асуултыг (хариултуудтай) харуулах — засах/хэвлэх/шалгах дэлгэцэнд. */
export function QuestionBody({
	q,
	index,
	showCorrect,
	compact,
}: {
	q: NQuestion;
	index?: number;
	showCorrect?: boolean;
	compact?: boolean;
}) {
	const { left, right } = splitPairs(q.answers);
	return (
		<div className="grid gap-3">
			<div className="flex gap-2">
				{index !== undefined && (
					<span className="shrink-0 font-black tabular-nums">{index}.</span>
				)}
				<div className="min-w-0 flex-1 text-sm leading-relaxed">
					<MathContent html={q.html || "<i>(асуулт хоосон)</i>"} />
					{q.img && (
						// biome-ignore lint/performance/noImgElement: гадны URL
						<img
							src={q.img}
							alt=""
							className="mt-2 max-h-56 rounded-xl border border-border"
						/>
					)}
				</div>
			</div>
			{q.type === 6 ? (
				<div className="grid gap-2 sm:grid-cols-2">
					<ol className="grid gap-1.5">
						{left.map((a, i) => (
							<li key={`l${a.id || i}`} className={answerBox(false)}>
								<span className="font-black tabular-nums">{i + 1}.</span>
								<MathContent html={a.html} className="min-w-0 flex-1" />
								{showCorrect && (
									<span className="text-xs font-bold text-muted-foreground">
										→{" "}
										{LETTERS[right.findIndex((r) => r.refid === a.childId)] ??
											"?"}
									</span>
								)}
							</li>
						))}
					</ol>
					<ol className="grid gap-1.5">
						{right.map((a, i) => (
							<li key={`r${a.id || i}`} className={answerBox(false)}>
								<span className="font-black">{LETTERS[i]}.</span>
								<MathContent html={a.html} className="min-w-0 flex-1" />
							</li>
						))}
					</ol>
				</div>
			) : q.type === 3 || q.type === 4 ? (
				showCorrect ? (
					<p className="text-sm font-semibold text-muted-foreground">
						Хариу:{" "}
						<span className="font-bold text-foreground">
							{correctSummary(q) || "—"}
						</span>
					</p>
				) : null
			) : (
				<ol
					className={cn(
						"grid gap-1.5",
						!compact && q.answers.length > 2 && "sm:grid-cols-2",
					)}
				>
					{q.answers.map((a, i) => (
						<li
							key={a.id || i}
							className={answerBox(!!showCorrect && q.type !== 5 && a.isTrue)}
						>
							<span className="font-black">{LETTERS[i]}.</span>
							<MathContent html={a.html} className="min-w-0 flex-1" />
							{showCorrect && q.type !== 5 && a.isTrue && (
								<CheckCircle2
									className="size-4 shrink-0 text-pop-mint-ink"
									aria-label="Зөв хариулт"
								/>
							)}
						</li>
					))}
				</ol>
			)}
			{showCorrect && q.type === 5 && (
				<p className="text-xs font-bold text-muted-foreground">
					Зөв дараалал: {correctSummary(q)}
				</p>
			)}
		</div>
	);
}

const answerBox = (good: boolean) =>
	cn(
		"flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
		good
			? "border-pop-mint/50 bg-pop-mint-soft/60"
			: "border-border bg-muted/20",
	);

export function StatTile({
	label,
	value,
	active,
}: {
	label: string;
	value: number | string;
	active?: boolean;
}) {
	return (
		<div
			className={cn(
				"rounded-2xl border px-4 py-3",
				active
					? "border-primary/30 bg-primary-soft/40"
					: "border-border bg-card",
			)}
		>
			<p className="text-2xl font-black tabular-nums">{value}</p>
			<p className="text-xs font-bold text-muted-foreground">{label}</p>
		</div>
	);
}
