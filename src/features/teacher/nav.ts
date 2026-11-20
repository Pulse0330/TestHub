import {
	BookOpen,
	Building2,
	ClipboardList,
	Database,
	FileQuestion,
	GraduationCap,
	Image,
	LayoutDashboard,
	Library,
	ListTree,
	Mail,
	UserPlus,
	Users,
	Video,
} from "lucide-react";
import type { ElementType } from "react";

export interface TeacherNavItem {
	href: string;
	label: string;
	icon: ElementType;
	description: string;
}

export interface TeacherNavGroup {
	label: string;
	items: TeacherNavItem[];
}

export const TEACHER_HOME: TeacherNavItem = {
	href: "/teacher",
	label: "Нүүр",
	icon: LayoutDashboard,
	description: "Багшийн хэсгийн тойм",
};

export const TEACHER_NAV: TeacherNavGroup[] = [
	{
		label: "Сургалт",
		items: [
			{
				href: "/teacher/plan",
				label: "Төлөвлөгөө",
				icon: ListTree,
				description: "Хөтөлбөр, бүлэг сэдэв, сэдэв",
			},
			{
				href: "/teacher/questions",
				label: "Даалгаврын сан",
				icon: FileQuestion,
				description: "Даалгавар нэмэх, засах, хянах",
			},
			{
				href: "/teacher/exams",
				label: "Тест, шалгалт",
				icon: ClipboardList,
				description: "Тест, сорил, шалгалтын материал ба авах",
			},
			{
				href: "/teacher/live",
				label: "Live хичээл",
				icon: Video,
				description: "Zoom, Meet хичээл ба бичлэг",
			},
			{
				href: "/teacher/elib",
				label: "Цахим хичээл",
				icon: Library,
				description: "Цахим хичээлийн хавтас, контент",
			},
		],
	},
	{
		label: "Удирдлага",
		items: [
			{
				href: "/teacher/school",
				label: "Сургууль",
				icon: Building2,
				description: "Сургуулийн мэдээлэл",
			},
			{
				href: "/teacher/lessons",
				label: "Хичээл",
				icon: BookOpen,
				description: "Сургуулийн хичээлүүд",
			},
			{
				href: "/teacher/teachers",
				label: "Багш, ажилтан",
				icon: Users,
				description: "Багш бүртгэх, хичээл холбох",
			},
			{
				href: "/teacher/students",
				label: "Суралцагч",
				icon: GraduationCap,
				description: "Суралцагчид, эрх олгох",
			},
			{
				href: "/teacher/auto-users",
				label: "Эрх үүсгэх",
				icon: UserPlus,
				description: "Суралцагчийн эрх олноор үүсгэх",
			},
		],
	},
	{
		label: "Харилцаа",
		items: [
			{
				href: "/teacher/letters",
				label: "Захидал",
				icon: Mail,
				description: "Захидал илгээх, уншсан эсэх",
			},
			{
				href: "/teacher/banners",
				label: "Баннер",
				icon: Image,
				description: "Апп, вэбийн баннер",
			},
		],
	},
	{
		label: "Тохиргоо",
		items: [
			{
				href: "/teacher/cms",
				label: "CMS лавлах",
				icon: Database,
				description: "CMS-ээс лавлах татах",
			},
		],
	},
];

export const isNavActive = (pathname: string, href: string) =>
	href === "/teacher"
		? pathname === "/teacher"
		: pathname === href || pathname.startsWith(`${href}/`);
