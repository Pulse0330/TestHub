"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarRange, Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";
import {
	normOptions,
	num,
	type Row,
	str,
	toDateInput,
	today,
} from "@/app/(teacher)/teacher/teachers/_components/shared";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	EmptyState,
	Field,
	OptionSelect,
	StatusPill,
	toOptions,
} from "@/features/teacher/components";
import {
	listOf,
	teacherKey,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";

export interface StudentRef {
	id: number;
	name: string;
}

function Shell({
	open,
	onClose,
	title,
	description,
	children,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
				<DialogHeader className="border-b border-border p-5 pr-12 text-left">
					<DialogTitle className="text-lg font-black">{title}</DialogTitle>
					<DialogDescription className="font-semibold">
						{description || title}
					</DialogDescription>
				</DialogHeader>
				<div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
			</DialogContent>
		</Dialog>
	);
}

function ListSkeleton() {
	return (
		<div className="grid gap-2">
			{["a", "b", "c"].map((k) => (
				<Skeleton key={k} className="h-14 rounded-2xl" />
			))}
		</div>
	);
}

const isActive = (edate: string) => !!edate && edate >= today();

/** Огнооны хүрээ + үлдсэн төлөв. */
function Period({ sdate, edate }: { sdate: string; edate: string }) {
	return (
		<div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
			<CalendarRange className="size-3.5" />
			<span className="tabular-nums">
				{sdate || "—"} → {edate || "—"}
			</span>
			{edate && (
				<StatusPill tone={isActive(edate) ? "mint" : "muted"}>
					{isActive(edate) ? "Хүчинтэй" : "Дууссан"}
				</StatusPill>
			)}
		</div>
	);
}

// ============================================================
// Хөтөлбөрүүд
// ============================================================
export function StudentPlansDialog({
	student,
	onClose,
}: {
	student: StudentRef | null;
	onClose: () => void;
}) {
	const { data, isLoading } = useQuery({
		queryKey: teacherKey("student-plans", student?.id),
		queryFn: () => teacherApi.student.plans({ student_id: student?.id ?? 0 }),
		enabled: !!student,
	});
	const rows = listOf<Row>(data);
	return (
		<Shell
			open={!!student}
			onClose={onClose}
			title="Суралцагчийн хөтөлбөрүүд"
			description={student?.name}
		>
			{isLoading ? (
				<ListSkeleton />
			) : rows.length === 0 ? (
				<EmptyState text="Хөтөлбөр алга" />
			) : (
				<ul className="grid gap-2">
					{rows.map((r, i) => (
						<li
							key={num(r, "id", "curr_id", "plan_id") || i}
							className="grid gap-1 rounded-2xl border border-border bg-card px-4 py-3"
						>
							<p className="text-sm font-extrabold">
								{str(
									r,
									"currplan_name",
									"plan_name",
									"curr_name",
									"name",
									"title",
								) || "—"}
							</p>
							<Period
								sdate={toDateInput(str(r, "sdate", "start_date", "begindate"))}
								edate={toDateInput(str(r, "edate", "end_date", "enddate"))}
							/>
						</li>
					))}
				</ul>
			)}
		</Shell>
	);
}

// ============================================================
// Эрх (лиценз)
// ============================================================
const addMonths = (iso: string, m: number) => {
	const d = new Date(`${iso}T00:00:00`);
	d.setMonth(d.getMonth() + m);
	const p = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function StudentLicensesDialog({
	student,
	onClose,
}: {
	student: StudentRef | null;
	onClose: () => void;
}) {
	const ids = useId();
	const studentId = student?.id ?? 0;
	const [form, setForm] = useState({
		curr_id: "",
		sdate: "",
		edate: "",
		license_type: "",
	});
	const [touched, setTouched] = useState(false);

	useEffect(() => {
		if (!student) return;
		const s = today();
		setForm({
			curr_id: "",
			sdate: s,
			edate: addMonths(s, 12),
			license_type: "",
		});
		setTouched(false);
	}, [student]);

	const currId = Number(form.curr_id) || undefined;
	const listKey = teacherKey("student-licenses", studentId);
	const licenses = useQuery({
		queryKey: [...listKey, currId ?? 0],
		queryFn: () =>
			teacherApi.student.licenses({ student_id: studentId, curr_id: currId }),
		enabled: !!student,
	});
	const curriculums = useQuery({
		queryKey: teacherKey("student-ref", "curr"),
		queryFn: () => teacherApi.student.curriculums(),
		staleTime: 10 * 60_000,
		enabled: !!student,
	});
	const types = useQuery({
		queryKey: teacherKey("student-ref", "license-types"),
		queryFn: () => teacherApi.student.licenseTypes(),
		staleTime: 10 * 60_000,
		enabled: !!student,
	});
	const currOptions = toOptions(
		listOf(curriculums.data),
		"id",
		"currplan_name",
	);
	const typeOptions = normOptions(listOf<Row>(types.data));

	const save = useTeacherMutation(
		(v: typeof form) =>
			teacherApi.student.saveLicense({
				student_id: studentId,
				curr_id: Number(v.curr_id),
				sdate: v.sdate,
				edate: v.edate,
				license_type: v.license_type ? Number(v.license_type) : undefined,
			}),
		{
			success: "Эрх хадгалагдлаа",
			invalidate: [listKey, teacherKey("student-plans", studentId)],
			onSuccess: () => setTouched(false),
		},
	);

	const dateError =
		form.sdate && form.edate && form.sdate >= form.edate
			? "Дуусах огноо эхлэх огнооноос хойш байна"
			: undefined;
	const currError =
		touched && !form.curr_id ? "Хөтөлбөр сонгоно уу" : undefined;
	const rows = listOf<Row>(licenses.data);

	return (
		<Shell
			open={!!student}
			onClose={onClose}
			title="Эрх олгох, сунгах"
			description={student?.name}
		>
			<form
				className="grid gap-4 rounded-2xl border border-border bg-muted/30 p-4"
				onSubmit={(e) => {
					e.preventDefault();
					setTouched(true);
					if (!form.curr_id || !form.sdate || !form.edate || dateError) return;
					save.mutate(form);
				}}
			>
				<div className="grid gap-4 sm:grid-cols-2">
					<Field label="Хөтөлбөр" required error={currError}>
						<OptionSelect
							id={`${ids}-curr`}
							className="sm:w-full"
							options={currOptions}
							value={form.curr_id}
							onChange={(v) => setForm((f) => ({ ...f, curr_id: v }))}
						/>
					</Field>
					<Field label="Эрхийн төрөл">
						<OptionSelect
							id={`${ids}-type`}
							className="sm:w-full"
							options={typeOptions}
							value={form.license_type}
							onChange={(v) => setForm((f) => ({ ...f, license_type: v }))}
						/>
					</Field>
					<Field label="Эхлэх огноо" required>
						<Input
							type="date"
							value={form.sdate}
							required
							onChange={(e) =>
								setForm((f) => ({ ...f, sdate: e.target.value }))
							}
						/>
					</Field>
					<Field label="Дуусах огноо" required error={dateError}>
						<Input
							type="date"
							value={form.edate}
							min={form.sdate || undefined}
							required
							aria-invalid={!!dateError}
							onChange={(e) =>
								setForm((f) => ({ ...f, edate: e.target.value }))
							}
						/>
					</Field>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex flex-wrap gap-1.5">
						{[1, 3, 6, 12].map((m) => (
							<Button
								key={m}
								type="button"
								variant="outline"
								size="xs"
								disabled={!form.sdate}
								onClick={() =>
									setForm((f) => ({ ...f, edate: addMonths(f.sdate, m) }))
								}
							>
								+{m} сар
							</Button>
						))}
					</div>
					<Button type="submit" disabled={save.isPending}>
						{save.isPending && <Loader2 className="animate-spin" />}
						Эрх олгох
					</Button>
				</div>
			</form>

			<h3 className="mt-6 mb-3 text-sm font-black">
				{currId ? "Сонгосон хөтөлбөрийн эрх" : "Одоогийн эрхүүд"}
			</h3>
			{licenses.isLoading ? (
				<ListSkeleton />
			) : rows.length === 0 ? (
				<EmptyState text="Эрх олгогдоогүй байна" />
			) : (
				<ul className="grid gap-2">
					{rows.map((r, i) => (
						<li
							key={num(r, "id", "license_id") || i}
							className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3"
						>
							<div className="grid min-w-0 gap-1">
								<p className="truncate text-sm font-extrabold">
									{str(
										r,
										"currplan_name",
										"curr_name",
										"plan_name",
										"name",
										"title",
									) || "—"}
								</p>
								<Period
									sdate={toDateInput(
										str(r, "sdate", "start_date", "begindate"),
									)}
									edate={toDateInput(str(r, "edate", "end_date", "enddate"))}
								/>
							</div>
							{str(r, "typename", "license_name", "ltype_name") && (
								<StatusPill tone="sky">
									{str(r, "typename", "license_name", "ltype_name")}
								</StatusPill>
							)}
						</li>
					))}
				</ul>
			)}
		</Shell>
	);
}
