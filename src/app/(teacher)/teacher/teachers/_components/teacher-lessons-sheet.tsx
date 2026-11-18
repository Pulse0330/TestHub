"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2, Plus } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ConfirmDelete,
	EmptyState,
	SearchInput,
} from "@/features/teacher/components";
import {
	listOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { CheckTile, num, type Row, str } from "./shared";

export function TeacherLessonsSheet({
	teacher,
	onClose,
}: {
	teacher: { id: number; name: string } | null;
	onClose: () => void;
}) {
	const { userId, schoolId } = useTeacher();
	const open = teacher !== null;
	const teacherId = teacher?.id ?? 0;
	const [adding, setAdding] = useState(false);
	const [selected, setSelected] = useState<number[]>([]);
	const [search, setSearch] = useState("");
	const ids = useId();

	useEffect(() => {
		if (!open) return;
		setAdding(false);
		setSelected([]);
		setSearch("");
	}, [open]);

	const lessonsKey = teacherKey("teacher-lessons", teacherId);
	const chooseKey = teacherKey("teacher-lessons-choose", teacherId, schoolId);

	const lessons = useQuery({
		queryKey: lessonsKey,
		queryFn: () => teacherApi.teacher.lessons({ teacher_id: teacherId }),
		enabled: open,
	});
	const choose = useQuery({
		queryKey: chooseKey,
		queryFn: () =>
			teacherApi.teacher.chooseLessons({
				teacher_id: teacherId,
				school_id: schoolId,
			}),
		enabled: open && adding,
	});

	const current = listOf<Row>(lessons.data);
	const choices = useMemo(() => {
		const q = search.trim().toLowerCase();
		return listOf<Row>(choose.data)
			.map((r) => ({
				id: num(r, "id", "lesson_id", "lessonid"),
				name: str(r, "lesson_name", "lessonname", "title", "name"),
				code: str(r, "lessoncode", "lesson_code"),
			}))
			.filter((r) => r.id && (!q || r.name.toLowerCase().includes(q)));
	}, [choose.data, search]);

	const remove = useTeacherMutation(
		(idd: number) => teacherApi.teacher.removeLesson({ idd }),
		{ success: "Хичээл хасагдлаа", invalidate: [lessonsKey, chooseKey] },
	);
	const save = useTeacherMutation(
		(lesson_ids: number[]) =>
			teacherApi.teacher.saveLessons({
				teacher_id: teacherId,
				lesson_ids,
				user_id: userId,
			}),
		{
			success: "Хичээл нэмэгдлээ",
			invalidate: [lessonsKey, chooseKey],
			onSuccess: () => {
				setAdding(false);
				setSelected([]);
			},
		},
	);

	return (
		<Sheet open={open} onOpenChange={(o) => !o && onClose()}>
			<SheetContent className="w-full gap-0 sm:max-w-md">
				<SheetHeader className="border-b border-border p-5 pr-12">
					<SheetTitle className="text-lg font-black">
						Заадаг хичээлүүд
					</SheetTitle>
					<SheetDescription className="font-semibold">
						{teacher?.name}
					</SheetDescription>
				</SheetHeader>

				<div className="min-h-0 flex-1 overflow-y-auto p-5">
					{adding ? (
						<div className="grid gap-3">
							<SearchInput
								value={search}
								onChange={setSearch}
								placeholder="Хичээл хайх"
								className="sm:w-full"
							/>
							{choose.isLoading ? (
								<ListSkeleton />
							) : choices.length === 0 ? (
								<EmptyState text="Нэмэх хичээл алга" />
							) : (
								<div className="grid gap-2">
									{choices.map((c) => (
										<CheckTile
											key={c.id}
											id={`${ids}-${c.id}`}
											label={c.code ? `${c.code} · ${c.name}` : c.name}
											checked={selected.includes(c.id)}
											onChange={(on) =>
												setSelected((s) =>
													on ? [...s, c.id] : s.filter((x) => x !== c.id),
												)
											}
										/>
									))}
								</div>
							)}
						</div>
					) : lessons.isLoading ? (
						<ListSkeleton />
					) : current.length === 0 ? (
						<EmptyState text="Хичээл холбоогүй байна" />
					) : (
						<ul className="grid gap-2">
							{current.map((r, i) => {
								const idd = num(r, "idd", "id");
								const name = str(r, "lesson_name", "lessonname", "title");
								return (
									<li
										key={idd || i}
										className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2"
									>
										<span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft/50 text-primary-soft-foreground">
											<BookOpen className="size-4" />
										</span>
										<span className="min-w-0 flex-1 truncate text-sm font-bold">
											{name}
										</span>
										<ConfirmDelete
											title={`"${name}" хичээлийг хасах уу?`}
											description="Багшаас энэ хичээлийг салгана."
											label="Хасах"
											pending={remove.isPending}
											onConfirm={() => remove.mutate(idd)}
										/>
									</li>
								);
							})}
						</ul>
					)}
				</div>

				<div className="flex flex-wrap justify-end gap-2 border-t border-border p-4">
					{adding ? (
						<>
							<Button variant="outline" onClick={() => setAdding(false)}>
								Буцах
							</Button>
							<Button
								disabled={selected.length === 0 || save.isPending}
								onClick={() => save.mutate(selected)}
							>
								{save.isPending && <Loader2 className="animate-spin" />}
								Нэмэх{selected.length ? ` (${selected.length})` : ""}
							</Button>
						</>
					) : (
						<Button onClick={() => setAdding(true)}>
							<Plus />
							Хичээл нэмэх
						</Button>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}

function ListSkeleton() {
	return (
		<div className="grid gap-2">
			{["a", "b", "c", "d"].map((k) => (
				<Skeleton key={k} className="h-12 rounded-2xl" />
			))}
		</div>
	);
}
