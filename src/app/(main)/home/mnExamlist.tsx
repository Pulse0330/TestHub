"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Clock, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getMNExamAttendace, getMNExamVariants } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { mnExamVariantData, mnExamVariantResponse } from "@/types/mnExam/mnExamList";

const ANIMATION_STAGGER = 0.04;

// ── Variant Card ─────────────────────────────────────────────────
interface VariantCardProps {
	item: mnExamVariantData;
	index: number;
}

const VariantCard = memo(({ item, index }: VariantCardProps) => {
	const router = useRouter();
	const { userId } = useAuthStore();
	const examName = item.name?.[0] ?? "";

	const formattedDate = item.sdate
		? item.sdate.replace(
			/(\d{4})-(\d{2})-(\d{2}) (\d+):(\d*)$/,
			(_, y, m, d, h, min) =>
				`${y}.${m}.${d} ${h.padStart(2, "0")}:${(min || "0").padStart(2, "0")}`,
		)
		: "";

	const handleClick = useCallback(async () => {
		const examType = item.exam_type ?? 4;
		const now = new Date().toISOString();
		try {
			await getMNExamAttendace(
				item.exam_registration_id, "Started", now, "", Number(userId),
			);
		} catch (err) {
			console.error("Attendance error:", err);
			return;
		}
		const params = new URLSearchParams({
			variant: String(item.variant_number ?? 0),
			exam_type: String(examType),
			exam_date_id: String(item.exam_date_id ?? 0),
			exam_reg_id: String(item.exam_registration_id ?? 0),
			exam_id: String(item.exam_id ?? 0),
			variant_id: String(item.variantId ?? 0),
			userid: String(userId ?? 0),
		});
		router.push(`/exam/${item.exam_id}?${params.toString()}`);
	}, [router, item, userId]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: index * ANIMATION_STAGGER }}
			className="h-full"
		>
			<button
				type="button"
				onClick={handleClick}
				className="group card-pop lift flex h-full w-full flex-col overflow-hidden p-2 text-left"
			>
				{/* Top banner */}
				<div className="flex items-center justify-between gap-2 rounded-2xl bg-pop-violet-soft p-2.5">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pop-violet text-primary-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-violet)_60%,black)]">
						<CalendarDays className="size-4" strokeWidth={2.5} />
					</span>
					<span className="min-w-0 truncate text-[10px] font-extrabold uppercase tracking-wide text-pop-violet-ink">
						{examName}
					</span>
				</div>

				<div className="flex flex-1 flex-col gap-1.5 px-1.5 pb-1 pt-2.5">
					{/* Date */}
					<h3 className="text-sm font-black tabular-nums transition-colors group-hover:text-primary">
						{formattedDate}
					</h3>

					<p className="text-[11px] font-semibold text-muted-foreground">{item.exam_number}</p>

					{/* Stats */}
					<div className="mt-auto flex items-center justify-between pt-2">
						<span className="inline-flex items-center gap-1 rounded-full bg-pop-sky-soft px-2 py-0.5 text-[10px] font-bold text-pop-sky-ink">
							<Clock className="size-3" strokeWidth={2.5} />
							{item.duration} мин
						</span>
						<span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:translate-x-0.5">
							<ArrowRight className="size-3.5" strokeWidth={2.75} />
						</span>
					</div>
				</div>
			</button>
		</motion.div>
	);
});

VariantCard.displayName = "VariantCard";

// ── Skeleton ─────────────────────────────────────────────────────
function SkeletonCard() {
	return (
		<div className="card-pop overflow-hidden p-2">
			<Skeleton className="h-14 w-full rounded-2xl" />
			<div className="space-y-2.5 p-1.5 pt-3">
				<Skeleton className="h-4 w-2/3 rounded-full" />
				<Skeleton className="h-3 w-1/2 rounded-full" />
				<Skeleton className="mt-4 h-5 w-16 rounded-full" />
			</div>
		</div>
	);
}

// ── Main ──────────────────────────────────────────────────────────
export default function MnExamList() {
	const { userId, user } = useAuthStore();
	const examineeNumber = String(user?.examinee_number ?? "");

	const { data, isLoading, isError } = useQuery<mnExamVariantResponse>({
		queryKey: ["getMNExamVariants", userId, examineeNumber],
		queryFn: () => getMNExamVariants(Number(userId), examineeNumber),
		enabled: !!userId && !!examineeNumber,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	const _uniqueData = data?.RetData?.filter(
		(item, index, self) =>
			index === self.findIndex(
				(e) => e.exam_id === item.exam_id && e.exam_date_id === item.exam_date_id,
			),
	) ?? [];

	if (isError) {
		return (
			<div className="flex flex-col items-center gap-3 py-12 text-center">
				<div className="flex size-16 items-center justify-center rounded-full bg-pop-coral-soft text-pop-coral-ink">
					<HelpCircle className="size-8" strokeWidth={2.5} />
				</div>
				<p className="text-sm font-bold text-muted-foreground">Мэдээлэл татахад алдаа гарлаа</p>
			</div>
		);
	}

	if (!isLoading && !data?.RetData?.length) {
		return (
			<div className="flex flex-col items-center gap-3 py-12 text-center">
				<div className="flex size-16 items-center justify-center rounded-full bg-pop-violet-soft text-3xl">📭</div>
				<p className="max-w-sm text-sm font-bold text-muted-foreground">Одоогоор нээлттэй МХБ-ийн шалгалтын материал алга байна</p>
			</div>
		);
	}

	return (
		<div className="@container">
		<div className="grid grid-cols-2 gap-3 @lg:grid-cols-3 @lg:gap-4 @3xl:grid-cols-4 @5xl:grid-cols-5">
			{isLoading
				? ["sk-0","sk-1","sk-2","sk-3"].map((id) => <SkeletonCard key={id} />)
				: (data?.RetData ?? []).map((item, idx) => (
					<VariantCard
						key={`${item.exam_id}-${item.exam_date_id}-${idx}`}
						item={item}
						index={idx}
					/>
				))}
		</div>
		</div>
	);
}