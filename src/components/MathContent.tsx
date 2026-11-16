"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { typesetElement } from "@/lib/mathjax";
import { sanitizeRichContent } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

interface MathContentProps {
	html: string;
	className?: string;
}

function styleContainers(root: HTMLElement) {
	for (const container of root.querySelectorAll("mjx-container")) {
		const el = container as HTMLElement;
		const hasMatrix = !!el.querySelector("mjx-mtable, mtable");
		// MathJax 3 CHTML → "true", SVG → "block"
		const display = el.getAttribute("display");
		const isDisplayMode = display === "true" || display === "block";
		el.style.cssText = "";
		el.style.maxWidth = "100%";
		if (hasMatrix || isDisplayMode) {
			el.style.display = "block";
			el.style.overflowX = "auto";
			el.style.margin = "8px 0";
		} else {
			el.style.display = "inline-flex";
			el.style.alignItems = "center";
			el.style.verticalAlign = "middle";
			el.style.overflow = "visible";
		}
	}
}

/**
 * HTML/MathML/TeX контентыг аюулгүй харуулна.
 * - Контентыг DOMPurify-аар цэвэрлэж зөвхөн client дээр оруулна
 *   (server дээр хоосон div → hydration mismatch үүсэхгүй).
 * - MathJax бэлэн болтол хүлээж, зөвхөн энэ элементийг typeset хийнэ.
 */
function MathContentImpl({ html, className }: MathContentProps) {
	const ref = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.innerHTML = sanitizeRichContent(html);
		let cancelled = false;
		typesetElement(el)
			.then(() => {
				if (!cancelled) styleContainers(el);
			})
			.catch((err) => console.error("MathJax rendering error:", err));
		return () => {
			cancelled = true;
		};
	}, [html]);

	return (
		<div
			ref={ref}
			className={cn("math-content w-full max-w-full", className)}
			style={{
				overflowWrap: "break-word",
				wordBreak: "break-word",
				lineHeight: "1.8",
			}}
		/>
	);
}

export const MathContent = memo(MathContentImpl);
export default MathContent;
