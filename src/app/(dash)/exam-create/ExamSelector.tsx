"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookOpen, CalendarClock, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { getExam } from "@/lib/dash.api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Exam, ExamDate } from "@/types/dashboard/exam.types";

// Сонгогдсон шалгалтын төрөл
export interface SelectedExam {
	uiId: string; // RadioGroup-д ашиглах date.id
	examId: number; // exam.id
	examDateId: number; // exam_date_id (ESIS)
}

interface ExamSelectorProps {
	selectedExamDateId: string | null;
	onSelect: (exam: SelectedExam) => void;
}

export function ExamSelector({
	selectedExamDateId,
	onSelect,
}: ExamSelectorProps) {
	const { userId } = useAuthStore();

	const { data: exams = [], isLoading } = useQuery({
		queryKey: ["get_exam"],
		queryFn: () => getExam({ userId: userId ? Number(userId) : 0 }),
		enabled: !!userId,
		select: (res) => res.RetData || [],
	});

	// Сонголт хийх үед exam_date_id болон exam_id-г олох логик
	const handleValueChange = (dateIdStr: string) => {
		const dateId = Number(dateIdStr);
		for (const exam of exams) {
			const foundDate = exam.exam_dates.find((d) => d.id === dateId);
			if (foundDate) {
				onSelect({
					uiId: dateIdStr, // RadioGroup-ийн сонголтыг идэвхжүүлнэ
					examId: exam.exam_id,
					examDateId: foundDate.exam_date_id,
				});
				break;
			}
		}
	};

	return (
		<div className="h-full p-4 overflow-y-auto overflow-x-hidden">
			{isLoading ? (
				<div className="space-y-4 p-1">
					{[1, 2, 3].map((i) => (
						<div key={i} className="space-y-3">
							<Skeleton className="h-6 w-3/4 rounded-xl" />
							<div className="pl-6 space-y-2">
								<Skeleton className="h-14 w-full rounded-2xl" />
							</div>
						</div>
					))}
				</div>
			) : exams.length === 0 ? (
				<div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
					<span className="flex size-16 items-center justify-center rounded-full bg-pop-violet-soft text-pop-violet-ink">
						<BookOpen size={28} strokeWidth={2.5} />
					</span>
					<p className="text-sm font-bold">Шалгалт олдсонгүй</p>
				</div>
			) : (
				<div className="space-y-6">
					{exams.map((exam: Exam) => (
						<div key={exam.id} className="space-y-3">
							<div className="flex items-center gap-2 px-1">
								<h3 className="text-sm font-extrabold tracking-tight text-foreground">
									{exam.name}
								</h3>
								<Badge variant="sky" className="ml-auto h-6 shrink-0 rounded-full text-[11px] font-bold">
									{exam.duration} мин
								</Badge>
							</div>

							<RadioGroup
								value={selectedExamDateId || ""}
								onValueChange={handleValueChange}
								className="ml-2 space-y-2 border-l-2 border-dashed border-border pl-4"
							>
								{exam.exam_dates.map((date: ExamDate) => (
									<Label
										key={date.id}
										htmlFor={`date-${date.id}`}
										className={`group relative flex cursor-pointer items-center justify-between rounded-2xl border-2 p-3 transition-all ${
											selectedExamDateId === String(date.id)
												? "border-primary bg-primary/10 shadow-[0_3px_0_0_color-mix(in_oklch,var(--primary)_35%,transparent)]"
												: "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/50"
										}`}
									>
										<div className="flex items-center gap-3">
											<RadioGroupItem
												value={String(date.id)}
												id={`date-${date.id}`}
											/>
											<div className="flex flex-col gap-0.5">
												<div className="flex items-center gap-2 text-xs font-extrabold">
													<CalendarClock size={14} className="text-primary" strokeWidth={2.5} />
													{format(new Date(date.start_date), "yyyy.MM.dd")}
												</div>
												<div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
													<Clock size={12} />
													<span>
														{format(new Date(date.start_date), "HH:mm")} -{" "}
														{format(new Date(date.end_date), "HH:mm")}
													</span>
												</div>
											</div>
										</div>
										{selectedExamDateId === String(date.id) && (
											<Badge className="h-5 rounded-full px-2 text-[10px] font-black uppercase">
												Сонгосон
											</Badge>
										)}
									</Label>
								))}
							</RadioGroup>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
