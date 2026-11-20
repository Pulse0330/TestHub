import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TeacherShell } from "@/features/teacher/TeacherShell";

export const metadata: Metadata = {
	title: "Багшийн хэсэг",
};

export default function TeacherLayout({ children }: { children: ReactNode }) {
	return <TeacherShell>{children}</TeacherShell>;
}
