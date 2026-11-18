"use client";

import { Code2, Eye } from "lucide-react";
import { useState } from "react";
import MathContent from "@/components/MathContent";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** HTML бичвэр — textarea + урьдчилж харах (rich-text сангүй). */
export function HtmlEditor({
	id,
	value,
	onChange,
	placeholder,
}: {
	id?: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
}) {
	const [mode, setMode] = useState<"edit" | "preview">("edit");
	const tab = (m: "edit" | "preview", label: string, Icon: typeof Eye) => (
		<button
			type="button"
			role="tab"
			aria-selected={mode === m}
			onClick={() => setMode(m)}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-extrabold transition-colors",
				mode === m
					? "bg-primary-soft text-primary-soft-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			<Icon className="size-3.5" />
			{label}
		</button>
	);
	return (
		<div className="overflow-hidden rounded-2xl border-2 border-input bg-card">
			<div
				role="tablist"
				aria-label="Засах горим"
				className="flex items-center gap-1 border-b border-border bg-muted/40 p-1"
			>
				{tab("edit", "HTML", Code2)}
				{tab("preview", "Харах", Eye)}
				<span className="ml-auto hidden pr-2 text-[11px] font-semibold text-muted-foreground sm:inline">
					&lt;p&gt;, &lt;b&gt;, &lt;ul&gt;, &lt;a&gt; ... ашиглаж болно
				</span>
			</div>
			{mode === "edit" ? (
				<Textarea
					id={id}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="min-h-64 rounded-none border-0 font-mono text-[13px] shadow-none focus-visible:ring-0"
				/>
			) : (
				<div className="min-h-64 p-4">
					{value.trim() ? (
						<MathContent
							html={value}
							className="prose-sm max-w-none text-sm leading-relaxed"
						/>
					) : (
						<p className="text-sm font-semibold text-muted-foreground">
							Агуулга хоосон байна
						</p>
					)}
				</div>
			)}
		</div>
	);
}
