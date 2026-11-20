"use client";

import { m } from "framer-motion";
import {
	ArrowRight,
	Calendar,
	ChevronDown,
	Clock,
	Eye,
	EyeOff,
	FileText,
	Target,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	getScoreLevel,
	getScoreTone,
	WEEKDAYS,
} from "@/features/result-list/shared";
import type { SorilresultListItem } from "@/types/soril/sorilResultLists";

interface ExamResultCardProps {
	exam: SorilresultListItem;
	index: number;
	globalShowScore: boolean;
}

/* ------------------------------------------------------------------ */
/* Timeline row                                                        */
/* ------------------------------------------------------------------ */
export const ExamResultCard: React.FC<ExamResultCardProps> = ({
	exam,
	index = 0,
	globalShowScore = false,
}) => {
	const router = useRouter();
	const [localShowScore, setLocalShowScore] = useState(false);
	const [expanded, setExpanded] = useState(false);

	const finished = exam.isfinished === 1;
	const showScore = globalShowScore || localShowScore;
	const examDate = new Date(exam.test_date);
	const _scoreLevel = getScoreLevel(exam.test_perc);
	const validDate = !Number.isNaN(examDate.getTime());

	const formatDate = (d: Date) =>
		`${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
	const formatTime = (d: Date) =>
		`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

	const formatTestTime = (testTime: string | null): string => {
		if (!testTime || testTime === "0" || testTime === "null") {
			return "00:00:00";
		}
		if (testTime.includes(":")) {
			return testTime;
		}
		const minutes = parseInt(testTime, 10);
		if (Number.isNaN(minutes)) return "00:00:00";
		if (minutes === 0) return "00:00:00";
		if (minutes < 60) return `${minutes} мин`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours} цаг ${mins} мин`;
	};

	const iconClass = "size-3.5 shrink-0";
	const score = Math.max(0, Math.min(100, exam.test_perc ?? 0));
	const tone = getScoreTone(score);
	const toggle = () => setExpanded((v) => !v);

	return (
		<m.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.03 }}
			className="relative pl-7 sm:pl-9"
		>
			{/* Timeline dot */}
			<span
				aria-hidden="true"
				className={`absolute top-6 left-[3px] size-3.5 rounded-full border-[3px] border-background ring-2 sm:left-[7px] ${
					finished
						? showScore
							? `${tone.bar} ring-border`
							: "bg-pop-mint ring-pop-mint/30"
						: "bg-muted ring-border"
				}`}
			/>

			<div
				className={`overflow-hidden rounded-2xl border-2 bg-card transition-all ${
					expanded
						? "border-primary/50 shadow-[0_4px_0_0_color-mix(in_oklch,var(--primary)_30%,transparent)]"
						: "border-border shadow-[0_3px_0_0_var(--border)] hover:-translate-y-0.5"
				}`}
			>
				{/* biome-ignore lint/a11y/useSemanticElements: row contains nested buttons */}
				<div
					role="button"
					tabIndex={0}
					aria-expanded={expanded}
					onClick={toggle}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							toggle();
						}
					}}
					className="group flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-accent/40 sm:gap-4 sm:p-4"
				>
					{/* Date block */}
					<div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-pop-mint-soft py-1.5 text-pop-mint-ink">
						<span className="text-lg font-black leading-none tabular-nums">
							{validDate ? examDate.getDate() : "–"}
						</span>
						<span className="mt-0.5 text-[10px] font-bold uppercase">
							{validDate ? WEEKDAYS[examDate.getDay()] : ""}
						</span>
					</div>

					{/* Title + meta */}
					<div className="min-w-0 flex-1">
						<h3
							title={exam.title}
							className="line-clamp-2 break-words text-sm font-extrabold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base"
						>
							{exam.title}
						</h3>
						<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold text-muted-foreground">
							<span className="flex items-center gap-1">
								<Clock className={iconClass} />
								{formatTime(examDate)}
							</span>
							{finished && showScore && (
								<span className="flex items-center gap-1.5">
									<span className="text-success">✓ {exam.correct_ttl}</span>
									<span className="text-destructive">✗ {exam.wrong_ttl}</span>
									<span>/ {exam.test_ttl}</span>
								</span>
							)}
							{!finished && (
								<Badge variant="secondary" className="px-2 py-0 text-[10px]">
									<XCircle className="size-3" />
									Дуусаагүй
								</Badge>
							)}
						</div>

						{/* Score bar (mobile) */}
						{finished && exam.test_perc !== undefined && (
							<div className="mt-2 flex items-center gap-2 sm:hidden">
								<div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
									<div
										className={`h-full rounded-full transition-all duration-700 ${showScore ? tone.bar : "bg-border"}`}
										style={{ width: showScore ? `${score}%` : "25%" }}
									/>
								</div>
								<span
									className={`w-14 text-right text-sm font-black tabular-nums ${showScore ? tone.text : "blur-sm select-none"}`}
								>
									{exam.test_perc?.toFixed(1)}%
								</span>
							</div>
						)}
					</div>

					{/* Score bar (desktop) */}
					{finished && exam.test_perc !== undefined && (
						<div className="hidden w-48 shrink-0 items-center gap-2 sm:flex lg:w-64">
							<div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
								<div
									className={`h-full rounded-full transition-all duration-700 ${showScore ? tone.bar : "bg-border"}`}
									style={{ width: showScore ? `${score}%` : "25%" }}
								/>
							</div>
							<span
								className={`w-16 text-right text-base font-black tabular-nums ${showScore ? tone.text : "blur-md select-none"}`}
							>
								{exam.test_perc?.toFixed(1)}%
							</span>
						</div>
					)}

					{/* Eye toggle */}
					{finished && exam.test_perc !== undefined && (
						<Button
							onClick={(e) => {
								e.stopPropagation();
								setLocalShowScore(!localShowScore);
							}}
							size="icon"
							variant="outline"
							title={showScore ? "Оноо нуух" : "Оноо харуулах"}
							className="size-8 shrink-0 rounded-full p-0 shadow-[0_2px_0_0_var(--border)]"
						>
							{showScore ? (
								<EyeOff className="size-3.5 text-muted-foreground" />
							) : (
								<Eye className="size-3.5 text-primary" />
							)}
						</Button>
					)}

					<ChevronDown
						className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
					/>
				</div>

				{/* Expanded: details + actions */}
				{expanded && (
					<div className="animate-in fade-in-0 slide-in-from-top-1 space-y-3 border-t-2 border-border bg-muted/30 p-3 duration-200 sm:p-4">
						<div className="flex flex-wrap items-center gap-1.5 text-xs">
							<span className="inline-flex items-center gap-1 rounded-full bg-pop-mint-soft px-2.5 py-1 font-bold text-pop-mint-ink">
								<Calendar className={iconClass} />
								{formatDate(examDate)} · {formatTime(examDate)}
							</span>
							{finished && exam.test_time && (
								<span className="inline-flex items-center gap-1 rounded-full bg-pop-sky-soft px-2.5 py-1 font-bold text-pop-sky-ink">
									<Clock className={iconClass} />
									Зарцуулсан хугацаа:{" "}
									<span className="font-black">
										{formatTestTime(exam.test_time)}
									</span>
								</span>
							)}
							{finished && showScore && (
								<>
									<span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 font-bold text-success">
										<Target className={iconClass} />
										{exam.correct_ttl}
									</span>
									<span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 font-bold text-destructive">
										<XCircle className={iconClass} />
										{exam.wrong_ttl}
									</span>
									<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-bold text-muted-foreground">
										Нийт: {exam.test_ttl}
									</span>
								</>
							)}
						</div>

						{finished ? (
							<Button
								onClick={() =>
									router.push(`/sorilResult/${exam.exam_id}_${exam.test_id}`)
								}
								className="group/btn w-full sm:w-auto"
							>
								<FileText className="size-4" />
								Дэлгэрэнгүй үзэх
								<ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
							</Button>
						) : (
							<div className="rounded-2xl border-2 border-dashed border-border bg-card px-3 py-2 text-center">
								<XCircle className="mx-auto mb-0.5 size-4 text-muted-foreground" />
								<p className="text-xs font-bold text-muted-foreground">
									Сорил дуусаагүй
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</m.div>
	);
};

export default ExamResultCard;
