import DOMPurify from "dompurify";

/**
 * Backend-ээс ирсэн контент заримдаа HTML entity-ээр escape хийгдсэн
 * (жишээ нь `&lt;math&gt;`) байдаг тул эхлээд decode хийж, дараа нь
 * заавал sanitize хийнэ. Decode хийсний дараа sanitize-гүй innerHTML-д
 * оруулбал stored XSS болно.
 */
export function decodeEntities(raw: string): string {
	if (!raw) return "";
	return (
		raw
			.replace(/&nbsp;/g, " ")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			// &amp; хамгийн сүүлд — `&amp;lt;` давхар decode хийгдэхээс сэргийлнэ
			.replace(/&amp;/g, "&")
			// MathML дотор Cyrillic О → Latin O
			.replace(/(<m[a-z]+[^>]*>)\s*О\s*(<\/m[a-z]+>)/g, "$1O$2")
	);
}

/**
 * HTML + MathML-ийг цэвэрлэнэ. DOMPurify нь зөвхөн browser дээр ажилладаг
 * тул server дээр хоосон мөр буцаана (fail-closed).
 */
export function sanitizeHtml(html: string): string {
	if (!html || typeof window === "undefined" || !DOMPurify.isSupported) {
		return "";
	}
	return DOMPurify.sanitize(html, {
		USE_PROFILES: { html: true, mathMl: true },
	});
}

/** Escape хийгдсэн контентыг decode хийгээд цэвэрлэнэ. */
export function sanitizeRichContent(raw: string): string {
	return sanitizeHtml(decodeEntities(raw));
}
