"use client";

import {
	ChevronLeft,
	ChevronRight,
	Inbox,
	Loader2,
	Search,
	Trash2,
} from "lucide-react";
import type * as React from "react";
import { useId } from "react";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ============================================================
// Хуудасны толгой
// ============================================================
export function PageHeader({
	title,
	description,
	icon: Icon,
	actions,
}: {
	title: string;
	description?: string;
	icon?: React.ElementType;
	actions?: React.ReactNode;
}) {
	return (
		<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex min-w-0 items-center gap-3">
				{Icon && (
					<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
						<Icon className="size-5" strokeWidth={2.25} />
					</span>
				)}
				<div className="min-w-0">
					<h1 className="truncate text-2xl font-black tracking-tight text-foreground">
						{title}
					</h1>
					{description && (
						<p className="text-sm font-semibold text-muted-foreground">
							{description}
						</p>
					)}
				</div>
			</div>
			{actions && (
				<div className="flex flex-wrap items-center gap-2">{actions}</div>
			)}
		</div>
	);
}

// ============================================================
// Хэсэг (цагаан карт)
// ============================================================
export function Panel({
	title,
	actions,
	className,
	children,
}: {
	title?: string;
	actions?: React.ReactNode;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<section
			className={cn(
				"rounded-3xl border border-border bg-card p-4 sm:p-5",
				className,
			)}
		>
			{(title || actions) && (
				<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
					{title && (
						<h2 className="text-base font-black tracking-tight">{title}</h2>
					)}
					{actions}
				</div>
			)}
			{children}
		</section>
	);
}

// ============================================================
// Шүүлтийн мөр
// ============================================================
export function FilterBar({ children }: { children: React.ReactNode }) {
	return (
		<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
			{children}
		</div>
	);
}

export function SearchInput({
	value,
	onChange,
	placeholder = "Хайх...",
	className,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	className?: string;
}) {
	return (
		<div className={cn("relative w-full sm:w-64", className)}>
			<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="pl-9"
				aria-label={placeholder}
			/>
		</div>
	);
}

// ============================================================
// Сонголт (Option[] → Select)
// ============================================================
export interface SelectOption {
	value: string | number;
	label: string;
}

/** API-ийн мөрүүдийг Select-ийн сонголт болгоно. */
export function toOptions<T extends Record<string, unknown>>(
	rows: T[],
	valueKey: keyof T = "id" as keyof T,
	labelKey: keyof T = "title" as keyof T,
): SelectOption[] {
	return rows.map((r) => ({
		value: r[valueKey] as string | number,
		label: String(r[labelKey] ?? ""),
	}));
}

const ALL = "__all__";

export function OptionSelect({
	options,
	value,
	onChange,
	placeholder = "Сонгох",
	allLabel,
	disabled,
	className,
	id,
}: {
	options: SelectOption[];
	value: string | number | null | undefined;
	onChange: (v: string) => void;
	placeholder?: string;
	/** Өгвөл "бүгд" сонголт нэмэгдэж, сонгоход "0" буцаана */
	allLabel?: string;
	disabled?: boolean;
	className?: string;
	id?: string;
}) {
	const current =
		value === null || value === undefined || value === ""
			? undefined
			: allLabel && String(value) === "0"
				? ALL
				: String(value);
	return (
		<Select
			value={current}
			onValueChange={(v) => onChange(v === ALL ? "0" : v)}
			disabled={disabled}
		>
			<SelectTrigger id={id} className={cn("w-full sm:w-56", className)}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
				{options
					.filter((o) => String(o.value) !== "")
					.map((o) => (
						<SelectItem key={String(o.value)} value={String(o.value)}>
							{o.label}
						</SelectItem>
					))}
			</SelectContent>
		</Select>
	);
}

// ============================================================
// Маягтын талбар
// ============================================================
export function Field({
	label,
	required,
	hint,
	error,
	className,
	children,
}: {
	label: string;
	required?: boolean;
	hint?: string;
	error?: string;
	className?: string;
	/** Контрол — id-г `useFieldId`-аар эсвэл шууд холбоно */
	children: React.ReactNode;
}) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: контрол children дотор байна
		<label className={cn("grid gap-1.5", className)}>
			<span className="text-sm font-bold text-foreground">
				{label}
				{required && <span className="ml-0.5 text-destructive">*</span>}
			</span>
			{children}
			{hint && !error && (
				<span className="text-xs font-semibold text-muted-foreground">
					{hint}
				</span>
			)}
			{error && (
				<span className="text-xs font-bold text-destructive">{error}</span>
			)}
		</label>
	);
}

export const useFieldId = useId;

// ============================================================
// Хүснэгт
// ============================================================
export interface Column<T> {
	key: string;
	header: string;
	cell: (row: T, index: number) => React.ReactNode;
	className?: string;
}

export function DataTable<T>({
	columns,
	rows,
	rowKey,
	isLoading,
	emptyText = "Мэдээлэл олдсонгүй",
	onRowClick,
}: {
	columns: Column<T>[];
	rows: T[];
	rowKey: (row: T, index: number) => string | number;
	isLoading?: boolean;
	emptyText?: string;
	onRowClick?: (row: T) => void;
}) {
	if (isLoading) {
		return (
			<div className="space-y-2">
				{["a", "b", "c", "d", "e"].map((k) => (
					<Skeleton key={k} className="h-11 rounded-xl" />
				))}
			</div>
		);
	}
	if (rows.length === 0) return <EmptyState text={emptyText} />;
	return (
		<Table>
			<TableHeader>
				<TableRow className="hover:bg-transparent">
					{columns.map((c) => (
						<TableHead key={c.key} className={c.className}>
							{c.header}
						</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{rows.map((row, i) => (
					<TableRow
						key={rowKey(row, i)}
						onClick={onRowClick ? () => onRowClick(row) : undefined}
						className={onRowClick ? "cursor-pointer" : undefined}
					>
						{columns.map((c) => (
							<TableCell key={c.key} className={c.className}>
								{c.cell(row, i)}
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export function EmptyState({
	text = "Мэдээлэл олдсонгүй",
	children,
}: {
	text?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center gap-3 py-12 text-center">
			<span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
				<Inbox className="size-6" strokeWidth={2} />
			</span>
			<p className="text-sm font-bold text-muted-foreground">{text}</p>
			{children}
		</div>
	);
}

// ============================================================
// Хуудаслалт
// ============================================================
export function Pagination({
	page,
	size,
	total,
	onPageChange,
}: {
	page: number;
	size: number;
	total: number;
	onPageChange: (page: number) => void;
}) {
	const pages = Math.max(1, Math.ceil(total / Math.max(size, 1)));
	if (total <= size) return null;
	return (
		<div className="mt-4 flex items-center justify-between gap-2">
			<p className="text-xs font-bold text-muted-foreground tabular-nums">
				Нийт {total} · {page}/{pages} хуудас
			</p>
			<div className="flex gap-1.5">
				<Button
					variant="outline"
					size="icon-sm"
					disabled={page <= 1}
					onClick={() => onPageChange(page - 1)}
					aria-label="Өмнөх хуудас"
				>
					<ChevronLeft />
				</Button>
				<Button
					variant="outline"
					size="icon-sm"
					disabled={page >= pages}
					onClick={() => onPageChange(page + 1)}
					aria-label="Дараах хуудас"
				>
					<ChevronRight />
				</Button>
			</div>
		</div>
	);
}

// ============================================================
// Маягтын dialog
// ============================================================
export function FormDialog({
	open,
	onOpenChange,
	title,
	description,
	onSubmit,
	pending,
	submitLabel = "Хадгалах",
	size = "md",
	children,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	onSubmit: () => void;
	pending?: boolean;
	submitLabel?: string;
	size?: "md" | "lg" | "xl";
	children: React.ReactNode;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					"flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0",
					size === "md" && "sm:max-w-lg",
					size === "lg" && "sm:max-w-2xl",
					size === "xl" && "sm:max-w-4xl",
				)}
			>
				<form
					className="flex min-h-0 flex-1 flex-col"
					onSubmit={(e) => {
						e.preventDefault();
						onSubmit();
					}}
				>
					<DialogHeader className="border-b border-border p-5 pr-12 text-left">
						<DialogTitle className="text-lg font-black">{title}</DialogTitle>
						{description ? (
							<DialogDescription className="font-semibold">
								{description}
							</DialogDescription>
						) : (
							<DialogDescription className="sr-only">{title}</DialogDescription>
						)}
					</DialogHeader>
					<div className="min-h-0 flex-1 overflow-y-auto p-5">
						<div className="grid gap-4">{children}</div>
					</div>
					<DialogFooter className="border-t border-border p-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Болих
						</Button>
						<Button type="submit" disabled={pending}>
							{pending && <Loader2 className="animate-spin" />}
							{submitLabel}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ============================================================
// Устгах баталгаажуулалт
// ============================================================
export function ConfirmDelete({
	onConfirm,
	pending,
	title = "Устгах уу?",
	description = "Энэ үйлдлийг буцаах боломжгүй.",
	label = "Устгах",
	iconOnly = true,
}: {
	onConfirm: () => void;
	pending?: boolean;
	title?: string;
	description?: string;
	label?: string;
	iconOnly?: boolean;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				{iconOnly ? (
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={label}
						className="text-muted-foreground hover:text-destructive"
						onClick={(e) => e.stopPropagation()}
					>
						<Trash2 />
					</Button>
				) : (
					<Button variant="outline" size="sm">
						<Trash2 />
						{label}
					</Button>
				)}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Болих</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={pending}
						className="bg-pop-coral text-pop-on hover:bg-pop-coral/90"
					>
						{label}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

// ============================================================
// Жижиг туслахууд
// ============================================================
/** "2026-11-20T10:00:00" → "2026-11-20 10:00" */
export function formatDateTime(v: unknown): string {
	if (!v) return "";
	const s = String(v).replace("T", " ");
	return s.length > 16 ? s.slice(0, 16) : s;
}

export function StatusPill({
	tone = "muted",
	children,
}: {
	tone?: "muted" | "mint" | "sun" | "coral" | "sky";
	children: React.ReactNode;
}) {
	const cls = {
		muted: "bg-muted text-muted-foreground",
		mint: "bg-pop-mint-soft text-pop-mint-ink",
		sun: "bg-pop-sun-soft text-pop-sun-ink",
		coral: "bg-pop-coral-soft text-pop-coral-ink",
		sky: "bg-pop-sky-soft text-pop-sky-ink",
	}[tone];
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
				cls,
			)}
		>
			{children}
		</span>
	);
}
