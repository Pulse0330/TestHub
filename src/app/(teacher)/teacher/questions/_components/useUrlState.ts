"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** URL-ийн query-г төлөв болгон ашиглана (редактор руу ороод буцахад хадгалагдана). */
export function useUrlState() {
	const sp = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const get = useCallback((key: string) => sp.get(key) ?? "", [sp]);

	const set = useCallback(
		(patch: Record<string, string | number | boolean | null | undefined>) => {
			const next = new URLSearchParams(sp.toString());
			for (const [k, v] of Object.entries(patch)) {
				if (
					v === null ||
					v === undefined ||
					v === "" ||
					v === false ||
					v === "0"
				)
					next.delete(k);
				else next.set(k, v === true ? "1" : String(v));
			}
			const qs = next.toString();
			router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
		},
		[sp, router, pathname],
	);

	return { get, set, search: sp.toString() };
}
