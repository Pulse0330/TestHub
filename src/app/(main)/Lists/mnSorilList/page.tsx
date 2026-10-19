"use client";

import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	CreditCard,
	Lock,
	RotateCw,
	Search,
	Sparkles,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { type ReactNode, useCallback, useMemo, useState } from "react";
import LessonFilter from "@/components/LessonFilter";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getSorilFilteredlists, getTestFilter } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
	ApiSorillistsResponse,
	SorillistsData,
} from "@/types/soril/sorilLists";
import { SorilCard } from "./card";

type SorilCategory = "all" | "completed" | "notstarted";

const ITEMS_PER_PAGE = 18;

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

export default function MnSorilLits() {
	const { userId } = useAuthStore();
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState("");
	const [showDone, setShowDone] = useState(false);
	const [selectedCategory, _setSelectedCategory] =
		useState<SorilCategory>("all");
	const [selectedLessonId, setSelectedLessonId] = useState<number>(0); // 0 = Бүгд
	const [showPaymentDialog, setShowPaymentDialog] = useState(false);
	const [selectedSoril, setSelectedSoril] = useState<SorillistsData | null>(
		null,
	);

	const SKELETON_KEYS = Array.from({ length: 8 }, (_, i) => `skeleton-${i}`);

	// Lesson filter API - хичээлийн жагсаалт
	const { data: lessonData } = useQuery<TestFilterResponse>({
		queryKey: ["testFilter", userId],
		queryFn: () => getTestFilter(userId || 0),
		enabled: !!userId,
	});

	// Soril list API - сонгосон хичээлээр шүүсэн сорилууд
	const { data: queryData, isPending } = useQuery<ApiSorillistsResponse>({
		queryKey: ["sorillists", userId, selectedLessonId],
		queryFn: () => getSorilFilteredlists(userId || 0, selectedLessonId),
		enabled: !!userId,
	});

	const data = useMemo(() => queryData?.RetData || [], [queryData]);
	const lessons = useMemo(() => lessonData?.RetData || [], [lessonData]);

	const categorizedData = useMemo(() => {
		return {
			completed: data.filter((e) => e.isguitset === 1),
			notstarted: data.filter((e) => e.isguitset === 0),
		};
	}, [data]);

	// Filter логик: Category + Search (Lesson нь API-аас шууд ирнэ)
	const filteredData = useMemo(() => {
		let sorils = data;

		// 1. Сонгосон категорийн дагуу шүүх
		switch (selectedCategory) {
			case "all":
				sorils = data;
				break;
			case "completed":
				sorils = categorizedData.completed;
				break;
			case "notstarted":
				sorils = categorizedData.notstarted;
				break;
			default:
				sorils = data;
		}

		// 2. Хайлтын шүүлтүүр
		if (searchTerm.trim()) {
			sorils = sorils.filter(
				(soril) =>
					soril.soril_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(soril.plan_name || "")
						.toLowerCase()
						.includes(searchTerm.toLowerCase()),
			);
		}

		return sorils;
	}, [data, categorizedData, selectedCategory, searchTerm]);

	// Төлөвөөр бүлэглэх
	const groups = useMemo(() => {
		const inProgress: SorillistsData[] = [];
		const fresh: SorillistsData[] = [];
		const done: SorillistsData[] = [];
		for (const s of filteredData) {
			if (s.isguitset === 1) done.push(s);
			else if (s.test_resid > 0) inProgress.push(s);
			else fresh.push(s);
		}
		return { inProgress, fresh, done };
	}, [filteredData]);

	const handleSorilClick = useCallback(
		(soril: SorillistsData) => {
			const isAccessible = soril.isopensoril === 1 || soril.ispay === 1;

			if (!isAccessible) {
				setSelectedSoril(soril);
				setShowPaymentDialog(true);
				return;
			}
			router.push(`/soril/${soril.exam_id}`);
		},
		[router],
	);

	// Handle payment confirmation
	const handlePaymentConfirm = useCallback(() => {
		setShowPaymentDialog(false);
		router.push("/Lists/paymentCoureList");
	}, [router]);

	// Handle payment dialog close
	const handlePaymentCancel = useCallback(() => {
		setShowPaymentDialog(false);
		setSelectedSoril(null);
	}, []);

	const selectedLessonName = lessons.find(
		(l) => l.lesson_id === selectedLessonId,
	)?.lesson_name;

	return (
		<div className="w-full">
			<div className="flex flex-col">
				{/* Sticky toolbar */}
				<div className="mb-6 border-b-2 border-border pb-4">
					<div className="flex flex-col-reverse gap-3">
						<div className="min-w-0 flex-1">
							{selectedLessonId !== null && (
								<LessonFilter
									lessons={lessons}
									selectedLessonId={selectedLessonId}
									onLessonSelect={setSelectedLessonId}
								/>
							)}
						</div>
						<div className="flex items-center">
							<SearchBox
								value={searchTerm}
								onChange={setSearchTerm}
								placeholder="Сорил хайх..."
							/>
						</div>
					</div>
				</div>

				{/* Results Info */}
				{!isPending && (selectedLessonId !== 0 || searchTerm) && (
					<div className="mb-5 inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-pop-pink-soft px-4 py-1.5 text-sm font-semibold text-pop-pink-ink">
						<AlertCircle size={16} className="shrink-0" />
						<span className="min-w-0">
							<strong className="font-black">{filteredData.length}</strong> сорил олдлоо
							{searchTerm && (
								<>
									{" "}
									&ldquo;<strong className="font-black">{searchTerm}</strong>&rdquo; гэсэн хайлтаар
								</>
							)}
							{selectedLessonId !== 0 && (
								<>
									{" "}
									<strong className="font-black">{selectedLessonName}</strong>{" "}
									хичээлд
								</>
							)}
						</span>
					</div>
				)}

				{isPending ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
						{SKELETON_KEYS.map((key) => (
							<SkeletonCard key={key} />
						))}
					</div>
				) : filteredData.length === 0 ? (
					/* Empty State */
					<div className="flex flex-col items-center justify-center space-y-3 py-14 text-center">
						<div className="flex size-20 items-center justify-center rounded-full bg-pop-pink-soft text-pop-pink-ink">
							<AlertCircle className="size-10" strokeWidth={2.5} />
						</div>
						<p className="text-xl font-extrabold text-foreground">
							Сорил олдсонгүй
						</p>
						<p className="max-w-sm text-sm font-semibold text-muted-foreground">
							{searchTerm
								? `"${searchTerm}" хайлтад тохирох сорил олдсонгүй.`
								: selectedLessonId === 0
									? "Танд одоогоор сорил байхгүй байна."
									: `${selectedLessonName || "Энэ хичээл"}-д сорил байхгүй байна.`}
						</p>
					</div>
				) : (
					<div className="space-y-10 pb-4">
						{groups.inProgress.length > 0 && (
							<Section
								icon={<RotateCw className="size-4" strokeWidth={2.5} />}
								tone="bg-pop-sky-soft text-pop-sky-ink"
								title="Үргэлжлүүлэх"
								count={groups.inProgress.length}
							>
								<CardGrid
									items={groups.inProgress}
									onSelect={handleSorilClick}
								/>
							</Section>
						)}

						<Section
							icon={<Sparkles className="size-4" strokeWidth={2.5} />}
							tone="bg-pop-pink-soft text-pop-pink-ink"
							title="Шинэ"
							count={groups.fresh.length}
						>
							{groups.fresh.length > 0 ? (
								<CardGrid items={groups.fresh} onSelect={handleSorilClick} />
							) : (
								<div className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-border bg-card/60 p-5">
									<span className="text-3xl" aria-hidden>
										🎉
									</span>
									<p className="text-sm font-semibold text-muted-foreground">
										Шинэ сорил алга — бүгдийг нь эхлүүлсэн байна!
									</p>
								</div>
							)}
						</Section>

						{groups.done.length > 0 && (
							<section>
								<button
									type="button"
									onClick={() => setShowDone((v) => !v)}
									aria-expanded={showDone}
									className="mb-3 flex w-full items-center gap-2 text-left"
								>
									<span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
										<CheckCircle2 className="size-4" strokeWidth={2.5} />
									</span>
									<h2 className="text-base font-extrabold text-muted-foreground">
										Дууссан
									</h2>
									<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-black text-muted-foreground">
										{groups.done.length}
									</span>
									<span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
										{showDone ? "Хураах" : "Харах"}
										<ChevronDown
											className={cn(
												"size-4 transition-transform",
												showDone && "rotate-180",
											)}
										/>
									</span>
								</button>
								{showDone && (
									<RowList items={groups.done} onSelect={handleSorilClick} />
								)}
							</section>
						)}
					</div>
				)}
			</div>

			{/* Payment Dialog */}
			<Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
				<DialogContent className="rounded-3xl border-2 sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3 text-xl font-black">
							<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pop-sun-soft text-pop-sun-ink">
								<Lock className="size-5" strokeWidth={2.5} />
							</span>
							Төлбөртэй сорил
						</DialogTitle>
						{/* asChild нэмснээр DialogDescription нь доорх <div>-ээр солигдоно */}
						<DialogDescription asChild className="pt-4 space-y-2">
							<div className="text-sm font-semibold text-muted-foreground">
								<div className="font-extrabold text-foreground">
									{selectedSoril?.soril_name}
								</div>
								Энэхүү сорил төлбөртэй юм. Үргэлжлүүлэхийн тулд төлбөр төлөх
								шаардлагатай.
							</div>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex-row gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={handlePaymentCancel}
							className="flex-1 sm:flex-none"
						>
							Цуцлах
						</Button>
						<Button
							type="button"
							onClick={handlePaymentConfirm}
							className="flex-1 sm:flex-none"
						>
							<CreditCard />
							Төлбөр төлөх
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function CardGrid({
	items,
	onSelect,
}: {
	items: SorillistsData[];
	onSelect: (s: SorillistsData) => void;
}) {
	const [limit, setLimit] = useState(ITEMS_PER_PAGE);
	const visible = items.slice(0, limit);
	return (
		<>
			<div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
				{visible.map((soril, index) => (
					<div
						key={soril.exam_id}
						className="h-full animate-pop-in"
						style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
					>
						<SorilCard exam={soril} onClick={() => onSelect(soril)} />
					</div>
				))}
			</div>
			{items.length > limit && (
				<div className="mt-5 flex justify-center">
					<Button
						variant="outline"
						onClick={() => setLimit((l) => l + ITEMS_PER_PAGE)}
					>
						Цааш үзэх ({items.length - limit})
						<ChevronDown className="size-4" />
					</Button>
				</div>
			)}
		</>
	);
}

function RowList({
	items,
	onSelect,
}: {
	items: SorillistsData[];
	onSelect: (s: SorillistsData) => void;
}) {
	const [limit, setLimit] = useState(ITEMS_PER_PAGE);
	return (
		<div className="card-pop divide-y-2 divide-border overflow-hidden opacity-90">
			{items.slice(0, limit).map((soril) => (
				<div key={soril.exam_id}>
					<SorilCard
						exam={soril}
						variant="row"
						onClick={() => onSelect(soril)}
					/>
				</div>
			))}
			{items.length > limit && (
				<button
					type="button"
					onClick={() => setLimit((l) => l + ITEMS_PER_PAGE)}
					className="w-full py-3 text-sm font-bold text-primary hover:bg-accent/50"
				>
					Цааш үзэх ({items.length - limit})
				</button>
			)}
		</div>
	);
}

function Section({
	icon,
	tone,
	title,
	count,
	children,
}: {
	icon: ReactNode;
	tone: string;
	title: string;
	count: number;
	children: ReactNode;
}) {
	return (
		<section>
			<div className="mb-3 flex items-center gap-2">
				<span
					className={cn(
						"flex size-7 items-center justify-center rounded-lg",
						tone,
					)}
				>
					{icon}
				</span>
				<h2 className="text-lg font-black tracking-tight text-foreground">
					{title}
				</h2>
				<span
					className={cn("rounded-full px-2 py-0.5 text-xs font-black", tone)}
				>
					{count}
				</span>
			</div>
			{children}
		</section>
	);
}

function SearchBox({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
}) {
	return (
		<div className="relative min-w-0 flex-1 lg:w-56 lg:flex-none">
			<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				aria-label={placeholder}
				className="h-9 rounded-full pr-9 pl-9"
			/>
			{value && (
				<button
					type="button"
					onClick={() => onChange("")}
					aria-label="Цэвэрлэх"
					className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
				>
					<X className="size-3.5" />
				</button>
			)}
		</div>
	);
}

// Skeleton Card Component
const SkeletonCard = () => (
	<div className="card-pop flex h-full w-full flex-col gap-3 p-5">
		<Skeleton className="aspect-5/2 w-full rounded-2xl" />
		<Skeleton className="h-5 w-full rounded-lg" />
		<Skeleton className="h-5 w-2/3 rounded-lg" />
		<div className="flex gap-2">
			<Skeleton className="h-6 w-16 rounded-full" />
			<Skeleton className="h-6 w-20 rounded-full" />
		</div>
	</div>
);

// Category Badge Component
interface CategoryBadgeProps {
	active: boolean;
	onClick: () => void;
	count: number;
	label: string;
	variant: SorilCategory;
	icon?: React.ReactNode;
}

const _CategoryBadge: React.FC<CategoryBadgeProps> = React.memo(
	function CategoryBadge({ active, onClick, count, label, variant, icon }) {
		const getStyle = () => {
			if (!active)
				return "border-2 border-border bg-card text-muted-foreground hover:bg-accent";

			switch (variant) {
				case "all":
					return "";
				case "notstarted":
					return "";
				case "completed":
					return "";
				default:
					return "";
			}
		};

		return (
			<Button
				type="button"
				onClick={onClick}
				className={cn(
					"inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition-all duration-200",
					getStyle(),
					
				)}
				aria-label={`${label} категори сонгох`}
				aria-pressed={active}
			>
				{icon && <span className="shrink-0">{icon}</span>}
				<span>{label}</span>
				<span
					className={cn(
						"ml-1 px-2 py-0.5 rounded-full text-xs font-bold",
						active
							? "bg-primary-foreground/20 text-primary-foreground"
							: "bg-muted text-muted-foreground",
					)}
				>
					{count}
				</span>
			</Button>
		);
	},
);
