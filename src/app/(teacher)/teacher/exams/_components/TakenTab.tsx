"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	BarChart3,
	CalendarPlus,
	Clock,
	MapPin,
	Pencil,
	Users,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	type Column,
	ConfirmDelete,
	DataTable,
	EmptyState,
	FilterBar,
	formatDateTime,
	OptionSelect,
	Pagination,
	Panel,
	SearchInput,
	StatusPill,
} from "@/features/teacher/components";
import {
	listOf,
	pagedOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { TestType } from "@/lib/teacher-api";
import {
	num,
	type Row,
	str,
	testTypeLabel,
	useExamRef,
	yearEnd,
	yearStart,
} from "./shared";
import { type ExamEditing, examsKey, TakeExamDialog } from "./TakeExamDialog";

const PAGE_SIZE = 12;

const examIdOf = (r: Row) => num(r, "exam_id", "id");
const titleOf = (r: Row) =>
	str(r, "test_title", "exam_title", "title", "name") || "Нэргүй";

function statusOf(r: Row): {
	label: string;
	tone: "muted" | "mint" | "sun" | "sky";
} {
	const now = new Date();
	const s = new Date(str(r, "sdate", "start_date").replace(" ", "T"));
	const e = new Date(str(r, "enddate", "edate", "end_date").replace(" ", "T"));
	if (!Number.isNaN(s.getTime()) && now < s)
		return { label: "Товлогдсон", tone: "sky" };
	if (!Number.isNaN(e.getTime()) && now > e)
		return { label: "Дууссан", tone: "muted" };
	return { label: "Явагдаж байна", tone: "mint" };
}

export function TakenTab({ type }: { type: TestType }) {
	const { userId, schoolId } = useTeacher();
	const [lesson, setLesson] = useState("0");
	const [sdate, setSdate] = useState(yearStart);
	const [edate, setEdate] = useState(yearEnd);
	const [search, setSearch] = useState("");
	const filter = useDeferredValue(search.trim());
	const [page, setPage] = useState(1);
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<ExamEditing | null>(null);
	const [result, setResult] = useState<Row | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: шүүлт өөрчлөгдөхөд л
	useEffect(() => setPage(1), [lesson, sdate, edate, filter, type]);

	const lessons = useExamRef("lessons");
	const params = {
		test_type: type,
		teacher_id: userId,
		school_id: schoolId,
		lesson_id: Number(lesson) || undefined,
		sdate: sdate || undefined,
		edate: edate || undefined,
		filter: filter || undefined,
		page,
		size: PAGE_SIZE,
	};
	const { data, isLoading } = useQuery({
		queryKey: [...examsKey(type), params],
		queryFn: () => teacherApi.exam.exams.list(params),
		enabled: !!userId,
		placeholderData: keepPreviousData,
	});
	const paged = pagedOf<Row>(data);

	const remove = useTeacherMutation(
		(id: number) =>
			teacherApi.exam.exams.remove({
				exam_id: id,
				test_type: type,
				user_id: userId,
				school_id: schoolId,
			}),
		{
			success: "Устгагдлаа",
			invalidate: [examsKey(type), teacherKey("exam-dash")],
		},
	);

	return (
		<Panel>
			<FilterBar>
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Гарчгаар хайх"
				/>
				<OptionSelect
					options={lessons.options}
					value={lesson}
					onChange={setLesson}
					allLabel="Бүх хичээл"
					className="sm:w-48"
				/>
				<div className="flex items-center gap-1.5">
					<Input
						type="date"
						value={sdate}
						onChange={(e) => setSdate(e.target.value)}
						aria-label="Эхлэх огноо"
						className="sm:w-40"
					/>
					<span className="text-muted-foreground" aria-hidden>
						–
					</span>
					<Input
						type="date"
						value={edate}
						onChange={(e) => setEdate(e.target.value)}
						aria-label="Дуусах огноо"
						className="sm:w-40"
					/>
				</div>
				<Button onClick={() => setCreating(true)} className="sm:ml-auto">
					<CalendarPlus />
					{testTypeLabel(type)} авах
				</Button>
			</FilterBar>

			{isLoading ? (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{["a", "b", "c"].map((k) => (
						<Skeleton key={k} className="h-40 rounded-3xl" />
					))}
				</div>
			) : paged.rows.length === 0 ? (
				<EmptyState text="Авсан шалгалт алга" />
			) : (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{paged.rows.map((r) => {
						const st = statusOf(r);
						const addr = str(r, "address", "addr_name", "classname");
						const stu = num(r, "stu_cnt", "student_cnt", "exec_cnt");
						return (
							<article
								key={examIdOf(r)}
								className="flex flex-col rounded-3xl border border-border bg-card p-4"
							>
								<div className="mb-2 flex flex-wrap gap-1.5">
									<StatusPill tone={st.tone}>{st.label}</StatusPill>
									{str(r, "lesson_name") && (
										<StatusPill>{str(r, "lesson_name")}</StatusPill>
									)}
								</div>
								<h3 className="mb-3 line-clamp-2 text-base font-black tracking-tight">
									{titleOf(r)}
								</h3>
								<dl className="mt-auto grid gap-1 text-xs font-bold text-muted-foreground">
									<div className="flex items-center gap-1.5">
										<dt className="sr-only">Хугацаа</dt>
										<Clock className="size-3.5 shrink-0" />
										<dd className="tabular-nums">
											{formatDateTime(str(r, "sdate"))} —{" "}
											{formatDateTime(str(r, "edate"))}
											{num(r, "minute") > 0 && ` · ${num(r, "minute")} мин`}
										</dd>
									</div>
									{addr && (
										<div className="flex items-center gap-1.5">
											<dt className="sr-only">Хүрээ</dt>
											<MapPin className="size-3.5 shrink-0" />
											<dd className="truncate">{addr}</dd>
										</div>
									)}
									{stu > 0 && (
										<div className="flex items-center gap-1.5">
											<dt className="sr-only">Оролцсон</dt>
											<Users className="size-3.5 shrink-0" />
											<dd>{stu} сурагч</dd>
										</div>
									)}
								</dl>
								<div className="mt-4 flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										className="flex-1"
										onClick={() => setResult(r)}
									>
										<BarChart3 />
										Үр дүн
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="Засах"
										onClick={() =>
											setEditing({
												examId: examIdOf(r),
												testId: num(r, "test_id"),
												minute: num(r, "minute"),
												sdate: str(r, "sdate"),
												edate: str(r, "edate"),
												enddate: str(r, "enddate", "edate"),
											})
										}
									>
										<Pencil />
									</Button>
									<ConfirmDelete
										title={`"${titleOf(r)}" устгах уу?`}
										description="Сурагч ажилласан бол устгах боломжгүй."
										onConfirm={() => remove.mutate(examIdOf(r))}
										pending={remove.isPending}
									/>
								</div>
							</article>
						);
					})}
				</div>
			)}
			<Pagination
				page={page}
				size={PAGE_SIZE}
				total={paged.total}
				onPageChange={setPage}
			/>

			<TakeExamDialog
				open={creating || editing !== null}
				onOpenChange={(o) => {
					if (!o) {
						setCreating(false);
						setEditing(null);
					}
				}}
				type={type}
				testId={editing?.testId ?? 0}
				editing={editing}
			/>
			<ResultDialog row={result} onClose={() => setResult(null)} />
		</Panel>
	);
}

// ============================================================
// Үр дүн (result_examaddr)
// ============================================================
const RESULT_LABELS: Record<string, string> = {
	type_name: "Хүрээ",
	aimagidname: "Аймаг",
	aimag_name: "Аймаг",
	districtname: "Сум/дүүрэг",
	schoolname: "Сургууль",
	school_name: "Сургууль",
	classname: "Анги",
	class_name: "Анги",
	stu_cnt: "Сурагч",
	exec_cnt: "Оролцсон",
	ttl_cnt: "Нийт",
	avg_score: "Дундаж оноо",
	avg_point: "Дундаж оноо",
	avg_perc: "Дундаж %",
	max_score: "Дээд оноо",
	min_score: "Доод оноо",
	fname: "Нэр",
	lname: "Овог",
	score: "Оноо",
	point: "Оноо",
	perc: "Хувь",
};

function ResultDialog({
	row,
	onClose,
}: {
	row: Row | null;
	onClose: () => void;
}) {
	const examId = row ? examIdOf(row) : 0;
	const { data, isLoading } = useQuery({
		queryKey: teacherKey("exam-result", examId),
		queryFn: () => teacherApi.exam.exams.result({ exam_id: examId }),
		enabled: examId > 0,
	});
	const rows = listOf<Row>(data);
	const columns = useMemo<Column<Row>[]>(() => {
		const keys = Object.keys(rows[0] ?? {}).filter(
			(k) => !/(^id$|_id$|^dbname$)/.test(k),
		);
		return keys.slice(0, 8).map((k) => ({
			key: k,
			header: RESULT_LABELS[k] ?? k,
			cell: (r: Row) => {
				const v = r[k];
				return typeof v === "number" ? (
					<span className="tabular-nums">
						{Number.isInteger(v) ? v : v.toFixed(1)}
					</span>
				) : (
					String(v ?? "")
				);
			},
		}));
	}, [rows]);

	return (
		<Dialog open={row !== null} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle className="font-black">Үр дүн</DialogTitle>
					<DialogDescription className="font-semibold">
						{row ? titleOf(row) : ""}
					</DialogDescription>
				</DialogHeader>
				<div className="min-h-0 flex-1 overflow-auto">
					<DataTable
						columns={columns}
						rows={rows}
						rowKey={(_, i) => i}
						isLoading={isLoading}
						emptyText="Үр дүн одоогоор алга"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
