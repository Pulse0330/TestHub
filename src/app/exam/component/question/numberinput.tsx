import type React from "react";
import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import type { AnswerValue } from "@/types/exam/exam";

interface AnswerData {
	answer_id: number;
	answer_name?: string;
	answer_name_html?: string;
	source_img?: string;
}

interface NumberInputQuestionProps {
	questionId: number;
	questionText?: string;
	answers: AnswerData[];
	selectedValues?: Record<number, string>;
	onAnswerChange?: (questionId: number, values: AnswerValue) => void;
}

const NumberInputQuestion: React.FC<NumberInputQuestionProps> = ({
	questionId,
	answers,
	selectedValues = {},
	onAnswerChange,
}) => {
	const values = useMemo(() => {
		const result: Record<number, string> = {};
		answers.forEach((ans) => {
			result[ans.answer_id] = selectedValues[ans.answer_id] || "";
		});
		return result;
	}, [selectedValues, answers]);

	const handleChange = useCallback(
		(answerId: number, val: string) => {
			if (!/^-?\d*\.?\d*$/.test(val)) return;
			const newValues = { ...values, [answerId]: val };
			onAnswerChange?.(questionId, newValues);
		},
		[questionId, values, onAnswerChange],
	);

	return (
		<div className="space-y-3">
			<div className="flex flex-col gap-2.5">
				{answers.map((ans, idx) => {
					// Use answer_name if available, otherwise use alphabetic label
					const label = ans.answer_name
						? `${ans.answer_name}=`
						: `${String.fromCharCode(97 + idx)}=`;

					return (
						<div
							key={ans.answer_id}
							className="flex items-center gap-3 rounded-2xl border-2 border-border bg-muted/50 p-2.5 sm:p-3"
						>
							<label
								htmlFor={`number-input-${ans.answer_id}`}
								className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-card px-2.5 text-sm font-black text-primary"
							>
								{label}
							</label>
							<Input
								id={`number-input-${ans.answer_id}`}
								type="text"
								inputMode="numeric"
								value={values[ans.answer_id]}
								onChange={(e) => handleChange(ans.answer_id, e.target.value)}
								placeholder=""
								className="h-11 max-w-xs rounded-xl border-2 bg-card text-base font-bold tabular-nums"
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default NumberInputQuestion;
