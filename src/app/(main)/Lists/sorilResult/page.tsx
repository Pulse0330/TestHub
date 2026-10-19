"use client";

import { useQuery } from "@tanstack/react-query";
import {
	CalendarDays,
	ChartNoAxesColumn,
	Eye,
	EyeOff,
	FileQuestion,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import UseAnimations from "react-useanimations";
import loading2 from "react-useanimations/lib/loading2";
import LessonFilter from "@/components/LessonFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSorilFilterdresultlists, getTestFilter } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { SorilresultListResponseType } from "@/types/soril/sorilResultLists";
import ExamResultCard, {
	monthKeyOf,
	monthLabelOf,
	ResultSummaryStrip,
} from "./card";

interface Lesson {
	lesson_id: number;
	lesson_name: string;
	sort: number;
}

interface TestFilterResponse {
	RetResponse: {
		ResponseMessage: string;
		StatusCode: string;
		ResponseCode: string;
		ResponseType: boolean;
	};
	RetData: Lesson[];
}

export default function ExamResultList() {
	const { userId } = useAuthStore();
	const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
	const [globalShowScore, setGlobalShowScore] = useState(false);

	// Fetch lesson filter options
	const { data: lessonData } = useQuery<TestFilterResponse>({
		queryKey: ["testFilter", userId],
		queryFn: () => getTestFilter(userId || 0),
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
	});

	// Auto-select "Бүгд" (lesson_id: 0) when lessons are loaded
	useEffect(() => {
		if (lessonData?.RetData && selectedLessonId === null) {
			setSelectedLessonId(0);
		}
	}, [lessonData, selectedLessonId]);

	// Fetch exam results - uses API filtering based on selected lesson
	const { data, isLoading } = useQuery<SorilresultListResponseType>({
		queryKey: ["examResults", userId, selectedLessonId],
		queryFn: async (): Promise<SorilresultListResponseType> => {
			return getSorilFilterdresultlists(userId || 0, selectedLessonId || 0);
		},
		enabled: !!userId && selectedLessonId !== null,
		staleTime: 2 * 60 * 1000,
	});

	const lessons = useMemo(() => lessonData?.RetData || [], [lessonData]);
	const exams = useMemo(() => data?.RetData || [], [data]);

	// Calculate stats
	const finishedExams = useMemo(
		() => exams.filter((e) => e.isfinished === 1),
		[exams],
	);

	const avgScore = useMemo(
		() =>
			finishedExams.length > 0
				? Math.round(
						finishedExams.reduce((sum, e) => sum + e.test_perc, 0) /
							finishedExams.length,
					)
				: 0,
		[finishedExams],
	);

	const highScore = useMemo(
		() =>
			finishedExams.length > 0
				? Math.max(...finishedExams.map((e) => e.test_perc))
				: 0,
		[finishedExams],
	);

	const hasApiError = useMemo(
		() => !data?.RetResponse?.ResponseType,
		[data?.RetResponse?.ResponseType],
	);

	const selectedLessonName = useMemo(
		() => lessons.find((l) => l.lesson_id === selectedLessonId)?.lesson_name,
		[lessons, selectedLessonId],
	);

	// Timeline: newest first, grouped by month
	const monthGroups = useMemo(() => {
		const sorted = [...exams].sort(
			(a, b) =>
				(new Date(b.test_date).getTime() || 0) -
				(new Date(a.test_date).getTime() || 0),
		);
		const groups: { key: string; label: string; items: typeof exams }[] = [];
		for (const exam of sorted) {
			const d = new Date(exam.test_date);
			const key = monthKeyOf(d);
			let g = groups.find((x) => x.key === key);
			if (!g) {
				g = { key, label: monthLabelOf(d), items: [] };
				groups.push(g);
			}
			g.items.push(exam);
		}
		return groups;
	}, [exams]);

	// Recent finished scores for the bar chart (oldest → newest)
	const recentScores = useMemo(
		() =>
			[...finishedExams]
				.sort(
					(a, b) =>
						(new Date(a.test_date).getTime() || 0) -
						(new Date(b.test_date).getTime() || 0),
				)
				.slice(-12)
				.map((e) => ({ id: e.test_id, title: e.title, score: e.test_perc })),
		[finishedExams],
	);

	// Loading state
	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
				<div className="flex size-24 items-center justify-center rounded-full bg-pop-mint-soft text-pop-mint-ink">
					<UseAnimations
						animation={loading2}
						size={56}
						strokeColor="var(--pop-mint)"
						loop
					/>
				</div>
				<div className="space-y-1 text-center">
					<p className="text-xl font-black text-foreground">Уншиж байна...</p>
					<p className="text-sm font-semibold text-muted-foreground">
						Таны үр дүнг ачааллаж байна
					</p>
				</div>
			</div>
		);
	}

	return (
		<TooltipProvider>
			<div className="flex h-full flex-col">
				<div className="flex w-full flex-col gap-6">
					{/* Compact toolbar */}
					<div className="flex flex-wrap items-center justify-between gap-3 animate-in fade-in-0 slide-in-from-top-2 duration-500">
						<div className="flex items-center gap-2">
							<span className="flex size-9 items-center justify-center rounded-xl bg-pop-mint-soft text-pop-mint-ink">
								<ChartNoAxesColumn className="size-5" strokeWidth={2.5} />
							</span>
							<Badge variant="mint" className="px-3 py-1 text-sm">
								{exams.length} сорил
							</Badge>
						</div>

						{finishedExams.length > 0 && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setGlobalShowScore(!globalShowScore)}
									>
										{globalShowScore ? (
											<>
												<EyeOff className="size-4" />
												Оноо нуух
											</>
										) : (
											<>
												<Eye className="size-4" />
												Оноо харуулах
											</>
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>
										{globalShowScore
											? "Үр дүнгийн статистик нуух"
											: "Үр дүнгийн статистик харуулах"}
									</p>
								</TooltipContent>
							</Tooltip>
						)}
					</div>

					{/* Progress overview */}
					{finishedExams.length > 0 && (
						<ResultSummaryStrip
							avgScore={avgScore}
							highScore={highScore}
							finishedCount={finishedExams.length}
							totalCount={exams.length}
							unit="сорил"
							recent={recentScores}
							showScore={globalShowScore}
						/>
					)}

					{selectedLessonId !== null && (
						<LessonFilter
							lessons={lessons}
							selectedLessonId={selectedLessonId}
							onLessonSelect={setSelectedLessonId}
						/>
					)}

					{/* Timeline */}
					<div className="animate-in fade-in-0 duration-700">
						{exams.length > 0 ? (
							<div className="space-y-8 pb-4">
								{monthGroups.map((group) => (
									<section key={group.key}>
										<div className="mb-3 flex items-center gap-2">
											<span className="flex size-6 items-center justify-center rounded-lg bg-pop-mint-soft text-pop-mint-ink">
												<CalendarDays className="size-3.5" strokeWidth={2.5} />
											</span>
											<h3 className="text-sm font-black tracking-tight text-foreground">
												{group.label}
											</h3>
											<span className="text-xs font-bold text-muted-foreground">
												· {group.items.length}
											</span>
										</div>
										<div className="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[9px] before:w-0.5 before:rounded-full before:bg-border sm:before:left-[13px]">
											{group.items.map((exam, i) => (
												<ExamResultCard
													key={exam.exam_id}
													exam={exam}
													index={i}
													globalShowScore={globalShowScore}
												/>
											))}
										</div>
									</section>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-16 text-center">
								<div className="mb-4 flex size-20 items-center justify-center rounded-full bg-pop-mint-soft text-pop-mint-ink">
									<FileQuestion className="size-10" strokeWidth={2.5} />
								</div>
								<h3 className="mb-2 text-xl font-extrabold text-foreground">
									{hasApiError ? "Сорил олдсонгүй" : "Сорил байхгүй байна"}
								</h3>
								<p className="max-w-sm text-sm font-semibold text-muted-foreground">
									{hasApiError
										? "Үр дүн татахад алдаа гарлаа. Дахин оролдоно уу."
										: selectedLessonId === 0
											? "Танд одоогоор сорилын үр дүн байхгүй байна."
											: `${selectedLessonName || "Энэ хичээл"}-д сорилын үр дүн байхгүй байна.`}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}
