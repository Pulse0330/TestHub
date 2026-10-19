"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import parse from "html-react-parser";
import { ZoomIn } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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

	// ✅ Use ref to track previous prop value
	const prevPropsRef = useRef<number[]>(selectedAnswersProp);

	// ✅ Fixed: Sync with props without causing infinite loop
	useEffect(() => {
		const newSelected = Array.isArray(selectedAnswersProp)
			? selectedAnswersProp
			: [];
		const prevSelected = prevPropsRef.current;

		// Only update if props actually changed (compare sorted arrays)
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
			// Dialog trigger дарахад checkbox toggle хийхгүй
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

	// Асуултын зураг render
	const renderQuestionContent = () => {
		const imageUrl = isValidImageUrl(questionImage) ? questionImage : null;
		if (!imageUrl) return null;

		return (
			<Dialog>
				<DialogTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						className="group relative mb-4 h-auto w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-border bg-muted p-0 transition-opacity hover:opacity-90"
					>
						<Image
							src={imageUrl}
							alt={questionText || "Question"}
							width={800}
							height={300}
							className="h-auto max-h-[300px] w-full bg-muted object-contain"
						/>
						<div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/10">
							<span className="flex size-12 items-center justify-center rounded-2xl bg-card text-foreground opacity-0 shadow-[0_4px_0_0_var(--border)] transition-opacity group-hover:opacity-100">
								<ZoomIn className="size-6" />
							</span>
						</div>
					</Button>
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

	// Сонголт render
	const renderOptionContent = (option: AnswerData) => {
		const imageUrl = isValidImageUrl(option.answer_img)
			? option.answer_img
			: null;

		if (imageUrl) {
			return (
				<Dialog>
					<DialogTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							data-dialog-trigger
							className="h-auto w-full cursor-pointer overflow-hidden rounded-xl border-2 border-border bg-card p-0 transition-opacity hover:opacity-90"
							onClick={(e) => e.stopPropagation()}
						>
							<Image
								src={imageUrl}
								alt={option.answer_name_html || "Option"}
								width={400}
								height={150}
								className="w-full h-auto object-contain max-h-[150px]"
							/>
						</Button>
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
			<span className="whitespace-pre-wrap text-sm leading-relaxed sm:text-base">
				{option.answer_name_html ? parse(option.answer_name_html) : ""}
			</span>
		);
	};

	return (
		<div className="space-y-4">
			{renderQuestionContent()}

			<div className="space-y-2.5 sm:space-y-3">
				<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
					Олон хариулт сонгох боломжтой
				</p>
				{answers.map((option, idx) => {
					const selected = isSelected(option.answer_id);
					const hasImage = isValidImageUrl(option.answer_img);

					return (
						<Button
							key={option.answer_id}
							onClick={(e) => handleToggle(option.answer_id, e)}
							variant="outline"
							disabled={isReviewMode}
							className={`flex h-auto w-full items-center justify-start gap-3 whitespace-normal rounded-2xl border-2 p-3.5 text-left font-bold transition-all sm:p-4 ${
								hasImage ? "min-h-[100px]" : "min-h-[56px]"
							} ${
								selected
									? "border-primary bg-primary/10 text-primary shadow-[0_4px_0_0_var(--primary)] hover:bg-primary/15 hover:text-primary"
									: "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40"
							} ${isReviewMode ? "cursor-default opacity-70" : ""}`}
						>
							<span
								className={`flex size-8 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black transition-all ${
									hasImage ? "self-start" : ""
								} ${
									selected
										? "border-primary bg-primary text-primary-foreground"
										: "border-border bg-muted text-muted-foreground"
								}`}
							>
								{selected ? (
									<svg
										className="size-4 text-primary-foreground"
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="3"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<title>Checkmark</title>
										<path d="M5 13l4 4L19 7" />
									</svg>
								) : (
									String.fromCharCode(65 + idx)
								)}
							</span>

							<div className="min-w-0 flex-1">{renderOptionContent(option)}</div>
						</Button>
					);
				})}
			</div>

			{selectedAnswers.length > 0 && (
				<div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
					{selectedAnswers.length} сонголт сонгосон
				</div>
			)}
		</div>
	);
}
