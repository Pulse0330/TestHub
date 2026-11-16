"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteExamAnswer, saveExamAnswer } from "@/lib/api";
import type {
	AnswerValue,
	ApiExamResponse,
	ChoosedAnswer,
} from "@/types/exam/exam";

// ============================================================
// Pure helpers
// ============================================================

interface PendingAnswer {
	questionId: number;
	answer: AnswerValue;
	queTypeId: number;
	rowNum: number;
	timestamp: number;
}

const BATCH_SIZE = 5;
const DEFAULT_SAVE_DELAY = 1000;
const MAX_RETRY_DELAY = 30_000;
const FLUSH_MAX_PASSES = 4;
const TYPING_INDICATOR_DELAY = 1500;

/** Хариулт бөглөгдсөн эсэх (тоолуур, minimap, review-д ашиглана). */
export const isAnswerFilled = (ans: AnswerValue | undefined): boolean => {
	if (ans == null) return false;
	if (Array.isArray(ans)) return ans.length > 0;
	if (typeof ans === "string") return ans.trim() !== "";
	if (typeof ans === "number") return ans !== 0 && !Number.isNaN(ans);
	return Object.keys(ans).length > 0;
};

export const areAnswersEqual = (
	a: AnswerValue | undefined,
	b: AnswerValue | undefined,
): boolean => {
	if (a === b) return true;
	if (a === undefined || b === undefined || a === null || b === null)
		return false;

	const aType = Array.isArray(a) ? "array" : typeof a;
	const bType = Array.isArray(b) ? "array" : typeof b;
	if (aType !== bType) return false;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((v, i) => v === b[i]);
	}

	if (typeof a === "object" && typeof b === "object") {
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

const isValidId = (id: unknown): id is number =>
	typeof id === "number" && id !== 0 && !Number.isNaN(id);

const normalizeMatchingAnswer = (
	answer: Record<number, number | number[]>,
): Map<number, number[]> => {
	const normalized = new Map<number, number[]>();
	for (const [qRefIdStr, value] of Object.entries(answer)) {
		const qRefId = Number(qRefIdStr);
		const ids = (Array.isArray(value) ? value : [value]).filter(isValidId);
		if (qRefId && ids.length > 0) normalized.set(qRefId, ids);
	}
	return normalized;
};

const isPlainRecord = (
	v: AnswerValue,
): v is Exclude<AnswerValue, number | number[] | string | null> =>
	typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Хариултыг серверт хадгалах (answer_id, answer) хосууд болгоно.
 * Endpoint болон утгын формат нь шалгалт/сорил хоёуланд ижил.
 */
const buildSaveItems = (
	queTypeId: number,
	answer: AnswerValue,
	type4AnswerId: number,
): Array<{ answerId: number; value: string }> => {
	switch (queTypeId) {
		case 1:
			return isValidId(answer) ? [{ answerId: answer, value: "1" }] : [];
		case 2:
			return Array.isArray(answer)
				? [...new Set(answer.filter(isValidId))].map((id) => ({
						answerId: id,
						value: "1",
					}))
				: [];
		case 3: {
			if (!isPlainRecord(answer)) return [];
			const items: Array<{ answerId: number; value: string }> = [];
			for (const [k, v] of Object.entries(answer)) {
				const id = Number(k);
				if (isValidId(id) && typeof v === "string" && v.trim() !== "") {
					items.push({ answerId: id, value: v });
				}
			}
			return items;
		}
		case 4:
			return typeof answer === "string" && answer.trim() !== ""
				? [{ answerId: type4AnswerId, value: answer }]
				: [];
		case 5:
			return Array.isArray(answer)
				? answer
						.filter(isValidId)
						.map((id, index) => ({ answerId: id, value: String(index + 1) }))
				: [];
		case 6: {
			if (!isPlainRecord(answer)) return [];
			const items: Array<{ answerId: number; value: string }> = [];
			const matches = normalizeMatchingAnswer(
				answer as Record<number, number | number[]>,
			);
			for (const [qRefId, aRefIds] of matches) {
				for (const aRefId of aRefIds) {
					items.push({ answerId: aRefId, value: String(qRefId) });
				}
			}
			return items;
		}
		default:
			return [];
	}
};

/** ChoosedAnswer (серверт хадгалагдсан хариултууд) → UI state + серверт байгаа answer_id-ууд. */
export const parseChoosedAnswers = (
	choosed: ChoosedAnswer[],
): {
	answers: Record<number, AnswerValue>;
	serverIds: Map<number, Set<number>>;
} => {
	const answers: Record<number, AnswerValue> = {};
	const serverIds = new Map<number, Set<number>>();
	const grouped = new Map<string, ChoosedAnswer[]>();

	for (const item of choosed) {
		if (item.QueID == null) continue;
		const key = `${item.QueID}_${item.QueType}`;
		const list = grouped.get(key);
		if (list) list.push(item);
		else grouped.set(key, [item]);

		if (isValidId(item.AnsID)) {
			const ids = serverIds.get(item.QueID) ?? new Set<number>();
			ids.add(item.AnsID);
			serverIds.set(item.QueID, ids);
		}
	}

	for (const items of grouped.values()) {
		const { QueID, QueType } = items[0];

		switch (QueType) {
			case 1: {
				const ansId = items[items.length - 1].AnsID;
				answers[QueID] = isValidId(ansId) ? ansId : null;
				break;
			}
			case 2:
				answers[QueID] = [
					...new Set(items.map((i) => i.AnsID).filter(isValidId)),
				];
				break;
			case 3: {
				const map: Record<number, string> = {};
				for (const it of items) {
					if (isValidId(it.AnsID)) map[it.AnsID] = it.Answer ?? "";
				}
				answers[QueID] = map;
				break;
			}
			case 4:
				answers[QueID] = items[items.length - 1].Answer || "";
				break;
			case 5: {
				const sorted = [...items].sort(
					(a, b) => (Number(a.Answer) || 999) - (Number(b.Answer) || 999),
				);
				answers[QueID] = sorted.map((i) => i.AnsID).filter(isValidId);
				break;
			}
			case 6: {
				const matchMap: Record<number, number[]> = {};
				for (const item of items) {
					const qRefId = Number(item.Answer);
					if (qRefId && isValidId(item.AnsID)) {
						if (!matchMap[qRefId]) matchMap[qRefId] = [];
						matchMap[qRefId].push(item.AnsID);
					}
				}
				answers[QueID] = matchMap;
				break;
			}
		}
	}

	return { answers, serverIds };
};

// ============================================================
// Save engine (React-аас хамааралгүй, нэг instance / хуудас)
// ============================================================

interface EngineContext {
	userId: number;
	examId: number | undefined;
	type4Ids: Map<number, number>;
}

interface EngineStatus {
	isSaving: boolean;
	pendingCount: number;
	hasError: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function createAnswerSyncEngine(
	getContext: () => EngineContext,
	onStatus: (status: EngineStatus) => void,
) {
	/** Хадгалагдах дараалал (асуулт бүрт хамгийн сүүлийн утга). */
	const pending = new Map<number, PendingAnswer>();
	/** Серверт амжилттай хадгалагдсан сүүлийн утга. */
	const lastSaved = new Map<number, AnswerValue>();
	/** Серверт байж магадгүй answer_id-ууд (дараагийн хадгалалтад устгана). */
	const serverIds = new Map<number, Set<number>>();
	/** Яг одоо хадгалагдаж буй асуултууд. */
	const saving = new Set<number>();
	/** Сүүлийн хадгалалт нь амжилтгүй болсон (серверийн төлөв тодорхойгүй). */
	const dirty = new Set<number>();

	let inFlight: Promise<void> | null = null;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let consecutiveFailures = 0;
	let active = true;
	let isSaving = false;
	let hasError = false;

	const emit = () =>
		onStatus({ isSaving, pendingCount: pending.size, hasError });

	const retryDelay = () =>
		consecutiveFailures > 0
			? Math.min(MAX_RETRY_DELAY, 1000 * 2 ** consecutiveFailures)
			: DEFAULT_SAVE_DELAY;

	const persist = async (p: PendingAnswer, ctx: EngineContext) => {
		const { userId, examId } = ctx;
		if (!examId) throw new Error("examId байхгүй");
		const { questionId, answer, queTypeId, rowNum } = p;

		const ids = serverIds.get(questionId) ?? new Set<number>();
		serverIds.set(questionId, ids);

		// Type 4: Answers дахь type-4 мөрийн answer_id; байхгүй бол өмнө нь
		// серверт хадгалагдсан answer_id, тэр ч байхгүй бол 0 (сорилын хуучин дүрэм).
		const type4Id = ctx.type4Ids.get(questionId) ?? [...ids][0] ?? 0;

		// 1) Серверт байж болох бүх хуучин хариултыг устгана. Matching (6)
		//    дээр нэг answer_id өөр асуулт руу шилжиж болох тул "зөвхөн
		//    өөрчлөгдсөнийг устгах" нь хуучин холбоосыг үлдээдэг — бүгдийг
		//    устгаад дахин хадгална.
		const toDelete = [...ids];
		if (toDelete.length > 0) {
			const results = await Promise.allSettled(
				toDelete.map((answerId) =>
					deleteExamAnswer(userId, examId, questionId, answerId),
				),
			);
			results.forEach((r, i) => {
				if (r.status === "fulfilled") ids.delete(toDelete[i]);
				else
					console.error(
						`Q${questionId}: хуучин хариулт (${toDelete[i]}) устгаж чадсангүй`,
						r.reason,
					);
			});
		}

		// 2) Шинэ хариултыг хадгална.
		const items = buildSaveItems(queTypeId, answer, type4Id);
		for (const item of items) ids.add(item.answerId);
		await Promise.all(
			items.map((item) =>
				saveExamAnswer(
					userId,
					examId,
					questionId,
					item.answerId,
					queTypeId,
					item.value,
					rowNum,
				),
			),
		);
	};

	/** Дарааллыг нэг удаа боловсруулна (зэрэг дуудвал нэг promise хуваалцана). */
	const runPass = (): Promise<void> => {
		if (inFlight) return inFlight;
		const pass = (async () => {
			const ctx = getContext();
			if (!ctx.examId || !ctx.userId || pending.size === 0) return;

			isSaving = true;
			emit();
			let failures = 0;
			try {
				const snapshot = [...pending.values()].sort(
					(a, b) => a.timestamp - b.timestamp,
				);
				for (let i = 0; i < snapshot.length; i += BATCH_SIZE) {
					const batch = snapshot.slice(i, i + BATCH_SIZE);
					for (const p of batch) saving.add(p.questionId);
					const results = await Promise.allSettled(
						batch.map((p) => persist(p, ctx)),
					);
					results.forEach((r, idx) => {
						const p = batch[idx];
						saving.delete(p.questionId);
						if (r.status === "fulfilled") {
							lastSaved.set(p.questionId, p.answer);
							dirty.delete(p.questionId);
							// Хадгалж байх хооронд өөрчлөгдсөн бол шинэ утга дараалалд үлдэнэ.
							if (pending.get(p.questionId) === p) pending.delete(p.questionId);
						} else {
							failures++;
							dirty.add(p.questionId);
							console.error(`❌ Q${p.questionId} хадгалж чадсангүй:`, r.reason);
						}
					});
				}
			} finally {
				consecutiveFailures = failures > 0 ? consecutiveFailures + 1 : 0;
				hasError = failures > 0;
				isSaving = false;
				emit();
			}
		})().finally(() => {
			inFlight = null;
		});
		inFlight = pass;
		return pass;
	};

	const schedule = (delay: number) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			void autoSave();
		}, delay);
	};

	const autoSave = async () => {
		// Өмнөх хадгалалт дуусахыг хүлээнэ (алгасахгүй).
		if (inFlight) await inFlight;
		await runPass();
		if (active && pending.size > 0 && !timer) schedule(retryDelay());
	};

	return {
		init(answers: Record<number, AnswerValue>, ids: Map<number, Set<number>>) {
			lastSaved.clear();
			for (const [k, v] of Object.entries(answers)) lastSaved.set(Number(k), v);
			serverIds.clear();
			for (const [k, v] of ids) serverIds.set(k, new Set(v));
		},

		enqueue(p: PendingAnswer, delay: number) {
			const qid = p.questionId;
			// Хадгалсан утга руугаа буцсан бол дараалсан утгыг цуцална.
			// (Хадгалж байгаа эсвэл өмнөх хадгалалт амжилтгүй бол серверийн
			// төлөв тодорхойгүй тул заавал дахин хадгална.)
			if (
				!saving.has(qid) &&
				!dirty.has(qid) &&
				areAnswersEqual(lastSaved.get(qid), p.answer)
			) {
				if (pending.delete(qid)) emit();
				return;
			}
			pending.set(qid, p);
			emit();
			schedule(delay);
		},

		/** Дараалсан бүх хариултыг хадгална. Бүгд хадгалагдвал true. */
		async flush(): Promise<boolean> {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			try {
				for (let i = 0; i < FLUSH_MAX_PASSES; i++) {
					if (inFlight) await inFlight;
					if (pending.size === 0) return true;
					await runPass();
					if (pending.size === 0) return true;
					if (consecutiveFailures > 0) await sleep(500 * (i + 1));
				}
				return pending.size === 0;
			} finally {
				if (active && pending.size > 0 && !timer) schedule(retryDelay());
			}
		},

		activate() {
			active = true;
			if (pending.size > 0 && !timer) schedule(DEFAULT_SAVE_DELAY);
		},

		/** Unmount: timer-ийг зогсоож, үлдсэн хариултыг сүүлчийн удаа илгээнэ. */
		deactivate() {
			active = false;
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			if (pending.size > 0) void runPass();
		},
	};
}

// ============================================================
// Hook
// ============================================================

export interface UseAnswerSyncOptions {
	userId: number | null | undefined;
	examData: ApiExamResponse | undefined;
	/** true үед хариулт өөрчлөхийг хориглоно (цаг дууссан / дуусгасан). */
	locked?: boolean;
	/** Асуултын төрлөөс хамаарах debounce хугацаа (ms). */
	getSaveDelay?: (queTypeId: number) => number;
}

/**
 * Шалгалт/сорилын хариултыг серверт синк хийнэ:
 * - ChoosedAnswer-аас зөвхөн НЭГ удаа эхлүүлнэ (refetch локал хариултыг дарахгүй)
 * - асуулт бүрийн хамгийн сүүлийн утгыг дараалалд хадгалж debounce-оор илгээнэ
 * - хадгалж байх үед өөрчлөгдсөн утгыг алдахгүй, амжилтгүйг backoff-оор дахин оролдоно
 * - `flush()` нь дараалал хоосортол хадгална (дуусгахын өмнө заавал дуудна)
 */
export function useAnswerSync({
	userId,
	examData,
	locked = false,
	getSaveDelay,
}: UseAnswerSyncOptions) {
	const [selectedAnswers, setSelectedAnswers] = useState<
		Record<number, AnswerValue>
	>({});
	const [typingQuestions, setTypingQuestions] = useState<Set<number>>(
		() => new Set(),
	);
	const [isSaving, setIsSaving] = useState(false);
	const [pendingCount, setPendingCount] = useState(0);
	const [hasSaveError, setHasSaveError] = useState(false);

	const questionInfo = useMemo(() => {
		const meta = new Map<number, { queTypeId: number; rowNum: number }>();
		const type4Ids = new Map<number, number>();
		for (const q of examData?.Questions ?? []) {
			meta.set(q.question_id, {
				queTypeId: q.que_type_id,
				rowNum: Number(q.row_num),
			});
		}
		for (const a of examData?.Answers ?? []) {
			if (a.answer_type === 4 && !type4Ids.has(a.question_id)) {
				type4Ids.set(a.question_id, a.answer_id);
			}
		}
		return { meta, type4Ids };
	}, [examData]);

	const contextRef = useRef({
		userId: userId ?? 0,
		examId: examData?.ExamInfo?.[0]?.id,
		questionInfo,
		getSaveDelay,
	});
	contextRef.current = {
		userId: userId ?? 0,
		examId: examData?.ExamInfo?.[0]?.id,
		questionInfo,
		getSaveDelay,
	};

	const lockedRef = useRef(locked);
	if (locked) lockedRef.current = true;

	const selectedRef = useRef<Record<number, AnswerValue>>({});
	const typingTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
		new Map(),
	);

	const engineRef = useRef<ReturnType<typeof createAnswerSyncEngine> | null>(
		null,
	);
	if (!engineRef.current) {
		engineRef.current = createAnswerSyncEngine(
			() => ({
				userId: contextRef.current.userId,
				examId: contextRef.current.examId,
				type4Ids: contextRef.current.questionInfo.type4Ids,
			}),
			(s) => {
				setIsSaving(s.isSaving);
				setPendingCount(s.pendingCount);
				setHasSaveError(s.hasError);
			},
		);
	}

	// Серверийн хариултаар зөвхөн нэг удаа эхлүүлнэ.
	const initializedRef = useRef(false);
	useEffect(() => {
		if (initializedRef.current || !examData) return;
		initializedRef.current = true;
		const { answers, serverIds } = parseChoosedAnswers(
			examData.ChoosedAnswer ?? [],
		);
		engineRef.current?.init(answers, serverIds);
		selectedRef.current = answers;
		setSelectedAnswers(answers);
	}, [examData]);

	useEffect(() => {
		const engine = engineRef.current;
		const timers = typingTimers.current;
		engine?.activate();
		return () => {
			for (const t of timers.values()) clearTimeout(t);
			timers.clear();
			engine?.deactivate();
		};
	}, []);

	const handleAnswerChange = useCallback(
		(questionId: number, answer: AnswerValue) => {
			if (lockedRef.current) return;
			const meta = contextRef.current.questionInfo.meta.get(questionId);
			if (!meta) return;
			if (selectedRef.current[questionId] === answer) return;

			selectedRef.current = { ...selectedRef.current, [questionId]: answer };
			setSelectedAnswers(selectedRef.current);

			// "Бичиж байна" индикатор
			const existing = typingTimers.current.get(questionId);
			if (existing) clearTimeout(existing);
			setTypingQuestions((prev) =>
				prev.has(questionId) ? prev : new Set(prev).add(questionId),
			);
			typingTimers.current.set(
				questionId,
				setTimeout(() => {
					typingTimers.current.delete(questionId);
					setTypingQuestions((prev) => {
						if (!prev.has(questionId)) return prev;
						const next = new Set(prev);
						next.delete(questionId);
						return next;
					});
				}, TYPING_INDICATOR_DELAY),
			);

			const delay =
				contextRef.current.getSaveDelay?.(meta.queTypeId) ?? DEFAULT_SAVE_DELAY;
			engineRef.current?.enqueue(
				{
					questionId,
					answer,
					queTypeId: meta.queTypeId,
					rowNum: meta.rowNum,
					timestamp: Date.now(),
				},
				delay,
			);
		},
		[],
	);

	/** Дараалсан хариултуудыг хадгална; бүгд хадгалагдвал true. */
	const flush = useCallback(
		(): Promise<boolean> =>
			engineRef.current ? engineRef.current.flush() : Promise.resolve(true),
		[],
	);

	/** Хариулт өөрчлөхийг шууд хориглоно (state шинэчлэгдэхийг хүлээхгүй). */
	const lock = useCallback(() => {
		lockedRef.current = true;
	}, []);

	return {
		selectedAnswers,
		typingQuestions,
		isSaving,
		pendingCount,
		hasSaveError,
		handleAnswerChange,
		flush,
		lock,
	};
}
