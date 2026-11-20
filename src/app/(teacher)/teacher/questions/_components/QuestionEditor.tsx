"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileQuestion, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	EmptyState,
	Field,
	OptionSelect,
	PageHeader,
	type SelectOption,
} from "@/features/teacher/components";
import {
	itemOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { QuestionAnswerInput, QuestionPairInput } from "@/lib/teacher-api";
import {
	type AnswerItem,
	AnswersEditor,
	letter,
	newAnswer,
	validateAnswers,
} from "./AnswersEditor";
import { QuestionActions } from "./QuestionActions";
import { HtmlEditor, ImageField } from "./ui";
import {
	bool,
	DEFAULT_TYPE_OPTIONS,
	num,
	pick,
	qKey,
	type Row,
	str,
	useQuestionRef,
} from "./util";

interface QForm {
	lesson_id: string;
	curr_id: string;
	ulesson_id: string;
	rlesson_id: string;
	source_id: string;
	que_type_id: string;
	que_level_id: string;
	que_usage: string;
	que_dedication: string;
	iscore: string;
	onoo: string;
	question_html: string;
	que_zaawar: string;
	que_descr: string;
	que_analys: string;
	question_img: string;
	descr_img: string;
	analys_img: string;
}

const EMPTY: QForm = {
	lesson_id: "",
	curr_id: "",
	ulesson_id: "",
	rlesson_id: "",
	source_id: "",
	que_type_id: "1",
	que_level_id: "",
	que_usage: "",
	que_dedication: "",
	iscore: "",
	onoo: "1",
	question_html: "",
	que_zaawar: "",
	que_descr: "",
	que_analys: "",
	question_img: "",
	descr_img: "",
	analys_img: "",
};

const defaultAnswers = () =>
	Array.from({ length: 4 }, (_, i) => newAnswer({ is_true: i === 0 }));

/** get-ийн RetData {info, answers, harg_left, harg_right} → маягт. */
function fromDetail(d: Row): { form: QForm; answers: AnswerItem[] } {
	const info = (
		d.info && typeof d.info === "object"
			? Array.isArray(d.info)
				? d.info[0]
				: d.info
			: d
	) as Row;
	const s = (...k: string[]) => str(pick(info, ...k));
	const id = (...k: string[]) => {
		const v = num(pick(info, ...k));
		return v ? String(v) : "";
	};
	const form: QForm = {
		lesson_id: id("lesson_id"),
		curr_id: id("curr_id"),
		ulesson_id: id("ulesson_id"),
		rlesson_id: id("rlesson_id"),
		source_id: id("source_id", "que_source_id"),
		que_type_id: id("que_type_id", "que_type") || "1",
		que_level_id: id("que_level_id", "level_id"),
		que_usage: id("que_usage", "skill_id"),
		que_dedication: id("que_dedication", "dedication_id"),
		iscore: id("iscore", "type_id"),
		onoo: s("onoo") || "1",
		question_html: s("question_html"),
		que_zaawar: s("que_zaawar"),
		que_descr: s("que_descr"),
		que_analys: s("que_analys"),
		question_img: s("question_img_url", "question_img"),
		descr_img: s("descr_img_url", "descr_img"),
		analys_img: s("analys_img_url", "analys_img"),
	};

	const type = num(form.que_type_id);
	let answers: AnswerItem[] = [];
	if (type === 6) {
		const left = (Array.isArray(d.harg_left) ? d.harg_left : []) as Row[];
		const right = (Array.isArray(d.harg_right) ? d.harg_right : []) as Row[];
		answers = left.map((l, i) => {
			const match = num(pick(l, "match", "match_id", "refid"));
			const r =
				right.find((x) => num(pick(x, "refid", "id")) === match) ?? right[i];
			return newAnswer({
				text: str(pick(l, "html", "text", "answer_html", "answer")),
				html: str(pick(r, "html", "text", "answer_html", "answer")),
				descr: str(pick(l, "descr")),
			});
		});
	} else {
		const rows = (Array.isArray(d.answers) ? d.answers : []) as Row[];
		const sorted =
			type === 5
				? [...rows].sort(
						(a, b) => num(pick(a, "refid")) - num(pick(b, "refid")),
					)
				: rows;
		answers = sorted.map((a) =>
			newAnswer({
				text: str(pick(a, "text", "answer_text", "label")),
				html: str(pick(a, "html", "answer_html", "answer", "ans_html")),
				is_true: bool(pick(a, "is_true", "istrue", "is_correct")),
			}),
		);
	}
	return { form, answers };
}

/** Маягтын хариултуудыг API-ийн хэлбэрт хөрвүүлнэ. */
function toPayload(type: number, items: AnswerItem[]) {
	const clean = items.filter((a) =>
		type === 6 ? a.text.trim() && a.html.trim() : a.html.trim(),
	);
	if (type === 4) return { answers: [] as QuestionAnswerInput[] };
	if (type === 6) {
		return {
			pairs: clean.map<QuestionPairInput>((a, i) => ({
				text: a.text,
				html: a.html,
				match: i + 1,
				refid: i + 1,
				descr: a.descr || undefined,
			})),
		};
	}
	return {
		answers: clean.map<QuestionAnswerInput>((a, i) => ({
			text:
				type === 3
					? a.text || `(${i + 1})`
					: type === 5
						? String(i + 1)
						: letter(i),
			html: a.html,
			is_true: type === 3 || type === 5 ? true : a.is_true,
			refid: i + 1,
		})),
	};
}

export function QuestionEditor({ questionId }: { questionId: number }) {
	const router = useRouter();
	const { userId, schoolId } = useTeacher();
	const isNew = !questionId;
	const [form, setForm] = useState<QForm>(EMPTY);
	const [answers, setAnswers] = useState<AnswerItem[]>(defaultAnswers);
	const [hidden, setHidden] = useState<boolean | undefined>(undefined);
	const [submitted, setSubmitted] = useState(false);
	const set = (p: Partial<QForm>) => setForm((f) => ({ ...f, ...p }));

	const detail = useQuery({
		queryKey: qKey("get", questionId),
		queryFn: () => teacherApi.question.get({ question_id: questionId }),
		enabled: !isNew,
	});
	useEffect(() => {
		const d = itemOf<Row>(detail.data);
		if (!d) return;
		const parsed = fromDetail(d);
		setForm(parsed.form);
		setAnswers(parsed.answers.length ? parsed.answers : defaultAnswers());
		const info = (d.info ?? d) as Row;
		const h = pick(info, "is_hide", "ishide", "is_hidden", "hidden");
		setHidden(h === undefined ? undefined : bool(h));
	}, [detail.data]);

	// Лавлахууд
	const lesson = num(form.lesson_id);
	const curr = num(form.curr_id);
	const ulesson = num(form.ulesson_id);
	const lessons = useQuestionRef("lessons");
	const currs = useQuestionRef("curr", { lesson_id: lesson }, !!lesson);
	const ulessons = useQuestionRef(
		curr ? "ulessons" : "ulessons_all",
		curr ? { lesson_id: lesson, curr_id: curr } : { lesson_id: lesson },
		!!lesson,
	);
	const rlessons = useQuestionRef(
		"rlessons",
		{ lesson_id: lesson, ulesson_id: ulesson },
		!!ulesson,
	);
	const sources = useQuestionRef(
		"sources",
		{ lesson_id: lesson, ulesson_id: ulesson },
		!!ulesson,
	);
	const types = useQuestionRef("que_types");
	const levels = useQuestionRef("levels");
	const skills = useQuestionRef("skills");
	const dedications = useQuestionRef("dedications");
	const iscores = useQuestionRef("types");
	const typeOptions = types.options.length
		? types.options
		: DEFAULT_TYPE_OPTIONS;

	const type = num(form.que_type_id);

	const changeType = (v: string) => {
		const t = num(v);
		set({ que_type_id: v });
		// Нэг сонголттой руу шилжихэд зөвхөн эхний зөвийг үлдээнэ
		if (t === 1) {
			let seen = false;
			setAnswers((list) =>
				list.map((a) => {
					const keep = a.is_true && !seen;
					if (a.is_true) seen = true;
					return { ...a, is_true: keep };
				}),
			);
		}
		if (t !== 4 && answers.length === 0) setAnswers(defaultAnswers());
	};

	const errors = useMemo(() => {
		const e: Partial<Record<keyof QForm | "answers", string>> = {};
		if (!lesson) e.lesson_id = "Хичээл сонгоно уу";
		if (!ulesson) e.ulesson_id = "Бүлэг сэдэв сонгоно уу";
		if (!type) e.que_type_id = "Төрөл сонгоно уу";
		if (!form.question_html.trim())
			e.question_html = "Даалгаврын агуулгыг оруулна уу";
		const a = validateAnswers(type, answers);
		if (a) e.answers = a;
		return e;
	}, [lesson, ulesson, type, form.question_html, answers]);
	const err = (k: keyof typeof errors) => (submitted ? errors[k] : undefined);

	const save = useTeacherMutation(
		() =>
			teacherApi.question.save({
				question_id: questionId || 0,
				lesson_id: lesson,
				ulesson_id: ulesson,
				rlesson_id: num(form.rlesson_id) || undefined,
				source_id: num(form.source_id) || undefined,
				que_type_id: type,
				que_level_id: num(form.que_level_id) || undefined,
				que_usage: num(form.que_usage) || undefined,
				que_dedication: num(form.que_dedication) || undefined,
				iscore: num(form.iscore) || undefined,
				question_html: form.question_html,
				que_zaawar: form.que_zaawar || undefined,
				que_descr: form.que_descr || undefined,
				que_analys: form.que_analys || undefined,
				question_img: form.question_img || undefined,
				descr_img: form.descr_img || undefined,
				analys_img: form.analys_img || undefined,
				onoo: Number(form.onoo) || 0,
				...toPayload(type, answers),
				user_id: userId,
				school_id: schoolId,
			}),
		{
			success: "Даалгавар хадгалагдлаа",
			invalidate: [qKey("list"), qKey("get", questionId)],
			onSuccess: (res) => {
				const d = res.RetData;
				const newId = num(d?.RtrID ?? d?.NewID ?? d?.RetID);
				if (isNew && newId) router.replace(`/teacher/questions/${newId}`);
				else if (isNew) router.push("/teacher/questions");
			},
		},
	);

	const submit = (e?: React.FormEvent) => {
		e?.preventDefault();
		setSubmitted(true);
		const first = Object.values(errors)[0];
		if (first) {
			toast.error(first);
			return;
		}
		save.mutate(undefined);
	};

	const goBack = () => {
		if (window.history.length > 1) router.back();
		else router.push("/teacher/questions");
	};

	if (!isNew && detail.isLoading) {
		return (
			<div className="grid gap-4">
				<Skeleton className="h-12 w-72 rounded-2xl" />
				<Skeleton className="h-96 rounded-3xl" />
			</div>
		);
	}
	if (!isNew && detail.isSuccess && !itemOf(detail.data)) {
		return (
			<div className="rounded-3xl border border-border bg-card">
				<EmptyState text="Даалгавар олдсонгүй">
					<Button variant="outline" onClick={goBack}>
						<ArrowLeft />
						Буцах
					</Button>
				</EmptyState>
			</div>
		);
	}

	const saveButton = (
		<Button type="submit" disabled={save.isPending}>
			{save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
			Хадгалах
		</Button>
	);

	return (
		<form onSubmit={submit} noValidate>
			<PageHeader
				title={isNew ? "Шинэ даалгавар" : `Даалгавар #${questionId}`}
				description="Даалгаврын сан"
				icon={FileQuestion}
				actions={
					<>
						<Button type="button" variant="ghost" onClick={goBack}>
							<ArrowLeft />
							Буцах
						</Button>
						{!isNew && (
							<QuestionActions
								questionId={questionId}
								hidden={hidden}
								onDeleted={() => router.push("/teacher/questions")}
							/>
						)}
						{saveButton}
					</>
				}
			/>

			<div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
				<div className="grid min-w-0 gap-4">
					<Section title="Даалгавар">
						<HtmlEditor
							label="Даалгаврын агуулга"
							required
							rows={6}
							value={form.question_html}
							onChange={(v) => set({ question_html: v })}
							placeholder="<p>...</p> — MathJax: \( x^2 \)"
							error={err("question_html")}
						/>
						<HtmlEditor
							label="Заавар"
							rows={2}
							value={form.que_zaawar}
							onChange={(v) => set({ que_zaawar: v })}
							hint="Сурагчид даалгаврын дээр харагдана"
						/>
						<ImageField
							label="Даалгаврын зураг"
							value={form.question_img}
							onChange={(v) => set({ question_img: v })}
						/>
					</Section>

					<Section
						title="Хариулт"
						description={typeOptions.find((o) => num(o.value) === type)?.label}
						error={err("answers")}
					>
						<AnswersEditor type={type} items={answers} onChange={setAnswers} />
					</Section>

					<Section title="Бодолт ба шинжилгээ">
						<HtmlEditor
							label="Бодолт"
							rows={4}
							value={form.que_descr}
							onChange={(v) => set({ que_descr: v })}
						/>
						<ImageField
							label="Бодолтын зураг"
							value={form.descr_img}
							onChange={(v) => set({ descr_img: v })}
						/>
						<HtmlEditor
							label="Шинжилгээ"
							rows={3}
							value={form.que_analys}
							onChange={(v) => set({ que_analys: v })}
						/>
						<ImageField
							label="Шинжилгээний зураг"
							value={form.analys_img}
							onChange={(v) => set({ analys_img: v })}
						/>
					</Section>
				</div>

				<div className="grid gap-4 lg:sticky lg:top-4">
					<Section title="Ангилал">
						<SelectField
							label="Хичээл"
							required
							options={lessons.options}
							value={form.lesson_id}
							loading={lessons.isLoading}
							error={err("lesson_id")}
							onChange={(v) =>
								set({
									lesson_id: v,
									curr_id: "",
									ulesson_id: "",
									rlesson_id: "",
									source_id: "",
								})
							}
						/>
						<SelectField
							label="Хөтөлбөр"
							options={currs.options}
							value={form.curr_id}
							disabled={!lesson}
							loading={currs.isLoading}
							onChange={(v) =>
								set({
									curr_id: v,
									ulesson_id: "",
									rlesson_id: "",
									source_id: "",
								})
							}
						/>
						<SelectField
							label="Бүлэг сэдэв"
							required
							options={ulessons.options}
							value={form.ulesson_id}
							disabled={!lesson}
							loading={ulessons.isLoading}
							error={err("ulesson_id")}
							onChange={(v) =>
								set({ ulesson_id: v, rlesson_id: "", source_id: "" })
							}
						/>
						<SelectField
							label="Сэдэв"
							options={rlessons.options}
							value={form.rlesson_id}
							disabled={!ulesson}
							loading={rlessons.isLoading}
							onChange={(v) => set({ rlesson_id: v })}
						/>
						<SelectField
							label="Эх сурвалж"
							options={sources.options}
							value={form.source_id}
							disabled={!ulesson}
							loading={sources.isLoading}
							onChange={(v) => set({ source_id: v })}
						/>
					</Section>
					<Section title="Тохиргоо">
						<SelectField
							label="Даалгаврын төрөл"
							required
							options={typeOptions}
							value={form.que_type_id}
							error={err("que_type_id")}
							onChange={changeType}
						/>
						<div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
							<SelectField
								label="Түвшин"
								options={levels.options}
								value={form.que_level_id}
								loading={levels.isLoading}
								onChange={(v) => set({ que_level_id: v })}
							/>
							<SelectField
								label="Чадвар"
								options={skills.options}
								value={form.que_usage}
								loading={skills.isLoading}
								onChange={(v) => set({ que_usage: v })}
							/>
							<SelectField
								label="Зориулалт"
								options={dedications.options}
								value={form.que_dedication}
								loading={dedications.isLoading}
								onChange={(v) => set({ que_dedication: v })}
							/>
							<SelectField
								label="Ангилал"
								options={iscores.options}
								value={form.iscore}
								loading={iscores.isLoading}
								onChange={(v) => set({ iscore: v })}
							/>
						</div>
						<Field label="Оноо">
							<Input
								type="number"
								min={0}
								step={0.5}
								inputMode="decimal"
								value={form.onoo}
								onChange={(e) => set({ onoo: e.target.value })}
							/>
						</Field>
					</Section>
					<div className="flex justify-end">{saveButton}</div>
				</div>
			</div>
		</form>
	);
}

function Section({
	title,
	description,
	error,
	children,
}: {
	title: string;
	description?: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
			<div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="text-base font-black tracking-tight">{title}</h2>
				{description && (
					<span className="text-xs font-bold text-muted-foreground">
						{description}
					</span>
				)}
			</div>
			<div className="grid gap-4">{children}</div>
			{error && (
				<p role="alert" className="mt-3 text-sm font-bold text-destructive">
					{error}
				</p>
			)}
		</section>
	);
}

function SelectField({
	label,
	options,
	value,
	onChange,
	required,
	disabled,
	loading,
	error,
}: {
	label: string;
	options: SelectOption[];
	value: string;
	onChange: (v: string) => void;
	required?: boolean;
	disabled?: boolean;
	loading?: boolean;
	error?: string;
}) {
	return (
		<Field label={label} required={required} error={error}>
			<OptionSelect
				options={options}
				value={value}
				onChange={onChange}
				disabled={disabled}
				placeholder={loading ? "Ачаалж байна..." : "Сонгох"}
				allLabel={required ? undefined : "Сонгоогүй"}
				className="sm:w-full"
			/>
		</Field>
	);
}
