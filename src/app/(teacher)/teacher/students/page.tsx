"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	BadgeCheck,
	GraduationCap,
	KeyRound,
	ListChecks,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import {
	Avatar,
	ConfirmAction,
	num,
	type Row,
	str,
	useDebounced,
} from "@/app/(teacher)/teacher/teachers/_components/shared";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	type Column,
	DataTable,
	FilterBar,
	OptionSelect,
	PageHeader,
	Pagination,
	Panel,
	SearchInput,
	toOptions,
} from "@/features/teacher/components";
import {
	listOf,
	pagedOf,
	teacherKey,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import {
	StudentLicensesDialog,
	StudentPlansDialog,
	type StudentRef,
} from "./_components/student-dialogs";

const SIZE = 20;
/** Бүх сургуулиас хайна. */
const SCHOOL_DB = "EDU_CONFIG";

const studentId = (r: Row) => num(r, "student_id", "id", "user_id");
const studentName = (r: Row) =>
	[str(r, "lastname", "lname").slice(0, 1), str(r, "firstname", "fname")]
		.filter(Boolean)
		.join(". ") || str(r, "login_name");

type Pending = (StudentRef & { kind: "delete" | "reset" }) | null;

export default function TeacherStudentsPage() {
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState("0");
	const [currId, setCurrId] = useState("0");
	const [search, setSearch] = useState("");
	const filter = useDebounced(search.trim());
	const [plansOf, setPlansOf] = useState<StudentRef | null>(null);
	const [licensesOf, setLicensesOf] = useState<StudentRef | null>(null);
	const [pending, setPending] = useState<Pending>(null);

	const listKey = teacherKey("students");
	const { data, isLoading } = useQuery({
		queryKey: [...listKey, { page, status, currId, filter }],
		queryFn: () =>
			teacherApi.student.list({
				aimag_id: 0,
				sym_id: 0,
				school_db: SCHOOL_DB,
				curr_id: Number(currId) || 0,
				status: Number(status) || 0,
				filter: filter || undefined,
				page,
				size: SIZE,
			}),
		placeholderData: keepPreviousData,
	});
	const statuses = useQuery({
		queryKey: teacherKey("student-ref", "status"),
		queryFn: () => teacherApi.student.statuses(),
		staleTime: 10 * 60_000,
	});
	const curriculums = useQuery({
		queryKey: teacherKey("student-ref", "curr"),
		queryFn: () => teacherApi.student.curriculums(),
		staleTime: 10 * 60_000,
	});

	const paged = pagedOf<Row>(data);
	// "0 бүгд" сонголтыг backend өөрөө буцаадаг тул давхардуулахгүй
	const statusOptions = toOptions(listOf(statuses.data)).filter(
		(o) => String(o.value) !== "0",
	);
	const currOptions = toOptions(
		listOf(curriculums.data),
		"id",
		"currplan_name",
	).filter((o) => String(o.value) !== "0");

	const remove = useTeacherMutation(
		(student_id: number) => teacherApi.student.remove({ student_id }),
		{
			success: "Суралцагч устгагдлаа",
			invalidate: [listKey],
			onSuccess: () => setPending(null),
		},
	);
	const reset = useTeacherMutation(
		(student_id: number) => teacherApi.student.resetPassword({ student_id }),
		{ success: "Нууц үг сэргээгдлээ", onSuccess: () => setPending(null) },
	);

	const columns: Column<Row>[] = [
		{
			key: "name",
			header: "Суралцагч",
			cell: (r) => (
				<div className="flex min-w-0 items-center gap-3">
					<Avatar
						name={`${str(r, "lastname")} ${str(r, "firstname")}`}
						src={str(r, "img_url", "imgurl") || undefined}
					/>
					<div className="min-w-0">
						<p className="truncate font-extrabold">{studentName(r)}</p>
						<p className="truncate text-xs font-semibold text-muted-foreground sm:hidden">
							{str(r, "login_name")}
						</p>
					</div>
				</div>
			),
		},
		{
			key: "login",
			header: "Нэвтрэх нэр",
			className: "hidden sm:table-cell",
			cell: (r) => (
				<span className="font-semibold tabular-nums">
					{str(r, "login_name")}
				</span>
			),
		},
		{
			key: "school",
			header: "Сургууль",
			className: "hidden lg:table-cell",
			cell: (r) => str(r, "sch_name", "schname", "school_name"),
		},
		{
			key: "phone",
			header: "Утас",
			className: "hidden md:table-cell",
			cell: (r) => <span className="tabular-nums">{str(r, "phone")}</span>,
		},
		{
			key: "actions",
			header: "",
			className: "w-24 text-right",
			cell: (r) => {
				const ref = { id: studentId(r), name: studentName(r) };
				return (
					<div className="flex justify-end gap-1">
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={`${ref.name} — эрх`}
							onClick={() => setLicensesOf(ref)}
						>
							<BadgeCheck />
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={`${ref.name} — бусад үйлдэл`}
								>
									<MoreHorizontal />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem onSelect={() => setLicensesOf(ref)}>
									<BadgeCheck />
									Эрх олгох
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setPlansOf(ref)}>
									<ListChecks />
									Хөтөлбөрүүд
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={() => setPending({ ...ref, kind: "reset" })}
								>
									<KeyRound />
									Нууц үг сэргээх
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive focus:text-destructive [&_svg]:text-destructive!"
									onSelect={() => setPending({ ...ref, kind: "delete" })}
								>
									<Trash2 />
									Устгах
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];

	return (
		<>
			<PageHeader
				title="Суралцагч"
				description="Суралцагчид, хөтөлбөрийн эрх"
				icon={GraduationCap}
			/>
			<Panel>
				<FilterBar>
					<SearchInput
						value={search}
						onChange={(v) => {
							setSearch(v);
							setPage(1);
						}}
						placeholder="Нэр, нэвтрэх нэрээр хайх"
						className="sm:w-72"
					/>
					<OptionSelect
						options={statusOptions}
						value={status}
						allLabel="Бүх төлөв"
						placeholder="Төлөв"
						onChange={(v) => {
							setStatus(v);
							setPage(1);
						}}
						className="sm:w-44"
					/>
					<OptionSelect
						options={currOptions}
						value={currId}
						allLabel="Бүх хөтөлбөр"
						placeholder="Хөтөлбөр"
						onChange={(v) => {
							setCurrId(v);
							setPage(1);
						}}
					/>
					{paged.total > 0 && paged.total <= SIZE && (
						<span className="text-xs font-bold text-muted-foreground tabular-nums sm:ml-auto">
							Нийт {paged.total}
						</span>
					)}
				</FilterBar>
				<DataTable
					columns={columns}
					rows={paged.rows}
					rowKey={(r, i) => studentId(r) || i}
					isLoading={isLoading}
					emptyText="Суралцагч олдсонгүй"
				/>
				<Pagination
					page={page}
					size={SIZE}
					total={paged.total}
					onPageChange={setPage}
				/>
			</Panel>

			<StudentPlansDialog student={plansOf} onClose={() => setPlansOf(null)} />
			<StudentLicensesDialog
				student={licensesOf}
				onClose={() => setLicensesOf(null)}
			/>
			<ConfirmAction
				open={pending?.kind === "delete"}
				onOpenChange={(o) => !o && setPending(null)}
				title={`${pending?.name ?? ""} суралцагчийг устгах уу?`}
				description="Энэ үйлдлийг буцаах боломжгүй."
				confirmLabel="Устгах"
				destructive
				pending={remove.isPending}
				onConfirm={() => pending && remove.mutate(pending.id)}
			/>
			<ConfirmAction
				open={pending?.kind === "reset"}
				onOpenChange={(o) => !o && setPending(null)}
				title={`${pending?.name ?? ""} — нууц үг сэргээх үү?`}
				description="Суралцагчийн нууц үг анхны утгаараа сэргээгдэнэ."
				confirmLabel="Сэргээх"
				pending={reset.isPending}
				onConfirm={() => pending && reset.mutate(pending.id)}
			/>
		</>
	);
}
