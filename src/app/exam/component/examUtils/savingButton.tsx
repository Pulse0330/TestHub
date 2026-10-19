"use client";

import { Loader2, Save } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";

interface SaveButtonProps {
	/** ⚠️ useRef.size биш useState-с ирэх ёстой — тэгж байж re-render ажиллана */
	pendingCount: number;
	isSaving: boolean;
	isTimeUp: boolean;
	onSave: () => void;
	variant?: "mobile" | "desktop";
}

const SaveButton = memo(function SaveButton({
	pendingCount,
	isSaving,
	isTimeUp,
	onSave,
	variant = "desktop",
}: SaveButtonProps) {
	if (pendingCount === 0 || isTimeUp) return null;

	if (variant === "mobile") {
		return (
			<Button
				onClick={onSave}
				disabled={isSaving}
				variant="success"
				className="h-11 flex-1 text-sm"
			>
				{isSaving ? (
					<>
						<Loader2 className="size-4 animate-spin" />
						Хадгалж байна
					</>
				) : (
					<>
						<Save className="size-4" />
						Хадгалах ({pendingCount})
					</>
				)}
			</Button>
		);
	}

	return (
		<div className="fixed right-6 bottom-6 z-50 hidden lg:block">
			<Button
				onClick={onSave}
				disabled={isSaving}
				variant="success"
				className="animate-pop-in"
				size="lg"
			>
				{isSaving ? (
					<>
						<Loader2 className="size-4 animate-spin" />
						Хадгалж байна...
					</>
				) : (
					<>
						<Save className="size-4" />
						Хадгалах ({pendingCount})
					</>
				)}
			</Button>
		</div>
	);
});

export default SaveButton;
