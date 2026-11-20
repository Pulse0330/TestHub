"use client";

import { useQuery } from "@tanstack/react-query";
import {
	CheckCircle2,
	CloudDownload,
	Loader2,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ConfirmDelete,
	EmptyState,
	Field,
	OptionSelect,
	Panel,
	SearchInput,
	StatusPill,
} from "@/features/teacher/components";
import {
	itemOf,
	listOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { CmsRefKind, ImportResult } from "@/lib/teacher-api";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown>;
const s = (r: Row, ...keys: string[]) => {
	for (const k of keys) {
		const v = r[k];
		if (v !== undefined && v !== null && v !== "") return String(v);
	}
	return "";
};
const truthy = (v: unknown) => v === true || v === 1 || v === "1";

const NEEDS_PROJECT: CmsRefKind[] = ["curr_level", "curr_lesson"];
const NEEDS_LESSON: CmsRefKind[] = ["soril_category"];

export const cmsKey = (...p: unknown[]) => teacherKey("cms", ...p);

export function KindPanel({ kind }: { kind: CmsRefKind }) {
	const { userId, schoolId } = useTeacher();
	const needsProject = NEEDS_PROJECT.includes(kind);
	const needsLesson = NEEDS_LESSON.includes(kind);
	const [project, setProject] = useState("");
	const [lesson, setLesson] = useState("");
	const [localSearch, setLocalSearch] = useState("");
	const [remoteSearch, setRemoteSearch] = useState("");
	const [checked, setChecked] = useState<Set<string>>(new Set());
	const [result, setResult] = useState<ImportResult | null>(null);

	const projectsQ = useQuery({
		queryKey: cmsKey("projects", schoolId),
		queryFn: () => teacherApi.cmsRef.projects({ school_id: schoolId }),
		enabled: needsProject,
	});
	const lessonsQ = useQuery({
		queryKey: cmsKey("lessons", userId),
		queryFn: () => teacherApi.cmsRef.lessons({ user_id: userId }),
		enabled: needsLesson && !!userId,
	});
	const projectOpts = useMemo(
		() =>
			listOf<Row>(projectsQ.data).map((r) => ({
				value: s(r, "id", "code", "project_code"),
				label: s(r, "title", "name"),
			})),
		[projectsQ.data],
	);
	const lessonOpts = useMemo(
		() =>
			listOf<Row>(lessonsQ.data).map((r) => ({
				value: s(r, "id", "code", "lesson_code"),
				label: s(r, "title", "name"),
			})),
		[lessonsQ.data],
	);

	const ready = (!needsProject || !!project) && (!needsLesson || !!lesson);
	const filter = {
		kind,
		project_code: needsProject ? project : undefined,
		lesson_code: needsLesson ? lesson : undefined,
	};

	const localQ = useQuery({
		queryKey: cmsKey("list", kind, project, lesson),
		queryFn: () => teacherApi.cmsRef.list(filter),
		enabled: ready,
	});
	const remoteQ = useQuery({
		queryKey: cmsKey("remote", kind, project, lesson),
		queryFn: () => teacherApi.cmsRef.remote(filter),
		enabled: ready,
	});

	const localRows = useMemo(() => {
		const all = listOf<Row>(localQ.data);
		const q = localSearch.trim().toLowerCase();
		if (!q) return all;
		return all.filter((r) =>
			`${s(r, "code")} ${s(r, "title", "name")}`.toLowerCase().includes(q),
		);
	}, [localQ.data, localSearch]);
	const remoteAll = useMemo(() => listOf<Row>(remoteQ.data), [remoteQ.data]);
	const remoteRows = useMemo(() => {
		const q = remoteSearch.trim().toLowerCase();
		if (!q) return remoteAll;
		return remoteAll.filter((r) =>
			`${s(r, "code")} ${s(r, "title", "name")}`.toLowerCase().includes(q),
		);
	}, [remoteAll, remoteSearch]);
	const importable = remoteRows.filter((r) => !truthy(r.exists));
	const allChecked =
		importable.length > 0 && importable.every((r) => checked.has(s(r, "code")));

	const invalidate = [cmsKey("list", kind), cmsKey("remote", kind)];
	const importer = useTeacherMutation(
		(codes: string[]) =>
			teacherApi.cmsRef.importCodes({ ...filter, codes, user_id: userId }),
		{
			invalidate,
			onSuccess: (res) => {
				setResult(itemOf<ImportResult>(res) ?? null);
				setChecked(new Set());
			},
		},
	);
	const remove = useTeacherMutation(
		(id: number) => teacherApi.cmsRef.remove({ kind, id, user_id: userId }),
		{ success: "Устгагдлаа", invalidate },
	);

	const toggle = (code: string) =>
		setChecked((prev) => {
			const next = new Set(prev);
			if (next.has(code)) next.delete(code);
			else next.add(code);
			return next;
		});

	return (
		<div className="grid gap-4">
			{(needsProject || needsLesson) && (
				<div className="flex flex-wrap gap-3">
					{needsProject && (
						<Field label="Төсөл" className="w-full sm:w-72">
							<OptionSelect
								options={projectOpts}
								value={project}
								onChange={(v) => {
									setProject(v);
									setChecked(new Set());
									setResult(null);
								}}
								placeholder="Төсөл сонгох"
								className="sm:w-full"
							/>
						</Field>
					)}
					{needsLesson && (
						<Field label="Хичээл" className="w-full sm:w-72">
							<OptionSelect
								options={lessonOpts}
								value={lesson}
								onChange={(v) => {
									setLesson(v);
									setChecked(new Set());
									setResult(null);
								}}
								placeholder="Хичээл сонгох"
								className="sm:w-full"
							/>
						</Field>
					)}
				</div>
			)}

			{result && (
				<ResultSummary result={result} onClose={() => setResult(null)} />
			)}

			{!ready ? (
				<Panel>
					<EmptyState
						text={
							needsProject
								? "Эхлээд төсөл сонгоно уу"
								: "Эхлээд хичээл сонгоно уу"
						}
					/>
				</Panel>
			) : (
				<div className="grid gap-4 lg:grid-cols-2">
					<Panel
						title={`Татсан (${listOf(localQ.data).length})`}
						actions={
							<SearchInput
								value={localSearch}
								onChange={setLocalSearch}
								className="sm:w-48"
							/>
						}
					>
						<RowList
							loading={localQ.isLoading}
							empty={localRows.length === 0}
							emptyText="Татсан мөр алга"
						>
							{localRows.map((r, i) => (
								<li
									key={`${s(r, "id")}-${i}`}
									className="flex items-center gap-3 px-3 py-2"
								>
									<Code value={s(r, "code")} />
									<span className="min-w-0 flex-1 truncate text-sm font-semibold">
										{s(r, "title", "name")}
									</span>
									<ConfirmDelete
										title={`"${s(r, "title", "name")}"-г устгах уу?`}
										onConfirm={() => remove.mutate(Number(r.id))}
										pending={remove.isPending}
									/>
								</li>
							))}
						</RowList>
					</Panel>

					<Panel
						title={`CMS-ийн (${remoteAll.length})`}
						actions={
							<div className="flex w-full items-center gap-2 sm:w-auto">
								<SearchInput
									value={remoteSearch}
									onChange={setRemoteSearch}
									className="min-w-0 flex-1 sm:w-48 sm:flex-none"
								/>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Шинэчлэх"
									onClick={() => remoteQ.refetch()}
								>
									<RefreshCw
										className={cn(remoteQ.isFetching && "animate-spin")}
									/>
								</Button>
							</div>
						}
					>
						<div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2">
							{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox label дотор байна */}
							<label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
								<Checkbox
									checked={allChecked}
									disabled={importable.length === 0}
									onCheckedChange={(c) =>
										setChecked(
											c === true
												? new Set(importable.map((r) => s(r, "code")))
												: new Set(),
										)
									}
								/>
								Шинэ бүгдийг ({importable.length})
							</label>
							<Button
								size="sm"
								disabled={checked.size === 0 || importer.isPending}
								onClick={() => importer.mutate([...checked])}
							>
								{importer.isPending ? (
									<Loader2 className="animate-spin" />
								) : (
									<CloudDownload />
								)}
								Татах{checked.size > 0 && ` (${checked.size})`}
							</Button>
						</div>
						<RowList
							loading={remoteQ.isLoading}
							empty={remoteRows.length === 0}
							emptyText="CMS-д мөр алга"
						>
							{remoteRows.map((r) => {
								const code = s(r, "code");
								const exists = truthy(r.exists);
								return (
									<li key={code}>
										{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox label дотор байна */}
										<label
											className={cn(
												"flex items-center gap-3 px-3 py-2",
												exists
													? "opacity-60"
													: "cursor-pointer hover:bg-muted/40",
											)}
										>
											<Checkbox
												checked={exists || checked.has(code)}
												disabled={exists}
												onCheckedChange={() => toggle(code)}
												aria-label={s(r, "title", "name")}
											/>
											<Code value={code} />
											<span className="min-w-0 flex-1 truncate text-sm font-semibold">
												{s(r, "title", "name")}
											</span>
											{exists && <StatusPill tone="mint">Татсан</StatusPill>}
										</label>
									</li>
								);
							})}
						</RowList>
					</Panel>
				</div>
			)}
		</div>
	);
}

function Code({ value }: { value: string }) {
	return (
		<span className="w-14 shrink-0 truncate font-mono sm:w-20 text-xs font-bold text-muted-foreground tabular-nums">
			{value}
		</span>
	);
}

function RowList({
	loading,
	empty,
	emptyText,
	children,
}: {
	loading: boolean;
	empty: boolean;
	emptyText: string;
	children: ReactNode;
}) {
	if (loading)
		return (
			<div className="grid gap-2">
				{["a", "b", "c", "d"].map((k) => (
					<Skeleton key={k} className="h-10 rounded-xl" />
				))}
			</div>
		);
	if (empty) return <EmptyState text={emptyText} />;
	return (
		<ul className="max-h-[60dvh] divide-y divide-border overflow-y-auto rounded-xl border border-border">
			{children}
		</ul>
	);
}

function ResultSummary({
	result,
	onClose,
}: {
	result: ImportResult;
	onClose: () => void;
}) {
	const errors = result.errors ?? [];
	return (
		<div
			aria-live="polite"
			className="rounded-2xl border border-border bg-card p-4"
		>
			<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
				<span className="text-sm font-black">Татсан үр дүн</span>
				<span className="text-sm font-bold text-muted-foreground tabular-nums">
					Нийт {result.total ?? 0}
				</span>
				<span className="inline-flex items-center gap-1 text-sm font-bold text-pop-mint-ink tabular-nums">
					<CheckCircle2 className="size-4" />
					Амжилттай {result.success ?? 0}
				</span>
				<span
					className={cn(
						"inline-flex items-center gap-1 text-sm font-bold tabular-nums",
						result.failed ? "text-pop-coral-ink" : "text-muted-foreground",
					)}
				>
					<XCircle className="size-4" />
					Алдаатай {result.failed ?? 0}
				</span>
				<Button variant="ghost" size="sm" className="ml-auto" onClick={onClose}>
					Хаах
				</Button>
			</div>
			{errors.length > 0 && (
				<ul className="mt-3 grid max-h-40 gap-1 overflow-y-auto rounded-xl bg-pop-coral-soft/50 p-2.5 text-xs font-semibold">
					{errors.map((e, i) => (
						<li
							// biome-ignore lint/suspicious/noArrayIndexKey: тогтмол жагсаалт
							key={i}
						>
							<span className="font-mono font-bold">{e.code}</span>: {e.message}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
