"use client";

import { useQuery } from "@tanstack/react-query";
import { CloudDownload, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	type Column,
	DataTable,
	FilterBar,
	Panel,
	SearchInput,
	StatusPill,
} from "@/features/teacher/components";
import {
	listOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { ImportResult } from "@/lib/teacher-api";
import { num, planKey, str } from "./util";

interface CmsRow {
	curr_code: string;
	lesson_code?: string;
	curriculumname?: string;
	curriculumdescr?: string;
	ulesson_cnt?: number;
	rlesson_cnt?: number;
	[key: string]: unknown;
}

export function CmsTab({ lessonId }: { lessonId: number }) {
	const { userId } = useTeacher();
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [result, setResult] = useState<ImportResult | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: lessonId өөрчлөгдөхөд л
	useEffect(() => {
		setSelected(new Set());
		setResult(null);
	}, [lessonId]);

	const { data, isLoading, isFetching, refetch } = useQuery({
		queryKey: planKey("cms", lessonId),
		queryFn: () => teacherApi.plan.cms.remote({ lesson_id: lessonId }),
		enabled: !!lessonId,
	});

	const all = useMemo(() => listOf<CmsRow>(data), [data]);
	const rows = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return all;
		return all.filter(
			(r) =>
				str(r.curriculumname).toLowerCase().includes(q) ||
				str(r.curr_code).toLowerCase().includes(q),
		);
	}, [all, search]);

	const importer = useTeacherMutation(
		(codes: string[]) =>
			teacherApi.plan.cms.importCodes({
				lesson_id: lessonId,
				curr_codes: codes,
				user_id: userId,
			}),
		{
			invalidate: [
				planKey("topics", lessonId),
				planKey("curr", lessonId),
				planKey("tree", lessonId),
				planKey("dash", lessonId),
			],
			onSuccess: (res) => {
				setResult(res.RetData ?? null);
				setSelected(new Set());
			},
		},
	);

	const toggle = (code: string, on: boolean) =>
		setSelected((s) => {
			const n = new Set(s);
			if (on) n.add(code);
			else n.delete(code);
			return n;
		});
	const allChecked =
		rows.length > 0 && rows.every((r) => selected.has(str(r.curr_code)));
	const someChecked = rows.some((r) => selected.has(str(r.curr_code)));

	const columns: Column<CmsRow>[] = [
		{
			key: "check",
			header: "",
			className: "w-10",
			cell: (r) => (
				<Checkbox
					checked={selected.has(str(r.curr_code))}
					onCheckedChange={(v) => toggle(str(r.curr_code), v === true)}
					onClick={(e) => e.stopPropagation()}
					aria-label={`${r.curriculumname} сонгох`}
				/>
			),
		},
		{
			key: "name",
			header: "Хөтөлбөр",
			cell: (r) => (
				<div className="min-w-0">
					<p className="font-bold">{r.curriculumname}</p>
					{r.curriculumdescr && (
						<p className="line-clamp-2 text-xs font-semibold text-muted-foreground">
							{r.curriculumdescr}
						</p>
					)}
				</div>
			),
		},
		{
			key: "code",
			header: "Код",
			className: "hidden w-32 md:table-cell",
			cell: (r) => (
				<span className="font-mono text-xs text-muted-foreground">
					{r.curr_code}
				</span>
			),
		},
		{
			key: "cnt",
			header: "Агуулга",
			className: "w-40",
			cell: (r) => (
				<div className="flex flex-wrap gap-1">
					<StatusPill tone="sky">{num(r.ulesson_cnt)} бүлэг</StatusPill>
					<StatusPill>{num(r.rlesson_cnt)} сэдэв</StatusPill>
				</div>
			),
		},
	];

	return (
		<div className="grid gap-4">
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

			<Panel
				title="CMS-ийн хөтөлбөрүүд"
				actions={
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => refetch()}
							disabled={isFetching}
						>
							<RefreshCw className={isFetching ? "animate-spin" : undefined} />
							Шинэчлэх
						</Button>
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
				<FilterBar>
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Нэр, кодоор хайх"
					/>
					{rows.length > 0 && (
						// biome-ignore lint/a11y/noLabelWithoutControl: контрол label дотор байна
						<label className="flex items-center gap-2 text-sm font-bold text-muted-foreground sm:ml-auto">
							<Checkbox
								checked={
									allChecked ? true : someChecked ? "indeterminate" : false
								}
								onCheckedChange={(v) =>
									setSelected((s) => {
										const n = new Set(s);
										for (const r of rows) {
											if (v === true) n.add(str(r.curr_code));
											else n.delete(str(r.curr_code));
										}
										return n;
									})
								}
							/>
							Бүгдийг сонгох
						</label>
					)}
				</FilterBar>
				<DataTable
					columns={columns}
					rows={rows}
					rowKey={(r, i) => str(r.curr_code) || i}
					isLoading={isLoading}
					emptyText="CMS-д энэ хичээлийн хөтөлбөр олдсонгүй"
					onRowClick={(r) =>
						toggle(str(r.curr_code), !selected.has(str(r.curr_code)))
					}
				/>
			</Panel>
		</div>
	);
}
