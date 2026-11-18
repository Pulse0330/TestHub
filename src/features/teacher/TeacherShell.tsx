"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	GraduationCap,
	LogOut,
	Menu,
	Moon,
	ShieldAlert,
	Sun,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { clearSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useTeacher } from "./hooks";
import { isNavActive, TEACHER_HOME, TEACHER_NAV } from "./nav";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();
	const link = (item: typeof TEACHER_HOME) => {
		const active = isNavActive(pathname, item.href);
		const Icon = item.icon;
		return (
			<Link
				key={item.href}
				href={item.href}
				onClick={onNavigate}
				aria-current={active ? "page" : undefined}
				className={cn(
					"flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition-colors",
					active
						? "bg-primary-soft text-primary-soft-foreground"
						: "text-muted-foreground hover:bg-muted hover:text-foreground",
				)}
			>
				<Icon className="size-4 shrink-0" strokeWidth={2.25} />
				<span className="truncate">{item.label}</span>
			</Link>
		);
	};
	return (
		<nav aria-label="Багшийн цэс" className="grid gap-5">
			<div className="grid gap-0.5">{link(TEACHER_HOME)}</div>
			{TEACHER_NAV.map((g) => (
				<div key={g.label} className="grid gap-0.5">
					<p className="px-3 pb-1 text-[11px] font-extrabold tracking-widest text-muted-foreground/80 uppercase">
						{g.label}
					</p>
					{g.items.map(link)}
				</div>
			))}
		</nav>
	);
}

function Brand() {
	return (
		<Link href="/teacher" className="flex items-center gap-2.5">
			<Image
				src="/image/logoLogin.png"
				alt=""
				width={177}
				height={142}
				priority
				className="h-7 w-auto"
			/>
			<span className="text-lg font-black tracking-tight">Skuul</span>
			<span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-extrabold text-muted-foreground">
				Багш
			</span>
		</Link>
	);
}

function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const isDark = mounted && resolvedTheme === "dark";
	return (
		<Button
			variant="ghost"
			size="icon-sm"
			aria-label={isDark ? "Цайвар горим" : "Харанхуй горим"}
			onClick={() => setTheme(isDark ? "light" : "dark")}
		>
			{isDark ? <Sun /> : <Moon />}
		</Button>
	);
}

/** Багшийн хэсгийн бүрхүүл: sidebar (desktop), гулсдаг цэс (утас), эрхийн шалгалт. */
export function TeacherShell({ children }: { children: React.ReactNode }) {
	const { hydrated, user, isTeacher, isManager } = useTeacher();
	const [menuOpen, setMenuOpen] = useState(false);
	const router = useRouter();
	const queryClient = useQueryClient();

	const logout = () => {
		clearSession({ wipeStorage: true });
		queryClient.clear();
		router.push("/login");
	};

	const name = user?.fname || user?.firstname || "Багш";

	return (
		<div className="min-h-dvh bg-background text-foreground">
			{/* Desktop sidebar */}
			<aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
				<div className="flex h-16 items-center px-5">
					<Brand />
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
					<NavList />
				</div>
				<div className="border-t border-border p-3">
					<Button
						variant="ghost"
						className="w-full justify-start text-muted-foreground"
						onClick={logout}
					>
						<LogOut />
						Гарах
					</Button>
				</div>
			</aside>

			<div className="lg:pl-64">
				{/* Top bar */}
				<header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
					<Button
						variant="ghost"
						size="icon-sm"
						className="lg:hidden"
						aria-label="Цэс нээх"
						onClick={() => setMenuOpen(true)}
					>
						<Menu />
					</Button>
					<div className="lg:hidden">
						<Brand />
					</div>
					<p className="ml-auto hidden min-w-0 truncate text-sm font-semibold text-muted-foreground sm:block">
						Сайн уу,{" "}
						<span className="font-extrabold text-foreground">{name}</span>
						{user?.sch_name && (
							<span className="hidden md:inline"> · {user.sch_name}</span>
						)}
					</p>
					<div className="ml-auto flex items-center gap-1 sm:ml-2">
						<Button
							variant="ghost"
							size="sm"
							asChild
							className="hidden sm:inline-flex"
						>
							<Link href="/home">Сурагчийн хэсэг</Link>
						</Button>
						<ThemeToggle />
					</div>
				</header>

				<main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
					{!hydrated ? (
						<div className="space-y-3">
							<Skeleton className="h-10 w-64 rounded-2xl" />
							<Skeleton className="h-64 rounded-3xl" />
						</div>
					) : !isTeacher ? (
						<div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 text-center">
							<span className="flex size-14 items-center justify-center rounded-2xl bg-pop-sun-soft text-pop-sun-ink">
								<ShieldAlert className="size-7" />
							</span>
							<h1 className="text-xl font-black">Хандах эрхгүй</h1>
							<p className="text-sm font-semibold text-muted-foreground">
								Энэ хэсэг зөвхөн багш, менежерт зориулагдсан.
							</p>
							<Button asChild>
								<Link href="/home">Нүүр хуудас руу</Link>
							</Button>
						</div>
					) : (
						<div data-manager={isManager || undefined}>{children}</div>
					)}
				</main>
			</div>

			{/* Mobile menu */}
			<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
				<SheetContent side="left" className="w-72 gap-0 p-0">
					<SheetHeader className="border-b border-border p-4">
						<SheetTitle>
							<Brand />
						</SheetTitle>
						<SheetDescription className="sr-only">Багшийн цэс</SheetDescription>
					</SheetHeader>
					<div className="overflow-y-auto p-3">
						<NavList onNavigate={() => setMenuOpen(false)} />
					</div>
					<div className="mt-auto grid gap-1 border-t border-border p-3">
						<Button
							variant="ghost"
							className="w-full justify-start text-muted-foreground"
							asChild
						>
							<Link href="/home" onClick={() => setMenuOpen(false)}>
								<GraduationCap />
								Сурагчийн хэсэг
							</Link>
						</Button>
						<Button
							variant="ghost"
							className="w-full justify-start text-muted-foreground"
							onClick={logout}
						>
							<LogOut />
							Гарах
						</Button>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}
