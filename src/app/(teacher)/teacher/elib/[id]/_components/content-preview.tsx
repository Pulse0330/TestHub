"use client";

import { CalendarClock, ExternalLink, House } from "lucide-react";
import MathContent from "@/components/MathContent";
import { EmptyState, StatusPill } from "@/features/teacher/components";
import {
	extOf,
	isOfficeExt,
	KIND_META,
	youtubeId,
} from "../../_components/shared";
import type { EditItem } from "./items";
import { TestSummary } from "./test-summary";

/** Сурагчид харагдах байдлаар контентыг харуулна. */
export function ContentPreview({ items }: { items: EditItem[] }) {
	if (items.length === 0) return <EmptyState text="Контент алга" />;
	return (
		<ol className="grid gap-4">
			{items.map((it, i) => {
				const { icon: Icon, label } = KIND_META[it.kind];
				return (
					<li
						key={it.key}
						className="overflow-hidden rounded-3xl border border-border bg-card"
					>
						<header className="flex flex-wrap items-center gap-2 px-4 pt-4">
							<span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft/60 text-primary-soft-foreground">
								<Icon className="size-4" />
							</span>
							<h3 className="min-w-0 flex-1 text-base font-black tracking-tight">
								<span className="tabular-nums text-muted-foreground">
									{i + 1}.
								</span>{" "}
								{it.title || label}
							</h3>
							{it.is_homework && (
								<StatusPill tone="sun">
									<House className="mr-1 size-3" />
									Гэрийн даалгавар
								</StatusPill>
							)}
							{it.is_date && it.exam_edate && (
								<StatusPill tone="sky">
									<CalendarClock className="mr-1 size-3" />
									{it.exam_edate.replace("T", " ")} хүртэл
								</StatusPill>
							)}
						</header>
						{it.descr && (
							<p className="px-4 pt-1 text-sm font-medium text-muted-foreground">
								{it.descr}
							</p>
						)}
						<div className="p-4">
							<Body item={it} />
						</div>
					</li>
				);
			})}
		</ol>
	);
}

const frame = "w-full rounded-2xl border border-border bg-muted";

function Body({ item }: { item: EditItem }) {
	const url = item.url.trim();
	switch (item.kind) {
		case "text":
			return item.text ? (
				<MathContent html={item.text} className="prose-sm max-w-none" />
			) : (
				<Missing />
			);
		case "youtube": {
			const id = youtubeId(url);
			return id ? (
				<iframe
					src={`https://www.youtube-nocookie.com/embed/${id}`}
					title={item.title || "YouTube"}
					className={`${frame} aspect-video`}
					allow="accelerometer; encrypted-media; picture-in-picture"
					allowFullScreen
				/>
			) : (
				<Missing />
			);
		}
		case "image":
			return url ? (
				// biome-ignore lint/performance/noImgElement: байршуулсан зураг
				<img
					src={url}
					alt={item.title}
					className="max-h-[480px] w-auto max-w-full rounded-2xl border border-border"
				/>
			) : (
				<Missing />
			);
		case "video":
			return url ? (
				// biome-ignore lint/a11y/useMediaCaption: хичээлийн видео
				<video
					src={url}
					controls
					preload="metadata"
					className={`${frame} aspect-video`}
				/>
			) : (
				<Missing />
			);
		case "audio":
			return url ? (
				// biome-ignore lint/a11y/useMediaCaption: хичээлийн аудио
				<audio src={url} controls className="w-full" />
			) : (
				<Missing />
			);
		case "document": {
			if (!url) return <Missing />;
			const ext = extOf(item.filename || url);
			const src = isOfficeExt(ext)
				? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
				: url;
			return <Frame src={src} title={item.title} open={url} />;
		}
		case "link":
		case "gdoc":
			return url ? (
				<Frame src={url} title={item.title} open={url} />
			) : (
				<Missing />
			);
		case "test":
		case "soril":
			return item.my_test_id ? (
				<TestSummary testId={item.my_test_id} />
			) : (
				<Missing />
			);
		default:
			return null;
	}
}

function Frame({
	src,
	title,
	open,
}: {
	src: string;
	title: string;
	open: string;
}) {
	return (
		<div className="grid gap-2">
			<iframe
				src={src}
				title={title || "Контент"}
				className={`${frame} h-[60vh] min-h-80`}
				sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
			/>
			<a
				href={open}
				target="_blank"
				rel="noreferrer noopener"
				className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-primary hover:underline"
			>
				<ExternalLink className="size-4" />
				Шинэ цонхонд нээх
			</a>
		</div>
	);
}

function Missing() {
	return (
		<p className="rounded-2xl bg-muted/50 px-4 py-6 text-center text-sm font-semibold text-muted-foreground">
			Контент бүрэн оруулаагүй байна
		</p>
	);
}
