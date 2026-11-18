"use client";

import { useQuery } from "@tanstack/react-query";
import { ImageUp, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormDialog } from "@/features/teacher/components";
import {
	itemOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import {
	bannersKey,
	bool,
	fileExt,
	isVideo,
	num,
	PLATFORMS,
	type Row,
	str,
	toDateInput,
	uploadFile,
} from "../_lib/shared";
import { FieldGroup } from "./field-group";
import { Segmented } from "./segmented";
import { type BannerTarget, TargetPicker } from "./target-picker";

interface Form {
	type_id: number;
	title: string;
	descr: string;
	filename: string;
	uploaded: string;
	file_ext: string;
	file_type: number;
	url: string;
	platform: number;
	start_date: string;
	end_date: string;
	sort_order: string;
	weight: string;
	duration_sec: string;
	can_skip: boolean;
	active: boolean;
}

const EMPTY: Form = {
	type_id: 2,
	title: "",
	descr: "",
	filename: "",
	uploaded: "",
	file_ext: "",
	file_type: 1,
	url: "",
	platform: 3,
	start_date: "",
	end_date: "",
	sort_order: "0",
	weight: "1",
	duration_sec: "5",
	can_skip: true,
	active: true,
};

export function BannerDialog({
	id,
	onClose,
	typeOptions,
}: {
	/** null = хаалттай, 0 = шинэ */
	id: number | null;
	onClose: () => void;
	typeOptions: { value: number; label: string }[];
}) {
	const { userId, schoolId } = useTeacher();
	const [form, setForm] = useState<Form>(EMPTY);
	const [targets, setTargets] = useState<BannerTarget[]>([]);
	const [uploading, setUploading] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);
	const fileId = useId();
	const set = <K extends keyof Form>(k: K, v: Form[K]) =>
		setForm((f) => ({ ...f, [k]: v }));

	const detailQ = useQuery({
		queryKey: bannersKey("get", id),
		queryFn: () => teacherApi.banner.get({ id: id ?? 0 }),
		enabled: !!id,
	});

	// Нээх бүрт маягтыг цэвэрлэх / ачаалах
	useEffect(() => {
		if (id === null) return;
		if (id === 0) {
			setForm(EMPTY);
			setTargets([]);
			return;
		}
		const d = itemOf<Row>(detailQ.data);
		if (!d) return;
		const b = (d.reklam ?? d.banner ?? d.item ?? d) as Row;
		setForm({
			type_id: num(b, "type_id") || 2,
			title: str(b, "title"),
			descr: str(b, "descr"),
			filename: str(b, "file_url", "filename"),
			uploaded: str(b, "uploaded"),
			file_ext: str(b, "file_ext"),
			file_type: num(b, "file_type") || 1,
			url: str(b, "url"),
			platform: num(b, "platform") || 3,
			start_date: toDateInput(b.start_date),
			end_date: toDateInput(b.end_date),
			sort_order: str(b, "sort_order") || "0",
			weight: str(b, "weight") || "1",
			duration_sec: str(b, "duration_sec") || "5",
			can_skip: bool(b, "can_skip"),
			active: b.active === undefined ? bool(b, "flag") : bool(b, "active"),
		});
		setTargets(
			((d.targets ?? b.targets ?? []) as Row[]).map((t) => {
				const symId = num(t, "sym_id");
				const aimagName = str(t, "aimag_name", "aimag_id");
				return {
					aimag_id: num(t, "aimag_id"),
					sym_id: symId,
					label:
						str(t, "label") ||
						(symId === 0
							? `${aimagName} (бүгд)`
							: `${aimagName} › ${str(t, "sym_name", "sym_id")}`),
				};
			}),
		);
	}, [id, detailQ.data]);

	const save = useTeacherMutation(
		() =>
			teacherApi.banner.save({
				id: id ?? 0,
				type_id: form.type_id,
				title: form.title.trim(),
				descr: form.descr.trim() || undefined,
				filename: form.filename,
				uploaded: form.uploaded || undefined,
				file_ext: form.file_ext || undefined,
				file_type: form.file_type,
				url: form.url.trim() || undefined,
				platform: form.platform,
				start_date: form.start_date || undefined,
				end_date: form.end_date || undefined,
				sort_order: Number(form.sort_order) || 0,
				weight: Number(form.weight) || 1,
				duration_sec: Number(form.duration_sec) || 0,
				can_skip: form.can_skip,
				active: form.active,
				user_id: userId,
				school_id: schoolId,
				targets: targets.map(({ aimag_id, sym_id }) => ({ aimag_id, sym_id })),
			}),
		{
			success: "Баннер хадгалагдлаа",
			invalidate: [bannersKey("list")],
			onSuccess: onClose,
		},
	);

	const onFile = async (f: File | undefined) => {
		if (!f) return;
		const video = f.type.startsWith("video/");
		if (!video && !f.type.startsWith("image/")) {
			toast.error("Зураг эсвэл видео файл сонгоно уу");
			return;
		}
		setUploading(true);
		try {
			const res = await uploadFile(f);
			setForm((s) => ({
				...s,
				filename: res.file.url,
				uploaded: f.name,
				file_ext: fileExt(f.name),
				file_type: video ? 2 : 1,
			}));
		} catch (e) {
			toast.error((e as Error).message);
		} finally {
			setUploading(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	};

	const submit = () => {
		if (!form.title.trim()) return toast.error("Гарчиг оруулна уу");
		if (!form.filename) return toast.error("Зураг эсвэл видео оруулна уу");
		if (form.start_date && form.end_date && form.end_date < form.start_date)
			return toast.error("Дуусах огноо эхлэх огнооноос өмнө байна");
		save.mutate(undefined);
	};

	const loading = !!id && detailQ.isLoading;
	const video = isVideo(form.file_ext || form.filename, form.file_type);

	return (
		<FormDialog
			open={id !== null}
			onOpenChange={(o) => !o && onClose()}
			title={id ? "Баннер засах" : "Шинэ баннер"}
			size="xl"
			pending={save.isPending || uploading}
			onSubmit={submit}
		>
			{loading ? (
				<Skeleton className="h-96 rounded-2xl" />
			) : (
				<div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
					<div className="grid content-start gap-4">
						<FieldGroup label="Төрөл" required>
							<Segmented
								options={typeOptions}
								value={form.type_id}
								onChange={(v) => set("type_id", v)}
							/>
						</FieldGroup>
						<Field label="Гарчиг" required>
							<Input
								value={form.title}
								maxLength={250}
								onChange={(e) => set("title", e.target.value)}
							/>
						</Field>
						<Field label="Тайлбар">
							<Textarea
								value={form.descr}
								rows={2}
								onChange={(e) => set("descr", e.target.value)}
							/>
						</Field>
						<Field label="Холбоос (дарахад нээгдэх)">
							<Input
								type="url"
								value={form.url}
								placeholder="https://"
								onChange={(e) => set("url", e.target.value)}
							/>
						</Field>
						<FieldGroup label="Платформ">
							<Segmented
								options={PLATFORMS}
								value={form.platform}
								onChange={(v) => set("platform", v)}
							/>
						</FieldGroup>
						<div className="grid gap-3 sm:grid-cols-2">
							<Field label="Эхлэх огноо">
								<Input
									type="date"
									value={form.start_date}
									onChange={(e) => set("start_date", e.target.value)}
								/>
							</Field>
							<Field label="Дуусах огноо">
								<Input
									type="date"
									value={form.end_date}
									onChange={(e) => set("end_date", e.target.value)}
								/>
							</Field>
						</div>
						<div className="grid grid-cols-3 gap-3">
							<Field label="Эрэмбэ">
								<Input
									type="number"
									min={0}
									value={form.sort_order}
									onChange={(e) => set("sort_order", e.target.value)}
								/>
							</Field>
							<Field label="Жин (давтамж)">
								<Input
									type="number"
									min={1}
									value={form.weight}
									onChange={(e) => set("weight", e.target.value)}
								/>
							</Field>
							<Field label="Хугацаа (сек)">
								<Input
									type="number"
									min={0}
									value={form.duration_sec}
									onChange={(e) => set("duration_sec", e.target.value)}
								/>
							</Field>
						</div>
						<div className="grid gap-2 sm:grid-cols-2">
							<SwitchRow
								id="banner-can-skip"
								label="Алгасах боломжтой"
								checked={form.can_skip}
								onChange={(v) => set("can_skip", v)}
							/>
							<SwitchRow
								id="banner-active"
								label="Идэвхтэй"
								checked={form.active}
								onChange={(v) => set("active", v)}
							/>
						</div>
					</div>

					<div className="grid content-start gap-4">
						<FieldGroup label="Зураг / видео" required>
							<input
								id={fileId}
								ref={fileRef}
								type="file"
								accept="image/*,video/*"
								className="sr-only"
								onChange={(e) => onFile(e.target.files?.[0])}
							/>
							<div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30">
								{form.filename ? (
									<>
										{video ? (
											<video
												src={form.filename}
												className="aspect-video w-full bg-muted object-contain"
												controls
												muted
											/>
										) : (
											// biome-ignore lint/performance/noImgElement: гадны URL
											<img
												src={form.filename}
												alt="Баннерын зураг"
												className="aspect-video w-full object-contain"
											/>
										)}
										<button
											type="button"
											aria-label="Файл хасах"
											onClick={() =>
												setForm((s) => ({
													...s,
													filename: "",
													uploaded: "",
													file_ext: "",
												}))
											}
											className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm hover:text-destructive"
										>
											<X className="size-4" />
										</button>
									</>
								) : (
									<button
										type="button"
										onClick={() => fileRef.current?.click()}
										disabled={uploading}
										className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
									>
										{uploading ? (
											<Loader2 className="size-6 animate-spin" />
										) : (
											<ImageUp className="size-6" />
										)}
										{uploading ? "Илгээж байна..." : "Файл сонгох"}
									</button>
								)}
							</div>
							{form.filename && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={uploading}
									onClick={() => fileRef.current?.click()}
								>
									{uploading ? (
										<Loader2 className="animate-spin" />
									) : (
										<ImageUp />
									)}
									Солих
								</Button>
							)}
						</FieldGroup>
						<FieldGroup label="Чиглүүлэх бүс">
							<TargetPicker targets={targets} onChange={setTargets} />
						</FieldGroup>
					</div>
				</div>
			)}
		</FormDialog>
	);
}

function SwitchRow({
	id,
	label,
	checked,
	onChange,
}: {
	id: string;
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<label
			htmlFor={id}
			className="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2.5 text-sm font-bold"
		>
			{label}
			<Switch id={id} checked={checked} onCheckedChange={onChange} />
		</label>
	);
}
