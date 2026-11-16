"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	Bookmark,
	BookmarkCheck,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ClipboardCheck,
	CloudCheck,
	LayoutGrid,
	List,
	Loader2,
	Menu,
	Save,
	Send,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
	memo,
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	computeElapsedSeconds,
	getServerNowMs,
} from "@/app/exam/component/examTime";
import { ExamHeader } from "@/app/exam/component/examUtils/examInfo";
import MathContent from "@/app/exam/component/examUtils/MathContent";
import ExamMinimap from "@/app/exam/component/minimap";
import {
	type PreparedQuestion,
	prepareQuestions,
	QuestionBody,
} from "@/app/exam/component/QuestionBody";
import {
	TextSizeControl,
	useExamTextScale,
} from "@/app/exam/component/TextSizeControl";
import {
	isAnswerFilled,
	useAnswerSync,
} from "@/app/exam/component/useAnswerSync";
import StyledBackButton from "@/components/backButton";
import FixedScrollButton from "@/components/FixedScrollButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { getExamById } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { AnswerValue } from "@/types/exam/exam";
import FinishExamResultDialog, { type FinishExamDialogHandle } from "../finish";
import ExamTimer from "../stime";

interface SorilQuestionCardProps {
	question: PreparedQuestion;
	index: number;
	focus: boolean;
	answer: AnswerValue | undefined;
	isBookmarked: boolean;
	isTyping: boolean;
	disabled: boolean;
	onToggleBookmark: (questionId: number) => void;
	onAnswerChange: (questionId: number, answer: AnswerValue) => void;
}

/**
 * Нэг асуултын карт. Зөвхөн өөрийн хариулт/төлөв өөрчлөгдөхөд re-render
 * хийнэ (жагсаалт горимд бусад картууд дахин зурагдахгүй).
 */
const SorilQuestionCard = memo(function SorilQuestionCard({
	question: q,
	index,
	focus,
	answer,
	isBookmarked,
	isTyping,
	disabled,
	onToggleBookmark,
	onAnswerChange,
}: SorilQuestionCardProps) {
	const isAnswered = isAnswerFilled(answer);
	const borderClass = isTyping
		? "border-2 border-pop-sky shadow-[0_4px_0_0_var(--pop-sky)]"
		: isAnswered && isBookmarked
			? "border-2 border-pop-sun shadow-[0_4px_0_0_var(--pop-sun)]"
			: isAnswered
				? "border-2 border-primary-soft-shade/70 shadow-[0_4px_0_0_color-mix(in_oklch,var(--primary-soft)_55%,transparent)]"
				: isBookmarked
					? "border-2 border-pop-sun/70 shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_70%,transparent)]"
					: "border-2 border-border";

	return (
		<Card
			className={`gap-0 py-0 transition-colors ${focus ? "animate-pop-in" : ""} ${borderClass}`}
		>
			<CardContent className={focus ? "p-5 sm:p-7" : "p-5 sm:p-6"}>
				<div className="flex items-center justify-between gap-2 mb-4">
					<span className="inline-flex items-center rounded-full bg-pop-violet-soft px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-pop-violet-ink">
						Асуулт {index + 1}
					</span>
					<div className="flex items-center gap-2 shrink-0">
						{isTyping && (
							<div className="flex items-center gap-1 px-2.5 py-1.5 bg-pop-sky-soft rounded-full">
								<div className="flex gap-0.5">
									<span
										className="w-1.5 h-1.5 bg-pop-sky rounded-full animate-bounce"
										style={{ animationDelay: "0ms" }}
									/>
									<span
										className="w-1.5 h-1.5 bg-pop-sky rounded-full animate-bounce"
										style={{ animationDelay: "150ms" }}
									/>
									<span
										className="w-1.5 h-1.5 bg-pop-sky rounded-full animate-bounce"
										style={{ animationDelay: "300ms" }}
									/>
								</div>
							</div>
						)}
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => onToggleBookmark(q.question_id)}
							className="rounded-xl"
							title={isBookmarked ? "Тэмдэглэгээ хасах" : "Тэмдэглэх"}
						>
							{isBookmarked ? (
								<BookmarkCheck className="w-5 h-5 text-pop-sun fill-pop-sun" />
							) : (
								<Bookmark className="w-5 h-5 text-muted-foreground" />
							)}
						</Button>
					</div>
				</div>
				<div
					className={`font-bold text-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert ${
						focus ? "text-lg sm:text-xl mb-6" : "text-lg mb-5"
					}`}
				>
					<MathContent html={q.question_name} />
				</div>
				<QuestionBody
					question={q}
					answer={answer}
					onAnswerChange={onAnswerChange}
					disabled={disabled}
				/>
			</CardContent>
		</Card>
	);
});

export default function SorilPage() {
	const { userId } = useAuthStore();
	const { id } = useParams();
	const queryClient = useQueryClient();
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(
		() => new Set(),
	);
	const [isFinished, setIsFinished] = useState(false);
	const [showMobileMinimapOverlay, setShowMobileMinimapOverlay] =
		useState(false);
	const finishDialogRef = useRef<FinishExamDialogHandle>(null);
	const [viewMode, setViewMode] = useState<"scroll" | "card">("card");
	const textScale = useExamTextScale();
	/** starteddate байхгүй үед үргэлжилсэн хугацааг тоолох эхлэл. */
	const [pageLoadedAt] = useState(() => Date.now());
	const router = useRouter();
	const {
		data: examData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["exam", userId, id],
		queryFn: () => getExamById(userId || 0, Number(id)),
		enabled: !!userId && !!id,
		// Сорилын явцад дахин татахгүй (focus/reconnect refetch локал
		// хариултыг дарж бичдэг байсан). gcTime 0 → дахин орох бүрт шинээр татна.
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: 0,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const {
		selectedAnswers,
		typingQuestions,
		isSaving,
		pendingCount,
		hasSaveError,
		handleAnswerChange,
		flush,
		lock,
	} = useAnswerSync({ userId, examData, locked: isFinished });

	const examInfo = examData?.ExamInfo?.[0];
	const startedDate = examInfo?.starteddate;

	/** Үргэлжилсэн хугацаа (секунд): серверийн цаг − starteddate. */
	const getElapsedSeconds = useCallback(
		() =>
			computeElapsedSeconds({
				startedDate,
				serverNowMs: getServerNowMs(queryClient),
				localNowMs: Date.now(),
				fallbackStartMs: pageLoadedAt,
			}),
		[startedDate, queryClient, pageLoadedAt],
	);

	const handleFinished = useCallback(() => {
		lock();
		setIsFinished(true);
	}, [lock]);

	const allQuestions = useMemo(() => prepareQuestions(examData), [examData]);

	const totalCount = allQuestions.length;
	const answeredCount = useMemo(() => {
		let count = 0;
		for (const q of allQuestions) {
			if (isAnswerFilled(selectedAnswers[q.question_id])) count++;
		}
		return count;
	}, [allQuestions, selectedAnswers]);

	const handleManualSave = useCallback(() => {
		void flush();
	}, [flush]);

	const toggleBookmark = useCallback((questionId: number) => {
		setBookmarkedQuestions((prev) => {
			const newSet = new Set(prev);
			newSet.has(questionId)
				? newSet.delete(questionId)
				: newSet.add(questionId);
			return newSet;
		});
	}, []);

	const goToPreviousQuestion = useCallback(() => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex((prev) => prev - 1);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [currentQuestionIndex]);

	const goToNextQuestion = useCallback(() => {
		if (currentQuestionIndex < totalCount - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [currentQuestionIndex, totalCount]);

	// ============================================
	// FOCUS MODE UX: review, navigator, keyboard, swipe
	// ============================================
	const [isReviewOpen, setIsReviewOpen] = useState(false);

	const answeredQuestionIds = useMemo(() => {
		const set = new Set<number>();
		for (const q of allQuestions) {
			if (isAnswerFilled(selectedAnswers[q.question_id]))
				set.add(q.question_id);
		}
		return set;
	}, [allQuestions, selectedAnswers]);

	const jumpToQuestion = useCallback(
		(index: number) => {
			setShowMobileMinimapOverlay(false);
			setIsReviewOpen(false);
			setCurrentQuestionIndex(index);
			if (viewMode === "scroll") {
				setTimeout(() => {
					document
						.getElementById(`question-${index}`)
						?.scrollIntoView({ behavior: "smooth", block: "start" });
				}, 80);
			} else {
				window.scrollTo({ top: 0, behavior: "smooth" });
			}
		},
		[viewMode],
	);

	const openReview = useCallback(() => {
		setShowMobileMinimapOverlay(false);
		setIsReviewOpen(true);
	}, []);

	// Шалгах самбараас → одоо байгаа дуусгах (баталгаажуулах) урсгал
	const finishFromReview = useCallback(() => {
		setIsReviewOpen(false);
		setTimeout(() => finishDialogRef.current?.openConfirm(), 150);
	}, []);

	// ← → товчлуур
	useEffect(() => {
		if (viewMode !== "card") return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
			if (
				e.defaultPrevented ||
				e.altKey ||
				e.ctrlKey ||
				e.metaKey ||
				e.shiftKey
			)
				return;
			if (isReviewOpen || showMobileMinimapOverlay) return;
			if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
				return;
			const target = e.target as HTMLElement | null;
			if (
				target?.closest(
					'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="radiogroup"], [role="radio"], [role="slider"], [role="listbox"], [role="menu"], [role="tablist"]',
				)
			)
				return;
			e.preventDefault();
			if (e.key === "ArrowLeft") goToPreviousQuestion();
			else goToNextQuestion();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [
		viewMode,
		isReviewOpen,
		showMobileMinimapOverlay,
		goToPreviousQuestion,
		goToNextQuestion,
	]);

	// Утсан дээр хэвтээ swipe (pointer events)
	const SWIPE_THRESHOLD = 64;
	const swipeStart = useRef<{
		x: number;
		y: number;
		t: number;
		id: number;
	} | null>(null);
	const currentQueTypeId = allQuestions[currentQuestionIndex]?.que_type_id;
	// Чирэх төрлийн асуултууд (эрэмбэлэх, холбох) дээр swipe идэвхгүй
	const isSwipeEnabled =
		viewMode === "card" && currentQueTypeId !== 5 && currentQueTypeId !== 6;

	const handleSwipePointerDown = useCallback(
		(e: ReactPointerEvent<HTMLDivElement>) => {
			if (!isSwipeEnabled || e.pointerType === "mouse" || !e.isPrimary) return;
			const target = e.target as HTMLElement;
			if (
				target.closest(
					'input, textarea, select, [contenteditable="true"], [draggable="true"], [role="slider"], [data-no-swipe], audio, video, canvas',
				)
			) {
				swipeStart.current = null;
				return;
			}
			swipeStart.current = {
				x: e.clientX,
				y: e.clientY,
				t: Date.now(),
				id: e.pointerId,
			};
		},
		[isSwipeEnabled],
	);

	const handleSwipePointerUp = useCallback(
		(e: ReactPointerEvent<HTMLDivElement>) => {
			const start = swipeStart.current;
			swipeStart.current = null;
			if (!start || start.id !== e.pointerId) return;
			const dx = e.clientX - start.x;
			const dy = e.clientY - start.y;
			if (Date.now() - start.t > 800) return;
			if (Math.abs(dx) < SWIPE_THRESHOLD) return;
			if (Math.abs(dx) < Math.abs(dy) * 1.5) return;
			if (window.getSelection()?.toString()) return;
			if (dx < 0) goToNextQuestion();
			else goToPreviousQuestion();
		},
		[goToNextQuestion, goToPreviousQuestion],
	);

	const handleSwipePointerCancel = useCallback(() => {
		swipeStart.current = null;
	}, []);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen bg-page-gradient px-4">
				<div className="card-pop animate-pop-in text-center p-8 sm:p-10 max-w-sm w-full">
					<div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-pop-violet-soft text-pop-violet-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_35%,transparent)]">
						<Loader2 className="size-8 animate-spin" strokeWidth={2.5} />
					</div>
					<p className="text-lg font-extrabold text-foreground">
						Шалгалт ачааллаж байна...
					</p>
				</div>
			</div>
		);
	}

	if (error || !examData) {
		return (
			<div className="flex justify-center items-center min-h-screen bg-page-gradient px-4">
				<div className="card-pop animate-pop-in text-center p-8 max-w-md w-full">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-4xl">
						😵
					</div>
					<p className="text-xl font-black text-destructive mb-2">
						Алдаа гарлаа
					</p>
					<p className="text-sm font-semibold text-muted-foreground">
						{error?.message || "Шалгалт олдсонгүй"}
					</p>
					<Button
						onClick={() => window.location.reload()}
						className="mt-6"
						variant="outline"
					>
						Дахин оролдох
					</Button>
				</div>
			</div>
		);
	}

	if (allQuestions.length === 0) {
		return (
			<div className="flex justify-center items-center min-h-screen bg-page-gradient px-4">
				<div className="card-pop animate-pop-in text-center p-8 max-w-md w-full">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-pop-sun-soft text-4xl">
						📭
					</div>
					<p className="text-xl font-black text-foreground">
						Энэ шалгалтад асуулт байхгүй
					</p>
				</div>
			</div>
		);
	}

	const currentQuestion = allQuestions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === totalCount - 1;
	const unansweredList = allQuestions
		.map((q, index) => ({ q, index }))
		.filter(({ q }) => !answeredQuestionIds.has(q.question_id));
	const answeredList = allQuestions
		.map((q, index) => ({ q, index }))
		.filter(({ q }) => answeredQuestionIds.has(q.question_id));

	const savePill = isSaving ? (
		<span
			aria-live="polite"
			className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-pop-sky-soft px-3 text-xs font-extrabold text-pop-sky-ink"
		>
			<Loader2 className="size-3.5 animate-spin" strokeWidth={2.75} />
			<span className="hidden sm:inline">Хадгалж байна...</span>
		</span>
	) : pendingCount > 0 && !isFinished ? (
		<button
			type="button"
			onClick={handleManualSave}
			aria-live="polite"
			className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-pop-sun-soft px-3 text-xs font-extrabold text-pop-sun-ink shadow-[0_2px_0_0_color-mix(in_oklch,var(--pop-sun)_45%,transparent)] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-none"
		>
			<Save className="size-3.5" strokeWidth={2.75} />
			<span className="hidden sm:inline">Хадгалах</span>
			<span className="tabular-nums">({pendingCount})</span>
		</button>
	) : (
		<span
			aria-live="polite"
			className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-pop-mint-soft px-3 text-xs font-extrabold text-pop-mint-ink"
		>
			<CloudCheck className="size-3.5" strokeWidth={2.75} />
			<span className="hidden sm:inline">Хадгалсан</span>
		</span>
	);

	const viewToggle = (
		<div className="hidden shrink-0 items-center gap-2 md:flex">
			<TextSizeControl textScale={textScale} />
			<div className="flex shrink-0 gap-1 rounded-full border-2 border-border bg-muted p-1">
				<button
					type="button"
					onClick={() => {
						setViewMode("card");
						window.scrollTo({ top: 0, behavior: "smooth" });
					}}
					aria-pressed={viewMode === "card"}
					className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold transition-colors ${
						viewMode === "card"
							? "bg-primary-soft text-primary-soft-foreground shadow-[0_2px_0_0_var(--primary-soft-shade)]"
							: "text-muted-foreground hover:bg-accent hover:text-foreground"
					}`}
				>
					<LayoutGrid className="w-4 h-4" />
					Карт
				</button>
				<button
					type="button"
					onClick={() => setViewMode("scroll")}
					aria-pressed={viewMode === "scroll"}
					className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold transition-colors ${
						viewMode === "scroll"
							? "bg-primary-soft text-primary-soft-foreground shadow-[0_2px_0_0_var(--primary-soft-shade)]"
							: "text-muted-foreground hover:bg-accent hover:text-foreground"
					}`}
				>
					<List className="w-4 h-4" />
					Жагсаалт
				</button>
			</div>
		</div>
	);

	const renderQuestionCard = (
		q: PreparedQuestion,
		index: number,
		focus: boolean,
	) => (
		<SorilQuestionCard
			question={q}
			index={index}
			focus={focus}
			answer={selectedAnswers[q.question_id]}
			isBookmarked={bookmarkedQuestions.has(q.question_id)}
			isTyping={typingQuestions.has(q.question_id)}
			disabled={isFinished}
			onToggleBookmark={toggleBookmark}
			onAnswerChange={handleAnswerChange}
		/>
	);

	return (
		<div className="min-h-screen bg-page-gradient">
			{hasSaveError && (
				<output
					aria-live="polite"
					className="fixed top-4 right-4 z-50 max-w-[90vw] bg-destructive text-white font-bold px-5 py-3 rounded-2xl shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_70%,black)] animate-pop-in"
				>
					Зарим хариулт хадгалагдсангүй. Дахин оролдож байна...
				</output>
			)}

			{/* ── Sticky top bar ── */}
			<header className="sticky top-0 z-30 bg-page-gradient px-3 pt-2 pb-2 sm:px-6 sm:pt-3">
				<div className="card-pop mx-auto max-w-[1400px] space-y-2.5 p-2.5 sm:p-3">
					<div className="flex items-center gap-2 sm:gap-3">
						<div className="hidden shrink-0 lg:block">
							<StyledBackButton
								showConfirm={true}
								confirmMessage="Та гарахдаа итгэлтэй байна уу?"
							/>
						</div>
						<button
							type="button"
							onClick={() => router.back()}
							aria-label="Буцах"
							className="group flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-card shadow-[0_3px_0_0_var(--border)] transition-all active:translate-y-0.5 active:shadow-none cursor-pointer lg:hidden"
						>
							<ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:-translate-x-0.5 transition-transform" />
						</button>

						{examInfo && (
							<div className="hidden min-w-0 flex-1 lg:block">
								<ExamHeader examInfo={examInfo} />
							</div>
						)}

						<div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
							<ExamTimer
								startedDate={examInfo?.starteddate}
								fallbackStartMs={pageLoadedAt}
								compact
							/>
							{savePill}
						</div>

						{viewToggle}

						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowMobileMinimapOverlay(true)}
							className="h-10 shrink-0 text-primary xl:hidden"
							aria-label="Асуултууд"
						>
							<Menu className="w-4 h-4" strokeWidth={2.75} />
							<span className="hidden text-xs font-extrabold sm:inline">
								Асуултууд
							</span>
						</Button>

						{examInfo && (
							<div className="hidden shrink-0 sm:block">
								<FinishExamResultDialog
									ref={finishDialogRef}
									examId={examInfo.id}
									examType={examInfo.exam_type}
									startEid={examInfo.start_eid}
									getElapsedSeconds={getElapsedSeconds}
									flushAnswers={flush}
									onFinished={handleFinished}
									answeredCount={answeredCount}
									totalCount={totalCount}
									onRequestFinish={openReview}
									triggerClassName="h-10 px-4 text-sm"
								/>
							</div>
						)}
						<Button
							variant="success"
							size="icon"
							onClick={openReview}
							className="size-10 shrink-0 sm:hidden"
							aria-label="Шалгах"
						>
							<ClipboardCheck className="size-5" strokeWidth={2.5} />
						</Button>
					</div>

					{/* Segmented progress */}
					<div className="flex items-center gap-3 px-0.5">
						<span className="shrink-0 text-sm font-black text-foreground tabular-nums">
							Асуулт {currentQuestionIndex + 1}
							<span className="text-muted-foreground"> / {totalCount}</span>
						</span>
						<div
							className="flex h-2.5 min-w-0 flex-1 gap-[2px]"
							role="progressbar"
							aria-valuemin={0}
							aria-valuemax={totalCount}
							aria-valuenow={answeredCount}
							aria-label="Хариулсан асуулт"
						>
							{allQuestions.map((q, idx) => {
								const answered = answeredQuestionIds.has(q.question_id);
								const isCurrent = idx === currentQuestionIndex;
								const marked = bookmarkedQuestions.has(q.question_id);
								return (
									<span
										key={q.question_id}
										className={`h-full min-w-0 flex-1 rounded-full transition-all duration-300 first:rounded-l-full last:rounded-r-full ${
											isCurrent
												? "bg-pop-sky scale-y-[1.35] shadow-[0_0_0_1.5px_var(--card)]"
												: answered
													? marked
														? "bg-pop-sun"
														: "bg-primary-soft-shade"
													: marked
														? "bg-pop-sun/45"
														: "bg-muted"
										}`}
									/>
								);
							})}
						</div>
						<span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pop-mint-soft px-2.5 py-0.5 text-xs font-extrabold text-pop-mint-ink tabular-nums">
							<CheckCircle2 className="size-3.5" strokeWidth={2.5} />
							{answeredCount}/{totalCount}
						</span>
					</div>
				</div>
			</header>

			<div
				className={`mx-auto max-w-[1400px] px-3 pt-3 sm:px-6 xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-8 ${viewMode === "card" ? "pb-32" : "pb-10"}`}
			>
				<div className="mx-auto mb-3 flex w-full max-w-3xl items-center justify-end gap-2 md:hidden">
					<span className="text-xs font-bold text-muted-foreground">
						Бичвэр
					</span>
					<TextSizeControl textScale={textScale} />
				</div>
				<main
					className="mx-auto w-full min-w-0 max-w-3xl"
					style={{ zoom: textScale.scale }}
				>
					{examInfo && (
						<div className="mb-3 px-1 lg:hidden">
							<ExamHeader examInfo={examInfo} />
						</div>
					)}

					{viewMode === "card" ? (
						currentQuestion && (
							<div
								onPointerDown={handleSwipePointerDown}
								onPointerUp={handleSwipePointerUp}
								onPointerCancel={handleSwipePointerCancel}
								style={isSwipeEnabled ? { touchAction: "pan-y" } : undefined}
							>
								<div key={currentQuestion.question_id}>
									{renderQuestionCard(
										currentQuestion,
										currentQuestionIndex,
										true,
									)}
								</div>
								<p className="mt-3 text-center text-xs font-bold text-muted-foreground">
									<span className="hidden lg:inline">
										← → товчоор асуулт солино
									</span>
									<span className="lg:hidden">
										Хажуу тийш шударч асуулт солино
									</span>
								</p>
							</div>
						)
					) : (
						<div className="space-y-5">
							{allQuestions.map((q, index) => (
								<div
									key={q.question_id}
									id={`question-${index}`}
									className="scroll-mt-40"
								>
									{renderQuestionCard(q, index, false)}
								</div>
							))}
						</div>
					)}
				</main>

				{/* xl: slim navigator rail */}
				<aside className="hidden xl:block">
					<div className="sticky top-36 space-y-3">
						<ExamMinimap
							totalCount={totalCount}
							answeredCount={answeredCount}
							currentQuestionIndex={currentQuestionIndex}
							selectedAnswers={selectedAnswers}
							questions={allQuestions}
							onQuestionClick={jumpToQuestion}
							bookmarkedQuestions={bookmarkedQuestions}
						/>
						<Button variant="outline" className="w-full" onClick={openReview}>
							<ClipboardCheck className="size-4" strokeWidth={2.5} />
							Шалгах
						</Button>
					</div>
				</aside>
			</div>

			{/* ── Sticky bottom action bar (карт горимд л) ──
			    Жагсаалт горимд «Шалгах» нь header болон хажуугийн самбарт байна */}
			{viewMode === "card" && (
				<div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-card">
					<div className="mx-auto flex max-w-3xl gap-3 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
						<Button
							onClick={goToPreviousQuestion}
							disabled={currentQuestionIndex === 0}
							variant="outline"
							size="lg"
							className="h-12 flex-1 text-base"
						>
							<ChevronLeft className="size-5" strokeWidth={2.75} />
							Өмнөх
						</Button>
						{isLastQuestion ? (
							<Button
								onClick={openReview}
								variant="success"
								size="lg"
								className="h-12 flex-1 text-base"
							>
								<ClipboardCheck className="size-5" strokeWidth={2.5} />
								Шалгах
							</Button>
						) : (
							<Button
								onClick={goToNextQuestion}
								size="lg"
								className="h-12 flex-1 text-base"
							>
								Дараах
								<ChevronRight className="size-5" strokeWidth={2.75} />
							</Button>
						)}
					</div>
				</div>
			)}

			{/* ── Navigator sheet ── */}
			<Sheet
				open={showMobileMinimapOverlay}
				onOpenChange={setShowMobileMinimapOverlay}
			>
				<SheetContent
					side="right"
					className="w-[88vw] gap-0 overflow-y-auto bg-background p-4 sm:max-w-md"
				>
					<SheetHeader className="p-0 pr-8 pb-3">
						<SheetTitle className="text-lg font-black">☰ Асуултууд</SheetTitle>
						<SheetDescription className="font-semibold">
							{answeredCount}/{totalCount} хариулсан
						</SheetDescription>
					</SheetHeader>
					<ExamMinimap
						totalCount={totalCount}
						answeredCount={answeredCount}
						currentQuestionIndex={currentQuestionIndex}
						selectedAnswers={selectedAnswers}
						questions={allQuestions}
						onQuestionClick={jumpToQuestion}
						bookmarkedQuestions={bookmarkedQuestions}
					/>
					<Button
						variant="success"
						size="lg"
						className="mt-4 w-full"
						onClick={openReview}
					>
						<ClipboardCheck className="size-5" strokeWidth={2.5} />
						Шалгах
					</Button>
				</SheetContent>
			</Sheet>

			{/* ── Review before finish ── */}
			<Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
				<DialogContent className="w-full sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
					<DialogHeader className="text-center sm:text-center items-center space-y-2">
						<div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-pop-mint-soft text-pop-mint-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-mint)_35%,transparent)]">
							<ClipboardCheck className="size-7" strokeWidth={2.5} />
						</div>
						<DialogTitle className="text-2xl font-black">
							Хариултаа шалгах
						</DialogTitle>
						<DialogDescription className="font-semibold">
							Асуулт дээр дарж буцаж засварлах боломжтой.
						</DialogDescription>
					</DialogHeader>

					<div className="grid grid-cols-3 gap-2 py-2">
						<div className="rounded-2xl bg-pop-mint-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-mint-ink tabular-nums">
								{answeredCount}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-mint-ink sm:text-xs">
								Хариулсан
							</div>
						</div>
						<div className="rounded-2xl bg-pop-coral-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-coral-ink tabular-nums">
								{totalCount - answeredCount}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-coral-ink sm:text-xs">
								Хариулаагүй
							</div>
						</div>
						<div className="rounded-2xl bg-pop-sun-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-sun-ink tabular-nums">
								{bookmarkedQuestions.size}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-sun-ink sm:text-xs">
								Тэмдэглэсэн
							</div>
						</div>
					</div>

					<section className="space-y-2">
						<h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
							<span className="size-2.5 rounded-full bg-pop-coral" />
							Хариулаагүй ({unansweredList.length})
						</h3>
						{unansweredList.length === 0 ? (
							<p className="rounded-2xl bg-pop-mint-soft px-4 py-3 text-sm font-bold text-pop-mint-ink">
								🎉 Бүх асуултад хариулсан байна!
							</p>
						) : (
							<div className="flex flex-wrap gap-2">
								{unansweredList.map(({ q, index }) => (
									<button
										key={q.question_id}
										type="button"
										onClick={() => jumpToQuestion(index)}
										className="relative inline-flex h-9 min-w-11 items-center justify-center rounded-full border-2 border-pop-coral/50 bg-pop-coral-soft px-3 text-sm font-black text-pop-coral-ink tabular-nums transition-all hover:-translate-y-0.5 active:translate-y-0"
									>
										{index + 1}
										{bookmarkedQuestions.has(q.question_id) && (
											<Bookmark className="absolute -top-1.5 -right-1 size-3.5 fill-pop-sun text-pop-sun" />
										)}
									</button>
								))}
							</div>
						)}
					</section>

					<section className="space-y-2 pt-3">
						<h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
							<span className="size-2.5 rounded-full bg-primary" />
							Хариулсан ({answeredList.length})
						</h3>
						{answeredList.length === 0 ? (
							<p className="text-sm font-semibold text-muted-foreground">—</p>
						) : (
							<div className="flex flex-wrap gap-2">
								{answeredList.map(({ q, index }) => (
									<button
										key={q.question_id}
										type="button"
										onClick={() => jumpToQuestion(index)}
										className="relative inline-flex h-9 min-w-11 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 px-3 text-sm font-black text-primary tabular-nums transition-all hover:-translate-y-0.5 active:translate-y-0"
									>
										{index + 1}
										{bookmarkedQuestions.has(q.question_id) && (
											<Bookmark className="absolute -top-1.5 -right-1 size-3.5 fill-pop-sun text-pop-sun" />
										)}
									</button>
								))}
							</div>
						)}
					</section>

					<DialogFooter className="mt-2 flex flex-col gap-3 border-t-2 border-border pt-4 sm:flex-row">
						<Button
							variant="outline"
							onClick={() => setIsReviewOpen(false)}
							className="h-12 flex-1"
						>
							<ChevronLeft className="size-4" />
							Буцах
						</Button>
						{examInfo && !isFinished && (
							<Button
								variant="success"
								onClick={finishFromReview}
								className="h-12 flex-1"
							>
								<Send className="size-4" />
								Сорил дуусгах
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="[&_button]:bottom-24">
				<FixedScrollButton />
			</div>
		</div>
	);
}
