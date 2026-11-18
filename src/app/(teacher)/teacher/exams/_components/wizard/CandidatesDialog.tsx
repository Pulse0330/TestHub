"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import MathContent from "@/components/MathContent";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
	EmptyState,
	FilterBar,
	FormDialog,
	OptionSelect,
	Pagination,
	StatusPill,
} from "@/features/teacher/components";
import { pagedOf, teacherKey, useTeacher } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
	LEVELS,
	num,
	optionLabel,
	QUE_TYPES,
	queTypeLabel,
	type Row,
	str,
} from "../shared";
import type { RuleRow } from "./RulesStep";

const PAGE_SIZE = 10;
const qidOf = (r: Row) => num(r, "question_id", "que_id", "id");

/** test_all_list — эх сурвалжаас асуултыг гараар сонгох. */
export function CandidatesDialog({
	rule,
	onClose,
	onApply,
}: {
	rule: RuleRow | null;
	onClose: () => void;
	onApply: (ids: number[]) => void;
}) {
	const { userId } = useTeacher();
	const [queType, setQueType] = useState("0");
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<Set<number>>(new Set());

	useEffect(() => {
		if (rule) {
			setSelected(new Set(rule.question_ids ?? []));
			setPage(1);
		}
	}, [rule]);

	const params = rule
		? {
				user_id: userId,
				lesson_id: rule.lesson_id,
				sub: rule.sub,
				que_type_id: Number(queType) || undefined,
				page,
				size: PAGE_SIZE,
			}
		: null;
	const { data, isLoading } = useQuery({
		queryKey: teacherKey("exam-candidates", params),
		queryFn: () =>
			teacherApi.exam.test.candidates(params as NonNullable<typeof params>),
		enabled: !!params && !!userId,
		placeholderData: keepPreviousData,
	});
	const paged = pagedOf<Row>(data);

	const toggle = (id: number) =>
		setSelected((s) => {
			const n = new Set(s);
			if (n.has(id)) n.delete(id);
			else n.add(id);
			return n;
		});

	return (
		<FormDialog
			open={rule !== null}
			onOpenChange={(o) => !o && onClose()}
			title="Асуулт гараар сонгох"
			description={rule ? `${rule.lesson_name} · ${rule.sub_name}` : ""}
			size="xl"
			submitLabel={`${selected.size} асуулт сонгох`}
			onSubmit={() => onApply([...selected])}
		>
			<FilterBar>
				<OptionSelect
					options={QUE_TYPES}
					value={queType}
					onChange={(v) => {
						setQueType(v);
						setPage(1);
					}}
					allLabel="Бүх хэлбэр"
					className="sm:w-48"
				/>
				{selected.size > 0 && (
					<button
						type="button"
						onClick={() => setSelected(new Set())}
						className="text-sm font-bold text-primary hover:underline sm:ml-auto"
					>
						Сонголт цэвэрлэх
					</button>
				)}
			</FilterBar>
			{isLoading ? (
				<div className="grid gap-2">
					{["a", "b", "c", "d"].map((k) => (
						<Skeleton key={k} className="h-20 rounded-2xl" />
					))}
				</div>
			) : paged.rows.length === 0 ? (
				<EmptyState text="Асуулт олдсонгүй" />
			) : (
				<ul className="grid gap-2">
					{paged.rows.map((r) => {
						const id = qidOf(r);
						const on = selected.has(id);
						return (
							<li key={id}>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox label дотор байна */}
								<label
									className={cn(
										"flex cursor-pointer gap-3 rounded-2xl border p-3 transition-colors",
										on
											? "border-primary/40 bg-primary-soft/30"
											: "border-border hover:bg-muted/40",
									)}
								>
									<Checkbox
										checked={on}
										onCheckedChange={() => toggle(id)}
										className="mt-0.5"
										aria-label={`Асуулт ${id} сонгох`}
									/>
									<div className="min-w-0 flex-1">
										<div className="mb-1 flex flex-wrap gap-1.5">
											<StatusPill>
												{str(r, "que_type_name") ||
													queTypeLabel(num(r, "que_type_id"))}
											</StatusPill>
											{num(r, "que_level_id") > 0 && (
												<StatusPill tone="sky">
													{str(r, "que_level_name") ||
														optionLabel(LEVELS, num(r, "que_level_id"))}
												</StatusPill>
											)}
											<span className="text-xs font-bold text-muted-foreground tabular-nums">
												#{id}
											</span>
										</div>
										<div className="line-clamp-3 text-sm">
											<MathContent
												html={str(
													r,
													"question_html",
													"question_name",
													"que_html",
													"title",
												)}
											/>
										</div>
									</div>
								</label>
							</li>
						);
					})}
				</ul>
			)}
			<Pagination
				page={page}
				size={PAGE_SIZE}
				total={paged.total}
				onPageChange={setPage}
			/>
		</FormDialog>
	);
}
