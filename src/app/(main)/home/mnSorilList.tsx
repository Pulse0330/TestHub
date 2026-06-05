"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
	Activity,
	ArrowRight,
	Binary,
	ChevronRight,
	Code2,
	Compass,
	Cpu,
	Layers,
	Orbit,
	Radio,
	ShieldX,
	Terminal,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo } from "react";

// ── Types ────────────────────────────────────────────────────────
interface AdItem {
	title: string;
	descr: string;
	url: string;
	filename?: string;
}

interface CourseItem {
	planid: number;
	title: string;
	catname: string;
	amount: number;
	rate: number;
	ispay: number;
}

interface ExamItem {
	exam_id: number;
	soril_name: string;
	filename: string;
	que_cnt: number;
	isopensoril: number;
}

interface DashboardData {
	RetDataFirst?: AdItem[];
	RetDataSecond?: CourseItem[];
	RetDataFourth?: ExamItem[];
}

// ── Lesson theme ─────────────────────────────────────────────────
const getLessonTheme = (title: string) => {
	const name = title.toLowerCase();
	if (name.includes("мат")) return {
		glow: "hover:shadow-cyan-500/10 hover:border-cyan-500/30",
		text: "text-cyan-500 dark:text-cyan-400",
		bg: "bg-cyan-500/10",
		icon: Cpu,
	};
	if (name.includes("физ")) return {
		glow: "hover:shadow-fuchsia-500/10 hover:border-fuchsia-500/30",
		text: "text-fuchsia-500 dark:text-fuchsia-400",
		bg: "bg-fuchsia-500/10",
		icon: Orbit,
	};
	if (name.includes("англи")) return {
		glow: "hover:shadow-amber-500/10 hover:border-amber-500/30",
		text: "text-amber-500 dark:text-amber-400",
		bg: "bg-amber-500/10",
		icon: Terminal,
	};
	return {
		glow: "hover:shadow-emerald-500/10 hover:border-emerald-500/30",
		text: "text-emerald-500 dark:text-emerald-400",
		bg: "bg-emerald-500/10",
		icon: Code2,
	};
};

// ── Banner ───────────────────────────────────────────────────────
const PremiumPromoBanner = memo(({ item }: { item: AdItem }) => (
	<motion.div
		initial={{ opacity: 0, y: 10 }}
		animate={{ opacity: 1, y: 0 }}
		className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
	>
		<div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
		<div className="flex-1 space-y-4 z-10">
			<div className="inline-flex items-center gap-2 bg-neutral-800 border border-neutral-700 px-3 py-1 rounded-md text-[10px] font-mono tracking-widest text-neutral-300">
				<Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> LIVE ZAR
			</div>
			<h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">{item.title}</h2>
			<p className="text-neutral-400 text-xs md:text-sm leading-relaxed max-w-xl whitespace-pre-line">{item.descr}</p>
			<a
				href={item.url}
				target="_blank"
				rel="noreferrer"
				className="inline-flex items-center gap-1.5 bg-white text-black hover:bg-neutral-200 font-mono text-xs px-4 py-2.5 rounded-lg transition-all font-bold"
			>
				ХОЛБОГДОХ <ArrowRight className="w-3.5 h-3.5" />
			</a>
		</div>
		{item.filename && (
			<div className="relative w-full md:w-52 h-32 rounded-xl overflow-hidden border border-neutral-800 shadow-xl flex-shrink-0">
				<Image src={item.filename} alt="Promo" fill className="object-cover" />
			</div>
		)}
	</motion.div>
));
PremiumPromoBanner.displayName = "PremiumPromoBanner";

// ── Course Card ──────────────────────────────────────────────────
const NeonCourseCard = memo(({ item }: { item: CourseItem }) => {
	const theme = getLessonTheme(item.title);
	const LessonLogo = theme.icon;

	return (
		<div className={`group relative flex flex-col justify-between rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-950 p-4 transition-all duration-200 ${theme.glow}`}>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className={`w-9 h-9 rounded-lg ${theme.bg} ${theme.text} flex items-center justify-center transform -skew-x-6 transition-transform duration-500 group-hover:rotate-[360deg]`}>
						<LessonLogo className="w-4 h-4 skew-x-6 stroke-[2]" />
					</div>
					<div className="flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-200/50 dark:border-neutral-800">
						<Activity className="w-3 h-3 text-emerald-500" /> {item.rate}
					</div>
				</div>
				<div>
					<h4 className="font-bold text-xs md:text-sm text-neutral-800 dark:text-neutral-200 line-clamp-2 min-h-[38px]">
						{item.title}
					</h4>
					<p className="text-[10px] font-mono text-neutral-400 mt-1 truncate">{item.catname}</p>
				</div>
			</div>
			<div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between">
				<span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
					{item.amount > 0 ? `${item.amount.toLocaleString()}₮` : "0₮"}
				</span>
				<span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
					item.ispay
						? "bg-neutral-900 text-white dark:bg-neutral-800 border-transparent"
						: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
				}`}>
					{item.ispay ? "Premium" : "Free"}
				</span>
			</div>
		</div>
	);
});
NeonCourseCard.displayName = "NeonCourseCard";

// ── Soril Row ─────────────────────────────────────────────────────
const ModernSorilRow = memo(({ item }: { item: ExamItem }) => {
	const router = useRouter();
	return (
		<div className="group flex items-center justify-between p-3 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-400 dark:hover:border-neutral-700 transition-all">
			<div className="flex items-center gap-3 min-w-0">
				<div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex-shrink-0 border border-neutral-200 dark:border-neutral-800">
					<Image src={item.filename} alt="" fill className="object-cover" />
				</div>
				<div className="min-w-0">
					<h5 className="font-bold text-xs md:text-sm text-neutral-800 dark:text-neutral-200 truncate">
						{item.soril_name}
					</h5>
					<div className="flex items-center gap-3 text-[10px] font-mono text-neutral-400 mt-0.5">
						<span className="flex items-center gap-1">
							<Binary className="w-3 h-3 text-neutral-400" /> {item.que_cnt} Q-DATA
						</span>
						{item.isopensoril === 1 && (
							<span className="text-cyan-500 dark:text-cyan-400 font-bold uppercase tracking-wider text-[9px]">Нээлттэй</span>
						)}
					</div>
				</div>
			</div>
			<button
				type="button"
				onClick={() => router.push(`/exam/${item.exam_id}`)}
				className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-50 dark:bg-neutral-900 group-hover:bg-black dark:group-hover:bg-white text-neutral-500 group-hover:text-white dark:group-hover:text-black transition-all"
			>
				<ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
			</button>
		</div>
	);
});
ModernSorilRow.displayName = "ModernSorilRow";

// ── Main ──────────────────────────────────────────────────────────
export default function MnDashboard() {
	const { data, isLoading, isError } = useQuery<DashboardData>({
		queryKey: ["mainDashboardData"],
		queryFn: async () => {
			const res = await fetch("/api/dashboard");
			return res.json();
		},
		staleTime: 5 * 60 * 1000,
	});

	if (isLoading) {
		return (
			<div className="max-w-7xl mx-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
				{Array.from({ length: 4 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
					<div key={i} className="h-36 bg-neutral-100 dark:bg-neutral-900 rounded-xl" />
				))}
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex flex-col items-center justify-center py-20 gap-2 text-neutral-400">
				<ShieldX className="w-10 h-10 text-rose-500" />
				<p className="text-xs font-mono tracking-widest uppercase">System Error 500</p>
			</div>
		);
	}

	const ads = data?.RetDataFirst ?? [];
	const courses = data?.RetDataSecond ?? [];
	const exams = data?.RetDataFourth ?? [];

	return (
		<div className="max-w-7xl mx-auto p-4 md:p-6 space-y-10 min-h-screen">
			{ads.length > 0 && <PremiumPromoBanner item={ads[0]} />}

			{courses.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Compass className="w-4 h-4 text-neutral-500" />
						<h3 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-400">
							/ Сонгон бэлтгэх хөтөлбөрүүд
						</h3>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{courses.map((course) => (
							<NeonCourseCard key={course.planid} item={course} />
						))}
					</div>
				</div>
			)}

			{exams.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Layers className="w-4 h-4 text-neutral-500" />
						<h3 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-400">
							/ Албан ёсны жишиг сорилууд
						</h3>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{exams.map((exam) => (
							<ModernSorilRow key={exam.exam_id} item={exam} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}