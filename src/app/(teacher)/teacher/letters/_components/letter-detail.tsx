"use client";

import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	BellRing,
	FileText,
	Loader2,
	Mail,
	Pencil,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import MathContent from "@/components/MathContent";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type Column,
	ConfirmDelete,
	DataTable,
	EmptyState,
	FilterBar,
	formatDateTime,
	PageHeader,
	Pagination,
	Panel,
	SearchInput,
	StatusPill,
} from "@/features/teacher/components";
import {
	itemOf,
	pagedOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import {
	bool,
	formatSize,
	lettersKey,
	num,
	pick,
	RECIPIENT_FILTERS,
	type Row,
	statusLabel,
	statusTone,
	str,
} from "../_lib/shared";
import { ReadProgress } from "./read-progress";

const PAGE_SIZE = 20;

function Stat({ label, value }: { label: string; value: number | string }) {
	return (
		<div className="rounded-2xl bg-muted/50 px-4 py-3">
			<p className="text-xs font-bold text-muted-foreground">{label}</p>
			<p className="text-2xl font-black tabular-nums">{value}</p>
		</div>
	);
}

export function LetterDetail({ id }: { id: number }) {
	const router = useRouter();
	const { userId, schoolId } = useTeacher();
	const [filter, setFilter] = useState(0);
	const [search, setSearch] = useState("");
	const [q, setQ] = useState("");
	const [page, setPage] = useState(1);

	useEffect(() => {
		const t = setTimeout(() => {
			setQ(search.trim());
			setPage(1);
		}, 350);
		return () => clearTimeout(t);
	}, [search]);

	const detailQ = useQuery({
		queryKey: lettersKey("get", id),
		queryFn: () => teacherApi.letterAdmin.get({ id }),
		enabled: id > 0,
	});
	const recQ = useQuery({
		queryKey: lettersKey("recipients", id, filter, q, page),
		queryFn: () =>
			teacherApi.letterAdmin.recipients({
				letter_id: id,
				filter,
				search: q || undefined,
				page,
				size: PAGE_SIZE,
			}),
		enabled: id > 0,
	});

	const d = itemOf<Row>(detailQ.data);
	const letter = (d?.letter as Row | undefined) ?? d;
	const targets = (d?.targets as Row[] | undefined) ?? [];
	const files = (d?.files as Row[] | undefined) ?? [];
	const statsRaw = d?.stats;
	const stats = (Array.isArray(statsRaw) ? statsRaw[0] : statsRaw) as
		| Row
		| undefined;
	const total = num(stats, "total", "total_count", "total_cnt");
	const read = num(stats, "read", "read_count", "read_cnt");
	const ack = num(stats, "ack", "ack_count", "ack_cnt");
	const unread =
		num(stats, "unread", "unread_count", "unread_cnt") ||
		Math.max(0, total - read);
	const status = num(letter, "status");
	const requireAck = bool(letter, "require_ack");

	const rec = pagedOf<Row>(recQ.data);

	const remind = useTeacherMutation(
		() => teacherApi.letterAdmin.remind({ letter_id: id, user_id: userId }),
		{ success: "Уншаагүй хүлээн авагчдад сануулга илгээлээ" },
	);
	const remove = useTeacherMutation(
		() =>
			teacherApi.letterAdmin.remove({
				id,
				school_id: schoolId,
				user_id: userId,
			}),
		{
			success: "Захидал устгагдлаа",
			invalidate: [lettersKey("list")],
			onSuccess: () => router.push("/teacher/letters"),
		},
	);

	const columns: Column<Row>[] = useMemo(
		() => [
			{
				key: "name",
				header: "Хүлээн авагч",
				cell: (r) => (
					<div className="grid min-w-0">
						<span className="truncate font-bold">
							{str(r, "full_name", "fullname", "user_name", "name") ||
								[str(r, "lastname"), str(r, "firstname")]
									.filter(Boolean)
									.join(" ")}
						</span>
						<span className="truncate text-xs font-semibold text-muted-foreground">
							{[str(r, "school_name", "sch_name"), str(r, "class_name")]
								.filter(Boolean)
								.join(" · ")}
						</span>
					</div>
				),
			},
			{
				key: "read",
				header: "Уншсан",
				className: "w-40",
				cell: (r) => {
					const rd = pick(r, "read_date");
					return rd ? (
						<span className="text-xs font-semibold tabular-nums">
							{formatDateTime(rd)}
						</span>
					) : (
						<StatusPill tone="sun">Уншаагүй</StatusPill>
					);
				},
			},
			{
				key: "ack",
				header: "Танилцсан",
				className: "hidden w-40 sm:table-cell",
				cell: (r) => {
					const ad = pick(r, "ack_date");
					return ad ? (
						<StatusPill tone="mint">{formatDateTime(ad)}</StatusPill>
					) : (
						<span className="text-xs text-muted-foreground">—</span>
					);
				},
			},
		],
		[],
	);

	if (detailQ.isLoading) {
		return (
			<div className="grid gap-4">
				<Skeleton className="h-14 rounded-2xl" />
				<Skeleton className="h-28 rounded-3xl" />
				<Skeleton className="h-80 rounded-3xl" />
			</div>
		);
	}
	if (!letter) {
		return (
			<Panel>
				<EmptyState text="Захидал олдсонгүй">
					<Button variant="outline" asChild>
						<Link href="/teacher/letters">Буцах</Link>
					</Button>
				</EmptyState>
			</Panel>
		);
	}

	return (
		<>
			<Link
				href="/teacher/letters"
				className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Захидлууд
			</Link>
			<PageHeader
				title={str(letter, "subject") || "Захидал"}
				description={[
					str(letter, "type_name"),
					formatDateTime(pick(letter, "send_date", "created_date")),
				]
					.filter(Boolean)
					.join(" · ")}
				icon={Mail}
				actions={
					<>
						{status !== 1 && (
							<Button variant="outline" asChild>
								<Link href={`/teacher/letters/${id}/edit`}>
									<Pencil />
									Засах
								</Link>
							</Button>
						)}
						{status === 1 && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button disabled={remind.isPending || unread === 0}>
										{remind.isPending ? (
											<Loader2 className="animate-spin" />
										) : (
											<BellRing />
										)}
										Уншаагүйд сануулах
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Сануулга илгээх үү?</AlertDialogTitle>
										<AlertDialogDescription>
											Захидлыг уншаагүй {unread} хүлээн авагчид дахин мэдэгдэл
											очно.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Болих</AlertDialogCancel>
										<AlertDialogAction onClick={() => remind.mutate(undefined)}>
											Илгээх
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
						<ConfirmDelete
							iconOnly={false}
							title="Захидлыг устгах уу?"
							onConfirm={() => remove.mutate(undefined)}
							pending={remove.isPending}
						/>
					</>
				}
			/>

			<div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
				<Stat label="Нийт хүлээн авагч" value={total} />
				<Stat label="Уншсан" value={read} />
				<Stat label="Уншаагүй" value={unread} />
				<Stat label="Танилцсан" value={requireAck ? ack : "—"} />
			</div>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
				<Panel
					title="Агуулга"
					actions={
						<div className="flex flex-wrap gap-1.5">
							<StatusPill tone={statusTone(status)}>
								{statusLabel(status)}
							</StatusPill>
							{num(letter, "priority") === 2 && (
								<StatusPill tone="coral">Яаралтай</StatusPill>
							)}
							{requireAck && <StatusPill tone="sky">Танилцах</StatusPill>}
						</div>
					}
				>
					<MathContent
						html={str(letter, "body")}
						className="text-sm leading-relaxed"
					/>
					{(str(letter, "sender_name") || str(letter, "sender_org")) && (
						<div className="mt-5 border-t border-border pt-3 text-sm">
							<p className="font-extrabold">{str(letter, "sender_name")}</p>
							<p className="text-xs font-semibold text-muted-foreground">
								{[str(letter, "sender_title"), str(letter, "sender_org")]
									.filter(Boolean)
									.join(", ")}
							</p>
						</div>
					)}
				</Panel>
				<div className="grid content-start gap-4">
					<Panel title="Явц">
						<ReadProgress read={read} total={total} />
						<dl className="mt-3 grid gap-1.5 text-xs font-semibold">
							<div className="flex justify-between gap-2">
								<dt className="text-muted-foreground">Илгээх</dt>
								<dd className="tabular-nums">
									{formatDateTime(pick(letter, "send_date")) || "—"}
								</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt className="text-muted-foreground">Дуусах</dt>
								<dd className="tabular-nums">
									{formatDateTime(pick(letter, "expire_date")) || "—"}
								</dd>
							</div>
						</dl>
					</Panel>
					{targets.length > 0 && (
						<Panel title="Хүлээн авагч бүлэг">
							<ul className="flex flex-wrap gap-1.5">
								{targets.map((t, i) => (
									<li
										// biome-ignore lint/suspicious/noArrayIndexKey: тогтмол жагсаалт
										key={i}
										className="rounded-full bg-primary-soft/60 px-2.5 py-1 text-xs font-bold text-primary-soft-foreground"
									>
										{str(t, "label", "target_label", "title") ||
											[
												str(t, "aimag_name"),
												str(t, "sym_name"),
												str(t, "school_name"),
												str(t, "class_name"),
											]
												.filter(Boolean)
												.join(" › ") ||
											"Бүгд"}
									</li>
								))}
							</ul>
						</Panel>
					)}
					{files.length > 0 && (
						<Panel title="Хавсралт">
							<ul className="grid gap-1.5">
								{files.map((f, i) => (
									<li
										// biome-ignore lint/suspicious/noArrayIndexKey: тогтмол жагсаалт
										key={i}
									>
										<a
											href={str(f, "file_url", "filename")}
											target="_blank"
											rel="noreferrer"
											className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-bold hover:bg-muted/50"
										>
											<FileText className="size-4 shrink-0 text-muted-foreground" />
											<span className="min-w-0 flex-1 truncate">
												{str(f, "uploaded") ||
													str(f, "filename").split("/").pop()}
											</span>
											<span className="text-xs text-muted-foreground">
												{formatSize(num(f, "file_size"))}
											</span>
										</a>
									</li>
								))}
							</ul>
						</Panel>
					)}
				</div>
			</div>

			<Panel title="Хүлээн авагчид" className="mt-4">
				<FilterBar>
					<Tabs
						value={String(filter)}
						onValueChange={(v) => {
							setFilter(Number(v));
							setPage(1);
						}}
						className="min-w-0"
					>
						<TabsList aria-label="Хүлээн авагч шүүх">
							{RECIPIENT_FILTERS.map((f) => (
								<TabsTrigger key={f.value} value={String(f.value)}>
									{f.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Нэр, сургуулиар хайх"
						className="sm:ml-auto"
					/>
				</FilterBar>
				<DataTable
					columns={columns}
					rows={rec.rows}
					rowKey={(r, i) => `${str(r, "user_id", "id")}-${i}`}
					isLoading={recQ.isLoading}
					emptyText="Хүлээн авагч олдсонгүй"
				/>
				<Pagination
					page={page}
					size={PAGE_SIZE}
					total={rec.total}
					onPageChange={setPage}
				/>
			</Panel>
		</>
	);
}
