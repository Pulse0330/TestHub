"use client";

import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ContentView } from "@/types/course/contentView";
import { SafeHtmlContent } from "./safeHtmlContent";

interface LessonContentProps {
	lesson: ContentView;
	lessonIndex: number;
	totalLessons: number;
	isCompleted: boolean;
	/**
	 * Navigation handlers. The player page renders these in its sticky
	 * bottom bar (Өмнөх / Дууссан / Дараах / Бусад хичээл); they stay part
	 * of the props contract.
	 */
	onMarkComplete: () => void;
	onPrevious: () => void;
	onNext: () => void;
	onFinish: () => void;
}

export function LessonContent({
	lesson,
	lessonIndex,
	totalLessons,
	isCompleted,
}: LessonContentProps) {
	return (
		<article className="card-pop overflow-hidden animate-pop-in">
			{/* Lesson heading */}
			<header className="relative border-b-2 border-border bg-gradient-to-br from-pop-violet-soft via-card to-card px-5 pt-5 pb-4 md:px-8 md:pt-7 md:pb-5">
				<div className="flex flex-wrap items-center gap-2 mb-3">
					<span className="inline-flex items-center rounded-full bg-pop-violet text-primary-foreground px-2.5 py-0.5 text-xs font-black tabular-nums">
						{lessonIndex + 1} / {totalLessons}
					</span>
					<Badge variant="sky" className="rounded-full">
						{lesson.elesson_type}
					</Badge>
					{isCompleted && (
						<Badge className="rounded-full bg-success text-primary-foreground">
							<CheckCircle2 className="h-3 w-3 mr-1" />
							Дууссан
						</Badge>
					)}
				</div>
				<h2 className="text-xl md:text-3xl font-black leading-tight tracking-tight text-foreground">
					Хичээл {lessonIndex + 1}: {lesson.content_name}
				</h2>
			</header>

			{/* Reading area */}
			<div className="px-5 py-6 md:px-10 md:py-8">
				<div className="text-base leading-relaxed text-foreground">
					<SafeHtmlContent
						html={lesson.url || ""}
						contentType={lesson.l_content_type || 0}
					/>
				</div>
			</div>
		</article>
	);
}
