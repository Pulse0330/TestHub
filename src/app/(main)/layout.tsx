import type { ReactNode } from "react";
import AnimatedBackground from "@/components/animetedBackground";
import { Navbar01 } from "@/components/iHeader";

interface MainLayoutProps {
	children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
	return (
		<div className="min-h-screen relative overflow-hidden bg-linear-to-br from-background via-muted/30 to-background">
			<AnimatedBackground />

			{/* Sidebar + Topbar */}
			<Navbar01 />

			{/* Content — desktop: sidebar width offset, mobile: topbar height offset */}
			<main className="lg:ml-56 pt-12 relative z-10 min-h-screen">
				<div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
					{children}
				</div>
			</main>
		</div>
	);
}