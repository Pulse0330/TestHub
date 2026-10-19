"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Lock, Search } from "lucide-react"; // Lock icon нэмэв
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Item } from "@/components/ui/item";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getStudents } from "@/lib/dash.api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { StudentItem } from "@/types/dashboard/exam.types";

export interface SelectedStudent {
	id: number;
	examinee_number: string;
}

interface StudentSelectorProps {
	roomPCCount: number;
	initialSelectedStudents: SelectedStudent[]; // Анх орж ирсэн (түгжих) оюутнууд
	selectedStudents: SelectedStudent[];
	onSelectChange: (students: SelectedStudent[]) => void;
}

export function StudentSelector({
	roomPCCount,
	initialSelectedStudents, // Props-оор анхны өгөгдлийг авна
	selectedStudents,
	onSelectChange,
}: StudentSelectorProps) {
	const { userId } = useAuthStore();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

	const { data: students = [], isLoading } = useQuery({
		queryKey: ["api_get_students", userId],
		queryFn: () => getStudents({ userId: Number(userId) }),
		enabled: !!userId,
		select: (res) => res.RetData ?? [],
	});

	// Тулгалт хийх туслах функцүүд
	const isLocked = (examineeNumber: string) =>
		initialSelectedStudents.some((s) => s.examinee_number === examineeNumber);

	const isStudentSelected = (examineeNumber: string) =>
		selectedStudents.some((s) => s.examinee_number === examineeNumber);

	// 1. ШҮҮЛТҮҮР БОЛОН БҮЛЭГЛЭЛТ
	const groupedData = useMemo(() => {
		let filtered = students.filter((s) =>
			`${s.last_name} ${s.first_name} ${s.register_number}`
				.toLowerCase()
				.includes(searchQuery.toLowerCase()),
		);

		if (selectedGroupId !== "all") {
			filtered = filtered.filter(
				(s) => String(s.student_group_id) === selectedGroupId,
			);
		}

		const groups: Record<string, { name: string; students: StudentItem[] }> =
			{};
		filtered.forEach((s) => {
			const gId = String(s.student_group_id);
			if (!groups[gId]) {
				groups[gId] = {
					name: s.studentgroupname || "Тодорхойгүй",
					students: [],
				};
			}
			groups[gId].students.push(s);
		});

		return groups;
	}, [students, searchQuery, selectedGroupId]);

	const groupsList = useMemo(() => {
		const unique = new Map();
		students.forEach((s) => {
			if (s.student_group_id) {
				unique.set(String(s.student_group_id), s.studentgroupname);
			}
		});
		return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
	}, [students]);

	// 2. СОНГОЛТЫН ЛОГИК
	const toggleStudent = (student: StudentItem) => {
		if (isLocked(student.examinee_number)) return; // Түгжигдсэн бол юу ч хийхгүй

		if (isStudentSelected(student.examinee_number)) {
			onSelectChange(
				selectedStudents.filter(
					(s) => s.examinee_number !== student.examinee_number,
				),
			);
		} else {
			onSelectChange([
				...selectedStudents,
				{ id: student.id, examinee_number: student.examinee_number },
			]);
		}
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			const currentFiltered: SelectedStudent[] = Object.values(groupedData)
				.flatMap((g) => g.students)
				.map((s) => ({ id: s.id, examinee_number: s.examinee_number }));

			const combined = [...selectedStudents];
			currentFiltered.forEach((cs) => {
				if (!combined.some((s) => s.examinee_number === cs.examinee_number)) {
					combined.push(cs);
				}
			});
			onSelectChange(combined);
		} else {
			// Зөвхөн түгжигдээгүй, одоо харагдаж байгаа оюутнуудыг хасна
			const visibleExamineeNumbers = Object.values(groupedData)
				.flatMap((g) => g.students)
				.map((s) => s.examinee_number);

			onSelectChange(
				selectedStudents.filter(
					(s) =>
						isLocked(s.examinee_number) ||
						!visibleExamineeNumbers.includes(s.examinee_number),
				),
			);
		}
	};

	const isOverCapacity = selectedStudents.length > roomPCCount;

	return (
		<div className="flex h-full flex-col bg-card">
			{/* Header хэсэг хэвээрээ... */}
			<div className="space-y-3 border-b-2 border-border bg-muted/40 px-4 py-3">
				<div className="flex gap-2">
					<div className="relative flex-1">
						<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2.5} />
						<Input
							placeholder="Хайх..."
							className="h-10 rounded-xl pl-9 text-xs font-semibold"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
						<SelectTrigger className="h-10 w-27.5 rounded-xl text-xs font-bold">
							<SelectValue placeholder="Анги" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Бүх анги</SelectItem>
							{groupsList.map((g) => (
								<SelectItem key={g.id} value={g.id} className="text-xs">
									{g.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center justify-between px-1">
					<div className="flex items-center gap-2">
						<Checkbox
							id="all"
							checked={
								Object.values(groupedData).flatMap((g) => g.students).length >
									0 &&
								Object.values(groupedData)
									.flatMap((g) => g.students)
									.every((s) => isStudentSelected(s.examinee_number))
							}
							onCheckedChange={handleSelectAll}
						/>
						<label
							htmlFor="all"
							className="cursor-pointer text-[11px] font-black tracking-wide uppercase"
						>
							Бүгдийг сонгох
						</label>
					</div>
					<Badge
						variant={isOverCapacity ? "coral" : "violet"}
						className="h-6 rounded-full text-[11px] font-bold"
					>
						Сонгосон: {selectedStudents.length} / {roomPCCount}
					</Badge>
				</div>
			</div>

			{/* Жагсаалт хэсэг */}
			<div className="flex-1 space-y-6 overflow-y-auto p-4">
				{isLoading ? (
					<Skeleton className="h-24 w-full rounded-2xl" />
				) : (
					Object.entries(groupedData).map(([groupId, group]) => (
						<div key={groupId} className="space-y-2">
							<div className="sticky top-0 z-10 flex items-center gap-2 rounded-xl bg-pop-violet-soft px-3 py-2">
								<span className="text-[11px] font-black tracking-wide text-pop-violet-ink uppercase">
									{group.name}
								</span>
							</div>

							<div className="grid gap-1">
								{group.students.map((student) => {
									const isSelected = isStudentSelected(student.examinee_number);
									const locked = isLocked(student.examinee_number);

									return (
										<Item
											key={student.examinee_number}
											onClick={() => !locked && toggleStudent(student)}
											className={`flex items-center gap-3 rounded-xl border-2 p-2.5 transition-all ${
												locked
													? "cursor-not-allowed bg-muted/40 opacity-75"
													: "cursor-pointer"
											} ${isSelected ? "border-primary/40 bg-primary/10" : "border-transparent hover:bg-accent/50"}`}
										>
											<Checkbox
												checked={isSelected}
												disabled={locked}
												onCheckedChange={() =>
													!locked && toggleStudent(student)
												}
											/>
											<div className="flex-1 min-w-0">
												<p
													className={`text-[13px] font-bold truncate ${isSelected ? "text-primary" : "text-foreground"}`}
												>
													{student.last_name.charAt(0)}. {student.first_name}
												</p>
												<p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
													{student.examinee_number} • {student.register_number}{" "}
													•{student.studentgroupname}
												</p>
											</div>
											{locked ? (
												<Lock size={14} className="text-muted-foreground" strokeWidth={2.5} />
											) : isSelected ? (
												<CheckCircle2
													size={16}
													strokeWidth={2.5}
													className="text-primary animate-in zoom-in"
												/>
											) : null}
										</Item>
									);
								})}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
