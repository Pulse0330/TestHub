"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, Loader2, Pencil } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type Column,
	DataTable,
	formatDateTime,
	Pagination,
	SearchInput,
	StatusPill,
} from "@/features/teacher/components";
import { teacherApi } from "@/lib/api";
import { RecordingTab } from "./recording-tab";
import { copyText, type LiveInfo, liveKeys } from "./shared";

export function LiveDetail({
	liveId,
	onClose,
	onEdit,
}: {
	liveId: number | null;
	onClose: () => void;
	onEdit: (id: number) => void;
}) {
	const info = useQuery({
		queryKey: liveKeys.info(liveId ?? 0),
		queryFn: () => teacherApi.live.info({ live_id: liveId ?? 0 }),
		enabled: !!liveId,
	});
	const first = info.data?.RetDataFirst as LiveInfo | LiveInfo[] | undefined;
	const data = Array.isArray(first) ? first[0] : first;
	const second = info.data?.RetDataSecond;
	const classes = Array.isArray(second)
		? (second as Record<string, unknown>[])
		: [];
	const title = data?.live_title || data?.lesson_name || "Live хичээл";

	return (
		<Sheet open={liveId !== null} onOpenChange={(o) => !o && onClose()}>
			<SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
				<SheetHeader className="border-b border-border p-5 pr-12">
					<SheetTitle className="text-lg font-black">{title}</SheetTitle>
					<SheetDescription className="font-semibold">
						{[data?.lesson_name, data?.typename, data?.teach_name]
							.filter(Boolean)
							.join(" · ") || "Дэлгэрэнгүй мэдээлэл"}
					</SheetDescription>
				</SheetHeader>

				{liveId ? (
					<Tabs defaultValue="info" className="p-5">
						<TabsList>
							<TabsTrigger value="info">Мэдээлэл</TabsTrigger>
							<TabsTrigger value="students">Суралцагчид</TabsTrigger>
							<TabsTrigger value="record">Бичлэг</TabsTrigger>
						</TabsList>
						<TabsContent value="info">
							{info.isLoading || !data ? (
								<div className="space-y-2">
									{["a", "b", "c", "d"].map((k) => (
										<Skeleton key={k} className="h-12 rounded-xl" />
									))}
								</div>
							) : (
								<InfoTab
									data={data}
									classes={classes}
									onEdit={() => onEdit(liveId)}
								/>
							)}
						</TabsContent>
						<TabsContent value="students">
							<StudentsTab liveId={liveId} />
						</TabsContent>
						<TabsContent value="record">
							<RecordingTab liveId={liveId} />
						</TabsContent>
					</Tabs>
				) : null}
			</SheetContent>
		</Sheet>
	);
}

function InfoTab({
	data,
	classes,
	onEdit,
}: {
	data: LiveInfo;
	classes: Record<string, unknown>[];
	onEdit: () => void;
}) {
	const isLive = Number(data.optype) === 1;
	return (
		<div className="grid gap-4">
			<div className="flex flex-wrap items-center gap-2">
				{isLive ? (
					<StatusPill tone="mint">Явагдаж байна</StatusPill>
				) : (
					<StatusPill>Идэвхгүй</StatusPill>
				)}
				{Number(data.ispay) === 1 && (
					<StatusPill tone="sun">
						Төлбөртэй · {Number(data.amount).toLocaleString("mn-MN")}₮
					</StatusPill>
				)}
				{data.stu_live !== undefined && (
					<StatusPill tone="sky">
						{data.stu_live} суралцагч холбогдсон
					</StatusPill>
				)}
			</div>

			<div className="flex flex-wrap gap-2">
				{isLive && data.url && (
					<Button asChild>
						<a href={data.url} target="_blank" rel="noreferrer noopener">
							<ExternalLink />
							Холбогдох
						</a>
					</Button>
				)}
				<Button variant="outline" onClick={onEdit}>
					<Pencil />
					Засах
				</Button>
			</div>

			<dl className="divide-y divide-border rounded-2xl border border-border">
				<InfoRow label="Эхлэх" value={formatDateTime(data.sdate)} />
				<InfoRow label="Дуусах" value={formatDateTime(data.edate)} />
				{data.contime ? (
					<InfoRow label="Хугацаа" value={`${data.contime} минут`} />
				) : null}
				<InfoRow label="Холбоос" value={data.url} copy="Холбоос" />
				<InfoRow label="Meeting ID" value={data.title} copy="Meeting ID" />
				<InfoRow label="Нууц үг" value={data.pass} copy="Нууц үг" />
				{data.descr ? <InfoRow label="Тайлбар" value={data.descr} /> : null}
				{data.help ? <InfoRow label="Заавар" value={data.help} /> : null}
			</dl>

			{classes.length > 0 && (
				<div>
					<h3 className="mb-2 text-sm font-black">Хамрах ангиуд</h3>
					<div className="flex flex-wrap gap-1.5">
						{classes.map((c, i) => (
							<StatusPill key={String(c.id ?? c.class_id ?? i)}>
								{String(c.class_name ?? c.title ?? c.name ?? "")}
							</StatusPill>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function InfoRow({
	label,
	value,
	copy,
}: {
	label: string;
	value?: string;
	copy?: string;
}) {
	return (
		<div className="flex items-center gap-3 px-3.5 py-2.5">
			<dt className="w-24 shrink-0 text-xs font-bold text-muted-foreground">
				{label}
			</dt>
			<dd className="min-w-0 flex-1 text-sm font-semibold break-all">
				{value || <span className="text-muted-foreground">—</span>}
			</dd>
			{copy && value ? (
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label={`${copy} хуулах`}
					onClick={() => copyText(value, copy)}
				>
					<Copy />
				</Button>
			) : null}
		</div>
	);
}

interface StudentRow {
	id: number;
	student_id: number;
	stu_name?: string;
	avatar?: string;
	regdate?: string;
	descr?: string;
}

interface StudentsData {
	lesson_name?: string;
	cnt?: number;
	total?: number;
	rows?: StudentRow[];
}

const STU_SIZE = 10;

function StudentsTab({ liveId }: { liveId: number }) {
	const [filter, setFilter] = useState("");
	const [page, setPage] = useState(1);
	const q = useDeferredValue(filter.trim());
	const params = { filter: q, page, size: STU_SIZE };
	const res = useQuery({
		queryKey: liveKeys.students(liveId, params),
		queryFn: () => teacherApi.live.students({ live_id: liveId, ...params }),
		placeholderData: keepPreviousData,
	});
	const d = (res.data?.RetData ?? {}) as StudentsData;
	const rows = d.rows ?? [];

	const columns: Column<StudentRow>[] = [
		{
			key: "name",
			header: "Суралцагч",
			cell: (r) => (
				<div className="flex items-center gap-2.5">
					<span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-xs font-black text-primary-soft-foreground">
						{r.avatar ? (
							// biome-ignore lint/performance/noImgElement: гадны зураг
							<img src={r.avatar} alt="" className="size-full object-cover" />
						) : (
							(r.stu_name ?? "?").slice(0, 1)
						)}
					</span>
					<span className="font-bold">{r.stu_name}</span>
				</div>
			),
		},
		{
			key: "date",
			header: "Холбогдсон",
			className: "whitespace-nowrap tabular-nums",
			cell: (r) => formatDateTime(r.regdate),
		},
		{
			key: "descr",
			header: "Тайлбар",
			cell: (r) => (
				<span className="text-muted-foreground">{r.descr || "—"}</span>
			),
		},
	];

	return (
		<div className="grid gap-3">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm font-bold text-muted-foreground">
					{d.lesson_name ? `${d.lesson_name} · ` : ""}
					<span className="tabular-nums">{d.cnt ?? d.total ?? 0}</span>{" "}
					суралцагч
				</p>
				<SearchInput
					value={filter}
					onChange={(v) => {
						setFilter(v);
						setPage(1);
					}}
					placeholder="Нэрээр хайх"
					className="sm:w-52"
				/>
			</div>
			<div className="relative">
				{res.isFetching && !res.isLoading && (
					<Loader2 className="absolute -top-7 right-0 size-4 animate-spin text-muted-foreground" />
				)}
				<DataTable
					columns={columns}
					rows={rows}
					rowKey={(r) => r.id ?? r.student_id}
					isLoading={res.isLoading}
					emptyText="Холбогдсон суралцагч алга"
				/>
			</div>
			<Pagination
				page={page}
				size={STU_SIZE}
				total={Number(d.total ?? 0)}
				onPageChange={setPage}
			/>
		</div>
	);
}
