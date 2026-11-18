"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	CloudDownload,
	Globe,
	Layers,
	Library,
	ListChecks,
	Lock,
	Pencil,
	Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ConfirmDelete,
	EmptyState,
	FilterBar,
	formatDateTime,
	OptionSelect,
	PageHeader,
	Pagination,
	Panel,
	SearchInput,
	StatusPill,
	toOptions,
} from "@/features/teacher/components";
import {
	listOf,
	pagedOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { CmsImportDialog } from "./_components/cms-import-dialog";
import { Cover, FolderDialog } from "./_components/folder-dialog";
import { type ElibRow, elibKeys, isColor, isOwner } from "./_components/shared";
import { useTopicTree } from "./_components/topic-picker";

const PAGE_SIZE = 12;

export default function TeacherElibPage() {
	const router = useRouter();
	const { userId } = useTeacher();
	const [classId, setClassId] = useState(0);
	const [lessonId, setLessonId] = useState(0);
	const [unitId, setUnitId] = useState(0);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [editing, setEditing] = useState<ElibRow | null>(null);
	const [importOpen, setImportOpen] = useState(false);
	const filter = useDeferredValue(search.trim());

	const classes = useQuery({
		queryKey: elibKeys.classes(userId),
		queryFn: () => teacherApi.elib.classes({ user_id: userId }),
		enabled: !!userId,
	});
	const lessons = useQuery({
		queryKey: elibKeys.lessons(userId, classId),
		queryFn: () =>
			teacherApi.elib.lessons({ user_id: userId, class_id: classId }),
		enabled: !!userId,
	});
	const units = useTopicTree(classId, lessonId);

	const params = {
		user_id: userId,
		class_id: classId || undefined,
		lesson_id: lessonId || undefined,
		ulesson_id: unitId || undefined,
		filter: filter || undefined,
		page,
		size: PAGE_SIZE,
	};
	const list = useQuery({
		queryKey: elibKeys.list(params),
		queryFn: () => teacherApi.elib.list(params),
		enabled: !!userId,
		placeholderData: keepPreviousData,
	});
	const paged = pagedOf<ElibRow>(list.data);

	const remove = useTeacherMutation(
		(id: number) => teacherApi.elib.remove({ user_id: userId, elib_id: id }),
		{ success: "Хавтас устгагдлаа", invalidate: [elibKeys.all] },
	);

	const defaults = { classId, lessonId };

	return (
		<>
			<PageHeader
				title="Цахим хичээл"
				description="Сэдэв бүрийн хавтас, контент"
				icon={Library}
				actions={
					<>
						<Button variant="outline" onClick={() => setImportOpen(true)}>
							<CloudDownload />
							CMS-ээс импорт
						</Button>
						<Button onClick={() => setEditing({ id: 0 })}>
							<Plus />
							Шинэ хавтас
						</Button>
					</>
				}
			/>
			<Panel>
				<FilterBar>
					<OptionSelect
						options={toOptions(listOf(classes.data))}
						value={classId}
						allLabel="Бүх анги"
						placeholder="Анги"
						className="sm:w-40"
						onChange={(v) => {
							setClassId(Number(v));
							setLessonId(0);
							setUnitId(0);
							setPage(1);
						}}
					/>
					<OptionSelect
						options={toOptions(listOf(lessons.data))}
						value={lessonId}
						allLabel="Бүх хичээл"
						placeholder="Хичээл"
						onChange={(v) => {
							setLessonId(Number(v));
							setUnitId(0);
							setPage(1);
						}}
					/>
					<OptionSelect
						options={units.map((u) => ({
							value: u.ulesson_id,
							label: u.ulesson_name,
						}))}
						value={unitId}
						allLabel="Бүх нэгж"
						placeholder="Нэгж хичээл"
						disabled={!lessonId}
						onChange={(v) => {
							setUnitId(Number(v));
							setPage(1);
						}}
					/>
					<SearchInput
						value={search}
						onChange={(v) => {
							setSearch(v);
							setPage(1);
						}}
						placeholder="Сэдвээр хайх"
						className="sm:ml-auto"
					/>
				</FilterBar>

				{list.isLoading ? (
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{["a", "b", "c", "d"].map((k) => (
							<Skeleton key={k} className="h-56 rounded-3xl" />
						))}
					</div>
				) : paged.rows.length === 0 ? (
					<EmptyState text="Хавтас олдсонгүй">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEditing({ id: 0 })}
						>
							<Plus />
							Шинэ хавтас
						</Button>
					</EmptyState>
				) : (
					<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{paged.rows.map((r) => (
							<li key={r.id} className="min-w-0">
								<FolderCard
									row={r}
									onEdit={() => setEditing(r)}
									onDelete={() => remove.mutate(r.id)}
									deleting={remove.isPending}
								/>
							</li>
						))}
					</ul>
				)}
				<Pagination
					page={page}
					size={PAGE_SIZE}
					total={paged.total}
					onPageChange={setPage}
				/>
			</Panel>

			<FolderDialog
				folder={editing}
				defaults={defaults}
				onClose={() => setEditing(null)}
				onSaved={(id) => {
					if (!editing?.id) router.push(`/teacher/elib/${id}`);
				}}
			/>
			<CmsImportDialog
				open={importOpen}
				onClose={() => setImportOpen(false)}
				defaults={defaults}
			/>
		</>
	);
}

function FolderCard({
	row,
	onEdit,
	onDelete,
	deleting,
}: {
	row: ElibRow;
	onEdit: () => void;
	onDelete: () => void;
	deleting: boolean;
}) {
	const owner = isOwner(row);
	const title = row.topic_name || row.l_name || "Нэргүй хавтас";
	const href = `/teacher/elib/${row.id}`;
	return (
		<article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-primary/30">
			<Cover image={row.l_image} className="h-24">
				<div className="absolute top-2.5 left-2.5 flex gap-1.5">
					{Number(row.l_flag) === 1 ? (
						<span className="inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs font-bold text-foreground">
							<Globe className="size-3" />
							Нээлттэй
						</span>
					) : (
						<span className="inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs font-bold text-muted-foreground">
							<Lock className="size-3" />
							Хаалттай
						</span>
					)}
				</div>
				{isColor(row.l_image) && (
					<Library
						aria-hidden
						className="absolute right-3 bottom-2 size-10 text-foreground/10"
					/>
				)}
			</Cover>
			<div className="flex flex-1 flex-col gap-2 p-4">
				<Link
					href={href}
					className="line-clamp-2 text-base leading-snug font-black tracking-tight hover:text-primary focus-visible:underline focus-visible:outline-none"
				>
					{title}
				</Link>
				<p className="truncate text-xs font-bold text-muted-foreground">
					{[row.class_name, row.lesson_name].filter(Boolean).join(" · ")}
				</p>
				{row.l_desc && (
					<p className="line-clamp-2 text-sm font-medium text-muted-foreground">
						{row.l_desc}
					</p>
				)}
				<div className="mt-auto flex flex-wrap gap-1.5 pt-1">
					<StatusPill tone="sky">
						<Layers className="mr-1 size-3" />
						{Number(row.unit_cnt ?? 0)} контент
					</StatusPill>
					{Number(row.test_cnt) > 0 && (
						<StatusPill tone="sun">
							<ListChecks className="mr-1 size-3" />
							{row.test_cnt} тест
						</StatusPill>
					)}
					{!owner && <StatusPill>Зөвхөн унших</StatusPill>}
				</div>
			</div>
			<div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
				<span className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
					{owner
						? formatDateTime(row.l_date).slice(0, 10)
						: row.teach_name || formatDateTime(row.l_date).slice(0, 10)}
				</span>
				{owner && (
					<div className="flex gap-0.5">
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Хавтас засах"
							onClick={onEdit}
						>
							<Pencil />
						</Button>
						<ConfirmDelete
							title={`"${title}" хавтсыг устгах уу?`}
							description="Сурагч үзсэн эсвэл тест өгсөн бол устгах боломжгүй."
							onConfirm={onDelete}
							pending={deleting}
						/>
					</div>
				)}
			</div>
		</article>
	);
}
