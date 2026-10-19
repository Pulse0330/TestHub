// components/LessonFilter.tsx
"use client";

import { Check } from "lucide-react";
import { FlagIcon } from "@/components/FlagIcon";
import { getLessonVisual } from "@/lib/lessonVisual";
import { cn } from "@/lib/utils";

interface Lesson {
	lesson_id: number;
	lesson_name: string;
	sort: number;
}

interface LessonFilterProps {
	lessons: Lesson[];
	selectedLessonId: number | null; // null-г нэмсэн
	onLessonSelect: (lessonId: number) => void;
	/** Хичээл тус бүрийн тоо (мэдэгдэж байвал). lesson_id → count */
	counts?: Record<number, number>;
}

export default function LessonFilter({
	lessons,
	selectedLessonId,
	onLessonSelect,
	counts,
}: LessonFilterProps) {
	// Хэрэв lessons хоосон эсвэл selectedLessonId null бол харуулахгүй
	if (lessons.length === 0 || selectedLessonId === null) {
		return null;
	}

	return (
		<div className="relative min-w-0">
			{/* Fade edges to hint horizontal scroll */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent sm:hidden"
			/>
			<div
				role="toolbar"
				aria-label="Хичээл сонгох"
				className="scrollbar-none -mx-1 flex snap-x items-stretch gap-2.5 overflow-x-auto px-1 pt-1 pb-2"
			>
				{lessons.map((lesson) => {
					const active = selectedLessonId === lesson.lesson_id;
					const v = getLessonVisual(lesson.lesson_name, lesson.lesson_id);
					const count = counts?.[lesson.lesson_id];
					return (
						<button
							key={lesson.lesson_id}
							type="button"
							onClick={() => onLessonSelect(lesson.lesson_id)}
							aria-label={`${lesson.lesson_name} хичээл сонгох`}
							aria-pressed={active}
							title={lesson.lesson_name}
							className={cn(
								"group relative flex w-[88px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl border-2 px-2 pt-3 pb-2.5 text-center transition-all duration-150 active:translate-y-0.5 sm:w-[100px]",
								active
									? cn(v.solid, v.shadow, "-translate-y-0.5")
									: cn(
											"border-border bg-card text-foreground shadow-[0_3px_0_0_var(--border)] hover:-translate-y-0.5",
											v.hoverBorder,
										),
							)}
						>
							{active && (
								<span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-white/90 text-[oklch(0.25_0.05_285)]">
									<Check className="size-3" strokeWidth={3.5} />
								</span>
							)}
							<span
								aria-hidden="true"
								className={cn(
									"flex size-10 items-center justify-center rounded-xl text-xl transition-transform group-hover:scale-110",
									active ? "bg-white/25" : v.soft,
								)}
							>
								{v.flag ? <FlagIcon code={v.flag} className="h-5 w-[30px]" /> : v.emoji}
							</span>
							<span className="line-clamp-2 w-full text-[11px] leading-tight font-extrabold sm:text-xs">
								{lesson.lesson_name}
							</span>
							{typeof count === "number" && (
								<span
									className={cn(
										"rounded-full px-1.5 text-[10px] font-black tabular-nums",
										active ? "bg-white/25" : "bg-muted text-muted-foreground",
									)}
								>
									{count}
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
