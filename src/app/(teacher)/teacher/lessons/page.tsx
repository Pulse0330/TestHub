"use client";

// ЖИШИГ ХУУДАС — багшийн бусад хуудсууд энэ бүтцийг дагана:
// useTeacher() → useQuery(teacherKey(...)) → listOf/pagedOf → DataTable,
// FormDialog + useTeacherMutation (invalidate) + ConfirmDelete.

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	type Column,
	ConfirmDelete,
	DataTable,
	Field,
	FilterBar,
	FormDialog,
	PageHeader,
	Panel,
	SearchInput,
} from "@/features/teacher/components";
import {
	listOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";

interface LessonRow {
	id: number;
	lessoncode?: string;
	lesson_name?: string;
	[key: string]: unknown;
}

const lessonsKey = (schoolId: number) => teacherKey("lessons", schoolId);

export default function TeacherLessonsPage() {
	const { userId, schoolId } = useTeacher();
	const [search, setSearch] = useState("");
	const [editing, setEditing] = useState<LessonRow | null>(null);
	const [form, setForm] = useState({ lessoncode: "", lessonname: "" });

	const { data, isLoading } = useQuery({
		queryKey: lessonsKey(schoolId),
		queryFn: () => teacherApi.lesson.list({ school_id: schoolId }),
		enabled: !!schoolId,
	});

	const rows = useMemo(() => {
		const all = listOf<LessonRow>(data);
		const q = search.trim().toLowerCase();
		if (!q) return all;
		return all.filter(
			(r) =>
				String(r.lesson_name ?? "")
					.toLowerCase()
					.includes(q) ||
				String(r.lessoncode ?? "")
					.toLowerCase()
					.includes(q),
		);
	}, [data, search]);

	const save = useTeacherMutation(
		(v: { id: number; lessoncode: string; lessonname: string }) =>
			teacherApi.lesson.save({ ...v, user_id: userId, school_id: schoolId }),
		{
			success: "Хичээл хадгалагдлаа",
			invalidate: [lessonsKey(schoolId)],
			onSuccess: () => setEditing(null),
		},
	);

	const remove = useTeacherMutation(
		(id: number) =>
			teacherApi.lesson.remove({ id, user_id: userId, school_id: schoolId }),
		{ success: "Хичээл устгагдлаа", invalidate: [lessonsKey(schoolId)] },
	);

	const openEditor = (row: LessonRow | null) => {
		setForm({
			lessoncode: row?.lessoncode ?? "",
			lessonname: row?.lesson_name ?? "",
		});
		setEditing(row ?? { id: 0 });
	};

	const columns: Column<LessonRow>[] = [
		{
			key: "code",
			header: "Код",
			cell: (r) => (
				<span className="font-extrabold tabular-nums">{r.lessoncode}</span>
			),
			className: "w-28",
		},
		{ key: "name", header: "Хичээлийн нэр", cell: (r) => r.lesson_name },
		{
			key: "actions",
			header: "",
			className: "w-24 text-right",
			cell: (r) => (
				<div className="flex justify-end gap-1">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Засах"
						onClick={() => openEditor(r)}
					>
						<Pencil />
					</Button>
					<ConfirmDelete
						title={`"${r.lesson_name}" хичээлийг устгах уу?`}
						onConfirm={() => remove.mutate(r.id)}
						pending={remove.isPending}
					/>
				</div>
			),
		},
	];

	const codeError =
		form.lessoncode.length > 5 ? "Код 5 тэмдэгтээс ихгүй" : undefined;

	return (
		<>
			<PageHeader
				title="Хичээл"
				description="Сургуулийн хичээлүүд"
				icon={BookOpen}
				actions={
					<Button onClick={() => openEditor(null)}>
						<Plus />
						Хичээл нэмэх
					</Button>
				}
			/>
			<Panel>
				<FilterBar>
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Код, нэрээр хайх"
					/>
				</FilterBar>
				<DataTable
					columns={columns}
					rows={rows}
					rowKey={(r) => r.id}
					isLoading={isLoading}
				/>
			</Panel>

			<FormDialog
				open={editing !== null}
				onOpenChange={(o) => !o && setEditing(null)}
				title={editing?.id ? "Хичээл засах" : "Хичээл нэмэх"}
				pending={save.isPending}
				onSubmit={() => {
					if (!form.lessoncode.trim() || !form.lessonname.trim() || codeError)
						return;
					save.mutate({
						id: editing?.id ?? 0,
						lessoncode: form.lessoncode.trim().toUpperCase(),
						lessonname: form.lessonname.trim(),
					});
				}}
			>
				<Field
					label="Код"
					required
					hint="5 хүртэл тэмдэгт, автоматаар том үсэг"
					error={codeError}
				>
					<Input
						value={form.lessoncode}
						maxLength={5}
						onChange={(e) =>
							setForm((f) => ({ ...f, lessoncode: e.target.value }))
						}
						required
					/>
				</Field>
				<Field label="Хичээлийн нэр" required>
					<Input
						value={form.lessonname}
						maxLength={250}
						onChange={(e) =>
							setForm((f) => ({ ...f, lessonname: e.target.value }))
						}
						required
					/>
				</Field>
			</FormDialog>
		</>
	);
}
