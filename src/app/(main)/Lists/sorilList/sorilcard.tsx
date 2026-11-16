"use client";

import { m } from "framer-motion";
import {
	ArrowRight,
	CheckCircle2,
	ChevronRight,
	ClipboardCheck,
	Clock,
	Lock,
	Sparkles,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import {
	formatSorilDate,
	getSorilStatus,
	SorilStatusBadge,
} from "@/components/SorilDetailDialog";
import { cn } from "@/lib/utils";
import type { SorillistsData } from "@/types/soril/sorilLists";

interface SorilCardProps {
	exam: SorillistsData;
	/** Карт дээр дарахад — эцэг компонент дэлгэрэнгүй dialog-ийг нээнэ */
	onClick?: () => void;
	/** card = grid card, row = dense list row */
	variant?: "card" | "row";
}

export const SorilCard: React.FC<SorilCardProps> = ({
	exam,
	onClick,
	variant = "card",
}) => {
	const { isLocked, isInProgress } = getSorilStatus(exam);
	const minutesLabel = exam.minut > 0 ? `${exam.minut} мин` : "∞";

	return (
		<m.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className="h-full"
		>
			{variant === "card" ? (
				<button
					type="button"
					onClick={onClick}
					aria-label={`${exam.soril_name} сорил ${isLocked ? "(Төлбөр шаардлагатай)" : "нээх"}`}
					className={cn(
						"card-pop lift group relative flex h-full w-full cursor-pointer flex-col gap-3 overflow-hidden p-3 text-left",
						isLocked && "border-pop-sun",
						isInProgress && "border-pop-sky",
					)}
				>
					<div className="relative aspect-5/2 w-full shrink-0 overflow-hidden rounded-2xl bg-pop-sun-soft">
						{exam.filename ? (
							<Image
								src={exam.filename}
								alt={exam.soril_name}
								fill
								className={cn(
									"object-cover transition-all duration-500 group-hover:scale-105",
									isLocked && "brightness-75 group-hover:brightness-90",
								)}
								sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
								quality={90}
							/>
						) : (
							<div className="absolute inset-0 flex items-center justify-center bg-pop-sun-soft">
								<Sparkles
									className="size-10 text-pop-sun-ink transition-transform duration-300 group-hover:rotate-12"
									strokeWidth={2.5}
								/>
							</div>
						)}

						{/* Lock Overlay for Unpaid Exams */}
						{isLocked && (
							<div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/30">
								<div className="flex size-11 items-center justify-center rounded-2xl bg-pop-sun text-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-sun)_60%,black)]">
									<Lock className="size-5" strokeWidth={2.5} />
								</div>
							</div>
						)}

						<div className="absolute top-2 left-2 z-20">
							<SorilStatusBadge soril={exam} />
						</div>
					</div>

					<div className="flex flex-1 flex-col gap-2 px-1 pb-1">
						{exam.plan_name && (
							<p className="truncate text-[11px] font-bold uppercase tracking-wide text-pop-sun-ink">
								{exam.plan_name}
							</p>
						)}

						<h3
							className={cn(
								"line-clamp-2 flex-1 text-base font-extrabold leading-snug text-foreground transition-colors duration-200",
								isLocked
									? "group-hover:text-pop-sun-ink"
									: "group-hover:text-primary",
							)}
						>
							{exam.soril_name}
						</h3>

						<div className="flex flex-wrap items-center gap-1.5 text-xs">
							<span className="inline-flex items-center gap-1 rounded-full bg-pop-sky-soft px-2.5 py-1 font-bold text-pop-sky-ink">
								<Clock className="size-3.5 shrink-0" />
								{minutesLabel}
							</span>
							<span className="inline-flex items-center gap-1 rounded-full bg-pop-violet-soft px-2.5 py-1 font-bold text-pop-violet-ink">
								<ClipboardCheck className="size-3.5 shrink-0" />
								{exam.que_cnt} асуулт
							</span>
							<span
								className={cn(
									"ml-auto flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-200",
									isLocked
										? "bg-pop-sun-soft text-pop-sun-ink group-hover:bg-pop-sun group-hover:text-foreground"
										: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
								)}
							>
								{isLocked ? (
									<Lock className="size-3.5" />
								) : (
									<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
								)}
							</span>
						</div>
					</div>
				</button>
			) : (
				<button
					type="button"
					onClick={onClick}
					aria-label={`${exam.soril_name} сорил нээх`}
					className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
				>
					<span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-muted">
						{exam.filename ? (
							<Image
								src={exam.filename}
								alt=""
								fill
								className="object-cover opacity-80 grayscale-[40%]"
								sizes="40px"
							/>
						) : (
							<CheckCircle2 className="absolute inset-0 m-auto size-5 text-muted-foreground" />
						)}
					</span>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-bold text-foreground/80">
							{exam.soril_name}
						</p>
						<p className="truncate text-xs font-semibold text-muted-foreground">
							{exam.plan_name ? `${exam.plan_name} · ` : ""}
							{formatSorilDate(exam.sorildate)}
						</p>
					</div>
					<span className="hidden shrink-0 text-xs font-bold text-muted-foreground sm:inline">
						{exam.que_cnt} асуулт · {minutesLabel}
					</span>
					<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
				</button>
			)}
		</m.div>
	);
};
