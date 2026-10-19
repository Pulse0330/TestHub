"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Armchair,
	BookOpen,
	Check,
	ClipboardList,
	Database,
	Hash,
	Layers,
	Monitor,
	School,
	Upload,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import ExamPrintService from "@/app/(dash)/exam-schedule/[time_id]/ExamPrintService";
import { UploadPDFDialog } from "@/app/(dash)/exam-schedule/[time_id]/UploadPDF";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	getExamEsseUpload,
	getExamRegistrationSend,
	getVariantDistribute,
} from "@/lib/dash.api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { StudentSeat } from "@/types/dashboard/exam.types";
import type { UploadFileResult } from "@/utils/upload";

interface ExamRoom {
	exam_room_id: number;
	room_number: string;
	num_of_pc: number;
	assigned_seats: number;
	total_students: number;
	students: StudentSeat[];
}

interface ExamRoomTableProps {
	data: ExamRoom[];
	isLoading?: boolean;
	exam_id: number;
	timeId: number;
}

export function ExamTimeTable({ data, timeId, exam_id }: ExamRoomTableProps) {
	const { userId } = useAuthStore();
	const queryClient = useQueryClient();
	const [selectedRoomId, setSelectedRoomId] = useState<string>("");
	const [pdfUploadOpen, setPdfUploadOpen] = useState<boolean>(false);
	const [selectRow, setSelectRow] = useState<StudentSeat | null>(null);

	// Зөвхөн сурагчтай өрөөнүүдийг шүүх
	const filteredRooms = useMemo(
		() => data?.filter((r) => r.total_students > 0) || [],
		[data],
	);
	const selectedRoom = useMemo(
		() =>
			filteredRooms.find((r) => r.exam_room_id.toString() === selectedRoomId),
		[filteredRooms, selectedRoomId],
	);

	const { mutate, isPending } = useMutation({
		mutationFn: async (values: { room_id: number }) => {
			return getExamRegistrationSend({
				examRoomId: values.room_id,
				userId: userId || 0,
				examId: exam_id || 0,
				examDateId: timeId || 0,
			});
		},
		onSuccess: (res) => {
			if (res.RetResponse.ResponseCode === 11) {
				toast.error(res.RetResponse.ResponseMessage);
			} else {
				queryClient.invalidateQueries({
					queryKey: ["get_exam_registration_list"],
				});
				toast.success(res.RetResponse.ResponseMessage);
			}
		},
	});
	// ExamTimeTable.tsx дотор нэмэх
	const { mutate: submitPdfRecord } = useMutation({
		mutationFn: async (payload: {
			exam_register_id: number;
			question_id: number;
			file_url: string;
			file_type: string;
		}) => getExamEsseUpload(payload),
		onSuccess: (res) => {
			if (res.RetResponse.ResponseCode === 11) {
				toast.error(res.RetResponse.ResponseMessage);
			} else {
				toast.success(res.RetResponse.ResponseMessage);
			}
			queryClient.invalidateQueries({
				queryKey: ["get_exam_registration_list"],
			});
		},
		onError: () => {
			toast.error("Серверт бүртгэхэд алдаа гарлаа");
		},
	});

	const succesPdf = (result: UploadFileResult) => {
		// 1. selectRow байхгүй эсвэл exam_registration_id байхгүй бол зогсоох
		if (
			!selectRow ||
			!selectRow.exam_registration_id ||
			!selectRow.questionId
		) {
			toast.error("Сонгогдсон сурагчийн мэдээлэл дутуу байна.");
			return;
		}
		const fileExtension = result.file.name.split(".").pop();

		// 3. Мутаци руу илгээх
		submitPdfRecord({
			exam_register_id: selectRow.exam_registration_id,
			question_id: selectRow.questionId, // Одоо энэ нь заавал number байна
			file_url: result.file.url,
			file_type: fileExtension || "unknown",
		});
	};

	const { mutate: variantMunate, isPending: variantIsPending } = useMutation({
		mutationFn: async (values: { room_id: number }) => {
			return getVariantDistribute({
				examRoomId: values.room_id,
				examId: exam_id,
				examDateId: timeId,
			});
		},
		onSuccess: (res) => {
			if (res.RetResponse.ResponseCode === 11) {
				toast.error(res.RetResponse.ResponseMessage);
			} else {
				toast.success(res.RetResponse.ResponseMessage);
			}
		},
	});

	// Хуваарилалтын явц тооцоолох
	// const assignProgress = selectedRoom
	// 	? Math.round(
	// 			(selectedRoom.assigned_seats / selectedRoom.total_students) * 100,
	// 		)
	// 	: 0;

	return (
		<div className="card-pop flex h-full flex-col overflow-hidden">
			{/* ── Header ── */}
			<div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-border bg-muted/50 px-4 py-4 md:px-5">
				<div className="flex w-full items-center gap-3 sm:w-auto">
					<Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
						<SelectTrigger className="h-10 w-full rounded-xl text-sm font-bold sm:w-64">
							<SelectValue placeholder="Өрөөгөө сонгоно уу..." />
						</SelectTrigger>
						<SelectContent>
							{filteredRooms.map((room) => (
								<SelectItem
									key={room.exam_room_id}
									value={room.exam_room_id.toString()}
								>
									<span className="flex items-center gap-2">
										<Monitor size={14} className="text-pop-sky-ink" strokeWidth={2.5} />
										{room.room_number}-р өрөө
										<span className="ml-auto text-xs font-semibold text-muted-foreground">
											({room.total_students} сурагч)
										</span>
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{selectedRoom && (
					<div className="flex flex-wrap items-center gap-2">
						<Button
							onClick={() => mutate({ room_id: selectedRoom.exam_room_id })}
							disabled={isPending}
							size="sm"
						>
							{isPending ? (
								<>
									<Spinner /> 'Түр хүлээнэ үү...'
								</>
							) : (
								<>
									<Armchair size={14} strokeWidth={2.5} />
									Суудал хуваарилах
								</>
							)}
						</Button>
						<Button
							onClick={() =>
								variantMunate({ room_id: selectedRoom.exam_room_id })
							}
							disabled={variantIsPending}
							size="sm"
							variant="secondary"
						>
							{variantIsPending ? (
								<>
									<Spinner /> 'Түр хүлээнэ үү...'
								</>
							) : (
								<>
									<Layers strokeWidth={2.5} />
									Вариант хуваарилах{" "}
								</>
							)}
						</Button>

						<ExamPrintService
							key={selectedRoomId}
							exam_id={exam_id}
							timeId={timeId}
							roomId={Number(selectedRoomId)}
							students={selectedRoom.students} // ← нэмэх
						/>
					</div>
				)}
			</div>

			{/* ── Body ── */}
			<ScrollArea className="flex-1">
				{selectedRoom ? (
					<div className="space-y-5 p-4 md:p-5">
						{/* Stat cards */}
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<StatCard
								icon={<Monitor size={16} strokeWidth={2.5} />}
								label="Компьютерын тоо"
								tone="sky"
								value={selectedRoom.num_of_pc}
							/>
							<StatCard
								icon={<Armchair size={16} strokeWidth={2.5} />}
								label="Хуваарилагдсан"
								tone="mint"
								value={selectedRoom.assigned_seats}
							/>
							<StatCard
								icon={<Users size={16} strokeWidth={2.5} />}
								label="Нийт сурагч"
								tone="violet"
								value={selectedRoom.total_students}
							/>
						</div>

						{/* Progress bar */}
						{/* <div className="space-y-1.5">
							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span className="flex items-center gap-1">
									<Layers size={11} />
									Хуваарилалтын явц
								</span>
								<span className="font-semibold text-foreground">
									{assignProgress}%
								</span>
							</div>
							<div className="h-2 w-full rounded-full bg-muted overflow-hidden">
								<div
									className="h-full rounded-full bg-primary transition-all duration-500"
									style={{ width: `${assignProgress}%` }}
								/>
							</div>
						</div> */}

						{/* Table */}
						<div className="overflow-hidden rounded-2xl border-2 border-border">
							<div className="overflow-x-auto">
								{" "}
								{/* ← нэмэх */}
								<Table>
									<TableHeader>
										<TableRow className="border-b-2 border-border bg-muted text-xs font-extrabold tracking-wide uppercase hover:bg-muted [&_th]:text-xs [&_th]:font-extrabold [&_th]:text-muted-foreground">
											<TableHead className="w-8 text-center">
												<Hash
													size={13}
													className="mx-auto text-muted-foreground"
												/>
											</TableHead>
											<TableHead>
												<span className="flex items-center gap-1.5">
													<BookOpen
														size={13}
														strokeWidth={2.5}
													/>
													Овог нэр
												</span>
											</TableHead>
											<TableHead>
												<span className="flex items-center gap-1.5">
													<School size={13} strokeWidth={2.5} />
													Анги
												</span>
											</TableHead>
											<TableHead>
												<span className="flex items-center gap-1.5">
													<Armchair
														size={13}
														strokeWidth={2.5}
													/>
													Суудал №
												</span>
											</TableHead>
											<TableHead>
												<span className="flex items-center gap-1.5">
													<ClipboardList
														size={13}
														strokeWidth={2.5}
													/>
													Төлөв
												</span>
											</TableHead>
											<TableHead>
												<span className="flex items-center gap-1.5 justify-end">
													<Upload size={13} strokeWidth={2.5} />
													Хариултын хуудас илгээх
												</span>
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody className="overflow-x-auto">
										{selectedRoom.students.map((s, idx) => {
											const hasUploaded = !!s.file_url;
											return (
												<TableRow key={s.id} className="group hover:bg-accent/50">
													<TableCell className="w-8 text-center text-xs font-bold text-muted-foreground">
														{idx + 1}
													</TableCell>
													<TableCell className="font-bold">
														<span className="text-muted-foreground">
															{s.last_name[0]}.
														</span>{" "}
														{s.first_name}
													</TableCell>
													<TableCell>
														<Badge
															variant="sky"
															className="gap-1 rounded-full text-xs font-bold"
														>
															<School size={10} />
															{s.studentgroupname}
														</Badge>
													</TableCell>
													<TableCell>
														<span className="inline-flex size-8 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
															{s.seat_number}
														</span>
													</TableCell>
													<TableCell>
														<span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
															{s.status_text}
														</span>
													</TableCell>
													{
														<TableCell>
															<div className="flex justify-end items-center">
																{hasUploaded ? (
																	<Badge
																		variant="mint"
																		className="h-7 gap-1 rounded-full px-3 font-bold"
																	>
																		<Check size={12} strokeWidth={3} />
																		Илгээгдсэн
																	</Badge>
																) : (
																	<Button
																		size={"sm"}
																		variant={"outline"}
																		onClick={() => {
																			setPdfUploadOpen(true);
																			setSelectRow(s);
																		}}
																		disabled={s.status_code !== 3}
																	>
																		<Upload strokeWidth={2.5} /> Эсээ илгээх PDF
																	</Button>
																)}
															</div>
														</TableCell>
													}
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						</div>
					</div>
				) : (
					/* Empty state */
					<div className="flex h-72 flex-col items-center justify-center gap-3 text-muted-foreground select-none">
						<div className="flex size-20 items-center justify-center rounded-full bg-pop-sky-soft text-pop-sky-ink">
							<Database size={36} strokeWidth={2.25} />
						</div>
						<div className="text-center space-y-0.5">
							<p className="text-base font-black text-foreground">
								Өрөө сонгогдоогүй байна
							</p>
							<p className="text-sm font-semibold text-muted-foreground">
								Үргэлжлүүлэхийн тулд дээрээс өрөө сонгоно уу.
							</p>
						</div>
					</div>
				)}
			</ScrollArea>
			<UploadPDFDialog
				open={pdfUploadOpen}
				onOpenChange={setPdfUploadOpen}
				onUploadSuccess={succesPdf}
				selectRow={selectRow}
			/>
			{/* <StudentsInfo /> */}
		</div>
	);
}

const STAT_TONES = {
	sky: { tile: "bg-pop-sky-soft", ink: "text-pop-sky-ink" },
	mint: { tile: "bg-pop-mint-soft", ink: "text-pop-mint-ink" },
	violet: { tile: "bg-pop-violet-soft", ink: "text-pop-violet-ink" },
} as const;

function StatCard({
	icon,
	label,
	value,
	tone = "violet",
}: {
	icon: React.ReactNode;
	label: string;
	value: number;
	tone?: keyof typeof STAT_TONES;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-2 rounded-2xl p-4",
				STAT_TONES[tone].tile,
			)}
		>
			<div
				className={cn(
					"flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase",
					STAT_TONES[tone].ink,
				)}
			>
				{icon}
				{label}
			</div>
			<p
				className={cn(
					"text-2xl leading-none font-black",
					STAT_TONES[tone].ink,
				)}
			>
				{value}
			</p>
		</div>
	);
}
