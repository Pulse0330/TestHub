import { AlertCircle } from "lucide-react";

export function UpdateErrorBanner({ message }: { message: string }) {
	return (
		<div className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4">
			<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive text-white">
				<AlertCircle className="size-5" strokeWidth={2.5} />
			</span>
			<div>
				<p className="text-sm font-black text-destructive">Алдаа гарлаа</p>
				<p className="mt-1 text-xs font-semibold text-destructive">{message}</p>
			</div>
		</div>
	);
}
