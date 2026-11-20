"use client";

import { Eye, ImagePlus, Loader2, Upload, X } from "lucide-react";
import type * as React from "react";
import { useDeferredValue, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { MathContent } from "@/components/MathContent";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { uploadFile } from "./util";

// ============================================================
// HTML засварлагч: textarea + шууд урьдчилан харах + зураг оруулах
// ============================================================
export function HtmlEditor({
	label,
	value,
	onChange,
	rows = 4,
	placeholder,
	required,
	hint,
	error,
	compact,
	className,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	rows?: number;
	placeholder?: string;
	required?: boolean;
	hint?: string;
	error?: string;
	/** Хариултын мөрөнд — шошгогүй, жижиг */
	compact?: boolean;
	className?: string;
}) {
	const id = useId();
	const ref = useRef<HTMLTextAreaElement>(null);
	const [uploading, setUploading] = useState(false);
	const [showPreview, setShowPreview] = useState(true);
	const deferred = useDeferredValue(value);

	const insertImage = async (file: File) => {
		setUploading(true);
		try {
			const url = await uploadFile(file);
			const tag = `<img src="${url}" alt="" />`;
			const el = ref.current;
			const start = el?.selectionStart ?? value.length;
			const end = el?.selectionEnd ?? value.length;
			onChange(value.slice(0, start) + tag + value.slice(end));
		} catch (e) {
			toast.error((e as Error).message);
		} finally {
			setUploading(false);
		}
	};

	const tools = (
		<div className={cn("flex items-center gap-1", compact && "flex-col")}>
			<FilePickButton
				accept="image/*"
				onPick={insertImage}
				disabled={uploading}
				label="Зураг оруулах"
				icon={uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon-xs"
				aria-pressed={showPreview}
				aria-label="Урьдчилан харах"
				title="Урьдчилан харах"
				onClick={() => setShowPreview((s) => !s)}
				className={cn(showPreview && "bg-primary-soft/60")}
			>
				<Eye />
			</Button>
		</div>
	);
	const textarea = (
		<Textarea
			id={id}
			ref={ref}
			value={value}
			rows={rows}
			placeholder={placeholder}
			onChange={(e) => onChange(e.target.value)}
			className={cn(
				"font-mono text-[13px] leading-relaxed",
				compact && "min-h-0",
			)}
			aria-invalid={!!error || undefined}
			required={required}
		/>
	);

	return (
		<div className={cn("grid gap-1.5", className)}>
			{compact ? (
				<>
					<label htmlFor={id} className="sr-only">
						{label}
					</label>
					<div className="flex items-start gap-1.5">
						<div className="min-w-0 flex-1">{textarea}</div>
						{tools}
					</div>
				</>
			) : (
				<>
					<div className="flex items-center justify-between gap-2">
						<label htmlFor={id} className="text-sm font-bold text-foreground">
							{label}
							{required && <span className="ml-0.5 text-destructive">*</span>}
						</label>
						{tools}
					</div>
					{textarea}
				</>
			)}
			{showPreview && deferred.trim() && (
				<div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2">
					<p className="mb-1 text-[11px] font-extrabold tracking-wider text-muted-foreground uppercase">
						Урьдчилан харах
					</p>
					<MathContent html={deferred} className="text-sm" />
				</div>
			)}
			{hint && !error && (
				<span className="text-xs font-semibold text-muted-foreground">
					{hint}
				</span>
			)}
			{error && (
				<span className="text-xs font-bold text-destructive">{error}</span>
			)}
		</div>
	);
}

// ============================================================
// Файл сонгох товч (нуугдмал input)
// ============================================================
export function FilePickButton({
	accept,
	onPick,
	disabled,
	label,
	icon,
	withText,
}: {
	accept?: string;
	onPick: (file: File) => void;
	disabled?: boolean;
	label: string;
	icon: React.ReactNode;
	withText?: boolean;
}) {
	const ref = useRef<HTMLInputElement>(null);
	return (
		<>
			<input
				ref={ref}
				type="file"
				accept={accept}
				className="hidden"
				tabIndex={-1}
				onChange={(e) => {
					const f = e.target.files?.[0];
					if (f) onPick(f);
					e.target.value = "";
				}}
			/>
			<Button
				type="button"
				variant={withText ? "outline" : "ghost"}
				size={withText ? "sm" : "icon-xs"}
				disabled={disabled}
				aria-label={label}
				title={label}
				onClick={() => ref.current?.click()}
			>
				{icon}
				{withText && label}
			</Button>
		</>
	);
}

// ============================================================
// Зургийн талбар (URL + upload + thumbnail)
// ============================================================
export function ImageField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (url: string) => void;
}) {
	const id = useId();
	const [uploading, setUploading] = useState(false);
	const upload = async (file: File) => {
		setUploading(true);
		try {
			onChange(await uploadFile(file));
		} catch (e) {
			toast.error((e as Error).message);
		} finally {
			setUploading(false);
		}
	};
	return (
		<div className="grid gap-1.5">
			<label htmlFor={id} className="text-sm font-bold">
				{label}
			</label>
			<div className="flex items-start gap-3">
				<div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
					{value ? (
						// biome-ignore lint/performance/noImgElement: гадны URL, хэмжээ тодорхойгүй
						<img src={value} alt={label} className="size-full object-contain" />
					) : (
						<ImagePlus className="size-5 text-muted-foreground" />
					)}
				</div>
				<div className="grid min-w-0 flex-1 gap-1.5">
					<Input
						id={id}
						value={value}
						placeholder="https://..."
						onChange={(e) => onChange(e.target.value.trim())}
					/>
					<div className="flex gap-1.5">
						<FilePickButton
							accept="image/*"
							onPick={upload}
							disabled={uploading}
							label="Зураг хуулах"
							withText
							icon={
								uploading ? <Loader2 className="animate-spin" /> : <Upload />
							}
						/>
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
				</div>
			</div>
		</div>
	);
}

// ============================================================
// Баталгаажуулах үйлдэл
// ============================================================
export function ConfirmAction({
	trigger,
	title,
	description,
	confirmLabel = "Тийм",
	onConfirm,
	pending,
	open,
	onOpenChange,
}: {
	trigger?: React.ReactNode;
	title: string;
	description?: string;
	confirmLabel?: string;
	onConfirm: () => void;
	pending?: boolean;
	open?: boolean;
	onOpenChange?: (o: boolean) => void;
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			{trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>
						{description ?? "Үйлдлийг баталгаажуулна уу."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Болих</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={pending}>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
