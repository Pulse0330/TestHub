"use client";

import { useQuery } from "@tanstack/react-query";
import {
	ArrowDown,
	ArrowUp,
	GripVertical,
	Loader2,
	Trash2,
	Upload,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	EmptyState,
	Field,
	OptionSelect,
	toOptions,
} from "@/features/teacher/components";
import { listOf, teacherKey, useTeacher } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { ElibContentKind } from "@/lib/teacher-api";
import { cn } from "@/lib/utils";
import {
	EXT,
	extOf,
	KIND_META,
	KINDS,
	uploadFile,
} from "../../_components/shared";
import { type EditItem, emptyItem } from "./items";
import { TestSummary } from "./test-summary";

const URL_HINT: Partial<Record<ElibContentKind, string>> = {
	link: "Вэб хуудасны холбоос",
	youtube: "https://www.youtube.com/watch?v=...",
	gdoc: "Google Docs/Slides/Sheets-ийн нийтэлсэн холбоос",
};

export function ContentEditor({
	items,
	setItems,
	errors,
	rlessonId,
}: {
	items: EditItem[];
	setItems: (fn: (xs: EditItem[]) => EditItem[]) => void;
	errors: Record<string, string | undefined>;
	rlessonId: number;
}) {
	const dragFrom = useRef<number | null>(null);
	const [dragOver, setDragOver] = useState<number | null>(null);

	const update = (key: string, patch: Partial<EditItem>) =>
		setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)));
	const move = (from: number, to: number) =>
		setItems((xs) => {
			if (to < 0 || to >= xs.length || from === to) return xs;
			const next = [...xs];
			const [it] = next.splice(from, 1);
			next.splice(to, 0, it);
			return next;
		});
	const add = (kind: ElibContentKind) =>
		setItems((xs) => [...xs, emptyItem(kind)]);

	return (
		<div className="grid gap-4">
			<div className="rounded-3xl border border-dashed border-border bg-muted/30 p-3">
				<p className="mb-2 px-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
					Контент нэмэх
				</p>
				<div className="flex flex-wrap gap-1.5">
					{KINDS.map((k) => {
						const { icon: Icon, label } = KIND_META[k];
						return (
							<Button
								key={k}
								type="button"
								variant="outline"
								size="sm"
								onClick={() => add(k)}
							>
								<Icon />
								{label}
							</Button>
						);
					})}
				</div>
			</div>

			{items.length === 0 ? (
				<EmptyState text="Контент нэмээгүй байна. Дээрх товчоор нэмнэ үү." />
			) : (
				<ol className="grid gap-3">
					{items.map((it, i) => (
						<li
							key={it.key}
							onDragOver={(e) => {
								if (dragFrom.current === null) return;
								e.preventDefault();
								setDragOver(i);
							}}
							onDragLeave={() => setDragOver((d) => (d === i ? null : d))}
							onDrop={(e) => {
								e.preventDefault();
								if (dragFrom.current !== null) move(dragFrom.current, i);
								dragFrom.current = null;
								setDragOver(null);
							}}
							className={cn(
								"rounded-3xl transition-shadow",
								dragOver === i && "ring-2 ring-primary-soft-shade",
							)}
						>
							<ItemCard
								item={it}
								index={i}
								count={items.length}
								error={errors[it.key]}
								rlessonId={rlessonId}
								onChange={(p) => update(it.key, p)}
								onMove={(to) => move(i, to)}
								onRemove={() =>
									setItems((xs) => xs.filter((x) => x.key !== it.key))
								}
								onDragStart={() => {
									dragFrom.current = i;
								}}
								onDragEnd={() => {
									dragFrom.current = null;
									setDragOver(null);
								}}
							/>
						</li>
					))}
				</ol>
			)}
		</div>
	);
}

function ItemCard({
	item,
	index,
	count,
	error,
	rlessonId,
	onChange,
	onMove,
	onRemove,
	onDragStart,
	onDragEnd,
}: {
	item: EditItem;
	index: number;
	count: number;
	error?: string;
	rlessonId: number;
	onChange: (p: Partial<EditItem>) => void;
	onMove: (to: number) => void;
	onRemove: () => void;
	onDragStart: () => void;
	onDragEnd: () => void;
}) {
	const meta = KIND_META[item.kind];
	const Icon = meta.icon;
	const isTest = item.kind === "test" || item.kind === "soril";
	const hwId = useId();
	const dateId = useId();

	return (
		<article
			className={cn(
				"rounded-3xl border bg-card",
				error ? "border-destructive/50" : "border-border",
			)}
		>
			<header className="flex items-center gap-2 border-b border-border px-3 py-2">
				<span
					draggable
					onDragStart={(e) => {
						e.dataTransfer.effectAllowed = "move";
						onDragStart();
					}}
					onDragEnd={onDragEnd}
					className="hidden cursor-grab text-muted-foreground sm:block"
					title="Чирж байрлал солих"
					aria-hidden
				>
					<GripVertical className="size-4" />
				</span>
				<span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft/60 text-primary-soft-foreground">
					<Icon className="size-4" />
				</span>
				<span className="text-sm font-extrabold">
					<span className="tabular-nums text-muted-foreground">
						{index + 1}.
					</span>{" "}
					{meta.label}
				</span>
				{item.id === null && (
					<span className="rounded-full bg-pop-mint-soft px-2 py-0.5 text-[11px] font-bold text-pop-mint-ink">
						Шинэ
					</span>
				)}
				<div className="ml-auto flex gap-0.5">
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						aria-label="Дээш зөөх"
						disabled={index === 0}
						onClick={() => onMove(index - 1)}
					>
						<ArrowUp />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						aria-label="Доош зөөх"
						disabled={index === count - 1}
						onClick={() => onMove(index + 1)}
					>
						<ArrowDown />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						aria-label="Хасах"
						className="text-muted-foreground hover:text-destructive"
						onClick={onRemove}
					>
						<Trash2 />
					</Button>
				</div>
			</header>

			<div className="grid gap-3 p-3 sm:p-4">
				<div className="grid gap-3 sm:grid-cols-2">
					<Field label="Гарчиг" required>
						<Input
							value={item.title}
							maxLength={250}
							onChange={(e) => onChange({ title: e.target.value })}
						/>
					</Field>
					<Field label="Тайлбар">
						<Input
							value={item.descr}
							maxLength={500}
							onChange={(e) => onChange({ descr: e.target.value })}
						/>
					</Field>
				</div>

				{item.kind === "text" && (
					<Field label="Текст" required hint="HTML, томьёо (TeX) дэмжинэ">
						<Textarea
							value={item.text}
							rows={5}
							onChange={(e) => onChange({ text: e.target.value })}
						/>
					</Field>
				)}

				{(item.kind === "link" ||
					item.kind === "youtube" ||
					item.kind === "gdoc") && (
					<Field label="Холбоос" required hint={URL_HINT[item.kind]}>
						<Input
							type="url"
							value={item.url}
							placeholder="https://"
							onChange={(e) => onChange({ url: e.target.value })}
						/>
					</Field>
				)}

				{meta.upload && (
					<FileField item={item} accept={meta.upload} onChange={onChange} />
				)}

				{isTest && (
					<TestPicker item={item} rlessonId={rlessonId} onChange={onChange} />
				)}

				<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
					<div className="flex items-center gap-2">
						<Switch
							id={hwId}
							checked={item.is_homework}
							onCheckedChange={(v) => onChange({ is_homework: v })}
						/>
						<label htmlFor={hwId} className="text-sm font-bold">
							Гэрийн даалгавар
						</label>
					</div>
					{isTest && (
						<div className="flex items-center gap-2">
							<Switch
								id={dateId}
								checked={item.is_date}
								onCheckedChange={(v) => onChange({ is_date: v })}
							/>
							<label htmlFor={dateId} className="text-sm font-bold">
								Хугацаатай
							</label>
						</div>
					)}
					{isTest && item.is_date && (
						<Input
							type="datetime-local"
							aria-label="Дуусах хугацаа"
							value={item.exam_edate}
							onChange={(e) => onChange({ exam_edate: e.target.value })}
							className="w-full sm:w-60"
						/>
					)}
				</div>

				{error && (
					<p role="alert" className="text-xs font-bold text-destructive">
						{error}
					</p>
				)}
			</div>
		</article>
	);
}

function FileField({
	item,
	accept,
	onChange,
}: {
	item: EditItem;
	accept: keyof typeof EXT;
	onChange: (p: Partial<EditItem>) => void;
}) {
	const ref = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState(false);
	const exts = EXT[accept] as readonly string[];

	const onFile = async (file?: File) => {
		if (!file) return;
		if (!exts.includes(extOf(file.name))) {
			toast.error(`Зөвшөөрөгдсөн өргөтгөл: ${exts.join(", ")}`);
			return;
		}
		setBusy(true);
		try {
			const up = await uploadFile(file);
			onChange({
				url: up.url,
				filename: up.name,
				title: item.title || file.name.replace(/\.[^.]+$/, ""),
			});
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Алдаа гарлаа");
		} finally {
			setBusy(false);
			if (ref.current) ref.current.value = "";
		}
	};

	return (
		<div className="grid gap-1.5">
			<span className="text-sm font-bold">
				Файл<span className="ml-0.5 text-destructive">*</span>
			</span>
			<div className="flex flex-col gap-2 sm:flex-row">
				<Input
					type="url"
					value={item.url}
					aria-label="Файлын холбоос"
					placeholder="Файл байршуулах эсвэл холбоос оруулах"
					onChange={(e) => onChange({ url: e.target.value, filename: "" })}
				/>
				<input
					ref={ref}
					type="file"
					accept={exts.map((e) => `.${e}`).join(",")}
					className="sr-only"
					tabIndex={-1}
					aria-hidden
					onChange={(e) => onFile(e.target.files?.[0])}
				/>
				<Button
					type="button"
					variant="outline"
					disabled={busy}
					onClick={() => ref.current?.click()}
					className="shrink-0"
				>
					{busy ? <Loader2 className="animate-spin" /> : <Upload />}
					Байршуулах
				</Button>
			</div>
			<span className="text-xs font-semibold text-muted-foreground">
				{item.filename ? `Файл: ${item.filename}` : exts.join(", ")}
			</span>
		</div>
	);
}

function TestPicker({
	item,
	rlessonId,
	onChange,
}: {
	item: EditItem;
	rlessonId: number;
	onChange: (p: Partial<EditItem>) => void;
}) {
	const { userId, schoolId } = useTeacher();
	const testType = item.kind === "soril" ? 3 : 1;
	const tests = useQuery({
		queryKey: teacherKey("elib", "tests", rlessonId, testType),
		queryFn: () =>
			teacherApi.elib.tests({
				user_id: userId,
				school_id: schoolId,
				rlesson_id: rlessonId,
				test_type: testType,
			}),
		enabled: !!userId && !!rlessonId,
	});
	const options = toOptions(listOf(tests.data));
	if (
		item.my_test_id &&
		!options.some((o) => Number(o.value) === item.my_test_id)
	) {
		options.unshift({
			value: item.my_test_id,
			label: item.test_title || `#${item.my_test_id}`,
		});
	}

	return (
		<div className="grid gap-2">
			<Field
				label={item.kind === "soril" ? "Сорил" : "Тест"}
				required
				hint={
					!tests.isLoading && options.length === 0
						? "Энэ сэдэвт холбох тест алга"
						: undefined
				}
			>
				<OptionSelect
					options={options}
					value={item.my_test_id || ""}
					placeholder={tests.isLoading ? "Ачаалж байна..." : "Сонгох"}
					className="sm:w-full"
					onChange={(v) => {
						const o = options.find((x) => String(x.value) === v);
						onChange({
							my_test_id: Number(v),
							test_title: o?.label ?? "",
							title: item.title || o?.label || "",
						});
					}}
				/>
			</Field>
			{item.my_test_id > 0 && <TestSummary testId={item.my_test_id} />}
		</div>
	);
}
