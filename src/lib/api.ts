// src/lib/api.ts

import axios from "axios";
import api from "@/lib/axios";
import type { ContentViewResponse } from "@/types/course/contentView";
import type { CourseListResponse } from "@/types/course/courseList";
import type { ApiExamResponse } from "@/types/exam/exam";
import type { ExamAnswerResponse } from "@/types/exam/examChoosed";
import type { ExamChoosedAnswerDeleteResponse } from "@/types/exam/examChoosedAnswerDelete";
import type { ExamDunApiResponse } from "@/types/exam/examDun";
import type {
	FinishExamRequest,
	FinishExamResponse,
} from "@/types/exam/examFinish";
import type { ApiExamlistsResponse } from "@/types/exam/examList";
import type { LeaderboardResponse } from "@/types/exam/examRank";
import type { ExamResultsResponse } from "@/types/exam/examResult";
import type { ExamresultListResponseType } from "@/types/exam/examResultList";
import type { ExamResponseMoreApiResponse } from "@/types/exam/examResultMore";
import type { TestFilterResponse } from "@/types/exercise/testFilter";
import type { ExamFinishResponse } from "@/types/exercise/testGetFill";
import type { GetTestGroupResponse } from "@/types/exercise/testGroup";
import type {
	TestSavedMixedItem,
	TestSavedMixedResponse,
} from "@/types/exercise/testSavedMixed";
import type { HomeResponseType } from "@/types/home";
import type {
	AimagItem,
	ClassItem,
	DistrictItem,
	SchoolItem,
} from "@/types/location";
import type { ForgotPasswordResponse } from "@/types/login/forgot/forgot";
import type {
	CheckTokenResponse,
	StatusItem,
} from "@/types/login/loginToken/checkToken";
import type {
	CreatedSeasonResponse,
	SessionData,
} from "@/types/login/loginToken/createSeason";
import type {
	LoginTokenResponse,
	User,
} from "@/types/login/loginToken/loginToken";
import type { RegisterSysUserResponse } from "@/types/login/sign/register";
import type { getplaninfoCourseData } from "@/types/paymentCourse/getplaninfo";
import type { QPayInvoiceResponse } from "@/types/Qpay/qpayinvoice";
import type { ApiSorillistsResponse } from "@/types/soril/sorilLists";
import type { SorilresultListResponseType } from "@/types/soril/sorilResultLists";
import type { UserProfileResponseType } from "@/types/user";
import type { userUpdateResponse } from "@/types/userUpdate";
//-------------------------------Auth---------------------------------//

// ===== LoginToken request =====
export const loginTokenRequest = async (
	username: string,
	password: string,
	deviceid: string,
	devicemodel: string,
	isweb: number,
): Promise<LoginTokenResponse<User>> => {
	const { data } = await api.post<LoginTokenResponse<User>>("/weblogin", {
		username,
		password,
		deviceid,
		devicemodel,
		isweb,
	});

	return data;
};

export const loginToken = async (
	token: string,
): Promise<LoginTokenResponse<User>> => {
	const { data } = await api.post<LoginTokenResponse<User>>("/ikhlogintoken", {
		LoginToken: token,
	});

	return data;
};
// ===== CreateSession request =====
export const createSessionRequest = async (
	userId: number,
	token: string,
	ip: string,
	browser: string,
): Promise<CreatedSeasonResponse<SessionData | null>> => {
	const { data } = await api.post<CreatedSeasonResponse<SessionData | null>>(
		"/CreateSession",
		{
			UserId: userId,
			Token: token,
			Ip: ip,
			Browser: browser,
		},
	);
	return data;
};
// ===== CheckSession request =====
export const checkSessionRequest = async (
	userId: number,
	token: string,
): Promise<CheckTokenResponse<StatusItem[]>> => {
	const { data } = await api.post<CheckTokenResponse<StatusItem[]>>(
		"/CheckSession",
		{
			UserId: userId,
			Token: token,
		},
	);
	return data;
};
// ===== Register request =====
export const registerSysUserRequest = async (
	email: string,
	firstname: string,
	lastname: string,
	phone: string,
	password: string,
	ugroup: string,
): Promise<RegisterSysUserResponse> => {
	const { data } = await api.post<RegisterSysUserResponse>(
		"/register_sysuser",
		{
			email: email,
			firstname: firstname,
			lastname: lastname,
			phone: phone,
			password: password,
			ugroup: ugroup,
		},
	);

	return data;
};
// ===== Forgot password request =====
export const Forgotpassword = async (
	phone: string,
	password: string,
): Promise<ForgotPasswordResponse> => {
	const { data } = await api.post("/forgetpass", {
		phone: phone,
		password: password,
	});
	return data;
};
// ===== HomeScreen request =====
export const getHomeScreen = async (
	userId: number,
): Promise<HomeResponseType> => {
	const { data } = await api.post<HomeResponseType>("/gethomescreen", {
		user_id: userId,
	});
	return data;
};
// ===== Get UserProfile =====
export const getUserProfile = async (
	userId: number,
): Promise<UserProfileResponseType> => {
	const { data } = await api.post<UserProfileResponseType>("/getuserprofile", {
		user_id: userId,
	});
	return data;
};
export const getUserUpdateProfile = async (
	firstname: string,
	lastname: string,
	phone: string,
	email: string,
	aimag_id: number,
	aimagname: string,
	sym_id: number,
	symname: string,
	regnumber: string,
	currentpassword: string,
	schoolname: string,
	schooldb: string,
	studentgroupid: string,
	studentgroupname: string,
	user_id: number,
	img_url: string | null,
): Promise<userUpdateResponse> => {
	const requestBody = {
		firstname,
		lastname,
		phone,
		email,
		aimag_id,
		aimagname,
		sym_id,
		symname,
		regnumber,
		currentpassword,
		schoolname,
		schooldb,
		studentgroupid,
		studentgroupname,
		user_id,
		img_url,
	};

	const { data } = await api.post<userUpdateResponse>(
		"/sysprofileupdate",
		requestBody,
	);

	return data;
};
// ===== Get Date =====
export const getServerDate = async (): Promise<string> => {
	const { data } = await api.post("/getdate", {});
	return data?.RetData?.[0]?.systemdate ?? "";
};

//-------------------------------Exam---------------------------------//
//===== Get Examresultlists =====
export const getexamresultlists = async (
	userId: number,
): Promise<ExamresultListResponseType> => {
	const { data } = await api.post<ExamresultListResponseType>(
		"/getexamresultlists",
		{
			exam_type: 2,
			user_id: userId,
		},
	);
	return data;
};
// ===== Exam request =====
export const getExamById = async (
	userId: number,
	examId: number,
): Promise<ApiExamResponse> => {
	const { data } = await api.post<ApiExamResponse>("/getexamfill", {
		user_id: userId,
		exam_id: examId,
	});
	return data;
};

// ===== Soril New request =====

// ===== Exam choosed  =====
export const saveExamAnswer = async (
	userId: number,
	examId: number,
	questionId: number,
	answerId: number,
	queTypeId: number,
	answer: string = "",
	rowNum: number,
): Promise<ExamAnswerResponse> => {
	const { data } = await api.post<ExamAnswerResponse>("/examchoosedanswer", {
		que_type_id: queTypeId,
		question_id: questionId,
		answer_id: answerId,
		answer: answer,
		row_num: rowNum,
		exam_id: examId,
		user_id: userId,
	});
	return data;
};
// ===== Exam choosedanswer delete   =====
export const deleteExamAnswer = async (
	userId: number,
	examId: number,
	questionId: number,
	answerId: number,
): Promise<ExamChoosedAnswerDeleteResponse> => {
	const { data } = await api.post<ExamChoosedAnswerDeleteResponse>(
		"/examdeletedanswer",
		{
			user_id: userId,
			exam_id: examId,
			question_id: questionId,
			answer_id: answerId,
		},
	);
	return data;
};
// ===== Exam finish   =====
export const finishExam = async (
	data: FinishExamRequest,
): Promise<FinishExamResponse> => {
	const { data: response } = await api.post<FinishExamResponse>(
		"/examfinish",
		data,
	);

	return response;
};
// ===== Get Exam Results =====
export const getExamResults = async (
	testId: number,
): Promise<ExamResultsResponse> => {
	const { data } = await api.post<ExamResultsResponse>("/getexamresults", {
		test_id: testId,
	});
	return data;
};
// ===== Get Exam Result More =====
export const getExamResultMore = async (
	testId: number,
	examId: number,
	userId: number,
): Promise<ExamResponseMoreApiResponse> => {
	const { data } = await api.post<ExamResponseMoreApiResponse>("/resexammore", {
		test_id: testId,
		exam_id: examId,
		user_id: userId,
	});
	return data;
};
// ===== Get Exam Dun  =====
export const getExamDun = async (dun: number): Promise<ExamDunApiResponse> => {
	// Type өөрчлөх
	const { data } = await api.post<ExamDunApiResponse>(
		// Энд ч өөрчлөх
		"/examevaluation",
		{
			dun: dun,
		},
	);
	return data;
};
// ===== Get Exam Rank =====
export const getExamRank = async (
	examId: number,
	userId: number,
): Promise<LeaderboardResponse> => {
	const { data } = await api.post<LeaderboardResponse>("/getexamranks", {
		exam_id: examId,
		user_id: userId,
	});
	return data;
};
// ===== Get Exam Filter =====

export const getexamfiltertlists = async (
	userId: number,
	lesson_id: number,
): Promise<ApiExamlistsResponse> => {
	const { data } = await api.post<ApiExamlistsResponse>("/webgetexamlists", {
		optype: 0,
		user_id: userId,
		lesson_id: lesson_id,
	});
	return data;
};
// ===== Get ExamFinishlist Filter =====
export const getexamFinishFiltertLists = async (
	userId: number,
	lesson_id: number,
): Promise<ExamresultListResponseType> => {
	// ← Засах
	const { data } = await api.post<ExamresultListResponseType>(
		// ← Засах
		"/webgetexamresultlists",
		{
			exam_type: 2,
			user_id: userId,
			lesson_id: lesson_id,
		},
	);
	return data;
};
//-------------------------------Soril---------------------------------//

// ===== Get sorilFilteredlists  =====
export const getSorilFilteredlists = async (
	userId: number,
	lesson_id: number,
): Promise<ApiSorillistsResponse> => {
	const { data } = await api.post<ApiSorillistsResponse>("/webgetexamlists", {
		user_id: userId,
		lesson_id: lesson_id,
		optype: 1,
	});
	return data;
};
//===== Get SorilFilterdresultlists =====
export const getSorilFilterdresultlists = async (
	userId: number,
	lesson_id: number,
): Promise<SorilresultListResponseType> => {
	const { data } = await api.post<SorilresultListResponseType>(
		"/webgetexamresultlists",
		{
			exam_type: 3,
			user_id: userId,
			lesson_id: lesson_id,
		},
	);
	return data;
};
//-------------------------------Test---------------------------------//

// ===== Get testGetFill =====
export const gettTestFill = async (
	userId: number,
): Promise<ExamFinishResponse> => {
	const { data } = await api.post<ExamFinishResponse>("/gettestfill", {
		user_id: userId,
	});
	return data;
};
// ===== Get TestSavedMixed =====
export const getTestMixed = async (
	userId: number,
	tests: TestSavedMixedItem[],
): Promise<TestSavedMixedResponse> => {
	const { data } = await api.post<TestSavedMixedResponse>("/testsavedmixed", {
		user_id: userId,
		tests,
	});
	return data;
};
// ===== Get TestFilter =====
export const getTestFilter = async (
	userId: number,
): Promise<TestFilterResponse> => {
	const { data } = await api.post<TestFilterResponse>("/getlessons", {
		user_id: userId,
		optype: 0,
	});
	return data;
};
// ===== Get TestFiltered =====
export const getTestFiltered = async (
	userId: number,
	lesson_id: number,
): Promise<GetTestGroupResponse> => {
	const { data } = await api.post<GetTestGroupResponse>(
		"/gettestgroupbylesson",
		{
			user_id: userId,
			lesson_id: lesson_id,
		},
	);
	return data;
};

//-------------------------------Course---------------------------------//

// ===== Get ContentView =====
export const getContentView = async (
	content_id: number,
	user_id: number,
): Promise<ContentViewResponse> => {
	const { data } = await api.post<ContentViewResponse>("/getcontentview", {
		content_id,
		possible_index: 1,
		user_id,
	});
	return data;
};
export const getFilteredContnView = async (
	userId: number,
	lesson_id: number,
): Promise<CourseListResponse> => {
	const { data } = await api.post<CourseListResponse>("/webgetcourse", {
		user_id: userId,
		lesson_id: lesson_id,
	});
	return data;
};
//-------------------------------Payment Course---------------------------------//
export const getPaymentCourseList = async (
	userId: number,
): Promise<getplaninfoCourseData> => {
	const { data } = await api.post<getplaninfoCourseData>("/getplaninfo", {
		user_id: userId,
	});
	return data;
};

//------------------------------- Дотоод API (Next.js /api route) ---------------------------------//
// Эдгээр route-ууд server дээр ажиллаж, backend руу дамжуулна.
// Browser-оос шууд backend биш, заавал эдгээр функцээр дуудна.

const internalApi = axios.create({
	baseURL: "/api",
	headers: { "Content-Type": "application/json" },
	timeout: 15000,
});

interface InternalRetResponse {
	ResponseMessage: string;
	StatusCode?: string;
	ResponseCode?: string;
	ResponseType: boolean;
}

export interface InternalListResponse<T> {
	RetResponse?: InternalRetResponse;
	RetData?: T[];
}

export interface OtpCodeResponse {
	RetResponse?: InternalRetResponse & {
		RtrGenCode?: string;
		RtrGenCodeSeconds?: string | number;
	};
}

export interface OtpCheckResponse {
	RetResponse?: InternalRetResponse;
}

/** Төхөөрөмжийн мэдээлэл — ua-parser-js-ийг зөвхөн OTP үед ачаална. */
async function getDeviceInfo() {
	const { UAParser } = await import("ua-parser-js");
	const parser = new UAParser();
	const device = parser.getDevice();
	const os = parser.getOS();
	const browser = parser.getBrowser();
	return {
		devicemodel:
			device.model || `${os.name || "Unknown"} - ${browser.name || "Unknown"}`,
		ismob: device.type === "mobile" || device.type === "tablet" ? 1 : 0,
	};
}

// ===== OTP =====
export const requestOtpCode = async (
	phone: number,
): Promise<OtpCodeResponse> => {
	const { data } = await internalApi.post<OtpCodeResponse>("/otp/getcode", {
		phone,
		conftype: "1",
		bundleid: "ikh_skuul.mn",
		...(await getDeviceInfo()),
	});
	return data;
};

export const checkOtpCode = async (
	phone: number,
	code: number,
): Promise<OtpCheckResponse> => {
	const { data } = await internalApi.post<OtpCheckResponse>("/otp/smscheck", {
		phone,
		code,
	});
	return data;
};

// ===== QPay =====
/** Шалгалтын төлбөрийн QPay нэхэмжлэх үүсгэнэ. */
export const createExamInvoice = async (
	exam: {
		exam_id: number;
		amount?: number | string | null;
		bill_type?: number | string | null;
	},
	userId: number,
): Promise<QPayInvoiceResponse> => {
	const { data } = await internalApi.post<QPayInvoiceResponse>(
		"/examqpay/invoice",
		{
			amount: exam.amount?.toString() || "0",
			userid: userId.toString(),
			device_token: "",
			orderid: exam.bill_type?.toString() || "0",
			bilid: exam.exam_id.toString(),
			classroom_id: "0",
		},
	);
	return data;
};

export interface CourseInvoicePayload {
	amount: string;
	userid: string;
	device_token: string;
	orderid: string;
	bilid: string;
	classroom_id: string;
	urls: { topic_id: string }[];
}

/** Хичээлийн (төлөвлөгөөний) төлбөрийн QPay нэхэмжлэх үүсгэнэ. */
export const createCourseInvoice = async (
	payload: CourseInvoicePayload,
): Promise<QPayInvoiceResponse> => {
	const { data } = await internalApi.post<QPayInvoiceResponse | string>(
		"/qpay/invoice",
		payload,
	);
	// Backend заримдаа JSON-ийг string хэлбэрээр буцаадаг
	const parsed: QPayInvoiceResponse =
		typeof data === "string" ? JSON.parse(data) : data;
	if (!parsed?.qr_image) throw new Error("QPay хариу буруу байна");
	return parsed;
};

/** QPay төлбөр төлөгдсөн эсэхийг шалгана. */
export const checkQPayPayment = async (
	userId: number | string,
	invoiceId: string,
): Promise<{ RetResponse?: InternalRetResponse }> => {
	const { data } = await internalApi.post("/qpay/check", {
		userid: userId.toString(),
		invoice_id: invoiceId,
	});
	return data;
};

// ===== Байршил (аймаг → дүүрэг → сургууль → анги) =====
export const getAimags = async (): Promise<InternalListResponse<AimagItem>> =>
	(await internalApi.post("/sign/aimag", {})).data;

export const getDistricts = async (
	aimagId: number,
): Promise<InternalListResponse<DistrictItem>> =>
	(await internalApi.post("/sign/district", { aimag_id: aimagId })).data;

export const getSchools = async (
	aimagId: number,
	districtId: number,
): Promise<InternalListResponse<SchoolItem>> =>
	(
		await internalApi.post("/sign/surguuli", {
			aimag_id: aimagId,
			district_id: districtId,
		})
	).data;

export const getClasses = async (
	database: string,
	serverip: string,
): Promise<InternalListResponse<ClassItem>> =>
	(await internalApi.post("/sign/angi", { database, serverip })).data;

//------------------------------- Файл upload ---------------------------------//
const UPLOAD_URL = "https://uploads.ecm.mn/upload/single";

export interface UploadFileResult {
	fileStatus: number;
	message: string;
	file: {
		name: string;
		savedName: string;
		url: string;
	};
}

/** Зураг upload хийнэ (uploads.ecm.mn). */
export const uploadImage = async (
	formData: FormData,
): Promise<UploadFileResult> => {
	const { data } = await axios.post<UploadFileResult>(UPLOAD_URL, formData, {
		headers: { "Content-Type": "multipart/form-data" },
		timeout: 0, // том файлд хугацааны хязгааргүй
	});
	return data;
};
