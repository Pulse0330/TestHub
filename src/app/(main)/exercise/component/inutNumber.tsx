import type React from "react";
import { Button } from "@/components/ui/button";

interface Answer {
	answer_id: number;
	question_id: number;
	answer_name: string;
	answer_name_html: string;
	answer_descr: string;
	answer_img?: string;
	answer_type: number;
	refid: number;
	ref_child_id: number | null;
	is_true: boolean;
}

interface NumberInputQuestionProps {
	questionId: number;
	answers: Answer[];
	userAnswers: Record<number, number | string>;
	onAnswerChange: (answers: Record<number, number | string>) => void;
	showResults?: boolean;
	onRestart?: () => void;
}

const NumberInputQuestion: React.FC<NumberInputQuestionProps> = ({
	answers,
	userAnswers,
	onAnswerChange,
	showResults = false,
	onRestart,
}) => {
	const handleInputChange = (answerId: number, value: string) => {
		// Allow numbers, decimal point, and negative sign
		const numericValue = value.replace(/[^0-9.-]/g, "");
		const parsedValue = numericValue === "" ? "" : numericValue;

		const updatedAnswers = {
			...userAnswers,
			[answerId]: parsedValue,
		};

		onAnswerChange(updatedAnswers);
	};

	const handleReset = () => {
		// Clear all answers by creating empty object with only answer IDs
		const emptyAnswers: Record<number, number | string> = {};
		answers.forEach((answer) => {
			emptyAnswers[answer.answer_id] = "";
		});
		onAnswerChange(emptyAnswers);
	};

	const handleRestart = () => {
		// Reset everything and call onRestart callback
		handleReset();
		if (onRestart) {
			onRestart();
		}
	};

	const isCorrect = (answer: Answer): boolean => {
		const userValue = String(userAnswers[answer.answer_id] || "").trim();
		const correctValue = String(answer.answer_name_html || "").trim();

		if (!userValue) return false;

		// Compare as numbers to handle "2.0" vs "2"
		const userNum = parseFloat(userValue);
		const correctNum = parseFloat(correctValue);

		return (
			!Number.isNaN(userNum) &&
			!Number.isNaN(correctNum) &&
			Math.abs(userNum - correctNum) < 0.0001
		);
	};

	const getInputBorderClass = (answer: Answer): string => {
		if (!showResults) {
			return "border-input";
		}

		const userValue = userAnswers[answer.answer_id];
		if (!userValue && userValue !== 0) {
			return "border-input";
		}

		return isCorrect(answer)
			? "border-success bg-success/10 text-success"
			: "border-destructive bg-destructive/10 text-destructive";
	};

	const getResultIcon = (answer: Answer) => {
		if (!showResults) return null;

		const userValue = userAnswers[answer.answer_id];
		if (!userValue && userValue !== 0) return null;

		return isCorrect(answer) ? (
			<div className="shrink-0 flex size-8 items-center justify-center rounded-xl bg-success text-primary-foreground text-sm font-black animate-pop-in">
				✓
			</div>
		) : (
			<div className="shrink-0 flex size-8 items-center justify-center rounded-xl bg-destructive text-primary-foreground text-sm font-black animate-pop-in">
				✗
			</div>
		);
	};

	return (
		<div className="space-y-3">
			<div className="grid gap-2.5">
				{answers.map((answer) => (
					<div
						key={answer.answer_id}
						className="flex flex-wrap items-center gap-2.5 sm:gap-3 p-3 bg-card border-2 border-border rounded-2xl shadow-[0_4px_0_0_var(--border)]"
					>
						{/* Variable Label */}
						<div className="shrink-0">
							<div className="min-w-10 h-10 px-2 rounded-xl bg-pop-sun-soft border-2 border-pop-sun/50 flex items-center justify-center">
								<span className="text-pop-sun-ink font-black text-base">
									{answer.answer_name || "?"}
								</span>
							</div>
						</div>

						{/* Equals sign */}
						<div className="shrink-0 text-muted-foreground font-black text-lg">
							=
						</div>

						{/* Input field */}
						<div className="flex-1 min-w-[6rem]">
							<input
								id={`input-${answer.answer_id}`}
								type="text"
								inputMode="decimal"
								value={userAnswers[answer.answer_id] ?? ""}
								onChange={(e) =>
									handleInputChange(answer.answer_id, e.target.value)
								}
								placeholder="..."
								disabled={showResults}
								className={`w-full h-11 px-4 text-base font-bold border-2 rounded-xl
									focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20
									bg-background text-foreground
									placeholder:text-muted-foreground
									disabled:opacity-90 disabled:cursor-not-allowed
									${getInputBorderClass(answer)}`}
							/>
						</div>

						{/* Result Icon */}
						{getResultIcon(answer)}

						{/* Show correct answer if results are shown and answer is wrong */}
						{showResults &&
							userAnswers[answer.answer_id] &&
							!isCorrect(answer) && (
								<div className="shrink-0 rounded-full bg-success/10 px-3 py-1 text-xs text-success font-extrabold">
									→ {answer.answer_name_html}
								</div>
							)}
					</div>
				))}
			</div>

			{/* Show all correct answers when results are displayed */}

			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="text-xs font-semibold text-muted-foreground">
					Бүх хувьсагчдын утгыг оруулна уу. Бутархай тоо бол цэг (.) ашиглана.
				</div>

				{showResults && onRestart ? (
					<Button onClick={handleRestart} size="sm">
						Дахин оролдох
					</Button>
				) : (
					!showResults &&
					Object.keys(userAnswers).some(
						(key) => userAnswers[Number(key)] !== "",
					) && (
						<Button onClick={handleReset} variant="outline" size="sm">
							Арилгах
						</Button>
					)
				)}
			</div>
		</div>
	);
};

export default NumberInputQuestion;
