"use client";

import type * as React from "react";
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

/** Устгахаас бусад баталгаажуулах үйлдэл (жишээ: цахим хичээл болгох). */
export function ConfirmAction({
	trigger,
	title,
	description,
	confirmLabel = "Тийм",
	onConfirm,
	pending,
}: {
	trigger: React.ReactNode;
	title: string;
	description?: string;
	confirmLabel?: string;
	onConfirm: () => void;
	pending?: boolean;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>
						{description ?? "Үйлдлийг баталгаажуулна уу."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Болих</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={pending}>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
