// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { decodeEntities, sanitizeHtml, sanitizeRichContent } from "../sanitize";

describe("decodeEntities", () => {
	it("returns empty string for empty input", () => {
		expect(decodeEntities("")).toBe("");
	});

	it("decodes the common entities", () => {
		expect(
			decodeEntities("&lt;b&gt;&quot;hi&quot; &#39;x&#39;&nbsp;&amp;"),
		).toBe(`<b>"hi" 'x' &`);
	});

	it("decodes &amp; last so &amp;lt; is not double-decoded", () => {
		expect(decodeEntities("&amp;lt;script&amp;gt;")).toBe("&lt;script&gt;");
		expect(decodeEntities("a &amp;amp; b")).toBe("a &amp; b");
	});

	it("replaces a lone Cyrillic О inside MathML tokens with Latin O", () => {
		expect(decodeEntities("<mi>О</mi>")).toBe("<mi>O</mi>");
		expect(decodeEntities('<mi mathvariant="normal"> О </mi>')).toBe(
			'<mi mathvariant="normal">O</mi>',
		);
		// Outside MathML the letter is left alone
		expect(decodeEntities("<p>О</p>")).toBe("<p>О</p>");
	});
});

describe("sanitizeRichContent", () => {
	it("strips event handler attributes from escaped <img>", () => {
		const out = sanitizeRichContent("&lt;img src=x onerror=alert(1)&gt;");
		expect(out).toContain("<img");
		expect(out).not.toMatch(/onerror/i);
		expect(out).not.toContain("alert");
	});

	it("strips <script> (escaped and raw)", () => {
		expect(sanitizeRichContent("a&lt;script&gt;alert(1)&lt;/script&gt;b")).toBe(
			"ab",
		);
		expect(sanitizeRichContent("<p>x</p><script>alert(1)</script>")).toBe(
			"<p>x</p>",
		);
	});

	it("strips javascript: URLs", () => {
		const out = sanitizeRichContent(
			'&lt;a href="javascript:alert(1)"&gt;x&lt;/a&gt;',
		);
		expect(out).not.toMatch(/javascript:/i);
	});

	it("keeps MathML", () => {
		const out = sanitizeRichContent(
			"&lt;math&gt;&lt;mi&gt;x&lt;/mi&gt;&lt;/math&gt;",
		);
		expect(out).toContain("<math");
		expect(out).toContain("<mi>x</mi>");
		expect(out).toContain("</math>");
	});

	it("keeps raw MathML with fractions", () => {
		const out = sanitizeRichContent(
			"<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>",
		);
		expect(out).toContain("<mfrac><mn>1</mn><mn>2</mn></mfrac>");
	});

	it("does not turn a double-escaped tag into markup", () => {
		// &amp;lt;img ...&amp;gt; decodes to the *text* "&lt;img ...&gt;"
		const out = sanitizeRichContent(
			"&amp;lt;img src=x onerror=alert(1)&amp;gt;",
		);
		expect(out).not.toContain("<img");
	});

	it("sanitizeHtml returns empty string for empty input", () => {
		expect(sanitizeHtml("")).toBe("");
	});
});
