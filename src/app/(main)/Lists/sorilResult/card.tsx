"use client";

import { motion } from "framer-motion";
import {
	ArrowRight,
	Award,
	Calendar,
	ChevronDown,
	Clock,
	Eye,
	EyeOff,
	FileText,
	Hash,
	Target,
	TrendingUp,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SorilresultListItem } from "@/types/soril/sorilResultLists";

interface ExamResultCardProps {
	exam: SorilresultListItem;
	index: number;
	globalShowScore: boolean;
}

const getScoreLevel = (score?: number) => {
	if (!score) return "none";
	if (score >= 90) return "excellent";
	if (score >= 75) return "good";
	if (score >= 60) return "average";
	if (score >= 40) return "pass";
	return "fail";
};

// Онооны өнгө: өндөр = success, дунд = warning, бага = destructive
export const getScoreTone = (score?: number) => {
	const v = score ?? 0;
	if (v >= 75)
		return { fill: "var(--success)", bar: "bg-success", text: "text-success" };
	if (v >= 50)
		return {
			fill: "var(--warning)",
			bar: "bg-warning",
			text: "text-pop-sun-ink",
		};
	return {
		fill: "var(--destructive)",
		bar: "bg-destructive",
		text: "text-destructive",
	};
};

const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

export const monthKeyOf = (d: Date) =>
	Number.isNaN(d.getTime())
		? "none"
		: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const monthLabelOf = (d: Date) =>
	Number.isNaN(d.getTime())
		? "Огноогүй"
		: `${d.getFullYear()} оны ${d.getMonth() + 1}-р сар`;

/* ------------------------------------------------------------------ */
/* Summary strip: average / best / count + recent score bars          */
/* ------------------------------------------------------------------ */
export const ResultSummaryStrip: React.FC<{
	avgScore: number;
	highScore: number;
	finishedCount: number;
	totalCount: number;
	unit: string;
	recent: { id: number; title: string; score: number }[];
	showScore: boolean;
}> = ({
	avgScore,
	highScore,
	finishedCount,
	totalCount,
	unit,
	recent,
	showScore,
}) => {
	const blur = showScore ? "" : "blur-md select-none";
	const tiles = [
		{
			key: "avg",
			icon: TrendingUp,
			value: `${avgScore}%`,
			label: "Дундаж үр дүн",
			tone: "bg-pop-mint-soft text-pop-mint-ink",
			hideable: true,
		},
		{
			key: "high",
			icon: Award,
			value: `${highScore}%`,
			label: "Хамгийн өндөр",
			tone: "bg-pop-sun-soft text-pop-sun-ink",
			hideable: true,
		},
		{
			key: "count",
			icon: Hash,
			value: `${finishedCount}/${totalCount}`,
			label: `Дууссан ${unit}`,
			tone: "bg-pop-sky-soft text-pop-sky-ink",
			hideable: false,
		},
	];
	const barW = 14;
	const gap = 6;
	const h = 64;
	const w = Math.max(1, recent.length) * (barW + gap) - gap;

	return (
		<section className="card-pop grid animate-pop-in gap-4 p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:p-5">
			<div className="grid grid-cols-3 gap-2 sm:gap-3">
				{tiles.map((t) => (
					<div key={t.key} className={`rounded-2xl p-3 sm:p-4 ${t.tone}`}>
						<t.icon className="mb-2 size-5" strokeWidth={2.5} />
						<div
							className={`text-xl font-black leading-none tabular-nums sm:text-2xl ${t.hideable ? blur : ""}`}
						>
							{t.value}
						</div>
						<div className="mt-1 text-[10px] font-bold uppercase tracking-wide sm:text-xs">
							{t.label}
						</div>
					</div>
				))}
			</div>

			<div className="flex min-w-0 flex-col rounded-2xl bg-muted/60 p-3 sm:p-4">
				<div className="mb-2 flex items-center justify-between gap-2">
					<span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
						Сүүлийн {recent.length} үр дүн
					</span>
					<div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
						<span className="flex items-center gap-1">
							<span className="size-2 rounded-full bg-success" />
							75+
						</span>
						<span className="flex items-center gap-1">
							<span className="size-2 rounded-full bg-warning" />
							50+
						</span>
						<span className="flex items-center gap-1">
							<span className="size-2 rounded-full bg-destructive" />
							&lt;50
						</span>
					</div>
				</div>
				{recent.length > 0 ? (
					<svg
						viewBox={`0 0 ${w} ${h}`}
						preserveAspectRatio="xMinYMax meet"
						className="h-20 w-full"
						role="img"
						aria-label="Сүүлийн үр дүнгийн график"
					>
						<line
							x1={0}
							x2={w}
							y1={h * 0.5}
							y2={h * 0.5}
							stroke="var(--border)"
							strokeDasharray="3 3"
							strokeWidth={1}
						/>
						{recent.map((r, i) => {
							const pct = Math.max(0, Math.min(100, r.score));
							const bh = showScore ? Math.max(3, (pct / 100) * h) : h * 0.35;
							return (
								<rect
									key={r.id}
									x={i * (barW + gap)}
									y={h - bh}
									width={barW}
									height={bh}
									rx={4}
									fill={showScore ? getScoreTone(pct).fill : "var(--border)"}
									className="transition-all duration-700"
								>
									<title>
										{showScore ? `${r.title}: ${pct.toFixed(1)}%` : r.title}
									</title>
								</rect>
							);
						})}
					</svg>
				) : (
					<p className="py-6 text-center text-sm font-semibold text-muted-foreground">
						Дууссан {unit} алга
					</p>
				)}
			</div>
		</section>
	);
};

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
		<motion.div
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
		</motion.div>
	);
};

export default ExamResultCard;
