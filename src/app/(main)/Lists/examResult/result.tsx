"use client";

import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	Award,
	CheckCircle2,
	FileText,
	Target,
	TrendingUp,
	XCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getExamResults } from "@/lib/api";
import type { ExamResultsResponse } from "@/types/exam/examResult";

interface ExamAnswersDialogProps {
	examId: number;
	testId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function ExamAnswersDialog({
	testId,
	open,
	onOpenChange,
}: ExamAnswersDialogProps) {
	const { data, isLoading, isError, error } = useQuery<ExamResultsResponse>({
		queryKey: ["examResults", testId],
		queryFn: () => getExamResults(testId),
		enabled: open && !!testId,
	});

	const result = data?.RetData?.[0];
	const isPassed = result && result.point_perc >= 60;

	const getGradeColor = (grade: string) => {
		switch (grade) {
			case "A":
			case "A+":
			case "A-":
				return "text-success";
			case "B":
			case "B+":
			case "B-":
				return "text-pop-sky-ink";
			case "C":
			case "C+":
			case "C-":
				return "text-pop-sun-ink";
			case "D":
				return "text-pop-coral-ink";
			case "F":
				return "text-destructive";
			default:
				return "text-muted-foreground";
		}
	};

	// Онооны өнгө: өндөр = success, дунд = warning, бага = destructive
	const scoreTone = (perc: number) =>
		perc >= 75
			? { stroke: "var(--success)", text: "text-success", bar: "[&>[data-slot=progress-indicator]]:bg-success" }
			: perc >= 50
				? { stroke: "var(--warning)", text: "text-pop-sun-ink", bar: "[&>[data-slot=progress-indicator]]:bg-warning" }
				: { stroke: "var(--destructive)", text: "text-destructive", bar: "[&>[data-slot=progress-indicator]]:bg-destructive" };

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-3xl gap-0 overflow-hidden rounded-3xl border-2 p-0">
				{/* Header */}
				<DialogHeader className="border-b-2 bg-pop-violet-soft px-6 py-5 text-left">
					<div className="flex items-center justify-between">
						<DialogTitle className="flex items-center gap-3 text-xl font-black">
							<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card text-pop-violet-ink shadow-[0_3px_0_0_var(--border)]">
								<FileText className="size-6" strokeWidth={2.5} />
							</span>
							Шалгалтын үр дүн
						</DialogTitle>
					</div>
					{result && (
						<p className="pl-14 text-sm font-bold text-pop-violet-ink">
							{result.title}
						</p>
					)}
				</DialogHeader>

				<ScrollArea className="h-[calc(90vh-80px)]">
					<div className="p-4 sm:p-6">
						{isLoading ? (
							<div className="space-y-4">
								<Skeleton className="mx-auto h-40 w-40 rounded-full" />
								<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
									{[...Array(4).keys()].map((i) => (
										<Skeleton key={`stat-${i}`} className="h-24 rounded-2xl" />
									))}
								</div>
								<Skeleton className="h-48 rounded-3xl" />
							</div>
						) : isError ? (
							<Alert variant="destructive">
								<AlertCircle className="size-4" />
								<AlertDescription>{(error as Error).message}</AlertDescription>
							</Alert>
						) : !result ? (
							<div className="py-12 text-center">
								<div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-pop-violet-soft text-pop-violet-ink">
									<FileText className="size-10" strokeWidth={2.5} />
								</div>
								<p className="font-bold text-muted-foreground">Үр дүн олдсонгүй</p>
							</div>
						) : (
							<div className="space-y-6">
								{/* Grade Display */}
								<div className="flex flex-col items-center justify-center gap-6 py-4 sm:flex-row sm:gap-10">
									{(() => {
										const perc = result.point_perc ?? 0;
										const tone = scoreTone(perc);
										const r = 64;
										const c = 2 * Math.PI * r;
										return (
											<div className="relative size-40 shrink-0">
												<svg
													viewBox="0 0 160 160"
													className="size-40 -rotate-90"
													aria-hidden="true"
												>
													<circle cx="80" cy="80" r={r} fill="none" stroke="var(--muted)" strokeWidth="14" />
													<circle
														cx="80"
														cy="80"
														r={r}
														fill="none"
														stroke={tone.stroke}
														strokeWidth="14"
														strokeLinecap="round"
														strokeDasharray={c}
														strokeDashoffset={c - (Math.max(0, Math.min(100, perc)) / 100) * c}
														className="transition-[stroke-dashoffset] duration-700 ease-out"
													/>
												</svg>
												<div className="absolute inset-0 flex flex-col items-center justify-center">
													<span className={`text-3xl font-black tabular-nums ${tone.text}`}>
														{result.point_perc?.toFixed(1)}%
													</span>
													<span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
														Амжилт
													</span>
												</div>
											</div>
										);
									})()}
									<div className="text-center">
										<div
											className={`mb-2 text-8xl font-black leading-none ${getGradeColor(
												result.unelgee,
											)}`}
										>
											{result.unelgee}
										</div>
										<Badge
											variant={isPassed ? "mint" : "destructive"}
											className="px-3 py-1 text-sm"
										>
											{isPassed ? "Тэнцсэн" : "Тэнцээгүй"}
										</Badge>
									</div>
								</div>

								{/* Stats Grid */}
								<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
									<div className="rounded-2xl bg-pop-violet-soft p-4 text-center text-pop-violet-ink">
										<Award className="mx-auto mb-2 size-6" strokeWidth={2.5} />
										<div className="text-2xl font-black tabular-nums">{result.point}</div>
										<div className="text-xs font-bold uppercase tracking-wide">
											Авсан оноо
										</div>
										<div className="text-xs font-bold opacity-80">
											/ {result.ttl_point}
										</div>
									</div>

									<div className="rounded-2xl bg-pop-sky-soft p-4 text-center text-pop-sky-ink">
										<Target className="mx-auto mb-2 size-6" strokeWidth={2.5} />
										<div className="text-2xl font-black tabular-nums">
											{result.point_perc?.toFixed(1)}%
										</div>
										<div className="text-xs font-bold uppercase tracking-wide">
											Амжилт
										</div>
									</div>

									<div className="rounded-2xl bg-pop-mint-soft p-4 text-center text-pop-mint-ink">
										<CheckCircle2 className="mx-auto mb-2 size-6" strokeWidth={2.5} />
										<div className="text-2xl font-black tabular-nums">
											{result.correct_ttl}
										</div>
										<div className="text-xs font-bold uppercase tracking-wide">
											Зөв хариулт
										</div>
									</div>

									<div className="rounded-2xl bg-pop-coral-soft p-4 text-center text-pop-coral-ink">
										<XCircle className="mx-auto mb-2 size-6" strokeWidth={2.5} />
										<div className="text-2xl font-black tabular-nums">
											{result.wrong_ttl}
										</div>
										<div className="text-xs font-bold uppercase tracking-wide">
											Буруу хариулт
										</div>
									</div>
								</div>

								<Separator />

								{/* Performance Analysis */}
								<div className="card-pop p-5">
									<h4 className="mb-4 flex items-center gap-2 text-base font-extrabold">
										<span className="flex size-8 items-center justify-center rounded-xl bg-pop-violet-soft text-pop-violet-ink">
											<TrendingUp className="size-4" strokeWidth={2.5} />
										</span>
										Дэлгэрэнгүй үр дүн
									</h4>
									<div className="space-y-4">
										{/* Total Score */}
										<div className="space-y-2">
											<div className="flex items-center justify-between gap-2">
												<span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
													<Award className="size-4 text-primary" />
													Нийт оноо
												</span>
												<Badge variant="violet">
													{result.point} / {result.ttl_point}
												</Badge>
											</div>
											<Progress
												value={(result.point / result.ttl_point) * 100}
												className={scoreTone((result.point / result.ttl_point) * 100).bar}
											/>
										</div>

										{/* Correct Answers */}
										<div className="space-y-2">
											<div className="flex items-center justify-between gap-2">
												<span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
													<CheckCircle2 className="size-4 text-success" />
													Зөв хариулт
												</span>
												<Badge variant="mint">
													{result.correct_ttl} / {result.test_ttl} (
													{Math.round(
														(result.correct_ttl / result.test_ttl) * 100,
													)}
													%)
												</Badge>
											</div>
											<Progress
												value={(result.correct_ttl / result.test_ttl) * 100}
												className="[&>[data-slot=progress-indicator]]:bg-success"
											/>
										</div>

										{/* Wrong Answers */}
										<div className="space-y-2">
											<div className="flex items-center justify-between gap-2">
												<span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
													<XCircle className="size-4 text-destructive" />
													Буруу хариулт
												</span>
												<Badge variant="coral">
													{result.wrong_ttl} / {result.test_ttl} (
													{Math.round(
														(result.wrong_ttl / result.test_ttl) * 100,
													)}
													%)
												</Badge>
											</div>
											<Progress
												value={(result.wrong_ttl / result.test_ttl) * 100}
												className="[&>[data-slot=progress-indicator]]:bg-destructive"
											/>
										</div>

										{/* Not Answered */}
										{result.not_answer > 0 && (
											<div className="space-y-2">
												<div className="flex items-center justify-between gap-2">
													<span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
														<AlertCircle className="size-4 text-pop-sun-ink" />
														Хариулаагүй
													</span>
													<Badge variant="sun">
														{result.not_answer} / {result.test_ttl} (
														{Math.round(
															(result.not_answer / result.test_ttl) * 100,
														)}
														%)
													</Badge>
												</div>
												<Progress
													value={(result.not_answer / result.test_ttl) * 100}
													className="[&>[data-slot=progress-indicator]]:bg-warning"
												/>
											</div>
										)}
									</div>
								</div>

								{/* Additional Info */}
							</div>
						)}
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
