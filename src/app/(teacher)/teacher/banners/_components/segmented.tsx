"use client";

import { cn } from "@/lib/utils";

/** Цөөн сонголттой товчлуурын бүлэг (radio). */
export function Segmented<T extends number | string>({
	options,
	value,
	onChange,
}: {
	options: { value: T; label: string }[];
	value: T;
	onChange: (v: T) => void;
}) {
	return (
		<div className="flex flex-wrap gap-1.5">
			{options.map((o) => {
				const active = o.value === value;
				return (
					<button
						key={String(o.value)}
						type="button"
						aria-pressed={active}
						onClick={() => onChange(o.value)}
						className={cn(
							"rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition-colors",
							active
								? "border-primary-soft-shade bg-primary-soft text-primary-soft-foreground"
								: "border-border text-muted-foreground hover:text-foreground",
						)}
					>
						{o.label}
					</button>
				);
			})}
		</div>
	);
}
