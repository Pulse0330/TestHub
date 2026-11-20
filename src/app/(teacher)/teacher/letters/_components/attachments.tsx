"use client";

import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fileExt, formatSize, uploadFile } from "../_lib/shared";

export interface LetterFileInput {
	filename: string;
	uploaded: string;
	file_ext: string;
	file_size: number;
}

/** Хавсралт — upload хийгээд бүтэн URL-ийг `filename`-д хадгална. */
export function Attachments({
	files,
	onChange,
}: {
	files: LetterFileInput[];
	onChange: (f: LetterFileInput[]) => void;
}) {
	const inputId = useId();
	const ref = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState(0);

	const onPick = async (list: FileList | null) => {
		if (!list?.length) return;
		const picked = Array.from(list);
		setBusy(picked.length);
		const added: LetterFileInput[] = [];
		for (const f of picked) {
			try {
				const res = await uploadFile(f);
				added.push({
					filename: res.file.url,
					uploaded: f.name,
					file_ext: fileExt(f.name),
					file_size: f.size,
				});
			} catch (e) {
				toast.error(`${f.name}: ${(e as Error).message}`);
			} finally {
				setBusy((n) => n - 1);
			}
		}
		onChange([...files, ...added]);
		if (ref.current) ref.current.value = "";
	};

	return (
		<div className="grid gap-2">
			<input
				id={inputId}
				ref={ref}
				type="file"
				multiple
				className="sr-only"
				onChange={(e) => onPick(e.target.files)}
			/>
			<div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={busy > 0}
					onClick={() => ref.current?.click()}
				>
					{busy > 0 ? <Loader2 className="animate-spin" /> : <Paperclip />}
					{busy > 0 ? "Илгээж байна..." : "Файл хавсаргах"}
				</Button>
			</div>
			{files.length > 0 && (
				<ul className="grid gap-1.5 sm:grid-cols-2">
					{files.map((f, i) => (
						<li
							key={`${f.filename}-${i}`}
							className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2"
						>
							<FileText className="size-4 shrink-0 text-muted-foreground" />
							<a
								href={f.filename}
								target="_blank"
								rel="noreferrer"
								className="min-w-0 flex-1 truncate text-sm font-bold hover:underline"
							>
								{f.uploaded || f.filename.split("/").pop()}
							</a>
							<span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
								{formatSize(f.file_size)}
							</span>
							<button
								type="button"
								aria-label="Хавсралт хасах"
								onClick={() => onChange(files.filter((_, j) => j !== i))}
								className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
							>
								<X className="size-3.5" />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
