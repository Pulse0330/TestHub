import type { ReactNode } from "react";
import { Navbar01 } from "@/components/iHeader";

interface MainLayoutProps {
	children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
	return (
		<div className="min-h-screen relative overflow-hidden bg-white dark:bg-[#0b0f1a]">

			{/* ── Background ── */}
			<div className="pointer-events-none fixed inset-0 z-0">
				{/* Base gradient */}
				<div className="absolute inset-0 bg-gradient-to-br
					from-slate-50 via-white to-slate-100
					dark:from-[#0b0f1a] dark:via-[#0f1525] dark:to-[#0b0f1a]" />

				{/* Glow — top left */}
				<div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full
					bg-indigo-100/50 dark:bg-indigo-900/20
					blur-[120px] -translate-y-1/2" />

				{/* Glow — bottom right */}
				<div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full
					bg-violet-100/40 dark:bg-violet-900/15
					blur-[100px] translate-y-1/3" />

				{/* Glow — mid left */}
				<div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full
					bg-blue-100/30 dark:bg-blue-900/10
					blur-[80px] -translate-x-1/2 -translate-y-1/2" />

				{/* Grid pattern — dark mode дээр л харагдана */}
				<div
					className="absolute inset-0 opacity-0 dark:opacity-[0.025]"
					style={{
						backgroundImage: `
							linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
							linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
						`,
						backgroundSize: "64px 64px",
					}}
				/>
			</div>

			{/* Sidebar + Topbar */}
			<Navbar01 />

			{/* Content */}
			<main className="lg:ml-56 pt-12 relative z-10 min-h-screen">
				<div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
					{children}
				</div>
			</main>
		</div>
	);
}