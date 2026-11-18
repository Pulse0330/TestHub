"use client";

import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	ArrowRight,
	ListChecks,
	Loader2,
	Plus,
	Trash2,
	Wand2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	EmptyState,
	Field,
	OptionSelect,
	Panel,
	StatusPill,
} from "@/features/teacher/components";
import {
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { ExamRuleInput, TestType } from "@/lib/teacher-api";
import { num, optionLabel, type Row, str, useExamRef } from "../shared";
import { BlueprintDialog } from "./BlueprintDialog";
import { CandidatesDialog } from "./CandidatesDialog";
import { testKey } from "./MaterialWizard";

export interface RuleRow extends ExamRuleInput {
	key: string;
}

let seq = 0;
const newKey = () => `r${Date.now()}-${seq++}`;

function parseIds(v: unknown): number[] | undefined {
	if (Array.isArray(v)) return v.map(Number).filter(Boolean);
	if (typeof v === "string" && v.trim())
		return v
			.split(/[,;\s]+/)
			.map(Number)
			.filter(Boolean);
	return undefined;
}

function toRule(r: Row): RuleRow {
	const sub =
		str(r, "sub") ||
		(num(r, "sub_id", "source_id")
			? `${num(r, "sub_id", "source_id")}~${num(r, "optype")}`
			: "");
	const ids = parseIds(r.question_ids);
	return {
		key: newKey(),
		lesson_id: num(r, "lesson_id"),
		lesson_name: str(r, "lesson_name"),
		sub,
		sub_name: str(r, "sub_name", "source_name", "title"),
		count: num(r, "count", "que_cnt", "cnt") || ids?.length || 0,
		question_ids: ids?.length ? ids : undefined,
	};
}

export function RulesStep({
	type,
	testId,
	info,
	rules: initial,
	onBack,
	onSaved,
}: {
	type: TestType;
	testId: number;
	info: Row;
	rules: Row[];
	onBack: () => void;
	onSaved: () => void;
}) {
	const { userId } = useTeacher();
	const [rules, setRules] = useState<RuleRow[]>(() => initial.map(toRule));
	const [draft, setDraft] = useState({
		lesson: str(info, "lesson_id"),
		sub: "",
		count: "5",
	});
	const [picking, setPicking] = useState<RuleRow | null>(null);
	const [blueprint, setBlueprint] = useState(false);

	const lessons = useExamRef("lessons");
	const subs = useExamRef(
		"subs",
		{ lesson_id: Number(draft.lesson) },
		!!Number(draft.lesson),
	);

	const total = rules.reduce((s, r) => s + (Number(r.count) || 0), 0);

	const addRule = () => {
		if (!Number(draft.lesson) || !draft.sub || !(Number(draft.count) > 0))
			return;
		setRules((rs) => [
			...rs,
			{
				key: newKey(),
				lesson_id: Number(draft.lesson),
				lesson_name: optionLabel(lessons.options, draft.lesson),
				sub: draft.sub,
				sub_name: optionLabel(subs.options, draft.sub),
				count: Number(draft.count),
			},
		]);
		setDraft((d) => ({ ...d, sub: "" }));
	};

	const update = (key: string, patch: Partial<RuleRow>) =>
		setRules((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

	const save = useTeacherMutation(
		() =>
			teacherApi.exam.test.saveQuestions({
				test_id: testId,
				test_type: type,
				user_id: userId,
				rules: rules.map(({ key: _k, ...r }) => ({
					...r,
					count: Number(r.count) || 0,
				})),
			}),
		{
			success: "Асуултын сонголт хадгалагдлаа",
			invalidate: [testKey(testId), teacherKey("exam-tests")],
			onSuccess: onSaved,
		},
	);

	return (
		<div className="grid gap-4">
			<Panel
				title="Асуулт сонгох дүрэм"
				actions={
					<Button
						variant="outline"
						size="sm"
						onClick={() => setBlueprint(true)}
					>
						<Wand2 />
						Blueprint
					</Button>
				}
			>
				<div className="mb-4 grid gap-3 rounded-2xl bg-muted/40 p-3 sm:grid-cols-[1fr_1.4fr_110px_auto] sm:items-end">
					<Field label="Хичээл">
						<OptionSelect
							options={lessons.options}
							value={draft.lesson}
							onChange={(v) => setDraft((d) => ({ ...d, lesson: v, sub: "" }))}
							className="sm:w-full"
						/>
					</Field>
					<Field label="Эх сурвалж">
						<OptionSelect
							options={subs.options}
							value={draft.sub}
							onChange={(v) => setDraft((d) => ({ ...d, sub: v }))}
							disabled={!Number(draft.lesson)}
							placeholder={subs.isLoading ? "Ачаалж байна..." : "Сонгох"}
							className="sm:w-full"
						/>
					</Field>
					<Field label="Тоо">
						<Input
							type="number"
							min={1}
							inputMode="numeric"
							value={draft.count}
							onChange={(e) =>
								setDraft((d) => ({ ...d, count: e.target.value }))
							}
						/>
					</Field>
					<Button
						type="button"
						onClick={addRule}
						disabled={!draft.sub || !(Number(draft.count) > 0)}
					>
						<Plus />
						Нэмэх
					</Button>
					{draft.sub && Number(draft.lesson) > 0 && (
						<p className="text-xs font-bold text-muted-foreground sm:col-span-4">
							Энэ эх сурвалжид{" "}
							<Available lessonId={Number(draft.lesson)} sub={draft.sub} />{" "}
							асуулт байна.
						</p>
					)}
				</div>

				{rules.length === 0 ? (
					<EmptyState text="Дүрэм нэмээгүй байна. Эх сурвалж сонгох эсвэл Blueprint ашиглана уу." />
				) : (
					<ul className="grid gap-2">
						{rules.map((r, i) => (
							<li
								key={r.key}
								className="flex flex-col gap-3 rounded-2xl border border-border p-3 sm:flex-row sm:items-center"
							>
								<span className="hidden size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-black sm:flex">
									{i + 1}
								</span>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-black">
										{r.sub_name || r.sub}
									</p>
									<p className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
										{r.lesson_name}
										{r.sub && !r.sub.startsWith("0~") && (
											<span>
												· боломжит{" "}
												<Available lessonId={r.lesson_id} sub={r.sub} />
											</span>
										)}
										{r.question_ids?.length ? (
											<StatusPill tone="sky">
												{r.question_ids.length} гараар сонгосон
											</StatusPill>
										) : (
											<StatusPill>Санамсаргүй</StatusPill>
										)}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Input
										type="number"
										min={1}
										value={r.count}
										disabled={!!r.question_ids?.length}
										onChange={(e) =>
											update(r.key, { count: Number(e.target.value) })
										}
										aria-label="Асуултын тоо"
										className="w-20"
									/>
									{r.sub && !r.sub.startsWith("0~") && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPicking(r)}
										>
											<ListChecks />
											Гараар
										</Button>
									)}
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="Дүрэм хасах"
										className="text-muted-foreground hover:text-destructive"
										onClick={() =>
											setRules((rs) => rs.filter((x) => x.key !== r.key))
										}
									>
										<Trash2 />
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}
			</Panel>

			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
				<Button variant="outline" onClick={onBack}>
					<ArrowLeft />
					Буцах
				</Button>
				<div className="flex items-center gap-3">
					<span className="text-sm font-bold text-muted-foreground">
						Нийт <span className="text-foreground tabular-nums">{total}</span>{" "}
						асуулт
					</span>
					<Button
						onClick={() => save.mutate(undefined)}
						disabled={save.isPending || rules.length === 0}
					>
						{save.isPending && <Loader2 className="animate-spin" />}
						Хадгалаад хянах
						<ArrowRight />
					</Button>
				</div>
			</div>

			<CandidatesDialog
				rule={picking}
				onClose={() => setPicking(null)}
				onApply={(ids) => {
					if (picking)
						update(picking.key, {
							question_ids: ids.length ? ids : undefined,
							count: ids.length || picking.count,
						});
					setPicking(null);
				}}
			/>
			<BlueprintDialog
				open={blueprint}
				onOpenChange={setBlueprint}
				lessonId={Number(str(info, "lesson_id")) || Number(draft.lesson)}
				lessonName={
					str(info, "lesson_name") ||
					optionLabel(lessons.options, str(info, "lesson_id") || draft.lesson)
				}
				currId={num(info, "curr_id")}
				onApply={(rule) => {
					setRules((rs) => [...rs, { ...rule, key: newKey() }]);
					setBlueprint(false);
				}}
			/>
		</div>
	);
}

/** exam_get_test_cnt — эх сурвалж дахь асуултын тоо. */
function Available({ lessonId, sub }: { lessonId: number; sub: string }) {
	const { userId } = useTeacher();
	const { data, isLoading } = useQuery({
		queryKey: teacherKey("exam-rule-count", lessonId, sub),
		queryFn: () =>
			teacherApi.exam.test.ruleCount({
				lesson_id: lessonId,
				sub,
				user_id: userId,
			}),
		enabled: !!userId && !!lessonId && !!sub,
		staleTime: 60_000,
	});
	if (isLoading) return <span className="tabular-nums">…</span>;
	const d = data?.RetData as unknown;
	const row = (Array.isArray(d) ? d[0] : d) as Row | undefined;
	return (
		<span className="font-black text-foreground tabular-nums">
			{num(row, "test_ttl_cnt", "cnt")}
		</span>
	);
}
