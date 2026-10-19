// app/exam/component/ExamHeader.tsx
"use client";

import { Clock, FileText } from "lucide-react";

interface ExamHeaderProps {
	examInfo: {
		title: string;
		descr: string;
		help: string;
		minut: number;
		que_cnt: number;
		exam_type_name: string;
		ognoo: string;
	};
}

export function ExamHeader({ examInfo }: ExamHeaderProps) {
	return (
		<div className="min-w-0">
			<div className="flex min-w-0 items-center gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-pop-violet-soft text-pop-violet-ink shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-violet)_30%,transparent)] sm:size-11">
					<FileText className="size-5" strokeWidth={2.5} />
				</div>
				<div className="min-w-0 flex-1">
					{/* Title */}
					<h1 className="truncate text-base font-black tracking-tight text-foreground sm:text-lg">
						{examInfo.title}
					</h1>

					{/* Badges */}
					<div className="mt-0.5 flex items-center gap-1.5">
						<div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
							<FileText className="size-3 text-muted-foreground" />
							<span className="text-xs font-bold text-muted-foreground">
								{examInfo.que_cnt}
								<span className="ml-0.5 hidden sm:inline">асуулт</span>
							</span>
						</div>

						<div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
							<Clock className="size-3 text-muted-foreground" />
							<span className="text-xs font-bold text-muted-foreground">
								{examInfo.minut}
								<span className="ml-0.5">мин</span>
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
