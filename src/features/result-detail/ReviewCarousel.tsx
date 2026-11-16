"use client";

import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "./QuestionCard";
import type { QuestionEntry } from "./scoring";

interface ReviewCarouselProps {
	wrongEntries: QuestionEntry[];
	safeReviewIdx: number;
	onReviewIdxChange: (idx: number) => void;
	onToggle: (examQueId: number) => void;
	showTrueAns: boolean;
	showSourceBlock: boolean;
}

/** "Алдаатай хариултуудаар явах" горим: нэг нэгээр нь гүйлгэнэ. */
export const ReviewCarousel = memo(function ReviewCarousel({
	wrongEntries,
	safeReviewIdx,
	onReviewIdxChange,
	onToggle,
	showTrueAns,
	showSourceBlock,
}: ReviewCarouselProps) {
	const reviewEntry = wrongEntries[safeReviewIdx];
	return reviewEntry ? (
		<div className="space-y-3">
			<QuestionCard
				entry={reviewEntry}
				isOpen
				onToggle={onToggle}
				showTrueAns={showTrueAns}
				showSourceBlock={showSourceBlock}
			/>
			<div className="flex items-center justify-between gap-3">
				<Button
					variant="outline"
					disabled={safeReviewIdx === 0}
					onClick={() => onReviewIdxChange(Math.max(0, safeReviewIdx - 1))}
				>
					<ChevronLeft className="size-4" />
					Өмнөх
				</Button>
				<div className="flex flex-wrap justify-center gap-1">
					{wrongEntries.map((e, i) => (
						<button
							key={e.question.exam_que_id}
							type="button"
							aria-label={`${e.index + 1}`}
							onClick={() => onReviewIdxChange(i)}
							className={`h-2.5 rounded-full transition-all ${i === safeReviewIdx ? "w-6 bg-destructive" : "w-2.5 bg-border hover:bg-muted-foreground"}`}
						/>
					))}
				</div>
				<Button
					disabled={safeReviewIdx >= wrongEntries.length - 1}
					onClick={() =>
						onReviewIdxChange(
							Math.min(wrongEntries.length - 1, safeReviewIdx + 1),
						)
					}
				>
					Дараах
					<ChevronRight className="size-4" />
				</Button>
			</div>
		</div>
	) : (
		<div className="card-pop flex flex-col items-center p-10 text-center">
			<div className="mb-3 flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
				<CheckCircle className="size-8" />
			</div>
			<p className="font-extrabold">Алдаатай хариулт алга 🎉</p>
		</div>
	);
});
