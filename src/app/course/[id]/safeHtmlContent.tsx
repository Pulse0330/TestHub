"use client";

import DOMPurify from "dompurify";
import { FileText, PlayCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface SafeHtmlContentProps {
	html: string;
	contentType: number;
}

export function SafeHtmlContent({ html }: SafeHtmlContentProps) {
	const contentRef = useRef<HTMLDivElement>(null);
	const [imgError, setImgError] = useState(false);

	useEffect(() => {
		if (contentRef.current && typeof window !== "undefined") {
			const clean = DOMPurify.sanitize(html, {
				ADD_TAGS: ["iframe"],
				ADD_ATTR: ["allowfullscreen", "frameborder", "src", "class"],
			});
			contentRef.current.innerHTML = clean;
		}
	}, [html]);

	// Хоосон эсвэл тодорхойгүй агуулга
	if (!html || html.trim() === "") {
		return (
			<div className="p-6 bg-muted rounded-2xl border-2 border-dashed border-border">
				<p className="text-muted-foreground text-center text-sm font-bold">
					Агуулга байхгүй байна
				</p>
			</div>
		);
	}

	const trimmedHtml = html.trim();
	const isDirectUrl = !trimmedHtml.includes("<") && !trimmedHtml.includes(">");

	// Шууд URL бол
	if (isDirectUrl) {
		// YouTube video ID шалгах (11 тэмдэгт)
		const isYouTubeId = /^[a-zA-Z0-9_-]{11}$/.test(trimmedHtml);

		if (isYouTubeId) {
			return (
				<div className="space-y-2">
					<div className="bg-black rounded-2xl overflow-hidden border-2 border-border shadow-[0_4px_0_0_var(--border)] max-w-2xl mx-auto">
						<div
							className="relative w-full bg-black"
							style={{ paddingBottom: "56.25%" }}
						>
							<iframe
								src={`https://www.youtube.com/embed/${trimmedHtml}?rel=0&modestbranding=1`}
								className="absolute top-0 left-0 w-full h-full max-h-[360px]"
								title="YouTube Video"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
							/>
						</div>
					</div>
				</div>
			);
		}

		// YouTube бүтэн URL шалгах
		const youtubeMatch = trimmedHtml.match(
			/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
		);
		if (youtubeMatch) {
			const videoId = youtubeMatch[1];
			return (
				<div className="space-y-2">
					<div className="bg-black rounded-2xl overflow-hidden border-2 border-border shadow-[0_4px_0_0_var(--border)] max-w-2xl mx-auto">
						<div
							className="relative w-full bg-black"
							style={{ paddingBottom: "56.25%" }}
						>
							<iframe
								src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
								className="absolute top-0 left-0 w-full h-full max-h-[360px]"
								title="YouTube Video"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
							/>
						</div>
					</div>
				</div>
			);
		}

		const fileExtension = trimmedHtml.split(".").pop()?.toLowerCase();

		// Зургийн файлууд
		if (
			["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(
				fileExtension || "",
			)
		) {
			return (
				<div className="space-y-2">
					<div className="relative w-full max-h-[350px] overflow-hidden rounded-2xl border-2 border-border bg-muted">
						<Image
							src={imgError ? "/placeholder-image.png" : trimmedHtml}
							alt="Хичээлийн зураг"
							width={800}
							height={350}
							className="w-full h-auto object-contain max-h-[350px]"
							onError={() => setImgError(true)}
							unoptimized
						/>
					</div>
				</div>
			);
		}

		// Аудио файлууд
		if (
			["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(fileExtension || "")
		) {
			return (
				<div className="space-y-2">
					<div className="bg-pop-violet-soft rounded-2xl p-4 border-2 border-pop-violet/30">
						<div className="flex items-center gap-2 mb-3">
							<PlayCircle className="h-5 w-5 text-pop-violet-ink" />
							<div>
								<p className="font-extrabold text-sm text-pop-violet-ink">
									Аудио хичээл
								</p>
							</div>
						</div>
						{/* biome-ignore lint/a11y/useMediaCaption: Educational content */}
						<audio controls className="w-full h-10" src={trimmedHtml}>
							Таны browser audio дэмжихгүй байна.
						</audio>
					</div>
				</div>
			);
		}

		// Видео файлууд
		if (["mp4", "webm", "ogv", "mov", "avi"].includes(fileExtension || "")) {
			return (
				<div className="space-y-2">
					<div className="bg-black rounded-2xl overflow-hidden border-2 border-border max-h-[400px]">
						{/* biome-ignore lint/a11y/useMediaCaption: Educational content */}
						<video controls className="w-full" src={trimmedHtml}>
							Таны browser видео дэмжихгүй байна.
						</video>
					</div>
				</div>
			);
		}

		// PDF файлууд
		if (fileExtension === "pdf") {
			return (
				<div className="space-y-2">
					<iframe
						src={trimmedHtml}
						className="w-full h-[400px] rounded-2xl border-2 border-border"
						title="PDF Document"
					/>
					<Button
						variant="outline"
						size="sm"
						className="w-full"
						onClick={() => window.open(trimmedHtml, "_blank")}
					>
						<FileText className="mr-2 h-3 w-3" />
						PDF-ийг шинэ цонхонд нээх
					</Button>
				</div>
			);
		}

		// PowerPoint файлууд
		if (["ppt", "pptx"].includes(fileExtension || "")) {
			return (
				<div className="space-y-2">
					<div className="bg-card rounded-2xl overflow-hidden border-2 border-border">
						<div className="flex items-center gap-2 px-3 py-2.5 bg-pop-coral-soft border-b-2 border-border">
							<FileText className="h-4 w-4 text-pop-coral-ink" />
							<p className="font-extrabold text-sm text-pop-coral-ink">
								PowerPoint танилцуулга
							</p>
						</div>
						<iframe
							src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(trimmedHtml)}`}
							className="w-full h-[400px]"
							title="PowerPoint Presentation"
						/>
					</div>
				</div>
			);
		}

		// Excel файлууд
		if (["xls", "xlsx"].includes(fileExtension || "")) {
			return (
				<div className="space-y-2">
					<div className="bg-card rounded-2xl overflow-hidden border-2 border-border">
						<div className="flex items-center gap-2 px-3 py-2.5 bg-pop-mint-soft border-b-2 border-border">
							<FileText className="h-4 w-4 text-pop-mint-ink" />
							<p className="font-extrabold text-sm text-pop-mint-ink">
								Excel хүснэгт
							</p>
						</div>
						<iframe
							src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(trimmedHtml)}`}
							className="w-full h-[400px]"
							title="Excel Spreadsheet"
						/>
					</div>
				</div>
			);
		}

		// Word файлууд
		if (["doc", "docx"].includes(fileExtension || "")) {
			return (
				<div className="space-y-2">
					<div className="bg-card rounded-2xl overflow-hidden border-2 border-border">
						<div className="flex items-center gap-2 px-3 py-2.5 bg-pop-sky-soft border-b-2 border-border">
							<FileText className="h-4 w-4 text-pop-sky-ink" />
							<p className="font-extrabold text-sm text-pop-sky-ink">Word документ</p>
						</div>
						<iframe
							src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(trimmedHtml)}`}
							className="w-full h-[400px]"
							title="Word Document"
						/>
					</div>
				</div>
			);
		}

		// Бусад файлууд
		return (
			<div className="space-y-2">
				<div className="p-4 bg-muted rounded-2xl border-2 border-border">
					<div className="flex items-center gap-3">
						<FileText className="h-5 w-5 text-pop-violet-ink" />
						<div>
							<p className="font-extrabold text-sm">Файл</p>
							<p className="text-xs font-semibold text-muted-foreground">Файлыг татаж харна уу</p>
						</div>
					</div>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="w-full"
					onClick={() => window.open(trimmedHtml, "_blank")}
				>
					<FileText className="mr-2 h-3 w-3" />
					Татаж авах / Үзэх
				</Button>
			</div>
		);
	}

	// HTML агуулга (iframe, embed код гэх мэт)
	return (
		<div
			ref={contentRef}
			className="prose prose-sm md:prose-base max-w-none dark:prose-invert text-foreground leading-relaxed
				text-[15px] md:text-base [&_p]:my-3 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-black [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-extrabold [&_h3]:mt-5 [&_h3]:mb-2 [&_strong]:font-extrabold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-xl [&_blockquote]:px-4 [&_blockquote]:py-2 [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2
				[&_iframe]:w-full [&_iframe]:max-h-[360px] [&_iframe]:aspect-video [&_iframe]:rounded-2xl [&_iframe]:border-2 [&_iframe]:border-border [&_iframe]:mx-auto [&_iframe]:max-w-2xl
				[&_img]:rounded-2xl [&_img]:max-w-full [&_img]:max-h-[350px]
				[&_a]:text-primary [&_a]:font-bold [&_a]:no-underline hover:[&_a]:underline
				[&_video]:w-full [&_video]:max-h-[400px] [&_video]:rounded-2xl
				[&_audio]:w-full [&_audio]:h-10"
		/>
	);
}
