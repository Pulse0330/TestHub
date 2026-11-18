"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Paperclip, Pencil, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	type Column,
	ConfirmDelete,
	DataTable,
	EmptyState,
	Field,
	FormDialog,
	OptionSelect,
	Panel,
	SearchInput,
} from "@/features/teacher/components";
import {
	itemOf,
	listOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { FilePickButton, HtmlEditor } from "./ui";
import { useUrlState } from "./useUrlState";
import {
	num,
	pick,
	qKey,
	type Row,
	str,
	uploadFile,
	useQuestionRef,
} from "./util";

interface SourceRow {
	id: number;
	source_title?: string;
	source_html?: string;
	filename?: string;
	[key: string]: unknown;
}

interface SourceForm {
	source_title: string;
	source_html: string;
	filename: string;
}
const EMPTY: SourceForm = { source_title: "", source_html: "", filename: "" };

export function SourcesTab() {
	const { userId, schoolId } = useTeacher();
	const url = useUrlState();
	const lesson = num(url.get("slesson"));
	const curr = num(url.get("scurr"));
	const ulesson = num(url.get("sulesson"));
	const [search, setSearch] = useState("");
	const [editing, setEditing] = useState<SourceRow | null>(null);
	const [form, setForm] = useState<SourceForm>(EMPTY);
	const [uploading, setUploading] = useState(false);
	const set = (p: Partial<SourceForm>) => setForm((f) => ({ ...f, ...p }));

	const lessons = useQuestionRef("lessons");
	const currs = useQuestionRef("curr", { lesson_id: lesson }, !!lesson);
	const ulessons = useQuestionRef(
		curr ? "ulessons" : "ulessons_all",
		curr ? { lesson_id: lesson, curr_id: curr } : { lesson_id: lesson },
		!!lesson,
	);

	const listKey = qKey("sources", ulesson);
	const { data, isLoading } = useQuery({
		queryKey: listKey,
		queryFn: () => teacherApi.question.source.list({ ulesson_id: ulesson }),
		enabled: !!ulesson,
	});
	const rows = useMemo(() => {
		const all = listOf<SourceRow>(data);
		const q = search.trim().toLowerCase();
		if (!q) return all;
		return all.filter((r) =>
			str(pick(r, "source_title", "title"))
				.toLowerCase()
				.includes(q),
		);
	}, [data, search]);

	const editId = editing?.id ?? 0;
	const detail = useQuery({
		queryKey: qKey("source", editId),
		queryFn: () => teacherApi.question.source.get({ id: editId }),
		enabled: editId > 0,
	});
	useEffect(() => {
		const d = itemOf<Row>(detail.data);
		if (!editId || !d) return;
		setForm({
			source_title: str(pick(d, "source_title", "title")),
			source_html: str(pick(d, "source_html", "html")),
			filename: str(pick(d, "filename", "file_url", "file")),
		});
	}, [editId, detail.data]);

	const save = useTeacherMutation(
		(v: SourceForm & { id: number }) =>
			teacherApi.question.source.save({
				id: v.id,
				source_title: v.source_title.trim(),
				source_html: v.source_html || undefined,
				filename: v.filename || undefined,
				lesson_id: lesson,
				ulesson_id: ulesson,
				user_id: userId,
				school_id: schoolId,
			}),
		{
			success: "Эх сурвалж хадгалагдлаа",
			invalidate: [listKey, qKey("ref", "sources")],
			onSuccess: () => setEditing(null),
		},
	);
	const remove = useTeacherMutation(
		(id: number) =>
			teacherApi.question.source.remove({
				id,
				user_id: userId,
				school_id: schoolId,
			}),
		{
			success: "Эх сурвалж устгагдлаа",
			invalidate: [listKey, qKey("ref", "sources")],
		},
	);

	const openEditor = (row: SourceRow | null) => {
		setForm(
			row
				? {
						source_title: str(pick(row, "source_title", "title")),
						source_html: str(row.source_html),
						filename: str(row.filename),
					}
				: EMPTY,
		);
		setEditing(row ?? { id: 0 });
	};

	const uploadAttachment = async (file: File) => {
		setUploading(true);
		try {
			set({ filename: await uploadFile(file) });
		} catch (e) {
			toast.error((e as Error).message);
		} finally {
			setUploading(false);
		}
	};

	const columns: Column<SourceRow>[] = [
		{
			key: "title",
			header: "Гарчиг",
			cell: (r) => (
				<span className="font-bold">
					{str(pick(r, "source_title", "title"))}
				</span>
			),
		},
		{
			key: "file",
			header: "Файл",
			className: "w-28",
			cell: (r) =>
				r.filename ? (
					<a
						href={str(r.filename)}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
						onClick={(e) => e.stopPropagation()}
					>
						<Paperclip className="size-3.5" />
						Нээх
					</a>
				) : (
					<span className="text-muted-foreground">—</span>
				),
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
						title={`"${str(pick(r, "source_title", "title"))}" эх сурвалжийг устгах уу?`}
						onConfirm={() => remove.mutate(r.id)}
						pending={remove.isPending}
					/>
				</div>
			),
		},
	];

	const titleError =
		form.source_title.length > 100 ? "100 тэмдэгтээс ихгүй" : undefined;

	return (
		<>
			<Panel
				title="Даалгаврын эх сурвалж"
				actions={
					<Button
						size="sm"
						disabled={!ulesson}
						onClick={() => openEditor(null)}
					>
						<Plus />
						Эх сурвалж нэмэх
					</Button>
				}
			>
				<div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
					<OptionSelect
						options={lessons.options}
						value={lesson || ""}
						onChange={(v) =>
							url.set({ slesson: v, scurr: null, sulesson: null })
						}
						placeholder={lessons.isLoading ? "Ачаалж байна..." : "Хичээл"}
						className="sm:w-full"
					/>
					<OptionSelect
						options={currs.options}
						value={curr || (lesson ? "0" : "")}
						onChange={(v) => url.set({ scurr: v, sulesson: null })}
						allLabel="Бүх хөтөлбөр"
						disabled={!lesson}
						placeholder="Хөтөлбөр"
						className="sm:w-full"
					/>
					<OptionSelect
						options={ulessons.options}
						value={ulesson || ""}
						onChange={(v) => url.set({ sulesson: v })}
						disabled={!lesson}
						placeholder={ulessons.isLoading ? "Ачаалж байна..." : "Бүлэг сэдэв"}
						className="sm:w-full"
					/>
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Гарчгаар хайх"
						className="sm:w-full"
					/>
				</div>
				{!ulesson ? (
					<EmptyState text="Хичээл, бүлэг сэдвээ сонгоно уу" />
				) : (
					<DataTable
						columns={columns}
						rows={rows}
						rowKey={(r) => r.id}
						isLoading={isLoading}
						emptyText="Энэ бүлэг сэдэвт эх сурвалж алга"
					/>
				)}
			</Panel>

			<FormDialog
				open={editing !== null}
				onOpenChange={(o) => !o && setEditing(null)}
				title={editId ? "Эх сурвалж засах" : "Эх сурвалж нэмэх"}
				size="lg"
				pending={save.isPending}
				onSubmit={() => {
					if (!form.source_title.trim() || titleError) return;
					save.mutate({ ...form, id: editId });
				}}
			>
				<Field
					label="Гарчиг"
					required
					hint={`${form.source_title.length}/100`}
					error={titleError}
				>
					<Input
						value={form.source_title}
						maxLength={100}
						onChange={(e) => set({ source_title: e.target.value })}
						required
					/>
				</Field>
				<HtmlEditor
					label="Агуулга"
					rows={6}
					value={form.source_html}
					onChange={(v) => set({ source_html: v })}
					hint="Эх бичвэр, хүснэгт, зураг зэрэг даалгаврын үндсэн материал"
				/>
				<div className="grid gap-1.5">
					<span className="text-sm font-bold">Хавсралт файл</span>
					<div className="flex flex-wrap items-center gap-2">
						<Input
							value={form.filename}
							placeholder="https://..."
							aria-label="Файлын холбоос"
							onChange={(e) => set({ filename: e.target.value.trim() })}
							className="min-w-0 flex-1"
						/>
						<FilePickButton
							onPick={uploadAttachment}
							disabled={uploading}
							label="Файл хуулах"
							withText
							icon={
								uploading ? <Loader2 className="animate-spin" /> : <FileText />
							}
						/>
						{form.filename && (
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label="Файл арилгах"
								onClick={() => set({ filename: "" })}
							>
								<X />
							</Button>
						)}
					</div>
				</div>
			</FormDialog>
		</>
	);
}
