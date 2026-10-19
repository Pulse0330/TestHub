"use client";

import { format } from "date-fns";
import {
	CalendarDays,
	ChevronDown,
	ChevronRight,
	Clock,
	Download,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Exam } from "@/types/dashboard/exam.types";

interface ExamTableProps {
	data: Exam[];
	isLoading?: boolean;
	onFetchData?: () => void;
}

export function ExamTable({ data, isLoading, onFetchData }: ExamTableProps) {
	const route = useRouter();
	const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

	const toggleRow = (id: number) => {
		setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	useEffect(() => {
		if (data.length > 0) {
			const allExpanded = data.reduce(
				(acc, exam) => {
					acc[exam.id] = true;
					return acc;
				},
				{} as Record<number, boolean>,
			);
			setExpandedRows(allExpanded);
		}
	}, [data]);

	return (
		<div className="card-pop flex h-full flex-col overflow-hidden">
			<div className="relative flex-1 overflow-hidden flex flex-col">
				<ScrollArea className="h-full">
					<Table>
						<TableHeader className="sticky top-0 z-20 bg-muted">
							<TableRow className="border-b-2 border-border hover:bg-transparent">
								<TableHead className="w-12.5"></TableHead>
								<TableHead className="h-12 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
									Шалгалтын нэр
								</TableHead>
								<TableHead className="font-semibold text-foreground text-sm  tracking-wider text-center h-11">
									Хугацаа
								</TableHead>
								<TableHead className="h-12 text-xs font-extrabold tracking-wide text-muted-foreground uppercase leading-4">
									Бүртгэл эхлэх / дуусах <br /> огноо
								</TableHead>

								<TableHead className="h-12 text-xs font-extrabold tracking-wide text-muted-foreground uppercase leading-4">
									Даалгаврын сан <br /> нээгдэх огноо
								</TableHead>
								<TableHead className="text-right h-12 text-xs font-extrabold tracking-wide text-muted-foreground uppercase pr-6">
									Шалгалтын хуваарь
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody className="border-0">
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={6} className="h-60 text-center">
										<div className="flex flex-col items-center justify-center gap-3">
											<Loader2 className="size-8 animate-spin text-primary" />
											<p className="text-sm font-bold text-muted-foreground">
												Ачаалж байна...
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : data.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="h-60 text-center">
										<div className="flex flex-col items-center justify-center gap-4 py-10">
											<div className="mb-2 flex size-20 items-center justify-center rounded-full bg-pop-sky-soft text-pop-sky-ink">
												<Download className="size-9" strokeWidth={2.5} />
											</div>
											<div className="space-y-1">
												<h3 className="text-xl font-black tracking-tight">
													Жагсаалт хоосон байна
												</h3>
												<Button
													onClick={onFetchData}
													variant="outline"
													className="mt-6 gap-2 px-6"
												>
													<Download size={14} /> Хуваарь татах
												</Button>
											</div>
										</div>
									</TableCell>
								</TableRow>
							) : (
								data.map((exam) => (
									<React.Fragment key={exam.id}>
										<TableRow
											className={`group cursor-pointer border-b-2 border-border/60 transition-all ${
												expandedRows[exam.id]
													? "bg-primary/5 hover:bg-primary/10"
													: "hover:bg-accent/50"
											}`}
											onClick={() => toggleRow(exam.id)}
										>
											<TableCell className="py-3">
												<div className="flex justify-center">
													<span
														className={`flex size-7 items-center justify-center rounded-lg ${
															expandedRows[exam.id]
																? "bg-primary text-primary-foreground"
																: "bg-muted text-muted-foreground"
														}`}
													>
														{expandedRows[exam.id] ? (
															<ChevronDown size={16} strokeWidth={3} />
														) : (
															<ChevronRight size={16} strokeWidth={3} />
														)}
													</span>
												</div>
											</TableCell>
											<TableCell className="py-3 text-sm font-extrabold text-foreground">
												{exam.name}
											</TableCell>
											<TableCell className="text-center py-3">
												<Badge
													variant="sky"
													className="h-7 rounded-full px-2.5 text-[11px] font-bold"
												>
													<Clock size={12} className="mr-1" strokeWidth={2.5} />
													{exam.duration} мин
												</Badge>
											</TableCell>
											<TableCell className="py-3 flex gap-2 items-center">
												<div className="flex flex-col">
													<span className="text-xs font-bold text-foreground">
														{format(
															new Date(exam.register_start_date),
															"yyyy.MM.dd",
														)}
													</span>
													<span className="text-[10px] leading-none font-bold text-muted-foreground uppercase">
														{format(
															new Date(exam.register_start_date),
															"HH:mm",
														)}
													</span>
												</div>
												-
												<div className="flex flex-col">
													<span className="text-xs font-bold text-foreground">
														{format(
															new Date(exam.register_end_date),
															"yyyy.MM.dd",
														)}
													</span>
													<span className="text-[10px] leading-none font-bold text-muted-foreground uppercase">
														{format(new Date(exam.register_end_date), "HH:mm")}
													</span>
												</div>
											</TableCell>

											<TableCell className="py-3">
												<div className="flex flex-col">
													<span className="text-xs font-bold text-foreground">
														{format(
															new Date(exam.item_open_date),
															"yyyy.MM.dd",
														)}
													</span>
													<span className="text-[10px] leading-none font-bold text-muted-foreground uppercase">
														{format(new Date(exam.item_open_date), "HH:mm")}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right py-3 pr-6">
												<Badge
													variant="violet"
													className="h-6 rounded-full px-2.5 text-[11px] font-bold"
												>
													{exam.exam_dates.length} хуваарь
												</Badge>
											</TableCell>
										</TableRow>

										{expandedRows[exam.id] && (
											<TableRow className="border-none bg-primary/5 hover:bg-primary/5">
												<TableCell colSpan={6} className="p-0 border-none">
													<div className="mx-3 my-2 rounded-2xl border-l-4 border-primary/40 bg-card/60 px-4 py-4 animate-in fade-in slide-in-from-top-1 duration-200 md:px-6">
														<div className="flex items-center gap-2 mb-3">
															<span className="flex size-6 items-center justify-center rounded-lg bg-pop-violet-soft text-pop-violet-ink">
																<CalendarDays size={14} strokeWidth={2.5} />
															</span>
															<h4 className="text-xs font-black tracking-wider text-foreground uppercase">
																Шалгалтын цагийн хуваарь
															</h4>
														</div>
														<div className="overflow-hidden rounded-2xl border-2 border-border bg-card">
															<Table>
																<TableHeader className="bg-muted">
																	<TableRow className="h-9 border-b-2 border-border hover:bg-transparent">
																		<TableHead className="h-9 text-[10px] font-extrabold tracking-wide text-muted-foreground uppercase pl-4 ">
																			Эхлэх цаг
																		</TableHead>
																		<TableHead className="h-9 text-[10px] font-extrabold tracking-wide text-muted-foreground uppercase px-4">
																			Дуусах цаг
																		</TableHead>
																		<TableHead className="h-9 text-[10px] font-extrabold tracking-wide text-muted-foreground uppercase text-right">
																			Үйлдэл
																		</TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{exam.exam_dates.map((date) => (
																		<TableRow
																			key={date.id}
																			className="h-11 cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/50"
																			onClick={() => {
																				route.push(
																					`/exam-schedule/${date.exam_date_id}-${date.exam_id}`,
																				);
																			}}
																		>
																			<TableCell className="py-1 pl-4">
																				<div className="inline-flex items-center gap-2 rounded-full bg-pop-sky-soft px-2.5 py-1 text-pop-sky-ink">
																					<span className="text-[11px] font-bold">
																						{format(
																							new Date(date.start_date),
																							"yyyy.MM.dd",
																						)}
																					</span>
																					<span className="border-l-2 border-pop-sky/30 pl-2 text-[11px] font-extrabold">
																						{format(
																							new Date(date.start_date),
																							"HH:mm",
																						)}
																					</span>
																				</div>
																			</TableCell>
																			<TableCell className="py-1 ">
																				<div className="inline-flex items-center gap-2 rounded-full bg-pop-mint-soft px-2.5 py-1 text-pop-mint-ink">
																					<span className="text-[11px] font-bold">
																						{format(
																							new Date(date.end_date),
																							"yyyy.MM.dd",
																						)}
																					</span>
																					<span className="border-l-2 border-pop-mint/30 pl-2 text-[11px] font-extrabold">
																						{format(
																							new Date(date.end_date),
																							"HH:mm",
																						)}
																					</span>
																				</div>
																			</TableCell>
																			<TableCell className="py-1   items-center w-full">
																				<div className="flex justify-end ">
																					<Button
																						asChild
																						size={"xs"}
																						variant={"outline"}
																					>
																						<Link
																							href={`/exam-schedule/${date.exam_date_id}-${date.exam_id}`}
																						>
																							Дэлгэрэнгүй
																						</Link>
																					</Button>
																				</div>
																			</TableCell>
																		</TableRow>
																	))}
																</TableBody>
															</Table>
														</div>
													</div>
												</TableCell>
											</TableRow>
										)}
									</React.Fragment>
								))
							)}
						</TableBody>
					</Table>
				</ScrollArea>
			</div>
		</div>
	);
}
