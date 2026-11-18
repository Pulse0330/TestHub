"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { OptionSelect, type SelectOption } from "@/features/teacher/components";
import { itemOf, listOf, teacherKey } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { LetterTarget } from "@/lib/teacher-api";
import { num, type Row, str } from "../_lib/shared";

const targetKey = (t: LetterTarget) =>
	`${t.aimag_id}|${t.sym_id}|${t.schooldb}|${t.class_id}`;

function opts(rows: Row[], idKeys: string[], nameKeys: string[]) {
	return rows
		.map((r) => ({ value: str(r, ...idKeys), label: str(r, ...nameKeys) }))
		.filter((o) => o.value !== "" && o.value !== "0") as SelectOption[];
}
const labelOf = (o: SelectOption[], v: string) =>
	o.find((x) => String(x.value) === v)?.label ?? "";

/** Хүлээн авагч: аймаг → сум → сургууль → анги → chip. */
export function RecipientsBuilder({
	schoolId,
	targets,
	onChange,
}: {
	schoolId: number;
	targets: LetterTarget[];
	onChange: (t: LetterTarget[]) => void;
}) {
	const [aimag, setAimag] = useState("0");
	const [sym, setSym] = useState("0");
	const [school, setSchool] = useState("0");
	const [klass, setKlass] = useState("0");

	const aimagQ = useQuery({
		queryKey: teacherKey("letters", "aimag", schoolId),
		queryFn: () => teacherApi.letterAdmin.aimag({ school_id: schoolId }),
	});
	const symQ = useQuery({
		queryKey: teacherKey("letters", "sym", schoolId, aimag),
		queryFn: () =>
			teacherApi.letterAdmin.sym({
				aimag_id: Number(aimag),
				school_id: schoolId,
			}),
		enabled: aimag !== "0",
	});
	const schoolQ = useQuery({
		queryKey: teacherKey("letters", "schools", schoolId, aimag, sym),
		queryFn: () =>
			teacherApi.letterAdmin.schools({
				aimag_id: Number(aimag),
				sym_id: Number(sym),
				school_id: schoolId,
			}),
		enabled: aimag !== "0",
	});
	const classQ = useQuery({
		queryKey: teacherKey("letters", "classes", schoolId, school),
		queryFn: () =>
			teacherApi.letterAdmin.classes({ schooldb: school, school_id: schoolId }),
		enabled: school !== "0",
	});

	const aimagOpts = useMemo(
		() =>
			opts(
				listOf<Row>(aimagQ.data),
				["aimag_id", "AimagID", "id"],
				["aimag_name", "AimagName", "name", "title"],
			),
		[aimagQ.data],
	);
	const symOpts = useMemo(
		() =>
			opts(
				listOf<Row>(symQ.data),
				["sym_id", "SymID", "id"],
				["sym_name", "SymName", "name", "title"],
			),
		[symQ.data],
	);
	const schoolOpts = useMemo(
		() =>
			opts(
				listOf<Row>(schoolQ.data),
				["schooldb", "school_db", "dbname"],
				["school_name", "sch_name", "name", "title"],
			),
		[schoolQ.data],
	);
	const classOpts = useMemo(
		() =>
			opts(
				listOf<Row>(classQ.data),
				["class_id", "id"],
				["class_name", "classname", "name", "title"],
			),
		[classQ.data],
	);

	const countQ = useQuery({
		queryKey: teacherKey("letters", "target-count", schoolId, targets),
		queryFn: () =>
			teacherApi.letterAdmin.targetCount({ targets, school_id: schoolId }),
		enabled: targets.length > 0,
	});
	const count = targets.length
		? num(itemOf<Row>(countQ.data), "count", "cnt", "total")
		: 0;

	const add = () => {
		const parts = [
			aimag === "0" ? "Бүх аймаг" : labelOf(aimagOpts, aimag),
			sym !== "0" && labelOf(symOpts, sym),
			school !== "0" && labelOf(schoolOpts, school),
			klass !== "0" && labelOf(classOpts, klass),
		].filter(Boolean);
		if (aimag !== "0" && sym === "0" && school === "0")
			parts.push("бүх сум, дүүрэг");
		const t: LetterTarget = {
			aimag_id: Number(aimag),
			sym_id: Number(sym),
			schooldb: school === "0" ? "" : school,
			class_id: Number(klass),
			label: parts.join(" › "),
		};
		if (targets.some((x) => targetKey(x) === targetKey(t))) return;
		onChange([...targets, t]);
		setKlass("0");
	};

	return (
		<div className="grid gap-3">
			<div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
				<OptionSelect
					options={aimagOpts}
					value={aimag}
					allLabel="Бүх аймаг, нийслэл"
					onChange={(v) => {
						setAimag(v);
						setSym("0");
						setSchool("0");
						setKlass("0");
					}}
					className="sm:w-full"
				/>
				<OptionSelect
					options={symOpts}
					value={sym}
					allLabel="Бүх сум, дүүрэг"
					disabled={aimag === "0"}
					onChange={(v) => {
						setSym(v);
						setSchool("0");
						setKlass("0");
					}}
					className="sm:w-full"
				/>
				<OptionSelect
					options={schoolOpts}
					value={school}
					allLabel="Бүх сургууль"
					disabled={aimag === "0"}
					onChange={(v) => {
						setSchool(v);
						setKlass("0");
					}}
					className="sm:w-full"
				/>
				<OptionSelect
					options={classOpts}
					value={klass}
					allLabel="Бүх анги"
					disabled={school === "0"}
					onChange={setKlass}
					className="sm:w-full"
				/>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Button type="button" variant="outline" size="sm" onClick={add}>
					<Plus />
					Хүлээн авагч нэмэх
				</Button>
				<span
					className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground tabular-nums"
					aria-live="polite"
				>
					{countQ.isFetching ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Users className="size-4" />
					)}
					Нийт <span className="text-foreground">{count}</span> хүлээн авагч
				</span>
			</div>
			{targets.length > 0 ? (
				<ul className="flex flex-wrap gap-2" aria-label="Сонгосон хүлээн авагч">
					{targets.map((t) => (
						<li
							key={targetKey(t)}
							className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary-soft/60 py-1 pr-1 pl-3 text-xs font-bold text-primary-soft-foreground"
						>
							<span className="truncate">{t.label || targetKey(t)}</span>
							<button
								type="button"
								aria-label={`${t.label ?? ""} хасах`}
								onClick={() =>
									onChange(targets.filter((x) => targetKey(x) !== targetKey(t)))
								}
								className="flex size-5 shrink-0 items-center justify-center rounded-full hover:bg-primary-soft"
							>
								<X className="size-3" />
							</button>
						</li>
					))}
				</ul>
			) : (
				<p className="rounded-xl bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
					Хүлээн авагч сонгоогүй байна. Дээрх шүүлтүүрээр сонгоод "Хүлээн авагч
					нэмэх" дарна уу.
				</p>
			)}
		</div>
	);
}
