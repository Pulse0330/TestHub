"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	CalendarDays,
	CalendarPlus,
	Clock,
	FileQuestion,
	MoreHorizontal,
	Pencil,
	Play,
	Printer,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	EmptyState,
	FilterBar,
	OptionSelect,
	Pagination,
	Panel,
	SearchInput,
	StatusPill,
} from "@/features/teacher/components";
import {
	pagedOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { TestType } from "@/lib/teacher-api";
import {
	bool,
	dateOnly,
	num,
	type Row,
	str,
	testTypeLabel,
	useExamRef,
	yearEnd,
	yearStart,
} from "./shared";
import { TakeExamDialog } from "./TakeExamDialog";

const PAGE_SIZE = 12;

/** optype — материалын эх сурвалж (таамаг: 1 өөрийн, 2 CMS-ээс). */
const OPTYPES = [
	{ value: 1, label: "Өөрийн бэлдсэн" },
	{ value: 2, label: "CMS-ээс татсан" },
];

export const testsKey = (type: TestType) => teacherKey("exam-tests", type);

export const testIdOf = (r: Row) => num(r, "test_id", "id");
export const testTitleOf = (r: Row) =>
	str(r, "test_title", "title", "test_name", "name") || "Нэргүй материал";

export function MaterialsTab({ type }: { type: TestType }) {
	const { userId, schoolId } = useTeacher();
	const [lesson, setLesson] = useState("0");
	const [examType, setExamType] = useState("0");
	const [optype, setOptype] = useState("0");
	const [sdate, setSdate] = useState(yearStart);
	const [edate, setEdate] = useState(yearEnd);
	const [search, setSearch] = useState("");
	const filter = useDeferredValue(search.trim());
	const [page, setPage] = useState(1);
	const [taking, setTaking] = useState<Row | null>(null);
	const [deleting, setDeleting] = useState<Row | null>(null);

	// Шүүлт солигдвол 1-р хуудас руу
	// biome-ignore lint/correctness/useExhaustiveDependencies: шүүлт өөрчлөгдөхөд л
	useEffect(
		() => setPage(1),
		[lesson, examType, optype, sdate, edate, filter, type],
	);

	const lessons = useExamRef("lessons");
	const examTypes = useExamRef("exam_types", {}, type === 2);

	const params = {
		test_type: type,
		teacher_id: userId,
		school_id: schoolId,
		lesson_id: Number(lesson) || undefined,
		exam_type: type === 2 ? Number(examType) || undefined : undefined,
		optype: Number(optype) || undefined,
		sdate: sdate || undefined,
		edate: edate || undefined,
		filter: filter || undefined,
		page,
		size: PAGE_SIZE,
	};
	const { data, isLoading } = useQuery({
		queryKey: [...testsKey(type), params],
		queryFn: () => teacherApi.exam.tests.list(params),
		enabled: !!userId,
		placeholderData: keepPreviousData,
	});
	const paged = pagedOf<Row>(data);

	const remove = useTeacherMutation(
		(id: number) =>
			teacherApi.exam.tests.remove({
				test_id: id,
				user_id: userId,
				school_id: schoolId,
			}),
		{
			success: "Материал устгагдлаа",
			invalidate: [testsKey(type), teacherKey("exam-dash")],
			onSuccess: () => setDeleting(null),
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
				{type === 2 && (
					<OptionSelect
						options={examTypes.options}
						value={examType}
						onChange={setExamType}
						allLabel="Бүх төрөл"
						className="sm:w-44"
					/>
				)}
				<OptionSelect
					options={OPTYPES}
					value={optype}
					onChange={setOptype}
					allLabel="Бүх эх сурвалж"
					className="sm:w-44"
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
			</FilterBar>

			{isLoading ? (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{["a", "b", "c", "d", "e", "f"].map((k) => (
						<Skeleton key={k} className="h-44 rounded-3xl" />
					))}
				</div>
			) : paged.rows.length === 0 ? (
				<EmptyState text={`${testTypeLabel(type)}ийн материал олдсонгүй`}>
					<Button asChild size="sm">
						<Link href={`/teacher/exams/new?type=${type}`}>Шинээр үүсгэх</Link>
					</Button>
				</EmptyState>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{paged.rows.map((r) => (
						<MaterialCard
							key={testIdOf(r)}
							row={r}
							type={type}
							onTake={() => setTaking(r)}
							onDelete={() => setDeleting(r)}
						/>
					))}
				</div>
			)}
			<Pagination
				page={page}
				size={PAGE_SIZE}
				total={paged.total}
				onPageChange={setPage}
			/>

			<TakeExamDialog
				open={taking !== null}
				onOpenChange={(o) => !o && setTaking(null)}
				type={type}
				testId={taking ? testIdOf(taking) : 0}
				testTitle={taking ? testTitleOf(taking) : ""}
				defaultMinute={taking ? num(taking, "minute", "test_minute") : 0}
			/>

			<AlertDialog
				open={deleting !== null}
				onOpenChange={(o) => !o && setDeleting(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							“{deleting ? testTitleOf(deleting) : ""}” устгах уу?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Материал болон түүний асуултын сонголт устна. Энэ үйлдлийг буцаах
							боломжгүй.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Болих</AlertDialogCancel>
						<AlertDialogAction
							disabled={remove.isPending}
							onClick={() => deleting && remove.mutate(testIdOf(deleting))}
							className="bg-pop-coral text-pop-on hover:bg-pop-coral/90"
						>
							Устгах
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Panel>
	);
}

function MaterialCard({
	row,
	type,
	onTake,
	onDelete,
}: {
	row: Row;
	type: TestType;
	onTake: () => void;
	onDelete: () => void;
}) {
	const id = testIdOf(row);
	const base = `/teacher/exams/${id}`;
	const lesson = str(row, "lesson_name", "lessonname", "lesson");
	const queCnt = num(row, "que_cnt", "question_cnt", "test_cnt", "cnt");
	const minute = num(row, "minute", "test_minute");
	const created = dateOnly(
		str(row, "created_on", "insert_date", "created_at", "sdate"),
	);
	const sub = str(row, "exam_type_name", "cat_name", "purpose_name");
	const paid = bool(row, "is_pay");
	return (
		<article className="flex flex-col rounded-3xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
			<div className="mb-2 flex items-start justify-between gap-2">
				<div className="flex min-w-0 flex-wrap gap-1.5">
					{lesson && <StatusPill tone="sky">{lesson}</StatusPill>}
					{sub && <StatusPill>{sub}</StatusPill>}
					{paid && <StatusPill tone="sun">Төлбөртэй</StatusPill>}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Бусад үйлдэл"
							className="-mt-1 -mr-1 shrink-0"
						>
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<Link href={`${base}?type=${type}`}>
								<Pencil />
								Засах
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href={`${base}/practice`}>
								<Play />
								Туршиж үзэх
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href={`${base}/print`}>
								<Printer />
								Хэвлэх
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={onDelete}
							className="text-destructive focus:text-destructive"
						>
							<Trash2 />
							Устгах
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<Link
				href={`${base}?type=${type}`}
				className="mb-3 line-clamp-2 text-base font-black tracking-tight hover:text-primary"
			>
				{testTitleOf(row)}
			</Link>
			<div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground">
				<span className="inline-flex items-center gap-1">
					<FileQuestion className="size-3.5" />
					{queCnt} асуулт
				</span>
				{minute > 0 && (
					<span className="inline-flex items-center gap-1">
						<Clock className="size-3.5" />
						{minute} мин
					</span>
				)}
				{created && (
					<span className="inline-flex items-center gap-1">
						<CalendarDays className="size-3.5" />
						{created}
					</span>
				)}
			</div>
			<div className="mt-4 flex gap-2">
				<Button variant="outline" size="sm" asChild className="flex-1">
					<Link href={`${base}/practice`}>
						<Play />
						Турших
					</Link>
				</Button>
				<Button size="sm" onClick={onTake} className="flex-1">
					<CalendarPlus />
					Авах
				</Button>
			</div>
		</article>
	);
}
