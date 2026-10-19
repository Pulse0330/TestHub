"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Armchair, Minus, Plus, Save } from "lucide-react";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Desk } from "@/app/(dash)/room/[room_id]/desk";
import { LayoutPicker } from "@/app/(dash)/room/[room_id]/mini-room";
import { IBackButton } from "@/components/iBackButton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRoomManager } from "@/hooks/use-room-manager";
import {
	getComputerPositions,
	getRoomById,
	saveRoomLayout,
} from "@/lib/dash.api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { LayoutType, Table } from "@/types/dashboard/room.types";

interface RoomPageProps {
	params: Promise<{ room_id: string }>; // params-ийн төрлийг Promise гэж тодорхойлно
}

export default function RoomPage({ params }: RoomPageProps) {
	const { userId } = useAuthStore();
	const unwrappedParams = use(params);
	const roomId = unwrappedParams.room_id;

	const TABLE_UNITS = 30;
	const SNAP_STEP = 10;

	const {
		tables,
		setTables,
		tableCount,
		setTableCount,
		setSizeMultiplier,
		activeTable,
		setActiveTable,
		GRID_X,
		GRID_Y,
		startPos,
		dragOffset,
		applyLayout,
		isOverlapping,
		RATIO_X,
		RATIO_Y,
		sizeMultiplier,
		addExtraTables,
	} = useRoomManager(TABLE_UNITS);

	const containerRef = useRef<HTMLDivElement>(null);
	const [currentLayout, setCurrentLayout] = useState<LayoutType>("rows_3");
	const [newlyAddedTables, setNewlyAddedTables] = useState<Table[]>([]);

	const { data: remoteData, isLoading: isDataLoading } = useQuery({
		queryKey: ["room-positions", roomId],
		queryFn: () =>
			getComputerPositions({ userId: Number(userId), roomid: Number(roomId) }),
		enabled: !!userId,
	});

	const { data: roomDetail, isLoading: isRoomDetailLoading } = useQuery({
		queryKey: ["room-detail", roomId],
		queryFn: () =>
			getRoomById({ userId: Number(userId), roomid: Number(roomId) }),
		select: (res) => res.RetData[0],
	});

	// useEffect(() => {
	// 	if (roomDetail?.roomsize) {
	// 		setSizeMultiplier(roomDetail.roomsize);
	// 	}
	// }, [roomDetail, setSizeMultiplier]);

	// Өмнөх олон useEffect-үүдээ устгаад зөвхөн үүнийг үлдээ:
	// biome-ignore lint/correctness/useExhaustiveDependencies: tables and applyLayout intentionally excluded to prevent infinite loop
	useEffect(() => {
		if (isDataLoading || isRoomDetailLoading || !roomDetail) return;
		if (roomDetail.roomsize) {
			setSizeMultiplier(roomDetail.roomsize);
		}

		const totalPcCount = roomDetail.num_of_pc || 0;

		if (remoteData?.RetData && remoteData.RetData.length > 0) {
			const mappedTables: Table[] = remoteData.RetData.map((pc) => ({
				id: pc.seatid,
				xPos: pc.colnum,
				yPos: pc.rownum,
				name: pc.seat_number,
				seat_number: pc.seat_number,
				exam_seat_id: pc.exam_seat_id,
			}));

			const { allTables, newTables } = addExtraTables(
				mappedTables,
				totalPcCount,
			);
			setNewlyAddedTables(newTables);
			setTables(allTables);
			setTableCount(allTables.length);
		} else {
			setTableCount(totalPcCount);
			if (tables.length === 0 && totalPcCount > 0) {
				applyLayout(currentLayout, totalPcCount);
			}
		}
		// 122-р мөрийн biome-ignore comment-г УСТГА
	}, [isDataLoading, isRoomDetailLoading, remoteData, roomDetail]);

	// Mouse handlers (MouseDown, MouseMove, MouseUp хэвээрээ...)
	const handleMouseDown = (e: React.MouseEvent, table: Table) => {
		const rect = containerRef.current?.getBoundingClientRect();
		if (!rect) return;
		const unitSize = rect.width / GRID_X;
		setActiveTable(table.id);
		startPos.current = { x: table.xPos, y: table.yPos };
		dragOffset.current = {
			x: e.clientX - rect.left - table.xPos * unitSize,
			y: e.clientY - rect.top - table.yPos * unitSize,
		};
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (activeTable === null || !containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		const unitSize = rect.width / GRID_X;
		const mouseX = (e.clientX - rect.left - dragOffset.current.x) / unitSize;
		const mouseY = (e.clientY - rect.top - dragOffset.current.y) / unitSize;

		let snappedX = Math.round(mouseX / SNAP_STEP) * SNAP_STEP;
		let snappedY = Math.round(mouseY / SNAP_STEP) * SNAP_STEP;
		snappedX = Math.max(0, Math.min(snappedX, GRID_X - TABLE_UNITS));
		snappedY = Math.max(0, Math.min(snappedY, GRID_Y - TABLE_UNITS));

		setTables((prev) =>
			prev.map((t) =>
				t.id === activeTable ? { ...t, xPos: snappedX, yPos: snappedY } : t,
			),
		);
	};

	const handleMouseUp = () => {
		if (activeTable === null) return;
		const currentTable = tables.find((t) => t.id === activeTable);
		if (
			currentTable &&
			isOverlapping(activeTable, currentTable.xPos, currentTable.yPos, tables)
		) {
			setTables((prev) =>
				prev.map((t) =>
					t.id === activeTable
						? { ...t, xPos: startPos.current.x, yPos: startPos.current.y }
						: t,
				),
			);
		}
		setActiveTable(null);
	};

	const handleLayoutChange = (type: LayoutType) => {
		setCurrentLayout(type);
		applyLayout(type); // Таны hook-ээс ирж байгаа функц
	};

	const { mutate: saveLayout, isPending } = useMutation({
		mutationFn: saveRoomLayout,
		onSuccess: (res) => {
			if (res.RetResponse.ResponseCode === 11) {
				toast.error(res.RetResponse.ResponseMessage);
			} else {
				toast.success(res.RetResponse.ResponseMessage);
			}
		},
	});

	const handleSave = () => {
		if (tables.length > (roomDetail?.num_of_pc || 0)) {
			toast.error(
				`Ширээний тоо ${roomDetail?.num_of_pc}-оос хэтрэх боломжгүй!`,
			);
			return;
		}
		// Шинэ ширээ байгаа эсэхээс хамааран явуулах дата өөрчлөгдөнө
		const tablesToSave =
			newlyAddedTables.length > 0 ? newlyAddedTables : tables;

		saveLayout({
			roomId: Number(roomId),
			userId: userId || 0,
			tables: tablesToSave, // ✅ Зөвхөн шинэ ширээнүүд
			sizes: sizeMultiplier,
		});
	};

	// remoteData-гийн анхны байршлуудыг map хийж авах
	const originalPositions = useMemo(() => {
		const map = new Map<number, { xPos: number; yPos: number }>();
		remoteData?.RetData?.forEach((pc) => {
			map.set(pc.seatid, { xPos: pc.colnum, yPos: pc.rownum });
		});
		return map;
	}, [remoteData]);

	// Байршил өөрчлөгдсөн ширээнүүдийг тодорхойлох
	const movedTables = useMemo(() => {
		return new Set(
			tables
				.filter((t) => {
					if (!t.exam_seat_id || t.exam_seat_id === 0) return false;
					const original = originalPositions.get(t.id);
					if (!original) return false;
					return t.xPos !== original.xPos || t.yPos !== original.yPos;
				})
				.map((t) => t.id),
		);
	}, [tables, originalPositions]);

	const isAlreadyRegistered = remoteData !== null;

	if (isDataLoading || isRoomDetailLoading) {
		return (
			<div className="flex h-[60vh] w-full items-center justify-center">
				<Spinner className="size-8 text-primary" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-7xl space-y-6 py-6 text-foreground select-none">
			{/* TOOLBAR */}

			<header className="mb-8 flex flex-wrap items-end justify-between gap-4 text-foreground">
				<div className="flex min-w-0 items-center gap-3 md:gap-4">
					<IBackButton className="shrink-0" />
					<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-pop-violet-soft text-pop-violet-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_35%,transparent)]">
						<Armchair className="size-7" strokeWidth={2.5} />
					</div>
					<div className="min-w-0">
						<h1 className="flex flex-wrap items-center gap-2 text-2xl font-black tracking-tight md:text-3xl">
							Ширээний зохион байгуулалт{" "}
							<span className="text-muted-foreground">
								| {roomDetail?.room_number || "—"}-р өрөө
							</span>
						</h1>
						<p className="mt-1 text-sm font-semibold text-muted-foreground">
							{tableCount} Ширээ | {roomDetail?.branchname}
						</p>
					</div>
				</div>
				<AlertDialog>
					{/* Хэрэв бүртгэгдсэн бол товчийг идэвхгүй болгоно */}
					<AlertDialogTrigger asChild>
						<Button className="w-full md:w-auto">
							{isPending ? (
								<div className="flex items-center gap-2">
									<Spinner /> Хадгалж байна...
								</div>
							) : (
								<div className="flex items-center gap-2">
									<Save size={16} strokeWidth={2.5} />
									{"Хадгалах"}
								</div>
							)}
						</Button>
					</AlertDialogTrigger>

					<AlertDialogContent className="max-w-sm">
						<AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
							<div className="mb-2 flex size-16 items-center justify-center rounded-3xl bg-pop-mint-soft text-pop-mint-ink">
								<Save className="size-7" strokeWidth={2.5} />
							</div>
							<AlertDialogTitle>
								{isAlreadyRegistered
									? "Бүртгэлтэй байна"
									: "Та итгэлтэй байна уу?"}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{isAlreadyRegistered
									? "Энэ өрөөний байршил аль хэдийн бүртгэгдсэн байна. Та дахин бүртгэх боломжгүй."
									: "Та ширээний байршлыг хадгалах гэж байна. Энэ үйлдлийг хийхэд бэлэн үү?"}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className="mt-2 gap-2 sm:justify-center">
							<AlertDialogCancel className="flex-1">
								{isAlreadyRegistered ? "Хаах" : "Болих"}
							</AlertDialogCancel>
							{
								<AlertDialogAction onClick={handleSave} className="flex-1">
									Тийм, хадгалах
								</AlertDialogAction>
							}
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</header>

			<div className="flex flex-col items-start gap-6 lg:flex-row">
				{/* ROOM CONTAINER */}
				<main
					ref={containerRef}
					className="relative w-full overflow-hidden rounded-3xl border-2 border-border bg-card shadow-[0_4px_0_0_var(--border)]"
					style={{ aspectRatio: `${RATIO_X} / ${RATIO_Y}` }}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
				>
					{/* GRID */}
					<div
						className="pointer-events-none absolute inset-0 opacity-50"
						style={{
							backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
							backgroundSize: `${(SNAP_STEP / GRID_X) * 100}% ${(SNAP_STEP / GRID_Y) * 100}%`,
						}}
					/>

					{/* <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 scale-90 md:scale-100 origin-bottom-right">
						<ButtonGroup orientation="vertical">
							<Button
								variant="outline"
								onClick={addTable}
								className=" shadow-lg "
								size={"xs"}
							>
								<Plus />
								Ширээ нэмэх
							</Button>
							<Button
								variant="outline"
								onClick={removeTable}
								className=" shadow-lg "
								size={"xs"}
							>
								<Minus />
								Ширээ хасах
							</Button>
						</ButtonGroup>
					</div> */}

					{/* CONTROL BUTTONS (BOTTOM RIGHT) */}
					<div className="absolute right-4 bottom-4 z-20 flex origin-bottom-right scale-90 flex-col gap-2 md:scale-100">
						{/* <div className="flex items-center gap-2 px-3 py-1 bg-card rounded-lg border border-border shadow-lg">
							<span className="text-[10px] font-bold text-muted-foreground uppercase">
								Too
							</span>
							<Input
								type="number"
								value={tableCount}
								onChange={(e) => setTableCount(Number(e.target.value))}
								className="w-10 h-7 border-none bg-transparent p-0 text-center font-bold focus-visible:ring-0"
							/>
						</div> */}

						<div className="flex rounded-2xl border-2 border-border bg-card p-1 shadow-[0_3px_0_0_var(--border)]">
							<Button
								variant="ghost"
								size="icon"
								className="size-8 rounded-xl"
								onClick={() => setSizeMultiplier((m) => Math.max(m - 5, 20))}
							>
								<Minus size={16} strokeWidth={2.5} />
							</Button>
							<div className="flex items-center px-2 text-[11px] font-extrabold text-muted-foreground">
								Хэмжээ
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 rounded-xl"
								onClick={() => setSizeMultiplier((m) => Math.min(m + 5, 100))}
							>
								<Plus size={16} strokeWidth={2.5} />
							</Button>
						</div>
					</div>

					{tables.map((table) => (
						<Desk
							key={table.id}
							table={table}
							isActive={activeTable === table.id}
							isMoved={movedTables.has(table.id)} // ← нэмэх
							gridX={GRID_X}
							gridY={GRID_Y}
							isNew={newlyAddedTables.some((t) => t.id === table.id)}
							tableUnits={TABLE_UNITS}
							onMouseDown={handleMouseDown}
						/>
					))}
				</main>

				<aside className="flex w-full flex-col gap-4 lg:w-48">
					<div className="flex flex-col gap-2 px-1">
						<span className="text-[11px] font-black tracking-widest text-muted-foreground uppercase">
							Бэлэн загварууд
						</span>
						<div className="h-1 w-10 rounded-full bg-gradient-to-r from-pop-violet to-pop-pink" />
					</div>
					<div className="w-full overflow-x-auto scrollbar-none">
						<LayoutPicker
							currentLayout={currentLayout}
							onSelect={handleLayoutChange}
						/>
					</div>
				</aside>
			</div>
			<div className="flex flex-wrap gap-3">
				<div className="flex items-center gap-3 rounded-full border-2 border-border bg-card py-1.5 pr-4 pl-1.5 text-sm font-bold">
					<div className="flex size-8 items-center justify-center rounded-xl border-2 border-pop-violet/40 bg-pop-violet-soft p-0.5 shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-violet)_35%,transparent)]"></div>{" "}
					Бүртгэдсэн ширээ
				</div>
				<div className="flex items-center gap-3 rounded-full border-2 border-border bg-card py-1.5 pr-4 pl-1.5 text-sm font-bold">
					{" "}
					<div className="flex size-8 items-center justify-center rounded-xl border-2 border-pop-sun bg-pop-sun-soft p-0.5 shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-sun)_60%,transparent)]"></div>
					Нэмж бүртгэсэн ширээ
				</div>
			</div>
			{/* Header хэсгийн товчлуур */}
		</div>
	);
}
