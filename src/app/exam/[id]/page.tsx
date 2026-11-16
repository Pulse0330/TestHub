"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Bookmark,
	BookmarkCheck,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	CircleDashed,
	CloudCheck,
	Flag,
	Keyboard,
	List,
	ListChecks,
	Loader2,
	LogOut,
	Menu,
	RectangleVertical,
	Save,
	Send,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	formatIntegrationExamTime,
	leaveIntegrationExam,
	useExamMode,
} from "@/app/exam/component/examUtils/integration";
import FinishExamResultDialog, {
	type FinishExamDialogHandle,
} from "@/app/exam/component/finish";
import ExamMinimap from "@/app/exam/component/minimap";
import FixedScrollButton from "@/components/FixedScrollButton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useAuthStore } from "@/stores/useAuthStore";
import type { AnswerValue } from "@/types/exam/exam";
import { AdvancedExamProctor } from "../component/examguard";
import {
	computeElapsedSeconds,
	formatHMS,
	getServerNowMs,
} from "../component/examTime";
import { ExamHeader } from "../component/examUtils/examInfo";
import MathContent from "../component/examUtils/MathContent";
import ExamTimer from "../component/Itime";
import {
	type PreparedQuestion,
	prepareQuestions,
	QuestionBody,
} from "../component/QuestionBody";
import {
	TextSizeControl,
	useExamTextScale,
} from "../component/TextSizeControl";
import { isAnswerFilled, useAnswerSync } from "../component/useAnswerSync";

const SAVE_DELAYS = {
	DEFAULT: 1000,
	TYPE_3_NUMBER: 1500,
	TYPE_4_FILL: 1500,
	TYPE_5_ORDER: 2000,
	TYPE_6_MATCH: 3000,
} as const;

const getExamSaveDelay = (queTypeId: number): number => {
	switch (queTypeId) {
		case 6:
			return SAVE_DELAYS.TYPE_6_MATCH;
		case 5:
			return SAVE_DELAYS.TYPE_5_ORDER;
		case 4:
			return SAVE_DELAYS.TYPE_4_FILL;
		case 3:
			return SAVE_DELAYS.TYPE_3_NUMBER;
		default:
			return SAVE_DELAYS.DEFAULT;
	}
};

/** Minimum horizontal travel (px) for a swipe to change the question. */
const SWIPE_THRESHOLD = 60;
/** Drag-based question types: swipe navigation is disabled for them. */
const SWIPE_DISABLED_TYPES = [5, 6];

interface ExamQuestionCardProps {
	question: PreparedQuestion;
	index: number;
	isFocus: boolean;
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
const ExamQuestionCard = memo(function ExamQuestionCard({
	question: q,
	index,
	isFocus,
	answer,
	isBookmarked,
	isTyping,
	disabled,
	onToggleBookmark,
	onAnswerChange,
}: ExamQuestionCardProps) {
	const isAnswered = isAnswerFilled(answer);
	const borderClass = isTyping
		? "border-pop-sky shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sky)_45%,transparent)]"
		: isAnswered && isBookmarked
			? "border-warning shadow-[0_4px_0_0_color-mix(in_oklch,var(--warning)_55%,transparent)]"
			: isAnswered
				? "border-primary-soft-shade/70 shadow-[0_4px_0_0_color-mix(in_oklch,var(--primary-soft)_55%,transparent)]"
				: isBookmarked
					? "border-warning/70 shadow-[0_4px_0_0_color-mix(in_oklch,var(--warning)_40%,transparent)]"
					: "border-border";

	return (
		<Card className={`gap-0 py-0 transition-colors ${borderClass}`}>
			<CardContent className={isFocus ? "p-4 sm:p-6" : "p-4 sm:p-5 xl:p-6"}>
				<div className="mb-3 flex items-center justify-between gap-2">
					<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
						Асуулт {index + 1}
					</span>
					<div className="flex shrink-0 items-center gap-2">
						{isTyping && (
							<div className="flex items-center gap-1 rounded-full bg-pop-sky-soft px-2.5 py-1.5">
								<div className="flex gap-0.5">
									<span
										className="size-1.5 animate-bounce rounded-full bg-pop-sky"
										style={{ animationDelay: "0ms" }}
									/>
									<span
										className="size-1.5 animate-bounce rounded-full bg-pop-sky"
										style={{ animationDelay: "150ms" }}
									/>
									<span
										className="size-1.5 animate-bounce rounded-full bg-pop-sky"
										style={{ animationDelay: "300ms" }}
									/>
								</div>
							</div>
						)}
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onToggleBookmark(q.question_id)}
							className="size-9 shrink-0 rounded-xl"
							title={isBookmarked ? "Тэмдэглэгээ хасах" : "Тэмдэглэх"}
						>
							{isBookmarked ? (
								<BookmarkCheck className="size-5 fill-warning text-warning" />
							) : (
								<Bookmark className="size-5 text-muted-foreground" />
							)}
						</Button>
					</div>
				</div>
				<div className="mb-5 min-w-0">
					<div
						className={`prose prose-sm dark:prose-invert max-w-none font-semibold leading-relaxed text-foreground ${
							isFocus ? "text-base sm:text-lg" : "text-base lg:text-lg"
						}`}
					>
						<MathContent html={q.question_name} />
					</div>
				</div>
				<div className="min-w-0">
					<QuestionBody
						question={q}
						answer={answer}
						onAnswerChange={onAnswerChange}
						disabled={disabled}
					/>
				</div>
			</CardContent>
		</Card>
	);
});

export default function ExamPage() {
	const authUserId = useAuthStore((s) => s.userId);
	// URL-аар (dbname, userid) орж ирсэн бол integration API ашиглана
	const { integration, api: examApi } = useExamMode();
	const userId = integration?.userId ?? authUserId;
	const { id } = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(
		() => new Set(),
	);
	const [isTimeUp, setIsTimeUp] = useState(false);
	const [isFinished, setIsFinished] = useState(false);
	const [showMobileMinimapOverlay, setShowMobileMinimapOverlay] =
		useState(false);
	const finishDialogRef = useRef<FinishExamDialogHandle>(null);
	const [pageLoadedAt] = useState(() => Date.now());
	const [showExitConfirm, setShowExitConfirm] = useState(false);
	// Focus mode (one question at a time) is the default; list mode is optional.
	const [viewMode, setViewMode] = useState<"focus" | "list">("focus");
	const textScale = useExamTextScale();
	const [showReview, setShowReview] = useState(false);
	const swipeStart = useRef<{ x: number; y: number; id: number } | null>(null);
	const programmaticScrollUntil = useRef(0);
	const {
		data: examData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["exam", integration?.dbname ?? null, userId, id],
		queryFn: () => examApi.getExamById(userId || 0, Number(id)),
		enabled: !!userId && !!id,
		// Шалгалтын явцад дахин татахгүй (focus/reconnect refetch локал
		// хариултыг дарж бичдэг байсан). gcTime 0 → дахин орох бүрт шинээр татна.
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: 0,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const isLocked = isTimeUp || isFinished;
	const {
		selectedAnswers,
		typingQuestions,
		isSaving,
		pendingCount,
		hasSaveError,
		handleAnswerChange,
		flush,
		lock,
	} = useAnswerSync({
		userId,
		examData,
		locked: isLocked,
		getSaveDelay: getExamSaveDelay,
		api: examApi,
	});

	const examInfo = examData?.ExamInfo?.[0];
	const startedDate = examInfo?.starteddate;
	const examMinutes = examInfo?.minut;

	const handleManualSave = useCallback(() => {
		void flush();
	}, [flush]);

	const handleTimeUp = useCallback(
		(timeUp: boolean) => {
			if (!timeUp) return;
			lock();
			setIsTimeUp(true);
		},
		[lock],
	);

	// Цаг дуусахад: хариултыг түгжиж, хадгалаад, автоматаар дуусгана.
	// Дуусгах dialog үргэлж mount хийгдсэн тул ref хэзээ ч null биш.
	const handleAutoSubmit = useCallback(() => {
		lock();
		setIsTimeUp(true);
		setShowReview(false);
		finishDialogRef.current?.triggerFinish();
	}, [lock]);

	const handleFinished = useCallback(() => {
		lock();
		setIsFinished(true);
	}, [lock]);

	const getExamTime = useCallback(() => {
		const elapsed = computeElapsedSeconds({
			startedDate,
			serverNowMs: getServerNowMs(queryClient),
			localNowMs: Date.now(),
			fallbackStartMs: pageLoadedAt,
			maxSeconds: examMinutes ? examMinutes * 60 : undefined,
		});
		// Integration API нь "мм:сс", системийн API нь "ЦЦ:мм:сс" хүлээнэ
		return integration
			? formatIntegrationExamTime(elapsed)
			: formatHMS(elapsed);
	}, [startedDate, examMinutes, queryClient, pageLoadedAt, integration]);

	const handleLeaveExam = useCallback(() => {
		if (integration) leaveIntegrationExam(integration);
		else router.push("/Lists/examList");
	}, [integration, router]);

	const allQuestions = useMemo(() => prepareQuestions(examData), [examData]);

	const totalCount = allQuestions.length;

	const answeredCount = useMemo(() => {
		let count = 0;
		for (const q of allQuestions) {
			if (isAnswerFilled(selectedAnswers[q.question_id])) count++;
		}
		return count;
	}, [allQuestions, selectedAnswers]);

	const toggleBookmark = useCallback((questionId: number) => {
		setBookmarkedQuestions((prev) => {
			const newSet = new Set(prev);
			newSet.has(questionId)
				? newSet.delete(questionId)
				: newSet.add(questionId);
			return newSet;
		});
	}, []);

	const jumpToCard = useCallback((index: number) => {
		requestAnimationFrame(() => {
			document
				.getElementById(`question-${index}`)
				?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
	}, []);

	const goToQuestion = useCallback(
		(index: number) => {
			if (index < 0 || index >= totalCount) return;
			setCurrentQuestionIndex(index);
			if (viewMode === "list") {
				programmaticScrollUntil.current = Date.now() + 900;
				jumpToCard(index);
			} else {
				window.scrollTo({ top: 0, behavior: "smooth" });
			}
		},
		[totalCount, viewMode, jumpToCard],
	);

	const goToPreviousQuestion = useCallback(() => {
		if (currentQuestionIndex > 0) {
			goToQuestion(currentQuestionIndex - 1);
		}
	}, [currentQuestionIndex, goToQuestion]);

	const goToNextQuestion = useCallback(() => {
		if (currentQuestionIndex < totalCount - 1) {
			goToQuestion(currentQuestionIndex + 1);
		}
	}, [currentQuestionIndex, totalCount, goToQuestion]);

	// Jump from inside a Sheet/Dialog: in list mode wait for the overlay to
	// close (it locks page scroll) before scrolling to the card.
	const jumpFromOverlay = useCallback(
		(index: number) => {
			if (viewMode === "list") {
				setCurrentQuestionIndex(index);
				setTimeout(() => goToQuestion(index), 320);
			} else {
				goToQuestion(index);
			}
		},
		[viewMode, goToQuestion],
	);

	const switchViewMode = useCallback(
		(mode: "focus" | "list") => {
			if (mode === viewMode) return;
			setViewMode(mode);
			if (mode === "list") {
				programmaticScrollUntil.current = Date.now() + 900;
				setTimeout(() => {
					document
						.getElementById(`question-${currentQuestionIndex}`)
						?.scrollIntoView({ block: "start" });
				}, 30);
			} else {
				window.scrollTo({ top: 0 });
			}
		},
		[viewMode, currentQuestionIndex],
	);

	const finishFromReview = useCallback(() => {
		setShowReview(false);
		// Let the review dialog close before opening the existing confirm dialog
		setTimeout(() => finishDialogRef.current?.openConfirm(), 200);
	}, []);

	// ── Review groups (answered / unanswered / bookmarked) ──
	const reviewGroups = useMemo(() => {
		const answered: number[] = [];
		const unanswered: number[] = [];
		const bookmarked: number[] = [];
		allQuestions.forEach((q, i) => {
			if (isAnswerFilled(selectedAnswers[q.question_id])) answered.push(i);
			else unanswered.push(i);
			if (bookmarkedQuestions.has(q.question_id)) bookmarked.push(i);
		});
		return { answered, unanswered, bookmarked };
	}, [allQuestions, selectedAnswers, bookmarkedQuestions]);

	// ── Keyboard: 1–9 / A–F pick an option (single-select), ← → navigate ──
	useEffect(() => {
		if (viewMode !== "focus") return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
			const target = e.target as HTMLElement | null;
			if (
				target?.closest?.(
					"input, textarea, select, [contenteditable=''], [contenteditable='true'], [data-rfd-drag-handle-draggable-id]",
				)
			)
				return;
			// Any open dialog / sheet / alert (incl. exam-guard overlay)
			if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
				return;

			if (e.key === "ArrowLeft") {
				e.preventDefault();
				goToPreviousQuestion();
				return;
			}
			if (e.key === "ArrowRight") {
				e.preventDefault();
				goToNextQuestion();
				return;
			}

			const q = allQuestions[currentQuestionIndex];
			if (!q || q.que_type_id !== 1) return;
			let optionIndex = -1;
			if (/^[1-9]$/.test(e.key)) optionIndex = Number(e.key) - 1;
			else if (/^[a-f]$/i.test(e.key))
				optionIndex = e.key.toUpperCase().charCodeAt(0) - 65;
			if (optionIndex < 0 || optionIndex >= q.answers.length) return;
			e.preventDefault();
			// useAnswerSync ижил утгыг (болон түгжигдсэн үед) өөрөө алгасна
			handleAnswerChange(q.question_id, q.answers[optionIndex].answer_id);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [
		viewMode,
		allQuestions,
		currentQuestionIndex,
		handleAnswerChange,
		goToPreviousQuestion,
		goToNextQuestion,
	]);

	// ── List mode: keep the current index in sync with scroll position ──
	useEffect(() => {
		if (viewMode !== "list" || totalCount === 0) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (Date.now() < programmaticScrollUntil.current) return;
				const hit = entries.find((en) => en.isIntersecting);
				if (!hit) return;
				const idx = Number(hit.target.getAttribute("data-q-index"));
				if (!Number.isNaN(idx)) setCurrentQuestionIndex(idx);
			},
			{ rootMargin: "-35% 0px -60% 0px" },
		);
		for (let i = 0; i < totalCount; i++) {
			const el = document.getElementById(`question-${i}`);
			if (el) observer.observe(el);
		}
		return () => observer.disconnect();
	}, [viewMode, totalCount]);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-page-gradient px-4">
				<div className="card-pop animate-pop-in p-8 text-center">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-primary/10">
						<Loader2 className="size-8 animate-spin text-primary" />
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
			<div className="flex h-screen items-center justify-center bg-page-gradient px-4">
				<div className="card-pop w-full max-w-md animate-pop-in p-8 text-center">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-destructive/10 text-3xl">
						😕
					</div>
					<p className="mb-2 text-xl font-black text-destructive">
						Алдаа гарлаа
					</p>
					<p className="text-sm font-semibold text-muted-foreground">
						{error?.message || "Шалгалт олдсонгүй"}
					</p>
					<Button
						onClick={() => window.location.reload()}
						className="mt-5"
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
			<div className="flex h-screen items-center justify-center bg-page-gradient px-4">
				<div className="card-pop animate-pop-in p-8 text-center">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-pop-sun-soft text-3xl">
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
	const swipeEnabled =
		viewMode === "focus" &&
		!!currentQuestion &&
		!SWIPE_DISABLED_TYPES.includes(currentQuestion.que_type_id);

	const handleNextOrReview = () => {
		if (isLastQuestion) {
			setShowReview(true);
		} else {
			goToNextQuestion();
		}
	};

	// ── Swipe (touch / pen only) on the focused question ──
	const onSwipePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!swipeEnabled || e.pointerType === "mouse" || !e.isPrimary) return;
		const target = e.target as HTMLElement;
		if (
			target.closest(
				"input, textarea, select, [contenteditable='true'], [data-rfd-drag-handle-draggable-id], [data-no-swipe]",
			)
		)
			return;
		swipeStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
	};
	const onSwipePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		const start = swipeStart.current;
		swipeStart.current = null;
		if (!start || start.id !== e.pointerId) return;
		const dx = e.clientX - start.x;
		const dy = e.clientY - start.y;
		if (Math.abs(dx) < SWIPE_THRESHOLD) return;
		if (Math.abs(dx) < Math.abs(dy) * 1.5) return; // mostly vertical → scroll
		if (dx < 0) goToNextQuestion();
		else goToPreviousQuestion();
	};
	const onSwipePointerCancel = () => {
		swipeStart.current = null;
	};

	const renderQuestionCard = (
		q: PreparedQuestion,
		index: number,
		isFocus: boolean,
	) => (
		<ExamQuestionCard
			question={q}
			index={index}
			isFocus={isFocus}
			answer={selectedAnswers[q.question_id]}
			isBookmarked={bookmarkedQuestions.has(q.question_id)}
			isTyping={typingQuestions.has(q.question_id)}
			disabled={isLocked}
			onToggleBookmark={toggleBookmark}
			onAnswerChange={handleAnswerChange}
		/>
	);

	const reviewChip = (index: number, tone: "mint" | "coral" | "sun") => {
		const toneClass =
			tone === "mint"
				? "border-pop-mint/50 bg-pop-mint-soft text-pop-mint-ink"
				: tone === "coral"
					? "border-pop-coral/50 bg-pop-coral-soft text-pop-coral-ink"
					: "border-warning bg-pop-sun-soft text-pop-sun-ink";
		return (
			<button
				type="button"
				key={`${tone}-${index}`}
				onClick={() => {
					setShowReview(false);
					jumpFromOverlay(index);
				}}
				className={`min-w-11 rounded-full border-2 px-3 py-1 text-sm font-black tabular-nums transition-all hover:-translate-y-0.5 active:scale-95 ${toneClass}`}
			>
				{index + 1}
			</button>
		);
	};

	return (
		<div className="flex min-h-screen flex-col bg-page-gradient">
			{hasSaveError && (
				<output
					aria-live="polite"
					className="fixed top-4 right-4 z-50 max-w-[90vw] animate-pop-in rounded-2xl bg-destructive px-5 py-3 font-bold text-white shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_70%,black)]"
				>
					Зарим хариулт хадгалагдсангүй. Дахин оролдож байна...
				</output>
			)}

			{/* ───────── Top bar ───────── */}
			<header className="sticky top-0 z-30 bg-gradient-to-b from-background via-background/95 to-transparent px-3 pt-3 pb-2 sm:px-6 xl:px-8">
				<div className="card-pop mx-auto max-w-7xl px-3 py-3 sm:px-5">
					<div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-3">
						<div className="order-1 min-w-0 flex-1">
							{examInfo && <ExamHeader examInfo={examInfo} />}
						</div>

						{/* Exit */}
						<Button
							variant="outline"
							onClick={() => setShowExitConfirm(true)}
							className="order-2 h-10 shrink-0 border-destructive/40 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive md:order-6 md:h-11"
							title="Шалгалтаас гарах"
						>
							<LogOut className="size-4" />
							<span className="hidden lg:inline">Шалгалтаас гарах</span>
						</Button>

						{/* forces a line break on small screens */}
						<div className="order-3 h-0 basis-full md:hidden" />

						{/* Timer */}
						<div className="order-4 min-w-0 flex-1 md:order-2 md:w-56 md:flex-none">
							{examInfo && (
								<ExamTimer
									examStartTime={examInfo.ognoo}
									examEndTime={examInfo.end_time}
									examMinutes={examInfo.minut}
									startedDate={examInfo.starteddate}
									onTimeUp={handleTimeUp}
									onAutoFinish={handleAutoSubmit}
								/>
							)}
						</div>

						{/* View toggle */}
						<fieldset className="order-5 m-0 hidden min-w-0 shrink-0 rounded-xl border-2 border-border bg-muted p-0.5 sm:flex md:order-3">
							<legend className="sr-only">Харагдац</legend>
							<button
								type="button"
								aria-pressed={viewMode === "focus"}
								aria-label="Нэг нэгээр"
								onClick={() => switchViewMode("focus")}
								title="Нэг нэгээр"
								className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
									viewMode === "focus"
										? "bg-card text-primary shadow-[0_2px_0_0_var(--border)]"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<RectangleVertical className="size-4" strokeWidth={2.5} />
							</button>
							<button
								type="button"
								aria-pressed={viewMode === "list"}
								aria-label="Жагсаалтаар"
								onClick={() => switchViewMode("list")}
								title="Жагсаалтаар"
								className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
									viewMode === "list"
										? "bg-card text-primary shadow-[0_2px_0_0_var(--border)]"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<List className="size-4" strokeWidth={2.5} />
							</button>
						</fieldset>

						{/* Бичвэрийн хэмжээ */}
						<TextSizeControl
							textScale={textScale}
							className="order-5 hidden sm:flex md:order-3"
						/>

						{/* Navigator drawer trigger (rail replaces it on xl) */}
						<Button
							onClick={() => setShowMobileMinimapOverlay(true)}
							variant="outline"
							className="order-6 h-10 shrink-0 px-3 text-primary hover:text-primary md:order-4 md:h-11 xl:hidden"
						>
							<Menu className="size-4" />
							<span className="text-xs font-bold sm:text-sm">Асуултууд</span>
						</Button>
					</div>

					{/* Progress row */}
					<div className="mt-3">
						<div className="mb-1.5 flex items-center gap-2">
							<span className="text-sm font-black text-foreground tabular-nums">
								Асуулт {currentQuestionIndex + 1}
								<span className="text-muted-foreground"> / {totalCount}</span>
							</span>
							<span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-extrabold text-primary tabular-nums">
								<CheckCircle2 className="size-3.5" />
								{answeredCount}/{totalCount}
							</span>
							<div className="ml-auto">
								{isSaving ? (
									<span
										aria-live="polite"
										className="flex items-center gap-1.5 rounded-full bg-pop-sky-soft px-2.5 py-1 text-[11px] font-extrabold text-pop-sky-ink"
									>
										<Loader2 className="size-3.5 animate-spin" />
										Хадгалж байна…
									</span>
								) : pendingCount > 0 ? (
									<button
										type="button"
										onClick={handleManualSave}
										disabled={isLocked}
										className="flex items-center gap-1.5 rounded-full border-2 border-warning/60 bg-pop-sun-soft px-2.5 py-0.5 text-[11px] font-extrabold text-pop-sun-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
									>
										<Save className="size-3.5" />
										Хадгалах ({pendingCount})
									</button>
								) : (
									<span
										aria-live="polite"
										className="flex items-center gap-1.5 rounded-full bg-pop-mint-soft px-2.5 py-1 text-[11px] font-extrabold text-pop-mint-ink"
									>
										<CloudCheck className="size-3.5" />
										Хадгалагдсан ✓
									</span>
								)}
							</div>
						</div>
						<div
							className={`flex items-center ${totalCount > 60 ? "gap-px" : "gap-0.5"}`}
							aria-hidden="true"
						>
							{allQuestions.map((q, i) => {
								const isCurrent = i === currentQuestionIndex;
								const answered = isAnswerFilled(selectedAnswers[q.question_id]);
								const marked = bookmarkedQuestions.has(q.question_id);
								return (
									<span
										key={q.question_id}
										className={`min-w-0 flex-1 rounded-full transition-all ${
											isCurrent
												? "h-2.5 bg-pop-sky"
												: marked
													? "h-1.5 bg-warning"
													: answered
														? "h-1.5 bg-pop-mint"
														: "h-1.5 bg-muted"
										}`}
									/>
								);
							})}
						</div>
					</div>
				</div>
			</header>

			{/* ───────── Body ───────── */}
			<div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-3 sm:px-6 xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:px-8">
				<div className="flex min-w-0 flex-1 flex-col">
					{/* Утсан дээрх бичвэрийн хэмжээ (том дэлгэцэд header-т байна) */}
					<div className="mx-auto flex w-full max-w-3xl items-center justify-end gap-2 pt-3 sm:hidden">
						<span className="text-xs font-bold text-muted-foreground">
							Бичвэр
						</span>
						<TextSizeControl textScale={textScale} />
					</div>
					<main
						className="mx-auto w-full max-w-3xl flex-1 py-3"
						style={{ zoom: textScale.scale }}
					>
						{viewMode === "focus" ? (
							currentQuestion && (
								<div
									onPointerDown={onSwipePointerDown}
									onPointerUp={onSwipePointerUp}
									onPointerCancel={onSwipePointerCancel}
									style={
										swipeEnabled
											? { touchAction: "pan-y pinch-zoom" }
											: undefined
									}
								>
									<div
										key={currentQuestion.question_id}
										id={`question-${currentQuestionIndex}`}
										data-q-index={currentQuestionIndex}
										className="animate-pop-in"
									>
										{renderQuestionCard(
											currentQuestion,
											currentQuestionIndex,
											true,
										)}
									</div>
									<div className="mt-3 hidden items-center justify-center gap-2 text-xs font-bold text-muted-foreground lg:flex">
										<Keyboard className="size-4" />
										{currentQuestion.que_type_id === 1 && (
											<>
												<kbd className="rounded-md border-2 border-border bg-card px-1.5 font-black">
													1–9
												</kbd>
												/
												<kbd className="rounded-md border-2 border-border bg-card px-1.5 font-black">
													A–F
												</kbd>
												<span>хариулт сонгох ·</span>
											</>
										)}
										<kbd className="rounded-md border-2 border-border bg-card px-1.5 font-black">
											←
										</kbd>
										<kbd className="rounded-md border-2 border-border bg-card px-1.5 font-black">
											→
										</kbd>
										<span>асуулт солих</span>
									</div>
								</div>
							)
						) : (
							<div className="space-y-5">
								{allQuestions.map((q, index) => (
									<div
										key={q.question_id}
										id={`question-${index}`}
										data-q-index={index}
										className="scroll-mt-44"
									>
										{renderQuestionCard(q, index, false)}
									</div>
								))}
							</div>
						)}
					</main>

					{/* ───────── Sticky action bar ───────── */}
					<div className="sticky bottom-0 z-20 mx-auto w-full max-w-3xl bg-gradient-to-t from-background via-background to-transparent pt-4 pb-3">
						<div className="card-pop flex items-center gap-2 p-2 sm:gap-3 sm:p-3">
							<Button
								onClick={goToPreviousQuestion}
								disabled={currentQuestionIndex === 0}
								variant="outline"
								size="lg"
								className="h-12 min-w-0 flex-1 px-2 text-sm sm:text-base"
							>
								<ChevronLeft className="size-5" />
								Өмнөх
							</Button>
							{examInfo && !isLocked && (
								<Button
									onClick={() => setShowReview(true)}
									variant="success"
									size="lg"
									className="h-12 shrink-0 px-3 text-sm sm:px-5 sm:text-base"
								>
									<Flag className="size-4" />
									<span className="hidden sm:inline">Шалгалт дуусгах</span>
									<span className="sm:hidden">Дуусгах</span>
								</Button>
							)}
							<Button
								onClick={handleNextOrReview}
								disabled={isLastQuestion && isTimeUp}
								size="lg"
								className="h-12 min-w-0 flex-1 px-2 text-sm sm:text-base"
							>
								{isLastQuestion ? (
									<>
										Шалгах
										<ListChecks className="size-5" />
									</>
								) : (
									<>
										Дараах
										<ChevronRight className="size-5" />
									</>
								)}
							</Button>
						</div>
					</div>
				</div>

				{/* ───────── Right rail (xl) — proctor stays mounted at all sizes ───────── */}
				<aside className="contents xl:sticky xl:top-40 xl:block xl:max-h-[calc(100vh-11rem)] xl:self-start xl:space-y-4 xl:overflow-y-auto xl:scrollbar-none xl:px-1 xl:pt-3 xl:pb-3">
					<div className="hidden xl:block">
						<ExamMinimap
							totalCount={totalCount}
							answeredCount={answeredCount}
							currentQuestionIndex={currentQuestionIndex}
							selectedAnswers={selectedAnswers}
							questions={allQuestions}
							onQuestionClick={goToQuestion}
							bookmarkedQuestions={bookmarkedQuestions}
						/>
					</div>
					<AdvancedExamProctor
						maxViolations={10000}
						strictMode={true}
						enableFullscreen={true}
						statusClassName="hidden xl:block"
					/>
				</aside>
			</div>

			{/* ───────── Navigator drawer ───────── */}
			<Sheet
				open={showMobileMinimapOverlay}
				onOpenChange={setShowMobileMinimapOverlay}
			>
				<SheetContent
					side="right"
					className="w-[88vw] gap-0 overflow-y-auto border-l-2 border-border bg-background p-0 sm:max-w-sm"
				>
					<SheetHeader className="border-b-2 border-border p-4 pr-12">
						<SheetTitle className="flex items-center gap-2 text-lg font-black">
							<span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-base">
								🧭
							</span>
							Асуултууд
						</SheetTitle>
						<SheetDescription className="font-semibold">
							{answeredCount}/{totalCount} хариулсан
						</SheetDescription>
					</SheetHeader>
					<div className="p-4">
						<ExamMinimap
							totalCount={totalCount}
							answeredCount={answeredCount}
							currentQuestionIndex={currentQuestionIndex}
							selectedAnswers={selectedAnswers}
							questions={allQuestions}
							onQuestionClick={(index) => {
								setShowMobileMinimapOverlay(false);
								jumpFromOverlay(index);
							}}
							bookmarkedQuestions={bookmarkedQuestions}
						/>
					</div>
				</SheetContent>
			</Sheet>

			{/* ───────── Review before finish ───────── */}
			<Dialog open={showReview} onOpenChange={setShowReview}>
				<DialogContent className="max-h-[90vh] w-[95vw] max-w-[560px] overflow-y-auto p-5 sm:p-6">
					<DialogHeader className="space-y-2 text-center sm:text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-pop-sky-soft text-pop-sky-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sky)_35%,transparent)]">
							<ListChecks className="size-7" strokeWidth={2.5} />
						</div>
						<DialogTitle className="text-xl font-black sm:text-2xl">
							Хариултаа хянах
						</DialogTitle>
						<DialogDescription className="font-semibold">
							Асуултын дугаар дээр дарж буцаж засах боломжтой.
						</DialogDescription>
					</DialogHeader>

					<div className="grid grid-cols-3 gap-2">
						<div className="rounded-2xl bg-pop-mint-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-mint-ink">
								{reviewGroups.answered.length}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-mint-ink sm:text-xs">
								Хариулсан
							</div>
						</div>
						<div className="rounded-2xl bg-pop-coral-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-coral-ink">
								{reviewGroups.unanswered.length}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-coral-ink sm:text-xs">
								Хариулаагүй
							</div>
						</div>
						<div className="rounded-2xl bg-pop-sun-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-sun-ink">
								{reviewGroups.bookmarked.length}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-sun-ink sm:text-xs">
								Тэмдэглэсэн
							</div>
						</div>
					</div>

					<div className="space-y-4">
						{reviewGroups.unanswered.length > 0 ? (
							<section>
								<h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-pop-coral-ink">
									<CircleDashed className="size-4" />
									Хариулаагүй ({reviewGroups.unanswered.length})
								</h3>
								<div className="flex flex-wrap gap-2">
									{reviewGroups.unanswered.map((i) => reviewChip(i, "coral"))}
								</div>
							</section>
						) : (
							<div className="flex items-center gap-3 rounded-2xl bg-pop-mint-soft p-3 font-bold text-pop-mint-ink">
								<span className="text-2xl">🎉</span>
								Бүх асуултад хариулсан байна!
							</div>
						)}

						{reviewGroups.bookmarked.length > 0 && (
							<section>
								<h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-pop-sun-ink">
									<Bookmark className="size-4 fill-current" />
									Тэмдэглэсэн ({reviewGroups.bookmarked.length})
								</h3>
								<div className="flex flex-wrap gap-2">
									{reviewGroups.bookmarked.map((i) => reviewChip(i, "sun"))}
								</div>
							</section>
						)}

						{reviewGroups.answered.length > 0 && (
							<section>
								<h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-pop-mint-ink">
									<CheckCircle2 className="size-4" />
									Хариулсан ({reviewGroups.answered.length})
								</h3>
								<div className="flex flex-wrap gap-2">
									{reviewGroups.answered.map((i) => reviewChip(i, "mint"))}
								</div>
							</section>
						)}
					</div>

					<DialogFooter className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:gap-3">
						<Button
							variant="outline"
							size="lg"
							onClick={() => setShowReview(false)}
							className="w-full sm:flex-1"
						>
							<ChevronLeft className="size-4" />
							Буцах
						</Button>
						{examInfo && !isLocked && (
							<Button
								variant="success"
								size="lg"
								onClick={finishFromReview}
								className="w-full sm:flex-1"
							>
								<Send className="size-4" />
								Дуусгах
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ───────── Exit confirm ───────── */}
			<AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<div className="mb-1 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
							<LogOut className="size-7" strokeWidth={2.5} />
						</div>
						<AlertDialogTitle className="font-black">
							Шалгалтаас гарах уу?
						</AlertDialogTitle>
						<AlertDialogDescription>
							<span className="mb-3 block font-semibold">
								Та шалгалтаас гарахдаа итгэлтэй байна уу?
							</span>

							<span className="block rounded-2xl border-2 border-destructive/30 bg-destructive/10 p-3 font-bold text-destructive">
								Шалгалтыг нэг эхлүүлсэн тохиолдолд системийн хугацаа үргэлжлэн
								тоологдох бөгөөд шалгалтаас гарах эсвэл цонх хаасан ч хугацаа
								зогсохгүйг анхаарна уу.
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Болих</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleLeaveExam}
							className="bg-destructive text-white shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_70%,black)] active:shadow-[0_1px_0_0_color-mix(in_oklch,var(--destructive)_70%,black)]"
						>
							Тийм, гарах
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Finish flow (confirm + result + auto-submit). Single instance, always
			    mounted so the time-up auto-submit can always reach it. */}
			{examInfo && (
				<FinishExamResultDialog
					ref={finishDialogRef}
					examId={examInfo.id}
					examType={examInfo.exam_type}
					startEid={examInfo.start_eid}
					getExamTime={getExamTime}
					flushAnswers={flush}
					onFinished={handleFinished}
					answeredCount={answeredCount}
					totalCount={totalCount}
					hideTrigger
				/>
			)}

			{/* Lift the scroll button above the sticky action bar (transform = containing block) */}
			<div className="fixed right-0 bottom-20 z-40 size-0 [transform:translateZ(0)]">
				<FixedScrollButton />
			</div>
		</div>
	);
}
