"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FormDialog, OptionSelect } from "@/features/teacher/components";
import {
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { QuestionAnswerInput, QuestionPairInput } from "@/lib/teacher-api";
import { cn } from "@/lib/utils";
import {
	arrOf,
	HtmlEditor,
	ImageField,
	LETTERS,
	LEVELS,
	type NQuestion,
	normalizeQuestions,
	num,
	objOf,
	pick,
	QUE_TYPES,
	type Row,
	splitPairs,
	str,
	stripHtml,
} from "../shared";
import { testKey } from "./MaterialWizard";

interface Item {
	key: string;
	html: string;
	isTrue: boolean;
}
interface Pair {
	key: string;
	left: string;
	right: string;
}

let seq = 0;
const k = () => `a${seq++}`;
const blankItems = (n: number): Item[] =>
	Array.from({ length: n }, () => ({ key: k(), html: "", isTrue: false }));
const blankPairs = (n: number): Pair[] =>
	Array.from({ length: n }, () => ({ key: k(), left: "", right: "" }));

/** test.question.get-ийн RetData-г нэг асуулт болгоно. */
function questionFrom(d: unknown): NQuestion | undefined {
	const list = normalizeQuestions(d);
	if (list[0]) return list[0];
	const o = objOf(d);
	if (!Object.keys(o).length) return undefined;
	const base = objOf(pick(o, "question", "info"));
	const row = Object.keys(base).length ? base : o;
	return normalizeQuestions({ questions: [row], answers: arrOf(o.answers) })[0];
}

function initState(q: NQuestion | undefined) {
	const type = q?.type ?? 1;
	const raw = q?.raw ?? {};
	let items = blankItems(4);
	let pairs = blankPairs(3);
	if (q?.answers.length) {
		if (type === 6) {
			const { left, right } = splitPairs(q.answers);
			pairs = left.map((l) => ({
				key: k(),
				left: l.html,
				right: right.find((r) => r.refid === l.childId)?.html ?? "",
			}));
		} else {
			const src =
				type === 5
					? [...q.answers].sort((a, b) => a.refid - b.refid)
					: q.answers;
			items = src.map((a) => ({
				key: k(),
				html: type === 3 || type === 4 ? a.text || stripHtml(a.html) : a.html,
				isTrue: a.isTrue,
			}));
		}
	} else if (type === 3 || type === 4) items = blankItems(1);
	return {
		type,
		level: str(raw, "que_level_id"),
		score: String(q?.score || 1),
		html: q?.html ?? "",
		img: q?.img ?? "",
		descr: str(raw, "que_descr"),
		analys: str(raw, "que_analys"),
		items,
		pairs,
	};
}

export function QuestionEditor({
	testId,
	examQueId,
	onClose,
}: {
	testId: number;
	/** null — хаалттай, 0 — шинэ, >0 — засах */
	examQueId: number | null;
	onClose: () => void;
}) {
	const { userId, schoolId } = useTeacher();
	const open = examQueId !== null;
	const id = examQueId ?? 0;

	const ctx = useQuery({
		queryKey: teacherKey("exam-que-ctx", testId, id),
		queryFn: () =>
			teacherApi.exam.test.question.context({
				test_id: testId,
				exam_que_id: id || undefined,
			}),
		enabled: open && testId > 0,
	});
	const detail = useQuery({
		queryKey: teacherKey("exam-que", id),
		queryFn: () => teacherApi.exam.test.question.get({ exam_que_id: id }),
		enabled: open && id > 0,
	});

	const [s, setS] = useState(() => initState(undefined));
	const [touched, setTouched] = useState(false);
	useEffect(() => {
		if (!open) return;
		setTouched(false);
		if (id === 0) setS(initState(undefined));
		else if (detail.data) setS(initState(questionFrom(detail.data.RetData)));
	}, [open, id, detail.data]);

	const context = objOf(ctx.data?.RetData);
	const raw = (questionFrom(detail.data?.RetData)?.raw ?? {}) as Row;
	const lessonId = num(context, "lesson_id") || num(raw, "lesson_id");
	const ulessonId = num(raw, "ulesson_id") || num(context, "ulesson_id");

	const setType = (t: number) =>
		setS((p) => ({
			...p,
			type: t,
			items:
				t === 3 || t === 4
					? p.items.slice(0, 1).map((i) => ({ ...i, isTrue: true }))
					: p.items.length < 2
						? [...p.items, ...blankItems(4 - p.items.length)]
						: p.items,
		}));

	const setItem = (key: string, patch: Partial<Item>) =>
		setS((p) => ({
			...p,
			items: p.items.map((i) =>
				i.key === key
					? { ...i, ...patch }
					: p.type === 1 && patch.isTrue
						? { ...i, isTrue: false }
						: i,
			),
		}));
	const move = (idx: number, dir: -1 | 1) =>
		setS((p) => {
			const items = [...p.items];
			const j = idx + dir;
			if (j < 0 || j >= items.length) return p;
			[items[idx], items[j]] = [items[j], items[idx]];
			return { ...p, items };
		});

	// Шалгалт
	const errors: string[] = [];
	if (!s.html.trim() && !s.img) errors.push("Асуултын агуулга оруулна уу");
	const filled = s.items.filter((i) => i.html.trim());
	if (s.type === 1 || s.type === 2) {
		if (filled.length < 2) errors.push("Дор хаяж 2 хариулт оруулна уу");
		const trues = filled.filter((i) => i.isTrue).length;
		if (s.type === 1 && trues !== 1) errors.push("Яг нэг зөв хариулт сонгоно");
		if (s.type === 2 && trues < 1)
			errors.push("Дор хаяж нэг зөв хариулт сонгоно");
	}
	if ((s.type === 3 || s.type === 4) && filled.length < 1)
		errors.push("Зөв хариуг оруулна уу");
	if (s.type === 5 && filled.length < 2)
		errors.push("Дор хаяж 2 алхам оруулна уу");
	if (
		s.type === 6 &&
		s.pairs.filter((p) => p.left.trim() && p.right.trim()).length < 2
	)
		errors.push("Дор хаяж 2 бүтэн хос оруулна уу");

	const save = useTeacherMutation(
		() => {
			let answers: QuestionAnswerInput[] | undefined;
			let pairs: QuestionPairInput[] | undefined;
			if (s.type === 6) {
				const full = s.pairs.filter((p) => p.left.trim() && p.right.trim());
				// Зүүн тал: match = хосын дугаар; баруун тал: refid = хосын дугаар
				pairs = full.flatMap((p, i) => [
					{
						text: stripHtml(p.left),
						html: p.left,
						match: i + 1,
						refid: i + 1,
					},
					{
						text: stripHtml(p.right),
						html: p.right,
						match: 0,
						refid: i + 1,
					},
				]);
			} else if (s.type === 3 || s.type === 4) {
				answers = filled.map((i) => ({
					text: i.html.trim(),
					html: i.html.trim(),
					is_true: true,
				}));
			} else if (s.type === 5) {
				answers = filled.map((i, idx) => ({
					text: stripHtml(i.html),
					html: i.html,
					refid: idx + 1,
					is_true: true,
				}));
			} else {
				answers = filled.map((i) => ({
					text: stripHtml(i.html),
					html: i.html,
					is_true: i.isTrue,
				}));
			}
			return teacherApi.exam.test.question.save({
				test_id: testId,
				exam_que_id: id || undefined,
				lesson_id: lessonId,
				ulesson_id: ulessonId || undefined,
				que_type_id: s.type,
				que_level_id: Number(s.level) || undefined,
				question_html: s.html,
				question_img: s.img || undefined,
				que_descr: s.descr || undefined,
				que_analys: s.analys || undefined,
				onoo: Number(s.score) || 1,
				answers,
				pairs,
				user_id: userId,
				school_id: schoolId,
			});
		},
		{
			success: id ? "Асуулт хадгалагдлаа" : "Асуулт нэмэгдлээ",
			invalidate: [
				testKey(testId),
				teacherKey("exam-que", id),
				teacherKey("exam-tests"),
			],
			onSuccess: onClose,
		},
	);

	const loading = open && id > 0 && detail.isLoading;

	return (
		<FormDialog
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={id ? "Асуулт засах" : "Асуулт нэмэх"}
			description={
				str(context, "lesson_name", "test_title") || (id ? `#${id}` : undefined)
			}
			size="xl"
			pending={save.isPending}
			onSubmit={() => {
				setTouched(true);
				if (errors.length === 0) save.mutate(undefined);
			}}
		>
			{loading ? (
				<div className="grid gap-3">
					<Skeleton className="h-10 rounded-xl" />
					<Skeleton className="h-28 rounded-xl" />
					<Skeleton className="h-40 rounded-xl" />
				</div>
			) : (
				<>
					<div className="grid gap-4 sm:grid-cols-3">
						<Field label="Хэлбэр" required>
							<OptionSelect
								options={QUE_TYPES}
								value={s.type}
								onChange={(v) => setType(Number(v))}
								className="sm:w-full"
							/>
						</Field>
						<Field label="Түвшин">
							<OptionSelect
								options={LEVELS}
								value={s.level}
								onChange={(v) => setS((p) => ({ ...p, level: v }))}
								className="sm:w-full"
							/>
						</Field>
						<Field label="Оноо">
							<Input
								type="number"
								min={0}
								step="0.5"
								value={s.score}
								onChange={(e) => setS((p) => ({ ...p, score: e.target.value }))}
							/>
						</Field>
					</div>

					<HtmlEditor
						label="Асуулт *"
						value={s.html}
						onChange={(v) => setS((p) => ({ ...p, html: v }))}
						rows={4}
						placeholder="HTML эсвэл \( LaTeX \) бичиж болно"
					/>
					<ImageField
						label="Асуултын зураг"
						value={s.img}
						onChange={(v) => setS((p) => ({ ...p, img: v }))}
					/>

					<section className="grid gap-2">
						<h3 className="text-sm font-bold">
							{s.type === 6
								? "Хосууд"
								: s.type === 5
									? "Зөв дарааллаар оруулна"
									: s.type === 3 || s.type === 4
										? "Зөв хариу"
										: "Хариултууд"}
						</h3>
						{s.type === 6 ? (
							<PairsEditor
								pairs={s.pairs}
								onChange={(pairs) => setS((p) => ({ ...p, pairs }))}
							/>
						) : (
							<ul className="grid gap-2">
								{s.items.map((it, idx) => (
									<li
										key={it.key}
										className={cn(
											"flex gap-2 rounded-2xl border p-2.5",
											(s.type === 1 || s.type === 2) && it.isTrue
												? "border-pop-mint/50 bg-pop-mint-soft/40"
												: "border-border",
										)}
									>
										<span className="mt-2 w-5 shrink-0 text-center text-sm font-black">
											{s.type === 5 ? idx + 1 : LETTERS[idx]}
										</span>
										<div className="min-w-0 flex-1">
											{s.type === 3 || s.type === 4 ? (
												<Input
													value={it.html}
													onChange={(e) =>
														setItem(it.key, { html: e.target.value })
													}
													placeholder="Жишээ: 12.5"
													aria-label="Зөв хариу"
												/>
											) : (
												<HtmlEditor
													value={it.html}
													onChange={(v) => setItem(it.key, { html: v })}
													rows={2}
													placeholder={`${LETTERS[idx]} хариулт`}
												/>
											)}
										</div>
										<div className="flex shrink-0 flex-col items-center gap-1">
											{(s.type === 1 || s.type === 2) && (
												// biome-ignore lint/a11y/noLabelWithoutControl: Checkbox label дотор байна
												<label className="flex items-center gap-1.5 text-xs font-bold">
													<Checkbox
														checked={it.isTrue}
														onCheckedChange={(c) =>
															setItem(it.key, { isTrue: c === true })
														}
														aria-label={`${LETTERS[idx]} зөв хариулт`}
													/>
													Зөв
												</label>
											)}
											{s.type === 5 && (
												<>
													<Button
														type="button"
														variant="ghost"
														size="icon-xs"
														aria-label="Дээш"
														disabled={idx === 0}
														onClick={() => move(idx, -1)}
													>
														<ArrowUp />
													</Button>
													<Button
														type="button"
														variant="ghost"
														size="icon-xs"
														aria-label="Доош"
														disabled={idx === s.items.length - 1}
														onClick={() => move(idx, 1)}
													>
														<ArrowDown />
													</Button>
												</>
											)}
											<Button
												type="button"
												variant="ghost"
												size="icon-xs"
												aria-label="Хариулт хасах"
												className="text-muted-foreground hover:text-destructive"
												disabled={s.items.length <= 1}
												onClick={() =>
													setS((p) => ({
														...p,
														items: p.items.filter((x) => x.key !== it.key),
													}))
												}
											>
												<Trash2 />
											</Button>
										</div>
									</li>
								))}
								<li>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											setS((p) => ({
												...p,
												items: [
													...p.items,
													{
														key: k(),
														html: "",
														isTrue: p.type === 3 || p.type === 4,
													},
												],
											}))
										}
									>
										<Plus />
										{s.type === 3 || s.type === 4
											? "Өөр зөв хариу нэмэх"
											: "Хариулт нэмэх"}
									</Button>
								</li>
							</ul>
						)}
					</section>

					<HtmlEditor
						label="Бодолт"
						value={s.descr}
						onChange={(v) => setS((p) => ({ ...p, descr: v }))}
						rows={3}
					/>
					<HtmlEditor
						label="Шинжилгээ"
						value={s.analys}
						onChange={(v) => setS((p) => ({ ...p, analys: v }))}
						rows={2}
					/>

					{touched && errors.length > 0 && (
						<ul
							role="alert"
							className="grid gap-0.5 rounded-2xl bg-pop-coral-soft/50 px-4 py-3 text-sm font-bold text-pop-coral-ink"
						>
							{errors.map((e) => (
								<li key={e}>{e}</li>
							))}
						</ul>
					)}
				</>
			)}
		</FormDialog>
	);
}

function PairsEditor({
	pairs,
	onChange,
}: {
	pairs: Pair[];
	onChange: (p: Pair[]) => void;
}) {
	const set = (key: string, patch: Partial<Pair>) =>
		onChange(pairs.map((p) => (p.key === key ? { ...p, ...patch } : p)));
	return (
		<ul className="grid gap-2">
			{pairs.map((p, i) => (
				<li
					key={p.key}
					className="grid gap-2 rounded-2xl border border-border p-2.5 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-start"
				>
					<span className="mt-2 text-sm font-black tabular-nums">{i + 1}.</span>
					<HtmlEditor
						value={p.left}
						onChange={(v) => set(p.key, { left: v })}
						rows={2}
						placeholder="Зүүн тал"
					/>
					<HtmlEditor
						value={p.right}
						onChange={(v) => set(p.key, { right: v })}
						rows={2}
						placeholder="Харгалзах баруун тал"
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						aria-label="Хос хасах"
						className="text-muted-foreground hover:text-destructive"
						disabled={pairs.length <= 1}
						onClick={() => onChange(pairs.filter((x) => x.key !== p.key))}
					>
						<Trash2 />
					</Button>
				</li>
			))}
			<li>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => onChange([...pairs, ...blankPairs(1)])}
				>
					<Plus />
					Хос нэмэх
				</Button>
			</li>
		</ul>
	);
}
