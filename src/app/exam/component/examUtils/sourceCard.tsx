import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import MathContent from "./MathContent";

interface SourceBlockProps {
	sourceName?: string | null;
	sourceTitle?: string | null;
	sourceImg?: string | null;
	srcAudio?: string | null;
	lineLimit?: number;
}

const SOURCE_CHAR_LIMIT = 400;

export function SourceBlock({
	sourceName,
	sourceTitle,
	sourceImg,
	srcAudio,
}: SourceBlockProps) {
	const [expanded, setExpanded] = useState(false);

	if (!sourceName && !sourceImg && !srcAudio) return null;

	const plainText =
		sourceName
			?.replace(/<[^>]+>/g, "")
			.replace(/&[^;]+;/g, " ")
			.trim() ?? "";
	const needsTruncate = plainText.length > SOURCE_CHAR_LIMIT;

	// HTML биш plainText-ийг slice хийж preview үүсгэх
	const previewText = needsTruncate
		? `${plainText.slice(0, SOURCE_CHAR_LIMIT)}`
		: plainText;

	return (
		<div className="mt-3 mb-4 rounded-2xl border-2 border-border bg-muted/40 p-3.5 sm:p-4">
			{sourceImg && (
				<Image
					src={sourceImg}
					alt="source"
					width={56}
					height={56}
					className="mb-2 size-14 rounded-xl object-cover"
					unoptimized
				/>
			)}
			{srcAudio && (
				<audio
					controls
					controlsList="nodownload"
					className="mb-2 h-10 w-full rounded-full"
					src={srcAudio}
				>
					<track kind="captions" />
				</audio>
			)}
			{sourceName && (
				<div className="text-sm leading-relaxed text-foreground/85">
					{sourceTitle && (
						<span className="mb-1.5 block font-extrabold text-foreground">
							{sourceTitle}
						</span>
					)}
					{expanded || !needsTruncate ? (
						<>
							<MathContent html={sourceName} />
							{needsTruncate && (
								<Button
									type="button"
									variant="link"
									size="sm"
									onClick={() => setExpanded(false)}
									className="ml-1 h-auto p-0 font-bold text-primary"
								>
									Хураах
								</Button>
							)}
						</>
					) : (
						<span>
							{previewText}
							<Button
								type="button"
								variant="link"
								size="sm"
								onClick={() => setExpanded(true)}
								className="ml-1 h-auto p-0 font-bold text-primary"
							>
								...дэлгэрэнгүй
							</Button>
						</span>
					)}
				</div>
			)}
		</div>
	);
}
