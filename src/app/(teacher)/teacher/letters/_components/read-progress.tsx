/** Уншсан / нийт — нимгэн progress. */
export function ReadProgress({ read, total }: { read: number; total: number }) {
	if (!total)
		return (
			<span className="text-xs font-semibold text-muted-foreground">—</span>
		);
	const pct = Math.min(100, Math.round((read / total) * 100));
	return (
		<div className="grid gap-1">
			<span className="text-xs font-bold text-muted-foreground tabular-nums">
				<span className="text-foreground">{read}</span>/{total} · {pct}%
			</span>
			<div
				className="h-1.5 overflow-hidden rounded-full bg-muted"
				role="progressbar"
				aria-valuenow={pct}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label="Уншсан хувь"
			>
				<div
					className="h-full rounded-full bg-primary-soft-shade"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}
