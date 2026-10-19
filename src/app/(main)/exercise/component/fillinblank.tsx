// D:\Programms\Bymbaa\front\src\app\exam\component\question\fillInTheBlank.tsx
"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FillInTheBlankQuestionProps {
	questionId: number;
	questionText: string;
	correctAnswer?: string;
	value?: string;
	mode?: "exam" | "review";
	onAnswerChange?: (questionId: number, answerText: string) => void;
	readOnly?: boolean;
}

export default function FillInTheBlankQuestion({
	questionId,

	correctAnswer,
	value = "",
	mode = "exam",
	onAnswerChange,
	readOnly = false,
}: FillInTheBlankQuestionProps) {
	const [answer, setAnswer] = useState<string>(value);

	useEffect(() => {
		setAnswer(value);
	}, [value]);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (readOnly) return;

		const newAnswer = event.target.value;
		setAnswer(newAnswer);

		if (onAnswerChange) {
			onAnswerChange(questionId, newAnswer);
		}
	};

	const isReviewMode = mode === "review";
	const isCorrect =
		isReviewMode && correctAnswer
			? answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
			: null;

	const inputClassName = isReviewMode
		? isCorrect === true
			? "border-success bg-success/10"
			: isCorrect === false
				? "border-destructive bg-destructive/10"
				: "border-border bg-muted"
		: "border-input bg-card focus-visible:border-primary focus-visible:ring-primary/20";

	return (
		<div className="space-y-3">
			<div className="grid w-full items-center gap-2">
				<Label
					htmlFor={`input-${questionId}`}
					className="text-sm font-extrabold text-foreground"
				>
					<span aria-hidden="true">✏️</span>
					{isReviewMode ? "Таны хариулт:" : "Хариултаа бичнэ үү:"}
				</Label>

				<div className="relative">
					<Input
						type="text"
						id={`input-${questionId}`}
						placeholder={readOnly ? "" : "Таны хариулт..."}
						value={answer}
						onChange={handleChange}
						readOnly={readOnly}
						disabled={readOnly}
						className={`w-full h-12 sm:h-14 rounded-2xl border-2 px-4 pr-12 text-base sm:text-lg font-bold shadow-[0_3px_0_0_var(--border)] transition-colors focus-visible:ring-4 ${inputClassName} ${
							readOnly ? "cursor-not-allowed" : ""
						}`}
					/>

					{isReviewMode && isCorrect !== null && (
						<div className="absolute right-4 top-1/2 -translate-y-1/2">
							{isCorrect ? (
								<CheckCircle2 className="size-6 text-success" strokeWidth={2.75} />
							) : (
								<XCircle className="size-6 text-destructive" strokeWidth={2.75} />
							)}
						</div>
					)}
				</div>

				{isReviewMode && isCorrect === false && correctAnswer && (
					<div className="p-3 bg-success/10 border-2 border-success rounded-2xl animate-pop-in">
						<p className="text-sm font-semibold text-foreground">
							<span className="font-extrabold text-success">Зөв хариулт:</span>{" "}
							{correctAnswer}
						</p>
					</div>
				)}

				{isReviewMode && isCorrect === true && (
					<div className="p-3 bg-success/10 border-2 border-success rounded-2xl animate-pop-in">
						<p className="text-sm text-success font-extrabold">✓ Зөв хариулт!</p>
					</div>
				)}
			</div>
		</div>
	);
}
