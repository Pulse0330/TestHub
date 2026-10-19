"use client";

import { useQuery } from "@tanstack/react-query";
import parse from "html-react-parser";
import {
	AlertCircle,
	CheckCircle,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsDownUp,
	ChevronsUpDown,
	MinusCircle,
	X,
	XCircle,
	Zap,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import UseAnimations from "react-useanimations";
import loading2 from "react-useanimations/lib/loading2";
import StyledBackButton from "@/components/backButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getExamDun, getExamResultMore } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ExamDunApiResponse } from "@/types/exam/examDun";
import type {
	Answer,
	ExamResponseMoreApiResponse,
	ExamSummary,
	Question,
	UserAnswer,
} from "@/types/exam/examResultMore";

function ExamResultDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { userId } = useAuthStore();
	const [answerFilter, setAnswerFilter] = useState<
		"all" | "correct" | "wrong" | "unanswered"
	>("all");
	const [openIds, setOpenIds] = useState<Set<number>>(() => new Set());
	const [reviewMode, setReviewMode] = useState(false);
	const [reviewIdx, setReviewIdx] = useState(0);

	const id = params.id as string;
	const [examIdStr, testIdStr] = id?.split("_") || [];
	const examId = Number(examIdStr);
	const testId = Number(testIdStr);

	const { data, isLoading, isError, error } =
		useQuery<ExamResponseMoreApiResponse>({
			queryKey: ["examResultDetail", testId, examId, userId],
			queryFn: () => getExamResultMore(testId, examId, userId || 0),
			enabled: !!userId && !!examId && !!testId,
		});
	const pointPerc = data?.RetDataFirst?.[0]?.point_perc;

	const { data: dunData, isLoading: isLoadingDun } =
		useQuery<ExamDunApiResponse>({
			queryKey: ["examDun", pointPerc],
			queryFn: () => getExamDun(pointPerc ?? 0),
			enabled: typeof pointPerc === "number",
		});

	const _isLoadingAll = isLoading || isLoadingDun;
	const safeParse = (html: string | null | undefined) => {
		if (!html || typeof html !== "string" || html.trim() === "") return "";
		try {
			return parse(html);
		} catch {
			return html;
		}
	};

	const getQuestionTypeLabel = (typeId: number) => {
		const types: Record<number, string> = {
			1: "Нэг сонголттой",
			2: "Олон сонголттой",
			3: "Тоо оруулах",
			4: "Задгай даалгавар",
			5: "Дараалал",
			6: "Харгалзуулах",
		};
		return types[typeId] || "Бусад";
	};

	const calculatePartialPoints = (
		question: Question,
		questionAnswers: Answer[],
		userSelectedAnswers: UserAnswer[],
	): number => {
		if (userSelectedAnswers.length === 0) return 0;
		if (question.que_type_id === 4) {
			// Багш үнэлсэн бол түүний өгсөн оноог буцаах
			return question.unelsen === 1 ? question.zad_onoo || 0 : 0;
		}

		if (question.que_type_id === 2) {
			const correctAnswers = questionAnswers.filter((a) => a.is_true === 1);
			const totalCorrect = correctAnswers.length;
			if (totalCorrect === 0) return 0;

			// Хэрэв truecnt-ээс илүү хариулт сонговол шууд 0 оноо
			if (userSelectedAnswers.length > question.truecnt) {
				return 0;
			}

			const correctSelected = userSelectedAnswers.filter((ua) =>
				correctAnswers.some((ca) => ca.answer_id === ua.answer_id),
			).length;

			const incorrectSelected = userSelectedAnswers.filter(
				(ua) => !correctAnswers.some((ca) => ca.answer_id === ua.answer_id),
			).length;

			// Хэрэв буруу хариулт сонговол penalty-тэй
			const basePoints = (correctSelected / totalCorrect) * question.que_onoo;
			const penalty = (incorrectSelected / totalCorrect) * question.que_onoo;

			return Math.max(0, Math.round((basePoints - penalty) * 10) / 10);
		}

		if (question.que_type_id === 3) {
			let correctInputs = 0;
			let incorrectInputs = 0;

			questionAnswers.forEach((answer) => {
				const userInput = userSelectedAnswers.find(
					(ua) => ua.answer_id === answer.answer_id,
				);

				if (userInput) {
					const correctAnswer = answer.answer_name_html || answer.answer_name;

					if (userInput.answer === correctAnswer) {
						correctInputs++;
					} else {
						incorrectInputs++;
					}
				}
			});

			const basePoints =
				(correctInputs / questionAnswers.length) * question.que_onoo;
			const penalty =
				(incorrectInputs / questionAnswers.length) * question.que_onoo;

			return Math.max(0, Math.round((basePoints - penalty) * 10) / 10);
		}

		if (question.que_type_id === 5) {
			let correctOrders = 0;

			questionAnswers.forEach((answer) => {
				const userInput = userSelectedAnswers.find(
					(ua) => ua.answer_id === answer.answer_id,
				);

				if (userInput) {
					if (parseInt(userInput.answer, 10) === answer.refid) {
						correctOrders++;
					}
				}
			});

			// ✅ PENALTY БАЙХГҮЙ - зөвхөн зөв тооноос оноо тооцно
			const points =
				(correctOrders / questionAnswers.length) * question.que_onoo;
			return Math.round(points * 10) / 10;
		}
		if (question.que_type_id === 6) {
			const questionsOnly = questionAnswers.filter(
				(a) => a.ref_child_id === -1,
			);
			const answersOnly = questionAnswers.filter(
				(a) => a.ref_child_id && a.ref_child_id >= 1,
			);

			if (answersOnly.length === 0) return 0;

			let correctMatches = 0;

			answersOnly.forEach((answerItem) => {
				const correctQuestion = questionsOnly.find(
					(q) => q.refid === answerItem.ref_child_id,
				);

				if (!correctQuestion) return;

				const userInput = userSelectedAnswers.find(
					(ua) => ua.answer_id === answerItem.answer_id,
				);

				if (userInput) {
					const userSelectedRefId = parseInt(userInput.answer, 10);
					if (userSelectedRefId === correctQuestion.refid) {
						correctMatches++;
					}
				}
			});

			// ✅ PENALTY БАЙХГҮЙ - зөвхөн зөв тооноос оноо тооцно
			const points = (correctMatches / answersOnly.length) * question.que_onoo;
			return Math.round(points * 10) / 10;
		}

		return 0;
	};

	const getAnswerStatus = (
		isFullyCorrect: boolean | undefined,
		_partialPoints: number,
		userSelectedAnswers: UserAnswer[],
		questionAnswers: Answer[],
		question: Question,
	): "unanswered" | "correct" | "partial" | "incorrect" => {
		// 1. БҮГДЭД хариулаагүй
		if (userSelectedAnswers.length === 0) return "unanswered";

		// 2. ЗАДГАЙ ДААЛГАВАР - багшийн үнэлгээнээс хамаарна
		if (question.que_type_id === 4) {
			if (question.unelsen === 1) {
				// Багш үнэлсэн
				if (question.zad_onoo === question.que_onoo) {
					return "correct"; // Бүтэн оноо авсан
				} else if (question.zad_onoo > 0) {
					return "partial"; // Хэсэгчлэн оноо авсан
				} else {
					return "incorrect"; // 0 оноо авсан
				}
			} else {
				// Багш үнэлээгүй - "хариулаагүй" статус (filter дээр харагдахгүй байхын тулд)
				return "unanswered";
			}
		}

		// 3. Бүгдэд зөв хариулсан
		if (isFullyCorrect === true) return "correct";

		// 4. Хэсэгчилсэн хариулт шалгах
		const answerCheck = (() => {
			if (question.que_type_id === 2) {
				const correctAnswers = questionAnswers.filter((a) => a.is_true === 1);
				const totalRequired = correctAnswers.length;

				const correctSelected = userSelectedAnswers.filter((ua) =>
					correctAnswers.some((ca) => ca.answer_id === ua.answer_id),
				).length;

				const totalAnswered = userSelectedAnswers.length;

				return {
					hasCorrect: correctSelected > 0,
					hasUnanswered: totalAnswered < totalRequired,
					allAnswered: totalAnswered >= totalRequired,
				};
			}

			if (question.que_type_id === 3) {
				let correctCount = 0;
				let answeredCount = 0;

				questionAnswers.forEach((answer) => {
					const userInput = userSelectedAnswers.find(
						(ua) => ua.answer_id === answer.answer_id,
					);
					if (userInput) {
						answeredCount++;
						const correctAnswer = answer.answer_name_html || answer.answer_name;
						if (userInput.answer === correctAnswer) {
							correctCount++;
						}
					}
				});

				return {
					hasCorrect: correctCount > 0,
					hasUnanswered: answeredCount < questionAnswers.length,
					allAnswered: answeredCount === questionAnswers.length,
				};
			}

			if (question.que_type_id === 5) {
				let correctCount = 0;
				let answeredCount = 0;

				questionAnswers.forEach((answer) => {
					const userInput = userSelectedAnswers.find(
						(ua) => ua.answer_id === answer.answer_id,
					);
					if (userInput) {
						answeredCount++;
						if (parseInt(userInput.answer, 10) === answer.refid) {
							correctCount++;
						}
					}
				});

				return {
					hasCorrect: correctCount > 0,
					hasUnanswered: answeredCount < questionAnswers.length,
					allAnswered: answeredCount === questionAnswers.length,
				};
			}

			if (question.que_type_id === 6) {
				const answersOnly = questionAnswers.filter(
					(a) => a.ref_child_id && a.ref_child_id >= 1,
				);

				let correctCount = 0;
				let answeredCount = 0;

				answersOnly.forEach((answerItem) => {
					const userInput = userSelectedAnswers.find(
						(ua) => ua.answer_id === answerItem.answer_id,
					);
					if (userInput) {
						answeredCount++;
						if (parseInt(userInput.answer, 10) === answerItem.ref_child_id) {
							correctCount++;
						}
					}
				});

				return {
					hasCorrect: correctCount > 0,
					hasUnanswered: answeredCount < answersOnly.length,
					allAnswered: answeredCount === answersOnly.length,
				};
			}

			return { hasCorrect: false, hasUnanswered: false, allAnswered: true };
		})();

		// 5. Дутуу хариулсан (зарим хариулаагүй эсвэл зарим зөв)
		if (
			answerCheck.hasUnanswered ||
			(answerCheck.hasCorrect && !isFullyCorrect)
		) {
			return "partial";
		}

		// 6. Бүгдэд хариулсан гэхдээ бүгд буруу
		return "incorrect";
	};

	if (!userId) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center p-4">
				<div className="card-pop animate-pop-in max-w-md space-y-4 p-8 text-center">
					<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-pop-sun-soft">
						<AlertCircle className="size-10 text-pop-sun-ink" />
					</div>
					<div>
						<h3 className="mb-2 text-2xl font-black">
							Хэрэглэгч нэвтрээгүй байна
						</h3>
						<p className="text-muted-foreground">
							Та эхлээд системд нэвтэрнэ үү
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="flex flex-col items-center space-y-6">
					<div className="relative">
						<div className="absolute inset-0 rounded-full bg-primary/15 animate-pulse" />
						<UseAnimations
							animation={loading2}
							size={80}
							strokeColor="var(--primary)"
							loop
						/>
					</div>
					<div className="space-y-2 text-center">
						<p className="text-xl font-black animate-pulse">
							Ачааллаж байна...
						</p>
						<p className="text-sm text-muted-foreground">
							Шалгалтын дэлгэрэнгүй мэдээллийг уншиж байна
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center p-4">
				<div className="card-pop animate-pop-in w-full max-w-md space-y-4 p-8 text-center">
					<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-destructive/15">
						<AlertCircle className="w-10 h-10 text-destructive" />
					</div>
					<h3 className="text-2xl font-black text-destructive">Алдаа гарлаа</h3>
					<p className="text-sm text-destructive/80">
						{(error as Error).message}
					</p>
					<Button onClick={() => router.back()}>Буцах</Button>
				</div>
			</div>
		);
	}

	if (!data?.RetResponse?.ResponseType || !data?.RetDataSecond) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center p-4">
				<div className="card-pop animate-pop-in max-w-md space-y-6 p-8 text-center">
					<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-pop-sun-soft">
						<AlertCircle className="size-10 text-pop-sun-ink" />
					</div>
					<h3 className="text-2xl font-black">Мэдээлэл олдсонгүй</h3>
					<p className="text-muted-foreground">
						{data?.RetResponse?.ResponseMessage ||
							"Шалгалтын дэлгэрэнгүй мэдээлэл олдсонгүй"}
					</p>
					<Button onClick={() => router.back()}>Буцах</Button>
				</div>
			</div>
		);
	}

	const examSummary: ExamSummary | undefined = data.RetDataFirst?.[0];
	const questions: Question[] = data.RetDataSecond;
	const answers: Answer[] = data.RetDataThirt;
	const userAnswers: UserAnswer[] = data.RetDataFourth;

	const dunInfo = dunData?.RetData?.[0];
	const getQuestionPreview = (html?: string | null) =>
		(html || "")
			.replace(/<[^>]*>/g, " ")
			.replace(/&nbsp;/g, " ")
			.replace(/\\[()[\]]/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	const toggleOpen = (qid: number) =>
		setOpenIds((prev) => {
			const next = new Set(prev);
			if (next.has(qid)) next.delete(qid);
			else next.add(qid);
			return next;
		});
	const questionEntries = (questions || []).map((question, index) => {
		const questionAnswers =
			answers?.filter(
				(answer) => answer.exam_que_id === question.exam_que_id,
			) || [];

		const userSelectedAnswers =
			userAnswers?.filter((ua) => ua.exam_que_id === question.exam_que_id) ||
			[];

		const isQuestionCorrect = (() => {
			if (userSelectedAnswers.length === 0) return false;

			if (question.que_type_id === 1) {
				// Single choice
				const correctAnswer = questionAnswers.find(
					(a: Answer) => a.is_true === 1,
				);
				const userAnswer = userSelectedAnswers[0];
				return (
					userAnswer &&
					correctAnswer &&
					userAnswer.answer_id === correctAnswer.answer_id
				);
			} else if (question.que_type_id === 2) {
				// Multiple choice
				const correctAnswers = questionAnswers.filter(
					(a: Answer) => a.is_true === 1,
				);
				return (
					correctAnswers.length === userSelectedAnswers.length &&
					correctAnswers.every((ca: Answer) =>
						userSelectedAnswers.some(
							(ua: UserAnswer) => ua.answer_id === ca.answer_id,
						),
					)
				);
			} else if (question.que_type_id === 3) {
				// Number input - Бүх хариулт зөв эсэхийг шалгах
				return questionAnswers.every((answer: Answer) => {
					const userInput = userSelectedAnswers.find(
						(ua: UserAnswer) => ua.answer_id === answer.answer_id,
					);
					if (!userInput) return false;

					const correctAnswer = answer.answer_name_html || answer.answer_name;
					return userInput.answer === correctAnswer;
				});
			} else if (question.que_type_id === 4) {
				// ЗАДГАЙ ДААЛГАВАР - багшийн үнэлгээнээс хамаарна
				if (question.unelsen === 1) {
					// Багш үнэлсэн бол зөв эсэхийг оноогоор нь шалгах
					return question.zad_onoo === question.que_onoo;
				}
				// Багш үнэлээгүй бол false (буюу partial гэж үзнэ)
				return false;
			} else if (question.que_type_id === 5) {
				return questionAnswers.every((answer: Answer) => {
					const userInput = userSelectedAnswers.find(
						(ua: UserAnswer) => ua.answer_id === answer.answer_id,
					);
					if (!userInput) return false;

					// Зөв дараалал нь refid-тай тэнцүү байх ёстой
					return parseInt(userInput.answer, 10) === answer.refid;
				});
			} else if (question.que_type_id === 6) {
				const answersOnly = questionAnswers.filter(
					(a: Answer) => a.ref_child_id && a.ref_child_id >= 1,
				);

				return answersOnly.every((answerItem: Answer) => {
					const userInput = userSelectedAnswers.find(
						(ua: UserAnswer) => ua.answer_id === answerItem.answer_id,
					);
					if (!userInput) return false;

					return parseInt(userInput.answer, 10) === answerItem.ref_child_id;
				});
			}

			return false;
		})();

		return {
			question,
			index,
			questionAnswers,
			userSelectedAnswers,
			isQuestionCorrect,
		};
	});
	type QuestionEntry = (typeof questionEntries)[number];
	const isEntryCorrect = (e: QuestionEntry) =>
		!!e.isQuestionCorrect && e.userSelectedAnswers.length > 0;
	const isEntryWrong = (e: QuestionEntry) =>
		!e.isQuestionCorrect && e.userSelectedAnswers.length > 0;
	const isEntryUnanswered = (e: QuestionEntry) =>
		e.userSelectedAnswers.length === 0;
	const filterCounts = {
		all: questionEntries.length,
		correct: questionEntries.filter(isEntryCorrect).length,
		wrong: questionEntries.filter(isEntryWrong).length,
		unanswered: questionEntries.filter(isEntryUnanswered).length,
	};
	const visibleEntries = questionEntries.filter((e) => {
		if (answerFilter === "correct") return isEntryCorrect(e);
		if (answerFilter === "wrong") return isEntryWrong(e);
		if (answerFilter === "unanswered") return isEntryUnanswered(e);
		return true;
	});
	const wrongEntries = questionEntries.filter(isEntryWrong);
	const safeReviewIdx = Math.min(
		reviewIdx,
		Math.max(0, wrongEntries.length - 1),
	);
	const reviewEntry = wrongEntries[safeReviewIdx];
	const filterOptions: {
		key: "all" | "correct" | "wrong" | "unanswered";
		label: string;
		active: string;
		count: number;
	}[] = [
		{
			key: "all",
			label: "Бүгд",
			active: "border-primary bg-primary text-primary-foreground",
			count: filterCounts.all,
		},
		{
			key: "correct",
			label: "Зөв",
			active: "border-success bg-success text-primary-foreground",
			count: filterCounts.correct,
		},
		{
			key: "wrong",
			label: "Буруу",
			active: "border-destructive bg-destructive text-primary-foreground",
			count: filterCounts.wrong,
		},
		{
			key: "unanswered",
			label: "Хариулаагүй",
			active: "border-foreground/40 bg-muted text-foreground",
			count: filterCounts.unanswered,
		},
	];
	const renderQuestionCard = (
		{
			question,
			index,
			questionAnswers,
			userSelectedAnswers,
			isQuestionCorrect,
		}: QuestionEntry,
		forceOpen = false,
	) => {
		const partialPoints = calculatePartialPoints(
			question,
			questionAnswers,
			userSelectedAnswers,
		);
		const earnedPoints = isQuestionCorrect ? question.que_onoo : partialPoints;
		const answerStatus = getAnswerStatus(
			isQuestionCorrect || false,
			partialPoints,
			userSelectedAnswers,
			questionAnswers,
			question,
		);

		const statusMeta =
			answerStatus === "correct"
				? {
						Icon: CheckCircle,
						label: "Зөв",
						chip: "bg-success/15 text-success",
					}
				: answerStatus === "incorrect"
					? {
							Icon: XCircle,
							label: "Буруу",
							chip: "bg-destructive/10 text-destructive",
						}
					: answerStatus === "partial"
						? {
								Icon: MinusCircle,
								label: "Дутуу",
								chip: "bg-pop-sun-soft text-pop-sun-ink",
							}
						: question.que_type_id === 4 && question.unelsen === 0
							? {
									Icon: MinusCircle,
									label: "Үнэлгээ хүлээгдэж байна",
									chip: "bg-pop-sun-soft text-pop-sun-ink",
								}
							: {
									Icon: AlertCircle,
									label: "Хариулаагүй",
									chip: "bg-muted text-muted-foreground",
								};
		const isOpen = forceOpen || openIds.has(question.exam_que_id);
		return (
			<div
				key={question.exam_que_id}
				id={`q-${question.exam_que_id}`}
				className={`card-pop overflow-hidden scroll-mt-40 transition-colors ${isOpen ? "border-primary/40" : ""}`}
			>
				<button
					type="button"
					onClick={() => toggleOpen(question.exam_que_id)}
					aria-expanded={isOpen}
					className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent/50 md:gap-4 md:p-4"
				>
					<span className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-pop-violet bg-pop-violet-soft text-base font-black text-pop-violet-ink">
						{index + 1}
					</span>
					<span
						className={`flex size-8 shrink-0 items-center justify-center rounded-full ${statusMeta.chip}`}
						title={statusMeta.label}
					>
						<statusMeta.Icon className="size-5" strokeWidth={2.5} />
					</span>
					<span className="min-w-0 flex-1">
						<span className="block truncate text-sm font-bold text-foreground md:text-base">
							{getQuestionPreview(question.question_name) ||
								getQuestionTypeLabel(question.que_type_id)}
						</span>
						<span className="mt-0.5 block text-xs font-semibold text-muted-foreground">
							{getQuestionTypeLabel(question.que_type_id)} · {statusMeta.label}
						</span>
					</span>
					<span
						className={`hidden shrink-0 rounded-lg px-2 py-0.5 text-sm font-black tabular-nums sm:inline-block ${statusMeta.chip}`}
					>
						{answerStatus === "correct" || answerStatus === "partial"
							? earnedPoints
							: answerStatus === "unanswered" &&
									question.que_type_id === 4 &&
									question.unelsen === 0
								? "-"
								: 0}
						/{question.que_onoo}
					</span>
					<ChevronDown
						className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
					/>
				</button>
				{isOpen && (
					<div className="animate-in fade-in-0 slide-in-from-top-1 border-t-2 border-border p-4 duration-200 md:p-6">
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
										{answerStatus === "unanswered" ? (
											<>
												{/* Задгай даалгавар багш үнэлээгүй эсэхийг шалгах */}
												{question.que_type_id === 4 &&
												question.unelsen === 0 ? (
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
									{question.question_name &&
										question.question_name.trim() !== "" && (
											<div className="mb-3">
												{safeParse(question.question_name)}
											</div>
										)}

									{/* 2. Асуултын зураг */}
									{question.question_img &&
										question.question_img.trim() !== "" && (
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
															{safeParse(question.source_html)}
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
						<div className="space-y-4 md:pl-14">
							{question.que_type_id === 1 ? (
								// ========== НЭГ СОНГОЛТТОЙ АСУУЛТ ==========
								questionAnswers.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Хариулт олдсонгүй
									</p>
								) : (
									<div className="space-y-4">
										{/* Бүх хариултууд */}
										<div className="space-y-3">
											{questionAnswers.map((answer, _idx) => {
												const isCorrect = answer.is_true === 1;
												const isUserSelected = userSelectedAnswers.some(
													(ua) => ua.answer_id === answer.answer_id,
												);
												const isWrongSelection = isUserSelected && !isCorrect;

												const hasImage =
													answer.answer_img && answer.answer_img.trim() !== "";
												const hasText =
													(answer.answer_name_html &&
														answer.answer_name_html.trim() !== "") ||
													(answer.answer_name &&
														answer.answer_name.trim() !== "");

												return (
													<div
														key={answer.answer_id}
														className={`relative flex items-center gap-3 rounded-2xl border-2 p-4 font-bold transition-all duration-300 ${
															isWrongSelection
																? "border-destructive bg-destructive/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_35%,transparent)]"
																: isUserSelected
																	? "border-success bg-success/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_35%,transparent)]"
																	: "border-border bg-card"
														}`}
													>
														<div className="flex-1 min-w-0">
															<div className="text-base font-bold leading-relaxed">
																{hasImage && (
																	<Image
																		src={answer.answer_img}
																		alt="Answer"
																		width={300}
																		height={200}
																		className="mt-2 rounded-2xl border-2 border-border"
																	/>
																)}

																{hasText && (
																	<div>
																		{answer.answer_name_html &&
																		answer.answer_name_html.trim() !== ""
																			? safeParse(answer.answer_name_html)
																			: safeParse(answer.answer_name)}
																	</div>
																)}

																{!hasImage && !hasText && "Хариулт байхгүй"}
															</div>
														</div>

														<div className="shrink-0">
															{isUserSelected && isCorrect && (
																<div className="rounded-full bg-success px-3 py-1 text-sm font-extrabold text-primary-foreground">
																	✓ Зөв
																</div>
															)}
															{isWrongSelection && (
																<div className="rounded-full bg-destructive px-3 py-1 text-sm font-extrabold text-primary-foreground">
																	✗ Буруу
																</div>
															)}
															{isUserSelected &&
																!isCorrect &&
																!isWrongSelection && (
																	<div className="rounded-full bg-primary px-3 py-1 text-sm font-extrabold text-primary-foreground">
																		✓ Та сонгосон
																	</div>
																)}
														</div>
													</div>
												);
											})}
										</div>

										{/* Зөв хариулт */}
										{examSummary?.show_true_ans === 1 && (
											<div className="mt-4 rounded-2xl border-2 border-dashed border-success bg-success/5 p-4 md:p-5">
												<p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-success">
													Зөв хариулт:
												</p>
												{questionAnswers
													.filter((answer) => answer.is_true === 1)
													.map((answer) => {
														const hasImage =
															answer.answer_img &&
															answer.answer_img.trim() !== "";
														const hasText =
															(answer.answer_name_html &&
																answer.answer_name_html.trim() !== "") ||
															(answer.answer_name &&
																answer.answer_name.trim() !== "");

														return (
															<div
																key={answer.answer_id}
																className="mb-2 flex items-start gap-3 rounded-xl border-2 border-success/40 bg-card p-3 font-bold"
															>
																<div className="text-base leading-relaxed">
																	{hasImage && (
																		<Image
																			src={answer.answer_img}
																			alt="Correct Answer"
																			width={300}
																			height={200}
																			className="mt-2 rounded-2xl border-2 border-border"
																		/>
																	)}

																	{hasText && (
																		<div>
																			{answer.answer_name_html &&
																			answer.answer_name_html.trim() !== ""
																				? safeParse(answer.answer_name_html)
																				: safeParse(answer.answer_name)}
																		</div>
																	)}

																	{!hasImage && !hasText && "Хариулт байхгүй"}
																</div>
															</div>
														);
													})}
											</div>
										)}
									</div>
								)
							) : question.que_type_id === 2 ? (
								questionAnswers.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Хариулт олдсонгүй
									</p>
								) : (
									<div className="space-y-4">
										{/* 🔥 АНХААРУУЛГА: Хэтэрхий олон хариулт сонгосон бол */}
										{userSelectedAnswers.length > question.truecnt && (
											<div className="flex items-start gap-3 rounded-2xl border-2 border-destructive bg-destructive/10 p-4">
												<div className="shrink-0">
													<svg
														className="w-6 h-6 text-destructive"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<title>Анхааруулга</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
														/>
													</svg>
												</div>
												<div>
													<p className="text-sm font-bold text-destructive">
														Зөвхөн {question.truecnt} хариулт сонгох ёстой
														байсан. Та {userSelectedAnswers.length} хариулт
														сонгосон тул 0 оноо авлаа.
													</p>
												</div>
											</div>
										)}

										{/* Бүх хариултууд */}
										<div className="space-y-3">
											{questionAnswers.map((answer, _idx) => {
												const isCorrect = answer.is_true === 1;
												const isUserSelected = userSelectedAnswers.some(
													(ua) => ua.answer_id === answer.answer_id,
												);
												const isWrongSelection = isUserSelected && !isCorrect;

												const hasImage =
													answer.answer_img && answer.answer_img.trim() !== "";
												const hasText =
													(answer.answer_name_html &&
														answer.answer_name_html.trim() !== "") ||
													(answer.answer_name &&
														answer.answer_name.trim() !== "");

												return (
													<div
														key={answer.answer_id}
														className={`relative flex items-center gap-3 rounded-2xl border-2 p-4 font-bold transition-all duration-300 ${
															isWrongSelection
																? "border-destructive bg-destructive/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_35%,transparent)]"
																: isUserSelected
																	? "border-success bg-success/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_35%,transparent)]"
																	: "border-border bg-card"
														}`}
													>
														<div className="flex-1 min-w-0">
															<div className="text-base font-bold leading-relaxed">
																{hasImage && (
																	<Image
																		src={answer.answer_img}
																		alt="Answer"
																		width={300}
																		height={200}
																		className="mt-2 rounded-2xl border-2 border-border"
																	/>
																)}

																{hasText && (
																	<div>
																		{answer.answer_name_html &&
																		answer.answer_name_html.trim() !== ""
																			? safeParse(answer.answer_name_html)
																			: safeParse(answer.answer_name)}
																	</div>
																)}

																{!hasImage && !hasText && "Хариулт байхгүй"}
															</div>
														</div>

														<div className="shrink-0">
															{isUserSelected && isCorrect && (
																<div className="rounded-full bg-success px-3 py-1 text-sm font-extrabold text-primary-foreground">
																	✓ Зөв
																</div>
															)}
															{isWrongSelection && (
																<div className="rounded-full bg-destructive px-3 py-1 text-sm font-extrabold text-primary-foreground">
																	✗ Буруу
																</div>
															)}
															{isUserSelected &&
																!isCorrect &&
																!isWrongSelection && (
																	<div className="rounded-full bg-primary px-3 py-1 text-sm font-extrabold text-primary-foreground">
																		✓ Та сонгосон
																	</div>
																)}
														</div>
													</div>
												);
											})}
										</div>

										{/* Зөв хариултууд */}
										{examSummary?.show_true_ans === 1 && (
											<div className="mt-4 rounded-2xl border-2 border-dashed border-success bg-success/5 p-4 md:p-5">
												<p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-success">
													Зөв хариултууд ({question.truecnt}):
												</p>
												{questionAnswers
													.filter((answer) => answer.is_true === 1)
													.map((answer) => {
														const hasImage =
															answer.answer_img &&
															answer.answer_img.trim() !== "";
														const hasText =
															(answer.answer_name_html &&
																answer.answer_name_html.trim() !== "") ||
															(answer.answer_name &&
																answer.answer_name.trim() !== "");

														return (
															<div
																key={answer.answer_id}
																className="mb-2 flex items-start gap-3 rounded-xl border-2 border-success/40 bg-card p-3 font-bold"
															>
																<div className="text-base leading-relaxed">
																	{hasImage && (
																		<Image
																			src={answer.answer_img}
																			alt="Correct Answer"
																			width={300}
																			height={200}
																			className="mt-2 rounded-2xl border-2 border-border"
																		/>
																	)}

																	{hasText && (
																		<div>
																			{answer.answer_name_html &&
																			answer.answer_name_html.trim() !== ""
																				? safeParse(answer.answer_name_html)
																				: safeParse(answer.answer_name)}
																		</div>
																	)}

																	{!hasImage && !hasText && "Хариулт байхгүй"}
																</div>
															</div>
														);
													})}
											</div>
										)}
									</div>
								)
							) : question.que_type_id === 3 ? (
								<div className="space-y-4">
									<div className="space-y-3">
										{questionAnswers.map((answer, _idx) => {
											const userInput = userSelectedAnswers.find(
												(ua) => ua.answer_id === answer.answer_id,
											);
											const correctAnswer =
												answer.answer_name_html || answer.answer_name;
											const isCorrect = userInput?.answer === correctAnswer;

											return (
												<div
													key={answer.answer_id}
													className={`relative flex flex-wrap items-center gap-3 rounded-2xl border-2 p-4 transition-all duration-300 ${
														userInput
															? isCorrect
																? "border-success bg-success/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_35%,transparent)]"
																: "border-destructive bg-destructive/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_35%,transparent)]"
															: "border-dashed border-pop-sun bg-pop-sun-soft"
													}`}
												>
													{/* Асуултын label ба зураг */}
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-4">
															{/* answer_name (a, b, c label) */}
															{answer.answer_name &&
																answer.answer_name.trim() !== "" && (
																	<div className="text-base font-extrabold text-muted-foreground">
																		{answer.answer_name} =
																	</div>
																)}

															{/* Хэрэглэгчийн оруулсан хариулт */}
															{userInput ? (
																<div className="flex items-center gap-3">
																	<span className="text-sm text-muted-foreground">
																		Таны хариулт:
																	</span>
																	<span
																		className={`font-bold text-2xl ${
																			isCorrect
																				? "text-success"
																				: "text-destructive"
																		}`}
																	>
																		{userInput.answer}
																	</span>
																</div>
															) : (
																<span className="font-bold text-pop-sun-ink">
																	Хариулаагүй
																</span>
															)}
														</div>
													</div>

													{/* Status Badge */}
													<div className="shrink-0">
														{userInput && isCorrect && (
															<div className="rounded-full bg-success px-3 py-1 text-sm font-extrabold text-primary-foreground">
																✓ Зөв
															</div>
														)}
														{userInput && !isCorrect && (
															<div className="rounded-full bg-destructive px-3 py-1 text-sm font-extrabold text-primary-foreground">
																✗ Буруу
															</div>
														)}
													</div>
												</div>
											);
										})}
									</div>

									{/* Зөв хариултууд */}
									{examSummary?.show_true_ans === 1 && (
										<div className="mt-4 rounded-2xl border-2 border-dashed border-success bg-success/5 p-4 md:p-5">
											<p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-success">
												★ Зөв хариултууд:
											</p>
											<div className="space-y-3">
												{questionAnswers.map((answer) => {
													const correctAnswer =
														answer.answer_name_html || answer.answer_name;
													return (
														<div
															key={answer.answer_id}
															className="flex items-center gap-4"
														>
															<div className="text-base">
																{answer.answer_name &&
																	answer.answer_name.trim() !== "" && (
																		<span className="text-muted-foreground font-semibold mr-2">
																			{answer.answer_name} =
																		</span>
																	)}
																<span className="text-lg font-black text-success">
																	{correctAnswer}
																</span>
															</div>
														</div>
													);
												})}
											</div>
										</div>
									)}
								</div>
							) : question.que_type_id === 4 ? (
								/* ЗАДГАЙ ДААЛГАВАР */
								<div className="space-y-4">
									{/* Хэрэглэгчийн бичсэн хариулт */}
									<div className="rounded-2xl border-2 border-pop-sky bg-pop-sky-soft p-4 md:p-5">
										<div className="flex items-start gap-4">
											{/* Icon */}
											<div className="shrink-0">
												<div className="flex size-10 items-center justify-center rounded-xl bg-pop-sky text-primary-foreground">
													<svg
														className="w-6 h-6"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<title>Хариулт</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
												</div>
											</div>

											{/* Хариултын агуулга */}
											<div className="flex-1 min-w-0">
												<p className="mb-3 text-sm font-extrabold text-pop-sky-ink">
													Таны бичсэн хариулт:
												</p>
												{userSelectedAnswers.length > 0 &&
												userSelectedAnswers[0]?.answer ? (
													<div className="rounded-xl border-2 border-border bg-card p-4">
														<p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
															{userSelectedAnswers[0].answer}
														</p>
													</div>
												) : (
													<div className="rounded-xl border-2 border-dashed border-pop-sun bg-pop-sun-soft p-4">
														<p className="font-bold text-pop-sun-ink">
															Хариулт бичээгүй байна
														</p>
													</div>
												)}
											</div>
										</div>
									</div>

									{/* Багшийн үнэлгээ */}
									{question.unelsen === 1 ? (
										// ✅ БАГШ ҮНЭЛСЭН ТОХИОЛДОЛ
										<div
											className={`rounded-2xl border-2 p-4 md:p-5 ${
												question.zad_onoo > 0
													? "border-success bg-success/10"
													: "border-destructive bg-destructive/10"
											}`}
										>
											<div className="flex items-start gap-3">
												<div className="shrink-0">
													<div
														className={`flex size-8 items-center justify-center rounded-xl text-primary-foreground ${
															question.zad_onoo > 0
																? "bg-success"
																: "bg-destructive"
														}`}
													>
														{question.zad_onoo > 0 ? (
															<svg
																className="w-5 h-5"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<title>Зөв</title>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M5 13l4 4L19 7"
																/>
															</svg>
														) : (
															<svg
																className="w-5 h-5"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<title>Буруу</title>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M6 18L18 6M6 6l12 12"
																/>
															</svg>
														)}
													</div>
												</div>
												<div className="flex-1">
													<p
														className={`mb-2 text-sm font-extrabold ${
															question.zad_onoo > 0
																? "text-success"
																: "text-destructive"
														}`}
													>
														✓ Багш үнэлгээ өгсөн
													</p>

													{/* Авсан оноо */}
													<div className="flex items-center gap-2 mb-3">
														<span className="text-sm text-muted-foreground">
															Авсан оноо:
														</span>
														<span
															className={`text-2xl font-black ${
																question.zad_onoo > 0
																	? "text-success"
																	: "text-destructive"
															}`}
														>
															{question.zad_onoo}
														</span>
														<span className="text-sm text-muted-foreground">
															/ {question.que_onoo}
														</span>
													</div>

													{/* Багшийн тайлбар */}
													{question.zad_descr &&
														question.zad_descr.trim() !== "" &&
														question.zad_descr !== "." && (
															<div className="mt-3 rounded-xl border-2 border-border bg-card p-3">
																<p className="text-xs font-semibold text-muted-foreground mb-1">
																	Багшийн тайлбар:
																</p>
																<p className="text-sm text-foreground leading-relaxed">
																	{question.zad_descr}
																</p>
															</div>
														)}
												</div>
											</div>
										</div>
									) : (
										// ❌ БАГШ ҮНЭЛЭЭГҮЙ ТОХИОЛДОЛ
										<div className="rounded-2xl border-2 border-pop-sun bg-pop-sun-soft p-4 md:p-5">
											<div className="flex items-start gap-3">
												<div className="shrink-0">
													<div className="flex size-8 items-center justify-center rounded-xl border-2 border-pop-sun bg-card text-pop-sun-ink">
														<svg
															className="w-5 h-5"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<title>Хүлээгдэж байна</title>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
													</div>
												</div>
												<div className="flex-1">
													<p className="mb-2 text-sm font-extrabold text-pop-sun-ink">
														⏳ Багшийн үнэлгээ хүлээгдэж байна
													</p>
													<p className="text-sm font-semibold text-pop-sun-ink">
														Задгай даалгавар нь багш шууд үнэлдэг тул оноо
														хараахан тооцогдоогүй байна. Багш үнэлсний дараа
														оноо харагдах болно.
													</p>
												</div>
											</div>
										</div>
									)}
								</div>
							) : question.que_type_id === 5 ? (
								<div className="space-y-4">
									{/* Хэрэглэгчийн оруулсан дараалал */}
									<div className="space-y-3">
										<p className="mb-3 text-sm font-extrabold text-pop-sky-ink">
											Таны оруулсан дараалал:
										</p>

										{questionAnswers
											.sort((a, b) => {
												// Хэрэглэгчийн оруулсан дарааллаар эрэмбэлэх
												const userA = userSelectedAnswers.find(
													(ua) => ua.answer_id === a.answer_id,
												);
												const userB = userSelectedAnswers.find(
													(ua) => ua.answer_id === b.answer_id,
												);
												const posA = userA ? parseInt(userA.answer, 10) : 999;
												const posB = userB ? parseInt(userB.answer, 10) : 999;
												return posA - posB;
											})
											.map((answer) => {
												const userInput = userSelectedAnswers.find(
													(ua) => ua.answer_id === answer.answer_id,
												);

												// Зөв дараалал (refid)
												const correctPosition = answer.refid;
												const userPosition = userInput
													? parseInt(userInput.answer, 10)
													: null;
												const isCorrect = userPosition === correctPosition;

												return (
													<div
														key={answer.answer_id}
														className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-4 font-bold transition-all duration-300 ${
															!userInput
																? "border-dashed border-pop-sun bg-pop-sun-soft"
																: isCorrect
																	? "border-success bg-success/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_35%,transparent)]"
																	: "border-destructive bg-destructive/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_35%,transparent)]"
														}`}
													>
														{/* Хариултын текст */}
														<div className="flex-1 min-w-0">
															<div className="text-base font-medium text-foreground">
																{answer.answer_name_html ||
																	answer.answer_name ||
																	"Хариулт"}
															</div>
														</div>

														{/* Status badge */}
														<div className="shrink-0">
															{userInput && isCorrect && (
																<div className="rounded-full bg-success px-3 py-1 text-sm font-extrabold text-primary-foreground">
																	✓ Зөв
																</div>
															)}
															{userInput && !isCorrect && (
																<div className="rounded-full bg-destructive px-3 py-1 text-sm font-extrabold text-primary-foreground">
																	✗ Буруу
																</div>
															)}
															{!userInput && (
																<div className="rounded-full border-2 border-pop-sun bg-card px-3 py-1 text-sm font-extrabold text-pop-sun-ink">
																	! Хариулаагүй
																</div>
															)}
														</div>
													</div>
												);
											})}
									</div>

									{/* Зөв дараалал */}
									{examSummary?.show_true_ans === 1 && (
										<div className="mt-4 rounded-2xl border-2 border-dashed border-success bg-success/5 p-4 md:p-5">
											<p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-success">
												Зөв дараалал:
											</p>
											<div className="space-y-3">
												{questionAnswers
													.sort((a, b) => a.refid - b.refid)
													.map((answer) => (
														<div
															key={answer.answer_id}
															className="flex items-center gap-3 rounded-xl border-2 border-success/40 bg-card p-3 font-bold"
														>
															<div className="text-base font-medium text-foreground">
																{answer.answer_name_html ||
																	answer.answer_name ||
																	"Хариулт"}
															</div>
														</div>
													))}
											</div>
										</div>
									)}
								</div>
							) : question.que_type_id === 6 ? (
								/* ХАРГАЛЗУУЛАХ АСУУЛТ */
								<div className="space-y-4">
									{(() => {
										// Separate into questions (б column) and answers (а column)
										const questionsOnly = questionAnswers.filter(
											(a) => a.ref_child_id === -1,
										);
										const answersOnly = questionAnswers.filter(
											(a) => a.ref_child_id && a.ref_child_id >= 1,
										);

										return (
											<>
												{/* Хэрэглэгчийн харгалзуулсан хариултууд */}
												<div className="space-y-3">
													<p className="mb-3 text-sm font-extrabold text-pop-sky-ink">
														Таны харгалзуулсан хариултууд:
													</p>

													{questionsOnly.map((questionItem) => {
														// ЗАСВАР: answer-ын ref_child_id нь question-ий refid-тай тэнцүү байх
														const correctAnswer = answersOnly.find(
															(a) => a.ref_child_id === questionItem.refid,
														);

														// Find user's selection for this question
														// User data format: answer_id points to the answer item (а column)
														const userMatch = correctAnswer
															? userSelectedAnswers.find(
																	(ua) =>
																		ua.answer_id === correctAnswer.answer_id,
																)
															: null;

														// Find which question the user matched to
														// ЗАСВАР: User-ын answer утга нь question-ий refid
														const userSelectedQuestion = userMatch
															? questionsOnly.find(
																	(q) =>
																		q.refid === parseInt(userMatch.answer, 10),
																)
															: null;

														const isCorrect =
															userMatch &&
															userSelectedQuestion &&
															userSelectedQuestion.refid === questionItem.refid;

														return (
															<div
																key={questionItem.answer_id}
																className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-4 font-bold transition-all duration-300 ${
																	!userMatch
																		? "border-dashed border-pop-sun bg-pop-sun-soft"
																		: isCorrect
																			? "border-success bg-success/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_35%,transparent)]"
																			: "border-destructive bg-destructive/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_35%,transparent)]"
																}`}
															>
																{/* Right side - Answer (а column) */}
																<div className="flex items-center gap-3 flex-1">
																	{correctAnswer?.answer_img &&
																	correctAnswer.answer_img.trim() !== "" ? (
																		<Image
																			src={correctAnswer.answer_img}
																			alt="Answer"
																			width={120}
																			height={90}
																			className="rounded-xl border-2 border-border object-contain"
																		/>
																	) : (
																		<div className="text-base font-medium">
																			{correctAnswer?.answer_name_html ||
																				correctAnswer?.answer_name ||
																				"Хариулт"}
																		</div>
																	)}
																</div>

																{/* Arrow */}
																<div className="shrink-0 text-2xl font-black text-muted-foreground">
																	→
																</div>

																{/* Left side - Question (б column) - User's selection */}
																<div className="flex items-center gap-3 flex-1">
																	{userSelectedQuestion ? (
																		userSelectedQuestion.answer_img &&
																		userSelectedQuestion.answer_img.trim() !==
																			"" ? (
																			<Image
																				src={userSelectedQuestion.answer_img}
																				alt="Selected Question"
																				width={120}
																				height={90}
																				className="rounded-xl border-2 border-border object-contain"
																			/>
																		) : (
																			<div className="text-base font-medium">
																				{userSelectedQuestion.answer_name_html ||
																					userSelectedQuestion.answer_name}
																			</div>
																		)
																	) : (
																		<span className="font-bold text-pop-sun-ink">
																			Харгалзуулаагүй
																		</span>
																	)}
																</div>

																{/* Status badge */}
																<div className="shrink-0">
																	{userMatch && isCorrect && (
																		<div className="rounded-full bg-success px-3 py-1 text-sm font-extrabold text-primary-foreground">
																			✓ Зөв
																		</div>
																	)}
																	{userMatch && !isCorrect && (
																		<div className="rounded-full bg-destructive px-3 py-1 text-sm font-extrabold text-primary-foreground">
																			✗ Буруу
																		</div>
																	)}
																	{!userMatch && (
																		<div className="rounded-full border-2 border-pop-sun bg-card px-3 py-1 text-sm font-extrabold text-pop-sun-ink">
																			! Хариулаагүй
																		</div>
																	)}
																</div>
															</div>
														);
													})}
												</div>
												{examSummary?.show_true_ans === 1 && (
													<div className="mt-4 rounded-2xl border-2 border-dashed border-success bg-success/5 p-4 md:p-5">
														<p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-success">
															★ Зөв харгалзуулалт:
														</p>
														<div className="space-y-3">
															{/* ЗАСВАР: 
                                                                                дээр loop хийх (А багана) */}
															{answersOnly.map((answerItem) => {
																// answerItem.ref_child_id нь зөв question-ий refid
																const correctQuestion = questionsOnly.find(
																	(q) => q.refid === answerItem.ref_child_id,
																);

																return (
																	<div
																		key={answerItem.answer_id}
																		className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-success/40 bg-card p-3 font-bold"
																	>
																		{/* Answer (а column) - Зүүн тал */}
																		<div className="flex items-center gap-3 flex-1">
																			{answerItem.answer_img &&
																			answerItem.answer_img.trim() !== "" ? (
																				<Image
																					src={answerItem.answer_img}
																					alt="Answer"
																					width={120}
																					height={90}
																					className="rounded-xl border-2 border-border object-contain"
																				/>
																			) : (
																				<div className="text-base font-medium">
																					{answerItem.answer_name_html ||
																						answerItem.answer_name ||
																						"Хариулт"}
																				</div>
																			)}
																		</div>

																		{/* Arrow */}
																		<div className="shrink-0 text-2xl font-black text-success">
																			→
																		</div>

																		{/* Question (б column) - Баруун тал */}
																		<div className="flex items-center gap-3 flex-1">
																			{correctQuestion?.answer_img &&
																			correctQuestion.answer_img.trim() !==
																				"" ? (
																				<Image
																					src={correctQuestion.answer_img}
																					alt="Question"
																					width={120}
																					height={90}
																					className="rounded-xl border-2 border-border object-contain"
																				/>
																			) : (
																				<div className="text-base font-medium">
																					{correctQuestion?.answer_name_html ||
																						correctQuestion?.answer_name ||
																						"Хариулт"}
																				</div>
																			)}
																		</div>
																	</div>
																);
															})}
														</div>
													</div>
												)}
											</>
										);
									})()}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									Энэ төрлийн асуулт хараахан дэмжигдээгүй байна
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="w-full pb-10">
			<div className="mb-4">
				<StyledBackButton
					variant="default"
					showIcon={true}
					showConfirm={true}
					confirmTitle="Та итгэлтэй байна уу?"
					confirmMessage=""
					ariaLabel=""
				/>
			</div>
			<div className="mx-auto max-w-6xl space-y-6">
				{examSummary && (
					<div className="card-pop animate-pop-in overflow-hidden">
						{/* Толгой хэсэг */}
						<div className="relative overflow-hidden bg-gradient-to-br from-pop-violet to-pop-pink p-6 text-white md:p-8">
							<div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary-foreground/10" />
							<div className="pointer-events-none absolute -bottom-16 left-1/3 size-48 rounded-full bg-primary-foreground/10" />
							<div className="relative flex flex-col items-center gap-6 md:flex-row md:justify-between">
								<div className="flex min-w-0 flex-col items-center gap-4 text-center md:items-start md:text-left">
									<div className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/20 shadow-[0_4px_0_0_color-mix(in_oklch,var(--foreground)_20%,transparent)]">
										<svg
											className="size-7"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<title>asd</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2.5}
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
									</div>
									<h2 className="wrap-break-word text-2xl font-black tracking-tight md:text-3xl">
										{examSummary.lesson_name}
									</h2>
									{dunInfo && (
										<p className="wrap-break-word rounded-full bg-primary-foreground/20 px-4 py-1.5 text-sm font-extrabold md:text-base">
											🏆 {dunInfo.title}
										</p>
									)}
								</div>

								{/* Шалгалтын хувь */}
								<div className="flex shrink-0 flex-col items-center gap-3">
									<div className="relative size-36 md:size-40">
										<svg
											className="size-full -rotate-90"
											viewBox="0 0 120 120"
											aria-hidden="true"
										>
											<circle
												cx="60"
												cy="60"
												r="52"
												fill="none"
												strokeWidth="12"
												className="stroke-primary-foreground/25"
											/>
											<circle
												cx="60"
												cy="60"
												r="52"
												fill="none"
												strokeWidth="12"
												strokeLinecap="round"
												className="stroke-primary-foreground transition-all duration-700 ease-out"
												strokeDasharray={2 * Math.PI * 52}
												strokeDashoffset={
													2 *
													Math.PI *
													52 *
													(1 -
														Math.min(Math.max(examSummary.point_perc, 0), 100) /
															100)
												}
											/>
										</svg>
										<div className="absolute inset-0 flex flex-col items-center justify-center">
											<div className="flex items-end">
												<p className="text-4xl font-black leading-none">
													{examSummary.point_perc.toFixed(1)}
												</p>
												<p className="text-lg font-black opacity-80">%</p>
											</div>
											{dunInfo && (
												<span className="mt-1 text-lg font-black opacity-90">
													({dunInfo.tuval})
												</span>
											)}
										</div>
									</div>
									<p className="text-xs font-extrabold uppercase tracking-wide opacity-90">
										Шалгалтын хувь
									</p>
									{/* Хувийн визуал индикатор */}
									<div className="flex w-36 gap-1">
										{Array.from({ length: 10 }).map((_, i) => (
											<div
												key={`percent-indicator-${examSummary.test_id}-${i}`}
												className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
													i < Math.floor(examSummary.point_perc / 10)
														? "bg-primary-foreground"
														: "bg-primary-foreground/25"
												}`}
												style={{ transitionDelay: `${i * 50}ms` }}
											/>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Статистик */}
						<div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:p-6 lg:grid-cols-6">
							{/* Нийт асуулт */}
							<div className="animate-pop-in rounded-2xl bg-pop-violet-soft p-4">
								<div className="mb-2 flex items-center justify-between gap-2">
									<p className="text-xs font-bold uppercase tracking-wide text-pop-violet-ink">
										Нийт асуулт
									</p>
									<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-pop-violet text-primary-foreground">
										<svg
											className="size-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<title>asd</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2.5}
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
									</div>
								</div>
								<p className="text-2xl font-black text-pop-violet-ink md:text-3xl">
									{examSummary.test_ttl}
								</p>
							</div>

							{/* Зөв хариулт */}
							<div
								className="animate-pop-in rounded-2xl bg-success/15 p-4"
								style={{ animationDelay: "50ms" }}
							>
								<div className="mb-2 flex items-center justify-between gap-2">
									<p className="text-xs font-bold uppercase tracking-wide text-success">
										Зөв
									</p>
									<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-success text-primary-foreground">
										<svg
											className="size-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<title>Зөв</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={3}
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</div>
								</div>
								<p className="text-2xl font-black text-success md:text-3xl">
									{examSummary.correct_ttl}
								</p>
							</div>

							{/* Буруу хариулт */}
							<div
								className="animate-pop-in rounded-2xl bg-destructive/15 p-4"
								style={{ animationDelay: "100ms" }}
							>
								<div className="mb-2 flex items-center justify-between gap-2">
									<p className="text-xs font-bold uppercase tracking-wide text-destructive">
										Буруу
									</p>
									<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive text-primary-foreground">
										<svg
											className="size-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<title>Буруу</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={3}
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</div>
								</div>
								<p className="text-2xl font-black text-destructive md:text-3xl">
									{examSummary.wrong_ttl}
								</p>
							</div>

							{/* Хариулаагүй */}
							<div
								className="animate-pop-in rounded-2xl bg-muted p-4"
								style={{ animationDelay: "150ms" }}
							>
								<div className="mb-2 flex items-center justify-between gap-2">
									<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
										Хариулаагүй
									</p>
									<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted-foreground/20 text-muted-foreground">
										<svg
											className="size-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<title>Хариулаагүй</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2.5}
												d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</div>
								</div>
								<p className="text-2xl font-black text-muted-foreground md:text-3xl">
									{examSummary.not_answer}
								</p>
							</div>

							{/* Оноо харьцуулалт */}
							<div
								className="animate-pop-in col-span-2 rounded-2xl bg-pop-sky-soft p-4"
								style={{ animationDelay: "200ms" }}
							>
								<div className="space-y-3">
									{/* Авах оноо */}
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="size-2 rounded-full bg-pop-sun" />
											<p className="text-xs font-bold uppercase tracking-wide text-pop-sky-ink">
												Авах оноо
											</p>
										</div>
										<p className="text-xl font-black text-pop-sky-ink">
											{examSummary.ttl_point}
										</p>
									</div>

									{/* Progress bar */}
									<div className="relative h-3 overflow-hidden rounded-full bg-card">
										<div
											className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pop-sky to-pop-violet transition-all duration-700 ease-out"
											style={{
												width: `${Math.min((examSummary.point / examSummary.ttl_point) * 100, 100)}%`,
											}}
										/>
									</div>

									{/* Авсан оноо */}
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="size-2 rounded-full bg-primary" />
											<p className="text-xs font-bold uppercase tracking-wide text-pop-sky-ink">
												Авсан оноо
											</p>
										</div>
										<p className="text-2xl font-black text-primary">
											{examSummary.point}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Filter toolbar - sticky */}
				<div className="sticky top-[4.5rem] z-20 rounded-3xl border-2 border-border bg-card p-3 shadow-[0_4px_0_0_var(--border)]">
					<div className="flex flex-wrap items-center gap-2">
						{!reviewMode && (
							<div className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 scrollbar-none">
								{filterOptions.map((opt) => (
									<button
										key={opt.key}
										type="button"
										onClick={() => setAnswerFilter(opt.key)}
										className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition-all active:translate-y-0.5 ${
											answerFilter === opt.key
												? opt.active
												: "border-border bg-card text-muted-foreground hover:bg-accent"
										}`}
									>
										{opt.label}
										<span
											className={`rounded-full px-1.5 text-xs font-black tabular-nums ${
												answerFilter === opt.key
													? "bg-background/25"
													: "bg-muted"
											}`}
										>
											{opt.count}
										</span>
									</button>
								))}
							</div>
						)}
						{reviewMode && (
							<div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-extrabold text-destructive">
								<XCircle className="size-5 shrink-0" />
								<span className="truncate">
									Буруу хариулт{" "}
									{wrongEntries.length > 0 ? safeReviewIdx + 1 : 0} /{" "}
									{wrongEntries.length}
								</span>
							</div>
						)}
						<div className="flex flex-wrap items-center gap-2">
							{!reviewMode && (
								<>
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											setOpenIds(
												new Set(
													visibleEntries.map((e) => e.question.exam_que_id),
												),
											)
										}
									>
										<ChevronsUpDown className="size-4" />
										Бүгдийг нээх
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setOpenIds(new Set())}
									>
										<ChevronsDownUp className="size-4" />
										Бүгдийг хаах
									</Button>
								</>
							)}
							<Button
								variant={reviewMode ? "outline" : "destructive"}
								size="sm"
								disabled={!reviewMode && wrongEntries.length === 0}
								onClick={() => {
									setReviewIdx(0);
									setReviewMode(!reviewMode);
								}}
							>
								{reviewMode ? (
									<X className="size-4" />
								) : (
									<Zap className="size-4" />
								)}
								{reviewMode ? "Гарах" : "Буруу хариултуудаар явах"}
							</Button>
						</div>
					</div>
				</div>

				<div className="space-y-3">
					{!questions || questions.length === 0 ? (
						<div className="card-pop p-10 text-center font-bold">
							<p className="text-muted-foreground">Асуулт олдсонгүй</p>
						</div>
					) : reviewMode ? (
						reviewEntry ? (
							<div className="space-y-3">
								{renderQuestionCard(reviewEntry, true)}
								<div className="flex items-center justify-between gap-3">
									<Button
										variant="outline"
										disabled={safeReviewIdx === 0}
										onClick={() => setReviewIdx(Math.max(0, safeReviewIdx - 1))}
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
												onClick={() => setReviewIdx(i)}
												className={`h-2.5 rounded-full transition-all ${i === safeReviewIdx ? "w-6 bg-destructive" : "w-2.5 bg-border hover:bg-muted-foreground"}`}
											/>
										))}
									</div>
									<Button
										disabled={safeReviewIdx >= wrongEntries.length - 1}
										onClick={() =>
											setReviewIdx(
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
								<p className="font-extrabold">Буруу хариулт алга 🎉</p>
							</div>
						)
					) : visibleEntries.length === 0 ? (
						<div className="card-pop flex flex-col items-center p-10 text-center">
							<div className="mb-3 flex size-16 items-center justify-center rounded-full bg-pop-sky-soft text-pop-sky-ink">
								<AlertCircle className="size-8" />
							</div>
							<p className="font-extrabold text-muted-foreground">
								Асуулт олдсонгүй
							</p>
						</div>
					) : (
						visibleEntries.map((entry) => renderQuestionCard(entry))
					)}
				</div>
			</div>
		</div>
	);
}

export default ExamResultDetailPage;
