"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarClock, Film, Pencil, Plus, Radio, Video } from "lucide-react";
import { useState } from "react";
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
	StatusPill,
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
import { LiveDetail } from "./_components/live-detail";
import { LiveForm } from "./_components/live-form";
import { type LiveRow, liveKeys, liveState } from "./_components/shared";

const PAGE_SIZE = 8;

export default function TeacherLivePage() {
	const { userId, isManager } = useTeacher();
	const [teacherId, setTeacherId] = useState(0);
	const [lessonId, setLessonId] = useState(0);
	const [ltype, setLtype] = useState(0);
	const [page, setPage] = useState(1);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [detailId, setDetailId] = useState<number | null>(null);

	const teachers = useQuery({
		queryKey: teacherKey("live", "teachers", userId),
		queryFn: () => teacherApi.live.teachers({ user_id: userId }),
		enabled: !!userId && isManager,
	});
	const lessons = useQuery({
		queryKey: teacherKey("live", "lessons", userId, teacherId),
		queryFn: () =>
			teacherApi.live.lessons({
				user_id: userId,
				teacher_id: teacherId || undefined,
			}),
		enabled: !!userId,
	});
	const types = useQuery({
		queryKey: teacherKey("live", "types"),
		queryFn: () => teacherApi.live.types(),
		staleTime: Number.POSITIVE_INFINITY,
	});

	const params = {
		user_id: userId,
		teacher_id: teacherId || undefined,
		lesson_id: lessonId || undefined,
		ltype: ltype || undefined,
		page,
		size: PAGE_SIZE,
	};
	const list = useQuery({
		queryKey: liveKeys.list(params),
		queryFn: () => teacherApi.live.list(params),
		enabled: !!userId,
		placeholderData: keepPreviousData,
	});
	const paged = pagedOf<LiveRow>(list.data);

	const remove = useTeacherMutation(
		(id: number) => teacherApi.live.remove({ user_id: userId, live_id: id }),
		{ success: "Live хичээл устгагдлаа", invalidate: [liveKeys.all] },
	);

	const lessonOptions = toOptions(listOf(lessons.data));
	const typeOptions = toOptions(listOf(types.data));
	const teacherOptions = toOptions(
		listOf<{ teacher_id: number; teach_name: string }>(teachers.data),
		"teacher_id",
		"teach_name",
	);

	return (
		<>
			<PageHeader
				title="Live хичээл"
				description="Zoom, Meet хичээл болон бичлэг"
				icon={Video}
				actions={
					<Button onClick={() => setEditingId(0)}>
						<Plus />
						Live хичээл нэмэх
					</Button>
				}
			/>
			<Panel>
				<FilterBar>
					{isManager && (
						<OptionSelect
							options={teacherOptions}
							value={teacherId}
							allLabel="Бүх багш"
							placeholder="Багш"
							onChange={(v) => {
								setTeacherId(Number(v));
								setLessonId(0);
								setPage(1);
							}}
						/>
					)}
					<OptionSelect
						options={lessonOptions}
						value={lessonId}
						allLabel="Бүх хичээл"
						placeholder="Хичээл"
						onChange={(v) => {
							setLessonId(Number(v));
							setPage(1);
						}}
					/>
					<OptionSelect
						options={typeOptions}
						value={ltype}
						allLabel="Бүх төрөл"
						placeholder="Төрөл"
						className="sm:w-44"
						onChange={(v) => {
							setLtype(Number(v));
							setPage(1);
						}}
					/>
				</FilterBar>

				{list.isLoading ? (
					<div className="grid gap-3 md:grid-cols-2">
						{["a", "b", "c", "d"].map((k) => (
							<Skeleton key={k} className="h-40 rounded-3xl" />
						))}
					</div>
				) : paged.rows.length === 0 ? (
					<EmptyState text="Live хичээл бүртгэгдээгүй байна">
						<Button variant="outline" size="sm" onClick={() => setEditingId(0)}>
							<Plus />
							Шинээр нэмэх
						</Button>
					</EmptyState>
				) : (
					<ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
						{paged.rows.map((row) => (
							<li key={row.id} className="min-w-0">
								<LiveCard
									row={row}
									onOpen={() => setDetailId(row.id)}
									onEdit={() => setEditingId(row.id)}
									onDelete={() => remove.mutate(row.id)}
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

			<LiveForm
				liveId={editingId}
				onClose={() => setEditingId(null)}
				typeOptions={typeOptions}
			/>
			<LiveDetail
				liveId={detailId}
				onClose={() => setDetailId(null)}
				onEdit={(id) => {
					setDetailId(null);
					setEditingId(id);
				}}
			/>
		</>
	);
}

function LiveCard({
	row,
	onOpen,
	onEdit,
	onDelete,
	deleting,
}: {
	row: LiveRow;
	onOpen: () => void;
	onEdit: () => void;
	onDelete: () => void;
	deleting: boolean;
}) {
	const state = liveState(row);
	const title = row.live_title || row.lesson_name || "Live хичээл";
	return (
		<article className="flex h-full flex-col gap-3 rounded-3xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
			<div className="flex items-start gap-3">
				<span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-muted-foreground">
					{row.logo ? (
						// biome-ignore lint/performance/noImgElement: гадны лого
						<img src={row.logo} alt="" className="size-7 object-contain" />
					) : (
						<Radio className="size-5" />
					)}
				</span>
				<div className="min-w-0 flex-1">
					<button
						type="button"
						onClick={onOpen}
						className="block max-w-full truncate text-left text-base font-black tracking-tight hover:text-primary focus-visible:underline focus-visible:outline-none"
					>
						{title}
					</button>
					<p className="truncate text-sm font-semibold text-muted-foreground">
						{[row.lesson_name !== title && row.lesson_name, row.typename]
							.filter(Boolean)
							.join(" · ")}
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-1.5">
				{state === "live" && <StatusPill tone="mint">Явагдаж байна</StatusPill>}
				{state === "upcoming" && <StatusPill tone="sky">Удахгүй</StatusPill>}
				{state === "ended" && <StatusPill>Дууссан</StatusPill>}
				{Number(row.live_file_id) > 0 && (
					<StatusPill tone="sun">
						<Film className="mr-1 size-3" />
						Бичлэгтэй
					</StatusPill>
				)}
			</div>

			<p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground tabular-nums">
				<CalendarClock className="size-4 shrink-0" />
				<span>
					{formatDateTime(row.sdate)}
					{row.edate ? ` – ${formatDateTime(row.edate).slice(11)}` : ""}
				</span>
			</p>

			<div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
				<Button variant="outline" size="sm" onClick={onOpen}>
					Дэлгэрэнгүй
				</Button>
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Засах"
						onClick={onEdit}
					>
						<Pencil />
					</Button>
					<ConfirmDelete
						title={`"${title}" хичээлийг устгах уу?`}
						description="Суралцагч холбогдсон бол устгах боломжгүй."
						onConfirm={onDelete}
						pending={deleting}
					/>
				</div>
			</div>
		</article>
	);
}
