"use client";

import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	BookOpen,
	ChevronLeft,
	ChevronRight,
	GraduationCap,
	LayoutGrid,
	Library,
	List,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getFilteredContnView, getTestFilter } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { CourseListResponse } from "@/types/course/courseList";
import { CourseCard } from "./card";

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

const ITEMS_PER_PAGE = 18;

type ViewMode = "list" | "grid";
const VIEW_STORAGE_KEY = "courseList:view";

// Subject tile palette (rotates)
const SUBJECT_COLORS = [
	{
		soft: "bg-pop-violet-soft text-pop-violet-ink",
		solid: "bg-pop-violet text-primary-foreground border-pop-violet",
		dot: "bg-pop-violet",
	},
	{
		soft: "bg-pop-sky-soft text-pop-sky-ink",
		solid: "bg-pop-sky text-primary-foreground border-pop-sky",
		dot: "bg-pop-sky",
	},
	{
		soft: "bg-pop-mint-soft text-pop-mint-ink",
		solid: "bg-pop-mint text-primary-foreground border-pop-mint",
		dot: "bg-pop-mint",
	},
	{
		soft: "bg-pop-sun-soft text-pop-sun-ink",
		solid: "bg-pop-sun text-primary-foreground border-pop-sun",
		dot: "bg-pop-sun",
	},
	{
		soft: "bg-pop-coral-soft text-pop-coral-ink",
		solid: "bg-pop-coral text-primary-foreground border-pop-coral",
		dot: "bg-pop-coral",
	},
	{
		soft: "bg-pop-pink-soft text-pop-pink-ink",
		solid: "bg-pop-pink text-primary-foreground border-pop-pink",
		dot: "bg-pop-pink",
	},
];

const GRID_CLASS =
	"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 pb-4 content-start";
const LIST_CLASS = "grid grid-cols-1 xl:grid-cols-2 gap-3 pb-4 content-start";

const CourseListPage = () => {
	const { userId } = useAuthStore();
	const [selectedLessonId, setSelectedLessonId] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [view, setView] = useState<ViewMode>("list");

	// Restore the viewer's preferred layout (per-browser convenience only)
	useEffect(() => {
		try {
			const saved = localStorage.getItem(VIEW_STORAGE_KEY);
			if (saved === "grid" || saved === "list") setView(saved);
		} catch {
			/* storage unavailable */
		}
	}, []);

	const changeView = (next: ViewMode) => {
		setView(next);
		try {
			localStorage.setItem(VIEW_STORAGE_KEY, next);
		} catch {
			/* storage unavailable */
		}
	};

	const { data: lessonData } = useQuery<TestFilterResponse>({
		queryKey: ["testFilter", userId],
		queryFn: () => getTestFilter(userId || 0),
		enabled: !!userId,
	});

	const {
		data: queryData,
		isPending,
		isError,
		error,
	} = useQuery<CourseListResponse>({
		queryKey: ["filteredCourseList", userId, selectedLessonId],
		queryFn: () => getFilteredContnView(userId || 0, selectedLessonId),
		enabled: !!userId,
		staleTime: 0,
		refetchOnMount: true,
	});

	const lessons = useMemo(() => lessonData?.RetData || [], [lessonData]);

	const courses = useMemo(() => {
		if (!queryData) return [];
		if (!queryData.RetResponse.ResponseType) return [];
		return queryData.RetData || [];
	}, [queryData]);

	const paginatedCourses = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return courses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [courses, currentPage]);

	const totalPages = Math.ceil(courses.length / ITEMS_PER_PAGE);

	// Шүүлтүүр өөрчлөгдөхөд хуудсыг 1 рүү буцаах
	useEffect(() => {
		setCurrentPage(1);
	}, []);

	const skeletonIds = [1, 2, 3, 4, 5, 6];

	const toolbar = (
		<LibraryToolbar
			count={isPending ? null : courses.length}
			view={view}
			onViewChange={changeView}
		/>
	);

	const subjects = (
		<SubjectShelf
			lessons={lessons}
			selectedLessonId={selectedLessonId}
			onLessonSelect={setSelectedLessonId}
		/>
	);

	if (isPending) {
		return (
			<div className="min-h-screen flex flex-col">
				<div className="mx-auto w-full flex flex-col gap-4 sm:gap-5">
					{toolbar}
					{subjects}
					<div className={view === "grid" ? GRID_CLASS : LIST_CLASS}>
						{skeletonIds.map((id) =>
							view === "grid" ? (
								<SkeletonCard key={id} />
							) : (
								<SkeletonRow key={id} />
							),
						)}
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center px-4">
				<div className="text-center space-y-3 max-w-md animate-pop-in">
					<div className="mx-auto mb-4 flex size-24 items-center justify-center rounded-full bg-destructive/10">
						<AlertCircle className="size-12 text-destructive" strokeWidth={2.5} />
					</div>
					<h2 className="text-xl font-black text-destructive">Алдаа гарлаа</h2>
					<p className="font-semibold text-muted-foreground">
						{error?.message || "Мэдээлэл татахад алдаа гарлаа"}
					</p>
				</div>
			</div>
		);
	}

	if (!userId) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center">
				<div className="card-pop text-center p-8">
					<p className="text-lg font-bold text-muted-foreground">
						Хэрэглэгчийн мэдээлэл олдсонгүй
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col">
			<div className="mx-auto w-full flex flex-col gap-4 sm:gap-5">
				{toolbar}
				{subjects}

				{selectedLessonId !== 0 && (
					<div className="flex w-fit max-w-full items-center gap-2 rounded-full bg-pop-pink-soft px-4 py-1.5 text-sm font-semibold text-pop-pink-ink">
						<AlertCircle className="size-4 shrink-0" strokeWidth={2.5} />
						<span>
							<strong className="font-black">{courses.length}</strong> хичээл
							олдлоо{" "}
							<strong className="font-black">
								{
									lessons.find((l) => l.lesson_id === selectedLessonId)
										?.lesson_name
								}
							</strong>{" "}
							хичээлд
						</span>
					</div>
				)}

				<div className={view === "grid" ? GRID_CLASS : LIST_CLASS}>
					{paginatedCourses.map((course, idx) => (
						<CourseCard
							key={course.content_id}
							course={course}
							index={idx}
							variant={view === "grid" ? "grid" : "row"}
						/>
					))}
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex flex-wrap items-center justify-center gap-2 mt-2 mb-10">
						<Button
							variant="outline"
							size="icon"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="rounded-xl"
						>
							<ChevronLeft className="size-5" strokeWidth={2.75} />
						</Button>

						<div className="flex flex-wrap items-center justify-center gap-1.5">
							{Array.from({ length: totalPages }, (_, i) => i + 1).map(
								(page) => (
									<Button
										key={page}
										variant={currentPage === page ? "default" : "ghost"}
										size="sm"
										onClick={() => setCurrentPage(page)}
										className={cn(
											"size-9 rounded-xl px-0 font-extrabold",
											currentPage !== page && "text-muted-foreground",
										)}
									>
										{page}
									</Button>
								),
							)}
						</div>

						<Button
							variant="outline"
							size="icon"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							className="rounded-xl"
						>
							<ChevronRight className="size-5" strokeWidth={2.75} />
						</Button>
					</div>
				)}

				{courses.length === 0 && (
					<div className="card-pop text-center py-12 px-6 space-y-2 animate-pop-in">
						<div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-full bg-pop-pink-soft animate-float">
							<BookOpen className="size-12 text-pop-pink-ink" strokeWidth={2.25} />
						</div>
						<p className="text-xl font-black text-foreground">
							Хичээл олдсонгүй
						</p>
						<p className="text-sm font-semibold text-muted-foreground">
							{selectedLessonId !== 0
								? "Энэ хичээлд контент олдсонгүй."
								: "Та одоогоор ямар ч хичээлд бүртгүүлээгүй байна."}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

// ─── Compact toolbar (title + count + view toggle) ────────────────────────────

const LibraryToolbar = ({
	count,
	view,
	onViewChange,
}: {
	count: number | null;
	view: ViewMode;
	onViewChange: (v: ViewMode) => void;
}) => (
	<header className="flex flex-wrap items-center justify-between gap-3">
		<div className="flex items-center gap-3 min-w-0">
			<div
				className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pop-pink-soft text-pop-pink-ink shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-pink)_35%,transparent)]"
				aria-hidden="true"
			>
				<GraduationCap className="size-5" strokeWidth={2.5} />
			</div>
			<h1 className="text-lg md:text-xl font-black tracking-tight text-foreground">
				Миний хичээлүүд
			</h1>
			{count !== null && (
				<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-muted-foreground">
					{count}
				</span>
			)}
		</div>

		<div
			role="group"
			aria-label="Харагдац"
			className="flex items-center gap-1 rounded-xl border-2 border-border bg-card p-1"
		>
			{(
				[
					{ id: "list", icon: List, label: "Жагсаалт" },
					{ id: "grid", icon: LayoutGrid, label: "Хүснэгт" },
				] as const
			).map(({ id, icon: Icon, label }) => (
				<button
					key={id}
					type="button"
					onClick={() => onViewChange(id)}
					aria-pressed={view === id}
					aria-label={label}
					title={label}
					className={cn(
						"flex size-8 items-center justify-center rounded-lg transition-colors",
						view === id
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:bg-accent hover:text-foreground",
					)}
				>
					<Icon className="size-4" strokeWidth={2.5} />
				</button>
			))}
		</div>
	</header>
);

// ─── Subject tiles (filter) ───────────────────────────────────────────────────

const SubjectShelf = ({
	lessons,
	selectedLessonId,
	onLessonSelect,
}: {
	lessons: Lesson[];
	selectedLessonId: number;
	onLessonSelect: (id: number) => void;
}) => {
	if (lessons.length === 0) return null;
	const hasAllOption = lessons.some((l) => l.lesson_id === 0);

	const tiles: { id: number; name: string }[] = [
		...(hasAllOption ? [] : [{ id: 0, name: "Бүгд" }]),
		...lessons.map((l) => ({ id: l.lesson_id, name: l.lesson_name })),
	];

	return (
		<nav
			aria-label="Хичээл сонгох"
			className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 sm:gap-3 overflow-x-auto scrollbar-none pb-1 sm:flex-wrap sm:overflow-visible"
		>
			{tiles.map((tile, i) => {
				const color =
					tile.id === 0 && !hasAllOption
						? null
						: SUBJECT_COLORS[i % SUBJECT_COLORS.length];
				const active = selectedLessonId === tile.id;
				return (
					<button
						key={tile.id}
						type="button"
						onClick={() => onLessonSelect(tile.id)}
						aria-pressed={active}
						aria-label={`${tile.name} хичээл сонгох`}
						className={cn(
							"group flex shrink-0 items-center gap-2.5 rounded-2xl border-2 py-2 pl-2 pr-4 text-sm font-extrabold transition-all duration-150 whitespace-nowrap",
							active
								? cn(
										color ? color.solid : "bg-primary text-primary-foreground border-primary",
										"shadow-[0_3px_0_0_color-mix(in_oklch,var(--foreground)_25%,transparent)] -translate-y-0.5",
									)
								: "border-border bg-card text-foreground shadow-[0_3px_0_0_var(--border)] hover:-translate-y-0.5 active:translate-y-0.5",
						)}
					>
						<span
							className={cn(
								"flex size-8 items-center justify-center rounded-xl",
								active
									? "bg-card/25 text-current"
									: color
										? color.soft
										: "bg-muted text-muted-foreground",
							)}
							aria-hidden="true"
						>
							{tile.id === 0 && !hasAllOption ? (
								<Library className="size-4" strokeWidth={2.5} />
							) : (
								<span className="text-sm font-black">
									{tile.name.charAt(0).toUpperCase()}
								</span>
							)}
						</span>
						{tile.name}
					</button>
				);
			})}
		</nav>
	);
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
	<div className="card-pop w-full flex flex-col overflow-hidden rounded-3xl animate-pulse">
		<div className="aspect-5/2 w-full bg-muted relative shrink-0" />
		<div className="flex flex-col flex-1 p-3 gap-3">
			<div className="space-y-2 flex-1">
				<div className="h-4 w-3/4 bg-muted rounded-full" />
				<div className="h-3 w-1/2 bg-muted rounded-full" />
			</div>
			<div className="h-6 w-full bg-muted rounded-full" />
		</div>
	</div>
);

const SkeletonRow = () => (
	<div className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-3 animate-pulse">
		<div className="aspect-4/3 w-20 sm:w-32 shrink-0 rounded-xl bg-muted" />
		<div className="flex-1 space-y-2">
			<div className="h-4 w-3/4 bg-muted rounded-full" />
			<div className="h-3 w-1/2 bg-muted rounded-full" />
		</div>
		<div className="hidden sm:block h-9 w-20 rounded-xl bg-muted" />
	</div>
);

export default CourseListPage;
