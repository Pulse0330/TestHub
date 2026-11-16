/**
 * TanStack Query key factory.
 *
 * Бүх key-г нэг газраас үүсгэснээр өөр өгөгдөл нэг key-г хуваалцах
 * (cache collision) болон invalidate хийхэд key буруу бичигдэхээс сэргийлнэ.
 * Key бүр scope-оор эхэлдэг тул `queryKeys.exams.all` гэх мэт prefix-ээр
 * бүхэлд нь invalidate хийж болно.
 */

type Id = number | string | null | undefined;

export const queryKeys = {
	testFilter: (userId: Id) => ["testFilter", userId] as const,

	exams: {
		all: ["exams"] as const,
		list: (userId: Id, lessonId: Id) =>
			["exams", "list", userId, lessonId] as const,
	},

	sorils: {
		all: ["sorils"] as const,
		list: (userId: Id, lessonId: Id) =>
			["sorils", "list", userId, lessonId] as const,
	},

	results: {
		all: ["results"] as const,
		examList: (userId: Id, lessonId: Id) =>
			["results", "exam-list", userId, lessonId] as const,
		sorilList: (userId: Id, lessonId: Id) =>
			["results", "soril-list", userId, lessonId] as const,
		/** Нэг тестийн товч дүн (examResult/result.tsx) */
		summary: (testId: Id) => ["results", "summary", testId] as const,
		/** Дэлгэрэнгүй дүн (examResult/[id], sorilResult/[id]) */
		detail: (testId: Id, examId: Id, userId: Id) =>
			["results", "detail", testId, examId, userId] as const,
		dun: (pointPerc: Id) => ["results", "dun", pointPerc] as const,
	},

	home: {
		all: ["homeScreen"] as const,
		screen: (userId: Id) => ["homeScreen", userId] as const,
	},

	payment: {
		courses: (userId: Id) => ["paymentCourses", userId] as const,
	},

	courses: {
		all: ["courses"] as const,
		filtered: (userId: Id, lessonId: Id) =>
			["courses", "filtered", userId, lessonId] as const,
		content: (contentId: Id, userId: Id) =>
			["contentView", contentId, userId] as const,
	},

	profile: {
		page: (userId: Id) => ["userProfilePage", userId] as const,
		aimags: ["profile", "aimags"] as const,
		districts: (aimagId: Id) => ["profile", "districts", aimagId] as const,
		schools: (aimagId: Id, districtId: Id) =>
			["profile", "schools", aimagId, districtId] as const,
		classes: (schoolDb: Id, serverIp: Id) =>
			["profile", "classes", schoolDb, serverIp] as const,
	},
} as const;
