"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearSession, IDLE_TIMEOUT_MS, LAST_ACTIVITY_KEY } from "@/lib/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import Portal from "./portal";

const WARNING_SECONDS = 10;
/** localStorage-д идэвх бичих давтамж (mousemove бүрд бичихгүй). */
const ACTIVITY_WRITE_THROTTLE_MS = 5_000;
const CHECK_INTERVAL_MS = 1_000;
const ACTIVITY_EVENTS = [
	"mousemove",
	"mousedown",
	"keydown",
	"touchstart",
	"scroll",
	"click",
] as const;

function readSharedActivity(): number {
	try {
		return Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
	} catch {
		return 0;
	}
}

function writeSharedActivity(ts: number) {
	try {
		localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
	} catch {
		// private mode гэх мэт — tab-ийн дотоод утга хангалттай
	}
}

/**
 * Идэвхгүй хэрэглэгчийг автоматаар гаргана.
 * - Бүх tab-ийн идэвхийг localStorage-аар хуваалцана: нэг tab-д ажиллаж
 *   байхад нөгөө идэвхгүй tab хэрэглэгчийг гаргахгүй.
 * - Шалгалт өгч байгаа tab (/exam/) өөрөө идэвхтэй гэж тооцогдоно.
 * - Event бүрд timer дахин үүсгэхгүй — зөвхөн timestamp шинэчилж,
 *   секундэд нэг удаа шалгана.
 */
export default function IdleTimerProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [countdown, setCountdown] = useState<number | null>(null);
	const pathname = usePathname();
	const userId = useAuthStore((s) => s.userId);

	const isExcluded = pathname.startsWith("/exam/");
	const lastLocalActivity = useRef(0);
	const lastWrite = useRef(0);

	useEffect(() => {
		if (!userId) return;

		const markActive = () => {
			const now = Date.now();
			lastLocalActivity.current = now;
			if (now - lastWrite.current >= ACTIVITY_WRITE_THROTTLE_MS) {
				lastWrite.current = now;
				writeSharedActivity(now);
			}
		};

		markActive();
		for (const e of ACTIVITY_EVENTS) {
			window.addEventListener(e, markActive, { passive: true });
		}

		const interval = setInterval(() => {
			// Шалгалтын үеэр хэрэглэгчийг идэвхтэй гэж үзнэ
			if (isExcluded) {
				markActive();
				setCountdown(null);
				return;
			}
			const last = Math.max(lastLocalActivity.current, readSharedActivity());
			const remainingMs = last + IDLE_TIMEOUT_MS - Date.now();
			if (remainingMs <= 0) {
				clearInterval(interval);
				clearSession();
				window.location.href = "/login?session=expired";
				return;
			}
			const secondsLeft = Math.ceil(remainingMs / 1000);
			setCountdown(secondsLeft <= WARNING_SECONDS ? secondsLeft : null);
		}, CHECK_INTERVAL_MS);

		return () => {
			for (const e of ACTIVITY_EVENTS)
				window.removeEventListener(e, markActive);
			clearInterval(interval);
		};
	}, [userId, isExcluded]);

	const showWarning = countdown !== null;

	return (
		<>
			{children}

			{showWarning && !isExcluded && (
				<Portal>
					<div className="pointer-events-auto fixed inset-0 flex items-center justify-center bg-[oklch(0.2_0.05_285/0.45)]">
						<div className="card-pop mx-4 w-full max-w-sm p-8 text-center animate-in fade-in zoom-in duration-200">
							<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-pop-sun-soft">
								<svg
									className="size-8 text-pop-sun-ink"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<title>Анхааруулга</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
									/>
								</svg>
							</div>
							<div className="relative w-20 h-20 mx-auto mb-4">
								<svg
									className="w-20 h-20 -rotate-90"
									viewBox="0 0 80 80"
									aria-hidden="true"
								>
									<title>Тоолуур</title>
									<circle
										cx="40"
										cy="40"
										r="34"
										stroke="currentColor"
										strokeWidth="6"
										fill="none"
										className="text-muted"
									/>
									<circle
										cx="40"
										cy="40"
										r="34"
										stroke="currentColor"
										strokeWidth="6"
										fill="none"
										strokeDasharray={`${2 * Math.PI * 34}`}
										strokeDashoffset={`${2 * Math.PI * 34 * (1 - (countdown ?? 0) / WARNING_SECONDS)}`}
										className="text-pop-sun transition-all duration-1000"
										strokeLinecap="round"
									/>
								</svg>
								<span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-foreground">
									{countdown}
								</span>
							</div>
							<h2 className="mb-2 text-xl font-black text-foreground">
								Идэвхгүй байна
							</h2>
							<p className="mb-6 text-sm font-semibold text-muted-foreground">
								<span className="font-extrabold text-pop-sun-ink">
									{countdown} секунд
								</span>
								-ын дараа автоматаар гарна.
							</p>
						</div>
					</div>
				</Portal>
			)}
		</>
	);
}
