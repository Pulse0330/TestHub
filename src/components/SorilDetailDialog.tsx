"use client";

import {
	Calendar,
	CheckCircle2,
	ClipboardCheck,
	CreditCard,
	Layers,
	Lock,
	Play,
	RotateCw,
	Save,
	Sparkles,
	Timer,
	Unlock,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Сорилын жагсаалт (SorillistsData) болон нүүр хуудасны (PastExam) аль алинд таарна. */
export interface SorilDetail {
	exam_id: number;
	soril_name: string;
	sorildate: string;
	/** Хугацаа (минут); 0 бол хязгааргүй */
	minut: number;
	que_cnt: number;
	/** 1 = гүйцэтгэсэн */
	isguitset: number;
	/** > 0 бол өмнө нь эхэлсэн */
	test_resid: number;
	filename?: string;
	ispay: number;
	paid: number;
	isopensoril: number;
	plan_name?: string;
	flag_name?: string;
}

export function formatSorilDate(dateStr: string | Date): string {
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return "Огноо тодорхойгүй";
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Ulaanbaatar",
		year: "numeric",
		month: "numeric",
		day: "numeric",
	}).formatToParts(date);
	const get = (type: string) => parts.find((p) => p.type === type)?.value;
	return `${get("year")}/${get("month")}/${get("day")}`;
}

export function getSorilStatus(s: SorilDetail) {
	const isCompleted = s.isguitset === 1;
	const isLocked =
		!isCompleted && s.ispay === 1 && s.paid === 0 && s.isopensoril !== 1;
	const isInProgress = !isCompleted && s.test_resid > 0;
	return { isCompleted, isLocked, isInProgress };
}

export function SorilStatusBadge({ soril }: { soril: SorilDetail }) {
	const { isCompleted, isLocked, isInProgress } = getSorilStatus(soril);
	if (isLocked)
		return (
			<Badge variant="sun" className="border-2 border-pop-sun/40 bg-card">
				<Lock />
				Төлбөртэй
			</Badge>
		);
	if (isCompleted)
		return (
			<Badge variant="mint" className="border-2 border-pop-mint/40 bg-card">
				<CheckCircle2 />
				Гүйцэтгэсэн
			</Badge>
		);
	if (isInProgress)
		return (
			<Badge variant="sky" className="border-2 border-pop-sky/40 bg-card">
				<RotateCw />
				Үргэлжлүүлэх
			</Badge>
		);
	return null;
}

interface SorilDetailDialogProps {
	soril: SorilDetail | null;
	onOpenChange: (open: boolean) => void;
	/** Төлбөргүй/төлөгдсөн сорилыг эхлүүлэх */
	onStart: (soril: SorilDetail) => void;
	/** Төлбөртэй сорил — төлбөр төлөх рүү */
	onPay: (soril: SorilDetail) => void;
}

/**
 * Сорилын дэлгэрэнгүй + эхлүүлэх баталгаажуулалт.
 * - Утас (<640px): доороос гарч ирэх sheet хэлбэр
 * - Таблет: төвлөрсөн dialog
 * - Desktop (≥1024px): 2 баганатай өргөн dialog
 */
export function SorilDetailDialog({
	soril,
	onOpenChange,
	onStart,
	onPay,
}: SorilDetailDialogProps) {
	return (
		<Dialog open={soril !== null} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					"flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0",
					// Утас: доод талд наалдсан sheet
					"max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:border-b-0",
					"max-sm:data-[state=open]:slide-in-from-bottom-10 max-sm:data-[state=closed]:slide-out-to-bottom-10",
					// Таблет / desktop
					"sm:max-h-[88dvh] sm:max-w-lg lg:max-w-3xl",
				)}
			>
				{soril && (
					<SorilDetailBody soril={soril} onStart={onStart} onPay={onPay} />
				)}
			</DialogContent>
		</Dialog>
	);
}

function SorilDetailBody({
	soril,
	onStart,
	onPay,
}: {
	soril: SorilDetail;
	onStart: (soril: SorilDetail) => void;
	onPay: (soril: SorilDetail) => void;
}) {
	const { isCompleted, isLocked, isInProgress } = getSorilStatus(soril);
	const date = formatSorilDate(soril.sorildate);

	const primaryLabel = isLocked
		? "Төлбөр төлөх"
		: soril.flag_name ||
			(isInProgress
				? "Үргэлжлүүлэх"
				: isCompleted
					? "Дахин эхлүүлэх"
					: "Эхлүүлэх");

	const paymentLabel =
		soril.isopensoril === 1
			? "Нээлттэй"
			: soril.ispay === 1
				? soril.paid === 1
					? "Төлөгдсөн"
					: "Төлбөртэй"
				: "Үнэгүй";

	return (
		<>
			{/* Утсан дээрх чирэх бариул */}
			<div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border sm:hidden" />

			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.1fr_1fr] lg:gap-6">
					{/* Зүүн багана: зураг + гарчиг */}
					<div className="flex min-w-0 flex-col gap-3">
						<div className="relative aspect-5/2 w-full overflow-hidden rounded-2xl bg-pop-sun-soft lg:aspect-4/3">
							{soril.filename ? (
								<Image
									src={soril.filename}
									alt={soril.soril_name}
									fill
									className="object-cover"
									sizes="(max-width: 640px) 100vw, (max-width: 1024px) 32rem, 26rem"
								/>
							) : (
								<Sparkles
									className="absolute inset-0 m-auto size-10 text-pop-sun-ink"
									strokeWidth={2.5}
								/>
							)}
							<div className="absolute top-2 left-2">
								<SorilStatusBadge soril={soril} />
							</div>
						</div>
						{soril.plan_name && (
							<p className="text-xs font-bold uppercase tracking-wide text-pop-sun-ink">
								{soril.plan_name}
							</p>
						)}
						<DialogTitle className="pr-6 text-xl font-black leading-snug sm:text-2xl">
							{soril.soril_name}
						</DialogTitle>
						<DialogDescription className="sr-only">
							Сорилын огноо: {date}
						</DialogDescription>
					</div>

					{/* Баруун багана: мэдээлэл */}
					<div className="flex min-w-0 flex-col gap-4">
						<div className="grid grid-cols-2 gap-2">
							<div className="rounded-2xl bg-pop-sky-soft p-3">
								<p className="text-2xl font-black text-pop-sky-ink">
									{soril.minut > 0 ? soril.minut : "∞"}
								</p>
								<p className="text-[11px] font-bold uppercase tracking-wide text-pop-sky-ink/80">
									{soril.minut > 0 ? "минут" : "Хугацаа хязгааргүй"}
								</p>
							</div>
							<div className="rounded-2xl bg-pop-violet-soft p-3">
								<p className="text-2xl font-black text-pop-violet-ink">
									{soril.que_cnt}
								</p>
								<p className="text-[11px] font-bold uppercase tracking-wide text-pop-violet-ink/80">
									асуулт
								</p>
							</div>
						</div>

						<div className="divide-y-2 divide-border overflow-hidden rounded-2xl border-2 border-border bg-card">
							<DetailRow
								icon={<Calendar className="size-4" />}
								tone="bg-pop-sun-soft text-pop-sun-ink"
								label="Сорилын огноо"
								value={date}
							/>
							{soril.plan_name && (
								<DetailRow
									icon={<Layers className="size-4" />}
									tone="bg-pop-pink-soft text-pop-pink-ink"
									label="Төлөвлөгөө"
									value={soril.plan_name}
								/>
							)}
							<DetailRow
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
								value={paymentLabel}
							/>
							<DetailRow
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

						{isLocked ? (
							<p className="rounded-2xl bg-pop-sun-soft p-3 text-sm font-bold text-pop-sun-ink">
								Энэ сорилыг өгөхийн тулд төлбөр төлөх шаардлагатай.
							</p>
						) : (
							<ul className="space-y-2 rounded-2xl bg-muted/50 p-3 text-sm font-semibold text-muted-foreground">
								<li className="flex items-start gap-2">
									<Timer className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
									Эхлүүлсний дараа зарцуулсан хугацаа тоологдож эхэлнэ.
								</li>
								<li className="flex items-start gap-2">
									<Save className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
									Хариулт автоматаар хадгалагдана. Дуусмагц «Дуусгах» товчийг
									дарна уу.
								</li>
							</ul>
						)}
					</div>
				</div>
			</div>

			{/* Товчнууд — урт контенттой үед ч үргэлж харагдана */}
			<div className="flex shrink-0 flex-col-reverse gap-2 border-t-2 border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
				<DialogCloseButton />
				<Button
					size="lg"
					autoFocus
					onClick={() => (isLocked ? onPay(soril) : onStart(soril))}
					className={cn(
						"w-full sm:w-auto sm:min-w-44",
						isLocked &&
							"bg-pop-sun text-pop-on shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_65%,black)] hover:bg-pop-sun/90",
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
			</div>
		</>
	);
}

function DialogCloseButton() {
	return (
		<Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
			<DialogClose>Болих</DialogClose>
		</Button>
	);
}

function DetailRow({
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
