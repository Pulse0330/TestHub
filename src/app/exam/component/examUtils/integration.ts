"use client";

// Гадны системээс URL-аар орж ирсэн шалгалт:
//   /exam/40?dbname=ikh_test_ub33&userid=77439&classroom_id=3216&domname=https://big.nuudelms.mn/ExamEnd/40/77439
// - dbname, userid байвал integration горим — integration.ecm.mn API-г ашиглана
//   (нэвтрэлт шаардахгүй, src/proxy.ts зөвшөөрнө).
// - classroom_id — шалгалт ачаалах, дуусгах үед явуулна.
// - domname — шалгалт дууссан / гарсны дараа буцах хаяг.
// Эдгээр байхгүй бол одоогийн системийн API-гаар ажиллана.

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
	deleteExamAnswer,
	deleteIntegrationExamAnswer,
	finishExam,
	finishIntegrationExam,
	getExamById,
	getIntegrationExamFill,
	saveExamAnswer,
	saveIntegrationExamAnswer,
} from "@/lib/api";

export interface ExamIntegration {
	dbname: string;
	userId: number;
	classroomId: number | null;
	returnUrl: string | null;
}

/** Буцах хаяг байхгүй үед харуулах хуудас. */
export const INTEGRATION_FINISHED_PATH = "/exam/finished";

/** Зөвхөн http(s) хаяг руу буцаана (javascript: гэх мэтийг хаана). */
function parseReturnUrl(value: string | null): string | null {
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:"
			? url.toString()
			: null;
	} catch {
		return null;
	}
}

/** Эерэг бүхэл тоо биш бол null. */
function parsePositiveInt(value: string | null): number | null {
	if (!value) return null;
	const n = Number(value);
	return Number.isInteger(n) && n > 0 ? n : null;
}

export function parseExamIntegration(
	dbname: string | null,
	userid: string | null,
	classroomId: string | null,
	domname: string | null,
): ExamIntegration | null {
	const db = dbname?.trim();
	const userId = parsePositiveInt(userid);
	if (!db || userId === null) return null;
	return {
		dbname: db,
		userId,
		classroomId: parsePositiveInt(classroomId),
		returnUrl: parseReturnUrl(domname),
	};
}

export function useExamIntegration(): ExamIntegration | null {
	const searchParams = useSearchParams();
	const dbname = searchParams.get("dbname");
	const userid = searchParams.get("userid");
	const classroomId = searchParams.get("classroom_id");
	const domname = searchParams.get("domname");
	return useMemo(
		() => parseExamIntegration(dbname, userid, classroomId, domname),
		[dbname, userid, classroomId, domname],
	);
}

/**
 * Integration-ий exam_time — сурагчийн зарцуулсан хугацаа "мм:сс"
 * (жишээ нь "45:12"). Шалгалтын хугацаанаас хэтрүүлэхгүй, хасах утга гаргахгүй.
 */
export function formatIntegrationExamTime(elapsedSeconds: number): string {
	const sec = Number.isFinite(elapsedSeconds)
		? Math.max(0, Math.floor(elapsedSeconds))
		: 0;
	const mm = String(Math.floor(sec / 60)).padStart(2, "0");
	const ss = String(sec % 60).padStart(2, "0");
	return `${mm}:${ss}`;
}

/** Шалгалтаас гарах — гадны систем рүү буцна (хаяг байхгүй бол дууссан хуудас). */
export function leaveIntegrationExam(integration: ExamIntegration) {
	window.location.replace(integration.returnUrl ?? INTEGRATION_FINISHED_PATH);
}

export interface ExamApi {
	getExamById: typeof getExamById;
	saveExamAnswer: typeof saveExamAnswer;
	deleteExamAnswer: typeof deleteExamAnswer;
	finishExam: typeof finishExam;
}

const SYSTEM_EXAM_API: ExamApi = {
	getExamById,
	saveExamAnswer,
	deleteExamAnswer,
	finishExam,
};

/** Горимоос хамаарч шалгалтын API сонгоно — дуудах хэлбэр нь ижил. */
export function getExamApi(integration: ExamIntegration | null): ExamApi {
	if (!integration) return SYSTEM_EXAM_API;
	const { dbname, classroomId } = integration;
	return {
		getExamById: (userId, examId) =>
			getIntegrationExamFill(dbname, userId, examId, classroomId),
		saveExamAnswer: (...args) => saveIntegrationExamAnswer(dbname, ...args),
		deleteExamAnswer: (...args) => deleteIntegrationExamAnswer(dbname, ...args),
		finishExam: (payload) =>
			finishIntegrationExam(dbname, payload, classroomId),
	};
}

/** Шалгалтын хуудас болон дуусгах dialog-д хуваалцах integration төлөв. */
export function useExamMode() {
	const integration = useExamIntegration();
	const api = useMemo(() => getExamApi(integration), [integration]);
	return { integration, api };
}
