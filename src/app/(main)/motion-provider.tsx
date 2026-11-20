"use client";

import { domAnimation, LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * framer-motion-ийн зөвхөн DOM animation feature-ийг ачаална (~15kb хэмнэлт).
 * `strict` нь (main) дотор `motion.*` санамсаргүй ашиглагдвал алдаа өгнө —
 * `m.*` ашиглана уу.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
	return (
		<LazyMotion features={domAnimation} strict>
			{children}
		</LazyMotion>
	);
}
