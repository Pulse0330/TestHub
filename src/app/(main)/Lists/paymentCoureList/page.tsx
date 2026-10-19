"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
	BookOpen,
	Calendar,
	Check,
	Loader2,
	ShoppingCart,
	Tag,
	TrendingDown,
	X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPaymentCourseList } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { getplaninfoCourseData } from "@/types/paymentCourse/getplaninfo";
import type { QPayInvoiceResponse } from "@/types/Qpay/qpayinvoice";
import QPayDialog from "./dialog";
import CourseCard from "./form";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_SELECTED = 4;

const SPRING_TRANSITION = {
	type: "spring",
	damping: 30,
	stiffness: 300,
} as const;

const SIDEBAR_VARIANTS = {
	hidden: { x: 384, opacity: 0 },
	visible: { x: 0, opacity: 1 },
} as const;

const MOBILE_SIDEBAR_VARIANTS = {
	hidden: { x: "100%", opacity: 0 },
	visible: { x: 0, opacity: 1 },
} as const;

const FAB_VARIANTS = {
	hidden: { y: 100 },
	visible: { y: 0 },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = {
	planid: number;
	month: number;
	amount: number;
	descr: string;
};

// ─── State ────────────────────────────────────────────────────────────────────

type UIState = {
	showCart: boolean;
	showQpayModal: boolean;
	isProcessingPayment: boolean;
};

type UIAction =
	| { type: "OPEN_CART" }
	| { type: "CLOSE_CART" }
	| { type: "OPEN_QPAY" }
	| { type: "CLOSE_QPAY" }
	| { type: "SET_PROCESSING"; payload: boolean };

function uiReducer(state: UIState, action: UIAction): UIState {
	switch (action.type) {
		case "OPEN_CART":
			return { ...state, showCart: true };
		case "CLOSE_CART":
			return { ...state, showCart: false };
		case "OPEN_QPAY":
			return { ...state, showQpayModal: true, showCart: false };
		case "CLOSE_QPAY":
			return { ...state, showQpayModal: false };
		case "SET_PROCESSING":
			return { ...state, isProcessingPayment: action.payload };
		default:
			return state;
	}
}

const INITIAL_UI_STATE: UIState = {
	showCart: false,
	showQpayModal: false,
	isProcessingPayment: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCourseMap<T extends { palnid: number }>(
	courses: T[],
): Map<number, T> {
	return new Map(courses.map((c) => [c.palnid, c]));
}

function computeDiscountedPlanIds(plans: Plan[]): Set<string> {
	const discounted = new Set<string>();
	const basePlan = plans.find((p) => p.planid === 0 && p.month === 1);

	for (const plan of plans) {
		const key = `${plan.planid}-${plan.month}`;
		if (plan.planid === 1) {
			discounted.add(key);
			continue;
		}
		if (plan.planid === 0 && plan.month > 1 && basePlan) {
			if (plan.amount < basePlan.amount * plan.month) {
				discounted.add(key);
			}
		}
	}

	return discounted;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

// ─── Plan Button ──────────────────────────────────────────────────────────────

type PlanButtonProps = {
	plan: Plan;
	isSelected: boolean;
	isDiscounted: boolean;
	onToggle: (key: string) => void;
};

function PlanButton({
	plan,
	isSelected,
	isDiscounted,
	onToggle,
}: PlanButtonProps) {
	const key = `${plan.planid}-${plan.month}`;

	return (
		<button
			type="button"
			onClick={() => onToggle(key)}
			className={cn(
				"relative w-full p-4 rounded-2xl border-2 transition-all duration-150 text-left overflow-hidden",
				isSelected
					? "border-primary bg-primary/10 shadow-[0_4px_0_0_var(--primary)]"
					: "border-border bg-card shadow-[0_4px_0_0_var(--border)] hover:-translate-y-0.5 hover:border-primary/40 active:translate-y-0.5 active:shadow-[0_1px_0_0_var(--border)]",
			)}
		>
			{isDiscounted && (
				<Badge
					variant={isSelected ? "default" : "mint"}
					className="absolute top-3 right-3 text-xs font-extrabold"
				>
					<TrendingDown className="size-3 mr-1" strokeWidth={2.75} />
					Хөнгөлөлттэй
				</Badge>
			)}

			<div className="mb-3 pr-24">
				<p className="text-xs font-bold text-muted-foreground mb-1">
					{plan.descr}
				</p>
				<p
					className={cn(
						"text-2xl font-black",
						isSelected ? "text-primary" : "text-foreground",
					)}
				>
					₮{plan.amount.toLocaleString()}
				</p>
			</div>

			<div className="inline-flex items-center gap-1.5 rounded-full bg-pop-sky-soft px-2.5 py-1 text-pop-sky-ink">
				<Calendar className="size-3.5" strokeWidth={2.5} />
				<span className="text-xs font-bold">{plan.month} сарын хугацаа</span>
			</div>

			{isSelected && (
				<div className="absolute bottom-3 right-3 size-7 rounded-xl bg-primary flex items-center justify-center animate-pop-in">
					<Check
						className="size-4 text-primary-foreground"
						strokeWidth={3}
					/>
				</div>
			)}
		</button>
	);
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────

type SidebarContentProps = {
	selectedIds: number[];
	courseMap: Map<number, { palnid: number; title: string; filename: string }>;
	availablePlans: Plan[];
	discountedPlanIds: Set<string>;
	selectedPlan: string | null;
	isProcessingPayment: boolean;
	onRemoveCourse: (id: number) => void;
	onClearAll: () => void;
	onTogglePlan: (key: string) => void;
	onCheckout: () => void;
};

function SidebarContent({
	selectedIds,
	courseMap,
	availablePlans,
	discountedPlanIds,
	selectedPlan,
	isProcessingPayment,
	onRemoveCourse,
	onClearAll,
	onTogglePlan,
	onCheckout,
}: SidebarContentProps) {
	return (
		<div className="p-5 sm:p-6 space-y-6">
			<div className="flex items-center justify-between gap-3 pb-4 border-b-2 border-border">
				<div className="flex items-center gap-3">
					<div
						className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pop-coral-soft text-pop-coral-ink"
						aria-hidden="true"
					>
						<ShoppingCart className="size-5" strokeWidth={2.5} />
					</div>
					<div>
						<h3 className="text-lg font-black text-foreground">
							Төлбөр төлөх
						</h3>
						<p className="text-sm font-semibold text-muted-foreground">
							{selectedIds.length} хичээл сонгосон
						</p>
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClearAll}
					className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
				>
					<X className="size-5" strokeWidth={2.5} />
				</Button>
			</div>

			<div className="space-y-2 max-h-64 overflow-y-auto pr-1">
				{selectedIds.map((id) => {
					const course = courseMap.get(id);
					if (!course) return null;
					return (
						<div
							key={id}
							className="flex items-center gap-3 p-2.5 rounded-2xl bg-muted border-2 border-border animate-pop-in"
						>
							<Image
								src={course.filename}
								alt={course.title}
								width={56}
								height={56}
								className="size-14 rounded-xl object-cover"
							/>
							<p className="flex-1 min-w-0 text-sm font-bold text-foreground truncate">
								{course.title}
							</p>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onRemoveCourse(id)}
								className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
							>
								<X className="size-4" strokeWidth={2.5} />
							</Button>
						</div>
					);
				})}
			</div>

			{availablePlans.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<div className="flex size-7 items-center justify-center rounded-lg bg-pop-violet-soft text-pop-violet-ink">
							<Tag className="size-4" strokeWidth={2.5} />
						</div>
						<p className="text-sm font-extrabold text-foreground">
							Төлбөрийн сонголт
						</p>
					</div>

					<div className="space-y-3">
						{availablePlans.map((plan) => {
							const key = `${plan.planid}-${plan.month}`;
							return (
								<PlanButton
									key={key}
									plan={plan}
									isSelected={selectedPlan === key}
									isDiscounted={discountedPlanIds.has(key)}
									onToggle={onTogglePlan}
								/>
							);
						})}
					</div>

					{selectedPlan && (
						<Button
							onClick={onCheckout}
							disabled={isProcessingPayment}
							variant="success"
							size="lg"
							className="w-full text-base font-extrabold animate-pop-in"
						>
							{isProcessingPayment ? (
								<>
									<Loader2 className="size-5 mr-1 animate-spin" />
									Уншиж байна...
								</>
							) : (
								<>
									<Check className="size-5 mr-1" strokeWidth={3} />
									QPay төлбөр төлөх
								</>
							)}
						</Button>
					)}
				</div>
			)}

			<p className="pt-4 border-t-2 border-border text-xs font-semibold text-muted-foreground text-center">
				{selectedIds.length === 1
					? "Хичээлийн хугацаа ба төлбөрөө сонгоно уу"
					: "Та өөрийн хүссэн хичээлүүдээ сонгон, суралцаж хугацаа болон төлбөрийн хамгийн ашигтай хувилбарыг сонгоорой"}
			</p>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentCoursesPage() {
	const { userId } = useAuthStore();

	const [ui, dispatchUi] = useReducer(uiReducer, INITIAL_UI_STATE);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
	const [qpayData, setQpayData] = useState<QPayInvoiceResponse | null>(null);

	const selectedIdsRef = useRef(selectedIds);
	selectedIdsRef.current = selectedIds;

	// ── Data fetching ──────────────────────────────────────────────────────────

	const {
		data: coursesData,
		isSuccess,
		isError,
		error,
	} = useQuery<getplaninfoCourseData, Error>({
		queryKey: ["paymentCourses", userId],
		queryFn: () => {
			if (!userId) throw new Error("User ID тодорхойгүй байна");
			return getPaymentCourseList(userId);
		},
		enabled: !!userId,
	});

	const courses = coursesData?.RetDataFirst ?? [];
	const plans = coursesData?.RetDataSecond ?? [];

	// ── Derived data ───────────────────────────────────────────────────────────

	const courseMap = useMemo(() => buildCourseMap(courses), [courses]);

	const { purchasedCourses, availableCourses } = useMemo(() => {
		const purchased = [];
		const available = [];
		for (const course of courses) {
			if (course.ispurchased === 1) purchased.push(course);
			else available.push(course);
		}
		return { purchasedCourses: purchased, availableCourses: available };
	}, [courses]);

	const availablePlans = useMemo(() => {
		if (selectedIds.size === 0) return [];
		return plans.filter((p) => p.planid === (selectedIds.size === 1 ? 0 : 1));
	}, [selectedIds.size, plans]);

	const discountedPlanIds = useMemo(
		() => computeDiscountedPlanIds(plans),
		[plans],
	);

	const selectedIdsArray = useMemo(() => [...selectedIds], [selectedIds]);

	// ── Handlers ──────────────────────────────────────────────────────────────

	const handleSelectCourse = useCallback((planid: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(planid)) {
				next.delete(planid);
			} else if (next.size < MAX_SELECTED) {
				next.add(planid);
			}
			return next;
		});
		setSelectedPlan(null);
	}, []);

	const handleRemoveCourse = useCallback((id: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
		setSelectedPlan(null);
	}, []);

	const handleClearAll = useCallback(() => {
		setSelectedIds(new Set());
		setSelectedPlan(null);
	}, []);

	const handleTogglePlan = useCallback((key: string) => {
		setSelectedPlan((prev) => (prev === key ? null : key));
	}, []);

	const handleCheckout = useCallback(async () => {
		if (!selectedPlan || !userId) return;

		try {
			dispatchUi({ type: "SET_PROCESSING", payload: true });

			const [planIdStr, monthStr] = selectedPlan.split("-");
			const planId = Number(planIdStr);
			const month = Number(monthStr);
			const plan = plans.find((p) => p.planid === planId && p.month === month);

			if (!plan) throw new Error("Төлөвлөгөө олдсонгүй");

			const currentIds = [...selectedIdsRef.current];
			const firstCourse = courseMap.get(currentIds[0]);

			const payload = {
				amount: plan.amount.toString(),
				userid: userId.toString(),
				device_token: "",
				orderid: "8",
				bilid: firstCourse?.bill_type?.toString() ?? "1",
				classroom_id: "0",
				urls: currentIds.map((id) => ({ topic_id: id.toString() })),
			};

			const { data } = await axios.post<QPayInvoiceResponse | string>(
				"/api/qpay/invoice",
				payload,
			);
			const parsed: QPayInvoiceResponse =
				typeof data === "string" ? JSON.parse(data) : data;

			if (!parsed?.qr_image) throw new Error("QPay хариу буруу байна");

			setQpayData(parsed);
			dispatchUi({ type: "OPEN_QPAY" });
		} catch (err: unknown) {
			const e = err as {
				message?: string;
				response?: { data?: { message?: string } };
			};
			alert(
				e.response?.data?.message ??
					e.message ??
					"Төлбөр төлөхөд алдаа гарлаа. Дахин оролдоно уу.",
			);
		} finally {
			dispatchUi({ type: "SET_PROCESSING", payload: false });
		}
	}, [selectedPlan, userId, plans, courseMap]);

	const sidebarProps = {
		selectedIds: selectedIdsArray,
		courseMap,
		availablePlans,
		discountedPlanIds,
		selectedPlan,
		isProcessingPayment: ui.isProcessingPayment,
		onRemoveCourse: handleRemoveCourse,
		onClearAll: handleClearAll,
		onTogglePlan: handleTogglePlan,
		onCheckout: handleCheckout,
	} satisfies SidebarContentProps;

	const hasSelection = selectedIds.size > 0;

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<div
			className={cn(
				"mx-auto w-full flex flex-col gap-6 sm:gap-8 pb-24 lg:pb-4 transition-[padding] duration-300",
				hasSelection && "lg:pr-96",
			)}
		>
			{/* ── Purchased courses shelf ── */}
			{purchasedCourses.length > 0 && (
				<section aria-labelledby="my-courses-heading">
					<div className="mb-3 flex items-center gap-3">
						<div
							className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pop-mint-soft text-pop-mint-ink shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-mint)_35%,transparent)]"
							aria-hidden="true"
						>
							<BookOpen className="size-5" strokeWidth={2.5} />
						</div>
						<h3
							id="my-courses-heading"
							className="text-lg md:text-xl font-black tracking-tight text-foreground"
						>
							Миний хичээлүүд
						</h3>
						<span className="rounded-full bg-pop-mint-soft px-2.5 py-0.5 text-xs font-extrabold text-pop-mint-ink">
							{purchasedCourses.length} Хичээл
						</span>
					</div>

					<div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-3 pt-1">
						{purchasedCourses.map((course, index) => (
							<motion.div
								key={course.palnid}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.3,
									delay: Math.min(index * 0.05, 0.5),
								}}
								className="w-52 sm:w-60 shrink-0 snap-start"
							>
								<CourseCard course={course} variant="shelf" />
							</motion.div>
						))}
					</div>
				</section>
			)}

			{/* ── Catalog ── */}
			<section aria-labelledby="catalog-heading">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<div
							className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pop-coral-soft text-pop-coral-ink shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-coral)_35%,transparent)]"
							aria-hidden="true"
						>
							<ShoppingCart className="size-5" strokeWidth={2.5} />
						</div>
						<div className="min-w-0">
							<h2
								id="catalog-heading"
								className="text-lg md:text-xl font-black tracking-tight text-foreground"
							>
								{purchasedCourses.length > 0
									? "Бусад хичээлүүд"
									: "Бүх хичээлүүд"}
							</h2>
							<p className="text-xs sm:text-sm font-semibold text-muted-foreground">
								{availableCourses.length} хичээл байна
							</p>
						</div>
					</div>

					{/* Selection meter */}
					<div
						className={cn(
							"flex items-center gap-2 rounded-full border-2 px-3 py-1.5 transition-colors",
							hasSelection
								? "border-pop-coral bg-pop-coral-soft text-pop-coral-ink"
								: "border-border bg-card text-muted-foreground",
						)}
					>
						<div className="flex gap-1" aria-hidden="true">
							{Array.from({ length: MAX_SELECTED }, (_, i) => (
								<span
									// biome-ignore lint/suspicious/noArrayIndexKey: static slots
									key={i}
									className={cn(
										"size-2.5 rounded-full",
										i < selectedIds.size ? "bg-pop-coral" : "bg-muted",
									)}
								/>
							))}
						</div>
						<span className="text-xs font-extrabold tabular-nums">
							{selectedIds.size}/{MAX_SELECTED} сонгосон
						</span>
					</div>
				</div>

				{/* Error */}
				{isError && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="max-w-md mx-auto text-center py-12 sm:py-20"
					>
						<div className="size-20 sm:size-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
							<X
								className="size-10 sm:size-12 text-destructive"
								strokeWidth={2.75}
							/>
						</div>
						<h3 className="text-xl sm:text-2xl font-black text-foreground mb-2 sm:mb-3">
							Алдаа гарлаа
						</h3>
						<p className="text-sm sm:text-base font-semibold text-muted-foreground mb-4 sm:mb-6">
							{error.message}
						</p>
						<Button onClick={() => window.location.reload()}>
							Дахин оролдох
						</Button>
					</motion.div>
				)}

				{/* Course grid */}
				<div
					className={cn(
						"grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pb-4 auto-rows-fr",
						hasSelection
							? "lg:grid-cols-3 xl:grid-cols-4"
							: "lg:grid-cols-4 xl:grid-cols-5",
					)}
				>
					<AnimatePresence initial={false}>
						{availableCourses.map((course, index) => (
							<motion.div
								key={course.palnid}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
								transition={{
									duration: 0.2,
									delay: Math.min(index * 0.02, 0.3),
								}}
							>
								<CourseCard
									course={course}
									isSelected={selectedIds.has(course.palnid)}
									onSelect={handleSelectCourse}
									disabled={
										!selectedIds.has(course.palnid) &&
										selectedIds.size >= MAX_SELECTED
									}
								/>
							</motion.div>
						))}
					</AnimatePresence>
				</div>

				{/* Empty state */}
				{isSuccess && availableCourses.length === 0 && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="card-pop max-w-md mx-auto text-center py-12 px-6"
					>
						<div className="size-20 sm:size-24 rounded-full bg-pop-coral-soft flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-float">
							<BookOpen
								className="size-10 sm:size-12 text-pop-coral-ink"
								strokeWidth={2.25}
							/>
						</div>
						<h3 className="text-xl sm:text-2xl font-black text-foreground mb-2 sm:mb-3">
							Хичээл олдсонгүй
						</h3>
						<p className="text-sm sm:text-base font-semibold text-muted-foreground">
							Бүх хичээлийг аль хэдийн худалдаж авсан байна
						</p>
					</motion.div>
				)}
			</section>

			{/* ── Desktop sidebar ── */}
			<AnimatePresence>
				{hasSelection && (
					<motion.aside
						variants={SIDEBAR_VARIANTS}
						initial="hidden"
						animate="visible"
						exit="hidden"
						transition={SPRING_TRANSITION}
						aria-label="Төлбөрийн мэдээлэл"
						className="hidden lg:block fixed right-0 top-0 bottom-0 z-50 w-96 bg-card border-l-2 border-border shadow-[-6px_0_0_0_color-mix(in_oklch,var(--border)_60%,transparent)] overflow-y-auto"
					>
						<SidebarContent {...sidebarProps} />
					</motion.aside>
				)}
			</AnimatePresence>

			{/* ── Mobile cart sidebar ── */}
			<AnimatePresence>
				{ui.showCart && hasSelection && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => dispatchUi({ type: "CLOSE_CART" })}
							className="lg:hidden fixed inset-0 bg-foreground/40 z-40"
							aria-hidden
						/>
						<motion.aside
							variants={MOBILE_SIDEBAR_VARIANTS}
							initial="hidden"
							animate="visible"
							exit="hidden"
							transition={SPRING_TRANSITION}
							aria-label="Миний сагс"
							className="lg:hidden fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-card z-50 overflow-y-auto border-l-2 border-border"
						>
							<div className="flex items-center justify-between p-6 pb-0">
								<div>
									<h3 className="text-xl font-black text-foreground">
										Миний сагс
									</h3>
									<p className="text-sm font-semibold text-muted-foreground">
										{selectedIds.size} хичээл
									</p>
								</div>
								<Button
									variant="outline"
									size="icon"
									className="rounded-xl"
									onClick={() => dispatchUi({ type: "CLOSE_CART" })}
								>
									<X className="size-5" strokeWidth={2.5} />
								</Button>
							</div>
							<SidebarContent {...sidebarProps} />
						</motion.aside>
					</>
				)}
			</AnimatePresence>

			{/* ── Mobile FAB ── */}
			<AnimatePresence>
				{hasSelection && !ui.showCart && (
					<motion.button
						variants={FAB_VARIANTS}
						initial="hidden"
						animate="visible"
						exit="hidden"
						type="button"
						aria-label={`Сагс нээх — ${selectedIds.size} хичээл`}
						onClick={() => dispatchUi({ type: "OPEN_CART" })}
						className="lg:hidden fixed bottom-24 right-5 size-16 bg-pop-coral text-primary-foreground rounded-2xl shadow-[0_5px_0_0_color-mix(in_oklch,var(--pop-coral)_60%,black)] active:translate-y-1 active:shadow-[0_1px_0_0_color-mix(in_oklch,var(--pop-coral)_60%,black)] flex items-center justify-center z-30"
					>
						<ShoppingCart className="size-7" strokeWidth={2.5} />
						<span
							aria-hidden
							className="absolute -top-2 -right-2 size-7 bg-primary border-2 border-card rounded-full flex items-center justify-center text-primary-foreground text-xs font-black"
						>
							{selectedIds.size}
						</span>
					</motion.button>
				)}
			</AnimatePresence>

			{/* ── QPay dialog ── */}
			<QPayDialog
				open={ui.showQpayModal}
				onOpenChange={(open) =>
					dispatchUi({ type: open ? "OPEN_QPAY" : "CLOSE_QPAY" })
				}
				qpayData={qpayData}
				userId={userId ?? ""}
				onPaymentSuccess={() => window.location.reload()}
			/>
		</div>
	);
}
