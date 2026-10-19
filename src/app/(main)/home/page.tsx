"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
	ArrowRight,
	BookOpen,
	ChevronRight,
	ClipboardCheck,
	Clock,
	Dumbbell,
	FileText,
	Loader2,
	Lock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	getHomeScreen,
	getMNPrint,
	getmnExamUserCheck,
	getUserProfile,
} from "@/lib/api";
import { getExamTime } from "@/lib/dash.api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import type { Exam1111 } from "@/types/dashboard/exam.types";
import {
	type HomeResponseType,
	isSorilCompleted,
	type PastExam,
} from "@/types/home";
import type { UserProfileResponseType } from "@/types/user";
import ExamLists, { NextExamHero, pickNextExam } from "./homeExamCard";

const ANIMATION_STAGGER = 0.04;

// Bento tile base: 2px border + 3D bottom shadow
const TILE = "rounded-3xl border-2 border-border bg-card shadow-[0_4px_0_0_var(--border)]";

// ============================================================================
// BENTO TILE — motion wrapper with grid placement
// ============================================================================
interface BentoTileProps {
	className?: string;
	delay?: number;
	children: React.ReactNode;
}

const BentoTile = ({ className, delay = 0, children }: BentoTileProps) => (
	<motion.div
		initial={{ opacity: 0, y: 10, scale: 0.98 }}
		animate={{ opacity: 1, y: 0, scale: 1 }}
		transition={{ duration: 0.35, delay }}
		className={cn("min-w-0", className)}
	>
		{children}
	</motion.div>
);

// ============================================================================
// GREETING TILE — compact, name + date + friendly line
// ============================================================================
const MN_WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"] as const;

function useToday() {
	const [today, setToday] = useState<Date | null>(null);
	useEffect(() => setToday(new Date()), []);
	return today;
}

const GreetingTile = memo(({ username }: { username: string }) => {
	const today = useToday();
	const dateLabel = today
		? `${today.getFullYear()} оны ${today.getMonth() + 1}-р сарын ${today.getDate()}, ${MN_WEEKDAYS[today.getDay()]}`
		: "";

	return (
		<div className={cn(TILE, "relative flex h-full items-center gap-4 overflow-hidden p-4 sm:p-5")}>
			<div aria-hidden className="pointer-events-none absolute inset-0 bg-dots opacity-40" />
			<div aria-hidden className="relative hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-pop-sun-soft text-3xl shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_35%,transparent)] min-[400px]:flex animate-float">
				👋
			</div>
			<div className="relative min-w-0 flex-1 space-y-0.5">
				<p className="text-xs font-bold text-muted-foreground">
					Тавтай морилно уу
					{dateLabel && <span className="tabular-nums"> · {dateLabel}</span>}
				</p>
				<h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">{username}</h1>
				<p className="text-sm font-semibold text-muted-foreground">
					Өнөөдөр бас нэг алхам урагшилъя ✨
				</p>
			</div>
			<Link href="/Lists/paymentCoureList" className="relative hidden shrink-0 sm:block">
				<Button size="sm" variant="outline" className="gap-1.5">
					<BookOpen className="size-4 text-pop-mint-ink" strokeWidth={2.5} />
					Сургалт үзэх
					<ArrowRight className="size-4" strokeWidth={2.5} />
				</Button>
			</Link>
			<Link
				href="/Lists/paymentCoureList"
				aria-label="Сургалт үзэх"
				className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-pop-mint-soft text-pop-mint-ink sm:hidden"
			>
				<BookOpen className="size-5" strokeWidth={2.5} />
			</Link>
		</div>
	);
});
GreetingTile.displayName = "GreetingTile";

// ============================================================================
// COUNT TILE
// ============================================================================
interface CountTileProps {
	label: string;
	value: React.ReactNode;
	hint: string;
	Icon: React.ElementType;
	tone: "violet" | "sky" | "sun";
}

const TONE = {
	violet: { bg: "bg-pop-violet-soft", ink: "text-pop-violet-ink" },
	sky: { bg: "bg-pop-sky-soft", ink: "text-pop-sky-ink" },
	sun: { bg: "bg-pop-sun-soft", ink: "text-pop-sun-ink" },
} as const;

const CountTile = memo(({ label, value, hint, Icon, tone }: CountTileProps) => {
	const t = TONE[tone];
	return (
		<div className={cn("flex h-full flex-col justify-between gap-3 rounded-3xl p-4", t.bg)}>
			<div className="flex items-center justify-between gap-2">
				<p className={cn("text-[11px] font-bold uppercase leading-tight tracking-wide", t.ink)}>{label}</p>
				<span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl bg-card", t.ink)}>
					<Icon className="size-4" strokeWidth={2.5} />
				</span>
			</div>
			<div>
				<p className={cn("text-3xl font-black tabular-nums leading-none", t.ink)}>{value}</p>
				<p className="mt-1 text-xs font-semibold text-muted-foreground">{hint}</p>
			</div>
		</div>
	);
});
CountTile.displayName = "CountTile";

// ============================================================================
// SHORTCUT TILES
// ============================================================================
const SHORTCUTS = [
	{
		href: "/Lists/examList",
		label: "Шалгалтууд",
		Icon: ClipboardCheck,
		chip: "bg-pop-violet text-primary-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-violet)_60%,black)]",
		hover: "hover:border-pop-violet",
	},
	{
		href: "/Lists/sorilList",
		label: "Сорилууд",
		Icon: FileText,
		chip: "bg-pop-sky text-primary-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-sky)_60%,black)]",
		hover: "hover:border-pop-sky",
	},
	{
		href: "/Lists/exerciseList",
		label: "Дасгал ажил",
		Icon: Dumbbell,
		chip: "bg-pop-coral text-primary-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-coral)_60%,black)]",
		hover: "hover:border-pop-coral",
	},
	{
		href: "/Lists/paymentCoureList",
		label: "Сургалтууд",
		Icon: BookOpen,
		chip: "bg-pop-mint text-primary-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-mint)_60%,black)]",
		hover: "hover:border-pop-mint",
	},
] as const;

const ShortcutTile = ({ href, label, Icon, chip, hover }: (typeof SHORTCUTS)[number]) => (
	<Link
		href={href}
		className={cn(
			TILE,
			"group flex h-full min-h-28 flex-col justify-between gap-3 p-4 transition-all hover:-translate-y-0.5 active:translate-y-0.5",
			hover,
		)}
	>
		<span className={cn("flex size-11 items-center justify-center rounded-xl", chip)}>
			<Icon className="size-5" strokeWidth={2.5} />
		</span>
		<span className="flex items-center justify-between gap-2">
			<span className="text-sm font-extrabold leading-tight">{label}</span>
			<ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" strokeWidth={2.75} />
		</span>
	</Link>
);

// ============================================================================
// TILE HEADER — icon chip + гарчиг + count + link
// ============================================================================
interface TileHeaderProps {
	title: string;
	href: string;
	count?: number;
	icon?: React.ReactNode;
	chipClass?: string;
}

const TileHeader = memo(({ title, href, count, icon, chipClass = "bg-pop-violet-soft text-pop-violet-ink" }: TileHeaderProps) => (
	<div className="flex items-center justify-between gap-3">
		<div className="flex min-w-0 items-center gap-2.5">
			{icon && (
				<span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${chipClass}`}>
					{icon}
				</span>
			)}
			<h2 className="truncate text-base font-black tracking-tight sm:text-lg">{title}</h2>
			{count !== undefined && count > 0 && (
				<span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-extrabold text-primary-foreground">
					{count}
				</span>
			)}
		</div>
		<Link
			href={href}
			className="group flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-primary transition-colors hover:bg-accent"
		>
			<span className="hidden min-[400px]:inline">Бүгдийг харах</span>
			<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.75} />
		</Link>
	</div>
));
TileHeader.displayName = "TileHeader";

// ============================================================================
// SORIL ROW — compact list item (сорилын жагсаалт tile)
// ============================================================================
interface SorilRowProps {
	exam: PastExam;
	index: number;
}

function getExamLockStatus(exam: PastExam) {
	return exam.ispay === 1 && exam.paid === 0 && exam.isopensoril === 0;
}

const SORIL_TINTS = [
	"bg-pop-violet-soft text-pop-violet-ink",
	"bg-pop-sky-soft text-pop-sky-ink",
	"bg-pop-mint-soft text-pop-mint-ink",
	"bg-pop-pink-soft text-pop-pink-ink",
	"bg-pop-sun-soft text-pop-sun-ink",
	"bg-pop-coral-soft text-pop-coral-ink",
] as const;

const SorilRow = memo(
	({ exam, index }: SorilRowProps) => {
		const router = useRouter();
		const _isCompleted = isSorilCompleted(exam.isguitset);
		const isLocked = getExamLockStatus(exam);
		const tint = SORIL_TINTS[index % SORIL_TINTS.length];

		const handleClick = useCallback(() => {
			router.push(isLocked ? "/Lists/paymentCoureList" : `/soril/${exam.exam_id}`);
		}, [router, exam.exam_id, isLocked]);

		return (
			<motion.li
				initial={{ opacity: 0, x: -8 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.25, delay: Math.min(index, 12) * ANIMATION_STAGGER }}
			>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={handleClick}
							className="group flex w-full items-center gap-3 rounded-2xl border-2 border-transparent p-2 text-left transition-colors hover:border-border hover:bg-accent/50"
						>
							{/* Thumbnail */}
							<div className={`relative size-14 shrink-0 overflow-hidden rounded-xl ${tint}`}>
								{exam.filename ? (
									<Image
										src={exam.filename}
										alt={exam.soril_name}
										fill
										className={`object-cover transition-transform duration-500 group-hover:scale-[1.06] ${isLocked ? "brightness-75" : ""}`}
										sizes="56px"
										quality={85}
										priority={index < 4}
									/>
								) : (
									<div className="absolute inset-0 flex items-center justify-center">
										<FileText className="size-6 opacity-70" strokeWidth={2.25} />
									</div>
								)}
								{isLocked && (
									<div className="absolute inset-0 flex items-center justify-center bg-foreground/25">
										<div className="flex size-7 items-center justify-center rounded-full bg-pop-sun text-pop-sun-ink">
											<Lock className="size-3.5" strokeWidth={2.75} />
										</div>
									</div>
								)}
							</div>

							{/* Info */}
							<div className="min-w-0 flex-1 space-y-1">
								<h3 className="line-clamp-2 text-xs font-extrabold leading-snug transition-colors group-hover:text-primary sm:text-sm">
									{exam.soril_name}
								</h3>
								<div className="flex flex-wrap items-center gap-1.5">
									{isLocked && (
										<Badge variant="sun" className="border-0 px-2 py-0 text-[10px]">
											Төлбөртэй
										</Badge>
									)}
									<span className="inline-flex items-center gap-1 rounded-full bg-pop-sky-soft px-2 py-0.5 text-[10px] font-bold text-pop-sky-ink">
										<Clock className="size-3" strokeWidth={2.5} />
										{exam.minut > 0 ? `${exam.minut} мин` : "∞"}
									</span>
									<span className="inline-flex items-center gap-1 rounded-full bg-pop-mint-soft px-2 py-0.5 text-[10px] font-bold text-pop-mint-ink">
										<ClipboardCheck className="size-3" strokeWidth={2.5} />
										{exam.que_cnt} асуулт
									</span>
								</div>
							</div>

							<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" strokeWidth={2.75} />
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p className="max-w-[200px]">{exam.soril_name}</p>
						{isLocked && <p className="mt-0.5 text-xs text-pop-sun">Төлбөр шаардлагатай</p>}
					</TooltipContent>
				</Tooltip>
			</motion.li>
		);
	},
	(prev, next) => prev.exam === next.exam && prev.index === next.index,
);
SorilRow.displayName = "SorilRow";

// ============================================================================
// SORIL LIST — scrollable
// ============================================================================
interface SorilListsProps {
	pastExams: PastExam[];
	className?: string;
}

const SorilLists = memo(({ pastExams, className }: SorilListsProps) => {
	if (!pastExams?.length) {
		return (
			<div className="flex flex-col items-center gap-3 py-16 text-center">
				<div className="flex size-16 items-center justify-center rounded-full bg-pop-sky-soft text-3xl">📝</div>
				<p className="text-sm font-bold text-muted-foreground">Сорил олдсонгүй</p>
			</div>
		);
	}

	return (
		<ul className={cn("-mx-1 space-y-1 overflow-y-auto px-1", className)}>
			{pastExams.map((exam, index) => (
				<SorilRow key={exam.exam_id} exam={exam} index={index} />
			))}
		</ul>
	);
});
SorilLists.displayName = "SorilLists";

// ============================================================================
// HERO FALLBACKS — loading / no exam
// ============================================================================
const HeroLoading = () => (
	<div className={cn(TILE, "flex h-full min-h-72 flex-col items-center justify-center gap-3 p-6")}>
		<div className="flex size-14 items-center justify-center rounded-2xl bg-pop-violet-soft text-pop-violet-ink">
			<Loader2 className="size-7 animate-spin" strokeWidth={2.5} />
		</div>
		<p className="text-sm font-bold text-muted-foreground">Ачааллаж байна...</p>
	</div>
);

const HeroEmpty = () => (
	<div className={cn(TILE, "relative flex h-full min-h-72 flex-col items-center justify-center gap-4 overflow-hidden p-6 text-center")}>
		<div aria-hidden className="pointer-events-none absolute inset-0 bg-dots opacity-40" />
		<div className="relative flex size-20 items-center justify-center rounded-full bg-pop-sun-soft text-4xl animate-float">🗓️</div>
		<div className="relative space-y-1">
			<p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Дараагийн шалгалт</p>
			<p className="text-lg font-black">Идэвхтэй шалгалт алга</p>
			<p className="text-sm font-semibold text-muted-foreground">Сорил ажиллаад бэлтгэлээ хангаарай</p>
		</div>
		<div className="relative flex flex-wrap justify-center gap-2">
			<Link href="/Lists/sorilList">
				<Button>
					<FileText className="size-4" strokeWidth={2.5} />
					Сорилууд
				</Button>
			</Link>
			<Link href="/Lists/examList">
				<Button variant="outline">
					<ClipboardCheck className="size-4" strokeWidth={2.5} />
					Шалгалтууд
				</Button>
			</Link>
		</div>
	</div>
);

// ============================================================================
// HOME PAGE
// ============================================================================
export function isBurtguulsen(list: Exam1111[]) {
	return list.some((item) => item.burtguulsen === 1);
}

export default function HomePage() {
	const { userId, user } = useAuthStore();
	const { setProfile } = useUserStore();

	const { data: profileData, isLoading: isProfileLoading } =
		useQuery<UserProfileResponseType>({
			queryKey: ["userProfile", userId],
			queryFn: () => getUserProfile(userId ?? 0),
			enabled: !!userId,
			retry: 2,
			staleTime: 10 * 60 * 1000,
			refetchOnWindowFocus: false,
		});

	const { data: homeData, isLoading: isHomeLoading } =
		useQuery<HomeResponseType>({
			queryKey: ["homeScreen", userId],
			queryFn: () => getHomeScreen(userId ?? 0),
			enabled: !!userId,
			retry: 2,
			staleTime: 5 * 60 * 1000,
			refetchOnWindowFocus: false,
		});

	void useQuery({
		queryKey: ["get_exam_v2", userId],
		queryFn: () =>
			getExamTime({
				userId: Number(userId),
				examinee_number: user?.examinee_number || "",
			}),
		enabled: !!userId && !!user?.examinee_number,
		select: (res) => res.RetData || [],
	});

	const { data: myExamInfo } = useQuery({
		queryKey: ["myExamInfo", userId, user?.examinee_number],
		queryFn: () =>
			getmnExamUserCheck(user?.examinee_number ?? "", Number(userId)),
		enabled: !!userId && !!user?.examinee_number,
		select: (res) => res.RetData ?? [],
	});

	const examDateId = myExamInfo?.[0]?.exam_date_id;

	//biome-ignore lint/correctness/noUnusedVariables: ExamVerifyDialog, MnExamPrint-д ашиглана
	const { data: printData } = useQuery({
		queryKey: ["mn_print", userId, user?.examinee_number, examDateId],
		queryFn: () =>
			getMNPrint({
				userId: Number(userId),
				examineeNumber: String(user?.examinee_number ?? ""),
				examDateId: Number(examDateId),
			}),
		enabled: !!userId && !!user?.examinee_number,
		select: (res) => {
			console.log("✅ printData:", res);
			return res.RetData ?? [];
		},
	});

	useEffect(() => {
		if (profileData?.RetData?.length) {
			setProfile(profileData.RetData[0]);
		}
	}, [profileData, setProfile]);

	const username = profileData?.RetData?.[0]?.username ?? "Хэрэглэгч";
	const hasExams = Boolean(homeData?.RetDataThirt?.length);
	const hasSorils = Boolean(homeData?.RetDataFourth?.length);
	const examCount = homeData?.RetDataThirt?.length ?? 0;
	const sorilCount = homeData?.RetDataFourth?.length ?? 0;

	const nextExam = useMemo(() => pickNextExam(homeData?.RetDataThirt), [homeData?.RetDataThirt]);
	const isLoading = isHomeLoading || isProfileLoading;
	// Сорилын tile баруун талд 2 мөр эзлэх эсэх — үгүй бол бусад tile бүтэн өргөнөөр
	const hasSideTile = isLoading || (hasExams && hasSorils);
	const wideCol = hasSideTile ? "md:col-span-4" : "md:col-span-6";

	if (!userId) {
		return <div className="min-h-[60vh]" />;
	}

	return (
		<TooltipProvider>
			{/* Bento grid. DOM order = mobile priority; md+ uses dense auto-placement. */}
			<div className="grid w-full grid-flow-row-dense grid-cols-2 gap-3 sm:gap-4 md:grid-cols-6">
				{/* 1. Дараагийн шалгалт — hero (2x2) */}
				<BentoTile className="col-span-2 md:col-span-3 md:row-span-2">
					{isLoading ? (
						<HeroLoading />
					) : nextExam ? (
						<NextExamHero exam={nextExam} />
					) : (
						<HeroEmpty />
					)}
				</BentoTile>

				{/* 2. Greeting */}
				<BentoTile className="col-span-2 md:col-span-3" delay={0.05}>
					<GreetingTile username={username} />
				</BentoTile>

				{/* 3. Count tiles */}
				<BentoTile delay={0.1}>
					<CountTile
						label="Идэвхтэй шалгалт"
						value={examCount}
						hint="Одоо нээлттэй"
						Icon={ClipboardCheck}
						tone="violet"
					/>
				</BentoTile>
				<BentoTile delay={0.13}>
					<CountTile
						label="Сорилын сан"
						value={sorilCount}
						hint="Нийт сорил"
						Icon={FileText}
						tone="sky"
					/>
				</BentoTile>
				<BentoTile className="col-span-2 md:col-span-1" delay={0.16}>
					<CountTile
						label="Хандалт"
						value="24/7"
						hint="Хаанаас ч нэвтэрнэ"
						Icon={Clock}
						tone="sun"
					/>
				</BentoTile>

				{/* 4. Shortcuts */}
				<div className={cn("col-span-2 grid min-w-0 grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4", wideCol)}>
					{SHORTCUTS.map((sc, i) => (
						<BentoTile key={sc.href} delay={0.18 + i * 0.03}>
							<ShortcutTile {...sc} />
						</BentoTile>
					))}
				</div>

				{/* 5. Идэвхтэй шалгалтууд */}
				{isLoading ? (
					<BentoTile className="col-span-2 md:col-span-4">
						<div className={cn(TILE, "space-y-4 p-4 sm:p-5")}>
							<Skeleton className="h-8 w-1/2 rounded-full" />
							<div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
								<Skeleton className="h-52 rounded-3xl" />
								<Skeleton className="h-52 rounded-3xl" />
							</div>
						</div>
					</BentoTile>
				) : (
					hasExams && homeData?.RetDataThirt && (
						<BentoTile className={cn("col-span-2", wideCol)} delay={0.25}>
							<section className={cn(TILE, "@container h-full space-y-4 p-4 sm:p-5")}>
								<TileHeader
									title="Идэвхтэй шалгалтууд"
									href="/Lists/examList"
									count={examCount}
									icon={<ClipboardCheck className="size-[18px]" strokeWidth={2.5} />}
									chipClass="bg-pop-violet-soft text-pop-violet-ink"
								/>
								<div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @3xl:grid-cols-3">
									<ExamLists exams={homeData.RetDataThirt} />
								</div>
							</section>
						</BentoTile>
					)
				)}

				{/* 6. Сорилууд — scrollable list tile */}
				{isLoading ? (
					<BentoTile className="col-span-2 md:row-span-2">
						<div className={cn(TILE, "h-full space-y-3 p-4 sm:p-5")}>
							<Skeleton className="h-8 w-2/3 rounded-full" />
							{["a", "b", "c", "d"].map((k) => (
								<Skeleton key={k} className="h-16 rounded-2xl" />
							))}
						</div>
					</BentoTile>
				) : (
					hasSorils && homeData?.RetDataFourth && (
						<BentoTile
							className={cn("col-span-2", hasExams ? "md:row-span-2" : "md:col-span-6")}
							delay={0.3}
						>
							<section className={cn(TILE, "flex h-full flex-col gap-3 p-4 sm:p-5")}>
								<TileHeader
									title="Элсэлтийн шалгалтын сорилууд"
									href="/Lists/sorilList"
									count={sorilCount}
									icon={<FileText className="size-[18px]" strokeWidth={2.5} />}
									chipClass="bg-pop-sky-soft text-pop-sky-ink"
								/>
								<SorilLists
									pastExams={homeData.RetDataFourth}
									className={cn(
										"max-h-[26rem]",
										hasExams
											? "md:h-0 md:max-h-none md:min-h-[22rem] md:flex-1"
											: "md:grid md:grid-cols-2 md:gap-1 md:space-y-0 lg:grid-cols-3",
									)}
								/>
							</section>
						</BentoTile>
					)
				)}

				{/* Хоосон */}
				{!isLoading && !hasExams && !hasSorils && (
					<BentoTile className="col-span-2 md:col-span-6" delay={0.25}>
						<div className={cn(TILE, "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center")}>
							<div className="flex size-20 items-center justify-center rounded-full bg-pop-sun-soft text-4xl">🗂️</div>
							<p className="text-lg font-black">Мэдээлэл олдсонгүй</p>
						</div>
					</BentoTile>
				)}
			</div>
		</TooltipProvider>
	);
}
