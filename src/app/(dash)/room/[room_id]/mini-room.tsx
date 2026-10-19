"use client";

import { useMemo } from "react";
import type { LayoutType } from "@/types/dashboard/room.types";

interface LayoutPickerProps {
	currentLayout: LayoutType;
	onSelect: (type: LayoutType) => void;
}

// 1. MiniRoom Component: Загвар бүрийн жижиг дүрсийг зурагч
const MiniRoom = ({
	type,
	isActive,
}: {
	type: LayoutType;
	isActive: boolean;
}) => {
	const dots = useMemo(() => {
		switch (type) {
			case "u_shape":
				return [
					{ x: 25, y: 22 },
					{ x: 42, y: 22 },
					{ x: 59, y: 22 },
					{ x: 76, y: 22 },
					{ x: 76, y: 49 },
					{ x: 76, y: 76 },
					{ x: 25, y: 76 },
					{ x: 42, y: 76 },
					{ x: 59, y: 76 },
				];
			case "rows_2":
				// 2 Салаа: Нийт 8 ширээ (4 хөндлөн эгнээ x 2 багана)
				// Салаа 1: Хос эгнээ
				// Салаа 2: Хос эгнээ
				return [
					// 1-р Салаа (4 ширээ, хос эгнээ)
					{ x: 25, y: 30 },
					{ x: 42, y: 30 }, // Зүүн талын хос
					{ x: 59, y: 30 }, // Зүүн талын хос
					{ x: 76, y: 30 },
					{ x: 76, y: 70 },
					{ x: 25, y: 70 },
					{ x: 42, y: 70 },
					{ x: 59, y: 70 },
				];
			default: // rows_3
				// 3 Салаа: Нийт 12 ширээ (4 хөндлөн эгнээ x 3 багана)
				return [
					// 1-р Салаа (4 ширээ)
					{ x: 25, y: 22 },
					{ x: 42, y: 22 }, // Зүүн талын хос
					{ x: 59, y: 22 }, // Зүүн талын хос
					{ x: 76, y: 22 },
					{ x: 76, y: 49 },
					{ x: 25, y: 49 },
					{ x: 42, y: 49 }, // Зүүн талын хос
					{ x: 59, y: 49 }, // Зүүн талын хос
					{ x: 76, y: 76 },
					{ x: 25, y: 76 },
					{ x: 42, y: 76 },
					{ x: 59, y: 76 },
				];
		}
	}, [type]);

	return (
		<div
			className={`relative h-full w-full overflow-hidden rounded-xl border-2 transition-all duration-500 ${
				isActive
					? "border-primary/30 bg-primary/10 text-primary"
					: "border-border bg-muted/50 text-muted-foreground group-hover:border-primary/30"
			}`}
		>
			{/* Чимэглэлийн Grid цэгүүд */}
			<div
				className="absolute inset-0 opacity-[0.15]"
				style={{
					backgroundImage:
						"radial-gradient(circle, currentColor 1px, transparent 1px)",
					backgroundSize: "8px 8px",
				}}
			/>

			{dots.map((dot, index) => (
				<div
					key={`${type}-${dot.x}-${dot.y}`}
					className={`absolute h-2.5 w-2.5 rounded-[3px] transition-all duration-500 ${
						isActive
							? "bg-primary"
							: "bg-muted-foreground/60 group-hover:bg-primary/60"
					}`}
					style={{
						left: `${dot.x}%`,
						top: `${dot.y}%`,
						transform: "translate(-50%, -50%)",
						transitionDelay: `${index * 15}ms`,
					}}
				/>
			))}
		</div>
	);
};

// 2. LayoutPicker Component: Сонгогч хэсэг
export function LayoutPicker({ currentLayout, onSelect }: LayoutPickerProps) {
	const options: { id: LayoutType; label: string }[] = [
		{ id: "rows_3", label: "3 Салаа" },
		{ id: "rows_2", label: "2 Салаа" },
		{ id: "u_shape", label: "П Хэлбэр" },
	];

	return (
		<div className="flex w-full flex-row gap-3 px-1 pt-1 pb-4 lg:flex-col lg:pb-0">
			{options.map((option) => {
				const isActive = currentLayout === option.id;
				return (
					<button
						key={option.id}
						type="button"
						onClick={() => onSelect(option.id)}
						className={`group relative flex min-w-45 snap-center flex-col rounded-2xl border-2 p-3 transition-all duration-300 lg:w-full ${
							isActive
								? "z-10 border-primary bg-card shadow-[0_4px_0_0_color-mix(in_oklch,var(--primary)_35%,transparent)]"
								: "border-border bg-card shadow-[0_4px_0_0_var(--border)] hover:-translate-y-0.5 hover:border-primary/50"
						}`}
					>
						{/* Дүрслэл */}
						<div className="h-20 w-full mb-3">
							<MiniRoom type={option.id} isActive={isActive} />
						</div>

						{/* Текст болон Төлөв */}
						<div className="flex items-center justify-between w-full px-1">
							<span
								className={`truncate text-[11px] font-black tracking-widest uppercase ${
									isActive
										? "text-primary"
										: "text-muted-foreground group-hover:text-foreground"
								}`}
							>
								{option.label}
							</span>

							{isActive && (
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
									<span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
								</span>
							)}
						</div>
					</button>
				);
			})}
		</div>
	);
}
