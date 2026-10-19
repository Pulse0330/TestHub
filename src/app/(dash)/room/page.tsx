"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Building,
	CircleOff,
	DoorOpen,
	Edit,
	Loader2,
	MapPin,
	Monitor,
	MoreVertical,
	Plus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { RoomCreateEditDialog } from "@/app/(dash)/room/RoomCreateEditDialog";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getRooms, roomCreateEdit } from "@/lib/dash.api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Room } from "@/types/dashboard/room.types";

export default function RoomPage() {
	const queryClient = useQueryClient();
	const { userId } = useAuthStore();
	const [isOpen, setIsOpen] = useState(false);
	const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

	const { data, isLoading } = useQuery({
		queryKey: ["api_get_exam_rooms", userId],
		queryFn: () =>
			getRooms({ userId: Number(userId), procname: "api_get_exam_rooms" }),
		enabled: !!userId,
		select: (res) => res.RetData || [],
	});

	const { mutate: deleteRoom, isPending: isDeletePending } = useMutation({
		mutationFn: async (id: number) => {
			const payload = {
				id: id ?? 0,
				optype: 2,
				userid: Number(userId),
				branchname: "",
				descr: "",
				name: "",
				room_number: "100",
				num_of_pc: 0,
				school_esis_id: "",
				esisroomid: "",
			};
			return roomCreateEdit(payload);
		},
		onSuccess: (res) => {
			if (res.RetResponse.ResponseCode === 11) {
				toast.error(res.RetResponse.ResponseMessage);
			}
			setIsDeleteOpen(false);
			queryClient.invalidateQueries({ queryKey: ["api_get_exam_rooms"] });
		},
	});

	const handleEdit = (id: number) => {
		setSelectedRoomId(id);
		setIsOpen(true);
	};

	const confirmDelete = (room: Room) => {
		setRoomToDelete(room);
		setIsDeleteOpen(true);
	};

	return (
		<div className="py-6 max-w-7xl mx-auto">
			{/* 1. Header - Үргэлж харагдана */}
			<header className="mb-8 flex flex-wrap items-end justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-pop-sun-soft text-pop-sun-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_35%,transparent)]">
						<DoorOpen className="size-7" strokeWidth={2.5} />
					</div>
					<div>
						<h1 className="text-2xl font-black tracking-tight md:text-3xl">
							Шалгалтын өрөөнүүд
						</h1>
						<p className="mt-1 text-sm font-semibold text-muted-foreground">
							{isLoading
								? "Өрөөний мэдээллийг шалгаж байна..."
								: `Нийт ${data?.length || 0} өрөө бүртгэгдсэн байна.`}
						</p>
					</div>
				</div>
				<Button
					onClick={() => {
						setSelectedRoomId(null);
						setIsOpen(true);
					}}
					className="w-full gap-2 sm:w-auto"
				>
					<Plus size={18} strokeWidth={2.5} />
					Шалгалтын өрөө бүртгэх
				</Button>
			</header>
			{/* 2. Content Area */}
			{isLoading ? (
				// Ачаалж байх үед Skeleton харуулна
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Card key={i} className="flex h-70 flex-col">
							<CardHeader className="space-y-2">
								<Skeleton className="h-4 w-20 rounded-lg" />
								<Skeleton className="h-10 w-24 rounded-xl" />
							</CardHeader>
							<CardContent className="space-y-4">
								<Skeleton className="h-10 w-full rounded-xl" />
								<Skeleton className="h-10 w-full rounded-xl" />
							</CardContent>
							<CardFooter>
								<Skeleton className="h-9 w-full rounded-xl" />
							</CardFooter>
						</Card>
					))}
				</div>
			) : data && data.length > 0 ? (
				// Дата байгаа үед Grid харуулна
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
					{data.map((room, idx) => (
						<Card
							key={room.id}
							style={{ animationDelay: `${idx * 50}ms` }}
							className={`relative flex h-90 animate-pop-in flex-col justify-between gap-1 ${
								room.flag === 1
									? "pointer-events-none border-dashed bg-muted/40 opacity-50"
									: "lift hover:border-primary/40"
							}`}
						>
							<CardHeader className="pb-3">
								<div className="flex justify-between items-start">
									<div>
										<p className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
											Өрөөний дугаар
										</p>
										<h2 className="mt-1 inline-flex min-w-14 items-center justify-center rounded-2xl bg-pop-sun-soft px-3 py-1 text-3xl font-black text-pop-sun-ink tabular-nums">
											{room.room_number || "—"}
										</h2>
									</div>

									{/* Flag badge */}
									{room.flag === 1 && (
										<span className="absolute top-2 right-2 rounded-full bg-pop-coral-soft px-2.5 py-0.5 text-[10px] font-extrabold text-pop-coral-ink uppercase">
											Түр хаагдсан
										</span>
									)}

									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="size-8 rounded-xl hover:bg-muted"
												disabled={room.flag === 1}
											>
												<MoreVertical
													size={18}
													className="text-muted-foreground"
												/>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-44 rounded-2xl p-1.5">
											<DropdownMenuItem
												onClick={() => handleEdit(room.id)}
												className="cursor-pointer gap-2 rounded-xl font-bold"
											>
												<span className="flex size-6 items-center justify-center rounded-lg bg-pop-sky-soft text-pop-sky-ink">
													<Edit className="size-3.5" />
												</span>{" "}
												Засах
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="cursor-pointer gap-2 rounded-xl font-bold text-destructive focus:bg-pop-coral-soft focus:text-destructive"
												onClick={() => confirmDelete(room)}
											>
												<span className="flex size-6 items-center justify-center rounded-lg bg-pop-coral-soft text-pop-coral-ink">
													<CircleOff className="size-3.5" />
												</span>{" "}
												Түр хаах
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</CardHeader>

							<CardContent className="flex h-full flex-col justify-between gap-4 pb-2">
								<div className="space-y-2">
									<div className="flex items-center gap-2.5">
										<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-pop-pink-soft text-pop-pink-ink">
											<MapPin size={14} strokeWidth={2.5} />
										</span>
										<div className="min-w-0">
											<p className="text-[10px] leading-none font-extrabold tracking-tight text-muted-foreground uppercase">
												Хичээлийн байр
											</p>
											<p className="mt-1 truncate text-sm font-bold text-foreground">
												{room.branchname ? room.branchname : "-"}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2.5">
										<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-pop-violet-soft text-pop-violet-ink">
											<Building size={14} strokeWidth={2.5} />
										</span>
										<div className="min-w-0">
											<p className="text-[10px] leading-none font-extrabold tracking-tight text-muted-foreground uppercase">
												Шалгалт авах өрөөний нэр
											</p>
											<p className="mt-1 truncate text-sm font-extrabold text-foreground">
												{room.name ? room.name : "-"}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-2.5">
										<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-pop-sky-soft text-pop-sky-ink">
											<Monitor size={14} strokeWidth={2.5} />
										</span>
										<div className="min-w-0">
											<p className="text-[10px] leading-none font-extrabold tracking-tight text-muted-foreground uppercase">
												Бүртгэгдсэн төхөөрөмжийн тоо
											</p>
											<p className="mt-1 truncate text-sm font-bold text-foreground">
												{room.num_of_pc ? `${room.num_of_pc}` : "-"}
											</p>
										</div>
										<div className="min-w-0">
											<p className="text-[10px] leading-none font-extrabold tracking-tight text-muted-foreground uppercase">
												Зохион байгуулсан төхөөрөмж
											</p>
											<p className="mt-1 truncate text-sm font-bold text-foreground">
												{room.pccnt ? `${room.pccnt}` : "-"}
											</p>
										</div>
									</div>
								</div>

								<div className="rounded-xl bg-muted/60 p-2.5">
									<p className="text-[10px] leading-none font-extrabold text-muted-foreground uppercase">
										Тайлбар
									</p>
									<p className="mt-1 line-clamp-2 text-[11px] leading-relaxed font-semibold text-muted-foreground">
										{room.description ||
											"Нэмэлт тайлбар бүртгэгдээгүй байна."}{" "}
									</p>
								</div>
							</CardContent>

							<CardFooter className="pt-0">
								<Button
									variant="default"
									size="sm"
									className="group h-9 w-full text-xs font-bold"
									disabled={room.flag === 1}
									asChild={room.flag !== 1}
								>
									{room.flag !== 1 ? (
										<Link href={`/room/${room.id}`}>
											<Monitor size={14} strokeWidth={2.5} />
											Ширээний зохион байгуулалт
										</Link>
									) : (
										<>
											<Monitor size={14} strokeWidth={2.5} />
											Ширээний зохион байгуулалт
										</>
									)}
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card px-4 py-24 animate-in fade-in zoom-in duration-300">
					<div className="mb-4 flex size-24 animate-float items-center justify-center rounded-full bg-pop-sun-soft text-pop-sun-ink">
						<DoorOpen className="size-12" strokeWidth={2.25} />
					</div>
					<h3 className="text-xl font-black tracking-tight">
						Өрөө бүртгэгдээгүй байна
					</h3>
					<p className="mt-2 max-w-70 text-center text-sm font-semibold text-muted-foreground">
						Шалгалт зохион байгуулахын тулд эхлээд өрөөний мэдээллээ оруулна уу.
					</p>
					<Button
						onClick={() => setIsOpen(true)}
						className="mt-6 gap-2 px-6"
					>
						<Plus size={16} strokeWidth={2.5} /> Шалгалтын өрөө бүртгэх
					</Button>
				</div>
			)}
			<RoomCreateEditDialog
				open={isOpen}
				setOpen={setIsOpen}
				roomID={selectedRoomId}
			/>
			<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<AlertDialogContent className="max-w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex flex-col items-center justify-center gap-3">
							<div className="flex size-16 items-center justify-center rounded-3xl bg-pop-coral-soft text-pop-coral-ink">
								<CircleOff className="size-7" strokeWidth={2.5} />
							</div>
							<p>Өрөө түр хаах</p>
						</AlertDialogTitle>
						<AlertDialogDescription className="text-center">
							Та <span className="font-bold">{roomToDelete?.room_number}</span>{" "}
							дугаар өрөөг түр хаахдаа итгэлтэй байна уу?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="flex flex-col justify-end gap-2 pt-2">
						<Button
							onClick={(e) => {
								e.preventDefault();
								if (roomToDelete) deleteRoom(roomToDelete.id);
							}}
							variant="destructive"
							className="w-full"
							disabled={isDeletePending}
						>
							{isDeletePending ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									Устгаж байна...
								</>
							) : (
								"Түр хаах"
							)}
						</Button>
						<Button
							disabled={isDeletePending}
							onClick={() => {
								setIsDeleteOpen(false);
							}}
							variant={"outline"}
							className="w-full"
						>
							Цуцлах
						</Button>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// Туслах компонент (Dropdown separator-ийн алдаанаас сэргийлж)
function DropdownMenuSeparator() {
	return <div className="my-1 h-0.5 rounded-full bg-border" />;
}
