"use client";

import { AlertCircle, Clock, PlayCircle } from "lucide-react";
import { memo, useEffect, useMemo, useRef } from "react";
import { useServerTime } from "@/hooks/useServerTime";

interface ExamTimerProps {
	examStartTime: string;
	examEndTime: string;
	examMinutes: number;
	startedDate?: string;
	onTimeUp?: (isTimeUp: boolean) => void;
	onAutoFinish?: () => void;
	onTimeUpdate?: (display: string) => void;
}

const formatTime = (sec: number): string => {
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	const s = sec % 60;
	return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const parseLocalDate = (dateStr: string): Date => {
	if (dateStr.includes("T") || dateStr.endsWith("Z")) {
		return new Date(dateStr);
	}
	const normalized = `${dateStr.replace(" ", "T")}Z`;
	return new Date(normalized);
};

const ExamTimer = memo(function ExamTimer({
	examEndTime,
	examMinutes,
	startedDate,
	onTimeUp,
	onAutoFinish,
	onTimeUpdate,
}: ExamTimerProps) {
	const { currentTime, isLoading, isOnline } = useServerTime();

	const hasNotifiedTimeUp = useRef(false);
	const hasAutoFinished = useRef(false);

	const onTimeUpRef = useRef(onTimeUp);
	const onAutoFinishRef = useRef(onAutoFinish);
	const onTimeUpdateRef = useRef(onTimeUpdate);

	useEffect(() => {
		onTimeUpRef.current = onTimeUp;
		onAutoFinishRef.current = onAutoFinish;
		onTimeUpdateRef.current = onTimeUpdate;
	}, [onTimeUp, onAutoFinish, onTimeUpdate]);

	const { endDateTime, startDateTime } = useMemo(() => {
		return {
			endDateTime: parseLocalDate(examEndTime),
			startDateTime: startedDate ? parseLocalDate(startedDate) : null,
		};
	}, [examEndTime, startedDate]);

	const currentTimeMs = currentTime?.getTime() ?? null;

	const { status, remainingSec, percentage } = useMemo(() => {
		if (currentTimeMs === null) {
			return {
				status: "before" as const,
				remainingSec: examMinutes * 60,
				percentage: 100,
			};
		}

		const totalSec = examMinutes * 60;

		// ✅ Эхлээд тодорхойлно — хоёр салбарт хэрэглэнэ
		const msUntilEnd = endDateTime.getTime() - currentTimeMs;
		const secUntilEnd = Math.floor(msUntilEnd / 1000);

		if (startDateTime) {
			const elapsedMs = currentTimeMs - startDateTime.getTime();
			const elapsedSec = Math.floor(elapsedMs / 1000);

			// starteddate-аас тооцсон remaining
			const remainingFromStart = Math.max(0, totalSec - elapsedSec);

			// ✅ Хоёрын min → аль нь эрт дуусах вэ
			const remaining = Math.max(0, Math.min(remainingFromStart, secUntilEnd));

			const stat: "before" | "ongoing" | "ended" =
				elapsedSec < 0 ? "before" : remaining > 0 ? "ongoing" : "ended";
			const pct = totalSec > 0 ? (remaining / totalSec) * 100 : 0;
			return {
				status: stat,
				remainingSec: remaining,
				percentage: Math.max(0, Math.min(100, pct)),
			};
		}

		// Fallback: зөвхөн end_time-аас тооцох
		const remaining = Math.max(0, secUntilEnd);
		const stat: "before" | "ongoing" | "ended" =
			msUntilEnd <= 0 ? "ended" : "ongoing";
		const pct = totalSec > 0 ? (remaining / totalSec) * 100 : 0;
		return {
			status: stat,
			remainingSec: remaining,
			percentage: Math.max(0, Math.min(100, pct)),
		};
	}, [currentTimeMs, endDateTime, examMinutes, startDateTime]); // ✅ endDateTime нэмэгдсэн

	useEffect(() => {
		if (status !== "ended") return;
		if (!hasNotifiedTimeUp.current) {
			hasNotifiedTimeUp.current = true;
			onTimeUpRef.current?.(true);
		}
		if (!hasAutoFinished.current && onAutoFinishRef.current) {
			hasAutoFinished.current = true;
			onAutoFinishRef.current();
		}
	}, [status]);

	const formattedTime = formatTime(remainingSec);

	useEffect(() => {
		onTimeUpdateRef.current?.(formattedTime);
	}, [formattedTime]);

	const { isWarning, isDanger } = useMemo(() => {
		return {
			isWarning: percentage <= 20 && percentage > 10,
			isDanger: percentage <= 10,
		};
	}, [percentage]);

	const config = useMemo(() => {
		if (status === "ended" || isDanger) {
			return {
				border: "border-destructive shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_45%,transparent)]",
				bg: "bg-destructive/10",
				icon: AlertCircle,
				iconColor: "bg-destructive text-white",
				timerColor: "text-destructive",
			};
		}
		if (isWarning) {
			return {
				border: "border-warning shadow-[0_4px_0_0_color-mix(in_oklch,var(--warning)_55%,transparent)]",
				bg: "bg-pop-sun-soft",
				icon: Clock,
				iconColor: "bg-warning text-[color-mix(in_oklch,var(--warning)_22%,black)]",
				timerColor: "text-pop-sun-ink",
			};
		}
		return {
			border: "border-border shadow-[0_4px_0_0_var(--border)]",
			bg: "bg-card",
			icon: PlayCircle,
			iconColor: "bg-primary/10 text-primary",
			timerColor: "text-foreground",
		};
	}, [status, isDanger, isWarning]);

	if (isLoading || currentTimeMs === null) {
		return (
			<div className="w-full">
				<div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-2.5 text-muted-foreground shadow-[0_4px_0_0_var(--border)]">
					<Clock className="size-5 animate-spin" />
					<span className="text-sm font-bold">Ачааллаж байна...</span>
				</div>
			</div>
		);
	}

	const StatusIcon = config.icon;

	return (
		<div className="w-full">
			<div
				className={`relative flex w-full items-center gap-3 overflow-visible rounded-2xl border-2 px-3 py-2 transition-all duration-300 ${config.border} ${config.bg}`}
			>
				{!isOnline && (
					<div className="absolute -top-2.5 -right-2 z-10">
						<div className="flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[10px] font-black text-[color-mix(in_oklch,var(--warning)_22%,black)] shadow-[0_2px_0_0_color-mix(in_oklch,var(--warning)_60%,black)]">
							<div className="size-1.5 animate-pulse rounded-full bg-current" />
							<span className="hidden xs:inline">Offline</span>
							<span className="xs:hidden">OFF</span>
						</div>
					</div>
				)}

				<span
					className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${config.iconColor}`}
				>
					<StatusIcon className="size-5" strokeWidth={2.5} />
				</span>

				<div
					className={`font-black text-2xl leading-none tracking-tight tabular-nums ${config.timerColor}`}
				>
					{formattedTime}
				</div>
			</div>

			{status === "ongoing" && isDanger && (
				<div className="mt-2 animate-pulse rounded-2xl border-2 border-destructive/40 bg-destructive/10 px-3 py-2">
					<p className="text-center text-xs font-black text-destructive sm:text-sm">
						⚠️ Цаг дуусч байна! Шалгалтаа дүүргээрэй!
					</p>
				</div>
			)}

			{status === "ended" && (
				<div className="mt-2 rounded-2xl border-2 border-destructive/40 bg-destructive/10 px-3 py-2">
					<p className="text-center text-xs font-black text-destructive sm:text-sm">
						🛑 Шалгалтын цаг дууслаа. Автоматаар дуусгаж байна...
					</p>
				</div>
			)}
		</div>
	);
});

export default ExamTimer;
