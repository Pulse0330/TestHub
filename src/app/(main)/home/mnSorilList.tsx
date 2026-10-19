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
import { Skeleton } from "@/components/ui/skeleton";

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
		glow: "hover:border-pop-sky",
		text: "text-pop-sky-ink",
		bg: "bg-pop-sky-soft",
		icon: Cpu,
	};
	if (name.includes("физ")) return {
		glow: "hover:border-pop-pink",
		text: "text-pop-pink-ink",
		bg: "bg-pop-pink-soft",
		icon: Orbit,
	};
	if (name.includes("англи")) return {
		glow: "hover:border-pop-sun",
		text: "text-pop-sun-ink",
		bg: "bg-pop-sun-soft",
		icon: Terminal,
	};
	return {
		glow: "hover:border-pop-mint",
		text: "text-pop-mint-ink",
		bg: "bg-pop-mint-soft",
		icon: Code2,
	};
};

// ── Banner ───────────────────────────────────────────────────────
const PremiumPromoBanner = memo(({ item }: { item: AdItem }) => (
	<motion.div
		initial={{ opacity: 0, y: 10 }}
		animate={{ opacity: 1, y: 0 }}
		className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-pop-sky to-pop-violet p-6 text-white shadow-[0_6px_0_0_color-mix(in_oklch,var(--pop-violet)_45%,transparent)] md:flex-row md:p-8"
	>
		<div aria-hidden className="pointer-events-none absolute inset-0">
			<div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
			<div className="absolute -bottom-14 left-1/3 size-32 rounded-full bg-white/10" />
		</div>
		<div className="z-10 flex-1 space-y-4">
			<div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold tracking-wide">
				<Radio className="size-3.5 animate-pulse text-pop-sun" strokeWidth={2.75} /> LIVE ZAR
			</div>
			<h2 className="text-xl font-black uppercase tracking-tight md:text-2xl">{item.title}</h2>
			<p className="max-w-xl whitespace-pre-line text-xs font-semibold leading-relaxed text-primary-foreground/85 md:text-sm">{item.descr}</p>
			<a
				href={item.url}
				target="_blank"
				rel="noreferrer"
				className="inline-flex items-center gap-1.5 rounded-xl bg-card px-4 py-2.5 text-xs font-extrabold text-foreground shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_55%,black)] transition-all hover:bg-accent active:translate-y-0.5"
			>
				ХОЛБОГДОХ <ArrowRight className="size-3.5" strokeWidth={2.75} />
			</a>
		</div>
		{item.filename && (
			<div className="relative z-10 h-32 w-full flex-shrink-0 overflow-hidden rounded-2xl border-4 border-white/30 md:w-52">
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
		<div className={`group card-pop lift relative flex flex-col justify-between p-4 ${theme.glow}`}>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className={`flex size-11 items-center justify-center rounded-xl ${theme.bg} ${theme.text} transition-transform duration-300 group-hover:rotate-6`}>
						<LessonLogo className="size-5" strokeWidth={2.5} />
					</div>
					<div className="flex items-center gap-1 rounded-full bg-pop-sun-soft px-2 py-0.5 text-[11px] font-extrabold text-pop-sun-ink">
						<Activity className="size-3" strokeWidth={2.75} /> {item.rate}
					</div>
				</div>
				<div>
					<h4 className="line-clamp-2 min-h-[38px] text-xs font-extrabold md:text-sm">
						{item.title}
					</h4>
					<p className="mt-1 truncate text-[11px] font-semibold text-muted-foreground">{item.catname}</p>
				</div>
			</div>
			<div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-border pt-3">
				<span className="text-sm font-black">
					{item.amount > 0 ? `${item.amount.toLocaleString()}₮` : "0₮"}
				</span>
				<span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
					item.ispay
						? "bg-pop-violet-soft text-pop-violet-ink"
						: "bg-pop-mint-soft text-pop-mint-ink"
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
		<div className="group card-pop lift flex items-center justify-between gap-3 p-3">
			<div className="flex min-w-0 items-center gap-3">
				<div className="relative size-12 flex-shrink-0 overflow-hidden rounded-xl bg-pop-sky-soft">
					<Image src={item.filename} alt="" fill className="object-cover" />
				</div>
				<div className="min-w-0">
					<h5 className="truncate text-xs font-extrabold md:text-sm">
						{item.soril_name}
					</h5>
					<div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
						<span className="inline-flex items-center gap-1 rounded-full bg-pop-mint-soft px-2 py-0.5 font-bold text-pop-mint-ink">
							<Binary className="size-3" strokeWidth={2.5} /> {item.que_cnt} Q-DATA
						</span>
						{item.isopensoril === 1 && (
							<span className="rounded-full bg-pop-sky-soft px-2 py-0.5 font-extrabold uppercase tracking-wide text-pop-sky-ink">Нээлттэй</span>
						)}
					</div>
				</div>
			</div>
			<button
				type="button"
				onClick={() => router.push(`/exam/${item.exam_id}`)}
				className="flex size-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground"
			>
				<ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.75} />
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
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
					<Skeleton key={i} className="h-36 rounded-3xl" />
				))}
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
				<div className="flex size-16 items-center justify-center rounded-full bg-pop-coral-soft text-pop-coral-ink">
					<ShieldX className="size-8" strokeWidth={2.5} />
				</div>
				<p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">System Error 500</p>
			</div>
		);
	}

	const ads = data?.RetDataFirst ?? [];
	const courses = data?.RetDataSecond ?? [];
	const exams = data?.RetDataFourth ?? [];

	return (
		<div className="@container space-y-4">
			{/* Bento: promo + soril list side by side, courses as a scroll strip */}
			<div className="grid grid-cols-1 gap-4 @4xl:grid-cols-5">
				{ads.length > 0 && (
					<div className={exams.length > 0 ? "@4xl:col-span-3" : "@4xl:col-span-5"}>
						<PremiumPromoBanner item={ads[0]} />
					</div>
				)}

				{exams.length > 0 && (
					<div className={`flex flex-col gap-3 rounded-3xl border-2 border-border bg-card p-4 shadow-[0_4px_0_0_var(--border)] ${ads.length > 0 ? "@4xl:col-span-2" : "@4xl:col-span-5"}`}>
						<div className="flex items-center gap-2.5">
							<span className="flex size-9 items-center justify-center rounded-xl bg-pop-sky-soft text-pop-sky-ink">
								<Layers className="size-[18px]" strokeWidth={2.5} />
							</span>
							<h3 className="text-base font-black tracking-tight">
								Албан ёсны жишиг сорилууд
							</h3>
							<span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-extrabold text-primary-foreground">
								{exams.length}
							</span>
						</div>
						<div className="-mx-1 max-h-[22rem] space-y-2 overflow-y-auto px-1 pb-1">
							{exams.map((exam) => (
								<ModernSorilRow key={exam.exam_id} item={exam} />
							))}
						</div>
					</div>
				)}
			</div>

			{courses.length > 0 && (
				<div className="space-y-3 rounded-3xl border-2 border-border bg-card p-4 shadow-[0_4px_0_0_var(--border)]">
					<div className="flex items-center gap-2.5">
						<span className="flex size-9 items-center justify-center rounded-xl bg-pop-mint-soft text-pop-mint-ink">
							<Compass className="size-[18px]" strokeWidth={2.5} />
						</span>
						<h3 className="text-base font-black tracking-tight">
							Сонгон бэлтгэх хөтөлбөрүүд
						</h3>
					</div>
					<div className="scrollbar-none -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
						{courses.map((course) => (
							<div key={course.planid} className="w-44 shrink-0 snap-start sm:w-52">
								<NeonCourseCard item={course} />
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
