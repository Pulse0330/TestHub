// Runs in the default node environment (no `window`).
import { describe, expect, it } from "vitest";
import { sanitizeHtml, sanitizeRichContent } from "../sanitize";

describe("sanitize on the server", () => {
	it("fails closed (returns empty string) when there is no DOM", () => {
		expect(typeof window).toBe("undefined");
		expect(sanitizeHtml("<p>hello</p>")).toBe("");
		expect(sanitizeRichContent("&lt;p&gt;hello&lt;/p&gt;")).toBe("");
	});
});
