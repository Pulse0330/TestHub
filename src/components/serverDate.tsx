"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getServerDate } from "@/lib/api";

interface ServerDateProps {
	variant?: "navbar" | "fixed";
}

export default function ServerDate({ variant = "navbar" }: ServerDateProps) {
	const { data: serverDateString, isLoading } = useQuery({
		queryKey: ["serverTime"],
		queryFn: getServerDate,
		staleTime: 0,
	});

	const serverDate = useMemo(
		() => (serverDateString ? new Date(serverDateString) : null),
		[serverDateString],
	);

	const serverDateRef = useRef<number | null>(null);
	const [tickCount, setTickCount] = useState(0);

	useEffect(() => {
		if (serverDate) {
			if (serverDate.getTime() !== serverDateRef.current) {
				serverDateRef.current = serverDate.getTime();
				setTimeout(() => setTickCount(0), 0);
			}
		}
	}, [serverDate]);

	useEffect(() => {
		if (!serverDate) return;
		const interval = setInterval(() => {
			setTickCount((prev) => prev + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, [serverDate]);

	const currentTime = useMemo(() => {
		if (!serverDate) return null;
		return new Date(serverDate.getTime() + tickCount * 1000);
	}, [serverDate, tickCount]);

	if (isLoading || !currentTime) {
		return (
			<div className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-border bg-muted px-3 text-muted-foreground">
				<Clock className="size-4 animate-spin" />
				<span className="font-mono text-xs font-bold sm:text-sm">--:--:--</span>
			</div>
		);
	}

	const year = currentTime.getUTCFullYear();
	const month = String(currentTime.getUTCMonth() + 1).padStart(2, "0");
	const day = String(currentTime.getUTCDate()).padStart(2, "0");
	const hours = String(currentTime.getUTCHours()).padStart(2, "0");
	const minutes = String(currentTime.getUTCMinutes()).padStart(2, "0");
	const seconds = String(currentTime.getUTCSeconds()).padStart(2, "0");

	// Fixed position variant (original behavior)
	if (variant === "fixed") {
		return (
			<div className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-2 shadow-[0_4px_0_0_var(--border)] transition-all duration-300 hover:-translate-y-0.5">
				{/* Desktop / Tablet view */}
				<div className="hidden sm:flex items-center gap-3">
					<div className="flex items-center gap-2">
						<Calendar className="size-4 text-pop-sky-ink" strokeWidth={2.5} />
						<span className="text-sm font-extrabold tabular-nums">
							{year}.{month}.{day}
						</span>
					</div>
					<div className="h-5 w-0.5 rounded-full bg-border" />
					<div className="flex items-center gap-2">
						<Clock className="size-4 animate-pulse text-pop-violet-ink" strokeWidth={2.5} />
						<div className="font-mono text-sm font-bold tabular-nums">
							{hours}:{minutes}:{seconds}
						</div>
					</div>
				</div>

				{/* Mobile view */}
				<div className="flex sm:hidden items-center gap-2">
					<Clock className="size-4 animate-pulse text-pop-violet-ink" strokeWidth={2.5} />
					<div className="font-mono text-sm font-bold tabular-nums">
						{hours}:{minutes}:{seconds}
					</div>
				</div>
			</div>
		);
	}

	// Navbar variant (inline)
	return (
		<div className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-pop-sky/30 bg-pop-sky-soft px-3 text-pop-sky-ink transition-colors sm:gap-3 sm:px-4">
			{/* Desktop / Tablet view */}
			<div className="hidden lg:flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					<Calendar className="size-3.5" strokeWidth={2.5} />
					<span className="text-xs font-extrabold tabular-nums">
						{year}.{month}.{day}
					</span>
				</div>
				<div className="h-4 w-0.5 rounded-full bg-pop-sky/30" />
				<div className="flex items-center gap-1.5">
					<Clock className="size-3.5 animate-pulse" strokeWidth={2.5} />
					<div className="font-mono text-xs font-bold tabular-nums">
						{hours}:{minutes}:{seconds}
					</div>
				</div>
			</div>

			{/* Tablet view - date + time compact */}
			<div className="hidden sm:flex lg:hidden items-center gap-2">
				<div className="flex items-center gap-1.5">
					<Calendar className="size-3.5" strokeWidth={2.5} />
					<span className="text-xs font-extrabold tabular-nums">
						{month}.{day}
					</span>
				</div>
				<div className="h-4 w-0.5 rounded-full bg-pop-sky/30" />
				<div className="flex items-center gap-1.5">
					<Clock className="size-3.5 animate-pulse" strokeWidth={2.5} />
					<div className="font-mono text-xs font-bold tabular-nums">
						{hours}:{minutes}
					</div>
				</div>
			</div>

			{/* Mobile view - time only */}
			<div className="flex sm:hidden items-center gap-1.5">
				<Clock className="size-3.5 animate-pulse" strokeWidth={2.5} />
				<div className="font-mono text-xs font-bold tabular-nums">
					{hours}:{minutes}
				</div>
			</div>
		</div>
	);
}
