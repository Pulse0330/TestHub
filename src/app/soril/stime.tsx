"use client";

import { Clock } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useServerTime } from "@/hooks/useServerTime";
import { computeElapsedSeconds } from "../exam/component/examTime";

interface ExamTimerProps {
	/** Сорил эхэлсэн серверийн огноо. Байхгүй бол хуудас нээгдсэнээс тоолно. */
	startedDate?: string | null;
	/** Хуудас ачаалсан цаг (ms) — startedDate байхгүй үеийн эхлэл. */
	fallbackStartMs: number;
	/** Жижиг (утасны top bar) хувилбар */
	compact?: boolean;
}

/**
 * Үргэлжилсэн хугацааг харуулна. Тоолуурын state зөвхөн энэ компонент
 * дотор байна (хуудсыг секунд бүр re-render хийхгүй). Утгыг starteddate +
 * серверийн цагаас тооцдог тул background tab-д хоцрохгүй, reload хийхэд
 * 0-оос эхлэхгүй.
 */
function ExamTimer({
	startedDate,
	fallbackStartMs,
	compact = false,
}: ExamTimerProps) {
	const { currentTime } = useServerTime();
	const [localNow, setLocalNow] = useState(() => Date.now());

	useEffect(() => {
		const interval = setInterval(() => setLocalNow(Date.now()), 1000);
		return () => clearInterval(interval);
	}, []);

	const seconds = computeElapsedSeconds({
		startedDate,
		serverNowMs: currentTime?.getTime() ?? null,
		localNowMs: localNow,
		fallbackStartMs,
	});

	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	return (
		<div
			role="timer"
			aria-label="Үргэлжилсэн хугацаа"
			className={`inline-flex shrink-0 items-center rounded-full bg-pop-sky-soft text-pop-sky-ink shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-sky)_35%,transparent)] ${
				compact
					? "gap-1.5 py-1 pl-1 pr-3 [&_.timer-num]:text-base"
					: "gap-2 py-1.5 pl-1.5 pr-4 [&_.timer-num]:text-xl"
			}`}
		>
			<div
				className={`flex items-center justify-center rounded-full bg-pop-sky text-white ${compact ? "size-6" : "size-8"}`}
			>
				<Clock className={compact ? "size-3.5" : "size-4"} strokeWidth={2.75} />
			</div>
			<div className="flex items-baseline tabular-nums">
				{hrs > 0 && (
					<>
						<div className="flex items-baseline gap-0.5">
							<span className="timer-num font-black leading-none">
								{hrs.toString().padStart(2, "0")}
							</span>
							<span className="text-[9px] font-extrabold uppercase opacity-70">
								Цаг
							</span>
						</div>
						<span className="px-1 text-lg font-black opacity-50">:</span>
					</>
				)}

				<span className="timer-num font-black leading-none">
					{mins.toString().padStart(2, "0")}
				</span>

				<span className="px-1 text-lg font-black opacity-50">:</span>

				<span className="timer-num font-black leading-none text-primary">
					{secs.toString().padStart(2, "0")}
				</span>
			</div>
		</div>
	);
}

export default memo(ExamTimer);
