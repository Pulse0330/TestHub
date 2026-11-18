"use client";

// Багш / суралцагч / сургууль / эрх үүсгэх хуудсуудын дотоод туслахууд.

import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { SelectOption } from "@/features/teacher/components";
import { uploadImage } from "@/lib/api";
import { cn } from "@/lib/utils";

export type Row = Record<string, unknown>;

/** Мөрөөс эхний хоосон биш утгыг авна (backend-ийн талбарын нэр зөрөхөд). */
export function pick(row: Row | undefined | null, ...keys: string[]): unknown {
	if (!row) return undefined;
	for (const k of keys) {
		const v = row[k];
		if (v !== undefined && v !== null && v !== "") return v;
	}
	return undefined;
}

export const str = (row: Row | undefined | null, ...keys: string[]) => {
	const v = pick(row, ...keys);
	return v === undefined ? "" : String(v);
};

export const num = (row: Row | undefined | null, ...keys: string[]) => {
	const n = Number(pick(row, ...keys));
	return Number.isFinite(n) ? n : 0;
};

/** Янз бүрийн хэлбэртэй лавлах мөрүүдийг сонголт болгоно. */
export function normOptions(rows: Row[]): SelectOption[] {
	return rows
		.map((r) => ({
			value: str(r, "id", "typeid", "value", "ID", "Id"),
			label: str(r, "title", "typename", "name", "Name", "text"),
		}))
		.filter((o) => o.value !== "");
}

/** "2026-11-18T…" → "2026-11-18" */
export const toDateInput = (v: unknown) => (v ? String(v).slice(0, 10) : "");

export const today = () => {
	const d = new Date();
	const p = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function useDebounced<T>(value: T, ms = 350): T {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
}

// ============================================================
// Удирдлагатай баталгаажуулалт (dropdown цэснээс нээнэ)
// ============================================================
export function ConfirmAction({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Тийм",
	destructive,
	pending,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	confirmLabel?: string;
	destructive?: boolean;
	pending?: boolean;
	onConfirm: () => void;
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>
						{description ?? "Энэ үйлдлийг баталгаажуулна уу."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Болих</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={pending}
						className={
							destructive
								? "bg-pop-coral text-pop-on hover:bg-pop-coral/90"
								: undefined
						}
					>
						{pending && <Loader2 className="animate-spin" />}
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

// ============================================================
// Checkbox-уудын бүлэг
// ============================================================
export function CheckGroup({
	legend,
	options,
	value,
	onChange,
	columns = 2,
}: {
	legend: string;
	options: { value: number; label: string }[];
	value: number[];
	onChange: (v: number[]) => void;
	columns?: 1 | 2 | 4;
}) {
	const base = useId();
	return (
		<fieldset className="grid gap-2">
			<legend className="mb-1.5 text-sm font-bold text-foreground">
				{legend}
			</legend>
			<div
				className={cn(
					"grid gap-2",
					columns === 2 && "sm:grid-cols-2",
					columns === 4 && "grid-cols-2 sm:grid-cols-4",
				)}
			>
				{options.map((o) => {
					const id = `${base}-${o.value}`;
					const checked = value.includes(o.value);
					return (
						<CheckTile
							key={o.value}
							id={id}
							label={o.label}
							checked={checked}
							onChange={(c) =>
								onChange(
									c ? [...value, o.value] : value.filter((x) => x !== o.value),
								)
							}
						/>
					);
				})}
			</div>
		</fieldset>
	);
}

export function CheckTile({
	id,
	label,
	checked,
	onChange,
}: {
	id: string;
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<label
			htmlFor={id}
			className={cn(
				"flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors",
				checked
					? "border-primary-soft-shade bg-primary-soft/50 text-primary-soft-foreground"
					: "border-border bg-card hover:bg-muted/40",
			)}
		>
			<Checkbox
				id={id}
				checked={checked}
				onCheckedChange={(c) => onChange(c === true)}
			/>
			<span className="min-w-0 flex-1 truncate">{label}</span>
		</label>
	);
}

// ============================================================
// Зураг оруулах
// ============================================================
export function ImageField({
	value,
	onChange,
	label = "Зураг",
}: {
	value: string;
	onChange: (url: string) => void;
	label?: string;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState(false);
	const id = useId();

	const onFile = async (file: File | undefined) => {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Зөвхөн зураг сонгоно уу");
			return;
		}
		setBusy(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const res = await uploadImage(fd);
			if (!res?.file?.url) throw new Error();
			onChange(res.file.url);
		} catch {
			toast.error("Зураг оруулахад алдаа гарлаа");
		} finally {
			setBusy(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	return (
		<div className="flex items-center gap-4">
			<div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
				{value ? (
					// biome-ignore lint/performance/noImgElement: гадны upload URL
					<img src={value} alt={label} className="size-full object-cover" />
				) : (
					<ImagePlus className="size-6 text-muted-foreground" />
				)}
			</div>
			<div className="grid gap-1.5">
				<span className="text-sm font-bold">{label}</span>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={busy}
						onClick={() => inputRef.current?.click()}
					>
						{busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
						{value ? "Солих" : "Зураг сонгох"}
					</Button>
					{value && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => onChange("")}
						>
							<X />
							Арилгах
						</Button>
					)}
				</div>
				<input
					id={id}
					ref={inputRef}
					type="file"
					accept="image/*"
					className="sr-only"
					aria-label={label}
					onChange={(e) => onFile(e.target.files?.[0])}
				/>
			</div>
		</div>
	);
}

/** Нэрийн эхний үсгүүдтэй дугуй зураг. */
export function Avatar({ name, src }: { name: string; src?: string }) {
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((s) => s[0])
		.join("")
		.toUpperCase();
	return (
		<span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft/60 text-xs font-black text-primary-soft-foreground">
			{src ? (
				// biome-ignore lint/performance/noImgElement: гадны upload URL
				<img src={src} alt="" className="size-full object-cover" />
			) : (
				initials || "?"
			)}
		</span>
	);
}
