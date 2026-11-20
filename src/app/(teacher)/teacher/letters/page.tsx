"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, Paperclip, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type Column,
	ConfirmDelete,
	DataTable,
	FilterBar,
	formatDateTime,
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

import { ReadProgress } from "./_components/read-progress";
import {
	LETTER_STATUS,
	lettersKey,
	num,
	pick,
	type Row,
	statusLabel,
	statusTone,
	str,
} from "./_lib/shared";

function useDebounced<T>(value: T, ms = 350) {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
}

export default function TeacherLettersPage() {
	const router = useRouter();
	const { userId, schoolId } = useTeacher();
	const [status, setStatus] = useState(-1);
	const [search, setSearch] = useState("");
	const q = useDebounced(search.trim());

	const { data, isLoading } = useQuery({
		queryKey: lettersKey("list", schoolId, status, q),
		queryFn: () =>
			teacherApi.letterAdmin.list({
				school_id: schoolId,
				status,
				search: q || undefined,
			}),
		enabled: !!schoolId,
	});
	const rows = useMemo(() => listOf<Row>(data), [data]);

	const remove = useTeacherMutation(
		(id: number) =>
			teacherApi.letterAdmin.remove({
				id,
				school_id: schoolId,
				user_id: userId,
			}),
		{ success: "Захидал устгагдлаа", invalidate: [lettersKey()] },
	);

	const columns: Column<Row>[] = [
		{
			key: "subject",
			header: "Захидал",
			cell: (r) => {
				const urgent = num(r, "priority") === 2;
				const files = num(r, "file_count", "file_cnt");
				return (
					<div className="grid min-w-0 gap-1">
						<span className="line-clamp-2 font-extrabold text-foreground">
							{str(r, "subject") || "(гарчиггүй)"}
						</span>
						<span className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted-foreground">
							{str(r, "type_name", "type_title") && (
								<span>{str(r, "type_name", "type_title")}</span>
							)}
							<span className="sm:hidden">
								<StatusPill tone={statusTone(num(r, "status"))}>
									{statusLabel(num(r, "status"))}
								</StatusPill>
							</span>
							{urgent && <StatusPill tone="coral">Яаралтай</StatusPill>}
							{files > 0 && (
								<span className="inline-flex items-center gap-0.5">
									<Paperclip className="size-3" />
									{files}
								</span>
							)}
							{str(r, "sender_name") && <span>· {str(r, "sender_name")}</span>}
						</span>
					</div>
				);
			},
		},
		{
			key: "status",
			header: "Төлөв",
			className: "hidden w-28 sm:table-cell",
			cell: (r) => {
				const s = num(r, "status");
				return <StatusPill tone={statusTone(s)}>{statusLabel(s)}</StatusPill>;
			},
		},
		{
			key: "date",
			header: "Огноо",
			className: "hidden w-40 md:table-cell",
			cell: (r) => (
				<span className="text-xs font-semibold text-muted-foreground tabular-nums">
					{formatDateTime(
						pick(r, "send_date", "created_date", "created_at", "cdate"),
					)}
				</span>
			),
		},
		{
			key: "read",
			header: "Уншсан",
			className: "hidden w-44 sm:table-cell",
			cell: (r) => (
				<ReadProgress
					read={num(r, "read_count", "read_cnt")}
					total={num(r, "total_count", "total_cnt", "recipient_count")}
				/>
			),
		},
		{
			key: "actions",
			header: "",
			className: "w-20 text-right sm:w-24",
			cell: (r) => (
				// biome-ignore lint/a11y/noStaticElementInteractions: мөрийн click-ийг зогсооно
				// biome-ignore lint/a11y/useKeyWithClickEvents: зөвхөн propagation зогсооно
				<div
					className="flex justify-end gap-1"
					onClick={(e) => e.stopPropagation()}
				>
					{num(r, "status") !== 1 && (
						<Button variant="ghost" size="icon-sm" aria-label="Засах" asChild>
							<Link href={`/teacher/letters/${num(r, "id")}/edit`}>
								<Pencil />
							</Link>
						</Button>
					)}
					<ConfirmDelete
						title={`"${str(r, "subject")}" захидлыг устгах уу?`}
						onConfirm={() => remove.mutate(num(r, "id"))}
						pending={remove.isPending}
					/>
				</div>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Захидал"
				description="Илгээсэн, ноорог, товлосон захидлууд"
				icon={Mail}
				actions={
					<Button asChild>
						<Link href="/teacher/letters/new">
							<Plus />
							Шинэ захидал
						</Link>
					</Button>
				}
			/>
			<Panel>
				<FilterBar>
					<Tabs
						value={String(status)}
						onValueChange={(v) => setStatus(Number(v))}
						className="min-w-0"
					>
						<TabsList aria-label="Төлөвөөр шүүх">
							{LETTER_STATUS.map((s) => (
								<TabsTrigger key={s.value} value={String(s.value)}>
									{s.label}
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
				<DataTable
					columns={columns}
					rows={rows}
					rowKey={(r, i) => num(r, "id") || i}
					isLoading={isLoading}
					emptyText="Захидал олдсонгүй"
					onRowClick={(r) => router.push(`/teacher/letters/${num(r, "id")}`)}
				/>
			</Panel>
		</>
	);
}
