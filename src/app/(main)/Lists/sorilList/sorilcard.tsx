"use client";

import { motion } from "framer-motion";
import {
	ArrowRight,
	Calendar,
	CheckCircle2,
	ChevronRight,
	ClipboardCheck,
	Clock,
	CreditCard,
	Layers,
	Lock,
	Play,
	RotateCw,
	Sparkles,
	Unlock,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { SorillistsData } from "@/types/soril/sorilLists";

interface SorilCardProps {
	exam: SorillistsData;
	onClick?: () => void;
	/** card = grid card, row = dense list row */
	variant?: "card" | "row";
}

export const SorilCard: React.FC<SorilCardProps> = ({
	exam,
	onClick,
	variant = "card",
}) => {
	const [sheetOpen, setSheetOpen] = useState(false);
	const isMobile = useIsMobile();

	const formatDate = (dateStr: string | Date) => {
		try {
			const date = new Date(dateStr);
			if (Number.isNaN(date.getTime())) return "Огноо тодорхойгүй";

			const mongoliaDate = new Date(
				date.toLocaleString("en-US", {
					timeZone: "Asia/Ulaanbaatar",
				}),
			);

			const year = mongoliaDate.getFullYear();
			const month = mongoliaDate.getMonth() + 1;
			const day = mongoliaDate.getDate();

			return `${year}/${month}/${day}`;
		} catch {
			return "Огноо тодорхойгүй";
		}
	};

	const isCompleted = exam.isguitset === 1;
	const isLocked =
		!isCompleted &&
		exam.ispay === 1 &&
		exam.paid === 0 &&
		exam.isopensoril === 0;
	const _isPaidAndUnlocked = exam.ispay === 1 && exam.paid === 1;
	const isInProgress = !isCompleted && exam.test_resid > 0;

	const statusBadge = isLocked ? (
		<Badge variant="sun" className="border-2 border-pop-sun/40 bg-card">
			<Lock />
			Төлбөртэй
		</Badge>
	) : isCompleted ? (
		<Badge variant="mint" className="border-2 border-pop-mint/40 bg-card">
			<CheckCircle2 />
			Гүйцэтгэсэн
		</Badge>
	) : isInProgress ? (
		<Badge variant="sky" className="border-2 border-pop-sky/40 bg-card">
			<RotateCw />
			Үргэлжлүүлэх
		</Badge>
	) : null;

	const minutesLabel = exam.minut > 0 ? `${exam.minut} мин` : "∞";

	const handlePrimary = () => {
		setSheetOpen(false);
		onClick?.();
	};

	const primaryLabel = isLocked
		? "Төлбөр төлөх"
		: exam.flag_name || (isInProgress ? "Үргэлжлүүлэх" : "Эхлүүлэх");

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className="h-full"
		>
			{variant === "card" ? (
				<button
					type="button"
					onClick={() => setSheetOpen(true)}
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

						{statusBadge && (
							<div className="absolute top-2 left-2 z-20">{statusBadge}</div>
						)}
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
					onClick={() => setSheetOpen(true)}
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
							{formatDate(exam.sorildate)}
						</p>
					</div>
					<span className="hidden shrink-0 text-xs font-bold text-muted-foreground sm:inline">
						{exam.que_cnt} асуулт · {minutesLabel}
					</span>
					<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
				</button>
			)}

			{/* Detail sheet */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent
					side={isMobile ? "bottom" : "right"}
					className={cn(
						"gap-0 border-border p-0",
						isMobile
							? "max-h-[90dvh] rounded-t-3xl border-t-2"
							: "w-full border-l-2 sm:max-w-md",
					)}
				>
					{isMobile && (
						<div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />
					)}
					<div className="flex-1 overflow-y-auto">
						<SheetHeader className="gap-3 p-5 pb-3">
							<div className="relative aspect-5/2 w-full overflow-hidden rounded-2xl bg-pop-sun-soft">
								{exam.filename ? (
									<Image
										src={exam.filename}
										alt={exam.soril_name}
										fill
										className="object-cover"
										sizes="(max-width: 768px) 100vw, 28rem"
									/>
								) : (
									<Sparkles
										className="absolute inset-0 m-auto size-10 text-pop-sun-ink"
										strokeWidth={2.5}
									/>
								)}
								{statusBadge && (
									<div className="absolute top-2 left-2">{statusBadge}</div>
								)}
							</div>
							{exam.plan_name && (
								<p className="text-xs font-bold uppercase tracking-wide text-pop-sun-ink">
									{exam.plan_name}
								</p>
							)}
							<SheetTitle className="text-xl font-black leading-snug">
								{exam.soril_name}
							</SheetTitle>
							<SheetDescription className="sr-only">
								Сорилын огноо: {formatDate(exam.sorildate)}
							</SheetDescription>
						</SheetHeader>

						<div className="space-y-4 px-5 pb-5">
							<div className="grid grid-cols-2 gap-2">
								<div className="rounded-2xl bg-pop-sky-soft p-3">
									<p className="text-2xl font-black text-pop-sky-ink">
										{exam.minut > 0 ? exam.minut : "∞"}
									</p>
									<p className="text-[11px] font-bold uppercase tracking-wide text-pop-sky-ink/80">
										{exam.minut > 0 ? "минут" : "Хугацаа хязгааргүй"}
									</p>
								</div>
								<div className="rounded-2xl bg-pop-violet-soft p-3">
									<p className="text-2xl font-black text-pop-violet-ink">
										{exam.que_cnt}
									</p>
									<p className="text-[11px] font-bold uppercase tracking-wide text-pop-violet-ink/80">
										асуулт
									</p>
								</div>
							</div>

							<div className="divide-y-2 divide-border overflow-hidden rounded-2xl border-2 border-border bg-card">
								<SheetRow
									icon={<Calendar className="size-4" />}
									tone="bg-pop-sun-soft text-pop-sun-ink"
									label="Сорилын огноо"
									value={formatDate(exam.sorildate)}
								/>
								{exam.plan_name && (
									<SheetRow
										icon={<Layers className="size-4" />}
										tone="bg-pop-pink-soft text-pop-pink-ink"
										label="Төлөвлөгөө"
										value={exam.plan_name}
									/>
								)}
								<SheetRow
									icon={
										isLocked ? (
											<Lock className="size-4" />
										) : (
											<Unlock className="size-4" />
										)
									}
									tone={
										isLocked
											? "bg-pop-sun-soft text-pop-sun-ink"
											: "bg-pop-mint-soft text-pop-mint-ink"
									}
									label="Төлбөр"
									value={
										exam.isopensoril === 1
											? "Нээлттэй"
											: exam.ispay === 1
												? exam.paid === 1
													? "Төлөгдсөн"
													: "Төлбөртэй"
												: "Үнэгүй"
									}
								/>
								<SheetRow
									icon={<ClipboardCheck className="size-4" />}
									tone="bg-primary/10 text-primary"
									label="Төлөв"
									value={
										isCompleted
											? "Гүйцэтгэсэн"
											: isInProgress
												? "Үргэлжлүүлэх"
												: "Гүйцэтгээгүй"
									}
								/>
							</div>

							{isLocked && (
								<p className="rounded-2xl bg-pop-sun-soft p-3 text-sm font-bold text-pop-sun-ink">
									Төлбөр төлөх шаардлагатай
								</p>
							)}
						</div>
					</div>

					<SheetFooter className="border-t-2 border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
						<Button
							size="lg"
							onClick={handlePrimary}
							className={cn(
								"w-full",
								isLocked &&
									"bg-pop-sun text-foreground shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_65%,black)] hover:bg-pop-sun/90",
							)}
						>
							{isLocked ? (
								<CreditCard className="size-4" />
							) : isInProgress ? (
								<RotateCw className="size-4" />
							) : (
								<Play className="size-4" />
							)}
							{primaryLabel}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</motion.div>
	);
};

function SheetRow({
	icon,
	tone,
	label,
	value,
}: {
	icon: React.ReactNode;
	tone: string;
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="flex items-center gap-3 px-3 py-2.5">
			<span
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-xl",
					tone,
				)}
			>
				{icon}
			</span>
			<span className="shrink-0 text-xs font-bold text-muted-foreground">
				{label}
			</span>
			<span className="ml-auto min-w-0 truncate text-right text-sm font-extrabold text-foreground">
				{value}
			</span>
		</div>
	);
}
