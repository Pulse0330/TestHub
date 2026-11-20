"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// Tab солих бүрд бүх query дахин татагдахаас сэргийлнэ
				staleTime: 60_000,
				retry: 0,
				retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
			},
		},
	});
}

const handler = (event: ErrorEvent) => {
	if (!event?.message) return;
	if (
		event.message.includes("ChunkLoadError") ||
		/Loading chunk [\d]+ failed/.test(event.message)
	) {
		window.location.reload();
	}
};

export default function Providers({ children }: { children: React.ReactNode }) {
	// Module scope-д үүсгэвэл SSR дээр хэрэглэгчдийн хооронд cache хуваалцагдана
	const [queryClient] = useState(makeQueryClient);

	useEffect(() => {
		window.addEventListener("error", handler, true);
		return () => window.removeEventListener("error", handler, true);
	}, []);

	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem={false}>
			<QueryClientProvider client={queryClient}>
				{children}
				<Toaster position="top-right" richColors />
			</QueryClientProvider>
		</ThemeProvider>
	);
}
