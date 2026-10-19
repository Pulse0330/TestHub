import {
	ArrowRight,
	BookOpen,
	Check,
	CheckCircle2,
	FolderOpen,
	Minus,
	Plus,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "@/components/FlagIcon";
import { getLessonVisual } from "@/lib/lessonVisual";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import type { TestGroupItem } from "@/types/exercise/testGroup";

// --- Types ---
export interface LessonGroup {
	lesson_id: number;
	lesson_name: string;
	totalTests: number;
}

export interface CategoryGroup {
	coursename: string;
	ulesson_name: string;
	items: TestGroupItem[];
}

// --- Components ---

export const SkeletonCard = memo(() => (
	<div className="card-pop rounded-3xl p-4 sm:p-5 animate-pulse">
		<div className="size-10 rounded-2xl bg-muted mb-3" />
		<div className="h-4 sm:h-5 bg-muted rounded-full w-3/4 mb-2.5" />
		<div className="h-3 sm:h-4 bg-muted rounded-full w-1/2" />
	</div>
));
SkeletonCard.displayName = "SkeletonCard";

export const EmptyState = memo(() => (
	<div className="col-span-full flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
		<div className="size-20 sm:size-24 mb-4 rounded-full bg-pop-mint-soft text-pop-mint-ink flex items-center justify-center animate-float">
			<svg
				className="size-10 sm:size-12"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
		<p className="text-muted-foreground text-base font-bold">
			Өгөгдөл олдсонгүй
		</p>
	</div>
));
EmptyState.displayName = "EmptyState";

export const LessonCard = memo(
	({
		lesson,
		selectedCount,
		totalQuestions,
		onClick,
	}: {
		lesson: LessonGroup;
		selectedCount: number;
		totalQuestions: number;
		onClick: () => void;
	}) => {
		const hasSelection = selectedCount > 0;
		const v = getLessonVisual(lesson.lesson_name, lesson.lesson_id);

		return (
			<button
				type="button"
				onClick={onClick}
				className={cn(
					"group relative flex h-full w-full flex-col items-center gap-3 overflow-hidden rounded-3xl border-2 bg-card px-3 pt-6 pb-4 text-center transition-all duration-150 animate-pop-in hover:-translate-y-1 active:translate-y-0.5",
					hasSelection
						? cn(v.solid, v.shadow)
						: cn("border-border shadow-[0_4px_0_0_var(--border)]", v.hoverBorder),
				)}
				aria-label={`${lesson.lesson_name}${hasSelection ? `, ${totalQuestions} асуулт сонгосон` : ""}`}
			>
				{hasSelection && (
					<span className="absolute top-2.5 right-2.5 flex size-6 items-center justify-center rounded-full bg-white/90 text-[oklch(0.25_0.05_285)]">
						<CheckCircle2 className="size-4" strokeWidth={2.75} />
					</span>
				)}
				<span
					aria-hidden="true"
					className={cn(
						"flex size-16 items-center justify-center rounded-2xl text-3xl transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6 sm:size-[72px] sm:text-4xl",
						hasSelection ? "bg-white/25" : v.soft,
					)}
				>
					{v.flag ? <FlagIcon code={v.flag} className="h-7 w-[42px] sm:h-8 sm:w-12" /> : v.emoji}
				</span>
				<h3 className="line-clamp-2 text-sm leading-tight font-extrabold sm:text-base">
					{lesson.lesson_name}
				</h3>
				{hasSelection ? (
					<span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-extrabold whitespace-nowrap">
						{totalQuestions} асуулт сонгосон
					</span>
				) : (
					<span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold opacity-0 transition-opacity group-hover:opacity-100", v.soft)}>
						Сонгох
						<ArrowRight className="size-3" strokeWidth={3} />
					</span>
				)}
			</button>
		);
	},
);
LessonCard.displayName = "LessonCard";

export const CategoryCard = memo(
	({
		category,
		categorySelectedCount,
		categoryTotalQuestions,
		onClick,
		checked,
	}: {
		category: CategoryGroup;
		categorySelectedCount: number;
		categoryTotalQuestions: number;
		onClick: () => void;
		/** Optional multi-select state (wizard step 2). */
		checked?: boolean;
	}) => {
		const hasSelection = categorySelectedCount > 0;
		const isCheckable = checked !== undefined;

		return (
			<button
				type="button"
				onClick={onClick}
				className={cn(
					"group card-pop lift rounded-3xl p-4 sm:p-5 text-left relative overflow-hidden w-full h-full animate-pop-in hover:border-pop-mint",
					hasSelection && "border-pop-mint bg-pop-mint-soft/40",
					checked &&
						"border-primary bg-primary/10 shadow-[0_4px_0_0_var(--primary)]",
				)}
				aria-pressed={isCheckable ? checked : undefined}
				aria-label={`${category.ulesson_name}, ${category.items.length} бүлэг тест${hasSelection ? `, ${categoryTotalQuestions} асуулт сонгосон` : ""}`}
			>
				<div className="relative flex flex-col h-full min-h-[140px] sm:min-h-40 gap-3">
					<div className="flex items-start justify-between gap-2">
						<div
							className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl bg-pop-sky-soft text-pop-sky-ink transition-transform duration-200 group-hover:scale-110"
							aria-hidden="true"
						>
							<FolderOpen className="size-5" strokeWidth={2.5} />
						</div>
						<div className="flex items-center gap-1.5 shrink-0">
							{hasSelection && (
								<div className="flex items-center rounded-full bg-pop-mint px-2 py-0.5 shrink-0">
									<span className="text-[9px] sm:text-[10px] font-extrabold text-primary-foreground uppercase tracking-wider">
										Сонгосон
									</span>
								</div>
							)}
							{isCheckable && (
								<span
									className={cn(
										"flex size-7 items-center justify-center rounded-xl border-2 transition-colors",
										checked
											? "border-primary bg-primary text-primary-foreground"
											: "border-border bg-card text-transparent",
									)}
									aria-hidden="true"
								>
									<Check className="size-4" strokeWidth={3.5} />
								</span>
							)}
						</div>
					</div>
					<div className="flex-1">
						<h3 className="mb-2 text-base md:text-lg font-extrabold text-foreground group-hover:text-pop-mint-ink transition-colors leading-tight line-clamp-2">
							{category.ulesson_name}
						</h3>
						<div className="flex flex-wrap gap-1.5 text-xs">
							<p className="flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
								<span className="size-1.5 bg-pop-mint rounded-full shrink-0" />
								<span className="truncate">{category.coursename}</span>
							</p>
							<p className="rounded-full bg-pop-sky-soft px-2.5 py-1 font-bold text-pop-sky-ink">
								{category.items.length} бүлэг тест
							</p>
						</div>
					</div>
					{hasSelection && (
						<div className="flex gap-1.5 sm:gap-2">
							<div className="flex items-center gap-1.5 px-2.5 py-1 bg-pop-mint-soft rounded-full">
								<CheckCircle2 className="size-3.5 text-pop-mint-ink shrink-0" />
								<span className="text-xs font-bold text-pop-mint-ink whitespace-nowrap">
									{categoryTotalQuestions} асуулт
								</span>
							</div>
						</div>
					)}
					{!isCheckable && (
						<div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
							<ArrowRight
								className="size-5 text-pop-mint-ink"
								strokeWidth={2.75}
							/>
						</div>
					)}
				</div>
			</button>
		);
	},
);
CategoryCard.displayName = "CategoryCard";

export const TestItemCard = memo(
	({
		item,
		selectedCount,
		onCountChange,
	}: {
		item: TestGroupItem;
		selectedCount: number;
		onCountChange: (id: number, count: number) => void;
	}) => {
		const inputRef = useRef<HTMLInputElement>(null);

		const handleInputChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				const inputValue = e.target.value;

				if (inputValue === "") {
					onCountChange(item.id, 0);
					return;
				}

				if (!/^\d+$/.test(inputValue)) {
					return;
				}

				const val = Math.max(0, Math.min(item.cnt, parseInt(inputValue, 10)));
				onCountChange(item.id, val);
			},
			[item.cnt, item.id, onCountChange],
		);

		const handleDecrease = useCallback(() => {
			onCountChange(item.id, Math.max(0, selectedCount - 1));
		}, [item.id, selectedCount, onCountChange]);

		const handleIncrease = useCallback(() => {
			onCountChange(item.id, Math.min(item.cnt, selectedCount + 1));
		}, [item.id, item.cnt, selectedCount, onCountChange]);

		const handleRangeChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				onCountChange(item.id, Number(e.target.value));
			},
			[item.id, onCountChange],
		);

		// Auto-focus optimization removed for better performance
		useEffect(() => {
			if (
				selectedCount > 0 &&
				inputRef.current &&
				document.activeElement !== inputRef.current
			) {
				// Only focus if not already focused to prevent scroll jumps
				inputRef.current.focus();
			}
		}, [selectedCount]);

		const isAtMin = selectedCount === 0;
		const isAtMax = selectedCount >= item.cnt;

		return (
			<div
				className={cn(
					"group relative card-pop rounded-3xl p-3 sm:p-4 transition-colors duration-200 w-full h-full space-y-3 flex flex-col justify-between animate-pop-in",
					!isAtMin && "border-pop-mint bg-pop-mint-soft/40",
				)}
			>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<h4 className="text-xs sm:text-sm leading-tight font-extrabold text-foreground line-clamp-2 min-h-8 sm:min-h-9">
								{item.name}
							</h4>
						</TooltipTrigger>
						<TooltipContent>
							<p className="max-w-xs">{item.name}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				<fieldset className="flex justify-center border-0 p-0 m-0">
					<legend className="sr-only">{item.name} асуултын тоо сонгох</legend>
					<div className="flex w-full items-stretch gap-1.5">
						<Button
							variant="outline"
							size="icon-sm"
							onClick={handleDecrease}
							disabled={isAtMin}
							className="size-8 lg:size-9 p-0 shrink-0 rounded-xl"
							aria-label="Багасгах"
						>
							<Minus className="size-3.5 lg:size-4" strokeWidth={3} />
						</Button>

						<div className="flex-1 min-w-0 relative rounded-xl border-2 border-input bg-background focus-within:border-pop-mint">
							<input
								ref={inputRef}
								type="number"
								min="0"
								max={item.cnt}
								value={isAtMin ? "" : selectedCount}
								onChange={handleInputChange}
								placeholder="0"
								className="w-full h-full text-center bg-transparent outline-none border-none tabular-nums pr-8 font-black text-foreground"
								inputMode="numeric"
								pattern="[0-9]*"
								aria-label="Асуултын тоо"
								style={{
									fontSize: "13px",
									padding: "0 4px",
								}}
							/>
							<span
								className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none font-bold text-muted-foreground whitespace-nowrap select-none"
								style={{ fontSize: "10px" }}
								aria-hidden="true"
							>
								/{item.cnt}
							</span>
						</div>

						<Button
							variant="success"
							size="icon-sm"
							onClick={handleIncrease}
							disabled={isAtMax}
							className="size-8 lg:size-9 p-0 shrink-0 rounded-xl"
							aria-label="Нэмэгдүүлэх"
						>
							<Plus className="size-3.5 lg:size-4" strokeWidth={3} />
						</Button>
					</div>
				</fieldset>

				<div className="px-0.5 sm:px-1">
					<input
						type="range"
						min="0"
						max={item.cnt}
						value={selectedCount}
						onChange={handleRangeChange}
						className="w-full h-2 rounded-full appearance-none cursor-pointer accent-pop-mint bg-muted"
						aria-label="Асуултын тоо сонгох"
					/>
				</div>
			</div>
		);
	},
);
TestItemCard.displayName = "TestItemCard";

export const TestListItem = memo(
	({
		item,
		selectedCount,
		onCountChange,
	}: {
		item: TestGroupItem;
		selectedCount: number;
		onCountChange: (id: number, count: number) => void;
	}) => {
		const handleDecrease = useCallback(() => {
			onCountChange(item.id, Math.max(0, selectedCount - 1));
		}, [item.id, selectedCount, onCountChange]);

		const handleIncrease = useCallback(() => {
			onCountChange(item.id, Math.min(item.cnt, selectedCount + 1));
		}, [item.id, item.cnt, selectedCount, onCountChange]);

		const isAtMin = selectedCount === 0;
		const isAtMax = selectedCount >= item.cnt;

		return (
			<div
				className={cn(
					"flex flex-col sm:flex-row items-center gap-3 sm:gap-4 card-pop rounded-2xl p-3 sm:p-4 transition-colors animate-pop-in",
					!isAtMin && "border-pop-mint bg-pop-mint-soft/40",
				)}
			>
				<div className="flex flex-1 w-full sm:w-auto items-center gap-3 min-w-0">
					<div
						className="hidden sm:flex size-10 shrink-0 items-center justify-center rounded-2xl bg-pop-mint-soft text-pop-mint-ink"
						aria-hidden="true"
					>
						<BookOpen className="size-5" strokeWidth={2.5} />
					</div>
					<div className="min-w-0 flex-1 text-center sm:text-left">
						<h4 className="font-extrabold text-sm sm:text-base text-foreground">
							{item.name}
						</h4>
						<p className="mt-1 inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-muted-foreground">
							Нийт: {item.cnt} асуулт
						</p>
					</div>
				</div>

				<fieldset className="flex items-center gap-2 sm:gap-3 border-0 p-0 m-0">
					<legend className="sr-only">{item.name} асуултын тоо</legend>
					<Button
						size="sm"
						variant="outline"
						onClick={handleDecrease}
						disabled={isAtMin}
						className="rounded-xl size-8 sm:size-9 p-0"
						aria-label="Багасгах"
					>
						<Minus className="size-3.5 sm:size-4" strokeWidth={3} />
					</Button>

					<output
						className="w-10 sm:w-12 text-center font-black text-lg sm:text-xl text-pop-mint-ink tabular-nums"
						aria-live="polite"
					>
						{selectedCount}
					</output>

					<Button
						size="sm"
						variant="success"
						onClick={handleIncrease}
						disabled={isAtMax}
						className="rounded-xl size-8 sm:size-9 p-0"
						aria-label="Нэмэгдүүлэх"
					>
						<Plus className="size-3.5 sm:size-4" strokeWidth={3} />
					</Button>
				</fieldset>
			</div>
		);
	},
);
TestListItem.displayName = "TestListItem";
