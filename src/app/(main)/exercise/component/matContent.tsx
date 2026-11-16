"use client";

import { memo } from "react";
import { MathContent as SharedMathContent } from "@/components/MathContent";

interface MathContentProps {
	html: string;
}

// MathJax-ийг root layout ачаалдаг; энд дахин script оруулахгүй.
const MathContentComponent = ({ html }: MathContentProps) => (
	<SharedMathContent html={html} className="block min-h-[1.2em]" />
);

export const MathContent = memo(MathContentComponent);
export default MathContent;
