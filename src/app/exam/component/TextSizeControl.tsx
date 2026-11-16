"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Асуултын бичвэрийн хэмжээ — нүдэнд тухтай уншихад зориулсан 3 түвшин. */
const SCALES = [1, 1.12, 1.25] as const;
const STORAGE_KEY = "exam-text-scale";

/**
 * Шалгалт/сорилын асуултын хэсгийн томруулалт. Сонголт localStorage-д
 * хадгалагдаж дараагийн шалгалтанд ч хэвээр үлдэнэ.
 */
export function useExamTextScale() {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		try {
			const saved = Number(localStorage.getItem(STORAGE_KEY));
			if (Number.isInteger(saved) && saved >= 0 && saved < SCALES.length) {
				setIndex(saved);
			}
		} catch {
			// private mode — анхдагч хэмжээ
		}
	}, []);

	const update = useCallback((next: number) => {
		const clamped = Math.min(Math.max(next, 0), SCALES.length - 1);
		setIndex(clamped);
		try {
			localStorage.setItem(STORAGE_KEY, String(clamped));
		} catch {
			// хадгалж чадаагүй ч ажиллана
		}
	}, []);

	return {
		scale: SCALES[index],
		canDecrease: index > 0,
		canIncrease: index < SCALES.length - 1,
		decrease: () => update(index - 1),
		increase: () => update(index + 1),
	};
}

type TextScale = ReturnType<typeof useExamTextScale>;

export function TextSizeControl({
	textScale,
	className,
}: {
	textScale: TextScale;
	className?: string;
}) {
	const btn =
		"flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-black text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-35";
	return (
		<fieldset
			className={cn(
				"m-0 flex shrink-0 items-center rounded-xl border-2 border-border bg-muted p-0.5",
				className,
			)}
		>
			<legend className="sr-only">Бичвэрийн хэмжээ</legend>
			<button
				type="button"
				onClick={textScale.decrease}
				disabled={!textScale.canDecrease}
				aria-label="Бичвэр жижигрүүлэх"
				className={cn(btn, "text-xs")}
			>
				A−
			</button>
			<button
				type="button"
				onClick={textScale.increase}
				disabled={!textScale.canIncrease}
				aria-label="Бичвэр томруулах"
				className={cn(btn, "text-base")}
			>
				A+
			</button>
		</fieldset>
	);
}
