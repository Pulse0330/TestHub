"use client";

import { useQuery } from "@tanstack/react-query";
import {
	CalendarDays,
	Eye,
	Image as ImageIcon,
	MousePointerClick,
	Pencil,
	Plus,
	Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ConfirmDelete,
	EmptyState,
	FilterBar,
	OptionSelect,
	PageHeader,
	Panel,
	SearchInput,
	StatusPill,
} from "@/features/teacher/components";
import {
	listOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { BannerDialog } from "./_components/banner-dialog";
import {
	BANNER_TYPES,
	bannersKey,
	FLAGS,
	isVideo,
	num,
	type Row,
	str,
	toDateInput,
} from "./_lib/shared";

export default function TeacherBannersPage() {
	const { userId, schoolId } = useTeacher();
	const [typeId, setTypeId] = useState("0");
	const [flag, setFlag] = useState(-1);
	const [search, setSearch] = useState("");
	const [q, setQ] = useState("");
	const [editing, setEditing] = useState<number | null>(null);

	useEffect(() => {
		const t = setTimeout(() => setQ(search.trim()), 350);
		return () => clearTimeout(t);
	}, [search]);

	const typesQ = useQuery({
		queryKey: bannersKey("types"),
		queryFn: () => teacherApi.banner.types(),
	});
	const typeOptions = useMemo(() => {
		const rows = listOf<Row>(typesQ.data)
			.map((r) => ({
				value: num(r, "id", "type_id"),
				label: str(r, "title", "type_name", "name"),
			}))
			.filter((o) => o.value > 0 && o.label);
		return rows.length ? rows : BANNER_TYPES;
	}, [typesQ.data]);
	const typeName = (id: number) =>
		typeOptions.find((t) => t.value === id)?.label ?? "";

	const { data, isLoading } = useQuery({
		queryKey: bannersKey("list", schoolId, typeId, flag, q),
		queryFn: () =>
			teacherApi.banner.list({
				school_id: schoolId,
				type_id: Number(typeId),
				flag,
				search: q || undefined,
			}),
		enabled: !!schoolId,
	});
	const rows = useMemo(() => listOf<Row>(data), [data]);

	const remove = useTeacherMutation(
		(id: number) => teacherApi.banner.remove({ id, user_id: userId }),
		{ success: "Баннер устгагдлаа", invalidate: [bannersKey("list")] },
	);

	return (
		<>
			<PageHeader
				title="Баннер"
				description="Апп, вэбд харагдах сурталчилгаа"
				icon={ImageIcon}
				actions={
					<Button onClick={() => setEditing(0)}>
						<Plus />
						Баннер нэмэх
					</Button>
				}
			/>
			<Panel>
				<FilterBar>
					<OptionSelect
						options={typeOptions}
						value={typeId}
						onChange={setTypeId}
						allLabel="Бүх төрөл"
						className="sm:w-44"
					/>
					<Tabs value={String(flag)} onValueChange={(v) => setFlag(Number(v))}>
						<TabsList aria-label="Төлөвөөр шүүх">
							{FLAGS.map((f) => (
								<TabsTrigger key={f.value} value={String(f.value)}>
									{f.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Гарчгаар хайх"
						className="sm:ml-auto"
					/>
				</FilterBar>

				{isLoading ? (
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{["a", "b", "c"].map((k) => (
							<Skeleton key={k} className="h-72 rounded-2xl" />
						))}
					</div>
				) : rows.length === 0 ? (
					<EmptyState text="Баннер олдсонгүй">
						<Button variant="outline" onClick={() => setEditing(0)}>
							<Plus />
							Баннер нэмэх
						</Button>
					</EmptyState>
				) : (
					<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{rows.map((r) => (
							<BannerCard
								key={num(r, "id")}
								row={r}
								typeName={typeName(num(r, "type_id"))}
								onEdit={() => setEditing(num(r, "id"))}
								onDelete={() => remove.mutate(num(r, "id"))}
								deleting={remove.isPending}
							/>
						))}
					</ul>
				)}
			</Panel>

			<BannerDialog
				id={editing}
				onClose={() => setEditing(null)}
				typeOptions={typeOptions}
			/>
		</>
	);
}

function BannerCard({
	row,
	typeName,
	onEdit,
	onDelete,
	deleting,
}: {
	row: Row;
	typeName: string;
	onEdit: () => void;
	onDelete: () => void;
	deleting: boolean;
}) {
	const src = str(row, "file_url", "filename");
	const video = isVideo(str(row, "file_ext") || src, num(row, "file_type"));
	const views = num(row, "view_cnt");
	const clicks = num(row, "click_cnt");
	const ctr = views ? ((clicks / views) * 100).toFixed(1) : "0";
	const active = num(row, "flag") === 1;
	const [broken, setBroken] = useState(false);
	const start = toDateInput(row.start_date);
	const end = toDateInput(row.end_date);
	return (
		<li className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
			<div className="relative aspect-video bg-muted">
				{src && !broken ? (
					video ? (
						<video
							src={src}
							onError={() => setBroken(true)}
							className="size-full object-cover"
							muted
							preload="metadata"
						/>
					) : (
						// biome-ignore lint/performance/noImgElement: гадны URL
						<img
							src={src}
							onError={() => setBroken(true)}
							alt={str(row, "title")}
							loading="lazy"
							className="size-full object-cover"
						/>
					)
				) : (
					<div className="flex size-full items-center justify-center text-muted-foreground">
						<ImageIcon className="size-8" />
					</div>
				)}
				<div className="absolute top-2 left-2 flex gap-1.5">
					{typeName && (
						<span className="rounded-full bg-card/90 px-2.5 py-0.5 text-xs font-bold text-foreground">
							{typeName}
						</span>
					)}
					{video && (
						<span className="flex items-center rounded-full bg-card/90 px-2 py-0.5 text-foreground">
							<Video className="size-3.5" aria-label="Видео" />
						</span>
					)}
				</div>
			</div>
			<div className="flex flex-1 flex-col gap-3 p-4">
				<div className="flex items-start justify-between gap-2">
					<h3 className="line-clamp-2 font-extrabold">
						{str(row, "title") || "(гарчиггүй)"}
					</h3>
					<StatusPill tone={active ? "mint" : "muted"}>
						{active ? "Идэвхтэй" : "Идэвхгүй"}
					</StatusPill>
				</div>
				{(start || end) && (
					<p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground tabular-nums">
						<CalendarDays className="size-3.5" />
						{start || "…"} — {end || "…"}
					</p>
				)}
				<dl className="mt-auto grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-2.5 text-center">
					<div>
						<dt className="flex items-center justify-center gap-1 text-[11px] font-bold text-muted-foreground">
							<Eye className="size-3" />
							Үзсэн
						</dt>
						<dd className="font-black tabular-nums">{views}</dd>
					</div>
					<div>
						<dt className="flex items-center justify-center gap-1 text-[11px] font-bold text-muted-foreground">
							<MousePointerClick className="size-3" />
							Дарсан
						</dt>
						<dd className="font-black tabular-nums">{clicks}</dd>
					</div>
					<div>
						<dt className="text-[11px] font-bold text-muted-foreground">CTR</dt>
						<dd className="font-black tabular-nums">{ctr}%</dd>
					</div>
				</dl>
				<div className="flex justify-end gap-1">
					<Button variant="ghost" size="sm" onClick={onEdit}>
						<Pencil />
						Засах
					</Button>
					<ConfirmDelete
						title={`"${str(row, "title")}" баннерыг устгах уу?`}
						onConfirm={onDelete}
						pending={deleting}
					/>
				</div>
			</div>
		</li>
	);
}
