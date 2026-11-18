"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CloudDownload, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	type Column,
	DataTable,
	Field,
	FilterBar,
	OptionSelect,
	Panel,
	SearchInput,
	StatusPill,
} from "@/features/teacher/components";
import {
	listOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { ImportResult, TestType } from "@/lib/teacher-api";
import { testsKey } from "./MaterialsTab";
import { num, type Row, str, testTypeLabel } from "./shared";

const OWNERS = [
	{ value: 0, label: "Бүх материал" },
	{ value: 1, label: "Зөвхөн миний" },
];

const codeOf = (r: Row) => str(r, "code", "test_code", "cms_code", "id");

export function CmsTab({ type }: { type: TestType }) {
	const { userId, schoolId, loginName } = useTeacher();
	const [lessonCode, setLessonCode] = useState("");
	const [currType, setCurrType] = useState("");
	const [catCode, setCatCode] = useState("");
	const [owner, setOwner] = useState("0");
	const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(
		null,
	);
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [summary, setSummary] = useState<ImportResult | null>(null);

	const lessons = useQuery({
		queryKey: teacherKey("lessons", schoolId),
		queryFn: () => teacherApi.lesson.list({ school_id: schoolId }),
		enabled: !!schoolId,
	});
	const lessonOptions = listOf<Row>(lessons.data)
		.map((r) => ({
			value: str(r, "lessoncode", "lesson_code"),
			label: `${str(r, "lesson_name", "lessonname")} (${str(r, "lessoncode", "lesson_code")})`,
		}))
		.filter((o) => o.value);

	const remote = useQuery({
		queryKey: teacherKey("exam-cms", submitted),
		queryFn: () =>
			teacherApi.exam.cms.remote(
				submitted as Parameters<typeof teacherApi.exam.cms.remote>[0],
			),
		enabled: !!submitted,
	});
	useEffect(() => {
		if (remote.data) setSelected(new Set());
	}, [remote.data]);

	const rows = useMemo(() => {
		const all = listOf<Row>(remote.data);
		const q = search.trim().toLowerCase();
		if (!q) return all;
		return all.filter((r) =>
			`${codeOf(r)} ${str(r, "title", "test_title", "name")}`
				.toLowerCase()
				.includes(q),
		);
	}, [remote.data, search]);

	const importMut = useTeacherMutation(
		(codes: string[]) =>
			teacherApi.exam.cms.importCodes({
				lesson_code: String(submitted?.lesson_code ?? lessonCode),
				codes,
				test_type: type,
				user_id: userId,
				school_id: schoolId,
			}),
		{
			success: "Татаж дууслаа",
			invalidate: [testsKey(type), teacherKey("exam-dash")],
			onSuccess: (res) => {
				const d = res.RetData as ImportResult | undefined;
				setSummary(
					d ?? { total: selected.size, success: 0, failed: 0, errors: [] },
				);
				setSelected(new Set());
			},
		},
	);

	const allChecked =
		rows.length > 0 && rows.every((r) => selected.has(codeOf(r)));
	const toggle = (code: string, on: boolean) =>
		setSelected((s) => {
			const n = new Set(s);
			if (on) n.add(code);
			else n.delete(code);
			return n;
		});

	const columns: Column<Row>[] = [
		{
			key: "sel",
			header: "",
			className: "w-10",
			cell: (r) => (
				<Checkbox
					checked={selected.has(codeOf(r))}
					onClick={(e) => e.stopPropagation()}
					onCheckedChange={(c) => toggle(codeOf(r), c === true)}
					aria-label={`${codeOf(r)} сонгох`}
				/>
			),
		},
		{
			key: "code",
			header: "Код",
			className: "w-28",
			cell: (r) => (
				<span className="font-extrabold tabular-nums">{codeOf(r)}</span>
			),
		},
		{
			key: "title",
			header: "Гарчиг",
			cell: (r) => str(r, "title", "test_title", "name"),
		},
		{
			key: "cnt",
			header: "Асуулт",
			className: "w-20 text-right tabular-nums",
			cell: (r) => num(r, "que_cnt", "question_cnt", "cnt") || "—",
		},
		{
			key: "owner",
			header: "Эзэмшигч",
			className: "hidden md:table-cell",
			cell: (r) => str(r, "login", "owner", "teacher_name", "created_by"),
		},
	];

	return (
		<Panel>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (!lessonCode) return;
					setSummary(null);
					setSubmitted({
						lesson_code: lessonCode,
						curr_type: currType.trim() || undefined,
						cat_code: catCode.trim() || undefined,
						owner: Number(owner),
						login: loginName || undefined,
					});
				}}
				className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end"
			>
				<Field label="Хичээл" required>
					<OptionSelect
						options={lessonOptions}
						value={lessonCode}
						onChange={setLessonCode}
						placeholder={lessons.isLoading ? "Ачаалж байна..." : "Сонгох"}
						className="sm:w-full"
					/>
				</Field>
				<Field label="Хөтөлбөрийн төрөл">
					<Input
						value={currType}
						onChange={(e) => setCurrType(e.target.value)}
						placeholder="Жишээ: ЕБС"
					/>
				</Field>
				<Field label="Ангиллын код">
					<Input
						value={catCode}
						onChange={(e) => setCatCode(e.target.value)}
						placeholder="Заавал биш"
					/>
				</Field>
				<Field label="Эзэмшигч">
					<OptionSelect
						options={OWNERS}
						value={owner}
						onChange={setOwner}
						className="sm:w-full"
					/>
				</Field>
				<Button type="submit" disabled={!lessonCode || remote.isFetching}>
					{remote.isFetching ? (
						<Loader2 className="animate-spin" />
					) : (
						<Search />
					)}
					Хайх
				</Button>
			</form>

			{summary && (
				<div
					aria-live="polite"
					className="mb-4 flex flex-col gap-2 rounded-2xl border border-pop-mint/40 bg-pop-mint-soft/40 p-4"
				>
					<p className="flex items-center gap-2 text-sm font-black">
						<CheckCircle2 className="size-4 text-pop-mint-ink" />
						Нийт {summary.total} · амжилттай {summary.success} · алдаатай{" "}
						{summary.failed}
					</p>
					{summary.errors?.length > 0 && (
						<ul className="grid gap-0.5 text-xs font-semibold text-muted-foreground">
							{summary.errors.map((e) => (
								<li key={e.code}>
									<span className="font-bold text-foreground">{e.code}</span>:{" "}
									{e.message}
								</li>
							))}
						</ul>
					)}
				</div>
			)}

			{submitted ? (
				<>
					<FilterBar>
						<SearchInput
							value={search}
							onChange={setSearch}
							placeholder="Код, гарчгаар шүүх"
						/>
						{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox label дотор байна */}
						<label className="flex items-center gap-2 text-sm font-bold">
							<Checkbox
								checked={allChecked}
								onCheckedChange={(c) =>
									setSelected(
										c === true ? new Set(rows.map(codeOf)) : new Set(),
									)
								}
							/>
							Бүгдийг сонгох
						</label>
						<div className="flex items-center gap-2 sm:ml-auto">
							{selected.size > 0 && (
								<StatusPill tone="sky">{selected.size} сонгосон</StatusPill>
							)}
							<Button
								disabled={selected.size === 0 || importMut.isPending}
								onClick={() => importMut.mutate([...selected])}
							>
								{importMut.isPending ? (
									<Loader2 className="animate-spin" />
								) : (
									<CloudDownload />
								)}
								{testTypeLabel(type)} болгон татах
							</Button>
						</div>
					</FilterBar>
					<DataTable
						columns={columns}
						rows={rows}
						rowKey={(r, i) => codeOf(r) || i}
						isLoading={remote.isLoading}
						emptyText="CMS-д материал олдсонгүй"
						onRowClick={(r) => toggle(codeOf(r), !selected.has(codeOf(r)))}
					/>
				</>
			) : (
				<p className="rounded-2xl bg-muted/50 px-4 py-6 text-center text-sm font-semibold text-muted-foreground">
					Хичээлээ сонгоод “Хайх” дарж CMS-ийн материалыг харна уу.
				</p>
			)}
		</Panel>
	);
}
