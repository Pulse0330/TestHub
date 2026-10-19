import type { ReactNode } from "react";
import { Navbar01, SectionTabs } from "@/components/iHeader";

interface MainLayoutProps {
	children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
	return (
		<div className="relative min-h-screen bg-page-gradient">
			{/* ── Decorative background ── */}
			<div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
				<div className="absolute inset-0 bg-dots opacity-50 [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_65%)]" />
			</div>

			{/* Top bar + mobile bottom tabs */}
			<Navbar01 />

			{/* Content — top bar 64px, mobile bottom tabs ~68px */}
			<main className="relative z-10 min-h-screen pt-16 pb-24 lg:pb-10">
				<div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-10 lg:py-8">
					<SectionTabs />
					{children}
				</div>
			</main>
		</div>
	);
}
