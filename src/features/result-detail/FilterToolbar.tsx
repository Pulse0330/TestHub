"use client";

import { ChevronsDownUp, ChevronsUpDown, X, XCircle, Zap } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import type { AnswerStatus } from "./scoring";
import type { AnswerFilter } from "./status";

interface FilterToolbarProps {
	reviewMode: boolean;
	answerFilter: AnswerFilter;
	onFilterChange: (filter: AnswerFilter) => void;
	totalCount: number;
	filterCounts: Record<AnswerStatus, number>;
	wrongCount: number;
	safeReviewIdx: number;
	onExpandAll: () => void;
	onCollapseAll: () => void;
	onToggleReview: () => void;
}

/** Наалддаг шүүлтүүр/удирдлагын мөр. */
export const FilterToolbar = memo(function FilterToolbar({
	reviewMode,
	answerFilter,
	onFilterChange,
	totalCount,
	filterCounts,
	wrongCount,
	safeReviewIdx,
	onExpandAll,
	onCollapseAll,
	onToggleReview,
}: FilterToolbarProps) {
	const filterOptions: {
		key: AnswerFilter;
		label: string;
		active: string;
		count: number;
	}[] = [
		{
			key: "all",
			label: "Бүгд",
			active:
				"border-primary-soft-shade bg-primary-soft text-primary-soft-foreground",
			count: totalCount,
		},
		{
			key: "correct",
			label: "Зөв",
			active: "border-success bg-success text-primary-foreground",
			count: filterCounts.correct,
		},
		{
			key: "partial",
			label: "Дутуу",
			active: "border-pop-sun bg-pop-sun-soft text-pop-sun-ink",
			count: filterCounts.partial,
		},
		{
			key: "wrong",
			label: "Буруу",
			active: "border-destructive bg-destructive text-primary-foreground",
			count: filterCounts.incorrect,
		},
		{
			key: "unanswered",
			label: "Хариулаагүй",
			active: "border-foreground/40 bg-muted text-foreground",
			count: filterCounts.unanswered,
		},
	];

	return (
		<div className="sticky top-[4.5rem] z-20 rounded-3xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_var(--border)]">
			<div className="flex flex-wrap items-center gap-2">
				{!reviewMode && (
					<div className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 scrollbar-none">
						{filterOptions.map((opt) => (
							<button
								key={opt.key}
								type="button"
								onClick={() => onFilterChange(opt.key)}
								className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition-all active:translate-y-0.5 ${
									answerFilter === opt.key
										? opt.active
										: "border-border bg-card text-muted-foreground hover:bg-accent"
								}`}
							>
								{opt.label}
								<span
									className={`rounded-full px-1.5 text-xs font-black tabular-nums ${
										answerFilter === opt.key ? "bg-background/25" : "bg-muted"
									}`}
								>
									{opt.count}
								</span>
							</button>
						))}
					</div>
				)}
				{reviewMode && (
					<div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-extrabold text-destructive">
						<XCircle className="size-5 shrink-0" />
						<span className="truncate">
							Алдаатай хариулт {wrongCount > 0 ? safeReviewIdx + 1 : 0} /{" "}
							{wrongCount}
						</span>
					</div>
				)}
				<div className="flex flex-wrap items-center gap-2">
					{!reviewMode && (
						<>
							<Button variant="ghost" size="sm" onClick={onExpandAll}>
								<ChevronsUpDown className="size-4" />
								Бүгдийг нээх
							</Button>
							<Button variant="ghost" size="sm" onClick={onCollapseAll}>
								<ChevronsDownUp className="size-4" />
								Бүгдийг хаах
							</Button>
						</>
					)}
					<Button
						variant={reviewMode ? "outline" : "destructive"}
						size="sm"
						disabled={!reviewMode && wrongCount === 0}
						onClick={onToggleReview}
					>
						{reviewMode ? <X className="size-4" /> : <Zap className="size-4" />}
						{reviewMode ? "Гарах" : "Алдаатай хариултуудаар явах"}
					</Button>
				</div>
			</div>
		</div>
	);
});
