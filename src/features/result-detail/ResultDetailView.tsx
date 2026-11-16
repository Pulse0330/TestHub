"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import StyledBackButton from "@/components/backButton";
import { getExamDun, getExamResultMore } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ExamDunApiResponse } from "@/types/exam/examDun";
import type {
	ExamResponseMoreApiResponse,
	ExamSummary,
} from "@/types/exam/examResultMore";
import { FilterToolbar } from "./FilterToolbar";
import { QuestionCard } from "./QuestionCard";
import {
	ErrorState,
	LoadingState,
	NotFoundState,
	NotLoggedInState,
} from "./ResultDetailStates";
import { ResultSummaryCard } from "./ResultSummaryCard";
import { ReviewCarousel } from "./ReviewCarousel";
import { type AnswerStatus, buildQuestionEntries } from "./scoring";
import { type AnswerFilter, isReviewable, matchesFilter } from "./status";

export type ResultDetailVariant = "exam" | "soril";

interface ResultDetailViewProps {
	variant: ResultDetailVariant;
}

export function ResultDetailView({ variant }: ResultDetailViewProps) {
	const params = useParams();
	const router = useRouter();

	const { userId } = useAuthStore();
	const [answerFilter, setAnswerFilter] = useState<AnswerFilter>("all");
	const [openIds, setOpenIds] = useState<Set<number>>(() => new Set());
	const [reviewMode, setReviewMode] = useState(false);
	const [reviewIdx, setReviewIdx] = useState(0);

	const id = params.id as string;
	const [examIdStr, testIdStr] = id?.split("_") || [];
	const examId = Number(examIdStr);
	const testId = Number(testIdStr);

	const { data, isLoading, isError, error } =
		useQuery<ExamResponseMoreApiResponse>({
			queryKey: queryKeys.results.detail(testId, examId, userId),
			queryFn: () => getExamResultMore(testId, examId, userId || 0),
			enabled: !!userId && !!examId && !!testId,
			// Дууссан шалгалтын дүн өөрчлөгдөхгүй
			staleTime: Number.POSITIVE_INFINITY,
		});
	const pointPerc = data?.RetDataFirst?.[0]?.point_perc;

	const { data: dunData } = useQuery<ExamDunApiResponse>({
		queryKey: queryKeys.results.dun(pointPerc),
		queryFn: () => getExamDun(pointPerc ?? 0),
		enabled: typeof pointPerc === "number",
		staleTime: Number.POSITIVE_INFINITY,
	});

	const questionEntries = useMemo(() => buildQuestionEntries(data), [data]);

	const filterCounts = useMemo(() => {
		const counts: Record<AnswerStatus, number> = {
			correct: 0,
			incorrect: 0,
			partial: 0,
			pending: 0,
			unanswered: 0,
		};
		for (const e of questionEntries) counts[e.status]++;
		return counts;
	}, [questionEntries]);

	const visibleEntries = useMemo(
		() => questionEntries.filter((e) => matchesFilter(e.status, answerFilter)),
		[questionEntries, answerFilter],
	);
	const wrongEntries = useMemo(
		() => questionEntries.filter((e) => isReviewable(e.status)),
		[questionEntries],
	);

	const toggleOpen = useCallback(
		(qid: number) =>
			setOpenIds((prev) => {
				const next = new Set(prev);
				if (next.has(qid)) next.delete(qid);
				else next.add(qid);
				return next;
			}),
		[],
	);

	const expandAll = useCallback(
		() =>
			setOpenIds(new Set(visibleEntries.map((e) => e.question.exam_que_id))),
		[visibleEntries],
	);
	const collapseAll = useCallback(() => setOpenIds(new Set()), []);
	const toggleReviewMode = useCallback(() => {
		setReviewIdx(0);
		setReviewMode(!reviewMode);
	}, [reviewMode]);

	if (!userId) {
		return <NotLoggedInState />;
	}

	if (isLoading) {
		return <LoadingState />;
	}

	if (isError) {
		return (
			<ErrorState
				message={(error as Error).message}
				onBack={() => router.back()}
			/>
		);
	}

	if (!data?.RetResponse?.ResponseType || !data?.RetDataSecond) {
		return (
			<NotFoundState
				message={data?.RetResponse?.ResponseMessage}
				onBack={() => router.back()}
			/>
		);
	}

	const examSummary: ExamSummary | undefined = data.RetDataFirst?.[0];
	const questions = data.RetDataSecond;
	const showTrueAns = examSummary?.show_true_ans === 1;
	// Эх бичвэрийн блок нь зөвхөн шалгалтын дүнд харагддаг байсан
	const showSourceBlock = variant === "exam";

	const dunInfo = dunData?.RetData?.[0];
	const safeReviewIdx = Math.min(
		reviewIdx,
		Math.max(0, wrongEntries.length - 1),
	);

	return (
		<div className="w-full pb-10">
			<div className="mb-4">
				<StyledBackButton
					variant="default"
					showIcon={true}
					showConfirm={true}
					confirmTitle="Та итгэлтэй байна уу?"
					confirmMessage=""
					ariaLabel=""
				/>
			</div>

			<div className="mx-auto max-w-6xl space-y-6">
				{examSummary && (
					<ResultSummaryCard examSummary={examSummary} dunInfo={dunInfo} />
				)}

				{/* Filter toolbar - sticky */}
				<FilterToolbar
					reviewMode={reviewMode}
					answerFilter={answerFilter}
					onFilterChange={setAnswerFilter}
					totalCount={questionEntries.length}
					filterCounts={filterCounts}
					wrongCount={wrongEntries.length}
					safeReviewIdx={safeReviewIdx}
					onExpandAll={expandAll}
					onCollapseAll={collapseAll}
					onToggleReview={toggleReviewMode}
				/>

				<div className="space-y-3">
					{!questions || questions.length === 0 ? (
						<div className="card-pop p-10 text-center font-bold">
							<p className="text-muted-foreground">Асуулт олдсонгүй</p>
						</div>
					) : reviewMode ? (
						<ReviewCarousel
							wrongEntries={wrongEntries}
							safeReviewIdx={safeReviewIdx}
							onReviewIdxChange={setReviewIdx}
							onToggle={toggleOpen}
							showTrueAns={showTrueAns}
							showSourceBlock={showSourceBlock}
						/>
					) : visibleEntries.length === 0 ? (
						<div className="card-pop flex flex-col items-center p-10 text-center">
							<div className="mb-3 flex size-16 items-center justify-center rounded-full bg-pop-sky-soft text-pop-sky-ink">
								<AlertCircle className="size-8" />
							</div>
							<p className="font-extrabold text-muted-foreground">
								Асуулт олдсонгүй
							</p>
						</div>
					) : (
						visibleEntries.map((entry) => (
							<QuestionCard
								key={entry.question.exam_que_id}
								entry={entry}
								isOpen={openIds.has(entry.question.exam_que_id)}
								onToggle={toggleOpen}
								showTrueAns={showTrueAns}
								showSourceBlock={showSourceBlock}
							/>
						))
					)}
				</div>
			</div>
		</div>
	);
}
