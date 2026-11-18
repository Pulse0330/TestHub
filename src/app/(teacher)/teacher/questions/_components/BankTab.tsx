"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Hash, Pencil, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MathContent } from "@/components/MathContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	EmptyState,
	OptionSelect,
	Pagination,
	Panel,
	type SelectOption,
	StatusPill,
} from "@/features/teacher/components";
import { pagedOf } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { QuestionActions } from "./QuestionActions";
import { useUrlState } from "./useUrlState";
import {
	bool,
	DEFAULT_TYPE_OPTIONS,
	num,
	optId,
	pick,
	QUE_TYPES,
	qKey,
	type Row,
	str,
	useQuestionRef,
} from "./util";

const PAGE_SIZE = 10;

const FLAGS = [
	{ key: "acc", api: "accepted", label: "Баталгаажсан" },
	{ key: "chk", api: "checking", label: "Хянагдаж буй" },
	{ key: "warn", api: "warning", label: "Анхааруулгатай" },
	{ key: "bod", api: "has_bodolt", label: "Бодолттой" },
	{ key: "ana", api: "has_analys", label: "Шинжилгээтэй" },
] as const;

export interface QuestionRow {
	question_id: number;
	question_html?: string;
	que_type_id?: number;
	que_source?: string;
	question_img_url?: string;
	[key: string]: unknown;
}

export function BankTab() {
	const url = useUrlState();
	const lesson = num(url.get("lesson"));
	const curr = num(url.get("curr"));
	const ulesson = num(url.get("ulesson"));
	const rlesson = num(url.get("rlesson"));
	const source = num(url.get("source"));
	const type = num(url.get("type"));
	const page = num(url.get("page")) || 1;
	const qid = url.get("qid");
	const setUrl = url.set;

	const [qidInput, setQidInput] = useState(qid);
	useEffect(() => setQidInput(qid), [qid]);
	useEffect(() => {
		if (qidInput === qid) return;
		const t = setTimeout(() => setUrl({ qid: qidInput, page: null }), 400);
		return () => clearTimeout(t);
	}, [qidInput, qid, setUrl]);

	const lessons = useQuestionRef("lessons");
	const currs = useQuestionRef("curr", { lesson_id: lesson }, !!lesson);
	// Хөтөлбөр сонгоогүй бол хичээлийн бүх бүлэг сэдэв
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
	const typeOptions = types.options.length
		? types.options
		: DEFAULT_TYPE_OPTIONS;
	const typeName = useMemo(() => {
		const m = new Map(typeOptions.map((o) => [num(o.value), o.label]));
		return (t: number) => m.get(t) ?? QUE_TYPES[t] ?? `Төрөл ${t}`;
	}, [typeOptions]);

	const flags = Object.fromEntries(
		FLAGS.map((f) => [f.api, url.get(f.key) === "1" || undefined]),
	);

	const params = {
		question_id: optId(qid),
		lesson_id: optId(lesson),
		curr_id: optId(curr),
		ulesson_id: optId(ulesson),
		rlesson_id: optId(rlesson),
		source_id: optId(source),
		que_type: optId(type),
		...flags,
		page,
		size: PAGE_SIZE,
	};

	const { data, isLoading, isFetching } = useQuery({
		queryKey: qKey("list", params),
		queryFn: () => teacherApi.question.list(params),
		placeholderData: keepPreviousData,
	});
	const paged = pagedOf<QuestionRow>(data);

	const hasFilter = url.search.replace(/(^|&)tab=[^&]*/, "").length > 0;

	return (
		<Panel>
			<div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4">
				<FilterSelect
					label="Хичээл"
					options={lessons.options}
					value={lesson}
					loading={lessons.isLoading}
					onChange={(v) =>
						url.set({
							lesson: v,
							curr: null,
							ulesson: null,
							rlesson: null,
							source: null,
							page: null,
						})
					}
				/>
				<FilterSelect
					label="Хөтөлбөр"
					options={currs.options}
					value={curr}
					disabled={!lesson}
					loading={currs.isLoading}
					onChange={(v) =>
						url.set({
							curr: v,
							ulesson: null,
							rlesson: null,
							source: null,
							page: null,
						})
					}
				/>
				<FilterSelect
					label="Бүлэг сэдэв"
					options={ulessons.options}
					value={ulesson}
					disabled={!lesson}
					loading={ulessons.isLoading}
					onChange={(v) =>
						url.set({ ulesson: v, rlesson: null, source: null, page: null })
					}
				/>
				<FilterSelect
					label="Сэдэв"
					options={rlessons.options}
					value={rlesson}
					disabled={!ulesson}
					loading={rlessons.isLoading}
					onChange={(v) => url.set({ rlesson: v, page: null })}
				/>
				<FilterSelect
					label="Эх сурвалж"
					options={sources.options}
					value={source}
					disabled={!ulesson}
					loading={sources.isLoading}
					onChange={(v) => url.set({ source: v, page: null })}
				/>
				<FilterSelect
					label="Төрөл"
					options={typeOptions}
					value={type}
					onChange={(v) => url.set({ type: v, page: null })}
				/>
				<div className="relative">
					<Hash className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={qidInput}
						inputMode="numeric"
						onChange={(e) => setQidInput(e.target.value.replace(/\D/g, ""))}
						placeholder="Даалгаврын дугаар"
						aria-label="Даалгаврын дугаараар хайх"
						className="pl-9"
					/>
				</div>
			</div>
			<div className="mb-4 flex flex-wrap items-center gap-2">
				{FLAGS.map((f) => {
					const on = url.get(f.key) === "1";
					return (
						<button
							key={f.key}
							type="button"
							aria-pressed={on}
							onClick={() => url.set({ [f.key]: !on, page: null })}
							className={cn(
								"rounded-full border px-3 py-1 text-xs font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
								on
									? "border-transparent bg-primary-soft text-primary-soft-foreground"
									: "border-border bg-card text-muted-foreground hover:text-foreground",
							)}
						>
							{f.label}
						</button>
					);
				})}
				{hasFilter && (
					<Button
						variant="ghost"
						size="xs"
						className="ml-auto"
						onClick={() => {
							setQidInput("");
							url.set(
								Object.fromEntries(
									[
										"lesson",
										"curr",
										"ulesson",
										"rlesson",
										"source",
										"type",
										"qid",
										"page",
										...FLAGS.map((f) => f.key),
									].map((k) => [k, null]),
								),
							);
						}}
					>
						<RotateCcw />
						Цэвэрлэх
					</Button>
				)}
			</div>

			<p className="mb-3 text-xs font-bold text-muted-foreground tabular-nums">
				{isLoading ? "Ачаалж байна..." : `Нийт ${paged.total} даалгавар`}
			</p>

			{isLoading ? (
				<div className="grid gap-3">
					{["a", "b", "c"].map((k) => (
						<Skeleton key={k} className="h-40 rounded-3xl" />
					))}
				</div>
			) : paged.rows.length === 0 ? (
				<EmptyState text="Даалгавар олдсонгүй" />
			) : (
				<ul
					className={cn(
						"grid gap-3 transition-opacity",
						isFetching && "opacity-60",
					)}
				>
					{paged.rows.map((q) => (
						<QuestionCard key={q.question_id} q={q} typeName={typeName} />
					))}
				</ul>
			)}
			<Pagination
				page={page}
				size={PAGE_SIZE}
				total={paged.total}
				onPageChange={(p) => {
					url.set({ page: p > 1 ? p : null });
					window.scrollTo({ top: 0, behavior: "smooth" });
				}}
			/>
		</Panel>
	);
}

function FilterSelect({
	label,
	options,
	value,
	onChange,
	disabled,
	loading,
}: {
	label: string;
	options: SelectOption[];
	value: number;
	onChange: (v: string) => void;
	disabled?: boolean;
	loading?: boolean;
}) {
	return (
		<div className="grid gap-1">
			<span className="px-1 text-[11px] font-extrabold tracking-wider text-muted-foreground uppercase">
				{label}
			</span>
			<OptionSelect
				options={options}
				value={value}
				onChange={onChange}
				allLabel="Бүгд"
				disabled={disabled}
				placeholder={loading ? "Ачаалж байна..." : "Бүгд"}
				className="sm:w-full"
			/>
		</div>
	);
}

function QuestionCard({
	q,
	typeName,
}: {
	q: QuestionRow;
	typeName: (t: number) => string;
}) {
	const r = q as Row;
	const t = num(q.que_type_id);
	const hiddenRaw = pick(r, "is_hide", "ishide", "is_hidden", "hidden");
	const hidden = hiddenRaw === undefined ? undefined : bool(hiddenRaw);
	const status = str(pick(r, "status_name", "statusname", "check_status"));
	const path = [
		pick(r, "lesson_name"),
		pick(r, "ulesson_name"),
		pick(r, "rlessonname", "rlesson_name"),
	]
		.map(str)
		.filter(Boolean);
	const img = str(pick(r, "question_img_url", "question_img"));
	const onoo = num(pick(r, "onoo"));

	return (
		<li
			className={cn(
				"rounded-3xl border border-border bg-card p-4",
				hidden && "bg-muted/40",
			)}
		>
			<div className="mb-3 flex flex-wrap items-center gap-1.5">
				<span className="rounded-lg bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground">
					#{q.question_id}
				</span>
				<StatusPill tone="sky">{typeName(t)}</StatusPill>
				{onoo > 0 && <StatusPill>{onoo} оноо</StatusPill>}
				{status && <StatusPill tone="sun">{status}</StatusPill>}
				{hidden && <StatusPill tone="muted">Нуугдсан</StatusPill>}
				{q.que_source && (
					<span className="truncate text-xs font-semibold text-muted-foreground">
						· {q.que_source}
					</span>
				)}
			</div>
			<div className="grid gap-3 sm:grid-cols-[1fr_auto]">
				<MathContent
					html={str(q.question_html) || "<p>—</p>"}
					className="min-w-0 text-[15px] leading-relaxed"
				/>
				{img && (
					// biome-ignore lint/performance/noImgElement: гадны URL
					<img
						src={img}
						alt="Даалгаврын зураг"
						loading="lazy"
						className="max-h-40 rounded-xl border border-border object-contain sm:max-w-56"
					/>
				)}
			</div>
			<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
				<p className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
					{path.join(" › ")}
				</p>
				<div className="ml-auto flex items-center gap-1">
					<QuestionActions questionId={q.question_id} hidden={hidden} />
					<Button asChild variant="outline" size="sm">
						<Link href={`/teacher/questions/${q.question_id}`}>
							<Pencil />
							Засах
						</Link>
					</Button>
				</div>
			</div>
		</li>
	);
}
