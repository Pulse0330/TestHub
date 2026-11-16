import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileToast({ onClose }: { onClose: () => void }) {
	return (
		<div className="fixed right-4 top-6 z-50 animate-in fade-in slide-in-from-top-5 duration-500 sm:right-6">
			<div className="flex min-w-[280px] items-center gap-3 rounded-2xl border-2 border-success bg-success px-5 py-3 text-white shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_65%,black)]">
				<span className="flex size-9 items-center justify-center rounded-xl bg-white/20">
					<CheckCircle2 className="size-5" strokeWidth={2.5} />
				</span>
				<div className="flex-1">
					<p className="text-sm font-black">Амжилттай!</p>
					<p className="text-xs font-semibold opacity-90">
						Мэдээлэл шинэчлэгдлээ
					</p>
				</div>
				<Button
					onClick={onClose}
					variant="ghost"
					size="icon"
					className="size-7 text-white hover:bg-white/20 hover:text-white"
				>
					<X className="size-4" />
				</Button>
			</div>
		</div>
	);
}
