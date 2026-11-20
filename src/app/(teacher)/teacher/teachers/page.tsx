"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	BookOpen,
	KeyRound,
	MoreHorizontal,
	Pencil,
	Plus,
	Users,
	UserX,
} from "lucide-react";
import { useState } from "react";
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
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import {
	Avatar,
	ConfirmAction,
	num,
	type Row,
	str,
	useDebounced,
} from "./_components/shared";
import { TeacherEditor } from "./_components/teacher-editor";
import { TeacherLessonsSheet } from "./_components/teacher-lessons-sheet";

const SIZE = 20;

type Pending = { kind: "delete" | "reset"; id: number; name: string } | null;

const fullName = (r: Row) =>
	[str(r, "lastname", "lname").slice(0, 1), str(r, "firstname", "fname")]
		.filter(Boolean)
		.join(". ");

export default function TeacherTeachersPage() {
	const { userId, schoolId } = useTeacher();
	const [page, setPage] = useState(1);
	const [positionId, setPositionId] = useState("0");
	const [search, setSearch] = useState("");
	const filter = useDebounced(search.trim());
	const [editingId, setEditingId] = useState<number | null>(null);
	const [lessonsOf, setLessonsOf] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [pending, setPending] = useState<Pending>(null);

	const listKey = teacherKey("teachers", schoolId);
	const { data, isLoading } = useQuery({
		queryKey: [...listKey, { page, positionId, filter }],
		queryFn: () =>
			teacherApi.teacher.list({
				school_id: schoolId,
				position_id: Number(positionId) || undefined,
				filter: filter || undefined,
				page,
				size: SIZE,
			}),
		enabled: !!schoolId,
		placeholderData: keepPreviousData,
	});
	const positions = useQuery({
		queryKey: teacherKey("teacher-ref", "positions"),
		queryFn: () => teacherApi.teacher.positions(),
		staleTime: 10 * 60_000,
	});

	const paged = pagedOf<Row>(data);

	const remove = useTeacherMutation(
		(teacher_id: number) => teacherApi.teacher.remove({ teacher_id }),
		{
			success: "Багш идэвхгүй боллоо",
			invalidate: [listKey],
			onSuccess: () => setPending(null),
		},
	);
	const reset = useTeacherMutation(
		(teacher_id: number) =>
			teacherApi.teacher.resetPassword({ teacher_id, user_id: userId }),
		{
			success: "Нууц үг 1234 боллоо",
			onSuccess: () => setPending(null),
		},
	);

	const columns: Column<Row>[] = [
		{
			key: "name",
			header: "Багш",
			cell: (r) => (
				<div className="flex min-w-0 items-center gap-3">
					<Avatar
						name={`${str(r, "lastname")} ${str(r, "firstname")}`}
						src={str(r, "img_url", "imgurl") || undefined}
					/>
					<div className="min-w-0">
						<p className="truncate font-extrabold">{fullName(r)}</p>
						<p className="truncate text-xs font-semibold text-muted-foreground md:hidden">
							{str(r, "posname") || str(r, "phone")}
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
			key: "pos",
			header: "Албан тушаал",
			className: "hidden md:table-cell",
			cell: (r) => str(r, "posname"),
		},
		{
			key: "phone",
			header: "Утас",
			className: "hidden lg:table-cell",
			cell: (r) => <span className="tabular-nums">{str(r, "phone")}</span>,
		},
		{
			key: "email",
			header: "Имэйл",
			className: "hidden xl:table-cell",
			cell: (r) => str(r, "email"),
		},
		{
			key: "actions",
			header: "",
			className: "w-24 text-right",
			cell: (r) => {
				const id = num(r, "id", "teacher_id");
				const name = fullName(r);
				return (
					<div className="flex justify-end gap-1">
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={`${name} — засах`}
							onClick={() => setEditingId(id)}
						>
							<Pencil />
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={`${name} — бусад үйлдэл`}
								>
									<MoreHorizontal />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem onSelect={() => setLessonsOf({ id, name })}>
									<BookOpen />
									Хичээлүүд
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={() => setPending({ kind: "reset", id, name })}
								>
									<KeyRound />
									Нууц үг сэргээх
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive focus:text-destructive [&_svg]:text-destructive!"
									onSelect={() => setPending({ kind: "delete", id, name })}
								>
									<UserX />
									Идэвхгүй болгох
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
				title="Багш, ажилтан"
				description="Сургуулийн багш, ажилтнуудын бүртгэл"
				icon={Users}
				actions={
					<Button onClick={() => setEditingId(0)}>
						<Plus />
						Багш нэмэх
					</Button>
				}
			/>
			<Panel>
				<FilterBar>
					<SearchInput
						value={search}
						onChange={(v) => {
							setSearch(v);
							setPage(1);
						}}
						placeholder="Нэр, утас, нэвтрэх нэрээр хайх"
						className="sm:w-72"
					/>
					<OptionSelect
						options={toOptions(listOf(positions.data))}
						value={positionId}
						allLabel="Бүх албан тушаал"
						placeholder="Албан тушаал"
						onChange={(v) => {
							setPositionId(v);
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
					rowKey={(r, i) => num(r, "id", "teacher_id") || i}
					isLoading={isLoading}
					emptyText="Багш олдсонгүй"
				/>
				<Pagination
					page={page}
					size={SIZE}
					total={paged.total}
					onPageChange={setPage}
				/>
			</Panel>

			<TeacherEditor
				teacherId={editingId}
				onClose={() => setEditingId(null)}
				invalidateKey={listKey}
			/>
			<TeacherLessonsSheet
				teacher={lessonsOf}
				onClose={() => setLessonsOf(null)}
			/>
			<ConfirmAction
				open={pending?.kind === "delete"}
				onOpenChange={(o) => !o && setPending(null)}
				title={`${pending?.name ?? ""} багшийг идэвхгүй болгох уу?`}
				description="Багш системд нэвтрэх боломжгүй болно."
				confirmLabel="Идэвхгүй болгох"
				destructive
				pending={remove.isPending}
				onConfirm={() => pending && remove.mutate(pending.id)}
			/>
			<ConfirmAction
				open={pending?.kind === "reset"}
				onOpenChange={(o) => !o && setPending(null)}
				title={`${pending?.name ?? ""} — нууц үг сэргээх үү?`}
				description="Нууц үг 1234 болно."
				confirmLabel="Сэргээх"
				pending={reset.isPending}
				onConfirm={() => pending && reset.mutate(pending.id)}
			/>
		</>
	);
}
