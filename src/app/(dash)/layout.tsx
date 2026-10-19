import type { ReactNode } from "react";
import { IDashboardHeader } from "@/components/iDashboardHeader";

interface MainLayoutProps {
	children: ReactNode;
}

export default function DashboardLayout({ children }: MainLayoutProps) {
	return (
		<div className="flex min-h-screen flex-col bg-page-gradient">
			{/* Navbar */}
			<div className="sticky top-0 z-50 container mx-auto px-3 pt-3 md:px-4 md:pt-4">
				<IDashboardHeader />
			</div>

			{/* Main Content */}
			<main className="container mx-auto flex-1 px-4 pt-2 pb-12 md:pt-4">{children}</main>
		</div>
	);
}
