import parse from "html-react-parser";
import { sanitizeHtml } from "@/lib/sanitize";

/**
 * Backend-ээс ирсэн HTML-ийг DOMPurify-аар цэвэрлээд React элемент болгоно.
 * Server дээр sanitizeHtml хоосон мөр буцаадаг тул (fail-closed) юу ч гаргахгүй.
 */
export function safeParse(html: string | null | undefined) {
	if (!html) return "";
	return parse(sanitizeHtml(html));
}
