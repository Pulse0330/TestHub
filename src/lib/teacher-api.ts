// Багшийн API (clickup.ecm.mn/api) — багш, менежерийн тал.
// Эх сурвалж: "Skuul — Багшийн API" Postman collection. UI одоогоор байхгүй.
// Бүх хүсэлт POST, body-д `conn` явуулахгүй (DB-г backend .env-ээс авна).
// Хариу: RetResponse.ResponseCode "10" амжилттай, "11" алдаа/хоосон.
// Талбарын `?` — заавал биш (Postman-д ✔ тэмдэггүй).

import { apiPost, type Paged, type PageParams } from "@/lib/api-client";

type Id = number;
/** Combo/сонголтын нийтлэг мөр. */
export interface Option {
	id: number | string;
	title: string;
}
/** Хадгалах үйлдлийн хариу (шинэ id). */
export interface SavedId {
	RtrID?: number;
	NewID?: number;
	RetID?: number;
}
/** CMS-ээс олноор татах үйлдлийн хариу. */
export interface ImportResult {
	total: number;
	success: number;
	failed: number;
	errors: { code: string; message: string }[];
}

// ============================================================
// 01. Сургуулийн мэдээлэл (SchoolInformation.aspx)
// ============================================================
export const schoolInfo = {
	/** ss_school_list — үндсэн мэдээлэл + түвшин + жагсаалтууд */
	info: (b: { school_id: Id }) => apiPost("/schoolinfo/info", b),
	/** ss_cbox_sym — аймаг/нийслэл */
	aimag: () =>
		apiPost<{ AimagID: string; AimagName: string }[]>("/schoolinfo/aimag"),
	/** ss_cbox_sym — сум/дүүрэг */
	sym: (b: { aimag_id: string }) =>
		apiPost<{ SymID: string; SymName: string }[]>("/schoolinfo/sym", b),
	/** ss_cbox_sym — баг/хороо */
	horoo: (b: { aimag_id: string; sym_id: string }) =>
		apiPost<{ HorooID: string; HorooName: string }[]>("/schoolinfo/horoo", b),
	/** sb_combo_fill — сургуулийн ангилал */
	categories: (b: { school_id: Id }) =>
		apiPost<Option[]>("/schoolinfo/categories", b),
	/** ss_school_iud — зөвхөн засна */
	save: (b: {
		school_id: Id;
		sch_name: string;
		sch_regnum?: string;
		category_id?: number;
		is_payment?: number;
		aimag_id: string;
		sym_id: string;
		horoo_id?: string;
		address?: string;
		phone?: string;
		email?: string;
		web?: string;
		zasah?: number;
		facebook?: string;
		chk_baga?: boolean;
		chk_dund?: boolean;
		chk_ahlah?: boolean;
		chk_nasan?: boolean;
		chk_ded?: boolean;
		chk_group?: boolean;
		user_id: Id;
	}) => apiPost<SavedId>("/schoolinfo/save", b),
};

// ============================================================
// 02. Хичээл (nmLessonList.aspx)
// ============================================================
export const lesson = {
	/** manager_nmglCurLessonList */
	list: (b: { school_id: Id }) => apiPost("/lesson/list", b),
	/** manager_nmglCurLessonCbx */
	combo: (b: { school_id: Id }) => apiPost<Option[]>("/lesson/combo", b),
	/** manager_nmglLessonCrud — id 0 = шинэ */
	save: (b: {
		id?: Id;
		lessoncode: string;
		lessonname: string;
		user_id: Id;
		school_id: Id;
	}) => apiPost<SavedId>("/lesson/save", b),
	/** manager_nmglLessonCrud (optype 2) */
	remove: (b: { id: Id; user_id: Id; school_id: Id }) =>
		apiPost("/lesson/delete", b),
};

// ============================================================
// 03. Багш, ажилтан (Teachers.aspx, TeacherU.aspx)
// ============================================================
export const teacher = {
	/** sch_admincbxref — албан тушаал */
	positions: () => apiPost<Option[]>("/teacher/ref/positions"),
	/** sch_admincbxref — хэрэглэгчийн төрөл (ugroup) */
	userTypes: () => apiPost<Option[]>("/teacher/ref/usertypes"),
	/** sch_configcomboboxes — мэргэжил */
	professions: () => apiPost("/teacher/ref/professions"),
	/** sch_configcomboboxes — хүйс */
	genders: () =>
		apiPost<{ typeid: number; typename: string }[]>("/teacher/ref/genders"),
	/** manager_TeachersDataList */
	list: (
		b: {
			aimag_id?: string;
			sym_id?: string;
			school_id: string | Id;
			position_id?: number;
			tenhim_id?: number;
			filter?: string;
		} & PageParams,
	) => apiPost<Paged>("/teacher/list", b),
	/** manager_getTeachersbyId */
	get: (b: { teacher_id: Id }) => apiPost("/teacher/get", b),
	/** manager_nmglTeacherCrud — teacher_id 0 = шинэ */
	save: (b: {
		teacher_id?: Id;
		firstname: string;
		lastname: string;
		register: string;
		phone?: string;
		email?: string;
		aimag_id?: string;
		sym_id?: string;
		school_id: Id;
		ugroup: number;
		position_id?: number;
		profession_id?: number;
		tenhim_id?: number;
		login_name?: string;
		password?: string;
		user_id: Id;
		dateofbirth?: string;
		gender?: number;
		img_url?: string;
		edu_levels?: number[];
	}) => apiPost<SavedId>("/teacher/save", b),
	/** manager_TeacherDelete — идэвхгүй болгох */
	remove: (b: { teacher_id: Id }) => apiPost("/teacher/delete", b),
	/** manager_TeacherPassRecovery — нууц үг 1234 болгоно */
	resetPassword: (b: { teacher_id: Id; user_id: Id }) =>
		apiPost("/teacher/password/reset", b),
	/** manager_nmglGetTeachinglesson — заадаг хичээлүүд */
	lessons: (b: { teacher_id: Id }) => apiPost("/teacher/lessons", b),
	/** manager_nmglGetLessonstoteacher — сонгох хичээлүүд */
	chooseLessons: (b: { teacher_id: Id; school_id: Id }) =>
		apiPost("/teacher/lessons/choose", b),
	/** manager_nmglUpdateTeachtolesson — хичээл холбох */
	saveLessons: (b: { teacher_id: Id; lesson_ids?: number[]; user_id: Id }) =>
		apiPost("/teacher/lessons/save", b),
	/** manager_nmglDeleteTeachtolesson — хичээл хасах */
	removeLesson: (b: { idd: Id }) => apiPost("/teacher/lessons/delete", b),
};

// ============================================================
// 04. Суралцагч (nmStudents.aspx, nmStudent.aspx)
// ============================================================
export const student = {
	/** manager_nmglGetAtiveStatusCbx — 0 бүгд, 1 эрхтэй, 2 эрхгүй */
	statuses: () => apiPost<Option[]>("/student/ref/status"),
	/** curr_data_cbx_fill — хөтөлбөр */
	curriculums: () =>
		apiPost<{ id: number; currplan_name: string }[]>("/student/ref/curr"),
	/** manager_nmglGetAtiveCbx — эрхийн төрөл */
	licenseTypes: () => apiPost("/student/ref/license-types"),
	/** manager_nmglGetStudentsFiter — school_db "EDU_CONFIG" = бүх сургууль */
	list: (
		b: {
			aimag_id?: number;
			sym_id?: number;
			school_db?: string;
			curr_id?: number;
			filter?: string;
			status?: number;
		} & PageParams,
	) => apiPost<Paged>("/student/list", b),
	/** manager_nmglDeleteStudent */
	remove: (b: { student_id: Id }) => apiPost("/student/delete", b),
	/** sb_recoverPassStudent */
	resetPassword: (b: { student_id: Id }) =>
		apiPost("/student/password/reset", b),
	/** SysUserGetPlan — суралцагчийн хөтөлбөрүүд */
	plans: (b: { student_id: Id }) => apiPost("/student/plans", b),
	/** manager_nmglgetLicensebyUser */
	licenses: (b: { student_id: Id; curr_id?: number }) =>
		apiPost("/student/license/list", b),
	/** manager_nmglLicense — эрх олгох/сунгах (sdate < edate) */
	saveLicense: (b: {
		student_id: Id;
		curr_id: Id;
		sdate: string;
		edate: string;
		license_type?: number;
	}) => apiPost("/student/license/save", b),
};

// ============================================================
// 05. Эрх үүсгэх (AutoCreateUsers.aspx)
// ============================================================
export const autoUser = {
	/** ad_creatusersyesh — count 1–500 */
	create: (b: {
		aimag_id: Id;
		school_db: string;
		aimag_name: string;
		sym_name?: string;
		school_name: string;
		count: number;
		user_id: Id;
	}) => apiPost("/autouser/create", b),
	/** ad_createddatalist — өнөөдөр үүсгэсэн эрхүүд (хэвлэх) */
	list: (b: { aimag_id: string; school_db: string; date?: string }) =>
		apiPost("/autouser/list", b),
};

// ============================================================
// 06. Баннер (ReklamList.aspx, ReklamEdit.aspx)
// ============================================================
export const banner = {
	/** reklam_types_list */
	types: () => apiPost("/reklam/types"),
	/** reklam_list — flag: -1 бүгд, 1 идэвхтэй, 0 идэвхгүй */
	list: (b: {
		school_id?: Id;
		type_id?: number;
		flag?: number;
		search?: string;
	}) => apiPost("/reklam/list", b),
	/** reklam_byId */
	get: (b: { id: Id }) => apiPost("/reklam/get", b),
	/** reklam_aimag_list — чиглүүлэх аймаг */
	aimag: () => apiPost("/reklam/aimag"),
	/** reklam_sym_list — чиглүүлэх сум */
	sym: (b: { aimag_id: Id }) => apiPost("/reklam/sym", b),
	/** reklam_crud — id 0 = шинэ */
	save: (b: {
		id: Id;
		type_id: number;
		title: string;
		descr?: string;
		filename: string;
		uploaded?: string;
		file_ext?: string;
		file_type?: number;
		url?: string;
		platform?: number;
		start_date?: string;
		end_date?: string;
		sort_order?: number;
		weight?: number;
		duration_sec?: number;
		can_skip?: boolean;
		active?: boolean;
		user_id: Id;
		school_id?: Id;
		targets?: { aimag_id: number; sym_id: number }[];
	}) => apiPost<SavedId>("/reklam/save", b),
	/** reklam_crud — устгах */
	remove: (b: { id: Id; user_id: Id }) => apiPost("/reklam/delete", b),
};

// ============================================================
// 07. Захидал — илгээгч (LetterList/Edit/View.aspx)
// ============================================================
export interface LetterTarget {
	aimag_id: number;
	sym_id: number;
	schooldb: string;
	class_id: number;
	label?: string;
}
export const letterAdmin = {
	/** letter_types_list */
	types: () => apiPost("/letter-admin/types"),
	/** letter_list — status: -1 бүгд, 0 ноорог, 1 илгээсэн, 2 товлосон */
	list: (b: { school_id?: Id; status?: number; search?: string }) =>
		apiPost("/letter-admin/list", b),
	/** letter_byId */
	get: (b: { id: Id }) => apiPost("/letter-admin/get", b),
	/** letter_senders_recent */
	senders: (b: { school_id?: Id }) => apiPost("/letter-admin/senders", b),
	/** letter_aimag_list */
	aimag: (b: { school_id?: Id }) => apiPost("/letter-admin/aimag", b),
	/** letter_sym_list */
	sym: (b: { aimag_id: Id; school_id?: Id }) => apiPost("/letter-admin/sym", b),
	/** letter_school_list */
	schools: (b: { aimag_id?: Id; sym_id?: Id; school_id?: Id }) =>
		apiPost("/letter-admin/schools", b),
	/** letter_class_list */
	classes: (b: { schooldb: string; school_id?: Id }) =>
		apiPost("/letter-admin/classes", b),
	/** letter_target_count — хүлээн авагчийн тоо */
	targetCount: (b: { targets?: LetterTarget[]; school_id?: Id }) =>
		apiPost<{ count: number }>("/letter-admin/target-count", b),
	/** letter_crud — send=true бол илгээнэ */
	save: (b: {
		id?: Id;
		type_id: number;
		subject: string;
		body: string;
		priority?: number;
		require_ack?: boolean;
		sender_name?: string;
		sender_title?: string;
		sender_org?: string;
		send_date?: string;
		expire_date?: string;
		school_id?: Id;
		user_id: Id;
		targets?: LetterTarget[];
		files?: {
			filename: string;
			uploaded: string;
			file_ext: string;
			file_size: number;
		}[];
		send?: boolean;
	}) => apiPost<SavedId>("/letter-admin/save", b),
	/** letter_crud — устгах */
	remove: (b: { id: Id; school_id?: Id; user_id: Id }) =>
		apiPost("/letter-admin/delete", b),
	/** letter_recipients_list — filter: 0 бүгд, 1 уншаагүй, 2 уншсан, 3 танилцсан */
	recipients: (
		b: { letter_id: Id; filter?: number; search?: string } & PageParams,
	) => apiPost("/letter-admin/recipients", b),
	/** letter_remind — уншаагүйд сануулах */
	remind: (b: { letter_id: Id; user_id: Id }) =>
		apiPost("/letter-admin/remind", b),
};

// ============================================================
// 08. CMS лавлахууд (CMS/*.aspx)
// ============================================================
/** project, curr_level, curr_lesson, test_type, test_dedication, elesson_type, curr_type, soril_category, elesson_source */
export type CmsRefKind =
	| "project"
	| "curr_level"
	| "curr_lesson"
	| "test_type"
	| "test_dedication"
	| "elesson_type"
	| "curr_type"
	| "soril_category"
	| "elesson_source";
interface CmsRefFilter {
	kind: CmsRefKind;
	project_code?: string;
	lesson_code?: string;
}
export const cmsRef = {
	/** Лавлахын төрлүүд (цэс/таб үүсгэх) */
	kinds: () =>
		apiPost<{ kind: CmsRefKind; title: string; scope: string }[]>(
			"/cmsref/kinds",
		),
	/** inf_cbox_data — төсөл (project_code) */
	projects: (b: { school_id?: Id }) => apiPost<Option[]>("/cmsref/projects", b),
	/** exam_cbox_data — хичээл (сорилын ангилалд) */
	lessons: (b: { user_id: Id }) => apiPost<Option[]>("/cmsref/lessons", b),
	/** Татсан лавлах (манай DB) */
	list: (b: CmsRefFilter) => apiPost("/cmsref/list", b),
	/** CMS-ийн лавлах */
	remote: (b: CmsRefFilter) => apiPost("/cmsref/remote", b),
	/** CMS-ээс сонгосон кодуудыг татах */
	importCodes: (b: CmsRefFilter & { codes: string[]; user_id: Id }) =>
		apiPost<ImportResult>("/cmsref/import", b),
	/** Лавлахын мөр устгах */
	remove: (b: { kind: CmsRefKind; id: Id; user_id: Id }) =>
		apiPost("/cmsref/delete", b),
};

// ============================================================
// 09. Сургалтын төлөвлөгөө (TeachLessonPlan.aspx)
// ============================================================
export const plan = {
	/** exam_cbox_data — миний хичээлүүд */
	lessons: (b: { user_id: Id }) => apiPost<Option[]>("/plan/lessons", b),
	/** curr_plan_cbx_fill — хөтөлбөр сонголт */
	curr: (b: { lesson_id: Id; school_id: Id }) =>
		apiPost<{ id: number; currplan_name: string }[]>("/plan/curr", b),
	/** materials_ulesson_cbx_fill — бүлэг сэдэв сонголт */
	ulessonsCombo: (b: { lesson_id: Id; curr_id: Id; school_id: Id }) =>
		apiPost<{ id: number; ulesson_name: string }[]>("/plan/ulessons/combo", b),
	/** inf_cbox_data — хичээлийн хэлбэр (formofstudy) */
	lessonTypes: (b: { school_id?: Id }) => apiPost("/plan/lesson-types", b),
	topics: {
		/** lesson_plan_utopic — хөтөлбөрийн жагсаалт */
		list: (b: { lesson_id?: Id; user_id: Id; school_id: Id }) =>
			apiPost("/plan/topics/list", b),
		/** curr_topicplan_info */
		get: (b: { id: Id }) => apiPost("/plan/topics/get", b),
		/** curr_topic_class_choose — id 0 = шинэ */
		save: (b: {
			id?: Id;
			topic_name: string;
			descr?: string;
			lesson_id: Id;
			is_pay?: boolean;
			amount?: number;
			is_pack?: boolean;
			discount?: number;
			user_id: Id;
		}) => apiPost<SavedId>("/plan/topics/save", b),
		/** curr_topic_class_choose — устгах */
		remove: (b: { id: Id; user_id: Id }) => apiPost("/plan/topics/delete", b),
	},
	/** lesson_plan_uless + lesson_plan_rless — бүлэг сэдэв ба сэдвүүдийн мод */
	tree: (b: {
		lesson_id: Id;
		curr_id: Id;
		ulesson_id?: Id;
		filter?: string;
		user_id: Id;
		school_id: Id;
	}) => apiPost("/plan/tree", b),
	/** lesson_plan_uless_dash — хураангуй */
	dash: (b: {
		curr_id: Id;
		lesson_id: Id;
		school_id: Id;
		user_id: Id;
		ulesson_id?: Id;
	}) => apiPost("/plan/dash", b),
	ulesson: {
		/** teach_ulesson_info */
		get: (b: { id: Id }) => apiPost("/plan/ulesson/get", b),
		/** curr_unit_lesson_iud */
		save: (b: {
			id?: Id;
			ulesson_name: string;
			lesson_id: Id;
			curr_id: Id;
			user_id: Id;
		}) => apiPost<SavedId>("/plan/ulesson/save", b),
		/** curr_unit_lesson_iud — устгах */
		remove: (b: { id: Id; user_id: Id }) => apiPost("/plan/ulesson/delete", b),
		/** curr_learning_obj_list_1 — суралцахуйн зорилт */
		objectives: (b: { ulesson_id: Id }) =>
			apiPost("/plan/ulesson/objectives", b),
	},
	rlesson: {
		/** teach_rlesson_info */
		get: (b: { id: Id }) => apiPost("/plan/rlesson/get", b),
		/** teach_rlesson_insert */
		save: (b: {
			id?: Id;
			lesson_id: Id;
			curr_id: Id;
			ulesson_id: Id;
			rtime: number;
			formofstudy?: number;
			rlessonname: string;
			user_id: Id;
		}) => apiPost<SavedId>("/plan/rlesson/save", b),
		/** teach_rlesson_insert — устгах */
		remove: (b: { id: Id; lesson_id: Id; user_id: Id }) =>
			apiPost("/plan/rlesson/delete", b),
		/** teach_elesson_insert — сэдвийг цахим хичээл болгох */
		toElesson: (b: { id: Id; lesson_id: Id; user_id: Id }) =>
			apiPost("/plan/rlesson/elesson", b),
	},
	cms: {
		/** CMS api_currdata — CMS-ийн хөтөлбөрүүд */
		remote: (b: { lesson_id: Id }) => apiPost("/plan/cms/remote", b),
		/** cms_curr_data_save — CMS-ээс хөтөлбөр татах */
		importCodes: (b: { lesson_id: Id; curr_codes: string[]; user_id: Id }) =>
			apiPost<ImportResult>("/plan/cms/import", b),
	},
};

// ============================================================
// 10a. Даалгаврын сан (QuestionBank, QuestionEdit, CurrTestSource)
// ============================================================
/** teachers, lessons, classes, curr, ulessons, rlessons, ulessons_all, sources, que_types, levels, skills, types, dedications */
export type QuestionRefName =
	| "teachers"
	| "lessons"
	| "classes"
	| "curr"
	| "ulessons"
	| "rlessons"
	| "ulessons_all"
	| "sources"
	| "que_types"
	| "levels"
	| "skills"
	| "types"
	| "dedications";
export interface QuestionAnswerInput {
	text: string;
	html: string;
	is_true?: boolean;
	refid?: number;
}
export interface QuestionPairInput {
	text: string;
	html: string;
	match: number;
	refid: number;
	descr?: string;
}
export const question = {
	/** Сонголтын лавлах */
	ref: (b: {
		name: QuestionRefName;
		lesson_id?: Id;
		curr_id?: Id;
		ulesson_id?: Id;
		teacher_id?: Id;
		user_id: Id;
		school_id?: Id;
	}) => apiPost<Option[]>("/question/ref", b),
	/** test_list — даалгаврын жагсаалт */
	list: (
		b: {
			question_id?: Id;
			lesson_id?: Id;
			curr_id?: Id;
			ulesson_id?: Id;
			rlesson_id?: Id;
			source_id?: Id;
			teacher_id?: Id;
			accepted?: boolean;
			checking?: boolean;
			warning?: boolean;
			has_bodolt?: boolean;
			has_analys?: boolean;
			que_type?: number;
			iscore?: number;
		} & PageParams,
	) => apiPost<Paged>("/question/list", b),
	/** test_info — дэлгэрэнгүй (засах/харах) */
	get: (b: { question_id: Id }) => apiPost("/question/get", b),
	/** test_iud / test_harg_iud — que_type_id 6 бол pairs, бусад нь answers */
	save: (b: {
		question_id?: Id;
		lesson_id: Id;
		ulesson_id: Id;
		rlesson_id?: Id;
		source_id?: Id;
		que_type_id: number;
		que_level_id?: number;
		que_usage?: number;
		que_dedication?: number;
		iscore?: number;
		question_html: string;
		que_zaawar?: string;
		que_descr?: string;
		que_analys?: string;
		question_img?: string;
		descr_img?: string;
		analys_img?: string;
		onoo?: number;
		answers?: QuestionAnswerInput[];
		pairs?: QuestionPairInput[];
		aimag_id?: string;
		sym_id?: string;
		user_id: Id;
		school_id: Id;
	}) => apiPost<SavedId>("/question/save", b),
	/** test_iud — устгах (шалгалтад ашиглагдаж байвал устгахгүй) */
	remove: (b: { question_id: Id; user_id: Id; school_id: Id }) =>
		apiPost("/question/delete", b),
	/** test_iud — нуух / ил болгох */
	hide: (b: { question_id: Id; user_id: Id; school_id: Id }) =>
		apiPost("/question/hide", b),
	/** test_log_list — хяналтын түүх */
	log: (b: { question_id: Id }) => apiPost("/question/log", b),
	/** test_log_iud — log_type 3 алдаа мэдэгдэх, 4 засаад дахин хянуулах */
	saveLog: (b: {
		question_id: Id;
		descr?: string;
		log_type: number;
		user_id: Id;
	}) => apiPost("/question/log/save", b),
	/** test_get_que_id — бодолт/шинжилгээ */
	bodolt: (b: { question_id: Id }) => apiPost("/question/bodolt", b),
	source: {
		/** curr_test_source_by_ulessid — бүлэг сэдвийн даалгаврын эхүүд */
		list: (b: { ulesson_id: Id }) => apiPost("/question/source/list", b),
		/** curr_test_source_info */
		get: (b: { id: Id }) => apiPost("/question/source/get", b),
		/** curr_test_source_iud */
		save: (b: {
			id?: Id;
			source_title: string;
			source_html?: string;
			class_id?: Id;
			lesson_id: Id;
			ulesson_id: Id;
			filename?: string;
			user_id: Id;
			school_id: Id;
		}) => apiPost<SavedId>("/question/source/save", b),
		/** curr_test_source_iud — устгах */
		remove: (b: { id: Id; user_id: Id; school_id: Id }) =>
			apiPost("/question/source/delete", b),
	},
	cms: {
		/** CMS шүүлтийн сонголтууд */
		ref: (b: {
			name: string;
			lesson_code?: string;
			curr_code?: string;
			ulesson_code?: string;
			school_id?: Id;
		}) => apiPost("/question/cms/ref", b),
		/** CMS api_testdb_nuudel_skuul — CMS-ийн даалгаврууд */
		remote: (b: {
			lesson_code: string;
			curr_code?: string;
			ulesson_code?: string;
			rlesson_code?: string;
			class_code?: string;
			curr_type?: string;
			owner?: number;
			school_code?: string;
			login?: string;
		}) => apiPost("/question/cms/remote", b),
		/** cms_test_iud — CMS-ээс даалгавар татах */
		importCodes: (b: {
			lesson_code: string;
			codes: string[];
			user_id: Id;
			school_id: Id;
		}) => apiPost<ImportResult>("/question/cms/import", b),
	},
};

// ============================================================
// 10b. Тест, сорил, шалгалтын сан (ExamList, ExamMaterials ...)
// ============================================================
/** 1 тест, 2 шалгалт, 3 сорил */
export type TestType = 1 | 2 | 3;
export interface ExamAddressInput {
	type_id: number;
	type_name: string;
	aimag_id: number;
	aimagidname: string;
	sym_id: number;
	districtname: string;
	school_id: string;
	schoolname: string;
	zclass_id: number;
	zclass_name: string;
	class_id: string;
	classname: string;
}
export interface ExamRuleInput {
	lesson_id: Id;
	lesson_name: string;
	/** "id~optype" */
	sub: string;
	sub_name: string;
	count: number;
	question_ids?: number[];
}
export const exam = {
	/** Сонголтын лавлах (teachers, lessons, exam_types, curr, subs, cats ...) */
	ref: (b: {
		name: string;
		ulesson_id?: Id;
		teacher_id?: Id;
		lesson_id?: Id;
		curr_id?: Id;
		lesson_type?: number;
		user_id: Id;
		school_id: Id;
	}) => apiPost("/exam/ref", b),
	tests: {
		/** my_test_list_dash — тоон мэдээлэл */
		dash: (b: { lesson_id?: Id; teacher_id?: Id; test_type: TestType }) =>
			apiPost("/exam/tests/dash", b),
		/** my_test_list — миний тест/сорил/шалгалтын материал */
		list: (
			b: {
				teacher_id?: Id;
				lesson_id?: Id;
				exam_type?: number;
				filter?: string;
				test_type: TestType;
				sdate?: string;
				edate?: string;
				optype?: number;
				school_id: Id;
			} & PageParams,
		) => apiPost<Paged>("/exam/tests/list", b),
		/** my_test_intro_iud — устгах */
		remove: (b: { test_id: Id; user_id: Id; school_id: Id }) =>
			apiPost("/exam/tests/delete", b),
	},
	exams: {
		/** my_exam_list — авсан шалгалтууд */
		list: (
			b: {
				teacher_id?: Id;
				lesson_id?: Id;
				filter?: string;
				test_type: TestType;
				exam_type?: number;
				optype?: number;
				sdate?: string;
				edate?: string;
				school_id: Id;
			} & PageParams,
		) => apiPost<Paged>("/exam/exams/list", b),
		/** examadd_iud — шалгалт авах/засах (sdate < edate ≤ enddate) */
		save: (b: {
			exam_id?: Id;
			test_id: Id;
			minute: number;
			sdate: string;
			edate: string;
			enddate: string;
			test_type: TestType;
			user_id: Id;
			school_id: Id;
			address?: ExamAddressInput[];
		}) => apiPost<SavedId>("/exam/exams/save", b),
		/** examadd_iud — устгах (сурагч ажилласан бол устгахгүй) */
		remove: (b: {
			exam_id: Id;
			test_type: TestType;
			user_id: Id;
			school_id: Id;
		}) => apiPost("/exam/exams/delete", b),
		/** exam_live_addr_info — хамрах хүрээ */
		address: (b: { exam_id: Id }) => apiPost("/exam/exams/address", b),
		/** result_examaddr — үр дүн (хүрээгээр) */
		result: (b: { exam_id: Id }) => apiPost("/exam/exams/result", b),
	},
	test: {
		/** my_test_info — материал (бүрэн) */
		get: (b: { test_id: Id; user_id: Id; school_id: Id }) =>
			apiPost("/exam/test/get", b),
		/** my_test_intro_iud — ерөнхий мэдээлэл (1-р алхам) */
		save: (b: {
			test_id?: Id;
			test_type: TestType;
			lesson_id: Id;
			purpose_id?: Id;
			title: string;
			descr?: string;
			help?: string;
			exam_type?: number;
			cat_id?: number;
			show_bodolt?: boolean;
			is_open_soril?: boolean;
			soril_enddate?: string;
			execute_limit?: boolean;
			show_true_ans?: boolean;
			show_analys?: boolean;
			minute?: number;
			second?: number;
			is_pay?: boolean;
			amount?: number;
			is_pack?: boolean;
			user_id: Id;
			school_id: Id;
		}) => apiPost<SavedId>("/exam/test/save", b),
		/** exam_get_test_cnt — эх сурвалж дахь асуултын тоо */
		ruleCount: (b: { lesson_id: Id; sub: string; user_id: Id }) =>
			apiPost<{ test_ttl_cnt: number }>("/exam/test/rule-count", b),
		/** test_all_list — гараар сонгох асуултууд */
		candidates: (
			b: {
				user_id: Id;
				lesson_id: Id;
				sub?: string;
				que_type_id?: number;
				que_group?: number;
				que_use?: number;
				que_core?: number;
				que_dedication?: number;
			} & PageParams,
		) => apiPost("/exam/test/candidates", b),
		/** my_test_details_iud — асуулт сонгох дүрэм (2-р алхам) */
		saveQuestions: (b: {
			test_id: Id;
			test_type: TestType;
			rules?: ExamRuleInput[];
			user_id: Id;
		}) => apiPost("/exam/test/questions/save", b),
		/** bprint_get_topic — Blueprint: бүлэг сэдвүүд */
		blueprintTopics: (b: {
			curr_id: Id;
			lesson_id: Id;
			user_id: Id;
			ulesson_id?: Id;
		}) => apiPost("/exam/test/blueprint/topics", b),
		/** bprint_get_questions — Blueprint: асуулт санамсаргүй сонгох */
		blueprintPick: (b: {
			lesson_id: Id;
			items?: {
				ulesson_id: Id;
				rlesson_id: Id;
				level: number;
				count: number;
			}[];
			user_id: Id;
		}) => apiPost("/exam/test/blueprint/pick", b),
		question: {
			/** exam_test_info */
			get: (b: { exam_que_id: Id }) => apiPost("/exam/test/question/get", b),
			/** exam_get_test_info — засах дэлгэцийн толгой */
			context: (b: { test_id: Id; exam_que_id?: Id }) =>
				apiPost("/exam/test/question/context", b),
			/** exam_test_iud / exam_test_harg_iud */
			save: (b: {
				test_id: Id;
				exam_que_id?: Id;
				lesson_id: Id;
				ulesson_id?: Id;
				que_type_id: number;
				que_level_id?: number;
				que_usage?: number;
				source_id?: Id;
				question_html: string;
				que_descr?: string;
				que_analys?: string;
				question_img?: string;
				descr_img?: string;
				analys_img?: string;
				onoo?: number;
				answers?: QuestionAnswerInput[];
				pairs?: QuestionPairInput[];
				user_id: Id;
				school_id: Id;
			}) => apiPost<SavedId>("/exam/test/question/save", b),
			/** exam_questions_delete — материалаас хасах */
			remove: (b: { exam_que_id: Id }) =>
				apiPost("/exam/test/question/delete", b),
			/** stu_question_analyse — бодолт/шинжилгээ */
			bodolt: (b: { exam_que_id: Id; user_id: Id }) =>
				apiPost("/exam/test/question/bodolt", b),
		},
		/** my_test_quiz_choosed — туршиж үзэх (зөв хариутай) */
		practice: (b: { test_id: Id; school_id: Id; user_id: Id }) =>
			apiPost("/exam/test/practice", b),
		/** my_test_pdf — хэвлэх/экспорт */
		export: (b: { test_id: Id; user_id: Id }) =>
			apiPost("/exam/test/export", b),
	},
	cms: {
		/** CMS api_my_testdb_nuudel — CMS-ийн тест/сорилууд */
		remote: (b: {
			lesson_code: string;
			curr_type?: string;
			cat_code?: string;
			owner?: number;
			school_code?: string;
			login?: string;
		}) => apiPost("/exam/cms/remote", b),
		/** cms_mytestdb_iud + cms_exam_test_iud — CMS-ээс татах */
		importCodes: (b: {
			lesson_code: string;
			codes: string[];
			test_type: TestType;
			user_id: Id;
			school_id: Id;
		}) => apiPost<ImportResult>("/exam/cms/import", b),
	},
};

// ============================================================
// 11. Live хичээл (LiveLessons, LiveLessonEdit ...)
// ============================================================
export const live = {
	/** Багшууд (менежерт бүгд) */
	teachers: (b: { user_id: Id }) =>
		apiPost<{ teacher_id: number; teach_name: string }[]>("/live/teachers", b),
	/** Багшийн хичээлүүд */
	lessons: (b: { user_id: Id; teacher_id?: Id }) =>
		apiPost<Option[]>("/live/lessons", b),
	/** Live-ийн төрөл (Zoom, Google Meet ...) */
	types: () => apiPost<Option[]>("/live/types"),
	/** Тухайн оны live хичээлүүд */
	list: (
		b: {
			user_id: Id;
			teacher_id?: Id;
			lesson_id?: Id;
			ltype?: number;
		} & PageParams,
	) => apiPost<Paged>("/live/list", b),
	/** Дэлгэрэнгүй — RetDataFirst мэдээлэл, RetDataSecond ангиуд */
	info: (b: { live_id: Id }) => apiPost("/live/info", b),
	/** Бүртгэх / засах — live_id 0 = шинэ */
	save: (b: {
		user_id: Id;
		live_id: Id;
		lesson_id: Id;
		lesson_name: string;
		sdate: string;
		contime: number;
		ltype: number;
		url: string;
		title?: string;
		pass?: string;
		descr?: string;
		ispay?: number;
		amount?: number;
	}) => apiPost<{ live_id: number }>("/live/save", b),
	/** Устгах (суралцагч холбогдсон бол хориглоно) */
	remove: (b: { user_id: Id; live_id: Id }) => apiPost("/live/delete", b),
	/** Холбогдсон суралцагчид */
	students: (b: { live_id: Id; filter?: string } & PageParams) =>
		apiPost("/live/students", b),
	/** Хадгалсан бичлэг */
	content: (b: { live_id: Id }) => apiPost("/live/content", b),
	/** Бичлэг/контентыг бүхэлд нь хадгалах */
	saveContent: (b: {
		user_id: Id;
		live_id: Id;
		descr: string;
		is_open?: boolean;
		items: { kind: "url" | "file"; url: string }[];
	}) => apiPost("/live/content/save", b),
};

// ============================================================
// 12. Цахим хичээл (ELibrary)
// ============================================================
export type ElibContentKind =
	| "text"
	| "link"
	| "youtube"
	| "image"
	| "video"
	| "audio"
	| "document"
	| "gdoc"
	| "test"
	| "soril";
export interface ElibContentInput {
	id: number | null;
	kind: ElibContentKind;
	title: string;
	descr?: string;
	text?: string;
	url?: string;
	filename?: string;
	is_homework?: boolean;
	my_test_id?: Id;
	is_date?: boolean;
	exam_edate?: string;
}
interface ElibCmsFilter {
	login?: string;
	lesson_id?: Id;
	ulesson_id?: Id;
	lesson_code?: string;
	class_code?: string;
	source_code?: string;
	type_code?: string;
	owner?: string;
	school_code?: string;
}
export const elib = {
	/** Багшийн заадаг ангиуд */
	classes: (b: { user_id: Id }) => apiPost<Option[]>("/elib/classes", b),
	/** Ангийн хичээлүүд (class_id 0 = бүгд) */
	lessons: (b: { user_id: Id; class_id: Id }) =>
		apiPost<Option[]>("/elib/lessons", b),
	/** Сэдвийн мод: Нэгж → Ээлжит */
	tree: (b: { user_id: Id; school_id: Id; class_id: Id; lesson_id: Id }) =>
		apiPost<
			{
				ulesson_id: number;
				ulesson_name: string;
				topics: { rlesson_id: number; title: string }[];
			}[]
		>("/elib/tree", b),
	/** Хавтасны жагсаалт (карт) */
	list: (
		b: {
			user_id: Id;
			class_id?: Id;
			lesson_id?: Id;
			ulesson_id?: Id;
			filter?: string;
		} & PageParams,
	) => apiPost<Paged>("/elib/list", b),
	/** Хавтас үүсгэх / засах — elib_id 0 = шинэ */
	save: (b: {
		user_id: Id;
		elib_id: Id;
		rlesson_id: Id;
		l_desc?: string;
		l_image?: string;
		l_flag?: number;
	}) => apiPost<{ elib_id: number }>("/elib/save", b),
	/** Нэг хавтас (толгой) */
	get: (b: { elib_id: Id }) => apiPost("/elib/get", b),
	/** Хавтас устгах (сурагч үзсэн/тест өгсөн бол устгахгүй) */
	remove: (b: { user_id: Id; elib_id: Id }) => apiPost("/elib/delete", b),
	/** Контент жагсаалт — RetDataFirst толгой, RetDataSecond контентууд */
	contents: (b: { elib_id: Id }) => apiPost("/elib/contents", b),
	/** Контентыг бүхэлд нь хадгалах (дараалал = дэлгэцийн дараалал) */
	saveContents: (b: { user_id: Id; elib_id: Id; items: ElibContentInput[] }) =>
		apiPost("/elib/contents/save", b),
	/** Холбох тест/сорил (test_type 1 тест, 3 сорил) */
	tests: (b: {
		user_id: Id;
		school_id: Id;
		rlesson_id: Id;
		test_type: 1 | 3;
	}) => apiPost<Option[]>("/elib/tests", b),
	/** Тестийн мэдээлэл */
	testInfo: (b: { my_test_id: Id }) => apiPost("/elib/tests/info", b),
	/** Хавтсыг үзсэн сурагчид */
	report: (b: { elib_id: Id }) => apiPost("/elib/report", b),
	/** Нэг сурагчийн дэлгэрэнгүй */
	studentReport: (b: { elib_id: Id; student_id: Id }) =>
		apiPost("/elib/report/student", b),
	cms: {
		/** CMS лавлах (lesson, class, type, source, school) */
		refs: (b: { kind: "lesson" | "class" | "type" | "source" | "school" }) =>
			apiPost<{ code: string; title: string }[]>("/elib/cms/refs", b),
		/** CMS цахим хичээлүүд */
		list: (b: ElibCmsFilter) => apiPost("/elib/cms/list", b),
		/** CMS-ээс импортлох (шүүлт cms/list-тэй ижил байх ёстой) */
		importOne: (
			b: ElibCmsFilter & {
				user_id: Id;
				rlesson_id: Id;
				cms_id: Id;
				l_image?: string;
				l_flag?: number;
			},
		) => apiPost<{ elib_id: number }>("/elib/cms/import", b),
	},
};
