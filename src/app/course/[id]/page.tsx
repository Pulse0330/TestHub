"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	CheckCircle2,
	ListOrdered,
	Loader2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import StyledBackButton from "@/components/backButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { getContentView } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ContentViewResponse } from "@/types/course/contentView";
import { Homework } from "./homework";
import { LessonContent } from "./lessonContent";
import { LessonSidebar } from "./lessonSidebar";

// Loading component мемоизлох
const LoadingSpinner = memo(() => (
	<div className="flex items-center justify-center min-h-screen px-4 bg-page-gradient">
		<div className="card-pop animate-pop-in text-center space-y-4 p-8 w-full max-w-xs">
			<div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-pop-violet-soft text-pop-violet-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_35%,transparent)]">
				<Loader2 className="size-8 animate-spin" strokeWidth={2.5} />
			</div>
			<p className="text-sm md:text-base font-bold text-muted-foreground">
				Ачааллаж байна...
			</p>
		</div>
	</div>
));
LoadingSpinner.displayName = "LoadingSpinner";

// Error component мемоизлох
const ErrorMessage = memo(({ message }: { message: string }) => (
	<div className="flex items-center justify-center min-h-screen px-4 bg-page-gradient">
		<Card className="max-w-md w-full animate-pop-in">
			<CardContent className="pt-2 space-y-5">
				<div className="text-center">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-4xl">
						😵
					</div>
					<p className="text-lg md:text-xl font-black mb-2 text-destructive">
						Алдаа гарлаа
					</p>
					<p className="text-xs md:text-sm font-semibold text-muted-foreground">
						{message}
					</p>
				</div>
				<div className="flex justify-center">
					<StyledBackButton />
				</div>
			</CardContent>
		</Card>
	</div>
));
ErrorMessage.displayName = "ErrorMessage";

// Completion message мемоизлох
const CompletionMessage = memo(() => (
	<div className="mt-4 animate-pop-in rounded-3xl border-2 border-success/40 bg-success/10 p-4 md:p-5 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_35%,transparent)]">
		<div className="flex items-center gap-3 md:gap-4">
			<div className="flex size-11 md:size-12 shrink-0 items-center justify-center rounded-2xl bg-success text-primary-foreground">
				<CheckCircle2 className="size-6" strokeWidth={2.5} />
			</div>
			<div>
				<p className="text-base md:text-lg font-black text-foreground">
					Амжилттай дүүргэлээ! 🎉
				</p>
				<p className="text-xs md:text-sm font-semibold text-muted-foreground">
					Та энэ хичээлийг бүрэн судаллаа
				</p>
			</div>
		</div>
	</div>
));
CompletionMessage.displayName = "CompletionMessage";

export default function CoursePage() {
	const router = useRouter();
	const params = useParams();
	const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(0);
	const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
	const queryClient = useQueryClient();

	const content_id = Number(params.id);
	const { userId } = useAuthStore();

	const { data, isPending, isError, error } = useQuery<ContentViewResponse>({
		queryKey: ["contentView", content_id, userId],
		queryFn: () => getContentView(content_id, userId || 0),
		enabled: !!content_id && !!userId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	// Auto-scroll optimized
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			const element = document.getElementById(`lesson-${currentLessonIndex}`);
			if (element) {
				element.scrollIntoView({
					behavior: "smooth",
					block: "start",
					inline: "nearest",
				});
			}
		}, 100);

		return () => clearTimeout(timeoutId);
	}, [currentLessonIndex]);

	// Close sidebar when lesson changes on mobile
	useEffect(() => {
		setIsSidebarOpen(false);
	}, []);

	// Mark lesson as complete mutation optimized
	const markCompleteMutation = useMutation({
		mutationFn: async (_lessonId: number) => {
			return { success: true };
		},
		onMutate: async (lessonId) => {
			await queryClient.cancelQueries({
				queryKey: ["contentView", content_id, userId],
			});

			const previousData = queryClient.getQueryData<ContentViewResponse>([
				"contentView",
				content_id,
				userId,
			]);

			if (previousData?.RetData) {
				queryClient.setQueryData<ContentViewResponse>(
					["contentView", content_id, userId],
					{
						...previousData,
						RetData: previousData.RetData.map((item) =>
							item.content_id === lessonId ? { ...item, stu_worked: 1 } : item,
						),
					},
				);
			}

			return { previousData };
		},
		onError: (_err, _lessonId, context) => {
			if (context?.previousData) {
				queryClient.setQueryData(
					["contentView", content_id, userId],
					context.previousData,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ["contentView", content_id, userId],
			});
		},
	});

	// Memoized callbacks
	const handleMarkComplete = useCallback(() => {
		if (
			data?.RetData?.[currentLessonIndex] &&
			data.RetData[currentLessonIndex].stu_worked !== 1
		) {
			markCompleteMutation.mutate(data.RetData[currentLessonIndex].content_id);
		}
		if (data?.RetData && currentLessonIndex < data.RetData.length - 1) {
			setCurrentLessonIndex(currentLessonIndex + 1);
		}
	}, [currentLessonIndex, data?.RetData, markCompleteMutation]);

	const handlePrevious = useCallback(() => {
		if (currentLessonIndex > 0) {
			setCurrentLessonIndex(currentLessonIndex - 1);
		}
	}, [currentLessonIndex]);

	const handleNext = useCallback(() => {
		if (data?.RetData && currentLessonIndex < data.RetData.length - 1) {
			setCurrentLessonIndex(currentLessonIndex + 1);
		}
	}, [currentLessonIndex, data?.RetData]);

	const handleStartExam = useCallback(
		(examId: number) => {
			router.push(`/exam/${examId}`);
		},
		[router],
	);

	const handleFinish = useCallback(() => {
		router.push("/Lists/courseList");
	}, [router]);

	const handleLessonSelect = useCallback((index: number) => {
		setCurrentLessonIndex(index);
		setIsSidebarOpen(false);
	}, []);

	// Memoized values
	const contents = useMemo(() => data?.RetData || [], [data?.RetData]);
	const currentLesson = useMemo(
		() => contents[currentLessonIndex],
		[contents, currentLessonIndex],
	);
	const isCompleted = useMemo(
		() => currentLesson?.stu_worked === 1,
		[currentLesson?.stu_worked],
	);
	const isHomework = useMemo(
		() => !!(currentLesson?.exam_id && currentLesson?.examname),
		[currentLesson?.exam_id, currentLesson?.examname],
	);

	// ← → товчоор өмнөх / дараах хичээл рүү шилжих
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
				return;
			const target = e.target as HTMLElement | null;
			if (
				target &&
				(target.isContentEditable ||
					["INPUT", "TEXTAREA", "SELECT", "VIDEO", "AUDIO"].includes(
						target.tagName,
					))
			)
				return;
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				handlePrevious();
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				handleNext();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [handlePrevious, handleNext]);

	if (isPending) {
		return <LoadingSpinner />;
	}

	if (isError) {
		return <ErrorMessage message={error.message} />;
	}

	if (!data?.RetResponse?.ResponseType) {
		return (
			<ErrorMessage
				message={data?.RetResponse?.ResponseMessage || "Тодорхойгүй алдаа"}
			/>
		);
	}

	const isFirstLesson = currentLessonIndex === 0;
	const isLastLesson = currentLessonIndex === contents.length - 1;

	const sidebar = (
		<LessonSidebar
			contents={contents}
			currentLessonIndex={currentLessonIndex}
			onLessonSelect={handleLessonSelect}
			showBackButton={contents.length > 1}
		/>
	);

	return (
		<div className="min-h-screen bg-page-gradient flex flex-col">
			{/* ── Top bar ── */}
			<header className="sticky top-0 z-20 border-b-2 border-border bg-card">
				<div className="mx-auto flex max-w-[1500px] items-center gap-2 sm:gap-3 px-3 md:px-6 py-2.5">
					<div className="flex shrink-0 items-center gap-2">
						<StyledBackButton
							onClick={() => router.push("/Lists/courseList")}
						/>
						<span className="hidden md:inline text-sm font-bold text-muted-foreground">
							Буцах
						</span>
					</div>
					<div className="hidden sm:flex size-9 shrink-0 items-center justify-center rounded-xl bg-pop-violet-soft text-pop-violet-ink">
						<BookOpen className="size-5" strokeWidth={2.5} />
					</div>
					<div className="flex-1 min-w-0">
						<h1 className="text-sm md:text-lg font-black tracking-tight truncate">
							{contents[0]?.content_name || "Хичээлийн агуулга"}
						</h1>
						{contents.length > 0 && (
							<div className="mt-1 flex items-center gap-2">
								<div className="h-1.5 flex-1 max-w-xs overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-gradient-to-r from-pop-violet to-pop-pink transition-all duration-500"
										style={{
											width: `${((currentLessonIndex + 1) / contents.length) * 100}%`,
										}}
									/>
								</div>
								<span className="text-[11px] md:text-xs font-bold text-muted-foreground tabular-nums">
									{currentLessonIndex + 1} / {contents.length}
								</span>
							</div>
						)}
					</div>
					{/* Mobile lesson drawer toggle */}
					<Button
						onClick={() => setIsSidebarOpen(!isSidebarOpen)}
						variant="outline"
						size="sm"
						className="lg:hidden shrink-0 gap-1.5"
						aria-label="Toggle lesson list"
					>
						<ListOrdered className="size-4" strokeWidth={2.5} />
						<span className="hidden sm:inline">Хичээлүүд</span>
					</Button>
				</div>
			</header>

			{/* ── Mobile lesson drawer ── */}
			<Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
				<SheetContent
					side="left"
					className="lg:hidden w-[88%] max-w-sm gap-0 p-0 bg-background"
				>
					<SheetHeader className="px-4 py-3 border-b-2 border-border bg-card">
						<SheetTitle className="font-black text-lg">
							Хичээлийн жагсаалт
						</SheetTitle>
						<SheetDescription className="sr-only">
							{contents[0]?.content_name || "Хичээлийн агуулга"}
						</SheetDescription>
					</SheetHeader>
					<div className="flex-1 min-h-0 p-3">{sidebar}</div>
				</SheetContent>
			</Sheet>

			{/* ── Player body ── */}
			<div className="mx-auto w-full max-w-[1500px] flex-1 px-3 md:px-6 py-4 md:py-6">
				<div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)] gap-4 md:gap-6">
					{/* Desktop left rail */}
					<aside
						aria-label="Хичээлийн жагсаалт"
						className="hidden lg:block lg:sticky lg:top-20 lg:h-[calc(100vh-6.5rem)] self-start"
					>
						{sidebar}
					</aside>

					{/* Reading column */}
					<main className="min-w-0 flex flex-col">
						<div
							id={`lesson-${currentLessonIndex}`}
							className="mx-auto w-full max-w-4xl scroll-mt-20"
						>
							{isHomework ? (
								<Homework
									content={currentLesson}
									onStartExam={handleStartExam}
								/>
							) : (
								<>
									<LessonContent
										lesson={currentLesson}
										lessonIndex={currentLessonIndex}
										totalLessons={contents.length}
										isCompleted={isCompleted}
										onMarkComplete={handleMarkComplete}
										onPrevious={handlePrevious}
										onNext={handleNext}
										onFinish={handleFinish}
									/>

									{/* Completion Message */}
									{isCompleted && <CompletionMessage />}
								</>
							)}
						</div>

						{/* ── Sticky player controls ── */}
						<div className="sticky bottom-0 z-10 mt-4 -mx-3 md:mx-0 px-3 md:px-0 pb-3 md:pb-4 pt-2 bg-gradient-to-t from-background via-background/90 to-transparent">
							<nav
								aria-label="Хичээлийн удирдлага"
								className="mx-auto flex w-full max-w-4xl items-center gap-2 rounded-2xl border-2 border-border bg-card p-2 shadow-[0_4px_0_0_var(--border)]"
							>
								<Button
									variant="outline"
									onClick={handlePrevious}
									disabled={isFirstLesson}
									aria-label="Өмнөх хичээл"
									className="shrink-0"
								>
									<ArrowLeft className="h-4 w-4" />
									<span className="hidden sm:inline">Өмнөх хичээл</span>
								</Button>

								<span className="hidden md:inline mx-auto text-xs font-bold text-muted-foreground tabular-nums">
									<kbd className="rounded-md border-2 border-border bg-muted px-1.5 font-black">
										←
									</kbd>{" "}
									<kbd className="rounded-md border-2 border-border bg-muted px-1.5 font-black">
										→
									</kbd>
								</span>

								<div className="ml-auto flex min-w-0 items-center gap-2">
									{!isHomework && !isCompleted && (
										<Button
											onClick={handleMarkComplete}
											variant="success"
											className="min-w-0"
										>
											<CheckCircle2 className="h-4 w-4" />
											<span className="truncate">
												Дууссан
												<span className="hidden sm:inline"> гэж тэмдэглэх</span>
											</span>
										</Button>
									)}

									{!isLastLesson && (
										<Button onClick={handleNext} className="shrink-0">
											<span>
												Дараах
												<span className="hidden sm:inline"> хичээл</span>
											</span>
											<ArrowRight className="h-4 w-4" />
										</Button>
									)}

									{isLastLesson && (
										<Button onClick={handleFinish} className="shrink-0">
											Бусад хичээл
											<BookOpen className="h-4 w-4" />
										</Button>
									)}
								</div>
							</nav>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}
