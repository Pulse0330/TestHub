"use client";

import { type QueryKey, useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	EmptyState,
	Field,
	FormDialog,
	OptionSelect,
	type SelectOption,
} from "@/features/teacher/components";
import {
	itemOf,
	listOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { UlessonNode } from "./TreeTab";
import { num, optionsOf, pick, planKey, type Row, str } from "./util";

// ============================================================
// Бүлэг сэдэв
// ============================================================
export interface UlessonEdit {
	id: number;
	name: string;
}

export function UlessonDialog({
	value,
	onClose,
	lessonId,
	currId,
	invalidate,
}: {
	value: UlessonEdit | null;
	onClose: () => void;
	lessonId: number;
	currId: number;
	invalidate: QueryKey[];
}) {
	const { userId } = useTeacher();
	const [name, setName] = useState("");
	const id = value?.id ?? 0;

	useEffect(() => {
		if (value) setName(value.name);
	}, [value]);

	const detail = useQuery({
		queryKey: planKey("ulesson", id),
		queryFn: () => teacherApi.plan.ulesson.get({ id }),
		enabled: id > 0,
	});
	useEffect(() => {
		const d = itemOf<Row>(detail.data);
		const n = str(pick(d, "ulesson_name", "name"));
		if (id && n) setName(n);
	}, [id, detail.data]);

	const save = useTeacherMutation(
		(v: { id: number; name: string }) =>
			teacherApi.plan.ulesson.save({
				id: v.id,
				ulesson_name: v.name,
				lesson_id: lessonId,
				curr_id: currId,
				user_id: userId,
			}),
		{ success: "Бүлэг сэдэв хадгалагдлаа", invalidate, onSuccess: onClose },
	);

	const error = name.length > 100 ? "100 тэмдэгтээс ихгүй" : undefined;

	return (
		<FormDialog
			open={value !== null}
			onOpenChange={(o) => !o && onClose()}
			title={id ? "Бүлэг сэдэв засах" : "Бүлэг сэдэв нэмэх"}
			pending={save.isPending}
			onSubmit={() => {
				if (!name.trim() || error) return;
				save.mutate({ id, name: name.trim() });
			}}
		>
			<Field
				label="Бүлэг сэдвийн нэр"
				required
				hint={`${name.length}/100`}
				error={error}
			>
				<Input
					value={name}
					maxLength={100}
					onChange={(e) => setName(e.target.value)}
					required
				/>
			</Field>
		</FormDialog>
	);
}

// ============================================================
// Сэдэв (ээлжит хичээл)
// ============================================================
export interface RlessonEdit {
	id: number;
	ulesson_id: number;
	name: string;
	rtime: string;
	formofstudy: string;
}

export function RlessonDialog({
	value,
	onClose,
	lessonId,
	currId,
	ulessonOptions,
	invalidate,
}: {
	value: RlessonEdit | null;
	onClose: () => void;
	lessonId: number;
	currId: number;
	ulessonOptions: SelectOption[];
	invalidate: QueryKey[];
}) {
	const { userId, schoolId } = useTeacher();
	const [form, setForm] = useState<RlessonEdit>({
		id: 0,
		ulesson_id: 0,
		name: "",
		rtime: "",
		formofstudy: "",
	});
	const set = (p: Partial<RlessonEdit>) => setForm((f) => ({ ...f, ...p }));
	const id = value?.id ?? 0;

	useEffect(() => {
		if (value) setForm(value);
	}, [value]);

	const types = useQuery({
		queryKey: planKey("lessonTypes", schoolId),
		queryFn: () => teacherApi.plan.lessonTypes({ school_id: schoolId }),
		enabled: value !== null,
		staleTime: 10 * 60_000,
	});
	const typeOptions = useMemo(
		() => optionsOf(listOf<Row>(types.data)),
		[types.data],
	);

	const detail = useQuery({
		queryKey: planKey("rlesson", id),
		queryFn: () => teacherApi.plan.rlesson.get({ id }),
		enabled: id > 0,
	});
	useEffect(() => {
		const d = itemOf<Row>(detail.data);
		if (!id || !d) return;
		setForm((f) => ({
			...f,
			name: str(pick(d, "rlessonname", "rlesson_name", "name") ?? f.name),
			rtime: str(pick(d, "rtime") ?? f.rtime),
			formofstudy: str(pick(d, "formofstudy", "formofstudy_id") ?? ""),
			ulesson_id: num(pick(d, "ulesson_id") ?? f.ulesson_id),
		}));
	}, [id, detail.data]);

	const save = useTeacherMutation(
		(v: RlessonEdit) =>
			teacherApi.plan.rlesson.save({
				id: v.id,
				lesson_id: lessonId,
				curr_id: currId,
				ulesson_id: v.ulesson_id,
				rtime: num(v.rtime),
				formofstudy: v.formofstudy ? num(v.formofstudy) : undefined,
				rlessonname: v.name.trim(),
				user_id: userId,
			}),
		{ success: "Сэдэв хадгалагдлаа", invalidate, onSuccess: onClose },
	);

	const nameError = form.name.length > 500 ? "500 тэмдэгтээс ихгүй" : undefined;
	const timeError =
		form.rtime !== "" && !(num(form.rtime) > 0)
			? "Цаг 0-ээс их байх ёстой"
			: undefined;

	return (
		<FormDialog
			open={value !== null}
			onOpenChange={(o) => !o && onClose()}
			title={id ? "Сэдэв засах" : "Сэдэв нэмэх"}
			pending={save.isPending}
			onSubmit={() => {
				if (
					!form.name.trim() ||
					!(num(form.rtime) > 0) ||
					!form.ulesson_id ||
					nameError
				)
					return;
				save.mutate(form);
			}}
		>
			<Field label="Бүлэг сэдэв" required>
				<OptionSelect
					options={ulessonOptions}
					value={form.ulesson_id || ""}
					onChange={(v) => set({ ulesson_id: Number(v) })}
					className="sm:w-full"
				/>
			</Field>
			<Field
				label="Сэдвийн нэр"
				required
				hint={`${form.name.length}/500`}
				error={nameError}
			>
				<Textarea
					value={form.name}
					rows={3}
					maxLength={500}
					onChange={(e) => set({ name: e.target.value })}
					required
				/>
			</Field>
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Цаг" required error={timeError}>
					<Input
						type="number"
						min={0.5}
						step={0.5}
						inputMode="decimal"
						value={form.rtime}
						onChange={(e) => set({ rtime: e.target.value })}
						required
					/>
				</Field>
				<Field label="Хичээлийн хэлбэр">
					<OptionSelect
						options={typeOptions}
						value={form.formofstudy}
						onChange={(v) => set({ formofstudy: v })}
						placeholder={types.isLoading ? "Ачаалж байна..." : "Сонгох"}
						className="sm:w-full"
					/>
				</Field>
			</div>
		</FormDialog>
	);
}

// ============================================================
// Суралцахуйн зорилт (зөвхөн харах)
// ============================================================
export function ObjectivesDialog({
	ulesson,
	onClose,
}: {
	ulesson: UlessonNode | null;
	onClose: () => void;
}) {
	const id = ulesson?.ulesson_id ?? 0;
	const { data, isLoading } = useQuery({
		queryKey: planKey("objectives", id),
		queryFn: () => teacherApi.plan.ulesson.objectives({ ulesson_id: id }),
		enabled: id > 0,
	});
	const rows = listOf<Row>(data);

	return (
		<Dialog open={ulesson !== null} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-2xl">
				<DialogHeader className="border-b border-border p-5 pr-12 text-left">
					<DialogTitle className="flex items-center gap-2 text-lg font-black">
						<Target className="size-5 text-muted-foreground" />
						Суралцахуйн зорилт
					</DialogTitle>
					<DialogDescription className="font-semibold">
						{ulesson?.ulesson_name}
					</DialogDescription>
				</DialogHeader>
				<div className="min-h-0 flex-1 overflow-y-auto p-5">
					{isLoading ? (
						<div className="space-y-2">
							{["a", "b", "c"].map((k) => (
								<Skeleton key={k} className="h-12 rounded-xl" />
							))}
						</div>
					) : rows.length === 0 ? (
						<EmptyState text="Суралцахуйн зорилт бүртгэгдээгүй" />
					) : (
						<ol className="grid gap-2">
							{rows.map((r, i) => {
								const code = str(pick(r, "obj_code", "code", "objcode"));
								const text = str(
									pick(
										r,
										"obj_name",
										"objective_name",
										"learning_obj",
										"name",
										"title",
										"descr",
									) ??
										Object.values(r).find(
											(v) => typeof v === "string" && v.length > 10,
										),
								);
								return (
									<li
										// biome-ignore lint/suspicious/noArrayIndexKey: id-гүй мөр байж болно
										key={i}
										className="flex gap-3 rounded-2xl bg-muted/50 p-3 text-sm"
									>
										<span className="shrink-0 font-black text-muted-foreground tabular-nums">
											{code || `${i + 1}.`}
										</span>
										<span className="font-semibold">{text}</span>
									</li>
								);
							})}
						</ol>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
