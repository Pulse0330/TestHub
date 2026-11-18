"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { OptionSelect } from "@/features/teacher/components";
import { listOf } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { bannersKey, type Row, str } from "../_lib/shared";

export interface BannerTarget {
	aimag_id: number;
	sym_id: number;
	label: string;
}

const key = (t: { aimag_id: number; sym_id: number }) =>
	`${t.aimag_id}|${t.sym_id}`;

/** Чиглүүлэлт: аймаг сонгоод сумдыг chip-ээр олноор сонгоно (sym 0 = бүгд). */
export function TargetPicker({
	targets,
	onChange,
}: {
	targets: BannerTarget[];
	onChange: (t: BannerTarget[]) => void;
}) {
	const [aimag, setAimag] = useState("");

	const aimagQ = useQuery({
		queryKey: bannersKey("aimag"),
		queryFn: () => teacherApi.banner.aimag(),
	});
	const symQ = useQuery({
		queryKey: bannersKey("sym", aimag),
		queryFn: () => teacherApi.banner.sym({ aimag_id: Number(aimag) }),
		enabled: !!aimag,
	});

	const aimags = useMemo(
		() =>
			listOf<Row>(aimagQ.data)
				.map((r) => ({
					value: str(r, "aimag_id", "AimagID", "id"),
					label: str(r, "aimag_name", "AimagName", "name", "title"),
				}))
				.filter((o) => o.value),
		[aimagQ.data],
	);
	const syms = useMemo(
		() =>
			listOf<Row>(symQ.data)
				.map((r) => ({
					id: Number(str(r, "sym_id", "SymID", "id")),
					name: str(r, "sym_name", "SymName", "name", "title"),
				}))
				.filter((s) => s.id > 0),
		[symQ.data],
	);
	const aimagName = aimags.find((a) => a.value === aimag)?.label ?? "";
	const selected = new Set(targets.map(key));

	const toggle = (symId: number, symName: string) => {
		const aimagId = Number(aimag);
		const t = { aimag_id: aimagId, sym_id: symId };
		if (selected.has(key(t))) {
			onChange(targets.filter((x) => key(x) !== key(t)));
			return;
		}
		const label =
			symId === 0 ? `${aimagName} (бүгд)` : `${aimagName} › ${symName}`;
		// "Бүгд" сонговол тухайн аймгийн сумдыг, сум сонговол "бүгд"-ийг хасна
		const rest = targets.filter(
			(x) => x.aimag_id !== aimagId || (symId === 0 ? false : x.sym_id !== 0),
		);
		onChange([...rest, { ...t, label }]);
	};

	const chip = (id: number, name: string) => {
		const on = selected.has(key({ aimag_id: Number(aimag), sym_id: id }));
		return (
			<button
				key={id}
				type="button"
				aria-pressed={on}
				onClick={() => toggle(id, name)}
				className={cn(
					"inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors",
					on
						? "border-primary-soft-shade bg-primary-soft text-primary-soft-foreground"
						: "border-border text-muted-foreground hover:text-foreground",
				)}
			>
				{on && <Check className="size-3" />}
				{name}
			</button>
		);
	};

	return (
		<div className="grid gap-3">
			<OptionSelect
				options={aimags}
				value={aimag}
				onChange={setAimag}
				placeholder="Аймаг, нийслэл сонгох"
				className="sm:w-full"
			/>
			{aimag && (
				<div className="max-h-40 overflow-y-auto rounded-xl border border-border p-2">
					{symQ.isLoading ? (
						<Loader2 className="m-2 size-4 animate-spin text-muted-foreground" />
					) : (
						<div className="flex flex-wrap gap-1.5">
							{chip(0, "Бүх сум, дүүрэг")}
							{syms.map((s) => chip(s.id, s.name))}
						</div>
					)}
				</div>
			)}
			{targets.length > 0 ? (
				<ul className="flex flex-wrap gap-1.5" aria-label="Сонгосон бүс">
					{targets.map((t) => (
						<li
							key={key(t)}
							className="inline-flex items-center gap-1 rounded-full bg-primary-soft/60 py-1 pr-1 pl-2.5 text-xs font-bold text-primary-soft-foreground"
						>
							{t.label}
							<button
								type="button"
								aria-label={`${t.label} хасах`}
								onClick={() =>
									onChange(targets.filter((x) => key(x) !== key(t)))
								}
								className="flex size-5 items-center justify-center rounded-full hover:bg-primary-soft"
							>
								<X className="size-3" />
							</button>
						</li>
					))}
				</ul>
			) : (
				<p className="text-xs font-semibold text-muted-foreground">
					Бүс сонгоогүй бол бүх хэрэглэгчид харагдана.
				</p>
			)}
		</div>
	);
}
