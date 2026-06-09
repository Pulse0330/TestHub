"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
	ArrowRight,
	ClipboardCheck,
	Clock,
	Loader2,
	Lock,
	BookOpen,
	FileText,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import type { Exam1111 } from "@/types/dashboard/exam.types";
import {
	type HomeResponseType,
	isSorilCompleted,
	type PastExam,
} from "@/types/home";
import type { UserProfileResponseType } from "@/types/user";
import ExamLists from "./homeExamCard";

const ANIMATION_STAGGER = 0.04;

// ============================================================================
// HERO SECTION — 3 stat card хийцтэй
// ============================================================================
interface HeroSectionProps {
	username: string;
	examCount?: number;
	sorilCount?: number;
}

const HeroSection = memo(({ username, examCount = 0, sorilCount = 0 }: HeroSectionProps) => (
	<div className="w-full space-y-3">
		{/* Greeting row */}
		<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
			<div>
				<p className="text-xs text-muted-foreground mb-1">Тавтай морилно уу</p>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					{username}
				</h1>
			</div>
			<Link href="/Lists/paymentCoureList">
				<Button variant="outline" size="sm" className="gap-2 rounded-xl h-9 text-xs font-medium">
					<BookOpen className="w-3.5 h-3.5" />
					Сургалт үзэх
					<ArrowRight className="w-3.5 h-3.5" />
				</Button>
			</Link>
		</div>

		{/* Stat cards */}
		<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
			<div className="rounded-xl border border-border/60 bg-card p-4 space-y-1.5">
				<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Идэвхтэй шалгалт</p>
				<p className="text-3xl font-bold tabular-nums">{examCount}</p>
				<p className="text-xs text-muted-foreground">Одоо нээлттэй</p>
			</div>
			<div className="rounded-xl border border-border/60 bg-card p-4 space-y-1.5">
				<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Сорилын сан</p>
				<p className="text-3xl font-bold tabular-nums">{sorilCount}</p>
				<p className="text-xs text-muted-foreground">Нийт сорил</p>
			</div>
			<div className="hidden sm:block rounded-xl border border-border/60 bg-card p-4 space-y-1.5">
				<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Хандалт</p>
				<p className="text-3xl font-bold tabular-nums">24/7</p>
				<p className="text-xs text-muted-foreground">Хаанаас ч нэвтэрнэ</p>
			</div>
		</div>
	</div>
));

HeroSection.displayName = "HeroSection";

// ============================================================================
// EXAM CARD — vertical card, тод дүрслэл
// ============================================================================
interface ExamCardProps {
	exam: PastExam;
	index: number;
}

function getExamLockStatus(exam: PastExam) {
	return exam.ispay === 1 && exam.paid === 0 && exam.isopensoril === 0;
}

const ExamCard = memo(
	({ exam, index }: ExamCardProps) => {
		const router = useRouter();
		const _isCompleted = isSorilCompleted(exam.isguitset);
		const isLocked = getExamLockStatus(exam);

		const handleClick = useCallback(() => {
			router.push(isLocked ? "/Lists/paymentCoureList" : `/soril/${exam.exam_id}`);
		}, [router, exam.exam_id, isLocked]);

		return (
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, delay: index * ANIMATION_STAGGER }}
				className="h-full"
			>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={handleClick}
							className="group h-full w-full flex flex-col rounded-xl overflow-hidden border border-border/50 bg-card hover:border-border hover:shadow-md transition-all duration-200 text-left"
						>
							{/* Thumbnail */}
							<div className="relative w-full aspect-video bg-muted shrink-0 overflow-hidden">
							
								<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40">
  <FileText className="w-8 h-8 text-indigo-400/50" />
</div>
							

								{/* Overlay */}
								<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

								{isLocked && (
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
											<Lock className="w-4 h-4 text-white" />
										</div>
									</div>
								)}

								{isLocked && (
									<Badge className="absolute top-2 left-2 bg-amber-500 hover:bg-amber-500 text-white border-0 text-[9px] px-1.5 py-0.5">
										Төлбөртэй
									</Badge>
								)}
							</div>

							{/* Info */}
							<div className="flex flex-col flex-1 p-3 gap-2">
								<h3 className="text-xs sm:text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
									{exam.soril_name}
								</h3>

								<div className="mt-auto flex items-center justify-between">
									<div className="flex items-center gap-1 text-muted-foreground">
										<Clock className="w-3 h-3" />
										<span className="text-[10px]">
											{exam.minut > 0 ? `${exam.minut} мин` : "∞"}
										</span>
									</div>
									<div className="flex items-center gap-1 text-muted-foreground">
										<ClipboardCheck className="w-3 h-3" />
										<span className="text-[10px]">{exam.que_cnt} асуулт</span>
									</div>
								</div>
							</div>
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p className="max-w-[200px]">{exam.soril_name}</p>
						{isLocked && <p className="text-amber-500 text-xs mt-0.5">Төлбөр шаардлагатай</p>}
					</TooltipContent>
				</Tooltip>
			</motion.div>
		);
	},
	(prev, next) => prev.exam === next.exam && prev.index === next.index,
);

ExamCard.displayName = "ExamCard";

// ============================================================================
// SORIL LIST
// ============================================================================
interface SorilListsProps {
	pastExams: PastExam[];
}

const SorilLists = memo(({ pastExams }: SorilListsProps) => {
	if (!pastExams?.length) {
		return (
			<div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
				<ClipboardCheck className="w-10 h-10 opacity-20" />
				<p className="text-sm opacity-40">Сорил олдсонгүй</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
			{pastExams.map((exam, index) => (
				<ExamCard key={exam.exam_id} exam={exam} index={index} />
			))}
		</div>
	);
});

SorilLists.displayName = "SorilLists";

// ============================================================================
// SECTION HEADER — хялбар, тод гарчиг + link
// ============================================================================
interface SectionDividerProps {
	title: string;
	href: string;
	count?: number;
}

const SectionDivider = memo(({ title, href, count }: SectionDividerProps) => (
	<div className="flex items-center justify-between">
		<div className="flex items-center gap-2.5">
			<h2 className="text-sm font-bold tracking-tight">{title}</h2>
			{count !== undefined && count > 0 && (
				<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
					{count}
				</span>
			)}
		</div>
		<Link
			href={href}
			className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
		>
			Бүгдийг харах
			<ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
		</Link>
	</div>
));

SectionDivider.displayName = "SectionDivider";

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

	if (!userId) {
		return <div className="min-h-[60vh]" />;
	}

	return (
		<TooltipProvider>
			<div className="w-full max-w-7xl mx-auto space-y-8 py-4">

				{/* Hero */}
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35 }}
				>
					<HeroSection
						username={username}
						examCount={examCount}
						sorilCount={sorilCount}
					/>
				</motion.div>

				{/* Divider */}
				<div className="border-t border-border/60" />

				{/* Content */}
				{isHomeLoading || isProfileLoading ? (
					<div className="flex flex-col items-center justify-center py-24 gap-3">
						<Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
						<p className="text-xs text-muted-foreground">Ачааллаж байна...</p>
					</div>
				) : (
					<div className="space-y-10">
						{/* Шалгалт */}
						{hasExams && homeData?.RetDataThirt && (
							<motion.section
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.35, delay: 0.1 }}
								className="space-y-4"
							>
								<SectionDivider
									title="Идэвхтэй шалгалтууд"
									href="/Lists/examList"
									count={examCount}
								/>
								<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
									<ExamLists exams={homeData.RetDataThirt} />
								</div>
							</motion.section>
						)}

						{/* Сорил */}
						{hasSorils && homeData?.RetDataFourth && (
							<motion.section
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.35, delay: 0.15 }}
								className="space-y-4"
							>
								<SectionDivider
									title="Элсэлтийн шалгалтын сорилууд"
									href="/Lists/sorilList"
									count={sorilCount}
								/>
								<SorilLists pastExams={homeData.RetDataFourth} />
							</motion.section>
						)}

						{/* Хоосон */}
						{!hasExams && !hasSorils && (
							<div className="flex flex-col items-center justify-center py-24 gap-3">
								<ClipboardCheck className="w-10 h-10 text-muted-foreground/20" />
								<p className="text-sm text-muted-foreground/40">Мэдээлэл олдсонгүй</p>
							</div>
						)}
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}