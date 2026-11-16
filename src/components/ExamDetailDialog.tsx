"use client";

import {
	ArrowRight,
	Ban,
	BookOpen,
	CalendarClock,
	CalendarX,
	Clock,
	CreditCard,
	FileText,
	Hourglass,
	Info,
	Layers,
	Lock,
	ShieldCheck,
	Timer,
	Unlock,
	User,
	Wallet,
	Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { ExamRulesPanel } from "@/components/examRuleDialog";
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

// ============================================================================
// Date / time helpers (shared with the exam list cards)
// ============================================================================

/**
 * Parses a backend date as a wall-clock time (same convention as
 * useServerTime, which parses the server ISO string directly as UTC).
 */
export const parseExamDate = (dateStr?: string | null): number | null => {
	if (!dateStr) return null;
	const m = dateStr.match(
		/(\d{4})[-./](\d{1,2})[-./](\d{1,2})[ T]?(\d{1,2})?:?(\d{2})?:?(\d{2})?/,
	);
	if (m) {
		return Date.UTC(
			Number(m[1]),
			Number(m[2]) - 1,
			Number(m[3]),
			Number(m[4] ?? 0),
			Number(m[5] ?? 0),
			Number(m[6] ?? 0),
		);
	}
	const t = Date.parse(dateStr);
	return Number.isNaN(t) ? null : t;
};

/** "2026-03-12T17:23:00.000Z" → "2026-03-12 17:23" */
export const formatExamDate = (dateStr?: string | null) => {
	if (!dateStr) return "—";
	const cleaned = dateStr.replace("T", " ").replace("Z", "").split(".")[0];
	return cleaned.slice(0, 16);
};

/** "2 өдөр 3 цаг" / "3 цаг 12 мин" / "12:05" */
export const formatRemaining = (ms: number) => {
	if (ms <= 0) return "0 мин";
	const totalSec = Math.floor(ms / 1000);
	const days = Math.floor(totalSec / 86400);
	const hours = Math.floor((totalSec % 86400) / 3600);
	const mins = Math.floor((totalSec % 3600) / 60);
	const secs = totalSec % 60;
	if (days > 0) return `${days} өдөр ${hours} цаг`;
	if (hours > 0) return `${hours} цаг ${mins} мин`;
	return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// ============================================================================
// Types
// ============================================================================

/** Шалгалтын жагсаалт (ExamlistsData) болон нүүр хуудасны (Exam) аль алинд таарна. */
export interface ExamDetail {
	exam_id: number;
	title: string;
	/** Эхлэх огноо */
	ognoo: string;
	/** Дуусах огноо */
	enddate: string;
	exam_minute: number;
	que_cnt: number;
	lesson_name: string;
	teach_name: string;
	help?: string | null;
	/** 0 = Эхлээгүй, 1 = Идэвхтэй, 2+ = Дууссан */
	flag: number;
	flag_name?: string | null;
	ispaydescr?: string | null;
	amount?: number | null;
	ispurchased: number;
	ispurchaseddescr?: string | null;
	plan_name?: string | null;
}

/**
 * Төлөвийг дуудагч тал тооцоолно — жагсаалт болон нүүр хуудас
 * төлбөрийн дүрмээ өөр өөрөөр тодорхойлдог тул.
 */
export interface ExamDetailStatus {
	/** Төлбөртэй бөгөөд төлөгдөөгүй */
	isLocked: boolean;
	isPurchased: boolean;
	isExpired: boolean;
	/** «Төлбөр төлөх» (QPay) товч харуулах эсэх */
	canPay: boolean;
	/** Дүрэм рүү шилжиж шалгалт эхлүүлэх боломжтой эсэх */
	canTakeExam: boolean;
}

type Step = "details" | "rules";

interface ExamDetailDialogProps<T extends ExamDetail> {
	/** null бол хаалттай */
	exam: T | null;
	getStatus: (exam: T) => ExamDetailStatus;
	onOpenChange: (open: boolean) => void;
	/** QPay нэхэмжлэх үүсгэх */
	onPay: (exam: T) => void;
	/** Дүрмийг зөвшөөрсний дараа — шалгалт руу шилжинэ */
	onStart: (exam: T) => void;
	isCreatingInvoice?: boolean;
	/** Сервертэй тааруулсан одоогийн цаг (countdown). Байхгүй бол зөвхөн огноо харуулна. */
	now?: Date | null;
	/** Нээгдэх алхам (жишээ нь «Шалгалт эхлүүлэх» товчноос шууд дүрэм рүү) */
	initialStep?: Step;
	/** Дүрмийн жагсаалтад утасны хяналтын дүрмийг харуулах эсэх */
	mobileRules?: boolean;
}

/**
 * Шалгалтын дэлгэрэнгүй → дүрэм зөвшөөрөх → эхлүүлэх, нэг dialog дотор.
 * - Утас (<640px): доороос гарч ирэх sheet хэлбэр, чирэх бариултай, footer наалттай
 * - Таблет: төвлөрсөн dialog
 * - Desktop (≥1024px): 2 баганатай өргөн dialog
 */
export function ExamDetailDialog<T extends ExamDetail>({
	exam,
	getStatus,
	onOpenChange,
	onPay,
	onStart,
	isCreatingInvoice = false,
	now,
	initialStep = "details",
	mobileRules = false,
}: ExamDetailDialogProps<T>) {
	// Dialog нээгдэх бүрт (exam солигдоход) initialStep-ээс эхэлнэ
	const [step, setStep] = useState<Step>(initialStep);
	const [prevExam, setPrevExam] = useState<T | null>(exam);
	if (exam !== prevExam) {
		setPrevExam(exam);
		setStep(initialStep);
	}

	const status = exam ? getStatus(exam) : null;

	return (
		<Dialog open={exam !== null} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					"flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0",
					// Утас: доод талд наалдсан sheet
					"max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:border-b-0",
					"max-sm:data-[state=open]:slide-in-from-bottom-10 max-sm:data-[state=closed]:slide-out-to-bottom-10",
					// Таблет / desktop
					"sm:max-h-[88dvh] lg:max-w-3xl",
					step === "rules" ? "sm:max-w-2xl" : "sm:max-w-lg",
				)}
			>
				{/* Утсан дээрх чирэх бариул */}
				<div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border sm:hidden" />

				{exam &&
					status &&
					(step === "rules" && status.canTakeExam ? (
						<ExamRulesPanel
							key={exam.exam_id}
							cancelMode="back"
							isMobile={mobileRules}
							onCancel={() => setStep("details")}
							onConfirm={() => onStart(exam)}
						/>
					) : (
						<ExamDetailBody
							exam={exam}
							status={status}
							now={now ?? null}
							isCreatingInvoice={isCreatingInvoice}
							onPay={() => onPay(exam)}
							onProceed={() => setStep("rules")}
						/>
					))}
			</DialogContent>
		</Dialog>
	);
}

// ============================================================================
// Details step
// ============================================================================

const getFlagConfig = (exam: ExamDetail) => {
	switch (exam.flag) {
		case 1:
			return {
				label: "Идэвхтэй",
				Icon: Zap,
				badgeVariant: "mint" as const,
				banner: "bg-pop-mint-soft text-pop-mint-ink",
			};
		case 0:
			return {
				label: "Эхлээгүй",
				Icon: Timer,
				badgeVariant: "sky" as const,
				banner: "bg-pop-sky-soft text-pop-sky-ink",
			};
		default:
			return {
				label: exam.flag_name || "Дууссан",
				Icon: Clock,
				badgeVariant: "secondary" as const,
				banner: "bg-muted text-muted-foreground",
			};
	}
};

function ExamDetailBody({
	exam,
	status,
	now,
	isCreatingInvoice,
	onPay,
	onProceed,
}: {
	exam: ExamDetail;
	status: ExamDetailStatus;
	now: Date | null;
	isCreatingInvoice: boolean;
	onPay: () => void;
	onProceed: () => void;
}) {
	const { isLocked, isPurchased, isExpired, canPay, canTakeExam } = status;
	const flagConfig = getFlagConfig(exam);

	const nowMs = now ? now.getTime() : null;
	const startMs = parseExamDate(exam.ognoo);
	const endMs = parseExamDate(exam.enddate);
	const startsIn =
		nowMs !== null && startMs !== null && startMs > nowMs
			? startMs - nowMs
			: null;
	const endsIn =
		nowMs !== null && endMs !== null && endMs > nowMs && startsIn === null
			? endMs - nowMs
			: null;
	const hasEnded =
		isExpired ||
		exam.flag >= 2 ||
		(nowMs !== null && endMs !== null && endMs <= nowMs);

	const paymentValue =
		isLocked || isPurchased
			? `${exam.amount ?? 0}₮ · ${
					exam.ispurchaseddescr || (isPurchased ? "Төлөгдсөн" : "Төлөгдөөгүй")
				}`
			: exam.ispurchaseddescr || "—";

	// Эхлүүлэх боломжгүй үеийн шалтгаан
	const unavailable = hasEnded
		? {
				Icon: CalendarX,
				label: exam.flag_name || "Хугацаа дууссан",
				note: "Энэ шалгалтын хугацаа дууссан тул өгөх боломжгүй.",
			}
		: exam.flag === 0
			? {
					Icon: Timer,
					label: "Эхлээгүй",
					note:
						startsIn !== null
							? `Шалгалт эхлэхэд ${formatRemaining(startsIn)} үлдлээ.`
							: `Шалгалт ${formatExamDate(exam.ognoo)}-д эхэлнэ.`,
				}
			: {
					Icon: Ban,
					label: exam.flag_name || "Боломжгүй",
					note: isLocked
						? "Энэ шалгалтыг өгөхийн тулд төлбөр төлөх шаардлагатай."
						: "Энэ шалгалтыг одоогоор өгөх боломжгүй.",
				};

	const statusBadge = isLocked ? (
		<Badge variant="sun" className="border-2 border-pop-sun/40 bg-card">
			<Lock />
			Төлбөртэй
		</Badge>
	) : isPurchased ? (
		<Badge variant="mint" className="border-2 border-pop-mint/40 bg-card">
			<Unlock />
			Төлөгдсөн
		</Badge>
	) : (
		<Badge
			variant={flagConfig.badgeVariant}
			className="max-w-full whitespace-normal border-2 bg-card text-left"
		>
			<flagConfig.Icon />
			{flagConfig.label}
		</Badge>
	);

	return (
		<>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.1fr_1fr] lg:gap-6">
					{/* Зүүн багана: төлөв + гарчиг + хугацаа */}
					<div className="flex min-w-0 flex-col gap-3">
						<div
							className={cn(
								"flex items-center justify-between gap-3 rounded-2xl p-3 pr-10 lg:pr-3",
								isLocked
									? "bg-pop-sun-soft text-pop-sun-ink"
									: flagConfig.banner,
							)}
						>
							{statusBadge}
							{isLocked ? (
								<Lock className="size-6 shrink-0" strokeWidth={2.5} />
							) : (
								<FileText className="size-6 shrink-0" strokeWidth={2.5} />
							)}
						</div>
						<p className="text-xs font-bold uppercase tracking-wide text-primary">
							{exam.lesson_name}
						</p>
						<DialogTitle className="text-xl font-black leading-snug break-words sm:text-2xl">
							{exam.title}
						</DialogTitle>
						<DialogDescription className="sr-only">
							{exam.lesson_name} · {exam.teach_name} ·{" "}
							{formatExamDate(exam.ognoo)} – {formatExamDate(exam.enddate)}
						</DialogDescription>

						{(endsIn !== null || startsIn !== null) && (
							<div
								className={cn(
									"flex items-center gap-3 rounded-2xl p-3",
									startsIn !== null
										? "bg-pop-sky-soft text-pop-sky-ink"
										: "bg-pop-mint-soft text-pop-mint-ink",
								)}
							>
								<Hourglass className="size-5 shrink-0" strokeWidth={2.5} />
								<div className="min-w-0">
									<p className="text-[11px] font-extrabold uppercase tracking-wide opacity-80">
										{startsIn !== null ? "Эхлэхэд үлдсэн" : "Дуусахад үлдсэн"}
									</p>
									<p className="truncate text-lg font-black tabular-nums">
										{formatRemaining(startsIn ?? endsIn ?? 0)}
									</p>
								</div>
							</div>
						)}

						{exam.help && (
							<div className="rounded-2xl border-2 border-dashed border-border bg-muted/50 p-4">
								<p className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
									<Info className="size-3.5" />
									Тайлбар
								</p>
								<p className="whitespace-pre-line text-sm font-semibold text-foreground/90">
									{exam.help}
								</p>
							</div>
						)}
					</div>

					{/* Баруун багана: мэдээлэл */}
					<div className="flex min-w-0 flex-col gap-4">
						<div className="grid grid-cols-2 gap-2">
							<div className="rounded-2xl bg-pop-sky-soft p-3">
								<p className="text-2xl font-black text-pop-sky-ink">
									{exam.exam_minute}
								</p>
								<p className="text-[11px] font-bold uppercase tracking-wide text-pop-sky-ink/80">
									минут
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
							{exam.teach_name && (
								<DetailRow
									icon={<User className="size-4" />}
									tone="bg-pop-pink-soft text-pop-pink-ink"
									label="Багш"
									value={exam.teach_name}
								/>
							)}
							<DetailRow
								icon={<BookOpen className="size-4" />}
								tone="bg-primary/10 text-primary"
								label="Хичээл"
								value={exam.lesson_name}
							/>
							<DetailRow
								icon={<CalendarClock className="size-4" />}
								tone="bg-pop-mint-soft text-pop-mint-ink"
								label="Эхлэх огноо"
								value={formatExamDate(exam.ognoo)}
							/>
							<DetailRow
								icon={<CalendarX className="size-4" />}
								tone="bg-pop-coral-soft text-pop-coral-ink"
								label="Дуусах огноо"
								value={formatExamDate(exam.enddate)}
							/>
							<DetailRow
								icon={<Wallet className="size-4" />}
								tone="bg-pop-sun-soft text-pop-sun-ink"
								label={exam.ispaydescr || "Төлбөр"}
								value={paymentValue}
							/>
							{exam.plan_name && (
								<DetailRow
									icon={<Layers className="size-4" />}
									tone="bg-pop-sky-soft text-pop-sky-ink"
									label="Төлөвлөгөө"
									value={exam.plan_name}
								/>
							)}
						</div>

						{canPay ? (
							<p className="rounded-2xl bg-pop-sun-soft p-3 text-sm font-bold text-pop-sun-ink">
								Энэ шалгалтыг өгөхийн тулд төлбөр төлөх шаардлагатай. QPay-ээр
								төлсний дараа шалгалт өгөх боломжтой болно.
							</p>
						) : canTakeExam ? (
							<ul className="space-y-2 rounded-2xl bg-muted/50 p-3 text-sm font-semibold text-muted-foreground">
								<li className="flex items-start gap-2">
									<ShieldCheck
										className="mt-0.5 size-4 shrink-0"
										strokeWidth={2.5}
									/>
									Хяналттай шалгалт — дараагийн алхамд дүрэмтэй танилцаж
									зөвшөөрнө.
								</li>
								<li className="flex items-start gap-2">
									<Timer className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
									Эхлүүлсний дараа {exam.exam_minute} минут тоологдож эхэлнэ.
								</li>
							</ul>
						) : (
							<p className="flex items-start gap-2 rounded-2xl bg-muted p-3 text-sm font-bold text-muted-foreground">
								<unavailable.Icon
									className="mt-0.5 size-4 shrink-0"
									strokeWidth={2.5}
								/>
								{unavailable.note}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Товчнууд — урт контенттой үед ч үргэлж харагдана */}
			<div className="flex shrink-0 flex-col-reverse gap-2 border-t-2 border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
				<Button
					asChild
					variant="outline"
					size="lg"
					className="w-full sm:w-auto"
				>
					<DialogClose>Болих</DialogClose>
				</Button>
				{canPay ? (
					<Button
						size="lg"
						autoFocus
						onClick={onPay}
						disabled={isCreatingInvoice}
						className="w-full bg-pop-sun text-foreground shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_65%,black)] hover:bg-pop-sun/90 active:shadow-[0_1px_0_0_color-mix(in_oklch,var(--pop-sun)_65%,black)] sm:w-auto sm:min-w-44"
					>
						{isCreatingInvoice ? (
							"Уншиж байна..."
						) : (
							<>
								<CreditCard className="size-4" />
								Төлбөр төлөх
							</>
						)}
					</Button>
				) : canTakeExam ? (
					<Button
						size="lg"
						autoFocus
						onClick={onProceed}
						className="w-full sm:w-auto sm:min-w-44"
					>
						Эхлүүлэх
						<ArrowRight className="size-4" />
					</Button>
				) : (
					<Button
						size="lg"
						variant="secondary"
						disabled
						className="w-full sm:w-auto sm:min-w-44"
					>
						<unavailable.Icon className="size-4" />
						{unavailable.label}
					</Button>
				)}
			</div>
		</>
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
