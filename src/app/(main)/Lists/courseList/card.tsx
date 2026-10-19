"use client";

import { motion } from "framer-motion";
import {
	ArrowRight,
	BookOpen,
	Loader2,
	PlayCircle,
	Sparkles,
	User,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CourseContent } from "@/types/course/courseList";

// import { toast } from "sonner"; // Uncomment if using sonner

interface CourseCardProps {
	course: CourseContent;
	index?: number;
	/** "grid" = tile card (default), "row" = library list row */
	variant?: "grid" | "row";
}

const ROW_TINTS = [
	"bg-pop-pink-soft text-pop-pink-ink",
	"bg-pop-violet-soft text-pop-violet-ink",
	"bg-pop-sky-soft text-pop-sky-ink",
	"bg-pop-mint-soft text-pop-mint-ink",
	"bg-pop-sun-soft text-pop-sun-ink",
	"bg-pop-coral-soft text-pop-coral-ink",
];

export const CourseCard = ({
	course,
	index = 0,
	variant = "grid",
}: CourseCardProps) => {
	const router = useRouter();
	const isPaid = course.ispay === 1;

	// Loading state
	const [isNavigating, setIsNavigating] = useState(false);

	// Ripple effect state
	const [ripple, setRipple] = useState({ x: 0, y: 0, show: false });

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		// Ripple effect
		const rect = e.currentTarget.getBoundingClientRect();
		setRipple({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
			show: true,
		});

		// Set loading state
		setIsNavigating(true);

		// Optional: Show toast notification
		// toast.loading(`${course.course_name} хичээл нээж байна...`, {
		// 	id: `course-${course.content_id}`
		// });

		// Navigate with slight delay for animation
		setTimeout(() => {
			router.push(`/course/${course.content_id}`);
		}, 300);
	};

	if (variant === "row") {
		const tint = ROW_TINTS[index % ROW_TINTS.length];
		return (
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
			>
				<button
					type="button"
					onClick={handleClick}
					disabled={isNavigating}
					aria-label={`${course.course_name} хичээл нээх`}
					className="group relative flex w-full items-center gap-3 sm:gap-4 overflow-hidden rounded-2xl border-2 border-border bg-card p-2.5 sm:p-3 text-left shadow-[0_3px_0_0_var(--border)] transition-all duration-200 hover:-translate-y-0.5 hover:border-pop-pink/60 hover:shadow-[0_5px_0_0_color-mix(in_oklch,var(--pop-pink)_40%,transparent)] active:translate-y-0.5 active:shadow-[0_1px_0_0_var(--border)] disabled:cursor-wait disabled:opacity-70"
				>
					{/* Ripple Effect */}
					{ripple.show && (
						<motion.span
							initial={{ scale: 0, opacity: 1 }}
							animate={{ scale: 4, opacity: 0 }}
							transition={{ duration: 0.6 }}
							onAnimationComplete={() => setRipple({ ...ripple, show: false })}
							className="absolute bg-pop-pink/25 rounded-full pointer-events-none z-50"
							style={{
								left: ripple.x - 10,
								top: ripple.y - 10,
								width: 20,
								height: 20,
							}}
						/>
					)}

					{/* Thumbnail */}
					<div
						className={cn(
							"relative aspect-4/3 w-20 sm:w-32 shrink-0 overflow-hidden rounded-xl",
							tint,
						)}
					>
						{course.filename ? (
							<Image
								src={course.filename}
								alt={course.course_name}
								fill
								className="object-cover transition-transform duration-500 group-hover:scale-105"
								sizes="128px"
								quality={80}
								priority={index < 6}
							/>
						) : (
							<div className="absolute inset-0 flex items-center justify-center">
								<Sparkles className="size-7" strokeWidth={2.25} />
							</div>
						)}
					</div>

					{/* Title + meta */}
					<div className="min-w-0 flex-1 space-y-1.5">
						<h3
							className="line-clamp-2 text-sm sm:text-base font-extrabold leading-snug text-foreground group-hover:text-pop-pink-ink transition-colors"
							title={course.course_name}
						>
							{course.course_name}
						</h3>
						<div className="flex flex-wrap items-center gap-1.5">
							<span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] sm:text-xs font-bold text-muted-foreground">
								<User className="size-3 shrink-0" strokeWidth={2.5} />
								<span className="truncate">{course.teach_name}</span>
							</span>
							<span className="inline-flex items-center gap-1 rounded-full bg-pop-pink-soft px-2 py-0.5 text-[11px] sm:text-xs font-bold text-pop-pink-ink">
								<BookOpen className="size-3 shrink-0" strokeWidth={2.5} />
								{course.contentcnt}
							</span>
							{isPaid && (
								<Badge
									variant="mint"
									className="px-2 py-0 text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap"
								>
									Төлбөр төлсөн
								</Badge>
							)}
						</div>
					</div>

					{/* CTA */}
					<span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground shadow-[0_3px_0_0_var(--primary-shade)] transition-transform group-hover:-translate-y-0.5">
						{isNavigating ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<PlayCircle className="size-4" strokeWidth={2.5} />
						)}
						Үзэх
					</span>
					<span className="sm:hidden flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--primary-shade)]">
						{isNavigating ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<ArrowRight className="size-4" strokeWidth={2.75} />
						)}
						<span className="sr-only">Үзэх</span>
					</span>
				</button>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: index * 0.05 }}
			className="h-full"
		>
			<motion.button
				type="button"
				onClick={handleClick}
				disabled={isNavigating}
				aria-label={`${course.course_name} хичээл нээх`}
				whileHover={{ y: -4 }}
				whileTap={{ y: 1 }}
				className="group card-pop h-full w-full relative flex flex-col rounded-3xl cursor-pointer transition-[border-color,box-shadow] duration-200 hover:border-pop-pink hover:shadow-[0_6px_0_0_color-mix(in_oklch,var(--pop-pink)_45%,transparent)] overflow-hidden text-left disabled:opacity-70 disabled:cursor-wait"
			>
				{/* Ripple Effect */}
				{ripple.show && (
					<motion.span
						initial={{ scale: 0, opacity: 1 }}
						animate={{ scale: 4, opacity: 0 }}
						transition={{ duration: 0.6 }}
						onAnimationComplete={() => setRipple({ ...ripple, show: false })}
						className="absolute bg-pop-pink/25 rounded-full pointer-events-none z-50"
						style={{
							left: ripple.x - 10,
							top: ripple.y - 10,
							width: 20,
							height: 20,
						}}
					/>
				)}

				{/* Loading Overlay */}
				{isNavigating && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="absolute inset-0 bg-card/90 z-50 flex flex-col items-center justify-center gap-3"
					>
						<Loader2 className="size-8 sm:size-10 text-pop-pink animate-spin" />
						<span className="text-xs sm:text-sm font-bold text-foreground">
							Хичээл нээж байна...
						</span>
					</motion.div>
				)}

				{/* Image Header - Fixed aspect ratio */}
				<div className="relative m-2 mb-0 aspect-5/2 overflow-hidden rounded-2xl bg-pop-pink-soft shrink-0">
					{course.filename ? (
						<Image
							src={course.filename}
							alt={course.course_name}
							fill
							className="object-cover transition-transform duration-700 group-hover:scale-105"
							sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
							quality={90}
							priority={index < 6}
						/>
					) : (
						<div className="absolute inset-0 bg-gradient-to-br from-pop-pink-soft to-pop-violet-soft flex items-center justify-center">
							<Sparkles
								className="size-8 sm:size-10 md:size-12 text-pop-pink-ink/60"
								strokeWidth={2.25}
							/>
						</div>
					)}

					{/* Gradient Overlay */}
					<div className="absolute inset-0" />

					{/* Status Badge on image - Responsive */}
					<div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
						{isPaid ? (
							<Badge
								variant="mint"
								className="px-1.5 sm:px-2 py-0 text-[8px] sm:text-[9px] md:text-[10px] font-extrabold whitespace-nowrap"
							>
								Төлбөр төлсөн
							</Badge>
						) : (
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ delay: 0.2 }}
							>
								{/* Uncomment if you want to show price */}
								{/* <Badge className="border-0 px-1 sm:px-1.5 md:px-2 py-0 text-[7px] sm:text-[8px] md:text-[9px] shadow-lg whitespace-nowrap bg-orange-500">
									{course.amount.toLocaleString()}₮
								</Badge> */}
							</motion.div>
						)}
					</div>
				</div>

				{/* Content Section - Responsive padding */}
				<div className="p-2.5 sm:p-3 pb-11 sm:pb-12 flex flex-col flex-1 gap-2 min-h-0">
					{/* Title Section - Responsive */}
					<div className="flex-1 min-h-0 overflow-hidden">
						<h3
							className="text-xs sm:text-sm md:text-base font-extrabold text-foreground leading-tight whitespace-normal break-words group-hover:text-pop-pink-ink transition-colors duration-200"
							title={course.course_name}
						>
							{course.course_name}
						</h3>
					</div>

					{/* Stats Grid - Responsive */}
					<div className="flex flex-wrap items-center gap-1 sm:gap-1.5 shrink-0 min-w-0">
						<div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground min-w-0 max-w-full">
							<User className="size-3 shrink-0" strokeWidth={2.5} />
							<span className="font-bold text-[9px] sm:text-[10px] md:text-xs truncate">
								{course.teach_name}
							</span>
						</div>
						<div className="flex items-center gap-1 rounded-full bg-pop-pink-soft px-2 py-0.5 text-pop-pink-ink shrink-0">
							<BookOpen className="size-3 shrink-0" strokeWidth={2.5} />
							<span className="font-bold text-[9px] sm:text-[10px] md:text-xs whitespace-nowrap">
								{course.contentcnt}
							</span>
						</div>
					</div>

					{/* Action Button - Responsive with enhanced animation */}
					<motion.div
						className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 size-7 sm:size-8 rounded-xl bg-pop-pink-soft flex items-center justify-center group-hover:bg-pop-pink transition-colors duration-200"
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.95 }}
					>
						<ArrowRight
							className="size-3.5 sm:size-4 text-pop-pink-ink group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all"
							strokeWidth={2.75}
						/>
					</motion.div>
				</div>
			</motion.button>
		</motion.div>
	);
};
