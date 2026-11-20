"use client";

import { useQuery } from "@tanstack/react-query";
import { Film, Link2, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Field } from "@/features/teacher/components";
import {
	itemOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import {
	extOf,
	isAllowedRecordingUrl,
	type LiveContent,
	type LiveContentItem,
	liveKeys,
	uploadFile,
	VIDEO_EXT,
	youtubeId,
} from "./shared";

/** Хадгалсан бичлэг — засах + бүхэлд нь хадгалах. */
export function RecordingTab({ liveId }: { liveId: number }) {
	const { userId } = useTeacher();
	const fileRef = useRef<HTMLInputElement>(null);
	const switchId = useId();
	const [descr, setDescr] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [items, setItems] = useState<LiveContentItem[]>([]);
	const [url, setUrl] = useState("");
	const [urlError, setUrlError] = useState<string>();
	const [uploading, setUploading] = useState(false);

	const res = useQuery({
		queryKey: liveKeys.content(liveId),
		queryFn: () => teacherApi.live.content({ live_id: liveId }),
	});

	useEffect(() => {
		const c = itemOf<LiveContent>(res.data);
		setDescr(c?.descr ?? "");
		setIsOpen(c?.is_open === true || Number(c?.is_open) === 1);
		setItems(Array.isArray(c?.items) ? c.items : []);
	}, [res.data]);

	const save = useTeacherMutation(
		() =>
			teacherApi.live.saveContent({
				user_id: userId,
				live_id: liveId,
				descr: descr.trim(),
				is_open: isOpen,
				items: items.map(({ kind, url }) => ({ kind, url })),
			}),
		{
			success: "Бичлэг хадгалагдлаа",
			invalidate: [liveKeys.content(liveId), liveKeys.all],
		},
	);

	const addUrl = () => {
		const v = url.trim();
		if (!isAllowedRecordingUrl(v)) {
			setUrlError("Зөвхөн YouTube эсвэл cdn.esis.edu.mn холбоос");
			return;
		}
		setItems((xs) => [
			...xs,
			{ kind: "url", url: v, embed_id: youtubeId(v) ?? undefined },
		]);
		setUrl("");
		setUrlError(undefined);
	};

	const onFile = async (file?: File) => {
		if (!file) return;
		if (!VIDEO_EXT.includes(extOf(file.name))) {
			toast.error("Зөвхөн mp4, webm, mov видео файл");
			return;
		}
		setUploading(true);
		try {
			const up = await uploadFile(file);
			setItems((xs) => [
				...xs,
				{ kind: "file", url: up.url, filename: up.name },
			]);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Алдаа гарлаа");
		} finally {
			setUploading(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	};

	if (res.isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-20 rounded-xl" />
				<Skeleton className="h-40 rounded-xl" />
			</div>
		);
	}

	return (
		<div className="grid gap-4">
			<Field label="Тайлбар">
				<Textarea
					value={descr}
					rows={2}
					onChange={(e) => setDescr(e.target.value)}
				/>
			</Field>
			<div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3">
				<label htmlFor={switchId} className="text-sm font-bold">
					Бичлэгийг суралцагчдад нээх
				</label>
				<Switch id={switchId} checked={isOpen} onCheckedChange={setIsOpen} />
			</div>

			<div className="grid gap-2">
				<Field
					label="Бичлэгийн холбоос"
					hint="YouTube эсвэл cdn.esis.edu.mn"
					error={urlError}
				>
					<div className="flex gap-2">
						<Input
							value={url}
							placeholder="https://youtu.be/..."
							onChange={(e) => setUrl(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addUrl();
								}
							}}
						/>
						<Button
							type="button"
							variant="outline"
							onClick={addUrl}
							disabled={!url.trim()}
						>
							<Plus />
							Нэмэх
						</Button>
					</div>
				</Field>
				<input
					ref={fileRef}
					type="file"
					accept=".mp4,.webm,.mov,video/*"
					className="sr-only"
					tabIndex={-1}
					aria-hidden
					onChange={(e) => onFile(e.target.files?.[0])}
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-fit"
					disabled={uploading}
					onClick={() => fileRef.current?.click()}
				>
					{uploading ? <Loader2 className="animate-spin" /> : <Upload />}
					Видео файл байршуулах
				</Button>
			</div>

			{items.length === 0 ? (
				<EmptyState text="Бичлэг нэмээгүй байна" />
			) : (
				<ul className="grid gap-3">
					{items.map((it, i) => (
						<li
							key={`${it.url}-${i}`}
							className="overflow-hidden rounded-2xl border border-border"
						>
							<RecordingPreview item={it} />
							<div className="flex items-center gap-2 p-2.5">
								{it.kind === "file" ? (
									<Film className="size-4 shrink-0 text-muted-foreground" />
								) : (
									<Link2 className="size-4 shrink-0 text-muted-foreground" />
								)}
								<a
									href={it.url}
									target="_blank"
									rel="noreferrer noopener"
									className="min-w-0 flex-1 truncate text-sm font-semibold text-primary hover:underline"
								>
									{it.filename || it.url}
								</a>
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									aria-label="Бичлэг хасах"
									className="text-muted-foreground hover:text-destructive"
									onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}
								>
									<Trash2 />
								</Button>
							</div>
						</li>
					))}
				</ul>
			)}

			<div className="flex justify-end border-t border-border pt-4">
				<Button
					onClick={() => save.mutate(undefined)}
					disabled={save.isPending}
				>
					{save.isPending && <Loader2 className="animate-spin" />}
					Хадгалах
				</Button>
			</div>
		</div>
	);
}

function RecordingPreview({ item }: { item: LiveContentItem }) {
	const yt = item.embed_id || youtubeId(item.url);
	if (yt) {
		return (
			<iframe
				src={`https://www.youtube-nocookie.com/embed/${yt}`}
				title="YouTube бичлэг"
				className="aspect-video w-full bg-muted"
				allow="accelerometer; encrypted-media; picture-in-picture"
				allowFullScreen
			/>
		);
	}
	if (item.kind === "file" || /\.(mp4|webm|mov)(\?|$)/i.test(item.url)) {
		return (
			// biome-ignore lint/a11y/useMediaCaption: хичээлийн бичлэг
			<video
				src={item.url}
				controls
				preload="metadata"
				className="aspect-video w-full bg-muted"
			/>
		);
	}
	return null;
}
