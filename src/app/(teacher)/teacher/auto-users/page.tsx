"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, Loader2, Printer, UserPlus } from "lucide-react";
import { useId, useState } from "react";
import {
	num,
	type Row,
	str,
	today,
} from "@/app/(teacher)/teacher/teachers/_components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type Column,
	DataTable,
	EmptyState,
	Field,
	OptionSelect,
	PageHeader,
	Panel,
	toOptions,
} from "@/features/teacher/components";
import {
	itemOf,
	listOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";

const DEFAULT_PASSWORD = "123";

// Хэвлэхэд зөвхөн #autouser-print хэсэг харагдана
const PRINT_CSS = `
@media print {
	@page { margin: 12mm; }
	body * { visibility: hidden !important; transition: none !important; }
	#autouser-print, #autouser-print * { visibility: visible !important; }
	#autouser-print {
		position: absolute; left: 0; top: 0; width: 100%;
		border: 0 !important; padding: 0 !important; background: #fff !important; color: #000 !important;
	}
	#autouser-print .print-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
	#autouser-print .print-card { break-inside: avoid; border-color: #999 !important; background: #fff !important; }
}
`;

type CreatedRow = Row;

export default function TeacherAutoUsersPage() {
	const [tab, setTab] = useState("create");
	const [listParams, setListParams] = useState<{
		aimag_id: string;
		school_db: string;
		date: string;
	} | null>(null);

	return (
		<>
			<style>{PRINT_CSS}</style>
			<PageHeader
				title="Эрх үүсгэх"
				description="Хэрэглэгчийн нэвтрэх эрхийг олноор үүсгэх, хэвлэх"
				icon={UserPlus}
			/>
			<Tabs value={tab} onValueChange={setTab} className="gap-4">
				<TabsList className="print:hidden">
					<TabsTrigger value="create">Эрх үүсгэх</TabsTrigger>
					<TabsTrigger value="list">Жагсаалт, хэвлэх</TabsTrigger>
				</TabsList>
				<TabsContent value="create">
					<CreatePanel
						onShowList={(p) => {
							setListParams(p);
							setTab("list");
						}}
					/>
				</TabsContent>
				<TabsContent value="list">
					<ListPanel initial={listParams} key={JSON.stringify(listParams)} />
				</TabsContent>
			</Tabs>
		</>
	);
}

function useAimags() {
	const q = useQuery({
		queryKey: teacherKey("aimag"),
		queryFn: () => teacherApi.schoolInfo.aimag(),
		staleTime: 30 * 60_000,
	});
	return toOptions(listOf(q.data), "AimagID", "AimagName");
}

// ============================================================
// Үүсгэх
// ============================================================
function CreatePanel({
	onShowList,
}: {
	onShowList: (p: {
		aimag_id: string;
		school_db: string;
		date: string;
	}) => void;
}) {
	const { userId } = useTeacher();
	const ids = useId();
	const aimags = useAimags();
	const [form, setForm] = useState({
		aimag_id: "",
		school_db: "",
		sym_name: "",
		school_name: "",
		count: "10",
	});
	const [touched, setTouched] = useState(false);
	const [created, setCreated] = useState<CreatedRow[] | null>(null);
	const set = (k: keyof typeof form, v: string) =>
		setForm((f) => ({ ...f, [k]: v }));

	const count = Number(form.count);
	const countError =
		!Number.isInteger(count) || count < 1 || count > 500
			? "1–500 хооронд тоо оруулна уу"
			: undefined;
	const req = (v: string, msg = "Заавал бөглөнө") =>
		touched && !v.trim() ? msg : undefined;

	const create = useTeacherMutation(
		(f: typeof form) =>
			teacherApi.autoUser.create({
				aimag_id: Number(f.aimag_id),
				school_db: f.school_db.trim(),
				aimag_name:
					aimags.find((a) => String(a.value) === f.aimag_id)?.label ?? "",
				sym_name: f.sym_name.trim() || undefined,
				school_name: f.school_name.trim(),
				count: Number(f.count),
				user_id: userId,
			}),
		{
			success: "Эрхүүд үүслээ",
			onSuccess: (res) => setCreated(listOf<Row>(res)),
		},
	);

	return (
		<div className="grid gap-4 lg:grid-cols-5">
			<Panel title="Шинэ эрх" className="lg:col-span-2">
				<form
					className="grid gap-4"
					onSubmit={(e) => {
						e.preventDefault();
						setTouched(true);
						if (
							!form.aimag_id ||
							!form.school_db.trim() ||
							!form.school_name.trim() ||
							countError
						)
							return;
						create.mutate(form);
					}}
				>
					<Field
						label="Аймаг, нийслэл"
						required
						error={req(form.aimag_id, "Сонгоно уу")}
					>
						<OptionSelect
							id={`${ids}-aimag`}
							className="sm:w-full"
							options={aimags}
							value={form.aimag_id}
							onChange={(v) => set("aimag_id", v)}
						/>
					</Field>
					<Field label="Сум, дүүрэг">
						<Input
							value={form.sym_name}
							maxLength={100}
							onChange={(e) => set("sym_name", e.target.value)}
						/>
					</Field>
					<Field label="Сургуулийн нэр" required error={req(form.school_name)}>
						<Input
							value={form.school_name}
							maxLength={250}
							onChange={(e) => set("school_name", e.target.value)}
						/>
					</Field>
					<Field
						label="Сургуулийн өгөгдлийн сан"
						required
						hint="Сургуулийн DB нэр, ж: SCH_123"
						error={req(form.school_db)}
					>
						<Input
							value={form.school_db}
							maxLength={100}
							autoComplete="off"
							spellCheck={false}
							onChange={(e) => set("school_db", e.target.value)}
						/>
					</Field>
					<Field
						label="Эрхийн тоо"
						required
						hint="Нэг удаад 1–500"
						error={touched ? countError : undefined}
					>
						<Input
							type="number"
							inputMode="numeric"
							min={1}
							max={500}
							value={form.count}
							onChange={(e) => set("count", e.target.value)}
						/>
					</Field>
					<Button type="submit" disabled={create.isPending}>
						{create.isPending ? (
							<Loader2 className="animate-spin" />
						) : (
							<UserPlus />
						)}
						Эрх үүсгэх
					</Button>
				</form>
			</Panel>

			<Panel
				title="Үүссэн эрхүүд"
				className="lg:col-span-3"
				actions={
					created &&
					created.length > 0 && (
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								onShowList({
									aimag_id: form.aimag_id,
									school_db: form.school_db.trim(),
									date: today(),
								})
							}
						>
							<Printer />
							Хэвлэх хувилбар
						</Button>
					)
				}
			>
				{created === null ? (
					<EmptyState text="Маягтыг бөглөж эрх үүсгэнэ үү" />
				) : (
					<>
						{created.length > 0 && (
							<p className="mb-3 text-sm font-semibold text-muted-foreground">
								{created.length} эрх үүслээ. Анхны нууц үг:{" "}
								<span className="font-black text-foreground">
									{DEFAULT_PASSWORD}
								</span>
							</p>
						)}
						<UsersTable rows={created} />
					</>
				)}
			</Panel>
		</div>
	);
}

function UsersTable({ rows }: { rows: Row[] }) {
	const columns: Column<Row>[] = [
		{
			key: "n",
			header: "№",
			className: "w-14",
			cell: (r, i) => (
				<span className="tabular-nums text-muted-foreground">
					{num(r, "Rown", "rown") || i + 1}
				</span>
			),
		},
		{
			key: "login",
			header: "Нэвтрэх нэр",
			cell: (r) => (
				<span className="font-extrabold tabular-nums">
					{str(r, "login_name", "loginname")}
				</span>
			),
		},
		{
			key: "group",
			header: "Төрөл",
			cell: (r) => str(r, "GroupDesc", "groupdesc"),
		},
	];
	return (
		<DataTable
			columns={columns}
			rows={rows}
			rowKey={(r, i) => str(r, "login_name") || i}
			emptyText="Эрх үүсээгүй"
		/>
	);
}

// ============================================================
// Огноогоор жагсаах + хэвлэх
// ============================================================
function ListPanel({
	initial,
}: {
	initial: { aimag_id: string; school_db: string; date: string } | null;
}) {
	const ids = useId();
	const aimags = useAimags();
	const [form, setForm] = useState(
		initial ?? { aimag_id: "", school_db: "", date: today() },
	);
	const [params, setParams] = useState(initial);
	const [touched, setTouched] = useState(false);

	const { data, isFetching } = useQuery({
		queryKey: teacherKey("autouser-list", params),
		queryFn: () =>
			teacherApi.autoUser.list({
				aimag_id: params?.aimag_id ?? "",
				school_db: params?.school_db ?? "",
				date: params?.date || undefined,
			}),
		enabled: !!params,
	});
	const ret = itemOf<Row>(data);
	const summary = (ret?.summary ?? undefined) as Row | undefined;
	const rows = Array.isArray(ret?.rows)
		? (ret.rows as Row[])
		: listOf<Row>(data);

	return (
		<div className="grid gap-4">
			<Panel className="print:hidden">
				<form
					className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end"
					onSubmit={(e) => {
						e.preventDefault();
						setTouched(true);
						if (!form.aimag_id || !form.school_db.trim()) return;
						setParams({ ...form, school_db: form.school_db.trim() });
					}}
				>
					<Field
						label="Аймаг, нийслэл"
						required
						error={touched && !form.aimag_id ? "Сонгоно уу" : undefined}
					>
						<OptionSelect
							id={`${ids}-aimag`}
							className="sm:w-full"
							options={aimags}
							value={form.aimag_id}
							onChange={(v) => setForm((f) => ({ ...f, aimag_id: v }))}
						/>
					</Field>
					<Field
						label="Сургуулийн өгөгдлийн сан"
						required
						error={
							touched && !form.school_db.trim() ? "Заавал бөглөнө" : undefined
						}
					>
						<Input
							value={form.school_db}
							spellCheck={false}
							onChange={(e) =>
								setForm((f) => ({ ...f, school_db: e.target.value }))
							}
						/>
					</Field>
					<Field label="Огноо">
						<Input
							type="date"
							value={form.date}
							onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
						/>
					</Field>
					<div className="flex gap-2">
						<Button type="submit" className="flex-1" disabled={isFetching}>
							{isFetching ? <Loader2 className="animate-spin" /> : <Eye />}
							Харах
						</Button>
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							disabled={rows.length === 0}
							onClick={() => window.print()}
						>
							<Printer />
							Хэвлэх
						</Button>
					</div>
				</form>
			</Panel>

			{!params ? (
				<Panel>
					<EmptyState text="Аймаг, өгөгдлийн сан, огноо сонгоод харна уу" />
				</Panel>
			) : isFetching && !data ? (
				<Skeleton className="h-72 rounded-3xl" />
			) : rows.length === 0 ? (
				<Panel>
					<EmptyState text="Энэ өдөр үүсгэсэн эрх алга" />
				</Panel>
			) : (
				<section
					id="autouser-print"
					className="rounded-3xl border border-border bg-card p-4 sm:p-6"
				>
					<header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
						<div className="min-w-0">
							<h2 className="text-lg font-black tracking-tight">
								{str(summary, "schname") || params.school_db}
							</h2>
							<p className="text-sm font-semibold text-muted-foreground">
								{str(summary, "provname")}
								{str(summary, "provname") && " · "}
								{params.date}
							</p>
						</div>
						<dl className="flex flex-wrap gap-2 text-sm">
							<Stat label="Багш" value={str(summary, "tcnt")} />
							<Stat label="Сурагч" value={str(summary, "scnt")} />
							<Stat label="Эцэг эх" value={str(summary, "pcnt")} />
						</dl>
					</header>
					<p className="mb-4 rounded-2xl bg-primary-soft/40 px-4 py-2.5 text-sm font-bold text-primary-soft-foreground">
						Анхны нууц үг:{" "}
						<span className="font-black">{DEFAULT_PASSWORD}</span> — нэвтэрсний
						дараа нууц үгээ солино уу.
					</p>
					<ul className="print-grid grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{rows.map((r, i) => (
							<li
								key={str(r, "login_name") || i}
								className="print-card flex items-center gap-3 rounded-2xl border border-dashed border-border px-3 py-2.5"
							>
								<span className="w-8 shrink-0 text-xs font-bold text-muted-foreground tabular-nums">
									{num(r, "Rown", "rown") || i + 1}
								</span>
								<div className="min-w-0">
									<p className="truncate font-black tabular-nums">
										{str(r, "login_name", "loginname")}
									</p>
									<p className="truncate text-xs font-semibold text-muted-foreground">
										{str(r, "GroupDesc", "groupdesc")} · нууц үг{" "}
										{DEFAULT_PASSWORD}
									</p>
								</div>
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	if (!value) return null;
	return (
		<div className="rounded-xl bg-muted px-3 py-1.5">
			<dt className="text-xs font-bold text-muted-foreground">{label}</dt>
			<dd className="font-black tabular-nums">{value}</dd>
		</div>
	);
}
