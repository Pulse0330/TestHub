"use client";

import {
	AlertCircle,
	BookOpen,
	CheckCircle2,
	Clock,
	FileText,
	PlayCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentView } from "@/types/course/contentView";

interface HomeworkProps {
	content: ContentView;
	onStartExam?: (examId: number) => void;
}

export function Homework({ content, onStartExam }: HomeworkProps) {
	const [isStarting, setIsStarting] = useState(false);

	const handleStartExam = async () => {
		if (!content.exam_id || !onStartExam) return;

		setIsStarting(true);
		try {
			await onStartExam(content.exam_id);
		} catch (error) {
			console.error("Error starting exam:", error);
		} finally {
			setIsStarting(false);
		}
	};

	const getContentIcon = (type: number) => {
		if (type === 3) return <PlayCircle className="h-5 w-5" />;
		return <FileText className="h-5 w-5" />;
	};

	// Гэрийн даалгавар эсэхийг шалгах
	const isHomework = content.exam_id && content.examname;

	if (!isHomework) return null;

	return (
		<Card className="gap-0 py-0 overflow-hidden animate-pop-in">
			<div className="relative bg-gradient-to-br from-pop-sun-soft to-pop-coral-soft px-5 pt-5 pb-5 md:px-8 md:pt-7">
				<div className="pointer-events-none absolute inset-0 bg-dots opacity-50" />
				<CardHeader className="relative p-0">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1 min-w-0 space-y-3">
							<div className="flex items-center gap-3 flex-wrap">
								<div className="flex size-12 items-center justify-center rounded-2xl bg-pop-sun text-primary-foreground shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_60%,black)]">
									{getContentIcon(content.l_content_type)}
								</div>
								<Badge variant="sun" className="rounded-full bg-card">
									<BookOpen className="h-3.5 w-3.5 mr-1" />
									Гэрийн даалгавар
								</Badge>
							</div>
							<CardTitle className="text-xl md:text-2xl font-black leading-tight tracking-tight">
								{content.examname}
							</CardTitle>
						</div>
						{content.stu_worked === 1 && (
							<Badge className="shrink-0 rounded-full bg-success text-primary-foreground">
								<CheckCircle2 className="h-4 w-4 mr-1" />
								Дууссан
							</Badge>
						)}
					</div>
				</CardHeader>
			</div>

			<CardContent className="space-y-6 px-5 py-5 md:px-8 md:py-7">
				{/* Exam Info */}
				<div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
					{/* Асуултын тоо */}
					{content.testcnt && (
						<div className="rounded-2xl bg-pop-sky-soft p-4">
							<div className="flex items-center gap-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pop-sky text-primary-foreground">
									<FileText className="h-4 w-4" strokeWidth={2.5} />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-bold uppercase tracking-wide text-pop-sky-ink/80">
										Асуулт
									</p>
									<p className="text-2xl font-black text-pop-sky-ink">
										{content.testcnt}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Хугацаа */}
					{content.minut && (
						<div className="rounded-2xl bg-pop-sun-soft p-4">
							<div className="flex items-center gap-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pop-sun text-primary-foreground">
									<Clock className="h-4 w-4" strokeWidth={2.5} />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-bold uppercase tracking-wide text-pop-sun-ink/80">
										Хугацаа
									</p>
									<p className="text-2xl font-black text-pop-sun-ink">
										{content.minut > 0 ? `${content.minut} мин` : "∞"}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Төлөв */}
					<div
						className={`rounded-2xl p-4 ${
							content.stu_worked === 1 ? "bg-pop-mint-soft" : "bg-muted"
						}`}
					>
						<div className="flex items-center gap-3">
							<div
								className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
									content.stu_worked === 1
										? "bg-pop-mint text-primary-foreground"
										: "bg-card text-muted-foreground border-2 border-border"
								}`}
							>
								{content.stu_worked === 1 ? (
									<CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
								) : (
									<AlertCircle className="h-4 w-4" strokeWidth={2.5} />
								)}
							</div>
							<div className="min-w-0">
								<p
									className={`text-xs font-bold uppercase tracking-wide ${
										content.stu_worked === 1
											? "text-pop-mint-ink/80"
											: "text-muted-foreground"
									}`}
								>
									Төлөв
								</p>
								<p
									className={`text-base font-black ${
										content.stu_worked === 1
											? "text-pop-mint-ink"
											: "text-foreground"
									}`}
								>
									{content.stu_worked === 1 ? "Хийсэн" : "Хийгээгүй"}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Help/Description */}
				{content.help && (
					<div className="rounded-2xl border-2 border-pop-sky/40 bg-pop-sky-soft p-4">
						<div className="flex items-start gap-3">
							<AlertCircle className="h-5 w-5 text-pop-sky-ink shrink-0 mt-0.5" strokeWidth={2.5} />
							<div>
								<p className="font-extrabold text-sm text-pop-sky-ink mb-1">
									Анхааруулга
								</p>
								<p className="text-sm font-semibold text-foreground/80 leading-relaxed">
									{content.help}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Action Button */}
				{content.stu_worked === 0 ? (
					<Button
						size="lg"
						className="w-full md:w-auto"
						onClick={handleStartExam}
						disabled={isStarting}
					>
						{isStarting ? (
							<>
								<Clock className="h-4 w-4 animate-spin" />
								Ачааллаж байна...
							</>
						) : (
							<>
								<PlayCircle className="h-4 w-4" />
								Эхлүүлэх
							</>
						)}
					</Button>
				) : (
					<div className="flex items-center gap-3 rounded-2xl border-2 border-success/40 bg-success/10 p-4">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success text-primary-foreground">
							<CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
						</div>
						<div>
							<p className="font-black text-foreground">
								Даалгавар хийсэн байна
							</p>
							<p className="text-sm font-semibold text-muted-foreground">
								Та энэ даалгаврыг амжилттай хийж дууслаа
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
