"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	type Column,
	ConfirmDelete,
	DataTable,
	Field,
	FilterBar,
	FormDialog,
	Panel,
	SearchInput,
	StatusPill,
} from "@/features/teacher/components";
import {
	itemOf,
	listOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { bool, num, pick, planKey, type Row, str } from "./util";

interface TopicRow {
	id: number;
	lesson_id?: number;
	lesson_name?: string;
	curriculumname?: string;
	cnt_uless?: number;
	[key: string]: unknown;
}

interface TopicForm {
	topic_name: string;
	descr: string;
	is_pay: boolean;
	amount: string;
	discount: string;
	is_pack: boolean;
}

const EMPTY: TopicForm = {
	topic_name: "",
	descr: "",
	is_pay: false,
	amount: "",
	discount: "",
	is_pack: false,
};

export function TopicsTab({ lessonId }: { lessonId: number }) {
	const { userId, schoolId } = useTeacher();
	const [search, setSearch] = useState("");
	const [editing, setEditing] = useState<TopicRow | null>(null);
	const [form, setForm] = useState<TopicForm>(EMPTY);
	const set = (patch: Partial<TopicForm>) =>
		setForm((f) => ({ ...f, ...patch }));

	const listKey = planKey("topics", lessonId);
	const { data, isLoading } = useQuery({
		queryKey: listKey,
		queryFn: () =>
			teacherApi.plan.topics.list({
				lesson_id: lessonId,
				user_id: userId,
				school_id: schoolId,
			}),
		enabled: !!userId && !!lessonId,
	});

	const rows = useMemo(() => {
		const all = listOf<TopicRow>(data);
		const q = search.trim().toLowerCase();
		if (!q) return all;
		return all.filter((r) => str(r.curriculumname).toLowerCase().includes(q));
	}, [data, search]);

	// Засах үед дэлгэрэнгүйг татна
	const editId = editing?.id ?? 0;
	const detail = useQuery({
		queryKey: planKey("topic", editId),
		queryFn: () => teacherApi.plan.topics.get({ id: editId }),
		enabled: editId > 0,
	});
	useEffect(() => {
		if (!editId || !detail.data) return;
		const d = itemOf<Row>(detail.data);
		if (!d) return;
		setForm({
			topic_name: str(pick(d, "topic_name", "curriculumname", "name")),
			descr: str(pick(d, "descr", "curriculumdescr", "description")),
			is_pay: bool(pick(d, "is_pay")),
			amount: str(pick(d, "amount")),
			discount: str(pick(d, "discount")),
			is_pack: bool(pick(d, "is_pack")),
		});
	}, [editId, detail.data]);

	const save = useTeacherMutation(
		(v: TopicForm & { id: number }) =>
			teacherApi.plan.topics.save({
				id: v.id,
				topic_name: v.topic_name.trim(),
				descr: v.descr.trim(),
				lesson_id: lessonId,
				is_pay: v.is_pay,
				amount: v.is_pay ? num(v.amount) : 0,
				discount: v.is_pay ? num(v.discount) : 0,
				is_pack: v.is_pack,
				user_id: userId,
			}),
		{
			success: "Хөтөлбөр хадгалагдлаа",
			invalidate: [listKey, planKey("curr", lessonId)],
			onSuccess: () => setEditing(null),
		},
	);

	const remove = useTeacherMutation(
		(id: number) => teacherApi.plan.topics.remove({ id, user_id: userId }),
		{
			success: "Хөтөлбөр устгагдлаа",
			invalidate: [listKey, planKey("curr", lessonId)],
		},
	);

	const openEditor = (row: TopicRow | null) => {
		setForm(
			row ? { ...EMPTY, topic_name: str(row.curriculumname) } : { ...EMPTY },
		);
		setEditing(row ?? { id: 0 });
	};

	const columns: Column<TopicRow>[] = [
		{
			key: "name",
			header: "Хөтөлбөр",
			cell: (r) => <span className="font-bold">{r.curriculumname}</span>,
		},
		{
			key: "lesson",
			header: "Хичээл",
			cell: (r) => (
				<span className="text-muted-foreground">{r.lesson_name}</span>
			),
			className: "hidden md:table-cell",
		},
		{
			key: "cnt",
			header: "Бүлэг сэдэв",
			cell: (r) => <StatusPill tone="sky">{num(r.cnt_uless)}</StatusPill>,
			className: "w-28",
		},
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
						title={`"${r.curriculumname}" хөтөлбөрийг устгах уу?`}
						onConfirm={() => remove.mutate(r.id)}
						pending={remove.isPending}
					/>
				</div>
			),
		},
	];

	const nameError =
		form.topic_name.length > 250 ? "250 тэмдэгтээс ихгүй" : undefined;
	const loadingDetail = editId > 0 && detail.isLoading;

	return (
		<>
			<Panel
				title="Хөтөлбөрүүд"
				actions={
					<Button size="sm" onClick={() => openEditor(null)}>
						<Plus />
						Хөтөлбөр нэмэх
					</Button>
				}
			>
				<FilterBar>
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Хөтөлбөрөөр хайх"
					/>
				</FilterBar>
				<DataTable
					columns={columns}
					rows={rows}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					emptyText="Хөтөлбөр бүртгэгдээгүй байна"
				/>
			</Panel>

			<FormDialog
				open={editing !== null}
				onOpenChange={(o) => !o && setEditing(null)}
				title={editing?.id ? "Хөтөлбөр засах" : "Хөтөлбөр нэмэх"}
				pending={save.isPending}
				onSubmit={() => {
					if (!form.topic_name.trim() || nameError) return;
					save.mutate({ ...form, id: editing?.id ?? 0 });
				}}
			>
				{loadingDetail && (
					<p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
						<Loader2 className="size-4 animate-spin" />
						Мэдээллийг ачаалж байна...
					</p>
				)}
				<Field label="Хөтөлбөрийн нэр" required error={nameError}>
					<Input
						value={form.topic_name}
						maxLength={250}
						onChange={(e) => set({ topic_name: e.target.value })}
						required
					/>
				</Field>
				<Field label="Тайлбар">
					<Textarea
						value={form.descr}
						rows={3}
						onChange={(e) => set({ descr: e.target.value })}
					/>
				</Field>
				<SwitchRow
					label="Төлбөртэй"
					hint="Сурагчид худалдан авч үзнэ"
					checked={form.is_pay}
					onChange={(v) => set({ is_pay: v })}
				/>
				{form.is_pay && (
					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="Үнэ (₮)" required>
							<Input
								type="number"
								min={0}
								inputMode="numeric"
								value={form.amount}
								onChange={(e) => set({ amount: e.target.value })}
								required
							/>
						</Field>
						<Field label="Хөнгөлөлт (%)">
							<Input
								type="number"
								min={0}
								max={100}
								inputMode="numeric"
								value={form.discount}
								onChange={(e) => set({ discount: e.target.value })}
							/>
						</Field>
					</div>
				)}
				<SwitchRow
					label="Багц"
					hint="Хөтөлбөрийг багцаар худалдана"
					checked={form.is_pack}
					onChange={(v) => set({ is_pack: v })}
				/>
			</FormDialog>
		</>
	);
}

function SwitchRow({
	label,
	hint,
	checked,
	onChange,
}: {
	label: string;
	hint?: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: контрол label дотор байна
		<label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border px-4 py-3">
			<span className="grid">
				<span className="text-sm font-bold">{label}</span>
				{hint && (
					<span className="text-xs font-semibold text-muted-foreground">
						{hint}
					</span>
				)}
			</span>
			<Switch checked={checked} onCheckedChange={onChange} />
		</label>
	);
}
