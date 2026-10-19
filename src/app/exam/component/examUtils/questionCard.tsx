"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { memo, useCallback } from "react";
import MathContent from "@/app/exam/component/examUtils/MathContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AnswerValue } from "@/types/exam/exam";
import type { ExamQuestion } from "./examTypes";
import QuestionRenderer from "./questionRenderer";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface QuestionCardProps {
	question: ExamQuestion;
	index?: number;
	selectedAnswer: AnswerValue | undefined;
	isBookmarked: boolean;
	isTyping: boolean;
	onAnswerChange: (questionId: number, answer: AnswerValue) => void;
	onBookmarkToggle: (questionId: number) => void;
	examId?: number;
	userId: number;
	variant?: "desktop" | "mobile";
	showTypingIndicator?: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isAnsweredValue(answer: AnswerValue | undefined): boolean {
	if (answer === undefined || answer === null) return false;
	if (Array.isArray(answer)) return answer.length > 0;
	if (typeof answer === "string") return answer.trim() !== "";
	if (typeof answer === "number") return !Number.isNaN(answer) && answer !== 0;
	if (typeof answer === "object") return Object.keys(answer).length > 0;
	return false;
}

function getBorderClass(
	isAnswered: boolean,
	isBookmarked: boolean,
	isTyping: boolean,
): string {
	if (isTyping)
		return "border-pop-sky shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sky)_45%,transparent)]";
	if (isAnswered && isBookmarked)
		return "border-warning shadow-[0_4px_0_0_color-mix(in_oklch,var(--warning)_55%,transparent)]";
	if (isAnswered)
		return "border-primary/50 shadow-[0_4px_0_0_color-mix(in_oklch,var(--primary)_35%,transparent)]";
	if (isBookmarked)
		return "border-warning/70 shadow-[0_4px_0_0_color-mix(in_oklch,var(--warning)_40%,transparent)]";
	return "border-border";
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
const BOUNCE_DELAYS = [0, 150, 300];
const TypingIndicator = memo(function TypingIndicator() {
	return (
		<div className="flex items-center gap-1 rounded-full bg-pop-sky-soft px-2.5 py-1.5">
			<div className="flex gap-0.5">
				{BOUNCE_DELAYS.map((delay) => (
					<span
						key={delay}
						className="size-1.5 animate-bounce rounded-full bg-pop-sky"
						style={{ animationDelay: `${delay}ms` }}
					/>
				))}
			</div>
		</div>
	);
});

interface BookmarkButtonProps {
	isBookmarked: boolean;
	onClick: () => void;
	className?: string;
}

const BookmarkButton = memo(function BookmarkButton({
	isBookmarked,
	onClick,
	className,
}: BookmarkButtonProps) {
	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={onClick}
			className={className}
			title={isBookmarked ? "Тэмдэглэгээ хасах" : "Тэмдэглэх"}
		>
			{isBookmarked ? (
				<BookmarkCheck className="size-5 fill-warning text-warning" />
			) : (
				<Bookmark className="size-5 text-muted-foreground" />
			)}
		</Button>
	);
});

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export const QuestionCard = memo(function QuestionCard({
	question: q,

	selectedAnswer,
	isBookmarked,
	isTyping,
	onAnswerChange,
	onBookmarkToggle,
	examId,
	userId,
	variant = "desktop",
	showTypingIndicator = true,
}: QuestionCardProps) {
	const handleBookmark = useCallback(
		() => onBookmarkToggle(q.question_id),
		[onBookmarkToggle, q.question_id],
	);

	const isAnswered = isAnsweredValue(selectedAnswer);
	const borderClass = getBorderClass(isAnswered, isBookmarked, isTyping);

	// ── Desktop layout ──────────────────────────────────────────
	if (variant === "desktop") {
		return (
			<div id={`question-${q.question_id}`}>
				<Card className={`gap-0 py-0 transition-colors ${borderClass}`}>
					<CardContent className="p-5 sm:p-6">
						<div className="flex flex-col">
							<div className="mb-3 flex items-center justify-between gap-2">
								<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
									Асуулт {q.row_num}
								</span>
								<BookmarkButton
									isBookmarked={isBookmarked}
									onClick={handleBookmark}
									className="shrink-0 rounded-xl"
								/>
							</div>
							<div className="min-w-0 flex-1">
								<div className="mb-5">
									<div className="prose prose-sm dark:prose-invert max-w-none flex-1 text-base font-semibold leading-relaxed text-foreground sm:text-lg">
										<MathContent
											html={q.question_name.replace(/<img[^>]*>/gi, "")}
										/>
									</div>
								</div>
								<QuestionRenderer
									question={q}
									selectedAnswer={selectedAnswer}
									onAnswerChange={onAnswerChange}
									examId={examId}
									userId={userId}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// ── Mobile layout ───────────────────────────────────────────
	return (
		<Card className={`gap-0 py-0 transition-colors ${borderClass}`}>
			<CardContent className="p-4">
				<div className="mb-3 flex items-center justify-between gap-2">
					<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
						Асуулт {q.row_num}
					</span>
					<div className="flex shrink-0 items-center gap-2">
						{showTypingIndicator && isTyping && <TypingIndicator />}
						<BookmarkButton
							isBookmarked={isBookmarked}
							onClick={handleBookmark}
							className="size-9 shrink-0 rounded-xl"
						/>
					</div>
				</div>
				<div className="min-w-0">
					<div className="prose prose-sm dark:prose-invert max-w-none text-base font-semibold leading-relaxed text-foreground">
						<MathContent html={q.question_name.replace(/<img[^>]*>/gi, "")} />
					</div>
				</div>
				<div className="mt-4">
					<QuestionRenderer
						question={q}
						selectedAnswer={selectedAnswer}
						onAnswerChange={onAnswerChange}
						examId={examId}
						userId={userId}
					/>
				</div>
			</CardContent>
		</Card>
	);
});

// ─────────────────────────────────────────────
// Backwards-compatible named exports
// ─────────────────────────────────────────────

export function DesktopQuestionCard(props: Omit<QuestionCardProps, "variant">) {
	return <QuestionCard {...props} variant="desktop" />;
}

export function MobileQuestionCard(props: Omit<QuestionCardProps, "variant">) {
	return <QuestionCard {...props} variant="mobile" />;
}
