"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import parse from "html-react-parser";
import { CheckCircle2, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface AnswerData {
	answer_id: number;
	answer_name_html?: string;
	answer_img?: string;
	answer_type: number;
	is_true?: boolean;
	refid?: number;
}

interface MultiSelectQuestionProps {
	questionId: number;
	questionText?: string;
	questionImage?: string | null;
	answers: AnswerData[];
	mode: "exam" | "review";
	selectedAnswers?: number[];
	onAnswerChange?: (questionId: number, answerIds: number[]) => void;
	readOnly?: boolean;
}

const isValidImageUrl = (url: string | null | undefined): boolean => {
	if (!url || url.trim() === "") return false;
	return url.startsWith("http") || url.startsWith("/");
};

export default function MultiSelectQuestion({
	questionId,
	questionText,
	questionImage,
	answers,
	mode,
	selectedAnswers: selectedAnswersProp = [],
	onAnswerChange,
	readOnly = false,
}: MultiSelectQuestionProps) {
	const [selectedAnswers, setSelectedAnswers] =
		useState<number[]>(selectedAnswersProp);
	const isReviewMode = mode === "review" || readOnly;
	const prevPropsRef = useRef<number[]>(selectedAnswersProp);

	// ⭐ Remove duplicates based on refid
	const uniqueAnswers = useMemo(() => {
		const seen = new Map<number, AnswerData>();

		answers.forEach((answer) => {
			const key = answer.refid ?? answer.answer_id;
			if (!seen.has(key)) {
				seen.set(key, answer);
			}
		});

		const unique = Array.from(seen.values());

		if (unique.length > 0 && unique[0].refid !== undefined) {
			unique.sort((a, b) => (a.refid ?? 0) - (b.refid ?? 0));
		}

		console.log("=== Multi Select Debug ===");
		console.log("Question ID:", questionId);
		console.log("Total answers:", answers.length);
		console.log("Unique answers:", unique.length);
		console.log("Selected:", selectedAnswers);
		console.log("=========================");

		return unique;
	}, [answers, questionId, selectedAnswers]);

	useEffect(() => {
		const newSelected = Array.isArray(selectedAnswersProp)
			? selectedAnswersProp
			: [];
		const prevSelected = prevPropsRef.current;

		const hasChanged =
			newSelected.length !== prevSelected.length ||
			newSelected.some((id, idx) => id !== prevSelected[idx]);

		if (hasChanged) {
			setSelectedAnswers(newSelected);
			prevPropsRef.current = newSelected;
		}
	}, [selectedAnswersProp]);

	const handleToggle = useCallback(
		(answerId: number, event?: React.MouseEvent) => {
			if (event) {
				const target = event.target as HTMLElement;
				if (target.closest("[data-dialog-trigger]")) return;
			}

			if (isReviewMode) return;

			const newSelected = selectedAnswers.includes(answerId)
				? selectedAnswers.filter((id) => id !== answerId)
				: [...selectedAnswers, answerId];

			setSelectedAnswers(newSelected);

			if (onAnswerChange) {
				onAnswerChange(questionId, newSelected);
			}
		},
		[questionId, selectedAnswers, isReviewMode, onAnswerChange],
	);

	const isSelected = (answerId: number) => selectedAnswers.includes(answerId);

	const renderQuestionContent = () => {
		const imageUrl = isValidImageUrl(questionImage) ? questionImage : null;
		if (!imageUrl) return null;

		return (
			<Dialog>
				<DialogTrigger asChild>
					<button
						type="button"
						className="relative mb-4 w-full cursor-pointer hover:opacity-90 transition-opacity border-2 border-border rounded-2xl overflow-hidden group"
					>
						<Image
							src={imageUrl}
							alt={questionText || "Question"}
							width={800}
							height={300}
							className="w-full h-auto object-contain bg-muted max-h-[300px]"
						/>
						<div className="absolute inset-0 bg-transparent group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
							<span className="flex size-12 items-center justify-center rounded-2xl bg-card text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
								<ZoomIn className="size-6" strokeWidth={2.5} />
							</span>
						</div>
					</button>
				</DialogTrigger>
				<DialogContent className="max-w-[90vw] max-h-[90vh]">
					<VisuallyHidden>
						<DialogTitle>Асуултын зураг</DialogTitle>
					</VisuallyHidden>
					<div className="relative w-full h-[80vh] flex items-center justify-center">
						<Image
							src={imageUrl}
							alt={questionText || "Question"}
							width={1200}
							height={800}
							className="max-w-full max-h-full object-contain"
						/>
					</div>
				</DialogContent>
			</Dialog>
		);
	};

	const renderOptionContent = (option: AnswerData) => {
		const imageUrl = isValidImageUrl(option.answer_img)
			? option.answer_img
			: null;

		if (imageUrl) {
			return (
				<Dialog>
					<DialogTrigger asChild>
						<button
							type="button"
							data-dialog-trigger
							className="cursor-pointer hover:opacity-90 transition-opacity rounded-xl overflow-hidden border-2 border-border bg-card w-full"
							onClick={(e) => e.stopPropagation()}
						>
							<Image
								src={imageUrl}
								alt={option.answer_name_html || "Option"}
								width={400}
								height={150}
								className="w-full h-auto object-contain max-h-[150px]"
							/>
						</button>
					</DialogTrigger>
					<DialogContent className="max-w-[90vw] max-h-[90vh]">
						<VisuallyHidden>
							<DialogTitle>Сонголтын зураг</DialogTitle>
						</VisuallyHidden>
						<div className="space-y-4">
							<div className="relative w-full h-[70vh] flex items-center justify-center">
								<Image
									src={imageUrl}
									alt={option.answer_name_html || "Option"}
									width={1200}
									height={800}
									className="max-w-full max-h-full object-contain"
								/>
							</div>
							{option.answer_name_html && (
								<p className="text-center text-lg font-bold">
									{parse(option.answer_name_html)}
								</p>
							)}
						</div>
					</DialogContent>
				</Dialog>
			);
		}

		return (
			<span className="text-sm sm:text-base font-bold leading-relaxed whitespace-pre-wrap">
				{option.answer_name_html ? parse(option.answer_name_html) : ""}
			</span>
		);
	};

	// ⭐ Check if all selected answers are correct
	const showAnswerFeedback = mode === "exam" && selectedAnswers.length > 0;
	const allCorrect =
		selectedAnswers.length > 0 &&
		selectedAnswers.every(
			(id) => uniqueAnswers.find((a) => a.answer_id === id)?.is_true,
		);

	return (
		<div className="space-y-4">
			{renderQuestionContent()}

			<div className="space-y-2.5 sm:space-y-3">
				<p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs sm:text-sm font-bold text-muted-foreground">
					Олон хариулт сонгох боломжтой
				</p>
				{uniqueAnswers.map((option, optionIndex) => {
					const selected = isSelected(option.answer_id);
					const hasImage = isValidImageUrl(option.answer_img);
					const isCorrect = option.is_true;
					const letter = String.fromCharCode(65 + optionIndex);

					// ⭐ Show correct answers when user finished selecting (optional)
					const shouldHighlight = isReviewMode && isCorrect;

					return (
						<Button
							key={option.answer_id}
							onClick={(e) => handleToggle(option.answer_id, e)}
							variant="outline"
							disabled={isReviewMode}
							className={`group flex items-center gap-3 w-full justify-start text-left h-auto whitespace-normal p-3 sm:p-4 border-2 rounded-2xl font-bold transition-all duration-150 active:translate-y-0.5 active:shadow-none ${
								hasImage ? "min-h-[100px]" : "min-h-[56px]"
							} ${
								selected
									? "border-primary bg-primary/10 text-primary shadow-[0_4px_0_0_var(--primary)] hover:bg-primary/15 hover:text-primary"
									: shouldHighlight
										? "border-success bg-success/10 shadow-[0_4px_0_0_var(--success)]"
										: "border-border bg-card shadow-[0_4px_0_0_var(--border)] hover:border-primary/40 hover:bg-accent/40 hover:-translate-y-0.5"
							} ${isReviewMode ? "cursor-default disabled:opacity-80" : ""}`}
						>
							<span
								className={`size-8 rounded-xl border-2 flex items-center justify-center shrink-0 text-sm font-black transition-colors ${
									hasImage ? "self-start" : ""
								} ${
									selected
										? "border-primary bg-primary text-primary-foreground"
										: shouldHighlight
											? "border-success bg-success text-primary-foreground"
											: "border-border bg-muted text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
								}`}
							>
								{selected || shouldHighlight ? (
									<svg
										className="size-4 text-primary-foreground"
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="3.5"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<title>Checkmark</title>
										<path d="M5 13l4 4L19 7" />
									</svg>
								) : (
									<span aria-hidden="true">{letter}</span>
								)}
							</span>

							<div className="flex-1 min-w-0">{renderOptionContent(option)}</div>

							{/* ⭐ Show correct badge in review mode */}
							{isReviewMode && isCorrect && (
								<span className="text-success font-extrabold text-xs sm:text-sm flex items-center gap-1 shrink-0 rounded-full bg-success/10 px-2.5 py-1">
									<CheckCircle2 className="size-4" strokeWidth={2.75} />
									Зөв
								</span>
							)}
						</Button>
					);
				})}
			</div>

			{/* ⭐ Show feedback below */}
			{showAnswerFeedback && (
				<div className="mt-4 animate-pop-in">
					{allCorrect ? (
						<div className="bg-success/10 border-2 border-success p-3 sm:p-4 rounded-2xl">
							<p className="text-success font-extrabold text-sm sm:text-base flex items-center gap-2">
								<CheckCircle2 className="size-5 shrink-0" strokeWidth={2.75} />
								Таны сонголт хадгалагдсан: {selectedAnswers.length} хариулт
							</p>
						</div>
					) : (
						<div className="bg-pop-violet-soft border-2 border-pop-violet/50 p-3 sm:p-4 rounded-2xl">
							<p className="text-pop-violet-ink font-extrabold text-sm sm:text-base">
								Таны сонголт хадгалагдсан: {selectedAnswers.length} хариулт
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
