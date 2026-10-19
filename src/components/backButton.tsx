"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface StyledBackButtonProps {
	className?: string;
	onClick?: () => void;
	confirmTitle?: string;
	confirmMessage?: string;
	showConfirm?: boolean;
	/** Буцах товчны загвар - 'default' эсвэл 'ghost' */
	variant?: "default" | "ghost";
	/** Арилга харуулах эсэх */
	showIcon?: boolean;
	/** Aria label */
	ariaLabel?: string;
}

export default function StyledBackButton({
	className = "",
	onClick,
	confirmTitle = "Буцах уу?",
	confirmMessage = "Хадгалаагүй өөрчлөлтүүд алга болно.",
	showConfirm = false,
	variant = "default",
	showIcon = true,
	ariaLabel = "Буцах",
}: StyledBackButtonProps): ReactElement {
	const router = useRouter();
	const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

	const handleClick = (): void => {
		if (showConfirm) {
			setIsDialogOpen(true);
		} else {
			handleConfirm();
		}
	};

	const handleConfirm = (): void => {
		setIsDialogOpen(false);
		if (onClick) {
			onClick();
		} else {
			// Өмнөх хуудас руу шилжих
			router.back();
		}
	};

	// Variant-ээс хамааран default style
	const defaultStyles =
		variant === "ghost"
			? "bg-transparent hover:bg-muted"
			: "bg-card hover:bg-muted";

	return (
		<>
			<button
				type="button"
				onClick={handleClick}
				className={cn(
					"group inline-flex cursor-pointer items-center gap-2 rounded-xl p-0 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
					variant === "default" && defaultStyles,
					className,
				)}
				aria-label={ariaLabel}
			>
				{variant === "default" ? (
					<div
						className={cn(
							"flex size-9 items-center justify-center rounded-xl border-2 border-border text-foreground shadow-[0_3px_0_0_var(--border)] transition-all duration-300 group-hover:-translate-y-0.5 group-active:translate-y-0.5 group-active:shadow-none",
							defaultStyles,
						)}
					>
						{showIcon && (
							<ArrowLeft className="size-4 transition-all duration-300 group-hover:-translate-x-0.5" strokeWidth={2.5} />
						)}
					</div>
				) : (
					showIcon && (
						<ArrowLeft
							className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5"
							aria-hidden="true"
						/>
					)
				)}
			</button>

			<AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<AlertDialogContent className="max-w-sm">
					<AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
						<div className="mb-2 flex size-16 items-center justify-center rounded-3xl bg-pop-sun-soft text-pop-sun-ink">
							<ArrowLeft className="size-7" strokeWidth={2.5} />
						</div>
						<AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
						<AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-2 gap-2 sm:justify-center">
						<AlertDialogCancel className="flex-1">Болих</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirm} className="flex-1">Тийм</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
