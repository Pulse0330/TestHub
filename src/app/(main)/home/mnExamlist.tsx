"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Clock, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
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
				className="group h-full w-full flex flex-col rounded-xl overflow-hidden border border-border/50 bg-card hover:border-border hover:shadow-md transition-all duration-200 text-left"
			>
				{/* Top strip */}
				<div className="w-full h-1 bg-violet-500/70 shrink-0" />

				<div className="flex flex-col flex-1 p-3 gap-2">
					{/* Exam name */}
					<p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground truncate">
						{examName}
					</p>

					{/* Date */}
					<h3 className="text-xs font-bold group-hover:text-primary transition-colors">
						{formattedDate}
					</h3>

					<p className="text-[10px] text-muted-foreground">{item.exam_number}</p>

					{/* Stats */}
					<div className="mt-auto flex items-center justify-between pt-2 border-t border-border/40">
						<div className="flex items-center gap-1 text-muted-foreground">
							<Clock className="w-3 h-3" />
							<span className="text-[10px]">{item.duration} мин</span>
						</div>
						<ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
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
		<div className="rounded-xl border border-border/40 bg-card overflow-hidden animate-pulse">
			<div className="w-full h-1 bg-muted" />
			<div className="p-3 space-y-2.5">
				<div className="h-2 bg-muted rounded w-2/3" />
				<div className="h-4 bg-muted rounded w-1/2" />
				<div className="h-2 bg-muted rounded w-full mt-4" />
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
			<div className="flex flex-col items-center py-12 gap-2 text-muted-foreground opacity-40">
				<HelpCircle className="w-10 h-10" />
				<p className="text-sm">Мэдээлэл татахад алдаа гарлаа</p>
			</div>
		);
	}

	if (!isLoading && !data?.RetData?.length) {
		return (
			<div className="flex flex-col items-center py-12 gap-2 text-muted-foreground opacity-40">
				<p className="text-sm">Одоогоор нээлттэй МХБ-ийн шалгалтын материал алга байна</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
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
	);
}