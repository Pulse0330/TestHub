"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
	BookOpen,
	CheckCircle2,
	Grid2X2Plus,
	Loader2,
	School,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	ExamSelector,
	type SelectedExam,
} from "@/app/(dash)/exam-create/ExamSelector";
import {
	RoomSelector,
	type SelectedRoom,
} from "@/app/(dash)/exam-create/RoomSelector";
import { StudentSelector } from "@/app/(dash)/exam-create/StudentSelector";
// import { RoomSelector } from "@/a
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { batchRegisterExams, getSelectedStudents } from "@/lib/dash.api";
import { useAuthStore } from "@/stores/useAuthStore";

interface SelectedStudent {
	id: number;
	examinee_number: string;
}

export default function ExamCreatePage() {
	const { userId } = useAuthStore();
	// State-үүд
	const [selectedRoomID, setSelectedRoomID] = useState<string | null>(null);
	const [selectedEsisRoomID, setSelectedEsisRoomID] = useState<number | null>(
		null,
	);
	const [roomPCCount, setRoomPCCount] = useState<number>(0);

	//--------------

	const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>(
		[],
	);

	const [selectedExam, setSelectedExam] = useState<SelectedExam | null>(null);

	const handleRoomSelect = (room: SelectedRoom) => {
		setSelectedRoomID(room.id);
		setSelectedEsisRoomID(room.esisroomid);
		setRoomPCCount(room.pccnt);
		console.log("room", room);
	};

	const handleExamSelect = (exam: SelectedExam) => {
		setSelectedExam(exam);
		setSelectedStudents([]);
	};

	const { data: dbSelectedStudents = [] } = useQuery({
		queryKey: ["api_get_selected_students", selectedExam, selectedEsisRoomID],
		queryFn: () =>
			getSelectedStudents({
				dateId: selectedExam?.examDateId || 0,
				roomId: selectedEsisRoomID ? Number(selectedEsisRoomID) : 0,
			}),
		enabled: !!userId && !!selectedExam && !!selectedEsisRoomID,
		select: (res) => res.RetData,
	});

	useEffect(() => {
		if (dbSelectedStudents && dbSelectedStudents.length > 0) {
			const newStudents = dbSelectedStudents.map((s) => ({
				id: s.id,
				examinee_number: s.examinee_number,
			}));
			setSelectedStudents(newStudents);
		}
	}, [dbSelectedStudents]); // Зөвхөн API-аас ирэх дата өөрчлөгдөхөд л ажиллана

	const { mutate, isPending } = useMutation({
		mutationFn: batchRegisterExams,
		onSuccess: (res) => {
			if (res.RetResponse.ResponseCode === 11) {
				toast.error(res.RetResponse.ResponseMessage);
			} else {
				toast.success(res.RetResponse.ResponseMessage);
				// Сонголтуудыг цэвэрлэх
				setSelectedStudents([]);
				setSelectedRoomID(null);
				setSelectedEsisRoomID(null);
				setSelectedExam(null);
			}

			// Шаардлагатай бол кэш шинэчлэх
			// queryClient.invalidateQueries({ queryKey: ["some_key"] });
		},
	});

	const submit = () => {
		if (!selectedExam || !selectedEsisRoomID || !userId) return;

		const registrations = selectedStudents.map((student) => ({
			stu_id: student.id,
			examinee_number: student.examinee_number,
			exam_id: selectedExam?.examId,
			exam_date_id: selectedExam?.examDateId,
			exam_room_id: selectedEsisRoomID,
		}));

		mutate({
			userId: Number(userId),
			registrations: registrations,
		});
	};

	const handleStudentChange = useCallback((students: SelectedStudent[]) => {
		setSelectedStudents(students);
	}, []);

	const isOverCapacity = selectedStudents.length > roomPCCount;

	return (
		<div className="max-w-7xl py-6 mx-auto">
			<header className="mb-8 flex flex-wrap items-end justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-pop-mint-soft text-pop-mint-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-mint)_35%,transparent)]">
						<School className="size-7" strokeWidth={2.5} />
					</div>
					<div>
						<h1 className="text-2xl font-black tracking-tight md:text-3xl">
							Шалгалт зохион байгуулах
						</h1>
						<p className="mt-1 text-sm font-semibold text-muted-foreground">
							Өрөө, шалгалт болон сурагчдаа сонгон бүртгэл хийнэ үү.
						</p>
					</div>
				</div>
				<Button
					disabled={
						!selectedExam ||
						selectedStudents.length === 0 ||
						isPending ||
						isOverCapacity
					}
					size="lg"
					variant={isOverCapacity ? "destructive" : "default"}
					className="w-full gap-2 sm:w-auto"
					onClick={submit}
				>
					{isPending ? (
						<Loader2 size={16} className="animate-spin" />
					) : (
						<CheckCircle2 size={18} strokeWidth={2.5} />
					)}
					{isOverCapacity
						? `Суудал хэтэрсэн (${selectedStudents.length}/${roomPCCount})`
						: `Бүртгэх (${selectedStudents.length}/${roomPCCount})`}
				</Button>
			</header>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 h-auto lg:h-[calc(100vh-250px)]">
				{/* 1. БАГАНА: ӨРӨӨНҮҮД */}
				<Card className="lg:col-span-4 flex h-125 flex-col gap-0 overflow-hidden pb-0 lg:h-full">
					<CardHeader className="shrink-0 border-b-2 border-border pb-4">
						<CardTitle className="flex items-center gap-2 text-sm font-extrabold justify-between">
							<span className="flex items-center gap-2">
								<span className="flex size-8 items-center justify-center rounded-xl bg-pop-sky-soft text-pop-sky-ink">
									<School size={16} strokeWidth={2.5} />
								</span>
								1. Шалгалтын өрөө
							</span>
							<Button
								size="sm"
								variant="ghost"
								className="h-8 gap-1 rounded-full bg-pop-sky-soft px-3 text-xs font-bold text-pop-sky-ink hover:bg-pop-sky-soft/80 hover:text-pop-sky-ink"
								asChild
							>
								<Link href={"/room"}>
									<Grid2X2Plus size={12} strokeWidth={2.5} />
									Өрөө бүртгэх
								</Link>
							</Button>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0 flex-1 overflow-hidden relative gap-0">
						<div className="absolute inset-0">
							<RoomSelector
								selectedId={selectedRoomID}
								onSelect={handleRoomSelect}
							/>
						</div>
					</CardContent>
				</Card>
				{/* 2. БАГАНА: ШАЛГАЛТУУД */}
				<Card className="lg:col-span-4 flex h-125 flex-col gap-0 overflow-hidden pb-0 lg:h-full">
					<CardHeader className="shrink-0 border-b-2 border-border pb-4">
						<CardTitle className="flex items-center gap-2 text-sm font-extrabold justify-between">
							<span className="flex items-center gap-2">
								<span className="flex size-8 items-center justify-center rounded-xl bg-pop-violet-soft text-pop-violet-ink">
									<BookOpen size={16} strokeWidth={2.5} />
								</span>
								2. Шалгалт / Хуваарь
							</span>
							{/* <Button
								size="sm"
								variant="ghost"
								className="h-8 gap-1 rounded-full bg-pop-sky-soft px-3 text-xs font-bold text-pop-sky-ink hover:bg-pop-sky-soft/80 hover:text-pop-sky-ink"
								asChild
							>
								<Link href={"/exam-schedule"}>
									<Download size={10} />
									Хуваарь татах
								</Link>
							</Button> */}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0 flex-1 overflow-hidden relative gap-0">
						<div className="absolute inset-0">
							<ExamSelector
								onSelect={handleExamSelect}
								selectedExamDateId={selectedExam?.uiId || null}
							/>
						</div>
					</CardContent>
				</Card>
				{/* 3. БАГАНА: СУРАГЧИД */}
				<Card className="md:col-span-2 lg:col-span-4 flex h-125 flex-col gap-0 overflow-hidden pb-0 lg:h-full">
					<CardHeader className="shrink-0 border-b-2 border-border pb-4">
						<CardTitle className="flex items-center gap-2 text-sm font-extrabold">
							<span className="flex size-8 items-center justify-center rounded-xl bg-pop-pink-soft text-pop-pink-ink">
								<Users size={16} strokeWidth={2.5} />
							</span>
							3. Суралцагч сонгох
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0 flex-1 overflow-hidden relative gap-0">
						<div className="absolute inset-0">
							<StudentSelector
								roomPCCount={roomPCCount}
								onSelectChange={handleStudentChange}
								selectedStudents={selectedStudents}
								initialSelectedStudents={dbSelectedStudents}
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
