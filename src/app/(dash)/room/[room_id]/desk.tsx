"use client";

import type { Table } from "@/types/dashboard/room.types";

interface DeskProps {
	table: Table;
	isActive: boolean;
	gridX: number;
	gridY: number;
	tableUnits: number;
	isNew?: boolean; // ← нэмэх
	isMoved?: boolean;
	onMouseDown: (e: React.MouseEvent, table: Table) => void;
}

export function Desk({
	table,
	isActive,
	gridX,
	gridY,
	tableUnits,
	isNew,

	onMouseDown,
}: DeskProps) {
	return (
		<button
			type="button"
			onMouseDown={(e) => onMouseDown(e, table)}
			style={{
				left: `${(table.xPos / gridX) * 100}%`,
				top: `${(table.yPos / gridY) * 100}%`,
				width: `${(tableUnits / gridX) * 100}%`,
				height: `${(tableUnits / gridY) * 100}%`,
				padding: `2px`,
				transition: isActive
					? "none"
					: "all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
			}}
			className={`absolute cursor-grab active:cursor-grabbing outline-none focus:ring-0 ${
				isActive ? "z-50" : "z-10"
			}`}
		>
			<div
				className={`flex h-full w-full items-center justify-center rounded-xl border-2 p-0.5 text-xs font-black tabular-nums transition-all ${
					isActive
						? "scale-110 border-primary-shade bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--primary-shade)]"
						: isNew
							? "border-pop-sun bg-pop-sun-soft text-pop-sun-ink shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-sun)_60%,transparent)]"
							: "border-pop-violet/40 bg-pop-violet-soft text-pop-violet-ink shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-violet)_35%,transparent)] hover:-translate-y-0.5 hover:border-pop-violet"
				}`}
			>
				{/* <Monitor /> */}
				{table.seat_number}
			</div>
		</button>
	);
}
