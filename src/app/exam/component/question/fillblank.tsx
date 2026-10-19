"use client";

import { AlertCircle, Edit2, Send } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FillInTheBlankQuestionProps {
	questionId: number;
	questionText: string;
	value?: string;
	onAnswerChange?: (questionId: number, answerText: string) => void;
	readOnly?: boolean;
	showValidation?: boolean;
}

export default function FillInTheBlankQuestion({
	questionId,
	value = "",
	onAnswerChange,
	readOnly = false,
	showValidation = false,
}: FillInTheBlankQuestionProps) {
	const [answer, setAnswer] = useState<string>(value);
	const [isSubmitted, setIsSubmitted] = useState<boolean>(!!value);
	const [isEditing, setIsEditing] = useState<boolean>(!value);

	useEffect(() => {
		setAnswer(value);
		if (value) {
			setIsSubmitted(true);
			setIsEditing(false);
		}
	}, [value]);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (readOnly || (isSubmitted && !isEditing)) return;

		const newAnswer = event.target.value;
		setAnswer(newAnswer);
	};

	const handleSubmit = () => {
		if (!answer.trim()) {
			alert("⚠ Хариултаа бичээд дараа нь илгээх товч дарна уу!");
			return;
		}

		setIsSubmitted(true);
		setIsEditing(false);

		// Backend-рүү хадгалах
		if (onAnswerChange) {
			onAnswerChange(questionId, answer);
		}
	};

	const handleEdit = () => {
		setIsEditing(true);
		setIsSubmitted(false);
	};

	const isNotSubmitted = showValidation && !isSubmitted;
	const hasAnswerButNotSubmitted = answer.trim() && !isSubmitted && isEditing;

	const inputClassName = isNotSubmitted
		? "border-destructive bg-destructive/10"
		: hasAnswerButNotSubmitted
			? "border-destructive"
			: isSubmitted && !isEditing
				? "border-primary bg-primary/10 text-primary"
				: "border-primary/50 focus-visible:ring-primary/30";

	const canEdit = !readOnly;
	const showSubmitButton = canEdit && isEditing;
	const showEditButton = canEdit && isSubmitted && !isEditing;

	return (
		<div className="space-y-3">
			<div className="grid w-full items-center gap-2">
				<Label
					htmlFor={`input-${questionId}`}
					className="flex-wrap text-sm font-bold text-foreground"
				>
					Хариултаа бичнэ үү: <span className="text-destructive">*</span>
					<span className="ml-1 text-xs font-semibold text-muted-foreground">
						(Заавал илгээх товч дарна уу)
					</span>
				</Label>

				<div className="flex gap-2">
					<div className="relative flex-1">
						<Input
							type="text"
							id={`input-${questionId}`}
							placeholder={readOnly ? "" : "Таны хариулт..."}
							value={answer}
							onChange={handleChange}
							readOnly={readOnly || (isSubmitted && !isEditing)}
							disabled={readOnly}
							className={`h-12 w-full rounded-xl border-2 text-base font-bold transition-colors ${inputClassName} ${
								readOnly || (isSubmitted && !isEditing)
									? "cursor-not-allowed"
									: ""
							}`}
							onKeyDown={(e) => {
								if (e.key === "Enter" && showSubmitButton) {
									handleSubmit();
								}
							}}
						/>

						{isNotSubmitted && (
							<div className="absolute right-3 top-1/2 -translate-y-1/2">
								<AlertCircle className="size-5 text-destructive" />
							</div>
						)}
					</div>

					{showSubmitButton && (
						<Button
							onClick={handleSubmit}
							size="icon-lg"
							className="rounded-xl"
							title="Илгээх"
							disabled={!answer.trim()}
						>
							<Send className="w-4 h-4" />
						</Button>
					)}

					{showEditButton && (
						<Button
							onClick={handleEdit}
							size="icon-lg"
							variant="outline"
							className="rounded-xl text-primary hover:text-primary"
							title="Засах"
						>
							<Edit2 className="w-4 h-4" />
						</Button>
					)}
				</div>

				{isNotSubmitted && (
					<div className="rounded-2xl border-2 border-destructive/30 bg-destructive/10 p-3">
						<p className="text-sm font-bold text-destructive">
							⚠ Хариултаа заавал илгээх шаардлагатай!
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
