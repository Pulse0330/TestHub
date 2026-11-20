"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	type Column,
	DataTable,
	formatDateTime,
	SearchInput,
	StatusPill,
} from "@/features/teacher/components";
import { teacherKey } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { elibKeys } from "../../_components/shared";

interface StudentRow {
	student_id: number;
	stu_name?: string;
	class_name?: string;
	view_perc?: number;
	test_avg_perc?: number;
	[key: string]: unknown;
}

/** RetDataFirst тоолуурын шошго (мэдэгдэж буй түлхүүрүүд). */
const COUNT_LABELS: Record<string, string> = {
	stu_cnt: "Нийт сурагч",
	student_cnt: "Нийт сурагч",
	total: "Нийт сурагч",
	view_cnt: "Үзсэн",
	viewed: "Үзсэн",
	content_cnt: "Контент",
	unit_cnt: "Контент",
	test_cnt: "Тест",
	test_done: "Тест өгсөн",
	homework_cnt: "Гэрийн даалгавар",
};

const asArray = (v: unknown) =>
	(Array.isArray(v) ? v : []) as Record<string, unknown>[];
const asObject = (v: unknown) =>
	(Array.isArray(v) ? v[0] : v) as Record<string, unknown> | undefined;

function Perc({ value }: { value: unknown }) {
	const n = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
	return (
		<div className="flex min-w-28 items-center gap-2">
			<div
				className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
				role="progressbar"
				aria-valuenow={n}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div
					className="h-full rounded-full bg-primary-soft-shade"
					style={{ width: `${n}%` }}
				/>
			</div>
			<span className="w-10 text-right text-xs font-bold tabular-nums">
				{n}%
			</span>
		</div>
	);
}

export function ReportTab({ elibId }: { elibId: number }) {
	const [search, setSearch] = useState("");
	const [student, setStudent] = useState<StudentRow | null>(null);
	const res = useQuery({
		queryKey: elibKeys.report(elibId),
		queryFn: () => teacherApi.elib.report({ elib_id: elibId }),
	});

	const counts = Object.entries(asObject(res.data?.RetDataFirst) ?? {}).filter(
		([k, v]) => k in COUNT_LABELS && v !== null && !Number.isNaN(Number(v)),
	);
	const rows = useMemo(() => {
		const all = asArray(res.data?.RetDataSecond) as StudentRow[];
		const q = search.trim().toLowerCase();
		return q
			? all.filter((r) =>
					String(r.stu_name ?? "")
						.toLowerCase()
						.includes(q),
				)
			: all;
	}, [res.data, search]);

	const columns: Column<StudentRow>[] = [
		{
			key: "name",
			header: "Сурагч",
			cell: (r) => (
				<div>
					<p className="font-bold">{r.stu_name}</p>
					{r.class_name && (
						<p className="text-xs font-semibold text-muted-foreground">
							{r.class_name}
						</p>
					)}
				</div>
			),
		},
		{ key: "view", header: "Үзсэн", cell: (r) => <Perc value={r.view_perc} /> },
		{
			key: "test",
			header: "Тестийн дундаж",
			cell: (r) => <Perc value={r.test_avg_perc} />,
		},
	];

	return (
		<div className="grid gap-4">
			{counts.length > 0 && (
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					{counts.slice(0, 4).map(([k, v]) => (
						<div key={k} className="rounded-2xl bg-muted/50 px-4 py-3">
							<p className="text-xs font-bold text-muted-foreground">
								{COUNT_LABELS[k]}
							</p>
							<p className="text-2xl font-black tabular-nums">{String(v)}</p>
						</div>
					))}
				</div>
			)}
			<div className="flex justify-end">
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Сурагч хайх"
				/>
			</div>
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.student_id}
				isLoading={res.isLoading}
				emptyText="Энэ хавтсыг үзсэн сурагч алга"
				onRowClick={setStudent}
			/>
			<StudentReportDialog
				elibId={elibId}
				student={student}
				onClose={() => setStudent(null)}
			/>
		</div>
	);
}

const s = (r: Record<string, unknown>, ...keys: string[]) => {
	for (const k of keys) if (r[k] !== undefined && r[k] !== null) return r[k];
	return undefined;
};

function StudentReportDialog({
	elibId,
	student,
	onClose,
}: {
	elibId: number;
	student: StudentRow | null;
	onClose: () => void;
}) {
	const id = student?.student_id ?? 0;
	const res = useQuery({
		queryKey: teacherKey("elib", "student-report", elibId, id),
		queryFn: () =>
			teacherApi.elib.studentReport({ elib_id: elibId, student_id: id }),
		enabled: !!id,
	});
	const d = res.data;
	const rows = asArray(d?.RetDataSecond).length
		? asArray(d?.RetDataSecond)
		: asArray(d?.RetData);

	const columns: Column<Record<string, unknown>>[] = [
		{
			key: "title",
			header: "Контент",
			cell: (r) => (
				<span className="font-bold">
					{String(s(r, "title", "content_title", "name") ?? "")}
				</span>
			),
		},
		{
			key: "view",
			header: "Үзсэн",
			className: "whitespace-nowrap",
			cell: (r) => {
				const v = s(r, "view_date", "viewdate", "is_view", "viewed");
				if (!v || v === 0 || v === "0") return <StatusPill>Үзээгүй</StatusPill>;
				return (
					<StatusPill tone="mint">
						{typeof v === "string" && v.length > 4
							? formatDateTime(v)
							: "Үзсэн"}
					</StatusPill>
				);
			},
		},
		{
			key: "score",
			header: "Үнэлгээ",
			className: "text-right tabular-nums",
			cell: (r) => {
				const v = s(r, "perc", "test_perc", "score");
				return v === undefined || v === "" ? "—" : String(v);
			},
		},
	];

	return (
		<Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="font-black">{student?.stu_name}</DialogTitle>
					<DialogDescription className="font-semibold">
						Үзсэн {Math.round(Number(student?.view_perc) || 0)}% · Тестийн
						дундаж {Math.round(Number(student?.test_avg_perc) || 0)}%
					</DialogDescription>
				</DialogHeader>
				<DataTable
					columns={columns}
					rows={rows}
					rowKey={(r, i) => String(s(r, "id", "content_id") ?? i)}
					isLoading={res.isLoading}
					emptyText="Дэлгэрэнгүй мэдээлэл алга"
				/>
			</DialogContent>
		</Dialog>
	);
}
