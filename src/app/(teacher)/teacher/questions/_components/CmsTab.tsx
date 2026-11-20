"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, CloudDownload, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MathContent } from "@/components/MathContent";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
	EmptyState,
	OptionSelect,
	Panel,
	type SelectOption,
	StatusPill,
} from "@/features/teacher/components";
import {
	listOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { ImportResult } from "@/lib/teacher-api";
import { cn } from "@/lib/utils";
import {
	bool,
	num,
	optionsOf,
	pick,
	QUE_TYPES,
	qKey,
	type Row,
	str,
} from "./util";

const CODE_KEYS = [
	"code",
	"lesson_code",
	"curr_code",
	"ulesson_code",
	"rlesson_code",
	"class_code",
	"id",
];
const Q_CODE = [
	"test_code",
	"question_code",
	"que_code",
	"code",
	"question_id",
	"id",
];

interface Filters {
	lesson_code: string;
	curr_code: string;
	ulesson_code: string;
	rlesson_code: string;
	class_code: string;
}
const EMPTY: Filters = {
	lesson_code: "",
	curr_code: "",
	ulesson_code: "",
	rlesson_code: "",
	class_code: "",
};

function useCmsRef(
	name: string,
	params: Partial<Filters>,
	enabled = true,
): { options: SelectOption[]; isLoading: boolean } {
	const { schoolId } = useTeacher();
	const q = useQuery({
		queryKey: qKey("cmsref", name, params),
		queryFn: () =>
			teacherApi.question.cms.ref({
				name,
				lesson_code: params.lesson_code || undefined,
				curr_code: params.curr_code || undefined,
				ulesson_code: params.ulesson_code || undefined,
				school_id: schoolId,
			}),
		enabled,
		staleTime: 10 * 60_000,
	});
	const options = useMemo(
		() => optionsOf(listOf<Row>(q.data), CODE_KEYS),
		[q.data],
	);
	return { options, isLoading: q.isLoading && enabled };
}

export function CmsTab() {
	const { userId, schoolId, loginName } = useTeacher();
	const [f, setF] = useState<Filters>(EMPTY);
	const [query, setQuery] = useState<Filters | null>(null);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [result, setResult] = useState<ImportResult | null>(null);

	const lessons = useCmsRef("lessons", {});
	const currs = useCmsRef(
		"curr",
		{ lesson_code: f.lesson_code },
		!!f.lesson_code,
	);
	const ulessons = useCmsRef(
		"ulessons",
		{ lesson_code: f.lesson_code, curr_code: f.curr_code },
		!!f.curr_code,
	);
	const rlessons = useCmsRef(
		"rlessons",
		{
			lesson_code: f.lesson_code,
			curr_code: f.curr_code,
			ulesson_code: f.ulesson_code,
		},
		!!f.ulesson_code,
	);
	const classes = useCmsRef("classes", {});

	const remote = useQuery({
		queryKey: qKey("cms", query),
		queryFn: () =>
			teacherApi.question.cms.remote({
				lesson_code: query?.lesson_code ?? "",
				curr_code: query?.curr_code || undefined,
				ulesson_code: query?.ulesson_code || undefined,
				rlesson_code: query?.rlesson_code || undefined,
				class_code: query?.class_code || undefined,
				login: loginName || undefined,
			}),
		enabled: !!query?.lesson_code,
	});

	const { questions, answersOf } = useMemo(() => {
		const d = (remote.data?.RetData ?? {}) as Row;
		const qs = (
			Array.isArray(d.questions) ? d.questions : Array.isArray(d) ? d : []
		) as Row[];
		const ans = (Array.isArray(d.answers) ? d.answers : []) as Row[];
		const qKeyName = qs[0] ? Q_CODE.find((k) => k in qs[0]) : undefined;
		const byCode = new Map<string, Row[]>();
		for (const a of ans) {
			const c = str(
				pick(
					a,
					"test_code",
					"question_code",
					"que_code",
					"question_id",
					"code",
				),
			);
			byCode.set(c, [...(byCode.get(c) ?? []), a]);
		}
		return {
			questions: qs.map((q) => ({
				code: str(qKeyName ? q[qKeyName] : ""),
				row: q,
			})),
			answersOf: (code: string) => byCode.get(code) ?? [],
		};
	}, [remote.data]);

	const importer = useTeacherMutation(
		(codes: string[]) =>
			teacherApi.question.cms.importCodes({
				lesson_code: query?.lesson_code ?? "",
				codes,
				user_id: userId,
				school_id: schoolId,
			}),
		{
			invalidate: [qKey("list")],
			onSuccess: (res) => {
				setResult(res.RetData ?? null);
				setSelected(new Set());
			},
		},
	);

	const toggle = (code: string) =>
		setSelected((s) => {
			const n = new Set(s);
			if (n.has(code)) n.delete(code);
			else n.add(code);
			return n;
		});
	const allChecked =
		questions.length > 0 && questions.every((q) => selected.has(q.code));

	const setFilter = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }));

	return (
		<div className="grid gap-4">
			<Panel title="CMS-ийн даалгавраас хайх">
				<form
					className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
					onSubmit={(e) => {
						e.preventDefault();
						if (!f.lesson_code) return;
						setSelected(new Set());
						setResult(null);
						setQuery({ ...f });
					}}
				>
					<OptionSelect
						options={lessons.options}
						value={f.lesson_code}
						onChange={(v) =>
							setFilter({
								lesson_code: v,
								curr_code: "",
								ulesson_code: "",
								rlesson_code: "",
							})
						}
						placeholder={lessons.isLoading ? "Ачаалж байна..." : "Хичээл *"}
						className="sm:w-full"
					/>
					<OptionSelect
						options={currs.options}
						value={f.curr_code}
						onChange={(v) =>
							setFilter({ curr_code: v, ulesson_code: "", rlesson_code: "" })
						}
						disabled={!f.lesson_code}
						placeholder="Хөтөлбөр"
						className="sm:w-full"
					/>
					<OptionSelect
						options={ulessons.options}
						value={f.ulesson_code}
						onChange={(v) => setFilter({ ulesson_code: v, rlesson_code: "" })}
						disabled={!f.curr_code}
						placeholder="Бүлэг сэдэв"
						className="sm:w-full"
					/>
					<OptionSelect
						options={rlessons.options}
						value={f.rlesson_code}
						onChange={(v) => setFilter({ rlesson_code: v })}
						disabled={!f.ulesson_code}
						placeholder="Сэдэв"
						className="sm:w-full"
					/>
					<OptionSelect
						options={classes.options}
						value={f.class_code}
						onChange={(v) => setFilter({ class_code: v })}
						placeholder="Анги"
						className="sm:w-full"
					/>
					<div className="flex gap-2">
						<Button type="submit" disabled={!f.lesson_code} className="flex-1">
							<Search />
							Хайх
						</Button>
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setF(EMPTY);
								setQuery(null);
								setSelected(new Set());
							}}
						>
							Цэвэрлэх
						</Button>
					</div>
				</form>
			</Panel>

			{result && (
				<section
					aria-live="polite"
					className="rounded-3xl border border-border bg-card p-4 sm:p-5"
				>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<h2 className="font-black">Татан авалтын үр дүн</h2>
						<Button variant="ghost" size="sm" onClick={() => setResult(null)}>
							Хаах
						</Button>
					</div>
					<div className="mt-3 flex flex-wrap gap-2">
						<StatusPill>Нийт {num(result.total)}</StatusPill>
						<StatusPill tone="mint">Амжилттай {num(result.success)}</StatusPill>
						{num(result.failed) > 0 && (
							<StatusPill tone="coral">
								Алдаатай {num(result.failed)}
							</StatusPill>
						)}
					</div>
					{result.errors?.length > 0 && (
						<ul className="mt-3 grid gap-1 text-sm">
							{result.errors.map((e) => (
								<li
									key={e.code}
									className="rounded-xl bg-pop-coral-soft px-3 py-2 font-semibold text-pop-coral-ink"
								>
									<span className="font-mono">{e.code}</span> — {e.message}
								</li>
							))}
						</ul>
					)}
				</section>
			)}

			{query && (
				<Panel
					title={`CMS-ийн даалгавар${questions.length ? ` (${questions.length})` : ""}`}
					actions={
						<div className="flex flex-wrap items-center gap-3">
							{questions.length > 0 && (
								// biome-ignore lint/a11y/noLabelWithoutControl: контрол label дотор байна
								<label className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
									<Checkbox
										checked={allChecked}
										onCheckedChange={(v) =>
											setSelected(
												v === true
													? new Set(questions.map((q) => q.code))
													: new Set(),
											)
										}
									/>
									Бүгдийг сонгох
								</label>
							)}
							<Button
								size="sm"
								disabled={selected.size === 0 || importer.isPending}
								onClick={() => importer.mutate([...selected])}
							>
								{importer.isPending ? (
									<Loader2 className="animate-spin" />
								) : (
									<CloudDownload />
								)}
								Татах{selected.size > 0 && ` (${selected.size})`}
							</Button>
						</div>
					}
				>
					{remote.isLoading ? (
						<div className="grid gap-3">
							{["a", "b", "c"].map((k) => (
								<Skeleton key={k} className="h-32 rounded-3xl" />
							))}
						</div>
					) : questions.length === 0 ? (
						<EmptyState text="CMS-д тохирох даалгавар олдсонгүй" />
					) : (
						<ul className="grid gap-3">
							{questions.map(({ code, row }) => {
								const on = selected.has(code);
								const t = num(pick(row, "que_type_id", "que_type", "type_id"));
								const ans = answersOf(code);
								return (
									<li
										key={code}
										className={cn(
											"rounded-3xl border p-4 transition-colors",
											on
												? "border-primary-soft-shade bg-primary-soft/25"
												: "border-border bg-card",
										)}
									>
										<div className="mb-2 flex items-center gap-2">
											<Checkbox
												checked={on}
												onCheckedChange={() => toggle(code)}
												aria-label={`${code} сонгох`}
											/>
											<span className="rounded-lg bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground">
												{code}
											</span>
											{t > 0 && (
												<StatusPill tone="sky">
													{str(pick(row, "que_type_name", "type_name")) ||
														QUE_TYPES[t] ||
														`Төрөл ${t}`}
												</StatusPill>
											)}
										</div>
										<MathContent
											html={
												str(
													pick(
														row,
														"question_html",
														"test_html",
														"html",
														"question",
													),
												) || "<p>—</p>"
											}
											className="text-[15px] leading-relaxed"
										/>
										{ans.length > 0 && (
											<ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
												{ans.map((a, i) => {
													const ok = bool(
														pick(a, "is_true", "istrue", "is_correct"),
													);
													return (
														<li
															// biome-ignore lint/suspicious/noArrayIndexKey: id-гүй
															key={i}
															className={cn(
																"flex items-start gap-2 rounded-xl px-3 py-2 text-sm",
																ok
																	? "bg-pop-mint-soft text-pop-mint-ink"
																	: "bg-muted/50",
															)}
														>
															{ok && (
																<Check className="mt-0.5 size-4 shrink-0" />
															)}
															<MathContent
																html={str(
																	pick(
																		a,
																		"answer_html",
																		"html",
																		"answer",
																		"text",
																	),
																)}
																className="min-w-0"
															/>
														</li>
													);
												})}
											</ul>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</Panel>
			)}
		</div>
	);
}
