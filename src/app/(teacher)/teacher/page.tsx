"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/features/teacher/components";
import { useTeacher } from "@/features/teacher/hooks";
import { TEACHER_NAV } from "@/features/teacher/nav";

/** Багшийн хэсгийн нүүр — бүх хэсэг рүү товчлол. */
export default function TeacherHomePage() {
	const { user, schoolName } = useTeacher();
	const name = user?.fname || user?.firstname || "Багш";
	return (
		<>
			<PageHeader
				title={`Сайн уу, ${name}`}
				description={schoolName || "Багшийн хэсэг"}
			/>
			<div className="space-y-8">
				{TEACHER_NAV.map((group) => (
					<section key={group.label}>
						<h2 className="mb-3 text-xs font-extrabold tracking-widest text-muted-foreground uppercase">
							{group.label}
						</h2>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{group.items.map(({ href, label, description, icon: Icon }) => (
								<Link
									key={href}
									href={href}
									className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"
								>
									<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft/60 text-primary-soft-foreground">
										<Icon className="size-5" strokeWidth={2.25} />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-sm font-extrabold">
											{label}
										</span>
										<span className="block truncate text-xs font-semibold text-muted-foreground">
											{description}
										</span>
									</span>
									<ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
								</Link>
							))}
						</div>
					</section>
				))}
			</div>
		</>
	);
}
