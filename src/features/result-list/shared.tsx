"use client";

import { Award, Hash, TrendingUp } from "lucide-react";
import type React from "react";

/* Шалгалт болон сорилын дүнгийн жагсаалтад хуваалцах туслах функц/компонент */

export const getScoreLevel = (score?: number) => {
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

export const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

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
