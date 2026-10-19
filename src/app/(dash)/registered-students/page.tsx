"use client";

import { useQuery } from "@tanstack/react-query";
import {
	ChevronDown,
	ChevronRight,
	ClipboardCopy,
	Copy,
	Eye,
	EyeOff,
	Filter,
	Hash,
	Loader2,
	MoreVertical,
	Search,
	Users,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getStudents } from "@/lib/dash.api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { StudentItem } from "@/types/dashboard/exam.types";

export default function RegisteredStudentsPage() {
	const { userId } = useAuthStore();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
		{},
	);
	const [visiblePasswords, setVisiblePasswords] = useState<
		Record<string, boolean>
	>({});

	const { data: students = [], isLoading } = useQuery({
		queryKey: ["api_get_students", userId],
		queryFn: () => getStudents({ userId: Number(userId) }),
		enabled: !!userId,
		select: (res) => res.RetData ?? [],
	});

	const groupsList = useMemo(() => {
		const unique = new Map();
		students.forEach((s) => {
			if (s.student_group_id) {
				unique.set(String(s.student_group_id), s.studentgroupname);
			}
		});
		return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
	}, [students]);

	const groupedData = useMemo(() => {
		let filtered = students.filter((s) =>
			`${s.last_name} ${s.first_name} ${s.register_number} ${s.examinee_number}`
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

	// Дата ачаалагдахад бүх группыг нээлттэй болгох
	// biome-ignore lint/correctness/useExhaustiveDependencies: groupedData keys used as trigger, students.length guards initial load only
	useEffect(() => {
		if (Object.keys(groupedData).length > 0) {
			const allExpanded = Object.keys(groupedData).reduce(
				(acc, gId) => {
					acc[gId] = true;
					return acc;
				},
				{} as Record<string, boolean>,
			);
			setExpandedGroups(allExpanded);
		}
	}, [students.length === 0, groupedData]); // Зөвхөн эхний удаа ачаалахад

	const toggleGroup = (groupId: string) => {
		setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} хуулагдлаа`);
	};

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6 py-6">
			{/* --- Header Section --- */}
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-pop-pink-soft text-pop-pink-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-pink)_35%,transparent)]">
						<Users className="size-7" strokeWidth={2.5} />
					</div>
					<div>
						<h1 className="text-2xl font-black tracking-tight md:text-3xl">
							Бүртгүүлсэн суралцагчид
						</h1>
						<p className="mt-1 text-sm font-semibold text-muted-foreground">
							Шалгалт өгөхөөр бүртгэгдсэн нийт суралцагчдын жагсаалт. |{" "}
							{students.length} сурагч байна.
						</p>
					</div>
				</div>
			</header>

			{/* --- Filters Section --- */}
			<div className="flex flex-col justify-between gap-3 md:flex-row">
				<div className="group relative max-w-md flex-1">
					<Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" strokeWidth={2.5} />
					<Input
						placeholder="Нэр, регистр, шалгуулагчийн дугаараар хайх..."
						className="h-11 rounded-xl bg-card pl-10 font-semibold"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
					<SelectTrigger className="h-11 w-full rounded-xl bg-card font-bold md:w-48">
						<div className="flex items-center gap-2">
							<Filter size={15} className="text-pop-pink-ink" strokeWidth={2.5} />
							<SelectValue placeholder="Анги сонгох" />
						</div>
					</SelectTrigger>
					<SelectContent className="rounded-xl">
						<SelectItem value="all">Бүх анги</SelectItem>
						{groupsList.map((g) => (
							<SelectItem key={g.id} value={g.id}>
								{g.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* --- Main Table Area --- */}
			<div className="card-pop flex flex-col overflow-hidden">
				<ScrollArea className="h-full">
					<Table>
						<TableHeader className="sticky top-0 z-20 bg-muted">
							<TableRow className="border-b-2 border-border hover:bg-transparent">
								<TableHead className="w-12 text-center"></TableHead>
								<TableHead className="h-12 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
									Анги / Групп
								</TableHead>
								<TableHead className="h-12 text-xs font-extrabold tracking-wide text-muted-foreground uppercase text-center">
									Сурагчдын тоо
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={4} className="h-64 text-center">
										<div className="flex flex-col items-center justify-center gap-3">
											<Loader2 className="size-8 animate-spin text-primary" />
											<p className="text-sm font-bold text-muted-foreground">
												Дата ачаалж байна...
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : Object.keys(groupedData).length === 0 ? (
								<TableRow>
									<TableCell colSpan={3} className="h-64 text-center">
										<div className="flex flex-col items-center justify-center gap-4 py-10">
											<div className="flex size-20 items-center justify-center rounded-full bg-pop-pink-soft text-4xl">
												🔍
											</div>
											<h3 className="text-lg font-black tracking-tight">
												Илэрц олдсонгүй
											</h3>
										</div>
									</TableCell>
								</TableRow>
							) : (
								Object.entries(groupedData).map(([groupId, group]) => (
									<React.Fragment key={groupId}>
										{/* Group Row */}
										<TableRow
											className={`group cursor-pointer border-b-2 border-border/60 transition-all ${
												expandedGroups[groupId]
													? "bg-primary/5 hover:bg-primary/10"
													: "hover:bg-accent/50"
											}`}
											onClick={() => toggleGroup(groupId)}
										>
											<TableCell className="py-4">
												<div className="flex justify-center">
													<span
														className={`flex size-7 items-center justify-center rounded-lg ${
															expandedGroups[groupId]
																? "bg-primary text-primary-foreground"
																: "bg-muted text-muted-foreground"
														}`}
													>
														{expandedGroups[groupId] ? (
															<ChevronDown size={16} strokeWidth={3} />
														) : (
															<ChevronRight size={16} strokeWidth={3} />
														)}
													</span>
												</div>
											</TableCell>
											<TableCell className="py-4">
												<div className="flex items-center gap-3">
													<span className="text-sm font-black tracking-tight text-foreground uppercase">
														{group.name}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-center py-4">
												<Badge
													variant="pink"
													className="rounded-full px-3 text-xs font-bold"
												>
													{group.students.length} суралцагч
												</Badge>
											</TableCell>
										</TableRow>

										{/* Nested Students Table */}
										{expandedGroups[groupId] && (
											<TableRow className="bg-primary/5 hover:bg-primary/5">
												<TableCell colSpan={3} className="p-0 border-none">
													<div className="mx-3 my-2 rounded-2xl border-l-4 border-primary/40 bg-card/60 px-3 py-4 animate-in fade-in slide-in-from-top-2 duration-300 md:px-6">
														<div className="overflow-hidden rounded-2xl border-2 border-border bg-card">
															<Table>
																<TableHeader className="bg-muted">
																	<TableRow className="h-10 border-b-2 border-border hover:bg-transparent">
																		<TableHead className="text-[10px] font-extrabold tracking-wide text-muted-foreground uppercase pl-4 w-12">
																			#
																		</TableHead>
																		<TableHead className="text-[10px] font-extrabold tracking-wide text-muted-foreground uppercase px-4">
																			Овог нэр / Регистр
																		</TableHead>
																		<TableHead className="text-[10px] font-extrabold tracking-wide text-muted-foreground uppercase px-4">
																			Шалгуулагч №
																		</TableHead>
																		<TableHead className="text-[10px] font-extrabold tracking-wide text-muted-foreground uppercase px-4">
																			Нэвтрэх нууц үг
																		</TableHead>
																		<TableHead className="text-[10px] font-extrabold tracking-wide text-muted-foreground uppercase text-right pr-4">
																			Үйлдэл
																		</TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{group.students.map((student, idx) => (
																		<TableRow
																			key={student.examinee_number}
																			className="h-12 border-b border-border/60 last:border-0 hover:bg-accent/50"
																		>
																			<TableCell className="pl-4 font-mono text-[11px] font-bold text-muted-foreground">
																				{idx + 1}
																			</TableCell>
																			<TableCell>
																				<div className="flex flex-col">
																					<span className="mb-1 text-[13px] leading-none font-extrabold text-foreground">
																						{student.last_name}{" "}
																						{student.first_name}
																					</span>
																					<span className="font-mono text-[10px] font-semibold tracking-tighter text-muted-foreground uppercase">
																						{student.register_number}
																					</span>
																				</div>
																			</TableCell>
																			<TableCell>
																				<div className="group/num inline-flex cursor-default items-center gap-1.5 rounded-full bg-pop-sky-soft px-2.5 py-1 text-pop-sky-ink">
																					<Hash
																						size={10}
																						strokeWidth={3}
																					/>
																					<span className="text-[11px] font-black font-mono">
																						{student.examinee_number}
																					</span>
																				</div>
																			</TableCell>
																			<TableCell>
																				<div className="flex items-center gap-2 group/pw">
																					<div className="min-w-[80px] font-mono text-[12px]">
																						{visiblePasswords[
																							student.examinee_number
																						] ? (
																							<span className="font-bold text-primary">
																								{student.passwordauto}
																							</span>
																						) : (
																							<span className="text-muted-foreground/50">
																								••••••••
																							</span>
																						)}
																					</div>
																					<Button
																						variant="ghost"
																						size="icon"
																						className="size-7 rounded-lg transition-colors hover:bg-primary/10 hover:text-primary"
																						onClick={(e) => {
																							e.stopPropagation();
																							setVisiblePasswords((prev) => ({
																								...prev,
																								[student.examinee_number]:
																									!prev[
																										student.examinee_number
																									],
																							}));
																						}}
																					>
																						{visiblePasswords[
																							student.examinee_number
																						] ? (
																							<EyeOff size={13} />
																						) : (
																							<Eye size={13} />
																						)}
																					</Button>
																				</div>
																			</TableCell>
																			<TableCell className="text-right pr-4">
																				<DropdownMenu>
																					<DropdownMenuTrigger asChild>
																						<Button
																							variant="ghost"
																							size="icon"
																							className="size-8 rounded-xl"
																						>
																							<MoreVertical
																								size={14}
																								className="text-muted-foreground"
																							/>
																						</Button>
																					</DropdownMenuTrigger>
																					<DropdownMenuContent
																						align="end"
																						className="w-48 rounded-2xl p-1.5"
																					>
																						<DropdownMenuItem
																							onClick={() =>
																								copyToClipboard(
																									student.examinee_number,
																									"Шалгуулагчийн дугаар",
																								)
																							}
																							className="cursor-pointer gap-2 rounded-xl text-xs font-bold"
																						>
																							<span className="flex size-6 items-center justify-center rounded-lg bg-pop-sky-soft text-pop-sky-ink">
																							<ClipboardCopy className="size-3.5" />
																						</span>{" "}
																							Дугаар хуулах
																						</DropdownMenuItem>
																						<DropdownMenuItem
																							onClick={() =>
																								copyToClipboard(
																									student.passwordauto,
																									"Нууц үг",
																								)
																							}
																							className="cursor-pointer gap-2 rounded-xl text-xs font-bold"
																						>
																							<span className="flex size-6 items-center justify-center rounded-lg bg-pop-violet-soft text-pop-violet-ink">
																							<Copy className="size-3.5" />
																						</span>{" "}
																							Нууц үг хуулах
																						</DropdownMenuItem>
																					</DropdownMenuContent>
																				</DropdownMenu>
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
