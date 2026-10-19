"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building, DoorOpen, Monitor } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { getRooms } from "@/lib/dash.api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Room } from "@/types/dashboard/room.types";

// Сонгогдсон өрөөний төрөл
export interface SelectedRoom {
	id: string;
	esisroomid: number;
	pccnt: number;
}

interface RoomSelectorProps {
	selectedId: string | null;
	// Сонгох үед id болон esisroomid-г хамт буцаана
	onSelect: (id: SelectedRoom) => void;
	acctionHidden?: boolean;
}

export function RoomSelector({
	selectedId,
	onSelect,
	acctionHidden = false,
}: RoomSelectorProps) {
	const { userId } = useAuthStore();

	const { data: rooms = [], isLoading } = useQuery({
		queryKey: ["api_get_exam_rooms", userId],
		queryFn: () =>
			getRooms({
				userId: Number(userId),
				procname: "api_get_exam_rooms",
			}),
		enabled: !!userId,
		select: (res) => res.RetData,
	});

	const handleValueChange = (id: string) => {
		const foundRoom = rooms.find((r) => String(r.id) === id);
		if (foundRoom) {
			onSelect({
				id: String(foundRoom.id),
				esisroomid: foundRoom.esisroomid,
				pccnt: foundRoom.pccnt ?? 0,
			});
		}
	};

	return (
		<div className="h-full p-4 overflow-y-auto overflow-x-hidden">
			{isLoading ? (
				<div className="space-y-3 p-1">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="space-y-3 rounded-2xl border-2 border-border p-4"
						>
							<div className="flex items-center gap-3">
								<Skeleton className="h-4 w-4 rounded-full" />
								<Skeleton className="h-5 w-32 rounded-lg" />
							</div>
							<div className="flex gap-2 border-t-2 border-border pt-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-20" />
							</div>
						</div>
					))}
				</div>
			) : rooms === null || rooms.length === 0 ? (
				<div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
					<span className="flex size-16 items-center justify-center rounded-full bg-pop-sky-soft text-pop-sky-ink">
						<DoorOpen size={28} strokeWidth={2.5} />
					</span>
					<p className="text-sm font-bold">Өрөө олдсонгүй</p>
				</div>
			) : (
				<RadioGroup
					value={selectedId || ""}
					onValueChange={handleValueChange}
					className="space-y-3 p-1"
				>
					{rooms.map((room: Room) => {
						const hasPC = room.pccnt !== null && room.pccnt > 0;
						const isDisabled = !hasPC || room.flag === 1; // 👈 ЭНЭ

						return (
							<div key={room.id} className="relative group">
								<Label
									htmlFor={`room-${room.id}`}
									className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-3 transition-all ${
										isDisabled
											? "border-dashed border-border bg-muted/40"
											: selectedId === String(room.id)
												? "border-primary bg-primary/10 shadow-[0_3px_0_0_color-mix(in_oklch,var(--primary)_35%,transparent)]"
												: "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/50"
									}`}
								>
									<div
										className={`flex items-start w-full ${isDisabled ? "opacity-60" : ""}`}
									>
										<div className="flex items-center gap-3 w-full">
											<RadioGroupItem
												value={String(room.id)}
												id={`room-${room.id}`}
												disabled={isDisabled} // 👈 ЭНЭ
											/>
											<div className="flex flex-col gap-0.5 overflow-hidden">
												<div className="flex items-center gap-2 text-sm font-extrabold">
													<DoorOpen
														size={14}
														className="text-pop-sky-ink"
														strokeWidth={2.5}
													/>
													<span
														className={
															isDisabled ? "text-muted-foreground" : ""
														}
													>
														{room.room_number}-р өрөө
													</span>
													{room.branchname && (
														<span className="truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
															{room.branchname}
														</span>
													)}
												</div>
												{room.name && (
													<div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
														<Building size={12} />
														<span className="truncate">{room.name}</span>
													</div>
												)}
											</div>
										</div>
									</div>

									<div className="mt-2 flex w-full items-center justify-between gap-2 border-t-2 border-dashed border-border pt-2">
										<div
											className={`flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground ${isDisabled ? "opacity-60" : ""}`}
										>
											<Monitor size={14} strokeWidth={2.5} />
											<span>{room.pccnt ?? 0} суудал</span>
										</div>

										{room.flag === 1 ? (
											<Badge
												variant="coral"
												className="h-5 rounded-full px-2 text-[10px] font-bold"
											>
												Түр хаагдсан
											</Badge>
										) : !hasPC ? (
											!acctionHidden && (
												<Button
													size="sm"
													variant="outline"
													className="relative z-10 h-7 gap-1 rounded-full px-2.5 text-[10px] font-bold text-pop-sky-ink"
													asChild
												>
													<Link href={`room/${room.id}`}>
														Ширээний зохион байгуулалт
														<ArrowRight size={10} strokeWidth={3} />
													</Link>
												</Button>
											)
										) : (
											<Badge
												variant="mint"
												className="h-5 rounded-full px-2 text-[10px] font-bold"
											>
												Төхөөрөмжтэй
											</Badge>
										)}
									</div>
								</Label>
							</div>
						);
					})}
				</RadioGroup>
			)}
		</div>
	);
}
