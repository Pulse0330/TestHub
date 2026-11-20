"use client";

import { AlertCircle, CheckCircle, MinusCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { memo } from "react";
import { SourceBlock } from "@/app/exam/component/examUtils/sourceCard";
import { MathContent } from "@/components/MathContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types/exam/examResultMore";
import { type AnswerStatus, getQuestionTypeLabel } from "./scoring";

interface QuestionPromptProps {
	question: Question;
	index: number;
	answerStatus: AnswerStatus;
	earnedPoints: number;
	showSourceBlock: boolean;
}

/** Нээгдсэн картын дээд хэсэг: дугаар, төрөл, үнэлгээ, асуултын агуулга. */
export const QuestionPrompt = memo(function QuestionPrompt({
	question,
	index,
	answerStatus,
	earnedPoints,
	showSourceBlock,
}: QuestionPromptProps) {
	return (
		<div className="mb-6 flex items-start gap-3 md:gap-4">
			<Button
				size={"icon-lg"}
				variant={"outline"}
				disabled
				className="shrink-0 rounded-2xl border-2 border-pop-violet bg-pop-violet-soft text-lg font-black text-pop-violet-ink disabled:opacity-100"
			>
				{index + 1}
			</Button>
			<div className="flex-1">
				<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
					<div>
						<Badge
							variant={"sky"}
							className="mr-2 rounded-full px-3 py-1 text-sm font-bold"
						>
							{getQuestionTypeLabel(question.que_type_id)}
						</Badge>

						<span className="text-muted-foreground">
							Нийт: {question.que_onoo} оноо
						</span>
					</div>
					<Button
						size={"lg"}
						variant={"outline"}
						className={`h-auto min-h-10 gap-2 whitespace-normal rounded-xl border-2 px-3 py-2 text-sm font-extrabold ${
							answerStatus === "correct"
								? "border-success bg-success/10 text-success hover:bg-success/15 hover:text-success"
								: answerStatus === "incorrect"
									? "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive"
									: answerStatus === "partial"
										? "border-pop-sun bg-pop-sun-soft text-pop-sun-ink hover:bg-pop-sun-soft hover:text-pop-sun-ink"
										: "border-border bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground"
						}`}
					>
						{answerStatus === "unanswered" || answerStatus === "pending" ? (
							<>
								{/* Задгай даалгавар багш үнэлээгүй эсэхийг шалгах */}
								{answerStatus === "pending" ? (
									<>
										<MinusCircle className="w-5 h-5 text-pop-sun-ink" />
										<span>Багшийн үнэлгээ хүлээгдэж байна</span>
										<div className="ml-1 rounded-lg bg-foreground/10 px-2 py-0.5 font-black">
											-/{question.que_onoo}
										</div>
									</>
								) : (
									<>
										<AlertCircle className="w-5 h-5" />
										<span>Хариулаагүй</span>
										<div className="ml-1 rounded-lg bg-foreground/10 px-2 py-0.5 font-black">
											0/{question.que_onoo}
										</div>
									</>
								)}
							</>
						) : answerStatus === "correct" ? (
							<>
								<CheckCircle className="w-5 h-5" />
								<span>Зөв хариулсан</span>
								<div className="ml-1 rounded-lg bg-foreground/10 px-2 py-0.5 font-black">
									{earnedPoints}/{question.que_onoo}
								</div>
							</>
						) : answerStatus === "partial" ? (
							<>
								<MinusCircle className="w-5 h-5" />
								<span>Дутуу хариулсан</span>
								<div className="ml-1 rounded-lg bg-foreground/10 px-2 py-0.5 font-black">
									{earnedPoints}/{question.que_onoo}
								</div>
							</>
						) : (
							<>
								<XCircle className="w-5 h-5" />
								<span>Буруу хариулсан</span>
								<div className="ml-1 rounded-lg bg-foreground/10 px-2 py-0.5 font-black">
									0/{question.que_onoo}
								</div>
							</>
						)}
					</Button>
				</div>
				<div className="text-base font-semibold md:text-lg">
					{/* 1. Асуултын үндсэн текст */}
					{question.question_name && question.question_name.trim() !== "" && (
						<div className="mb-3">
							<MathContent html={question.question_name} />
						</div>
					)}

					{/* 2. source_name - Эх бичвэр */}
					{showSourceBlock && (question.source_name || question.source_img) && (
						<SourceBlock
							sourceName={question.source_name}
							sourceImg={question.source_img}
						/>
					)}

					{/* 2. Асуултын зураг */}
					{question.question_img && question.question_img.trim() !== "" && (
						<div className="mb-3">
							<Image
								src={question.question_img}
								alt="Question Image"
								width={500}
								height={350}
								className="rounded-2xl border-2 border-border"
								onError={(e) => {
									e.currentTarget.style.display = "none";
								}}
								unoptimized // Хэрэв external domain бол
							/>
						</div>
					)}

					{/* 3. Source HTML (дуу, материал гэх мэт) */}
					{question.is_src > 0 &&
						question.source_html &&
						question.source_html.trim() !== "" && (
							<div className="mt-4 p-4 ">
								<div className="flex items-start gap-3 mb-2">
									<div className="flex-1">
										<div className="rounded-2xl bg-muted p-3 text-base leading-relaxed text-foreground">
											<MathContent html={question.source_html} />
										</div>
									</div>
								</div>
							</div>
						)}

					{/* 4. Source зураг (хэрэв байвал) */}
					{question.source_img && question.source_img.trim() !== "" && (
						<div className="mt-3">
							<Image
								src={question.source_img}
								alt="Source Image"
								width={500}
								height={350}
								className="rounded-2xl border-2 border-border"
							/>
						</div>
					)}

					{/* 5. Хоосон тохиолдол */}
					{!question.question_name?.trim() &&
						!question.question_img?.trim() &&
						(!question.is_src || !question.source_html?.trim()) &&
						!question.source_img?.trim() && (
							<span className="text-muted-foreground italic">
								Асуулт байхгүй
							</span>
						)}
				</div>
			</div>
		</div>
	);
});
