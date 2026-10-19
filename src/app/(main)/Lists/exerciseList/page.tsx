"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	Check,
	CheckCheck,
	FolderOpen,
	Hash,
	Loader2,
	Rocket,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import StyledBackButton from "@/components/backButton";
import { Button } from "@/components/ui/button";
import {
	getTestFilter,
	getTestFiltered,
	getTestMixed,
	gettTestFill,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
	GetTestGroupResponse,
	TestGroupItem,
} from "@/types/exercise/testGroup";
import {
	CategoryCard,
	type CategoryGroup,
	EmptyState,
	LessonCard,
	SkeletonCard,
	TestItemCard,
	TestListItem,
} from "./exericeCard";

// ============================================
// CUSTOM HOOKS
// ============================================

function useDebouncedLocalStorage<T>(
	key: string,
	initialValue: T,
	delay = 500,
) {
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === "undefined") return initialValue;
		try {
			const item = window.localStorage.getItem(key);
			return item ? JSON.parse(item) : initialValue;
		} catch (error) {
			console.error(`Error reading localStorage key "${key}":`, error);
			return initialValue;
		}
	});

	const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

	const setValue = useCallback(
		(value: T | ((val: T) => T)) => {
			try {
				setStoredValue((prevValue) => {
					const valueToStore =
						value instanceof Function ? value(prevValue) : value;

					if (timeoutId) {
						clearTimeout(timeoutId);
					}

					const newTimeoutId = setTimeout(() => {
						if (typeof window !== "undefined") {
							try {
								window.localStorage.setItem(key, JSON.stringify(valueToStore));
							} catch (e) {
								console.error(`Error writing to localStorage: ${e}`);
							}
						}
					}, delay);

					setTimeoutId(newTimeoutId);
					return valueToStore;
				});
			} catch (error) {
				console.error(`Error updating state for key "${key}":`, error);
			}
		},
		[key, delay, timeoutId],
	);

	return [storedValue, setValue] as const;
}

// ============================================
// TYPES
// ============================================

interface LessonGroup {
	lesson_id: number;
	lesson_name: string;
	totalTests: number;
}

interface LessonStats {
	selectedCount: number;
	totalQuestions: number;
}

interface LessonDataItem {
	lesson_id: number;
	lesson_name: string;
}

interface LessonDataResponse {
	RetData: LessonDataItem[];
}

// ============================================
// CONSTANTS
// ============================================

const GRID_CLASSES =
	"grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-7 3xl:grid-cols-8 gap-3 lg:gap-4";

const LIST_CLASSES = "flex flex-col gap-2.5 sm:gap-3";

const SKELETON_COUNT = 12;

const RETRY_CONFIG = {
	attempts: 3,
	delay: 1000,
	backoffMultiplier: 2,
	maxRetries: 2,
} as const;

const DEFAULT_STATS: LessonStats = {
	selectedCount: 0,
	totalQuestions: 0,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateLessonStats(
	lessonGroups: LessonGroup[],
	lessonTestsMap: Map<number, TestGroupItem[]>,
	selectedTests: Record<number, number>,
): Map<number, LessonStats> {
	const stats = new Map<number, LessonStats>();

	const selectedTestsMap = new Map(
		Object.entries(selectedTests).map(([k, v]) => [Number(k), v]),
	);

	for (const lesson of lessonGroups) {
		const lessonTests = lessonTestsMap.get(lesson.lesson_id);
		if (!lessonTests) {
			stats.set(lesson.lesson_id, DEFAULT_STATS);
			continue;
		}

		let selectedCount = 0;
		let totalQuestions = 0;

		for (const test of lessonTests) {
			const count = selectedTestsMap.get(test.id);
			if (count !== undefined) {
				selectedCount++;
				totalQuestions += count;
			}
		}

		stats.set(lesson.lesson_id, { selectedCount, totalQuestions });
	}

	return stats;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TestGroupPage() {
	const { userId } = useAuthStore();
	const router = useRouter();
	const [_isPending, _startTransition] = useTransition();
	const [isMounted, setIsMounted] = useState(false);

	// FIX: Зөв destructuring хэлбэр
	const [selectedTests, setSelectedTests] = useDebouncedLocalStorage<
		Record<number, number>
	>("selectedTests", {});

	const [selectedLesson, setSelectedLesson] = useDebouncedLocalStorage<
		number | null
	>("selectedLesson", null);

	const [selectedCategory, setSelectedCategory] = useDebouncedLocalStorage<
		string | null
	>("selectedCategory", null);

	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	// Wizard UI state (presentation only)
	const [pickedCategories, setPickedCategories] = useState<string[]>(() =>
		selectedCategory ? [selectedCategory] : [],
	);
	const [stepOverride, setStepOverride] = useState<2 | 3 | 4 | null>(null);
	const [_errorMessage, setErrorMessage] = useState<string | null>(null);

	// Prevent hydration mismatch
	useEffect(() => {
		setIsMounted(true);
	}, []);

	const skeletonKeys = useMemo(
		() => Array.from({ length: SKELETON_COUNT }, (_, i) => `skeleton-${i}`),
		[],
	);

	const { data: lessonData, isLoading: isLoadingLessons } =
		useQuery<LessonDataResponse>({
			queryKey: ["testGroupByLesson", userId],
			queryFn: () => getTestFilter(userId || 0),
			enabled: !!userId && !selectedLesson,
			retry: RETRY_CONFIG.attempts,
			retryDelay: RETRY_CONFIG.delay,
			staleTime: 5 * 60 * 1000,
		});

	const { data: allLessonsData } = useQuery<GetTestGroupResponse>({
		queryKey: ["allLessonsTests", userId],
		queryFn: () => getTestFiltered(userId || 0, 0),
		enabled: !!userId,
		retry: false,
	});

	const { data, isLoading: isLoadingDetails } = useQuery<GetTestGroupResponse>({
		queryKey: ["testFiltered", userId, selectedLesson],
		queryFn: () => getTestFiltered(userId || 0, selectedLesson || 0),
		enabled: !!userId && !!selectedLesson,
		retry: false,
	});

	const handleTestMutation = useCallback(
		async (tests: { testcnt: number; rlesson_id: number }[]) => {
			for (let attempt = 0; attempt < RETRY_CONFIG.attempts; attempt++) {
				try {
					const mixedResponse = await getTestMixed(userId || 0, tests);

					if (!mixedResponse.RetResponse?.ResponseType) {
						if (attempt < RETRY_CONFIG.attempts - 1) {
							await new Promise((resolve) =>
								setTimeout(resolve, RETRY_CONFIG.delay * (attempt + 1)),
							);
							continue;
						}
						throw new Error("Failed to mix tests");
					}

					return await gettTestFill(userId || 0);
				} catch (error) {
					if (attempt === RETRY_CONFIG.attempts - 1) {
						throw error;
					}
					await new Promise((resolve) =>
						setTimeout(
							resolve,
							RETRY_CONFIG.delay * RETRY_CONFIG.backoffMultiplier ** attempt,
						),
					);
				}
			}
		},
		[userId],
	);

	const mutation = useMutation({
		mutationFn: handleTestMutation,
		onSuccess: (res) => {
			if (res?.RetResponse?.ResponseType) {
				localStorage.removeItem("selectedTests");
				localStorage.removeItem("selectedLesson");
				localStorage.removeItem("selectedCategory");
				router.push("/exercise");
			} else {
				setErrorMessage("Тест эхлүүлэхэд алдаа гарлаа. Дахин оролдоно уу.");
			}
		},
		onError: (error) => {
			console.error("Mutation error:", error);
			setErrorMessage("Сүлжээний алдаа. Дахин оролдоно уу.");
		},
	});

	const lessonGroups = useMemo(() => {
		if (!lessonData?.RetData) return [];

		return lessonData.RetData.reduce<LessonGroup[]>((acc, item) => {
			if (item.lesson_id !== 0) {
				acc.push({
					lesson_id: item.lesson_id,
					lesson_name: item.lesson_name,
					totalTests: 0,
				});
			}
			return acc;
		}, []);
	}, [lessonData]);

	const groupedData = useMemo(() => {
		if (!data?.RetData) return new Map<string, CategoryGroup>();

		const grouped = new Map<string, CategoryGroup>();
		for (const item of data.RetData) {
			const key = `${item.coursename}-${item.ulessonid}`;
			const existing = grouped.get(key);

			if (!existing) {
				grouped.set(key, {
					coursename: item.coursename,
					ulesson_name: item.ulesson_name,
					items: [item],
				});
			} else {
				existing.items.push(item);
			}
		}
		return grouped;
	}, [data]);

	const lessonTestsMap = useMemo(() => {
		if (!allLessonsData?.RetData) return new Map<number, TestGroupItem[]>();

		const map = new Map<number, TestGroupItem[]>();

		for (const item of allLessonsData.RetData) {
			const existing = map.get(item.ulessonid);
			if (!existing) {
				map.set(item.ulessonid, [item]);
			} else {
				existing.push(item);
			}
		}

		return map;
	}, [allLessonsData]);

	const lessonStats = useMemo(() => {
		return calculateLessonStats(lessonGroups, lessonTestsMap, selectedTests);
	}, [lessonGroups, lessonTestsMap, selectedTests]);

	// FIX: Type-safe totals
	const totals = useMemo(() => {
		const entries = Object.values(selectedTests);
		const questionCount = entries.reduce(
			(sum: number, count: number) => sum + count,
			0,
		);

		return {
			groupCount: entries.length,
			questionCount,
		};
	}, [selectedTests]);

	const handleTestChange = useCallback(
		(id: number, count: number) => {
			setSelectedTests((prev: Record<number, number>) => {
				if (count > 0) {
					return { ...prev, [id]: count };
				}
				const { [id]: _, ...rest } = prev;
				return rest;
			});
		},
		[setSelectedTests],
	);

	const handleBackToLessons = useCallback(() => {
		if (selectedCategory) {
			if (typeof window !== "undefined") {
				window.localStorage.removeItem("selectedCategory");
			}
			setSelectedCategory(null);
		} else if (selectedLesson) {
			if (typeof window !== "undefined") {
				window.localStorage.removeItem("selectedLesson");
			}
			setSelectedLesson(null);
		}
	}, [
		selectedCategory,
		selectedLesson,
		setSelectedCategory,
		setSelectedLesson,
	]);

	const handleLessonClick = useCallback(
		(lessonId: number) => {
			if (typeof window !== "undefined") {
				window.localStorage.setItem("selectedLesson", JSON.stringify(lessonId));
			}
			setSelectedLesson(lessonId);
		},
		[setSelectedLesson],
	);

	const handleCategoryClick = useCallback(
		(categoryKey: string) => {
			if (typeof window !== "undefined") {
				window.localStorage.setItem(
					"selectedCategory",
					JSON.stringify(categoryKey),
				);
			}
			setSelectedCategory(categoryKey);
		},
		[setSelectedCategory],
	);

	const handleStartTest = useCallback(() => {
		setErrorMessage(null);
		const payload = Object.entries(selectedTests).map(([id, count]) => ({
			testcnt: count,
			rlesson_id: Number(id),
		}));

		mutation.mutate(payload);
	}, [selectedTests, mutation]);

	const renderSkeletons = useMemo(
		() => (
			<output
				className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4"
				aria-label="Хичээлүүдийг ачааллаж байна"
			>
				{skeletonKeys.map((key) => (
					<SkeletonCard key={key} />
				))}
				<span className="sr-only">Хичээлүүдийг ачааллаж байна...</span>
			</output>
		),
		[skeletonKeys],
	);

	const renderLessonCards = useMemo(
		() => (
			<ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 list-none">
				{lessonGroups.map((lesson) => {
					const stats = lessonStats.get(lesson.lesson_id) || DEFAULT_STATS;

					return (
						<li key={lesson.lesson_id}>
							<LessonCard
								lesson={lesson}
								selectedCount={stats.selectedCount}
								totalQuestions={stats.totalQuestions}
								onClick={() => {
									setPickedCategories([]);
									setStepOverride(null);
									handleLessonClick(lesson.lesson_id);
								}}
							/>
						</li>
					);
				})}
				{lessonGroups.length === 0 && <EmptyState />}
			</ul>
		),
		[lessonGroups, lessonStats, handleLessonClick],
	);

	// ============================================
	// WIZARD (presentation flow only)
	// ============================================

	const categoryKeys = useMemo(() => [...groupedData.keys()], [groupedData]);

	// Pre-pick categories that already hold selected tests (e.g. after reload)
	useEffect(() => {
		if (categoryKeys.length === 0) return;
		setPickedCategories((prev) => {
			const valid = prev.filter((k) => groupedData.has(k));
			if (valid.length > 0) return valid;
			return categoryKeys.filter((k) =>
				groupedData.get(k)?.items.some((i) => selectedTests[i.id]),
			);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [categoryKeys, groupedData]);

	const step: WizardStep =
		stepOverride === 4
			? 4
			: !selectedLesson
				? 1
				: (stepOverride ?? (selectedCategory ? 3 : 2));

	const togglePicked = useCallback((key: string) => {
		setPickedCategories((prev) =>
			prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
		);
	}, []);

	const allPicked =
		categoryKeys.length > 0 &&
		categoryKeys.every((k) => pickedCategories.includes(k));

	const toggleAllPicked = useCallback(() => {
		setPickedCategories(allPicked ? [] : categoryKeys);
	}, [allPicked, categoryKeys]);

	const goToLessons = useCallback(() => {
		if (typeof window !== "undefined") {
			window.localStorage.removeItem("selectedCategory");
			window.localStorage.removeItem("selectedLesson");
		}
		setSelectedCategory(null);
		setSelectedLesson(null);
		setStepOverride(null);
	}, [setSelectedCategory, setSelectedLesson]);

	const goToStep = useCallback(
		(target: WizardStep) => {
			if (target === 1) {
				goToLessons();
			} else if (target === 2) {
				setStepOverride(2);
			} else if (target === 3) {
				const first = pickedCategories[0];
				if (first && first !== selectedCategory) handleCategoryClick(first);
				setStepOverride(3);
			} else {
				setStepOverride(4);
			}
			if (typeof window !== "undefined") {
				window.scrollTo({ top: 0, behavior: "smooth" });
			}
		},
		[goToLessons, pickedCategories, selectedCategory, handleCategoryClick],
	);

	const handleBack = useCallback(() => {
		if (step === 4) goToStep(selectedLesson ? 3 : 1);
		else if (step === 3) goToStep(2);
		else if (step === 2) goToStep(1);
	}, [step, selectedLesson, goToStep]);

	const canReach = useCallback(
		(target: WizardStep) => {
			if (target === 1) return true;
			if (target === 2) return !!selectedLesson;
			if (target === 3) return !!selectedLesson && pickedCategories.length > 0;
			return totals.questionCount > 0;
		},
		[selectedLesson, pickedCategories.length, totals.questionCount],
	);

	const canGoNext =
		step === 2
			? pickedCategories.length > 0
			: step === 3
				? totals.questionCount > 0
				: step === 4
					? totals.questionCount > 0
					: false;

	const handleNext = useCallback(() => {
		if (step === 2) goToStep(3);
		else if (step === 3) goToStep(4);
		else if (step === 4) handleStartTest();
	}, [step, goToStep, handleStartTest]);

	const currentLessonName = useMemo(
		() =>
			lessonGroups.find((l) => l.lesson_id === selectedLesson)?.lesson_name,
		[lessonGroups, selectedLesson],
	);

	// Lookup for the summary step: all known test groups by id
	const testItemLookup = useMemo(() => {
		const map = new Map<number, TestGroupItem>();
		for (const item of allLessonsData?.RetData ?? []) map.set(item.id, item);
		for (const item of data?.RetData ?? []) map.set(item.id, item);
		return map;
	}, [allLessonsData, data]);

	const summaryRows = useMemo(
		() =>
			Object.entries(selectedTests).map(([id, count]) => ({
				id: Number(id),
				count,
				item: testItemLookup.get(Number(id)),
			})),
		[selectedTests, testItemLookup],
	);

	// ---------- Step 2: topics ----------
	const renderCategoryStep = () => (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="text-sm font-bold text-muted-foreground">
					<span className="text-foreground font-black">
						{pickedCategories.length}
					</span>{" "}
					/ {groupedData.size} сэдэв сонгосон
				</p>
				{groupedData.size > 0 && (
					<button
						type="button"
						onClick={toggleAllPicked}
						aria-pressed={allPicked}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors",
							allPicked
								? "bg-primary text-primary-foreground border-primary"
								: "bg-card border-border text-foreground hover:border-primary",
						)}
					>
						<CheckCheck className="size-4" strokeWidth={2.75} />
						Бүгдийг сонгох
					</button>
				)}
			</div>
			<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 list-none">
				{[...groupedData.entries()].map(([key, category], index) => (
					<li
						key={key}
						className="animate-pop-in"
						style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
					>
						<CategoryCard
							category={category}
							checked={pickedCategories.includes(key)}
							categorySelectedCount={
								category.items.filter((i) => selectedTests[i.id]).length
							}
							categoryTotalQuestions={category.items.reduce(
								(sum, i) => sum + (selectedTests[i.id] || 0),
								0,
							)}
							onClick={() => togglePicked(key)}
						/>
					</li>
				))}
				{groupedData.size === 0 && <EmptyState />}
			</ul>
		</div>
	);

	// ---------- Step 3: counts ----------
	const renderCountStep = () => {
		const sections = pickedCategories
			.map((key) => [key, groupedData.get(key)] as const)
			.filter((entry): entry is readonly [string, CategoryGroup] => !!entry[1]);

		if (sections.length === 0) {
			return (
				<div className="flex flex-col items-center justify-center py-14 text-center">
					<div className="mb-4 flex size-20 items-center justify-center rounded-full bg-pop-sky-soft text-4xl">
						🗂️
					</div>
					<p className="font-black text-lg text-foreground">
						Сэдэв сонгоогүй байна
					</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => goToStep(2)}
					>
						<ArrowLeft className="size-4" strokeWidth={2.75} />
						Сэдэв сонгох
					</Button>
				</div>
			);
		}

		return (
			<div className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm font-bold text-muted-foreground">
						Сэдэв бүрээс хэдэн асуулт авахаа сонгоно уу
					</p>
					<fieldset className="flex bg-muted p-1 rounded-xl gap-1 shrink-0 border-2 border-border">
						<legend className="sr-only">Харагдах төрөл сонгох</legend>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setViewMode("grid")}
							className={cn(
								"rounded-lg px-2.5 h-8 transition-all text-muted-foreground",
								viewMode === "grid" &&
									"bg-card text-pop-mint-ink shadow-[0_2px_0_0_var(--border)]",
							)}
							aria-label="Торны харагдац"
							aria-pressed={viewMode === "grid"}
						>
							<div className="grid grid-cols-2 gap-0.5 size-3.5" aria-hidden="true">
								<div className="bg-current rounded-sm opacity-80" />
								<div className="bg-current rounded-sm opacity-80" />
								<div className="bg-current rounded-sm opacity-80" />
								<div className="bg-current rounded-sm opacity-80" />
							</div>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setViewMode("list")}
							className={cn(
								"rounded-lg px-2.5 h-8 transition-all text-muted-foreground",
								viewMode === "list" &&
									"bg-card text-pop-mint-ink shadow-[0_2px_0_0_var(--border)]",
							)}
							aria-label="Жагсаалтын харагдац"
							aria-pressed={viewMode === "list"}
						>
							<div className="flex flex-col gap-0.5 w-3.5" aria-hidden="true">
								<div className="h-1 w-full bg-current rounded-full opacity-80" />
								<div className="h-1 w-full bg-current rounded-full opacity-80" />
								<div className="h-1 w-full bg-current rounded-full opacity-80" />
							</div>
						</Button>
					</fieldset>
				</div>

				{sections.map(([key, category], sIndex) => {
					const sectionCount = category.items.reduce(
						(sum, i) => sum + (selectedTests[i.id] || 0),
						0,
					);
					const tone = POP_TONES[sIndex % POP_TONES.length];
					return (
						<section
							key={key}
							aria-labelledby={`cat-${sIndex}`}
							className="space-y-3"
						>
							<div className="flex flex-wrap items-center gap-2.5">
								<span
									className={cn(
										"flex size-9 items-center justify-center rounded-xl",
										tone,
									)}
									aria-hidden="true"
								>
									<FolderOpen className="size-4.5" strokeWidth={2.5} />
								</span>
								<h2
									id={`cat-${sIndex}`}
									className="text-base sm:text-lg font-black text-foreground min-w-0"
								>
									{category.ulesson_name}
								</h2>
								<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground truncate max-w-full">
									{category.coursename}
								</span>
								{sectionCount > 0 && (
									<span className="rounded-full bg-pop-mint-soft px-2.5 py-0.5 text-xs font-black text-pop-mint-ink">
										{sectionCount} асуулт
									</span>
								)}
							</div>
							<ul
								className={cn(
									viewMode === "grid" ? GRID_CLASSES : LIST_CLASSES,
									"list-none",
								)}
							>
								{category.items.map((item) => (
									<li key={item.id}>
										{viewMode === "grid" ? (
											<TestItemCard
												item={item}
												selectedCount={selectedTests[item.id] || 0}
												onCountChange={handleTestChange}
											/>
										) : (
											<TestListItem
												item={item}
												selectedCount={selectedTests[item.id] || 0}
												onCountChange={handleTestChange}
											/>
										)}
									</li>
								))}
							</ul>
						</section>
					);
				})}
			</div>
		);
	};

	// ---------- Step 4: summary ----------
	const renderSummaryStep = () => (
		<div className="mx-auto max-w-2xl space-y-4">
			<div className="card-pop overflow-hidden animate-pop-in">
				<div className="bg-gradient-to-br from-pop-violet to-pop-pink p-6 sm:p-8 text-primary-foreground">
					<div className="flex items-center gap-3">
						<span className="flex size-12 items-center justify-center rounded-2xl bg-card/20 text-2xl">
							🚀
						</span>
						<div>
							<p className="text-xs font-extrabold uppercase tracking-wide opacity-90">
								Хураангуй
							</p>
							<p className="text-2xl sm:text-3xl font-black">Бэлэн үү?</p>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-3 p-4 sm:p-6">
					<div className="rounded-2xl bg-pop-mint-soft p-4">
						<p className="text-xs font-bold uppercase tracking-wide text-pop-mint-ink">
							Асуулт
						</p>
						<p className="text-3xl font-black text-pop-mint-ink tabular-nums">
							{totals.questionCount}
						</p>
					</div>
					<div className="rounded-2xl bg-pop-sky-soft p-4">
						<p className="text-xs font-bold uppercase tracking-wide text-pop-sky-ink">
							Бүлэг
						</p>
						<p className="text-3xl font-black text-pop-sky-ink tabular-nums">
							{totals.groupCount}
						</p>
					</div>
				</div>

				{summaryRows.length > 0 && (
					<ul className="divide-y-2 divide-border border-t-2 border-border list-none">
						{summaryRows.map(({ id, count, item }) => (
							<li
								key={id}
								className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-accent/50"
							>
								<div className="min-w-0 flex-1">
									<p className="font-extrabold text-sm text-foreground truncate">
										{item?.name ?? `#${id}`}
									</p>
									{item && (
										<p className="text-xs font-semibold text-muted-foreground truncate">
											{item.ulesson_name} · {item.coursename}
										</p>
									)}
								</div>
								<span className="inline-flex items-center gap-1 rounded-full bg-pop-mint-soft px-2.5 py-1 text-xs font-black text-pop-mint-ink tabular-nums shrink-0">
									<Hash className="size-3" strokeWidth={3} />
									{count}
									{item ? ` / ${item.cnt}` : ""}
								</span>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => handleTestChange(id, 0)}
									aria-label="Хасах"
									className="shrink-0 text-muted-foreground hover:text-destructive"
								>
									<X className="size-4" strokeWidth={2.75} />
								</Button>
							</li>
						))}
					</ul>
				)}

				{totals.questionCount === 0 && <EmptyState />}

				{_errorMessage && (
					<p
						role="alert"
						className="mx-4 sm:mx-6 mb-4 rounded-2xl border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold text-destructive"
					>
						{_errorMessage}
					</p>
				)}

				<div className="p-4 sm:p-6 pt-0 sm:pt-0">
					<Button
						onClick={handleStartTest}
						disabled={mutation.isPending || totals.questionCount === 0}
						variant="success"
						size="lg"
						className="w-full font-bold"
						aria-label={
							mutation.isPending
								? "Тест ачааллаж байна"
								: `${totals.questionCount} асуулттай тест эхлүүлэх`
						}
					>
						{mutation.isPending ? (
							<Loader2 className="animate-spin size-5" aria-hidden="true" />
						) : (
							<>
								<Rocket className="size-5" strokeWidth={2.5} aria-hidden="true" />
								Эхлэх
							</>
						)}
					</Button>
				</div>
			</div>
			<Button
				variant="ghost"
				className="w-full"
				onClick={() => goToStep(1)}
			>
				<BookOpen className="size-4" strokeWidth={2.5} />
				Өөр хичээлээс нэмэх
			</Button>
		</div>
	);

	const isLoading = selectedLesson ? isLoadingDetails : isLoadingLessons;

	if (!userId) {
		return (
			<output
				className="h-screen flex items-center justify-center"
				aria-label="Нэвтэрч байна"
			>
				<Loader2 className="size-8 animate-spin text-primary" />
				<span className="sr-only">Нэвтэрч байна...</span>
			</output>
		);
	}

	const stepMeta = WIZARD_STEPS[step - 1];

	return (
		<div className="h-full">
			<div className="mx-auto w-full flex flex-col gap-4 pb-44 lg:pb-28">
				{/* Stepper */}
				<WizardStepper
					step={isMounted ? step : 1}
					canReach={canReach}
					onSelect={goToStep}
				/>

				{/* Contextual header */}
				<header className="flex flex-wrap items-center gap-3">
					{step > 1 && (
						<StyledBackButton
							onClick={handleBack}
							variant="ghost"
							className="flex items-center gap-1 rounded-xl border-2 border-border bg-card text-muted-foreground font-bold hover:text-pop-mint-ink hover:border-pop-mint transition-colors p-1.5 sm:p-2 min-w-9 sm:min-w-10 shadow-[0_3px_0_0_var(--border)]"
							ariaLabel={
								step === 3 ? "Бүлэг сэдэв рүү буцах" : "Хичээл рүү буцах"
							}
						/>
					)}
					<div className="min-w-0">
						<h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
							{step === 1
								? "Хичээл сонгох"
								: step === 4
									? stepMeta.label
									: "Тест сонгох"}
						</h1>
						<p className="text-sm font-semibold text-muted-foreground">
							{step > 1 && step < 4 && currentLessonName ? (
								<>
									<span className="font-extrabold text-pop-mint-ink">
										{currentLessonName}
									</span>{" "}
									· {stepMeta.label}
								</>
							) : (
								stepMeta.hint
							)}
						</p>
					</div>
				</header>

				<main>
					{step === 4
						? renderSummaryStep()
						: isLoading
							? renderSkeletons
							: step === 1
								? renderLessonCards
								: step === 2
									? renderCategoryStep()
									: renderCountStep()}
				</main>
			</div>

			{/* Floating wizard bar */}
			{isMounted && (step > 1 || totals.questionCount > 0) && (
				<section
					className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-2xl z-50 animate-pop-in"
					aria-label="Тестийн хураангуй"
				>
					<output className="bg-card rounded-2xl sm:rounded-full p-2 sm:pl-3 border-2 border-border shadow-[0_4px_0_0_var(--border)] flex items-center justify-between gap-2">
						{step > 1 ? (
							<Button
								variant="outline"
								onClick={handleBack}
								className="rounded-full px-3 sm:px-4 shrink-0"
							>
								<ArrowLeft className="size-4" strokeWidth={2.75} />
								<span className="hidden sm:inline">Буцах</span>
							</Button>
						) : null}

						<div
							className="flex items-center justify-center gap-1.5 sm:gap-2 flex-1 min-w-0"
							aria-live="polite"
						>
							<div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-pop-mint-soft text-pop-mint-ink px-2.5 sm:px-3 py-1">
								<span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
									Асуулт:
								</span>
								<span className="text-sm sm:text-base font-black">
									{totals.questionCount}
								</span>
							</div>
							<div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-pop-sky-soft text-pop-sky-ink px-2.5 sm:px-3 py-1">
								<span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
									Бүлэг:
								</span>
								<span className="text-sm sm:text-base font-black">
									{totals.groupCount}
								</span>
							</div>
						</div>

						{step === 1 ? (
							<Button
								onClick={() => goToStep(4)}
								className="rounded-full px-4 sm:px-5 font-bold shrink-0"
							>
								<span>Хураангуй</span>
								<ArrowRight className="size-4" strokeWidth={2.75} />
							</Button>
						) : step === 4 ? (
							<Button
								onClick={handleStartTest}
								disabled={mutation.isPending || totals.questionCount === 0}
								variant="success"
								className="rounded-full px-4 sm:px-6 font-bold text-sm sm:text-base shrink-0 min-w-20 md:min-w-[110px]"
								aria-label={
									mutation.isPending
										? "Тест ачааллаж байна"
										: `${totals.questionCount} асуулттай тест эхлүүлэх`
								}
							>
								{mutation.isPending ? (
									<Loader2 className="animate-spin size-4" aria-hidden="true" />
								) : (
									<div className="flex items-center gap-1.5 md:gap-2 group cursor-pointer justify-center">
										<span>Эхлэх</span>
										<ArrowRight
											className="size-4 transition-transform duration-300 group-hover:translate-x-1"
											strokeWidth={2.75}
											aria-hidden="true"
										/>
									</div>
								)}
							</Button>
						) : (
							<Button
								onClick={handleNext}
								disabled={!canGoNext}
								className="rounded-full px-4 sm:px-5 font-bold shrink-0"
							>
								<span>Дараах</span>
								<ArrowRight className="size-4" strokeWidth={2.75} />
							</Button>
						)}
					</output>
				</section>
			)}
		</div>
	);
}

// ============================================
// WIZARD STEPPER
// ============================================

type WizardStep = 1 | 2 | 3 | 4;

const WIZARD_STEPS: { label: string; hint: string }[] = [
	{ label: "Хичээл", hint: "Дасгал хийх хичээлээ сонгоно уу" },
	{ label: "Сэдэв", hint: "Нэг эсвэл хэд хэдэн сэдэв сонгоно уу" },
	{ label: "Асуултын тоо", hint: "Асуултын тоогоо тохируулна уу" },
	{ label: "Эхлэх", hint: "Сонголтоо шалгаад эхлүүлнэ үү" },
];

const POP_TONES = [
	"bg-pop-sky-soft text-pop-sky-ink",
	"bg-pop-violet-soft text-pop-violet-ink",
	"bg-pop-sun-soft text-pop-sun-ink",
	"bg-pop-coral-soft text-pop-coral-ink",
	"bg-pop-pink-soft text-pop-pink-ink",
	"bg-pop-mint-soft text-pop-mint-ink",
];

function WizardStepper({
	step,
	canReach,
	onSelect,
}: {
	step: WizardStep;
	canReach: (s: WizardStep) => boolean;
	onSelect: (s: WizardStep) => void;
}) {
	return (
		<nav aria-label="Алхам" className="card-pop px-3 py-3 sm:px-5">
			<ol className="flex items-center gap-1 sm:gap-2 list-none">
				{WIZARD_STEPS.map((s, i) => {
					const n = (i + 1) as WizardStep;
					const isActive = n === step;
					const isDone = n < step;
					const reachable = canReach(n) && !isActive;
					return (
						<li
							key={s.label}
							className={cn("flex items-center gap-1 sm:gap-2", i < 3 && "flex-1")}
						>
							<button
								type="button"
								disabled={!reachable}
								onClick={() => onSelect(n)}
								aria-current={isActive ? "step" : undefined}
								className={cn(
									"flex items-center gap-2 rounded-full transition-colors disabled:cursor-default",
									reachable && "hover:opacity-80",
								)}
							>
								<span
									className={cn(
										"flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black transition-colors",
										isActive &&
											"border-primary bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--primary-shade)]",
										isDone && "border-pop-mint bg-pop-mint-soft text-pop-mint-ink",
										!isActive &&
											!isDone &&
											"border-border bg-card text-muted-foreground",
									)}
								>
									{isDone ? <Check className="size-4" strokeWidth={3.5} /> : n}
								</span>
								<span
									className={cn(
										"text-sm font-extrabold whitespace-nowrap",
										isActive ? "inline text-foreground" : "hidden md:inline",
										isDone && "text-pop-mint-ink",
										!isActive && !isDone && "text-muted-foreground",
									)}
								>
									{s.label}
								</span>
							</button>
							{i < 3 && (
								<span
									className={cn(
										"h-1 flex-1 rounded-full min-w-2",
										isDone ? "bg-pop-mint" : "bg-muted",
									)}
									aria-hidden="true"
								/>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
