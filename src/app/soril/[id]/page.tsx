"use client";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	Bookmark,
	BookmarkCheck,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ClipboardCheck,
	Clock,
	CloudCheck,
	LayoutGrid,
	List,
	Loader2,
	Menu,
	Save,
	Send,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { ExamHeader } from "@/app/exam/component/examUtils/examInfo";
import MathContent from "@/app/exam/component/examUtils/MathContent";
import { SourceBlock } from "@/app/exam/component/examUtils/sourceCard";
import ExamMinimap from "@/app/exam/component/minimap";
import FillInTheBlankQuestion from "@/app/exam/component/question/fillblank";
import MatchingByLine from "@/app/exam/component/question/matching";
import MultiSelectQuestion from "@/app/exam/component/question/multiselect";
import NumberInputQuestion from "@/app/exam/component/question/numberinput";
import DragAndDropQuestion from "@/app/exam/component/question/order";
import SingleSelectQuestion from "@/app/exam/component/question/singleSelect";
import StyledBackButton from "@/components/backButton";
import FixedScrollButton from "@/components/FixedScrollButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { deleteExamAnswer, getExamById, saveExamAnswer } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { AnswerValue } from "@/types/exam/exam";
import QuestionImage from "../../exam/component/question/questionImage";
import FinishExamResultDialog, { type FinishExamDialogHandle } from "../finish";
import ExamTimer from "../stime";

interface PendingAnswer {
	questionId: number;
	answer: AnswerValue;
	queTypeId: number;
	rowNum: number;
	timestamp: number;
}

export default function SorilPage() {
	const { userId } = useAuthStore();
	const { id } = useParams();
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [_visibleQuestionIndex, _setVisibleQuestionIndex] = useState(0);
	const [saveError, _setSaveError] = useState<string | null>(null);
	const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(
		new Set(),
	);
	const [selectedAnswers, setSelectedAnswers] = useState<
		Record<number, AnswerValue>
	>({});
	const [isSaving, setIsSaving] = useState(false);
	const [typingQuestions, setTypingQuestions] = useState<Set<number>>(
		new Set(),
	);
	const savingQuestions = useRef<Set<number>>(new Set());
	const [isTimeUp, _setIsTimeUp] = useState(false);
	const [showMobileMinimapOverlay, setShowMobileMinimapOverlay] =
		useState(false);
	// Auto-finish refs
	const finishDialogRef = useRef<FinishExamDialogHandle>(null);
	const typingTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());
	const pendingAnswers = useRef<Map<number, PendingAnswer>>(new Map());
	const saveTimer = useRef<NodeJS.Timeout | null>(null);
	const lastSavedAnswers = useRef<Map<number, AnswerValue>>(new Map());
	const [viewMode, setViewMode] = useState<"scroll" | "card">("card");
	const [elapsedExamTime, setElapsedExamTime] = useState(0);
	const isSavingRef = useRef(false);
	const router = useRouter();
	const AUTO_SAVE_DELAY = 1000;
	const [_isNavigating, setIsNavigating] = useState(false);
	const {
		data: examData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["exam", userId, id],
		queryFn: () => getExamById(userId || 0, Number(id)),
		enabled: !!userId && !!id,
	});

	const areAnswersEqual = useCallback(
		(a: AnswerValue | undefined, b: AnswerValue | undefined): boolean => {
			if (a === b) return true;
			if (a === undefined || b === undefined) return false;

			const aType = Array.isArray(a) ? "array" : typeof a;
			const bType = Array.isArray(b) ? "array" : typeof b;
			if (aType !== bType) return false;

			if (Array.isArray(a) && Array.isArray(b)) {
				if (a.length !== b.length) return false;
				return a.every((v, i) => v === b[i]);
			}

			if (
				typeof a === "object" &&
				typeof b === "object" &&
				a !== null &&
				b !== null
			) {
				const aKeys = Object.keys(a);
				const bKeys = Object.keys(b);
				if (aKeys.length !== bKeys.length) return false;

				const aRecord = a as Record<number, number | number[]>;
				const bRecord = b as Record<number, number | number[]>;

				return aKeys.every((key) => {
					const numKey = Number(key);
					const aVal = aRecord[numKey];
					const bVal = bRecord[numKey];

					// Хоёулаа array бол
					if (Array.isArray(aVal) && Array.isArray(bVal)) {
						if (aVal.length !== bVal.length) return false;
						return aVal.every((v, i) => v === bVal[i]);
					}

					// Хоёулаа number бол
					if (typeof aVal === "number" && typeof bVal === "number") {
						return aVal === bVal;
					}

					// Хоёулаа string бол (Type 3)
					if (typeof aVal === "string" && typeof bVal === "string") {
						return aVal === bVal;
					}

					// Төрөл таарахгүй бол false
					return false;
				});
			}

			return false;
		},
		[],
	);

	const handleElapsedTimeChange = useCallback((seconds: number) => {
		console.log("📥 soril.tsx: хүлээн авсан секунд =", seconds); // ✅ Энийг нэмнэ үү
		setElapsedExamTime(seconds);
	}, []);
	const saveQuestion = useCallback(
		async (pending: PendingAnswer, examId: number): Promise<boolean> => {
			const { questionId, answer, queTypeId, rowNum } = pending;

			// ✅ Race condition шалгах - хэрэв хадгалагдаж байгаа бол skip
			if (savingQuestions.current.has(questionId)) {
				console.log(
					`⚠️ Question ${questionId} is already being saved, skipping...`,
				);
				return false;
			}

			try {
				// ✅ Хадгалалт эхлэх
				savingQuestions.current.add(questionId);

				const previousAnswer = lastSavedAnswers.current.get(questionId);

				// ============================================
				// STEP 1: DELETE OLD ANSWERS BASED ON TYPE
				// ============================================

				// Type 1: Delete old single-select answer
				if (
					queTypeId === 1 &&
					typeof previousAnswer === "number" &&
					previousAnswer !== 0
				) {
					try {
						await deleteExamAnswer(
							userId || 0,
							examId,
							questionId,
							previousAnswer,
						);
					} catch (_error) {
						console.log(
							`Failed to delete old answer for type 1 question ${questionId}`,
						);
					}
				}

				// Type 2: Delete all old multi-select answers
				if (
					queTypeId === 2 &&
					Array.isArray(previousAnswer) &&
					previousAnswer.length > 0
				) {
					try {
						await Promise.allSettled(
							previousAnswer.map((answerId) =>
								deleteExamAnswer(userId || 0, examId, questionId, answerId),
							),
						);
					} catch (_error) {
						console.log(
							`Failed to delete old answers for type 2 question ${questionId}`,
						);
					}
				}

				// Type 3: Delete old number input answer
				if (queTypeId === 3 && previousAnswer !== undefined) {
					try {
						if (
							typeof previousAnswer === "object" &&
							previousAnswer !== null &&
							!Array.isArray(previousAnswer)
						) {
							const prevMap = previousAnswer as Record<number, string>;
							const prevIds = Object.keys(prevMap)
								.map((k) => Number(k))
								.filter(
									(id) =>
										id && id !== 0 && prevMap[id] && prevMap[id].trim() !== "",
								);
							if (prevIds.length > 0) {
								await Promise.allSettled(
									prevIds.map((answerId) =>
										deleteExamAnswer(userId || 0, examId, questionId, answerId),
									),
								);
							}
						}
					} catch (_error) {
						console.log(
							`Failed to delete old answers for type 3 question ${questionId}`,
						);
					}
				}

				// Type 4: Delete old fill-in-blank answer
				if (queTypeId === 4 && previousAnswer !== undefined) {
					try {
						const type4Answer = examData?.Answers?.find(
							(ans) => ans.question_id === questionId && ans.answer_type === 4,
						);

						await deleteExamAnswer(
							userId || 0,
							examId,
							questionId,
							type4Answer?.answer_id || 0,
						);
					} catch (_error) {
						console.log(
							`Failed to delete old answer for type 4 question ${questionId}`,
						);
					}
				}

				// Type 5: Delete all old ordered answers
				if (
					queTypeId === 5 &&
					Array.isArray(previousAnswer) &&
					previousAnswer.length > 0
				) {
					try {
						// ✅ Valid answer IDs шүүх
						const validPrevAnswers = previousAnswer.filter(
							(id) => id && id !== 0 && !Number.isNaN(id),
						);

						if (validPrevAnswers.length > 0) {
							console.log(
								`🗑️ Type 5 Q${questionId}: Deleting ${validPrevAnswers.length} old answers`,
							);
							await Promise.allSettled(
								validPrevAnswers.map((answerId) =>
									deleteExamAnswer(userId || 0, examId, questionId, answerId),
								),
							);
						}
					} catch (_error) {
						console.log(
							`Failed to delete old answers for type 5 question ${questionId}`,
						);
					}
				}

				// Type 6: Delete all old matching answers
				if (
					queTypeId === 6 &&
					typeof previousAnswer === "object" &&
					previousAnswer !== null &&
					!Array.isArray(previousAnswer)
				) {
					const oldMatches = previousAnswer as Record<
						number,
						number | number[]
					>;
					const oldAnswerIds: number[] = [];

					// Хоёр төрлийн утгыг хоёуланг нь боловсруулах
					Object.values(oldMatches).forEach((value) => {
						if (Array.isArray(value)) {
							// Олон хариулт
							oldAnswerIds.push(...value);
						} else if (typeof value === "number") {
							// Нэг хариулт (хуучин format)
							oldAnswerIds.push(value);
						}
					});

					if (oldAnswerIds.length > 0) {
						try {
							await Promise.allSettled(
								oldAnswerIds.map((answerId) =>
									deleteExamAnswer(userId || 0, examId, questionId, answerId),
								),
							);
						} catch (_error) {
							console.log(
								`Failed to delete old answers for type 6 question ${questionId}`,
							);
						}
					}
				}

				// ============================================
				// STEP 2: SAVE NEW ANSWERS BASED ON TYPE
				// ============================================

				// Type 1: Save single-select answer
				if (queTypeId === 1 && typeof answer === "number" && answer !== 0) {
					await saveExamAnswer(
						userId || 0,
						examId,
						questionId,
						answer,
						queTypeId,
						"1",
						rowNum,
					);
				}

				// Type 2: Save multi-select answers
				if (queTypeId === 2 && Array.isArray(answer) && answer.length > 0) {
					await Promise.all(
						answer.map((answerId) =>
							saveExamAnswer(
								userId || 0,
								examId,
								questionId,
								answerId,
								queTypeId,
								"1",
								rowNum,
							),
						),
					);
				}

				// Type 3: Save number input answer (answerId + typed value)
				if (
					queTypeId === 3 &&
					typeof answer === "object" &&
					answer !== null &&
					!Array.isArray(answer)
				) {
					const valuesMap = answer as Record<number, string>;
					const entries = Object.entries(valuesMap)
						.map(([k, v]) => [Number(k), v as string] as [number, string])
						.filter(([aid, val]) => aid && aid !== 0 && val.trim() !== "");
					if (entries.length > 0) {
						await Promise.all(
							entries.map(([answerId, val]) =>
								saveExamAnswer(
									userId || 0,
									examId,
									questionId,
									answerId,
									queTypeId,
									val,
									rowNum,
								),
							),
						);
					}
				}

				// Type 4: Save fill-in-blank answer
				if (
					queTypeId === 4 &&
					typeof answer === "string" &&
					answer.trim() !== ""
				) {
					const type4Answer = examData?.Answers?.find(
						(ans) => ans.question_id === questionId && ans.answer_type === 4,
					);

					await saveExamAnswer(
						userId || 0,
						examId,
						questionId,
						type4Answer?.answer_id || 0,
						queTypeId,
						answer,
						rowNum,
					);
				}

				// Type 5: Save drag-and-drop order
				if (queTypeId === 5 && Array.isArray(answer) && answer.length > 0) {
					// ✅ Valid answer IDs шүүх
					const validAnswers = answer.filter(
						(id) =>
							id && id !== 0 && !Number.isNaN(id) && typeof id === "number",
					);

					if (validAnswers.length === 0) {
						console.warn(`⚠️ Type 5 Q${questionId}: No valid answers to save`);
						lastSavedAnswers.current.set(questionId, answer);
						return true;
					}

					console.log(
						`💾 Type 5 Q${questionId}: Saving ${validAnswers.length} answers`,
						validAnswers,
					);

					await Promise.all(
						validAnswers.map((answerId, index) =>
							saveExamAnswer(
								userId || 0,
								examId,
								questionId,
								answerId,
								queTypeId,
								(index + 1).toString(),
								rowNum,
							),
						),
					);

					console.log(`✅ Type 5 Q${questionId}: Saved successfully`);
				}

				// Type 6: Save matching answers
				if (
					queTypeId === 6 &&
					typeof answer === "object" &&
					answer !== null &&
					!Array.isArray(answer)
				) {
					const matches = answer as Record<number, number | number[]>;
					const savePromises: Promise<unknown>[] = [];

					Object.entries(matches).forEach(([qRefIdStr, value]) => {
						if (Array.isArray(value)) {
							// Олон хариулт
							value.forEach((aRefId) => {
								savePromises.push(
									saveExamAnswer(
										userId || 0,
										examId,
										questionId,
										aRefId,
										queTypeId,
										qRefIdStr,
										rowNum,
									),
								);
							});
						} else if (typeof value === "number") {
							// Нэг хариулт (backward compatibility)
							savePromises.push(
								saveExamAnswer(
									userId || 0,
									examId,
									questionId,
									value,
									queTypeId,
									qRefIdStr,
									rowNum,
								),
							);
						}
					});

					if (savePromises.length > 0) {
						await Promise.all(savePromises);
					}
				}

				lastSavedAnswers.current.set(questionId, answer);
				return true;
			} catch (error) {
				console.error(`❌ Failed to save question ${questionId}:`, error);
				return false;
			} finally {
				savingQuestions.current.delete(questionId);
			}
		},
		[userId, examData],
	);
	const _handleBack = useCallback(() => {
		setIsNavigating(true);
		router.push("/Lists/sorilList");
	}, [router]);
	useEffect(() => {
		return () => {
			for (const timer of typingTimers.current.values()) {
				clearTimeout(timer);
			}
			typingTimers.current.clear();
			savingQuestions.current.clear(); // ✅ НЭМЭХ
		};
	}, []);
	const processPendingAnswers = useCallback(async () => {
		if (
			isSavingRef.current ||
			pendingAnswers.current.size === 0 ||
			!examData?.ExamInfo?.[0]?.id
		) {
			return;
		}

		isSavingRef.current = true;
		setIsSaving(true);
		const examId = examData.ExamInfo[0].id;

		const answersToSave = Array.from(pendingAnswers.current.entries());
		const failedSaves: [number, PendingAnswer][] = [];

		answersToSave.sort((a, b) => a[1].timestamp - b[1].timestamp);

		const BATCH_SIZE = 5;
		for (let i = 0; i < answersToSave.length; i += BATCH_SIZE) {
			const batch = answersToSave.slice(i, i + BATCH_SIZE);
			const results = await Promise.allSettled(
				batch.map(([_, pending]) => saveQuestion(pending, examId)),
			);

			results.forEach((result, index) => {
				const [questionId, pending] = batch[index];
				if (result.status === "fulfilled" && result.value) {
					pendingAnswers.current.delete(questionId);
				} else {
					failedSaves.push([questionId, pending]);
				}
			});
		}

		isSavingRef.current = false;
		setIsSaving(false);
	}, [examData, saveQuestion]);

	useEffect(() => {
		if (isLoading || !examData?.ChoosedAnswer) return;

		const answersMap: Record<number, AnswerValue> = {};
		const groupedAnswers = examData.ChoosedAnswer.reduce(
			(acc, item) => {
				const key = `${item.QueID}_${item.QueType}`;
				if (!acc[key]) acc[key] = [];
				acc[key].push(item);
				return acc;
			},
			{} as Record<string, typeof examData.ChoosedAnswer>,
		);

		Object.values(groupedAnswers).forEach((items) => {
			if (items.length === 0) return;
			const { QueID, QueType } = items[0];
			if (QueID == null) return;

			if (QueType === 1) {
				const lastItem = items[items.length - 1];
				const ansId = lastItem.AnsID ?? null;
				answersMap[QueID] = ansId && ansId !== 0 ? ansId : null;
			} else if (QueType === 2) {
				const uniqueIds = [
					...new Set(
						items
							.map((i) => i.AnsID)
							.filter((id): id is number => id !== null && id !== 0),
					),
				];
				answersMap[QueID] = uniqueIds;
			} else if (QueType === 3) {
				const map: Record<number, string> = {};
				items.forEach((it) => {
					const ansId = it.AnsID ?? 0;
					const val = (it as { Answer?: string }).Answer ?? "";
					if (ansId && ansId !== 0) {
						map[ansId] = val;
					}
				});
				answersMap[QueID] = map;
			} else if (QueType === 4) {
				const lastItem = items[items.length - 1];
				answersMap[QueID] = (lastItem as { Answer?: string }).Answer || "";
			} else if (QueType === 5) {
				const sortedItems = [...items].sort((a, b) => {
					const aOrder = Number((a as { Answer?: string }).Answer) || 999;
					const bOrder = Number((b as { Answer?: string }).Answer) || 999;
					return aOrder - bOrder;
				});
				answersMap[QueID] = sortedItems
					.map((i) => i.AnsID)
					.filter((id): id is number => id !== null && id !== 0);
			} else if (QueType === 6) {
				const matchMap: Record<number, number[]> = {};

				items.forEach((item) => {
					const qRefId = Number((item as { Answer?: string }).Answer);
					const aRefId = item.AnsID;

					if (qRefId && aRefId) {
						if (!matchMap[qRefId]) {
							matchMap[qRefId] = [];
						}
						matchMap[qRefId].push(aRefId);
					}
				});

				answersMap[QueID] = matchMap;
			}
		});

		setSelectedAnswers(answersMap);
		lastSavedAnswers.current = new Map(
			Object.entries(answersMap).map(([k, v]) => [Number(k), v]),
		);
	}, [examData, isLoading]);

	const allQuestions = useMemo(() => {
		if (!examData?.Questions || !examData?.Answers) return [];

		const answersByQuestionId = new Map<number, typeof examData.Answers>();

		for (const answer of examData.Answers) {
			if (!answersByQuestionId.has(answer.question_id)) {
				answersByQuestionId.set(answer.question_id, []);
			}
			answersByQuestionId.get(answer.question_id)?.push(answer);
		}

		return examData.Questions.filter((q) =>
			[1, 2, 3, 4, 5, 6].includes(q.que_type_id),
		).map((q) => {
			const questionAnswers = answersByQuestionId.get(q.question_id) || [];

			const filteredAnswers = questionAnswers
				.filter((a) => a.answer_type === q.que_type_id)
				.map((a) => ({
					...a,
					answer_img: a.answer_img || undefined,
					is_true: false,
				}));

			return {
				...q,
				question_img: q.question_img || "",
				answers: filteredAnswers,
			};
		});
	}, [examData?.Questions, examData?.Answers]);

	const totalCount = allQuestions.length;
	const answeredCount = useMemo(() => {
		let count = 0;

		for (const key in selectedAnswers) {
			if (!Object.hasOwn(selectedAnswers, key)) continue;

			const ans = selectedAnswers[key];
			if (ans == null) continue;

			if (Array.isArray(ans)) {
				if (ans.length > 0) count++;
			} else if (typeof ans === "string") {
				if (ans !== "" && ans.trim() !== "") count++;
			} else if (typeof ans === "number") {
				if (ans !== 0 && !Number.isNaN(ans)) count++;
			} else {
				// Object check
				for (const _k in ans) {
					count++;
					break;
				}
			}
		}

		return count;
	}, [selectedAnswers]);

	const scheduleAutoSave = useCallback(() => {
		if (saveTimer.current) clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => {
			processPendingAnswers();
		}, AUTO_SAVE_DELAY);
	}, [processPendingAnswers]);

	const handleManualSave = useCallback(() => {
		if (saveTimer.current) clearTimeout(saveTimer.current);
		processPendingAnswers();
	}, [processPendingAnswers]);

	const handleAnswerChange = useCallback(
		(questionId: number, answer: AnswerValue) => {
			if (!examData) return;
			const question = examData.Questions.find(
				(q) => q.question_id === questionId,
			);
			if (!question) return;

			const lastSaved = lastSavedAnswers.current.get(questionId);
			if (areAnswersEqual(lastSaved, answer)) return;

			const rowNum = Number(question.row_num);
			const queTypeId = question.que_type_id;
			const existingTimer = typingTimers.current.get(questionId);
			if (existingTimer) {
				clearTimeout(existingTimer);
			}

			setTypingQuestions((prev) => new Set(prev).add(questionId));
			const timer = setTimeout(() => {
				setTypingQuestions((prev) => {
					const newSet = new Set(prev);
					newSet.delete(questionId);
					return newSet;
				});
				typingTimers.current.delete(questionId);
			}, 1500);

			typingTimers.current.set(questionId, timer);

			setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
			pendingAnswers.current.set(questionId, {
				questionId,
				answer,
				queTypeId,
				rowNum,
				timestamp: Date.now(),
			});

			scheduleAutoSave();
		},
		[examData, scheduleAutoSave, areAnswersEqual],
	);

	useEffect(() => {
		return () => {
			for (const timer of typingTimers.current.values()) {
				clearTimeout(timer);
			}
			typingTimers.current.clear();
		};
	}, []);

	useEffect(
		() => () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
			if (pendingAnswers.current.size > 0) processPendingAnswers();
		},
		[processPendingAnswers],
	);

	const toggleBookmark = useCallback((questionId: number) => {
		setBookmarkedQuestions((prev) => {
			const newSet = new Set(prev);
			newSet.has(questionId)
				? newSet.delete(questionId)
				: newSet.add(questionId);
			return newSet;
		});
	}, []);

	const goToQuestion = useCallback((index: number) => {
		setCurrentQuestionIndex(index);
		const element = document.getElementById(`question-${index}`);
		if (element && window.innerWidth >= 1024)
			element.scrollIntoView({ behavior: "smooth", block: "center" });
	}, []);

	const goToPreviousQuestion = useCallback(() => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex((prev) => prev - 1);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [currentQuestionIndex]);

	const goToNextQuestion = useCallback(() => {
		if (currentQuestionIndex < totalCount - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [currentQuestionIndex, totalCount]);

	const getCardBorderClass = useCallback(
		(questionId: number) => {
			const answer = selectedAnswers[questionId];

			let isAnswered = false;
			if (Array.isArray(answer)) {
				isAnswered = answer.length > 0;
			} else if (typeof answer === "string") {
				isAnswered = answer.trim() !== "";
			} else if (typeof answer === "number") {
				isAnswered = !Number.isNaN(answer) && answer !== 0;
			} else if (typeof answer === "object" && answer !== null) {
				for (const _key in answer) {
					isAnswered = true;
					break;
				}
			}

			const isBookmarked = bookmarkedQuestions.has(questionId);
			const isTypingNow = typingQuestions.has(questionId);

			if (isTypingNow)
				return "border-2 border-pop-sky shadow-[0_4px_0_0_var(--pop-sky)]";
			if (isAnswered && isBookmarked)
				return "border-2 border-pop-sun shadow-[0_4px_0_0_var(--pop-sun)]";
			if (isAnswered)
				return "border-2 border-primary shadow-[0_4px_0_0_var(--primary)]";
			if (isBookmarked)
				return "border-2 border-pop-sun/70 shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_70%,transparent)]";
			return "border-2 border-border";
		},
		[selectedAnswers, bookmarkedQuestions, typingQuestions],
	);

	const renderQuestion = useCallback(
		(q: (typeof allQuestions)[0]) => {
			const header = (
				<>
					{q.question_img && (
						<QuestionImage src={q.question_img} alt="Асуултын зураг" />
					)}
					<SourceBlock
						sourceName={q.source_name}
						sourceTitle={q.source_title}
						sourceImg={q.source_img}
						srcAudio={q.src_audio}
					/>
				</>
			);

			if (q.que_type_id === 1) {
				return (
					<>
						{header}
						<SingleSelectQuestion
							questionId={q.question_id}
							questionText={q.question_name}
							answers={q.answers}
							selectedAnswer={selectedAnswers[q.question_id] as number | null}
							onAnswerChange={handleAnswerChange}
						/>
					</>
				);
			}

			if ([2, 3, 4, 6].includes(q.que_type_id)) {
				return (
					<>
						{header}
						{q.que_type_id === 2 && (
							<MultiSelectQuestion
								questionId={q.question_id}
								questionText={q.question_name}
								answers={q.answers}
								mode="exam"
								selectedAnswers={
									(selectedAnswers[q.question_id] as number[]) || []
								}
								onAnswerChange={handleAnswerChange}
							/>
						)}
						{q.que_type_id === 3 && (
							<NumberInputQuestion
								questionId={q.question_id}
								questionText={q.question_name}
								answers={q.answers}
								selectedValues={
									selectedAnswers[q.question_id] as Record<number, string>
								}
								onAnswerChange={(qId, values) =>
									handleAnswerChange(qId, values as AnswerValue)
								}
							/>
						)}
						{q.que_type_id === 4 && (
							<FillInTheBlankQuestion
								questionId={q.question_id}
								questionText={q.question_name}
								value={(selectedAnswers[q.question_id] as string) || ""}
								onAnswerChange={handleAnswerChange}
							/>
						)}
						{q.que_type_id === 6 && (
							<MatchingByLine
								answers={q.answers.map((a) => ({
									refid: a.refid,
									answer_id: a.answer_id,
									question_id: a.question_id,
									answer_name_html: a.answer_name_html,
									answer_descr: a.answer_descr,
									answer_img: a.answer_img || null,
									ref_child_id: a.ref_child_id,
									is_true: a.is_true,
								}))}
								onMatchChange={(matches) =>
									handleAnswerChange(q.question_id, matches)
								}
								userAnswers={
									(selectedAnswers[q.question_id] as Record<
										number,
										number[]
									>) || {}
								}
							/>
						)}
					</>
				);
			}

			if (q.que_type_id === 5) {
				return (
					<>
						{header}
						<DragAndDropQuestion
							questionId={q.question_id}
							examId={examData?.ExamInfo?.[0]?.id}
							userId={userId || 0}
							answers={q.answers.map((a) => ({
								answer_id: a.answer_id,
								answer_name_html: a.answer_name_html || a.answer_name || "",
							}))}
							userAnswers={(selectedAnswers[q.question_id] as number[]) || []}
							onOrderChange={(orderedIds) =>
								handleAnswerChange(q.question_id, orderedIds)
							}
						/>
					</>
				);
			}

			return null;
		},
		[selectedAnswers, handleAnswerChange, examData, userId],
	);

	// ============================================
	// FOCUS MODE UX: review, navigator, keyboard, swipe
	// ============================================
	const [isReviewOpen, setIsReviewOpen] = useState(false);

	const answeredQuestionIds = useMemo(() => {
		const set = new Set<number>();
		for (const q of allQuestions) {
			const answer = selectedAnswers[q.question_id];
			let isAnswered = false;
			if (Array.isArray(answer)) {
				isAnswered = answer.length > 0;
			} else if (typeof answer === "string") {
				isAnswered = answer.trim() !== "";
			} else if (typeof answer === "number") {
				isAnswered = !Number.isNaN(answer) && answer !== 0;
			} else if (typeof answer === "object" && answer !== null) {
				isAnswered = Object.keys(answer).length > 0;
			}
			if (isAnswered) set.add(q.question_id);
		}
		return set;
	}, [allQuestions, selectedAnswers]);

	const jumpToQuestion = useCallback(
		(index: number) => {
			setShowMobileMinimapOverlay(false);
			setIsReviewOpen(false);
			setCurrentQuestionIndex(index);
			if (viewMode === "scroll") {
				setTimeout(() => {
					document
						.getElementById(`question-${index}`)
						?.scrollIntoView({ behavior: "smooth", block: "start" });
				}, 80);
			} else {
				window.scrollTo({ top: 0, behavior: "smooth" });
			}
		},
		[viewMode],
	);

	const openReview = useCallback(() => {
		setShowMobileMinimapOverlay(false);
		setIsReviewOpen(true);
	}, []);

	// Шалгах самбараас → одоо байгаа дуусгах (баталгаажуулах) урсгал
	const finishFromReview = useCallback(() => {
		setIsReviewOpen(false);
		setTimeout(() => finishDialogRef.current?.openConfirm(), 150);
	}, []);

	// ← → товчлуур
	useEffect(() => {
		if (viewMode !== "card") return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
			if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
				return;
			if (isReviewOpen || showMobileMinimapOverlay) return;
			if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
				return;
			const target = e.target as HTMLElement | null;
			if (
				target?.closest(
					'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="radiogroup"], [role="radio"], [role="slider"], [role="listbox"], [role="menu"], [role="tablist"]',
				)
			)
				return;
			e.preventDefault();
			if (e.key === "ArrowLeft") goToPreviousQuestion();
			else goToNextQuestion();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [
		viewMode,
		isReviewOpen,
		showMobileMinimapOverlay,
		goToPreviousQuestion,
		goToNextQuestion,
	]);

	// Утсан дээр хэвтээ swipe (pointer events)
	const SWIPE_THRESHOLD = 64;
	const swipeStart = useRef<{
		x: number;
		y: number;
		t: number;
		id: number;
	} | null>(null);
	const currentQueTypeId = allQuestions[currentQuestionIndex]?.que_type_id;
	// Чирэх төрлийн асуултууд (эрэмбэлэх, холбох) дээр swipe идэвхгүй
	const isSwipeEnabled =
		viewMode === "card" && currentQueTypeId !== 5 && currentQueTypeId !== 6;

	const handleSwipePointerDown = useCallback(
		(e: ReactPointerEvent<HTMLDivElement>) => {
			if (!isSwipeEnabled || e.pointerType === "mouse" || !e.isPrimary) return;
			const target = e.target as HTMLElement;
			if (
				target.closest(
					'input, textarea, select, [contenteditable="true"], [draggable="true"], [role="slider"], [data-no-swipe], audio, video, canvas',
				)
			) {
				swipeStart.current = null;
				return;
			}
			swipeStart.current = {
				x: e.clientX,
				y: e.clientY,
				t: Date.now(),
				id: e.pointerId,
			};
		},
		[isSwipeEnabled],
	);

	const handleSwipePointerUp = useCallback(
		(e: ReactPointerEvent<HTMLDivElement>) => {
			const start = swipeStart.current;
			swipeStart.current = null;
			if (!start || start.id !== e.pointerId) return;
			const dx = e.clientX - start.x;
			const dy = e.clientY - start.y;
			if (Date.now() - start.t > 800) return;
			if (Math.abs(dx) < SWIPE_THRESHOLD) return;
			if (Math.abs(dx) < Math.abs(dy) * 1.5) return;
			if (window.getSelection()?.toString()) return;
			if (dx < 0) goToNextQuestion();
			else goToPreviousQuestion();
		},
		[goToNextQuestion, goToPreviousQuestion],
	);

	const handleSwipePointerCancel = useCallback(() => {
		swipeStart.current = null;
	}, []);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen bg-page-gradient px-4">
				<div className="card-pop animate-pop-in text-center p-8 sm:p-10 max-w-sm w-full">
					<div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-pop-violet-soft text-pop-violet-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_35%,transparent)]">
						<Loader2 className="size-8 animate-spin" strokeWidth={2.5} />
					</div>
					<p className="text-lg font-extrabold text-foreground">
						Шалгалт ачааллаж байна...
					</p>
				</div>
			</div>
		);
	}

	if (error || !examData) {
		return (
			<div className="flex justify-center items-center min-h-screen bg-page-gradient px-4">
				<div className="card-pop animate-pop-in text-center p-8 max-w-md w-full">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-4xl">
						😵
					</div>
					<p className="text-xl font-black text-destructive mb-2">
						Алдаа гарлаа
					</p>
					<p className="text-sm font-semibold text-muted-foreground">
						{error?.message || "Шалгалт олдсонгүй"}
					</p>
					<Button
						onClick={() => window.location.reload()}
						className="mt-6"
						variant="outline"
					>
						Дахин оролдох
					</Button>
				</div>
			</div>
		);
	}

	if (allQuestions.length === 0) {
		return (
			<div className="flex justify-center items-center min-h-screen bg-page-gradient px-4">
				<div className="card-pop animate-pop-in text-center p-8 max-w-md w-full">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-pop-sun-soft text-4xl">
						📭
					</div>
					<p className="text-xl font-black text-foreground">
						Энэ шалгалтад асуулт байхгүй
					</p>
				</div>
			</div>
		);
	}

	const currentQuestion = allQuestions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === totalCount - 1;
	const examInfo = examData?.ExamInfo?.[0];
	const pendingCount = pendingAnswers.current.size;
	const unansweredList = allQuestions
		.map((q, index) => ({ q, index }))
		.filter(({ q }) => !answeredQuestionIds.has(q.question_id));
	const answeredList = allQuestions
		.map((q, index) => ({ q, index }))
		.filter(({ q }) => answeredQuestionIds.has(q.question_id));

	const savePill = isSaving ? (
		<span
			aria-live="polite"
			className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-pop-sky-soft px-3 text-xs font-extrabold text-pop-sky-ink"
		>
			<Loader2 className="size-3.5 animate-spin" strokeWidth={2.75} />
			<span className="hidden sm:inline">Хадгалж байна...</span>
		</span>
	) : pendingCount > 0 && !isTimeUp ? (
		<button
			type="button"
			onClick={handleManualSave}
			aria-live="polite"
			className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-pop-sun-soft px-3 text-xs font-extrabold text-pop-sun-ink shadow-[0_2px_0_0_color-mix(in_oklch,var(--pop-sun)_45%,transparent)] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-none"
		>
			<Save className="size-3.5" strokeWidth={2.75} />
			<span className="hidden sm:inline">Хадгалах</span>
			<span className="tabular-nums">({pendingCount})</span>
		</button>
	) : (
		<span
			aria-live="polite"
			className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-pop-mint-soft px-3 text-xs font-extrabold text-pop-mint-ink"
		>
			<CloudCheck className="size-3.5" strokeWidth={2.75} />
			<span className="hidden sm:inline">Хадгалсан</span>
		</span>
	);

	const viewToggle = (
		<div className="hidden shrink-0 gap-1 rounded-full border-2 border-border bg-muted p-1 md:flex">
			<button
				type="button"
				onClick={() => {
					setViewMode("card");
					window.scrollTo({ top: 0, behavior: "smooth" });
				}}
				aria-pressed={viewMode === "card"}
				className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold transition-colors ${
					viewMode === "card"
						? "bg-primary text-primary-foreground shadow-[0_2px_0_0_var(--primary-shade)]"
						: "text-muted-foreground hover:bg-accent hover:text-foreground"
				}`}
			>
				<LayoutGrid className="w-4 h-4" />
				Карт
			</button>
			<button
				type="button"
				onClick={() => setViewMode("scroll")}
				aria-pressed={viewMode === "scroll"}
				className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold transition-colors ${
					viewMode === "scroll"
						? "bg-primary text-primary-foreground shadow-[0_2px_0_0_var(--primary-shade)]"
						: "text-muted-foreground hover:bg-accent hover:text-foreground"
				}`}
			>
				<List className="w-4 h-4" />
				Жагсаалт
			</button>
		</div>
	);

	const renderQuestionCard = (
		q: (typeof allQuestions)[0],
		index: number,
		focus: boolean,
	) => (
		<Card
			className={`gap-0 py-0 transition-colors ${focus ? "animate-pop-in" : ""} ${getCardBorderClass(q.question_id)}`}
		>
			<CardContent className={focus ? "p-5 sm:p-7" : "p-5 sm:p-6"}>
				<div className="flex items-center justify-between gap-2 mb-4">
					<span className="inline-flex items-center rounded-full bg-pop-violet-soft px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-pop-violet-ink">
						Асуулт {index + 1}
					</span>
					<div className="flex items-center gap-2 shrink-0">
						{typingQuestions.has(q.question_id) && (
							<div className="flex items-center gap-1 px-2.5 py-1.5 bg-pop-sky-soft rounded-full">
								<div className="flex gap-0.5">
									<span
										className="w-1.5 h-1.5 bg-pop-sky rounded-full animate-bounce"
										style={{ animationDelay: "0ms" }}
									/>
									<span
										className="w-1.5 h-1.5 bg-pop-sky rounded-full animate-bounce"
										style={{ animationDelay: "150ms" }}
									/>
									<span
										className="w-1.5 h-1.5 bg-pop-sky rounded-full animate-bounce"
										style={{ animationDelay: "300ms" }}
									/>
								</div>
							</div>
						)}
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => toggleBookmark(q.question_id)}
							className="rounded-xl"
							title={
								bookmarkedQuestions.has(q.question_id)
									? "Тэмдэглэгээ хасах"
									: "Тэмдэглэх"
							}
						>
							{bookmarkedQuestions.has(q.question_id) ? (
								<BookmarkCheck className="w-5 h-5 text-pop-sun fill-pop-sun" />
							) : (
								<Bookmark className="w-5 h-5 text-muted-foreground" />
							)}
						</Button>
					</div>
				</div>
				<div
					className={`font-bold text-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert ${
						focus ? "text-lg sm:text-xl mb-6" : "text-lg mb-5"
					}`}
				>
					<MathContent html={q.question_name} />
				</div>
				{renderQuestion(q)}
			</CardContent>
		</Card>
	);

	return (
		<div className="min-h-screen bg-page-gradient">
			{saveError && (
				<div className="fixed top-4 right-4 z-50 bg-destructive text-white font-bold px-5 py-3 rounded-2xl shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_70%,black)] animate-pop-in">
					{saveError}
				</div>
			)}

			{/* ── Sticky top bar ── */}
			<header className="sticky top-0 z-30 bg-page-gradient px-3 pt-2 pb-2 sm:px-6 sm:pt-3">
				<div className="card-pop mx-auto max-w-[1400px] space-y-2.5 p-2.5 sm:p-3">
					<div className="flex items-center gap-2 sm:gap-3">
						<div className="hidden shrink-0 lg:block">
							<StyledBackButton
								showConfirm={true}
								confirmMessage="Та гарахдаа итгэлтэй байна уу?"
							/>
						</div>
						<button
							type="button"
							onClick={() => router.back()}
							aria-label="Буцах"
							className="group flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-card shadow-[0_3px_0_0_var(--border)] transition-all active:translate-y-0.5 active:shadow-none cursor-pointer lg:hidden"
						>
							<ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:-translate-x-0.5 transition-transform" />
						</button>

						{examInfo && (
							<div className="hidden min-w-0 flex-1 lg:block">
								<ExamHeader examInfo={examInfo} />
							</div>
						)}

						<div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
							{examInfo?.starteddate ? (
								<ExamTimer onElapsedChange={handleElapsedTimeChange} compact />
							) : (
								<span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-pop-sky-soft px-3 text-pop-sky-ink">
									<Clock className="w-4 h-4 shrink-0" strokeWidth={2.5} />
									<span className="text-sm font-black tabular-nums">
										{(() => {
											const h = Math.floor(elapsedExamTime / 3600);
											const m = Math.floor((elapsedExamTime % 3600) / 60);
											const s = elapsedExamTime % 60;
											if (h > 0)
												return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
											return `${m}:${s.toString().padStart(2, "0")}`;
										})()}
									</span>
								</span>
							)}
							{savePill}
						</div>

						{viewToggle}

						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowMobileMinimapOverlay(true)}
							className="h-10 shrink-0 text-primary xl:hidden"
							aria-label="Асуултууд"
						>
							<Menu className="w-4 h-4" strokeWidth={2.75} />
							<span className="hidden text-xs font-extrabold sm:inline">
								Асуултууд
							</span>
						</Button>

						{examInfo && !isTimeUp && (
							<div className="hidden shrink-0 sm:block">
								<FinishExamResultDialog
									ref={finishDialogRef}
									examId={examInfo.id}
									examType={examInfo.exam_type}
									startEid={examInfo.start_eid}
									elapsedSeconds={elapsedExamTime}
									answeredCount={answeredCount}
									totalCount={totalCount}
									onRequestFinish={openReview}
									triggerClassName="h-10 px-4 text-sm"
								/>
							</div>
						)}
						<Button
							variant="success"
							size="icon"
							onClick={openReview}
							className="size-10 shrink-0 sm:hidden"
							aria-label="Шалгах"
						>
							<ClipboardCheck className="size-5" strokeWidth={2.5} />
						</Button>
					</div>

					{/* Segmented progress */}
					<div className="flex items-center gap-3 px-0.5">
						<span className="shrink-0 text-sm font-black text-foreground tabular-nums">
							Асуулт {currentQuestionIndex + 1}
							<span className="text-muted-foreground"> / {totalCount}</span>
						</span>
						<div
							className="flex h-2.5 min-w-0 flex-1 gap-[2px]"
							role="progressbar"
							aria-valuemin={0}
							aria-valuemax={totalCount}
							aria-valuenow={answeredCount}
							aria-label="Хариулсан асуулт"
						>
							{allQuestions.map((q, idx) => {
								const answered = answeredQuestionIds.has(q.question_id);
								const isCurrent = idx === currentQuestionIndex;
								const marked = bookmarkedQuestions.has(q.question_id);
								return (
									<span
										key={q.question_id}
										className={`h-full min-w-0 flex-1 rounded-full transition-all duration-300 first:rounded-l-full last:rounded-r-full ${
											isCurrent
												? "bg-pop-sky scale-y-[1.35] shadow-[0_0_0_1.5px_var(--card)]"
												: answered
													? marked
														? "bg-pop-sun"
														: "bg-primary"
													: marked
														? "bg-pop-sun/45"
														: "bg-muted"
										}`}
									/>
								);
							})}
						</div>
						<span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pop-mint-soft px-2.5 py-0.5 text-xs font-extrabold text-pop-mint-ink tabular-nums">
							<CheckCircle2 className="size-3.5" strokeWidth={2.5} />
							{answeredCount}/{totalCount}
						</span>
					</div>
				</div>
			</header>

			<div className="mx-auto max-w-[1400px] px-3 pt-3 pb-32 sm:px-6 xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-8">
				<main className="mx-auto w-full min-w-0 max-w-3xl">
					{examInfo && (
						<div className="mb-3 px-1 lg:hidden">
							<ExamHeader examInfo={examInfo} />
						</div>
					)}

					{viewMode === "card" ? (
						currentQuestion && (
							<div
								onPointerDown={handleSwipePointerDown}
								onPointerUp={handleSwipePointerUp}
								onPointerCancel={handleSwipePointerCancel}
								style={isSwipeEnabled ? { touchAction: "pan-y" } : undefined}
							>
								<div key={currentQuestion.question_id}>
									{renderQuestionCard(currentQuestion, currentQuestionIndex, true)}
								</div>
								<p className="mt-3 text-center text-xs font-bold text-muted-foreground">
									<span className="hidden lg:inline">
										← → товчоор асуулт солино
									</span>
									<span className="lg:hidden">
										Хажуу тийш шударч асуулт солино
									</span>
								</p>
							</div>
						)
					) : (
						<div className="space-y-5">
							{allQuestions.map((q, index) => (
								<div
									key={q.question_id}
									id={`question-${index}`}
									className="scroll-mt-40"
								>
									{renderQuestionCard(q, index, false)}
								</div>
							))}
						</div>
					)}
				</main>

				{/* xl: slim navigator rail */}
				<aside className="hidden xl:block">
					<div className="sticky top-36 space-y-3">
						<ExamMinimap
							totalCount={totalCount}
							answeredCount={answeredCount}
							currentQuestionIndex={currentQuestionIndex}
							selectedAnswers={selectedAnswers}
							questions={allQuestions}
							onQuestionClick={jumpToQuestion}
							bookmarkedQuestions={bookmarkedQuestions}
						/>
						<Button variant="outline" className="w-full" onClick={openReview}>
							<ClipboardCheck className="size-4" strokeWidth={2.5} />
							Шалгах
						</Button>
					</div>
				</aside>
			</div>

			{/* ── Sticky bottom action bar ── */}
			<div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-card">
				<div className="mx-auto flex max-w-3xl gap-3 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
					{viewMode === "card" ? (
						<>
							<Button
								onClick={goToPreviousQuestion}
								disabled={currentQuestionIndex === 0}
								variant="outline"
								size="lg"
								className="h-12 flex-1 text-base"
							>
								<ChevronLeft className="size-5" strokeWidth={2.75} />
								Өмнөх
							</Button>
							{isLastQuestion ? (
								<Button
									onClick={openReview}
									variant="success"
									size="lg"
									className="h-12 flex-1 text-base"
								>
									<ClipboardCheck className="size-5" strokeWidth={2.5} />
									Шалгах
								</Button>
							) : (
								<Button
									onClick={goToNextQuestion}
									size="lg"
									className="h-12 flex-1 text-base"
								>
									Дараах
									<ChevronRight className="size-5" strokeWidth={2.75} />
								</Button>
							)}
						</>
					) : (
						<Button
							onClick={openReview}
							variant="success"
							size="lg"
							className="h-12 flex-1 text-base"
						>
							<ClipboardCheck className="size-5" strokeWidth={2.5} />
							Шалгах
						</Button>
					)}
				</div>
			</div>

			{/* ── Navigator sheet ── */}
			<Sheet
				open={showMobileMinimapOverlay}
				onOpenChange={setShowMobileMinimapOverlay}
			>
				<SheetContent
					side="right"
					className="w-[88vw] gap-0 overflow-y-auto bg-background p-4 sm:max-w-md"
				>
					<SheetHeader className="p-0 pr-8 pb-3">
						<SheetTitle className="text-lg font-black">☰ Асуултууд</SheetTitle>
						<SheetDescription className="font-semibold">
							{answeredCount}/{totalCount} хариулсан
						</SheetDescription>
					</SheetHeader>
					<ExamMinimap
						totalCount={totalCount}
						answeredCount={answeredCount}
						currentQuestionIndex={currentQuestionIndex}
						selectedAnswers={selectedAnswers}
						questions={allQuestions}
						onQuestionClick={jumpToQuestion}
						bookmarkedQuestions={bookmarkedQuestions}
					/>
					<Button
						variant="success"
						size="lg"
						className="mt-4 w-full"
						onClick={openReview}
					>
						<ClipboardCheck className="size-5" strokeWidth={2.5} />
						Шалгах
					</Button>
				</SheetContent>
			</Sheet>

			{/* ── Review before finish ── */}
			<Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
				<DialogContent className="w-full sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
					<DialogHeader className="text-center sm:text-center items-center space-y-2">
						<div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-pop-mint-soft text-pop-mint-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-mint)_35%,transparent)]">
							<ClipboardCheck className="size-7" strokeWidth={2.5} />
						</div>
						<DialogTitle className="text-2xl font-black">
							Хариултаа шалгах
						</DialogTitle>
						<DialogDescription className="font-semibold">
							Асуулт дээр дарж буцаж засварлах боломжтой.
						</DialogDescription>
					</DialogHeader>

					<div className="grid grid-cols-3 gap-2 py-2">
						<div className="rounded-2xl bg-pop-mint-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-mint-ink tabular-nums">
								{answeredCount}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-mint-ink sm:text-xs">
								Хариулсан
							</div>
						</div>
						<div className="rounded-2xl bg-pop-coral-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-coral-ink tabular-nums">
								{totalCount - answeredCount}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-coral-ink sm:text-xs">
								Хариулаагүй
							</div>
						</div>
						<div className="rounded-2xl bg-pop-sun-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-sun-ink tabular-nums">
								{bookmarkedQuestions.size}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-sun-ink sm:text-xs">
								Тэмдэглэсэн
							</div>
						</div>
					</div>

					<section className="space-y-2">
						<h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
							<span className="size-2.5 rounded-full bg-pop-coral" />
							Хариулаагүй ({unansweredList.length})
						</h3>
						{unansweredList.length === 0 ? (
							<p className="rounded-2xl bg-pop-mint-soft px-4 py-3 text-sm font-bold text-pop-mint-ink">
								🎉 Бүх асуултад хариулсан байна!
							</p>
						) : (
							<div className="flex flex-wrap gap-2">
								{unansweredList.map(({ q, index }) => (
									<button
										key={q.question_id}
										type="button"
										onClick={() => jumpToQuestion(index)}
										className="relative inline-flex h-9 min-w-11 items-center justify-center rounded-full border-2 border-pop-coral/50 bg-pop-coral-soft px-3 text-sm font-black text-pop-coral-ink tabular-nums transition-all hover:-translate-y-0.5 active:translate-y-0"
									>
										{index + 1}
										{bookmarkedQuestions.has(q.question_id) && (
											<Bookmark className="absolute -top-1.5 -right-1 size-3.5 fill-pop-sun text-pop-sun" />
										)}
									</button>
								))}
							</div>
						)}
					</section>

					<section className="space-y-2 pt-3">
						<h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
							<span className="size-2.5 rounded-full bg-primary" />
							Хариулсан ({answeredList.length})
						</h3>
						{answeredList.length === 0 ? (
							<p className="text-sm font-semibold text-muted-foreground">—</p>
						) : (
							<div className="flex flex-wrap gap-2">
								{answeredList.map(({ q, index }) => (
									<button
										key={q.question_id}
										type="button"
										onClick={() => jumpToQuestion(index)}
										className="relative inline-flex h-9 min-w-11 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 px-3 text-sm font-black text-primary tabular-nums transition-all hover:-translate-y-0.5 active:translate-y-0"
									>
										{index + 1}
										{bookmarkedQuestions.has(q.question_id) && (
											<Bookmark className="absolute -top-1.5 -right-1 size-3.5 fill-pop-sun text-pop-sun" />
										)}
									</button>
								))}
							</div>
						)}
					</section>

					<DialogFooter className="mt-2 flex flex-col gap-3 border-t-2 border-border pt-4 sm:flex-row">
						<Button
							variant="outline"
							onClick={() => setIsReviewOpen(false)}
							className="h-12 flex-1"
						>
							<ChevronLeft className="size-4" />
							Буцах
						</Button>
						{examInfo && !isTimeUp && (
							<Button
								variant="success"
								onClick={finishFromReview}
								className="h-12 flex-1"
							>
								<Send className="size-4" />
								Сорил дуусгах
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="[&_button]:bottom-24">
				<FixedScrollButton />
			</div>
		</div>
	);
}
