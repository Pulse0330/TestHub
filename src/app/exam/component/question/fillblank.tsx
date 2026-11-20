"use client";

import { AlertCircle } from "lucide-react";
import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Бичиж дууссанаас хойш хариултыг parent руу илгээх хугацаа (ms). */
const DRAFT_DELAY = 600;

interface FillInTheBlankQuestionProps {
	questionId: number;
	questionText: string;
	value?: string;
	onAnswerChange?: (questionId: number, answerText: string) => void;
	readOnly?: boolean;
	showValidation?: boolean;
}

/**
 * Нөхөх асуулт. Бичсэн текст debounce-оор автоматаар илгээгдэнэ; blur,
 * Enter болон unmount (асуулт солих) үед шууд илгээнэ. Хоосолж болно.
 */
export default function FillInTheBlankQuestion({
	questionId,
	value = "",
	onAnswerChange,
	readOnly = false,
	showValidation = false,
}: FillInTheBlankQuestionProps) {
	const [answer, setAnswer] = useState<string>(value);
	const draftRef = useRef(value);
	/** Parent-д мэдэгдсэн сүүлийн утга. */
	const lastSentRef = useRef(value);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onAnswerChangeRef = useRef(onAnswerChange);

	useEffect(() => {
		onAnswerChangeRef.current = onAnswerChange;
	}, [onAnswerChange]);

	// Гаднаас (серверээс сэргээх г.м.) утга өөрчлөгдвөл харуулна. Хэрэглэгч
	// илгээгдээгүй текст бичиж байвал түүнийг дарахгүй.
	useEffect(() => {
		if (value === lastSentRef.current) return;
		lastSentRef.current = value;
		if (timerRef.current) return;
		draftRef.current = value;
		setAnswer(value);
	}, [value]);

	const send = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		const next = draftRef.current;
		if (next === lastSentRef.current) return;
		lastSentRef.current = next;
		onAnswerChangeRef.current?.(questionId, next);
	}, [questionId]);

	// Асуулт солиход (unmount) бичсэн текст алдагдахгүй.
	useEffect(() => () => send(), [send]);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (readOnly) return;
		const next = event.target.value;
		setAnswer(next);
		draftRef.current = next;
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(send, DRAFT_DELAY);
	};

	const isEmpty = !answer.trim();
	const isInvalid = showValidation && isEmpty;

	const inputClassName = isInvalid
		? "border-destructive bg-destructive/10"
		: !isEmpty
			? "border-primary/45 bg-primary-soft/40 text-foreground"
			: "border-primary/50 focus-visible:ring-primary/30";

	return (
		<div className="space-y-3">
			<div className="grid w-full items-center gap-2">
				<Label
					htmlFor={`input-${questionId}`}
					className="flex-wrap text-sm font-bold text-foreground"
				>
					Хариултаа бичнэ үү:
					<span className="ml-1 text-xs font-semibold text-muted-foreground">
						(автоматаар хадгалагдана)
					</span>
				</Label>

				<div className="relative">
					<Input
						type="text"
						id={`input-${questionId}`}
						placeholder={readOnly ? "" : "Таны хариулт..."}
						value={answer}
						onChange={handleChange}
						onBlur={send}
						onKeyDown={(e) => {
							if (e.key === "Enter") send();
						}}
						readOnly={readOnly}
						disabled={readOnly}
						autoComplete="off"
						className={`h-12 w-full rounded-xl border-2 text-base font-bold transition-colors ${inputClassName} ${
							readOnly ? "cursor-not-allowed" : ""
						}`}
					/>

					{isInvalid && (
						<div className="absolute right-3 top-1/2 -translate-y-1/2">
							<AlertCircle className="size-5 text-destructive" />
						</div>
					)}
				</div>

				{isInvalid && (
					<div className="rounded-2xl border-2 border-destructive/30 bg-destructive/10 p-3">
						<p className="text-sm font-bold text-destructive">
							⚠ Хариултаа бичнэ үү!
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
