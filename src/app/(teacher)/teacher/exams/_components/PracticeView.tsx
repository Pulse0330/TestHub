"use client";

import { useQuery } from "@tanstack/react-query";
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	CheckCircle2,
	Play,
	RotateCcw,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import MathContent from "@/components/MathContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	EmptyState,
	PageHeader,
	Panel,
	StatusPill,
} from "@/features/teacher/components";
import { teacherKey, useTeacher } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
	correctSummary,
	LETTERS,
	type NQuestion,
	normalizeQuestions,
	objOf,
	pick,
	queTypeLabel,
	splitPairs,
	str,
} from "./shared";

/** Хариултын төлөв — асуулт бүрт. */
type Ans =
	| { kind: "choice"; ids: number[] }
	| { kind: "text"; value: string }
	| { kind: "order"; ids: number[] }
	| { kind: "match"; map: Record<number, number> };

const aKey = (q: NQuestion, i: number) => q.answers[i]?.id || i + 1;

function initAnswer(q: NQuestion): Ans {
	if (q.type === 3 || q.type === 4) return { kind: "text", value: "" };
	if (q.type === 5) {
		// Зөв дараалал ил гарахгүйн тулд тогтмол холино
		const ids = q.answers.map((_, i) => aKey(q, i));
		const rotated = [...ids.slice(1), ...ids.slice(0, 1)].reverse();
		return { kind: "order", ids: rotated };
	}
	if (q.type === 6) return { kind: "match", map: {} };
	return { kind: "choice", ids: [] };
}

const norm = (s: string) =>
	s.trim().toLowerCase().replace(/,/g, ".").replace(/\s+/g, "");

function isCorrect(q: NQuestion, a: Ans): boolean {
	switch (a.kind) {
		case "choice": {
			const correct = q.answers
				.map((x, i) => (x.isTrue ? aKey(q, i) : null))
				.filter((x): x is number => x !== null);
			return (
				correct.length === a.ids.length &&
				correct.every((id) => a.ids.includes(id))
			);
		}
		case "text":
			return q.answers.some(
				(x) => norm(x.text || x.html) === norm(a.value) && a.value.trim(),
			);
		case "order": {
			const refs = a.ids.map(
				(id) => q.answers.find((_x, i) => aKey(q, i) === id)?.refid ?? 0,
			);
			return refs.every((r, i) => i === 0 || refs[i - 1] <= r);
		}
		case "match": {
			const { left, right } = splitPairs(q.answers);
			return left.every((l, li) => {
				const ri = a.map[li];
				return ri !== undefined && right[ri]?.refid === l.childId;
			});
		}
	}
}

function answered(a: Ans): boolean {
	if (a.kind === "choice") return a.ids.length > 0;
	if (a.kind === "text") return !!a.value.trim();
	if (a.kind === "match") return Object.keys(a.map).length > 0;
	return true;
}

/** my_test_quiz_choosed — багш материалаа туршиж үзнэ (хадгалахгүй). */
export function PracticeView({ testId }: { testId: number }) {
	const { userId, schoolId } = useTeacher();
	const { data, isLoading } = useQuery({
		queryKey: teacherKey("exam-practice", testId),
		queryFn: () =>
			teacherApi.exam.test.practice({
				test_id: testId,
				school_id: schoolId,
				user_id: userId,
			}),
		enabled: testId > 0 && !!userId,
	});
	const questions = useMemo(
		() => normalizeQuestions(data?.RetData),
		[data?.RetData],
	);
	const info = objOf(pick(objOf(data?.RetData), "info", "test"));
	const title = str(info, "test_title", "title") || "Туршиж үзэх";

	const [answers, setAnswers] = useState<Record<number, Ans>>({});
	const [checked, setChecked] = useState<Record<number, boolean>>({});
	const get = (q: NQuestion, i: number) => answers[i] ?? initAnswer(q);
	const setA = (i: number, a: Ans) => {
		setAnswers((s) => ({ ...s, [i]: a }));
		setChecked((c) => ({ ...c, [i]: false }));
	};

	const checkedCount = Object.values(checked).filter(Boolean).length;
	const correctCount = questions.filter(
		(q, i) => checked[i] && isCorrect(q, get(q, i)),
	).length;

	const checkAll = () =>
		setChecked(Object.fromEntries(questions.map((_, i) => [i, true])));
	const reset = () => {
		setAnswers({});
		setChecked({});
	};

	return (
		<>
			<PageHeader
				title={title}
				description="Туршиж үзэх — хариу хадгалагдахгүй"
				icon={Play}
				actions={
					<Button variant="ghost" asChild>
						<Link href={`/teacher/exams/${testId}`}>
							<ArrowLeft />
							Материал руу
						</Link>
					</Button>
				}
			/>

			{isLoading ? (
				<div className="grid gap-3">
					{["a", "b", "c"].map((x) => (
						<Skeleton key={x} className="h-48 rounded-3xl" />
					))}
				</div>
			) : questions.length === 0 ? (
				<Panel>
					<EmptyState text="Материалд асуулт алга" />
				</Panel>
			) : (
				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
					<ol className="grid gap-3">
						{questions.map((q, i) => (
							<li key={q.id || i}>
								<PracticeCard
									q={q}
									index={i + 1}
									ans={get(q, i)}
									onChange={(a) => setA(i, a)}
									checked={!!checked[i]}
									onCheck={() => setChecked((c) => ({ ...c, [i]: true }))}
								/>
							</li>
						))}
					</ol>
					<aside className="lg:sticky lg:top-4">
						<Panel>
							<p className="text-xs font-bold text-muted-foreground">Явц</p>
							<p className="mb-3 text-2xl font-black tabular-nums">
								{correctCount}
								<span className="text-base text-muted-foreground">
									{" "}
									/ {questions.length} зөв
								</span>
							</p>
							<div className="mb-4 flex flex-wrap gap-1.5">
								{questions.map((q, i) => (
									<a
										key={q.id || i}
										href={`#q-${i + 1}`}
										className={cn(
											"flex size-8 items-center justify-center rounded-lg text-xs font-black tabular-nums",
											!checked[i]
												? answered(get(q, i))
													? "bg-primary-soft/60"
													: "bg-muted text-muted-foreground"
												: isCorrect(q, get(q, i))
													? "bg-pop-mint-soft text-pop-mint-ink"
													: "bg-pop-coral-soft text-pop-coral-ink",
										)}
										aria-label={`${i + 1}-р асуулт`}
									>
										{i + 1}
									</a>
								))}
							</div>
							<div className="grid gap-2">
								<Button onClick={checkAll}>
									<CheckCircle2 />
									Бүгдийг шалгах
								</Button>
								<Button
									variant="outline"
									onClick={reset}
									disabled={!checkedCount && !Object.keys(answers).length}
								>
									<RotateCcw />
									Дахин эхлэх
								</Button>
							</div>
						</Panel>
					</aside>
				</div>
			)}
		</>
	);
}

function PracticeCard({
	q,
	index,
	ans,
	onChange,
	checked,
	onCheck,
}: {
	q: NQuestion;
	index: number;
	ans: Ans;
	onChange: (a: Ans) => void;
	checked: boolean;
	onCheck: () => void;
}) {
	const ok = checked && isCorrect(q, ans);
	return (
		<article
			id={`q-${index}`}
			className={cn(
				"scroll-mt-4 rounded-3xl border bg-card p-4 sm:p-5",
				!checked
					? "border-border"
					: ok
						? "border-pop-mint/50"
						: "border-pop-coral/50",
			)}
		>
			<div className="mb-3 flex flex-wrap items-center gap-2">
				<span className="text-sm font-black tabular-nums">{index}.</span>
				<StatusPill>{queTypeLabel(q.type)}</StatusPill>
				{q.score > 0 && <StatusPill tone="sky">{q.score} оноо</StatusPill>}
			</div>
			<div className="mb-4 text-sm leading-relaxed">
				<MathContent html={q.html} />
				{q.img && (
					// biome-ignore lint/performance/noImgElement: гадны URL
					<img
						src={q.img}
						alt=""
						className="mt-2 max-h-64 rounded-xl border border-border"
					/>
				)}
			</div>

			{ans.kind === "choice" && (
				<div
					className={cn("grid gap-2", q.answers.length > 2 && "sm:grid-cols-2")}
				>
					{q.answers.map((a, i) => {
						const id = aKey(q, i);
						const on = ans.ids.includes(id);
						const show = checked && (on || a.isTrue);
						return (
							<button
								key={id}
								type="button"
								aria-pressed={on}
								onClick={() =>
									onChange({
										kind: "choice",
										ids:
											q.type === 1
												? [id]
												: on
													? ans.ids.filter((x) => x !== id)
													: [...ans.ids, id],
									})
								}
								className={cn(
									"flex items-start gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm transition-colors",
									show && a.isTrue
										? "border-pop-mint/60 bg-pop-mint-soft/60"
										: show && on
											? "border-pop-coral/60 bg-pop-coral-soft/60"
											: on
												? "border-primary/40 bg-primary-soft/40"
												: "border-border hover:bg-muted/40",
								)}
							>
								<span
									className={cn(
										"flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-black",
										on ? "bg-primary-soft" : "bg-muted",
									)}
								>
									{LETTERS[i]}
								</span>
								<MathContent html={a.html} className="min-w-0 flex-1" />
							</button>
						);
					})}
				</div>
			)}

			{ans.kind === "text" && (
				<Input
					value={ans.value}
					onChange={(e) => onChange({ kind: "text", value: e.target.value })}
					placeholder="Хариугаа бичнэ үү"
					aria-label="Хариу"
					className="sm:w-64"
					onKeyDown={(e) => {
						if (e.key === "Enter") onCheck();
					}}
				/>
			)}

			{ans.kind === "order" && (
				<ol className="grid gap-2">
					{ans.ids.map((id, pos) => {
						const a = q.answers.find((_x, i) => aKey(q, i) === id);
						if (!a) return null;
						const swap = (dir: -1 | 1) => {
							const ids = [...ans.ids];
							const j = pos + dir;
							[ids[pos], ids[j]] = [ids[j], ids[pos]];
							onChange({ kind: "order", ids });
						};
						return (
							<li
								key={id}
								className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm"
							>
								<span className="w-5 text-center font-black tabular-nums">
									{pos + 1}
								</span>
								<MathContent html={a.html} className="min-w-0 flex-1" />
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									aria-label="Дээш"
									disabled={pos === 0}
									onClick={() => swap(-1)}
								>
									<ArrowUp />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									aria-label="Доош"
									disabled={pos === ans.ids.length - 1}
									onClick={() => swap(1)}
								>
									<ArrowDown />
								</Button>
							</li>
						);
					})}
				</ol>
			)}

			{ans.kind === "match" && (
				<MatchInput q={q} ans={ans} onChange={onChange} />
			)}

			<div className="mt-4 flex flex-wrap items-center gap-3">
				<Button variant="outline" size="sm" onClick={onCheck}>
					Шалгах
				</Button>
				{checked && (
					<p
						aria-live="polite"
						className={cn(
							"flex items-center gap-1.5 text-sm font-bold",
							ok ? "text-pop-mint-ink" : "text-pop-coral-ink",
						)}
					>
						{ok ? (
							<CheckCircle2 className="size-4" />
						) : (
							<XCircle className="size-4" />
						)}
						{ok ? "Зөв" : `Буруу · зөв хариу: ${correctSummary(q) || "—"}`}
					</p>
				)}
			</div>
		</article>
	);
}

function MatchInput({
	q,
	ans,
	onChange,
}: {
	q: NQuestion;
	ans: Extract<Ans, { kind: "match" }>;
	onChange: (a: Ans) => void;
}) {
	const { left, right } = splitPairs(q.answers);
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			<ol className="grid gap-2">
				{left.map((l, li) => (
					<li
						key={l.id || li}
						className="flex flex-wrap items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm"
					>
						<span className="font-black tabular-nums">{li + 1}.</span>
						<MathContent html={l.html} className="min-w-0 flex-1" />
						<div className="flex gap-1">
							{right.map((_, ri) => {
								const on = ans.map[li] === ri;
								return (
									<button
										key={LETTERS[ri]}
										type="button"
										aria-pressed={on}
										aria-label={`${li + 1} → ${LETTERS[ri]}`}
										onClick={() =>
											onChange({ kind: "match", map: { ...ans.map, [li]: ri } })
										}
										className={cn(
											"size-7 rounded-lg text-xs font-black",
											on ? "bg-primary-soft" : "bg-muted hover:bg-muted/70",
										)}
									>
										{LETTERS[ri]}
									</button>
								);
							})}
						</div>
					</li>
				))}
			</ol>
			<ol className="grid content-start gap-2">
				{right.map((r, ri) => (
					<li
						key={r.id || ri}
						className="flex items-start gap-2 rounded-2xl bg-muted/40 px-3 py-2 text-sm"
					>
						<span className="font-black">{LETTERS[ri]}.</span>
						<MathContent html={r.html} className="min-w-0 flex-1" />
					</li>
				))}
			</ol>
		</div>
	);
}
