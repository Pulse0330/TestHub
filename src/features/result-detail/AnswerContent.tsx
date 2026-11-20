"use client";

import parse from "html-react-parser";
import { memo } from "react";
import { MathContent } from "@/components/MathContent";
import { sanitizeHtml } from "@/lib/sanitize";

/** HTML-ийг DOMPurify-аар цэвэрлээд React элемент болгоно. */
const safeParse = (html: string | null | undefined) => {
	if (!html || typeof html !== "string" || html.trim() === "") return "";
	try {
		return parse(sanitizeHtml(html));
	} catch {
		return "";
	}
};

const hasMath = (content: string) =>
	content.includes("<math") ||
	content.includes("&lt;math") ||
	content.includes("\\(") ||
	content.includes("\\[");

/** Хариултын HTML/текст — math байвал MathJax, үгүй бол цэвэрлэсэн HTML. */
export const AnswerContent = memo(function AnswerContent({
	html,
	text,
}: {
	html?: string | null;
	text?: string | null;
}) {
	const content = html?.trim() ? html : text;
	if (!content?.trim()) return null;
	if (hasMath(content)) return <MathContent html={content} />;
	return <>{safeParse(content)}</>;
});
