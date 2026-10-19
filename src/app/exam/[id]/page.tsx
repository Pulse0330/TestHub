"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Bookmark,
	BookmarkCheck,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	CircleDashed,
	CloudCheck,
	Flag,
	Keyboard,
	List,
	ListChecks,
	Loader2,
	LogOut,
	Menu,
	RectangleVertical,
	Save,
	Send,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FinishExamResultDialog, {
	type FinishExamDialogHandle,
} from "@/app/exam/component/finish";
import ExamMinimap from "@/app/exam/component/minimap";
import FillInTheBlankQuestion from "@/app/exam/component/question/fillblank";
import MatchingByLine from "@/app/exam/component/question/matching";
import MultiSelectQuestion from "@/app/exam/component/question/multiselect";
import NumberInputQuestion from "@/app/exam/component/question/numberinput";
import DragAndDropQuestion from "@/app/exam/component/question/order";
import SingleSelectQuestion from "@/app/exam/component/question/singleSelect";
import FixedScrollButton from "@/components/FixedScrollButton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { AdvancedExamProctor } from "../component/examguard";
import { ExamHeader } from "../component/examUtils/examInfo";
import MathContent from "../component/examUtils/MathContent";
import { SourceBlock } from "../component/examUtils/sourceCard";
import ExamTimer from "../component/Itime";
import QuestionImage from "../component/question/questionImage";

const SAVE_DELAYS = {
	DEFAULT: 1000,
	TYPE_3_NUMBER: 1500,
	TYPE_4_FILL: 1500,
	TYPE_5_ORDER: 2000,
	TYPE_6_MATCH: 3000,
} as const;

const BATCH_SIZE = 5;
/** Minimum horizontal travel (px) for a swipe to change the question. */
const SWIPE_THRESHOLD = 60;
/** Drag-based question types: swipe navigation is disabled for them. */
const SWIPE_DISABLED_TYPES = [5, 6];

/** Same "answered" rule as `answeredCount` below. */
const isAnswerFilled = (ans: AnswerValue | undefined): boolean => {
	if (ans == null) return false;
	if (Array.isArray(ans)) return ans.length > 0;
	if (typeof ans === "string") return ans.trim() !== "";
	if (typeof ans === "number") return ans !== 0 && !Number.isNaN(ans);
	return Object.keys(ans).length > 0;
};
const TYPING_INDICATOR_DELAY = 1500;
interface PendingAnswer {
	questionId: number;
	answer: AnswerValue;
	queTypeId: number;
	rowNum: number;
	timestamp: number;
}

const normalizeMatchingAnswer = (
	answer: Record<number, number | number[]>,
): Map<number, number[]> => {
	const normalized = new Map<number, number[]>();

	Object.entries(answer).forEach(([qRefIdStr, value]) => {
		const qRefId = Number(qRefIdStr);
		const aRefIds = Array.isArray(value) ? value : [value];

		// Filter out invalid IDs
		const validIds = aRefIds.filter(
			(id) => id && id !== 0 && !Number.isNaN(id),
		);

		if (validIds.length > 0) {
			normalized.set(qRefId, validIds);
		}
	});

	return normalized;
};

const extractAnswerIds = (matches: Map<number, number[]>): Set<number> => {
	const ids = new Set<number>();

	for (const aRefIds of matches.values()) {
		for (const id of aRefIds) {
			ids.add(id);
		}
	}
	return ids;
};

const areAnswersEqual = (
	a: AnswerValue | undefined,
	b: AnswerValue | undefined,
): boolean => {
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

		const aRecord = a as Record<number, number | number[] | string>;
		const bRecord = b as Record<number, number | number[] | string>;

		return aKeys.every((key) => {
			const numKey = Number(key);
			const aVal = aRecord[numKey];
			const bVal = bRecord[numKey];

			if (Array.isArray(aVal) && Array.isArray(bVal)) {
				if (aVal.length !== bVal.length) return false;
				return aVal.every((v, i) => v === bVal[i]);
			}

			return aVal === bVal;
		});
	}

	return false;
};

export default function ExamPage() {
	const { userId } = useAuthStore();
	const { id } = useParams();

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
	const [isTimeUp, setIsTimeUp] = useState(false);
	const [showMobileMinimapOverlay, setShowMobileMinimapOverlay] =
		useState(false);
	const router = useRouter();
	const savingQuestions = useRef<Set<number>>(new Set());
	const finishDialogRef = useRef<FinishExamDialogHandle>(null);
	const hasAutoFinished = useRef(false);
	const isAutoSubmitting = useRef(false);
	const typingTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());
	const pendingAnswers = useRef<Map<number, PendingAnswer>>(new Map());
	const saveTimer = useRef<NodeJS.Timeout | null>(null);
	const lastSavedAnswers = useRef<Map<number, AnswerValue>>(new Map());
	const isSavingRef = useRef(false);
	const [showExitConfirm, setShowExitConfirm] = useState(false);
	// Focus mode (one question at a time) is the default; list mode is optional.
	const [viewMode, setViewMode] = useState<"focus" | "list">("focus");
	const [showReview, setShowReview] = useState(false);
	const swipeStart = useRef<{ x: number; y: number; id: number } | null>(
		null,
	);
	const programmaticScrollUntil = useRef(0);
	const {
		data: examData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["exam", userId, id],
		queryFn: () => getExamById(userId || 0, Number(id)),
		enabled: !!userId && !!id,
	});

	const saveQuestion = useCallback(
		async (pending: PendingAnswer, examId: number): Promise<boolean> => {
			const { questionId, answer, queTypeId, rowNum } = pending;

			// Prevent race conditions
			if (savingQuestions.current.has(questionId)) {
				console.log(`⚠️ Q${questionId} already saving, skipping...`);
				return false;
			}

			try {
				savingQuestions.current.add(questionId);
				const previousAnswer = lastSavedAnswers.current.get(questionId);
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
					} catch (error) {
						console.error(`Failed to delete Type 1 Q${questionId}:`, error);
					}
				}

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
					} catch (error) {
						console.error(`Failed to delete Type 2 Q${questionId}:`, error);
					}
				}

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
								.filter((id) => id && id !== 0 && prevMap[id]?.trim());

							if (prevIds.length > 0) {
								await Promise.allSettled(
									prevIds.map((answerId) =>
										deleteExamAnswer(userId || 0, examId, questionId, answerId),
									),
								);
							}
						}
					} catch (error) {
						console.error(`Failed to delete Type 3 Q${questionId}:`, error);
					}
				}

				if (queTypeId === 4 && previousAnswer !== undefined) {
					try {
						const type4Answer = examData?.Answers?.find(
							(ans) => ans.question_id === questionId && ans.answer_type === 4,
						);
						if (type4Answer) {
							await deleteExamAnswer(
								userId || 0,
								examId,
								questionId,
								type4Answer.answer_id,
							);
						}
					} catch (error) {
						console.error(`Failed to delete Type 4 Q${questionId}:`, error);
					}
				}

				if (
					queTypeId === 5 &&
					Array.isArray(previousAnswer) &&
					previousAnswer.length > 0
				) {
					try {
						const validPrevAnswers = previousAnswer.filter(
							(id) => id && id !== 0 && !Number.isNaN(id),
						);

						if (validPrevAnswers.length > 0) {
							await Promise.allSettled(
								validPrevAnswers.map((answerId) =>
									deleteExamAnswer(userId || 0, examId, questionId, answerId),
								),
							);
						}
					} catch (error) {
						console.error(`Failed to delete Type 5 Q${questionId}:`, error);
					}
				}

				if (
					queTypeId === 6 &&
					typeof answer === "object" &&
					answer !== null &&
					!Array.isArray(answer)
				) {
					const currentMatches = normalizeMatchingAnswer(
						answer as Record<number, number | number[]>,
					);
					const currentAnswerIds = extractAnswerIds(currentMatches);

					const previousAnswerIds = new Set<number>();
					if (
						typeof previousAnswer === "object" &&
						previousAnswer !== null &&
						!Array.isArray(previousAnswer)
					) {
						const previousMatches = normalizeMatchingAnswer(
							previousAnswer as Record<number, number | number[]>,
						);

						for (const aRefIds of previousMatches.values()) {
							for (const id of aRefIds) {
								previousAnswerIds.add(id);
							}
						}
					}

					const answersToDelete = Array.from(previousAnswerIds).filter(
						(id) => !currentAnswerIds.has(id),
					);

					if (answersToDelete.length > 0) {
						console.log(
							`🗑️ Type 6 Q${questionId}: Deleting ${answersToDelete.length} changed answers`,
						);
						try {
							await Promise.allSettled(
								answersToDelete.map((answerId) =>
									deleteExamAnswer(userId || 0, examId, questionId, answerId),
								),
							);
						} catch (error) {
							console.error(`Failed to delete Type 6 Q${questionId}:`, error);
						}
					}
				}

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

				if (
					queTypeId === 3 &&
					typeof answer === "object" &&
					answer !== null &&
					!Array.isArray(answer)
				) {
					const valuesMap = answer as Record<number, string>;
					const entries = Object.entries(valuesMap)
						.map(([k, v]) => [Number(k), v as string] as [number, string])
						.filter(([aid, val]) => aid && aid !== 0 && val.trim());

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

				if (queTypeId === 4 && typeof answer === "string" && answer.trim()) {
					const type4Answer = examData?.Answers?.find(
						(ans) => ans.question_id === questionId && ans.answer_type === 4,
					);
					if (type4Answer) {
						await saveExamAnswer(
							userId || 0,
							examId,
							questionId,
							type4Answer.answer_id,
							queTypeId,
							answer,
							rowNum,
						);
					}
				}

				if (queTypeId === 5 && Array.isArray(answer) && answer.length > 0) {
					const validAnswers = answer.filter(
						(id) =>
							id && id !== 0 && !Number.isNaN(id) && typeof id === "number",
					);

					if (validAnswers.length > 0) {
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
					}
				}

				if (
					queTypeId === 6 &&
					typeof answer === "object" &&
					answer !== null &&
					!Array.isArray(answer)
				) {
					const currentMatches = normalizeMatchingAnswer(
						answer as Record<number, number | number[]>,
					);
					const savePromises: Promise<unknown>[] = [];

					for (const [qRefId, aRefIds] of currentMatches.entries()) {
						for (const aRefId of aRefIds) {
							savePromises.push(
								saveExamAnswer(
									userId || 0,
									examId,
									questionId,
									aRefId,
									queTypeId,
									String(qRefId),
									rowNum,
								),
							);
						}
					}

					if (savePromises.length > 0) {
						await Promise.all(savePromises);
					}
				}

				lastSavedAnswers.current.set(questionId, answer);
				return true;
			} catch (error) {
				console.error(`❌ Failed to save Q${questionId}:`, error);
				return false;
			} finally {
				savingQuestions.current.delete(questionId);
			}
		},
		[userId, examData],
	);

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

	const scheduleAutoSave = useCallback(
		(delay: number = SAVE_DELAYS.DEFAULT) => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
			saveTimer.current = setTimeout(() => {
				processPendingAnswers();
			}, delay);
		},
		[processPendingAnswers],
	);

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

			const typingTimer = setTimeout(() => {
				setTypingQuestions((prev) => {
					const newSet = new Set(prev);
					newSet.delete(questionId);
					return newSet;
				});
				typingTimers.current.delete(questionId);
			}, TYPING_INDICATOR_DELAY);

			typingTimers.current.set(questionId, typingTimer);

			setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));

			pendingAnswers.current.set(questionId, {
				questionId,
				answer,
				queTypeId,
				rowNum,
				timestamp: Date.now(),
			});

			const delay =
				queTypeId === 6
					? SAVE_DELAYS.TYPE_6_MATCH
					: queTypeId === 5
						? SAVE_DELAYS.TYPE_5_ORDER
						: queTypeId === 4
							? SAVE_DELAYS.TYPE_4_FILL
							: queTypeId === 3
								? SAVE_DELAYS.TYPE_3_NUMBER
								: SAVE_DELAYS.DEFAULT;

			scheduleAutoSave(delay);
		},
		[examData, scheduleAutoSave],
	);

	const handleManualSave = useCallback(() => {
		if (saveTimer.current) clearTimeout(saveTimer.current);
		processPendingAnswers();
	}, [processPendingAnswers]);

	const handleAutoSubmit = useCallback(async () => {
		if (hasAutoFinished.current || isAutoSubmitting.current) {
			console.log("⚠️ Auto-submit already in progress");
			return;
		}

		hasAutoFinished.current = true;
		isAutoSubmitting.current = true;

		console.log("🔴 Time's up - Auto-submitting...");

		try {
			if (pendingAnswers.current.size > 0) {
				console.log(
					`💾 Saving ${pendingAnswers.current.size} pending answers...`,
				);
				await processPendingAnswers();
				console.log("✅ All answers saved");
			}

			const examInfo = examData?.ExamInfo?.[0];
			if (!examInfo) {
				console.error("❌ Exam info not found");
				return;
			}

			console.log("📤 Submitting exam...");
			finishDialogRef.current?.triggerFinish();
		} catch (error) {
			console.error("❌ Auto submit error:", error);
			hasAutoFinished.current = false;
			isAutoSubmitting.current = false;
		}
	}, [processPendingAnswers, examData]);
	useEffect(() => {
		const url = window.location.href;

		// Stack дүүргэх
		for (let i = 0; i < 50; i++) {
			window.history.pushState(null, "", url);
		}

		function blockBack() {
			window.history.pushState(null, "", url);
		}

		window.addEventListener("popstate", blockBack);

		return () => {
			window.removeEventListener("popstate", blockBack);
		};
	}, []);

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

			switch (QueType) {
				case 1: {
					const lastItem = items[items.length - 1];
					const ansId = lastItem.AnsID ?? null;
					answersMap[QueID] = ansId && ansId !== 0 ? ansId : null;
					break;
				}
				case 2: {
					const uniqueIds = [
						...new Set(
							items
								.map((i) => i.AnsID)
								.filter((id): id is number => id !== null && id !== 0),
						),
					];
					answersMap[QueID] = uniqueIds;
					break;
				}

				case 3: {
					const map: Record<number, string> = {};
					items.forEach((it) => {
						const ansId = it.AnsID ?? 0;
						const val = (it as { Answer?: string }).Answer ?? "";
						if (ansId && ansId !== 0) {
							map[ansId] = val;
						}
					});
					answersMap[QueID] = map;
					break;
				}

				case 4: {
					const lastItem = items[items.length - 1];
					answersMap[QueID] = (lastItem as { Answer?: string }).Answer || "";
					break;
				}

				case 5: {
					// Drag and drop
					const sortedItems = [...items].sort((a, b) => {
						const aOrder = Number((a as { Answer?: string }).Answer) || 999;
						const bOrder = Number((b as { Answer?: string }).Answer) || 999;
						return aOrder - bOrder;
					});
					answersMap[QueID] = sortedItems
						.map((i) => i.AnsID)
						.filter((id): id is number => id !== null && id !== 0);
					break;
				}

				case 6: {
					// Matching
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
					break;
				}
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
				if (ans.trim()) count++;
			} else if (typeof ans === "number") {
				if (ans !== 0 && !Number.isNaN(ans)) count++;
			} else {
				// Object - has at least one property
				if (Object.keys(ans).length > 0) count++;
			}
		}

		return count;
	}, [selectedAnswers]);

	const toggleBookmark = useCallback((questionId: number) => {
		setBookmarkedQuestions((prev) => {
			const newSet = new Set(prev);
			newSet.has(questionId)
				? newSet.delete(questionId)
				: newSet.add(questionId);
			return newSet;
		});
	}, []);

	const jumpToCard = useCallback((index: number) => {
		requestAnimationFrame(() => {
			document
				.getElementById(`question-${index}`)
				?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
	}, []);

	const goToQuestion = useCallback(
		(index: number) => {
			if (index < 0 || index >= totalCount) return;
			setCurrentQuestionIndex(index);
			if (viewMode === "list") {
				programmaticScrollUntil.current = Date.now() + 900;
				jumpToCard(index);
			} else {
				window.scrollTo({ top: 0, behavior: "smooth" });
			}
		},
		[totalCount, viewMode, jumpToCard],
	);

	const goToPreviousQuestion = useCallback(() => {
		if (currentQuestionIndex > 0) {
			goToQuestion(currentQuestionIndex - 1);
		}
	}, [currentQuestionIndex, goToQuestion]);

	const goToNextQuestion = useCallback(() => {
		if (currentQuestionIndex < totalCount - 1) {
			goToQuestion(currentQuestionIndex + 1);
		}
	}, [currentQuestionIndex, totalCount, goToQuestion]);

	// Jump from inside a Sheet/Dialog: in list mode wait for the overlay to
	// close (it locks page scroll) before scrolling to the card.
	const jumpFromOverlay = useCallback(
		(index: number) => {
			if (viewMode === "list") {
				setCurrentQuestionIndex(index);
				setTimeout(() => goToQuestion(index), 320);
			} else {
				goToQuestion(index);
			}
		},
		[viewMode, goToQuestion],
	);

	const switchViewMode = useCallback(
		(mode: "focus" | "list") => {
			if (mode === viewMode) return;
			setViewMode(mode);
			if (mode === "list") {
				programmaticScrollUntil.current = Date.now() + 900;
				setTimeout(() => {
					document
						.getElementById(`question-${currentQuestionIndex}`)
						?.scrollIntoView({ block: "start" });
				}, 30);
			} else {
				window.scrollTo({ top: 0 });
			}
		},
		[viewMode, currentQuestionIndex],
	);

	const finishFromReview = useCallback(() => {
		setShowReview(false);
		// Let the review dialog close before opening the existing confirm dialog
		setTimeout(() => finishDialogRef.current?.openConfirm(), 200);
	}, []);

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
				isAnswered = Object.keys(answer).length > 0;
			}

			const isBookmarked = bookmarkedQuestions.has(questionId);
			const isTypingNow = typingQuestions.has(questionId);

			if (isTypingNow)
				return "border-pop-sky shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sky)_45%,transparent)]";
			if (isAnswered && isBookmarked)
				return "border-warning shadow-[0_4px_0_0_color-mix(in_oklch,var(--warning)_55%,transparent)]";
			if (isAnswered)
				return "border-primary/50 shadow-[0_4px_0_0_color-mix(in_oklch,var(--primary)_35%,transparent)]";
			if (isBookmarked)
				return "border-warning/70 shadow-[0_4px_0_0_color-mix(in_oklch,var(--warning)_40%,transparent)]";
			return "border-border";
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

	useEffect(() => {
		return () => {
			for (const timer of typingTimers.current.values()) {
				clearTimeout(timer);
			}
			typingTimers.current.clear();
			savingQuestions.current.clear();

			if (saveTimer.current) clearTimeout(saveTimer.current);
		};
	}, []);

	useEffect(() => {
		return () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
			if (pendingAnswers.current.size > 0) {
				processPendingAnswers();
			}
		};
	}, [processPendingAnswers]);


	// ── Review groups (answered / unanswered / bookmarked) ──
	const reviewGroups = useMemo(() => {
		const answered: number[] = [];
		const unanswered: number[] = [];
		const bookmarked: number[] = [];
		allQuestions.forEach((q, i) => {
			if (isAnswerFilled(selectedAnswers[q.question_id])) answered.push(i);
			else unanswered.push(i);
			if (bookmarkedQuestions.has(q.question_id)) bookmarked.push(i);
		});
		return { answered, unanswered, bookmarked };
	}, [allQuestions, selectedAnswers, bookmarkedQuestions]);

	// ── Keyboard: 1–9 / A–F pick an option (single-select), ← → navigate ──
	useEffect(() => {
		if (viewMode !== "focus") return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
			const target = e.target as HTMLElement | null;
			if (
				target?.closest?.(
					"input, textarea, select, [contenteditable=''], [contenteditable='true'], [data-rfd-drag-handle-draggable-id]",
				)
			)
				return;
			// Any open dialog / sheet / alert (incl. exam-guard overlay)
			if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
				return;

			if (e.key === "ArrowLeft") {
				e.preventDefault();
				goToPreviousQuestion();
				return;
			}
			if (e.key === "ArrowRight") {
				e.preventDefault();
				goToNextQuestion();
				return;
			}

			const q = allQuestions[currentQuestionIndex];
			if (!q || q.que_type_id !== 1) return;
			let optionIndex = -1;
			if (/^[1-9]$/.test(e.key)) optionIndex = Number(e.key) - 1;
			else if (/^[a-f]$/i.test(e.key))
				optionIndex = e.key.toUpperCase().charCodeAt(0) - 65;
			if (optionIndex < 0 || optionIndex >= q.answers.length) return;
			e.preventDefault();
			const answerId = q.answers[optionIndex].answer_id;
			// Same guard as SingleSelectQuestion's click handler
			if (selectedAnswers[q.question_id] === answerId) return;
			handleAnswerChange(q.question_id, answerId);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [
		viewMode,
		allQuestions,
		currentQuestionIndex,
		selectedAnswers,
		handleAnswerChange,
		goToPreviousQuestion,
		goToNextQuestion,
	]);

	// ── List mode: keep the current index in sync with scroll position ──
	useEffect(() => {
		if (viewMode !== "list" || totalCount === 0) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (Date.now() < programmaticScrollUntil.current) return;
				const hit = entries.find((en) => en.isIntersecting);
				if (!hit) return;
				const idx = Number(hit.target.getAttribute("data-q-index"));
				if (!Number.isNaN(idx)) setCurrentQuestionIndex(idx);
			},
			{ rootMargin: "-35% 0px -60% 0px" },
		);
		for (let i = 0; i < totalCount; i++) {
			const el = document.getElementById(`question-${i}`);
			if (el) observer.observe(el);
		}
		return () => observer.disconnect();
	}, [viewMode, totalCount]);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-page-gradient px-4">
				<div className="card-pop animate-pop-in p-8 text-center">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-primary/10">
						<Loader2 className="size-8 animate-spin text-primary" />
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
			<div className="flex h-screen items-center justify-center bg-page-gradient px-4">
				<div className="card-pop w-full max-w-md animate-pop-in p-8 text-center">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-destructive/10 text-3xl">
						😕
					</div>
					<p className="mb-2 text-xl font-black text-destructive">
						Алдаа гарлаа
					</p>
					<p className="text-sm font-semibold text-muted-foreground">
						{error?.message || "Шалгалт олдсонгүй"}
					</p>
					<Button
						onClick={() => window.location.reload()}
						className="mt-5"
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
			<div className="flex h-screen items-center justify-center bg-page-gradient px-4">
				<div className="card-pop animate-pop-in p-8 text-center">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-pop-sun-soft text-3xl">
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
	const pendingCount = pendingAnswers.current.size;
	const examInfo = examData?.ExamInfo?.[0];
	const swipeEnabled =
		viewMode === "focus" &&
		!!currentQuestion &&
		!SWIPE_DISABLED_TYPES.includes(currentQuestion.que_type_id);

	const handleNextOrReview = () => {
		if (isLastQuestion) {
			setShowReview(true);
		} else {
			goToNextQuestion();
		}
	};

	// ── Swipe (touch / pen only) on the focused question ──
	const onSwipePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!swipeEnabled || e.pointerType === "mouse" || !e.isPrimary) return;
		const target = e.target as HTMLElement;
		if (
			target.closest(
				"input, textarea, select, [contenteditable='true'], [data-rfd-drag-handle-draggable-id], [data-no-swipe]",
			)
		)
			return;
		swipeStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
	};
	const onSwipePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		const start = swipeStart.current;
		swipeStart.current = null;
		if (!start || start.id !== e.pointerId) return;
		const dx = e.clientX - start.x;
		const dy = e.clientY - start.y;
		if (Math.abs(dx) < SWIPE_THRESHOLD) return;
		if (Math.abs(dx) < Math.abs(dy) * 1.5) return; // mostly vertical → scroll
		if (dx < 0) goToNextQuestion();
		else goToPreviousQuestion();
	};
	const onSwipePointerCancel = () => {
		swipeStart.current = null;
	};

	const renderQuestionCard = (
		q: (typeof allQuestions)[0],
		index: number,
		isFocus: boolean,
	) => (
		<Card
			className={`gap-0 py-0 transition-colors ${getCardBorderClass(q.question_id)}`}
		>
			<CardContent className={isFocus ? "p-4 sm:p-6" : "p-4 sm:p-5 xl:p-6"}>
				<div className="mb-3 flex items-center justify-between gap-2">
					<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
						Асуулт {index + 1}
					</span>
					<div className="flex shrink-0 items-center gap-2">
						{typingQuestions.has(q.question_id) && (
							<div className="flex items-center gap-1 rounded-full bg-pop-sky-soft px-2.5 py-1.5">
								<div className="flex gap-0.5">
									<span
										className="size-1.5 animate-bounce rounded-full bg-pop-sky"
										style={{ animationDelay: "0ms" }}
									/>
									<span
										className="size-1.5 animate-bounce rounded-full bg-pop-sky"
										style={{ animationDelay: "150ms" }}
									/>
									<span
										className="size-1.5 animate-bounce rounded-full bg-pop-sky"
										style={{ animationDelay: "300ms" }}
									/>
								</div>
							</div>
						)}
						<Button
							variant="ghost"
							size="icon"
							onClick={() => toggleBookmark(q.question_id)}
							className="size-9 shrink-0 rounded-xl"
							title={
								bookmarkedQuestions.has(q.question_id)
									? "Тэмдэглэгээ хасах"
									: "Тэмдэглэх"
							}
						>
							{bookmarkedQuestions.has(q.question_id) ? (
								<BookmarkCheck className="size-5 fill-warning text-warning" />
							) : (
								<Bookmark className="size-5 text-muted-foreground" />
							)}
						</Button>
					</div>
				</div>
				<div className="mb-5 min-w-0">
					<div
						className={`prose prose-sm dark:prose-invert max-w-none font-semibold leading-relaxed text-foreground ${
							isFocus ? "text-base sm:text-lg" : "text-base lg:text-lg"
						}`}
					>
						<MathContent html={q.question_name} />
					</div>
				</div>
				<div className="min-w-0">{renderQuestion(q)}</div>
			</CardContent>
		</Card>
	);

	const reviewChip = (index: number, tone: "mint" | "coral" | "sun") => {
		const toneClass =
			tone === "mint"
				? "border-pop-mint/50 bg-pop-mint-soft text-pop-mint-ink"
				: tone === "coral"
					? "border-pop-coral/50 bg-pop-coral-soft text-pop-coral-ink"
					: "border-warning bg-pop-sun-soft text-pop-sun-ink";
		return (
			<button
				type="button"
				key={`${tone}-${index}`}
				onClick={() => {
					setShowReview(false);
					jumpFromOverlay(index);
				}}
				className={`min-w-11 rounded-full border-2 px-3 py-1 text-sm font-black tabular-nums transition-all hover:-translate-y-0.5 active:scale-95 ${toneClass}`}
			>
				{index + 1}
			</button>
		);
	};

	return (
		<div className="flex min-h-screen flex-col bg-page-gradient">
			{saveError && (
				<div className="fixed top-4 right-4 z-50 animate-pop-in rounded-2xl bg-destructive px-5 py-3 font-bold text-white shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_70%,black)]">
					{saveError}
				</div>
			)}

			{/* ───────── Top bar ───────── */}
			<header className="sticky top-0 z-30 bg-gradient-to-b from-background via-background/95 to-transparent px-3 pt-3 pb-2 sm:px-6 xl:px-8">
				<div className="card-pop mx-auto max-w-7xl px-3 py-3 sm:px-5">
					<div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-3">
						<div className="order-1 min-w-0 flex-1">
							{examInfo && <ExamHeader examInfo={examInfo} />}
						</div>

						{/* Exit */}
						<Button
							variant="outline"
							onClick={() => setShowExitConfirm(true)}
							className="order-2 h-10 shrink-0 border-destructive/40 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive md:order-6 md:h-11"
							title="Шалгалтаас гарах"
						>
							<LogOut className="size-4" />
							<span className="hidden lg:inline">Шалгалтаас гарах</span>
						</Button>

						{/* forces a line break on small screens */}
						<div className="order-3 h-0 basis-full md:hidden" />

						{/* Timer */}
						<div className="order-4 min-w-0 flex-1 md:order-2 md:w-56 md:flex-none">
							{examInfo && (
								<ExamTimer
									examStartTime={examInfo.ognoo}
									examEndTime={examInfo.end_time}
									examMinutes={examInfo.minut}
									startedDate={examInfo.starteddate}
									onTimeUp={setIsTimeUp}
									onAutoFinish={handleAutoSubmit}
								/>
							)}
						</div>

						{/* View toggle */}
						<div
							role="radiogroup"
							aria-label="Харагдац"
							className="order-5 hidden shrink-0 rounded-xl border-2 border-border bg-muted p-0.5 sm:flex md:order-3"
						>
							<button
								type="button"
								role="radio"
								aria-checked={viewMode === "focus"}
								onClick={() => switchViewMode("focus")}
								title="Нэг нэгээр"
								className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
									viewMode === "focus"
										? "bg-card text-primary shadow-[0_2px_0_0_var(--border)]"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<RectangleVertical className="size-4" strokeWidth={2.5} />
							</button>
							<button
								type="button"
								role="radio"
								aria-checked={viewMode === "list"}
								onClick={() => switchViewMode("list")}
								title="Жагсаалтаар"
								className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
									viewMode === "list"
										? "bg-card text-primary shadow-[0_2px_0_0_var(--border)]"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<List className="size-4" strokeWidth={2.5} />
							</button>
						</div>

						{/* Navigator drawer trigger (rail replaces it on xl) */}
						<Button
							onClick={() => setShowMobileMinimapOverlay(true)}
							variant="outline"
							className="order-6 h-10 shrink-0 px-3 text-primary hover:text-primary md:order-4 md:h-11 xl:hidden"
						>
							<Menu className="size-4" />
							<span className="text-xs font-bold sm:text-sm">Асуултууд</span>
						</Button>
					</div>

					{/* Progress row */}
					<div className="mt-3">
						<div className="mb-1.5 flex items-center gap-2">
							<span className="text-sm font-black text-foreground tabular-nums">
								Асуулт {currentQuestionIndex + 1}
								<span className="text-muted-foreground"> / {totalCount}</span>
							</span>
							<span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-extrabold text-primary tabular-nums">
								<CheckCircle2 className="size-3.5" />
								{answeredCount}/{totalCount}
							</span>
							<div className="ml-auto">
								{isSaving ? (
									<span
										aria-live="polite"
										className="flex items-center gap-1.5 rounded-full bg-pop-sky-soft px-2.5 py-1 text-[11px] font-extrabold text-pop-sky-ink"
									>
										<Loader2 className="size-3.5 animate-spin" />
										Хадгалж байна…
									</span>
								) : pendingCount > 0 ? (
									<button
										type="button"
										onClick={handleManualSave}
										disabled={isTimeUp}
										className="flex items-center gap-1.5 rounded-full border-2 border-warning/60 bg-pop-sun-soft px-2.5 py-0.5 text-[11px] font-extrabold text-pop-sun-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
									>
										<Save className="size-3.5" />
										Хадгалах ({pendingCount})
									</button>
								) : (
									<span
										aria-live="polite"
										className="flex items-center gap-1.5 rounded-full bg-pop-mint-soft px-2.5 py-1 text-[11px] font-extrabold text-pop-mint-ink"
									>
										<CloudCheck className="size-3.5" />
										Хадгалагдсан ✓
									</span>
								)}
							</div>
						</div>
						<div
							className={`flex items-center ${totalCount > 60 ? "gap-px" : "gap-0.5"}`}
							aria-hidden="true"
						>
							{allQuestions.map((q, i) => {
								const isCurrent = i === currentQuestionIndex;
								const answered = isAnswerFilled(selectedAnswers[q.question_id]);
								const marked = bookmarkedQuestions.has(q.question_id);
								return (
									<span
										key={q.question_id}
										className={`min-w-0 flex-1 rounded-full transition-all ${
											isCurrent
												? "h-2.5 bg-primary"
												: marked
													? "h-1.5 bg-warning"
													: answered
														? "h-1.5 bg-pop-mint"
														: "h-1.5 bg-muted"
										}`}
									/>
								);
							})}
						</div>
					</div>
				</div>
			</header>

			{/* ───────── Body ───────── */}
			<div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-3 sm:px-6 xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:px-8">
				<div className="flex min-w-0 flex-1 flex-col">
					<main className="mx-auto w-full max-w-3xl flex-1 py-3">
						{viewMode === "focus" ? (
							currentQuestion && (
								<div
									onPointerDown={onSwipePointerDown}
									onPointerUp={onSwipePointerUp}
									onPointerCancel={onSwipePointerCancel}
									style={swipeEnabled ? { touchAction: "pan-y pinch-zoom" } : undefined}
								>
									<div
										key={currentQuestion.question_id}
										id={`question-${currentQuestionIndex}`}
										data-q-index={currentQuestionIndex}
										className="animate-pop-in"
									>
										{renderQuestionCard(
											currentQuestion,
											currentQuestionIndex,
											true,
										)}
									</div>
									<div className="mt-3 hidden items-center justify-center gap-2 text-xs font-bold text-muted-foreground lg:flex">
										<Keyboard className="size-4" />
										{currentQuestion.que_type_id === 1 && (
											<>
												<kbd className="rounded-md border-2 border-border bg-card px-1.5 font-black">
													1–9
												</kbd>
												/
												<kbd className="rounded-md border-2 border-border bg-card px-1.5 font-black">
													A–F
												</kbd>
												<span>хариулт сонгох ·</span>
											</>
										)}
										<kbd className="rounded-md border-2 border-border bg-card px-1.5 font-black">
											←
										</kbd>
										<kbd className="rounded-md border-2 border-border bg-card px-1.5 font-black">
											→
										</kbd>
										<span>асуулт солих</span>
									</div>
								</div>
							)
						) : (
							<div className="space-y-5">
								{allQuestions.map((q, index) => (
									<div
										key={q.question_id}
										id={`question-${index}`}
										data-q-index={index}
										className="scroll-mt-44"
									>
										{renderQuestionCard(q, index, false)}
									</div>
								))}
							</div>
						)}
					</main>

					{/* ───────── Sticky action bar ───────── */}
					<div className="sticky bottom-0 z-20 mx-auto w-full max-w-3xl bg-gradient-to-t from-background via-background to-transparent pt-4 pb-3">
						<div className="card-pop flex items-center gap-2 p-2 sm:gap-3 sm:p-3">
							<Button
								onClick={goToPreviousQuestion}
								disabled={currentQuestionIndex === 0}
								variant="outline"
								size="lg"
								className="h-12 min-w-0 flex-1 px-2 text-sm sm:text-base"
							>
								<ChevronLeft className="size-5" />
								Өмнөх
							</Button>
							{examInfo && !isTimeUp && (
								<Button
									onClick={() => setShowReview(true)}
									variant="success"
									size="lg"
									className="h-12 shrink-0 px-3 text-sm sm:px-5 sm:text-base"
								>
									<Flag className="size-4" />
									<span className="hidden sm:inline">Шалгалт дуусгах</span>
									<span className="sm:hidden">Дуусгах</span>
								</Button>
							)}
							<Button
								onClick={handleNextOrReview}
								disabled={isLastQuestion && isTimeUp}
								size="lg"
								className="h-12 min-w-0 flex-1 px-2 text-sm sm:text-base"
							>
								{isLastQuestion ? (
									<>
										Шалгах
										<ListChecks className="size-5" />
									</>
								) : (
									<>
										Дараах
										<ChevronRight className="size-5" />
									</>
								)}
							</Button>
						</div>
					</div>
				</div>

				{/* ───────── Right rail (xl) — proctor stays mounted at all sizes ───────── */}
				<aside className="contents xl:sticky xl:top-40 xl:block xl:max-h-[calc(100vh-11rem)] xl:self-start xl:space-y-4 xl:overflow-y-auto xl:scrollbar-none xl:px-1 xl:pt-3 xl:pb-3">
					<div className="hidden xl:block">
						<ExamMinimap
							totalCount={totalCount}
							answeredCount={answeredCount}
							currentQuestionIndex={currentQuestionIndex}
							selectedAnswers={selectedAnswers}
							questions={allQuestions}
							onQuestionClick={goToQuestion}
							bookmarkedQuestions={bookmarkedQuestions}
						/>
					</div>
					<AdvancedExamProctor
						maxViolations={10000}
						strictMode={true}
						enableFullscreen={true}
						statusClassName="hidden xl:block"
					/>
				</aside>
			</div>

			{/* ───────── Navigator drawer ───────── */}
			<Sheet
				open={showMobileMinimapOverlay}
				onOpenChange={setShowMobileMinimapOverlay}
			>
				<SheetContent
					side="right"
					className="w-[88vw] gap-0 overflow-y-auto border-l-2 border-border bg-background p-0 sm:max-w-sm"
				>
					<SheetHeader className="border-b-2 border-border p-4 pr-12">
						<SheetTitle className="flex items-center gap-2 text-lg font-black">
							<span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-base">
								🧭
							</span>
							Асуултууд
						</SheetTitle>
						<SheetDescription className="font-semibold">
							{answeredCount}/{totalCount} хариулсан
						</SheetDescription>
					</SheetHeader>
					<div className="p-4">
						<ExamMinimap
							totalCount={totalCount}
							answeredCount={answeredCount}
							currentQuestionIndex={currentQuestionIndex}
							selectedAnswers={selectedAnswers}
							questions={allQuestions}
							onQuestionClick={(index) => {
								setShowMobileMinimapOverlay(false);
								jumpFromOverlay(index);
							}}
							bookmarkedQuestions={bookmarkedQuestions}
						/>
					</div>
				</SheetContent>
			</Sheet>

			{/* ───────── Review before finish ───────── */}
			<Dialog open={showReview} onOpenChange={setShowReview}>
				<DialogContent className="max-h-[90vh] w-[95vw] max-w-[560px] overflow-y-auto p-5 sm:p-6">
					<DialogHeader className="space-y-2 text-center sm:text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-pop-sky-soft text-pop-sky-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sky)_35%,transparent)]">
							<ListChecks className="size-7" strokeWidth={2.5} />
						</div>
						<DialogTitle className="text-xl font-black sm:text-2xl">
							Хариултаа хянах
						</DialogTitle>
						<DialogDescription className="font-semibold">
							Асуултын дугаар дээр дарж буцаж засах боломжтой.
						</DialogDescription>
					</DialogHeader>

					<div className="grid grid-cols-3 gap-2">
						<div className="rounded-2xl bg-pop-mint-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-mint-ink">
								{reviewGroups.answered.length}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-mint-ink sm:text-xs">
								Хариулсан
							</div>
						</div>
						<div className="rounded-2xl bg-pop-coral-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-coral-ink">
								{reviewGroups.unanswered.length}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-coral-ink sm:text-xs">
								Хариулаагүй
							</div>
						</div>
						<div className="rounded-2xl bg-pop-sun-soft p-3 text-center">
							<div className="text-2xl font-black text-pop-sun-ink">
								{reviewGroups.bookmarked.length}
							</div>
							<div className="text-[10px] font-bold uppercase tracking-wide text-pop-sun-ink sm:text-xs">
								Тэмдэглэсэн
							</div>
						</div>
					</div>

					<div className="space-y-4">
						{reviewGroups.unanswered.length > 0 ? (
							<section>
								<h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-pop-coral-ink">
									<CircleDashed className="size-4" />
									Хариулаагүй ({reviewGroups.unanswered.length})
								</h3>
								<div className="flex flex-wrap gap-2">
									{reviewGroups.unanswered.map((i) => reviewChip(i, "coral"))}
								</div>
							</section>
						) : (
							<div className="flex items-center gap-3 rounded-2xl bg-pop-mint-soft p-3 font-bold text-pop-mint-ink">
								<span className="text-2xl">🎉</span>
								Бүх асуултад хариулсан байна!
							</div>
						)}

						{reviewGroups.bookmarked.length > 0 && (
							<section>
								<h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-pop-sun-ink">
									<Bookmark className="size-4 fill-current" />
									Тэмдэглэсэн ({reviewGroups.bookmarked.length})
								</h3>
								<div className="flex flex-wrap gap-2">
									{reviewGroups.bookmarked.map((i) => reviewChip(i, "sun"))}
								</div>
							</section>
						)}

						{reviewGroups.answered.length > 0 && (
							<section>
								<h3 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-pop-mint-ink">
									<CheckCircle2 className="size-4" />
									Хариулсан ({reviewGroups.answered.length})
								</h3>
								<div className="flex flex-wrap gap-2">
									{reviewGroups.answered.map((i) => reviewChip(i, "mint"))}
								</div>
							</section>
						)}
					</div>

					<DialogFooter className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:gap-3">
						<Button
							variant="outline"
							size="lg"
							onClick={() => setShowReview(false)}
							className="w-full sm:flex-1"
						>
							<ChevronLeft className="size-4" />
							Буцах
						</Button>
						{examInfo && !isTimeUp && (
							<Button
								variant="success"
								size="lg"
								onClick={finishFromReview}
								className="w-full sm:flex-1"
							>
								<Send className="size-4" />
								Дуусгах
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ───────── Exit confirm ───────── */}
			<AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<div className="mb-1 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
							<LogOut className="size-7" strokeWidth={2.5} />
						</div>
						<AlertDialogTitle className="font-black">
							Шалгалтаас гарах уу?
						</AlertDialogTitle>
						<AlertDialogDescription>
							<span className="mb-3 block font-semibold">
								Та шалгалтаас гарахдаа итгэлтэй байна уу?
							</span>

							<span className="block rounded-2xl border-2 border-destructive/30 bg-destructive/10 p-3 font-bold text-destructive">
								Шалгалтыг нэг эхлүүлсэн тохиолдолд системийн хугацаа
								үргэлжлэн тоологдох бөгөөд шалгалтаас гарах эсвэл цонх
								хаасан ч хугацаа зогсохгүйг анхаарна уу.
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Болих</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => router.push("/Lists/examList")}
							className="bg-destructive text-white shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_70%,black)] active:shadow-[0_1px_0_0_color-mix(in_oklch,var(--destructive)_70%,black)]"
						>
							Тийм, гарах
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Existing finish flow (confirm + result + auto-submit). Single instance. */}
			{examInfo && !isTimeUp && (
				<FinishExamResultDialog
					ref={finishDialogRef}
					examId={examInfo.id}
					examType={examInfo.exam_type}
					startEid={examInfo.start_eid}
					examTime={examInfo.minut}
					answeredCount={answeredCount}
					totalCount={totalCount}
					hideTrigger
				/>
			)}

			{/* Lift the scroll button above the sticky action bar (transform = containing block) */}
			<div className="fixed right-0 bottom-20 z-40 size-0 [transform:translateZ(0)]">
				<FixedScrollButton />
			</div>
		</div>
	);
}
