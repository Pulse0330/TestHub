// Суралцагчийн API (clickup.ecm.mn/api) — апп-д одоогоор ашиглагдаагүй,
// гэхдээ дараа хэрэг болох endpoint-ууд. Аль хэдийн ашиглагдаж буй
// endpoint-ууд (нэвтрэх, шалгалт, сорил, хичээл, QPay ...) `api.ts`-д бий.
// Эх сурвалж: "Skuul — Суралцагчийн API" Postman collection.
// Бүх хүсэлт POST, body-д `conn` явуулахгүй (DB-г backend .env-ээс авна).

import { apiGet, apiPost } from "@/lib/api-client";

type Id = number;

// ============================================================
// Профайл
// ============================================================
export const profile = {
	/** sys_phone_check — утасны дугаар бүртгэлтэй эсэх */
	checkPhone: (b: { phone: string }) => apiPost("/checkphone", b),
	/** mob_user_get_google_by_email */
	getGoogleProfile: (b: { email: string }) => apiPost("/getgoogleprofile", b),
	/** currdata_list — хэрэглэгчийн хөтөлбөрүүд */
	getPlans: (b: { user_id: Id }) => apiPost("/getuserlpan", b),
	/** sys_user_currdatas — хөтөлбөр шинэчлэх */
	updatePlans: (b: { user_id: Id; OpType: number; urls: string }) =>
		apiPost("/userlpanupdate", b),
	/** mob_profile_update */
	update: (b: {
		user_id: Id;
		lastname: string;
		firstname: string;
		phone: string;
		email: string;
		login_name: string;
		img_url: string;
		optype: number;
	}) => apiPost("/profileupdate", b),
	/** mob_change_password */
	changePassword: (b: {
		user_id: Id;
		currentpassword: string;
		password: string;
	}) => apiPost("/changepassword", b),
	/** sys_change_language */
	changeLanguage: (b: { lang_id: number; user_id: Id }) =>
		apiPost("/changelanguage", b),
	/** sys_get_language_user */
	getLanguage: (b: { user_id: Id }) => apiPost("/getlanguageuser", b),
};

// ============================================================
// Анги, хичээл, сургалт
// ============================================================
export const classroom = {
	/** stu_croom_list_cbx */
	list: (b: { user_id: Id; school_id: Id }) => apiPost("/getclassroom", b),
	/** mob_stu_plan_course */
	getPlan: (b: {
		classroom_id: Id;
		lesson_id: Id;
		topic_id: Id;
		ulesson_id: Id;
		user_id: Id;
	}) => apiPost("/getplan", b),
	/** get_all_data */
	getConfig: (b: { optype: number }) => apiPost("/getconfig", b),
	/** mob_stu_my_lesson_course (бүх хичээл) */
	getCourses: (b: { user_id: Id }) => apiPost("/getcourse", b),
	/** stu_course_unit_list_cbx */
	getCourseMore: (b: { content_id: Id; user_id: Id }) =>
		apiPost("/getcoursemore", b),
	/** mob_stu_course_unit_list_cbx */
	getCourseDetails: (b: { content_id: Id; user_id: Id }) =>
		apiPost("/getcoursedetails", b),
	/** course_content_index */
	getCourseContentView: (b: {
		course_id: Id;
		visible_index: number;
		user_id: Id;
	}) => apiPost("/getcoursecontentview", b),
	/** stu_get_livelesson — live хичээлүүд */
	getLiveLessons: (b: { user_id: Id; school_id: Id; classroom_id: Id }) =>
		apiPost("/getlivelessons", b),
	/** stu_live_lesson_file_cbx2 — live хичээлийн бичлэг */
	getLiveLessonView: (b: { live_id: Id; index: number }) =>
		apiPost("/getlivelessonview", b),
	/** mob_stu_home_screen_one */
	getHomeScreenOne: (b: { user_id: Id }) => apiPost("/gethomescreen_1", b),
};

// ============================================================
// Шалгалт, сорил, тест
// ============================================================
export const exam = {
	/** exam_choosed_answer_iu — бүртгэлтэй шалгалтын хариулт */
	saveRegisteredAnswer: (b: {
		que_type_id: number;
		question_id: Id;
		answer_id: Id;
		answer: string;
		row_num: number;
		exam_id: Id;
		exam_date_id: Id;
		exam_reg_id: Id;
		user_id: Id;
	}) => apiPost("/apiexamchoosedanswer", b),
	/** exam_choosed_answer_delete */
	deleteRegisteredAnswer: (b: {
		question_id: Id;
		answer_id: Id;
		exam_id: Id;
		exam_reg_id: Id;
		exam_date_id: Id;
		user_id: Id;
	}) => apiPost("/apiexamdeletedanswer", b),
	/** stu_get_soril_caregory */
	getSorilCategories: (b: { lesson_id: Id }) => apiPost("/getsorilcategory", b),
	/** stu_get_soril_list */
	getSorilList: (b: { cat_id: Id; user_id: Id; classroom_id: Id }) =>
		apiPost("/getsorillist", b),
	/** mob_free_tests */
	getFreeTests: (b: { user_id: Id }) => apiPost("/gettestlists", b),
	/** mob_stu_my_exam_list (бүх хичээл) */
	getExamLists: (b: { user_id: Id; optype: number }) =>
		apiPost("/getexamlists", b),
	/** mob_test_list_for_user */
	getTestGroups: (b: { user_id: Id }) => apiPost("/gettestgroup", b),
	/** mob_test_saved_question */
	saveTest: (b: { test_cnt: number; rlesson_id: Id; user_id: Id }) =>
		apiPost("/testsaved", b),
	/** stu_exam_get_result_more */
	getResultMore: (b: { user_id: Id; exam_id: Id; test_id: Id }) =>
		apiPost("/getexamresultmore", b),
};

// ============================================================
// Төлбөр, захиалга, QPay
// ============================================================
export const payment = {
	/** mob_sys_order_plan */
	orderPlan: (b: { user_id: Id }) => apiPost("/orderplan", b),
	/** sv_checkcupon — купон шалгах */
	checkCoupon: (b: { code: string; user_id: Id; planid: Id }) =>
		apiPost("/getcheckcupon", b),
	/** sv_getbillid */
	getCustomerPay: (b: {
		code: number;
		order_id: Id;
		user_id: Id;
		bill_id: Id;
	}) => apiPost("/ordergetcustomerpay", b),
	/** sys_pay_account_bank */
	orderAccount: (b: { order_id: Id; user_id: Id }) =>
		apiPost("/orderaccount", b),
	/** mob_customer_pay_ins */
	setPay: (b: {
		user_id: Id;
		bill_type: number;
		payment: number;
		code: number;
		bill_id: Id;
		invoice_id: string;
		billmonth: number;
	}) => apiPost("/customersetpay", b),
	/** customer_order_ins */
	createOrder: (b: {
		user_id: string;
		billtype: string;
		payment: string;
		billid: string;
		catid: string;
	}) => apiPost("/customerorderins", b),
	/** mob_sys_order_pay */
	orderPay: (b: { user_id: Id }) => apiPost("/orderpay", b),
	/** mob_get_plan */
	getPlanMore: (b: { plan_id: Id; access_token: string }) =>
		apiPost("/getplanmore", b),
	/** mob_sv_getbillid, mob_customer_pay_ins — апп-ын QPay нэхэмжлэх */
	qpayInvoice: (b: {
		userid: string;
		orderid: string;
		amount: string;
		bilid: string;
		user_id: Id;
		invoice_id: string;
	}) => apiPost("/get_qpayinvoice", b),
	/** mob_sv_getbillid — Skuul QPay нэхэмжлэх */
	qpayInvoiceSkuul: (b: {
		userid: string;
		device_token: string;
		amount: string;
		orderid: string;
		bilid: string;
		classroom_id: string;
		user_id: Id;
	}) => apiPost("/get_qpayinvoiceskuul", b),
	/** qpay_check_invoices */
	qpayCheck: (b: { user_id: string; billno: string }) =>
		apiPost("/get_qpaycheck", b),
};

// ============================================================
// SMS / OTP (backend)
// ============================================================
export const sms = {
	/** sms_phone_ins — OTP илгээх */
	send: (b: { phone: string; istype: number }) => apiPost("/sms_phone", b),
	/** sms_phone_check — OTP шалгах */
	check: (b: { phone: string; otp: string; istype: number }) =>
		apiPost("/sms_check", b),
};

// ============================================================
// Мэдэгдэл
// ============================================================
export const notification = {
	/** setdevicetoken — push мэдэгдлийн token */
	setDeviceToken: (b: { user_id: Id; device_token: string }) =>
		apiPost("/setdevicetoken", b),
	/** notification_list */
	list: (b: { user_id: Id }) => apiPost("/get_notifications", b),
	/** notification_upd — уншсан болгох гэх мэт */
	update: (b: { trid: string; user_id: Id; optype: number }) =>
		apiPost("/notification_upd", b),
};

// ============================================================
// Санал хүсэлт, холбоо барих
// ============================================================
export const feedback = {
	/** feedback_iud */
	save: (b: {
		id: Id;
		feed_type: number;
		descr: string;
		user_id: Id;
		optype: number;
	}) => apiPost("/feedback", b),
	/** feedback_list */
	list: (b: { user_id: Id }) => apiPost("/feedbacklist", b),
	/** z_feedback_list — санал хүсэлтийн төрөл */
	types: () => apiPost("/feedbacktypelist"),
	/** sys_contact_list */
	contacts: () => apiPost("/syscontactlist"),
};

// ============================================================
// Газарзүй, сургууль
// ============================================================
export const geography = {
	/** get_aimaglist */
	aimagList: () => apiPost("/aimaglist"),
	/** get_school_1 */
	schoolCms: (b: { aimag_id: Id; district_id: Id }) => apiPost("/schoolcms", b),
	/** ott_getmyclass */
	classes: (b: { accademic_id: Id; class_id: Id }) => apiPost("/class", b),
	/** api_get_school */
	examSchools: (b: { aimag_id: Id; district_id: Id }) =>
		apiPost("/examschool", b),
	/** get_levelclass */
	levelClasses: (b: { edu_level: number }) => apiPost("/get_levelclass", b),
	/** get_eduprogram */
	eduPrograms: () => apiPost("/get_eduprogram"),
};

// ============================================================
// Үр дүн, шинжилгээ
// ============================================================
export const result = {
	/** result_examtype */
	examTypes: () => apiPost("/getexamtype"),
	/** result_lessons */
	lessons: () => apiPost("/yeshlessons"),
	/** result_examlist */
	examList: (b: {
		userid: Id;
		lessonid: Id;
		examtype: number;
		sdate: string;
		edate: string;
		esisid: string;
		optype: number;
		test_id: Id;
	}) => apiPost("/examlist", b),
	/** result_examlist_info */
	examInfo: (b: { exam_id: Id }) => apiPost("/resultexaminfo", b),
	/** stu_get_evaluation — дүнгийн үнэлгээ */
	evaluation: (b: { dun: number }) => apiPost("/examevaluation", b),
	/** result_exam_review */
	review: (b: { exam_id: Id }) => apiPost("/examreview", b),
	/** result_stu_exam_ranks */
	ranks: (b: { exam_id: Id }) => apiPost("/resexamranks", b),
	/** result_exam_question */
	question: (b: { question_id: Id }) => apiPost("/resexamquestion", b),
	/** Дүнгийн нэгтгэл */
	summary: (b: { exam_id: Id }) => apiPost("/dunnegtgel", b),
	/** result_materlist */
	materials: (b: { lesson_id: Id }) => apiPost("/materiallist", b),
};

// ============================================================
// Баннер / сурталчилгаа
// ============================================================
export const banner = {
	/** reklam_active_get — type_id өгөхгүй бол 3 төрлийг нэг дор */
	active: (b: { type_id?: number; platform: number; user_id: Id }) =>
		apiPost("/getreklam", b),
	/** reklam_hit — үзсэн/дарсан тоолох */
	hit: (b: { kind: number; id: Id }) => apiPost("/reklamhit", b),
};

// ============================================================
// Захидал
// ============================================================
export const letter = {
	/** letter_inbox */
	inbox: (b: { user_id: Id; page?: number; pagesize?: number }) =>
		apiPost("/letter/inbox", b),
	/** letter_detail — нээхэд уншсан болно */
	detail: (b: { user_id: Id; letter_id: Id }) => apiPost("/letter/detail", b),
	/** letter_ack — "Танилцсан" */
	ack: (b: { user_id: Id; letter_id: Id }) => apiPost("/letter/ack", b),
	/** letter_unread_count — уншаагүй тоо */
	unread: (b: { user_id: Id }) => apiPost("/letter/unread", b),
};

// ============================================================
// Бусад
// ============================================================
export const account = {
	/** Бүртгэл устгах хуудас (GET) */
	deleteAccount: () => apiGet("/delete_account"),
};
