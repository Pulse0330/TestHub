"use client";

import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { LogOut, Menu, User, UserCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import ServerDate from "@/components/serverDate";
import { Accordion } from "@/components/ui/accordion";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

const menuItems = [
	{ title: "Өрөө", href: "/room" },
	{ title: "Хуваарь", href: "/exam-schedule" },
	{ title: "Шалгалт бүртгэх", href: "/exam-create" },
	// { title: "Матерал", href: "/exam-download" },
	{ title: "Бүртгүүлсэн суралцагч", href: "/registered-students" },
];

export function IDashboardHeader() {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();
	const pathname = usePathname();
	const router = useRouter();
	const { user, firstname, imgUrl, clearAuth } = useAuthStore();

	const userInfo = React.useMemo(
		() => ({
			userName: user?.fname || firstname || "Хэрэглэгч",
			userImage: imgUrl || user?.img_url || "",
			schoolName: user?.sch_name || "",
			studentGroup: user?.studentgroupname || "",
		}),
		[user, firstname, imgUrl],
	);

	const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);

	const handleLogout = async () => {
		try {
			const cookiesToRemove = ["auth-token", "user-id", "firstname", "img-url"];

			cookiesToRemove.forEach((cookie) => {
				Cookies.remove(cookie, { path: "/" });
			});

			clearAuth();
			sessionStorage.clear();
			queryClient.clear();
			router.push("/login");
		} catch (error) {
			console.error("Logout error:", error);

			window.location.href = "/login";
		}
	};

	const isActive = (path: string) => pathname === path;

	return (
		<header className="card-pop relative z-50 mx-auto w-full max-w-7xl rounded-3xl">
			<div className="flex h-16 items-center justify-between gap-3 px-3 md:px-5">
				{/* 1. Logo */}
				<Link href="/" className="group flex shrink-0 items-center gap-2.5">
					<span className="flex size-10 items-center justify-center rounded-2xl border-2 border-border bg-card shadow-[0_3px_0_0_var(--border)] transition-transform group-hover:animate-wiggle">
						<Image
							src="/image/logoLogin.png"
							alt="ECM Logo"
							width={40}
							height={40}
							className="size-7 object-contain"
							priority
						/>
					</span>
					<span className="hidden text-xl font-black tracking-tight text-gradient sm:inline">
						EXMO
					</span>
				</Link>

				{/* 2. Desktop Navigation (Hidden on Mobile) */}
				<div className="hidden lg:block">
					<NavigationMenu delayDuration={0}>
						<NavigationMenuList className="gap-1">
							{menuItems.map((item) => (
								<NavigationMenuItem key={item.title}>
									{
										<Link
											href={item.href || "#"}
											className={cn(
												navigationMenuTriggerStyle(),
												"h-10 rounded-full px-4 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground",
												isActive(item.href || "") &&
													"bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
											)}
										>
											{item.title}
										</Link>
									}
								</NavigationMenuItem>
							))}
						</NavigationMenuList>
					</NavigationMenu>
				</div>

				<div className="flex items-center gap-2">
					{/* 3. User Dropdown & Theme Toggle */}
					<div className="flex items-center gap-2">
						<div className="hidden sm:block">
							<ServerDate />
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="h-11 gap-2 rounded-2xl border-2 border-border bg-card px-1.5 shadow-[0_3px_0_0_var(--border)] hover:bg-muted active:translate-y-0.5 active:shadow-none md:pr-3"
								>
									<UserAvatar
										userImage={userInfo.userImage}
										userName={userInfo.userName}
										size="sm"
										showOnlineStatus
									/>
									<span className="hidden max-w-25 truncate text-sm font-extrabold md:block">
										{userInfo.userName}
									</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-64 p-1.5">
								<DropdownMenuLabel className="rounded-xl bg-muted/60 p-2.5">
									<div className="flex items-center gap-3">
										<UserAvatar
											userImage={userInfo.userImage}
											userName={userInfo.userName}
											size="md"
										/>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-extrabold">
												{userInfo.userName}
											</p>
											<p className="truncate text-xs font-semibold text-muted-foreground">
												{userInfo.schoolName}
											</p>
										</div>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator className="my-1.5" />
								<div className="px-2 py-1.5">
									<span className="size-4">
										<AnimatedThemeToggler />
									</span>
								</div>
								<DropdownMenuItem
									onClick={() => router.push("/userProfile")}
									className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm font-bold"
								>
									<span className="flex size-7 items-center justify-center rounded-lg bg-pop-violet-soft text-pop-violet-ink">
										<UserCircle className="size-4" />
									</span>
									Профайл
								</DropdownMenuItem>
								<DropdownMenuSeparator className="my-1.5" />
								<DropdownMenuItem
									onClick={() => setShowLogoutDialog(true)}
									className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-destructive focus:bg-pop-coral-soft focus:text-destructive"
								>
									<span className="flex size-7 items-center justify-center rounded-lg bg-pop-coral-soft text-pop-coral-ink">
										<LogOut className="size-4" />
									</span>
									Гарах
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* 4. Mobile Hamburger (Visible only on Mobile/Tablet) */}
						<div className="lg:hidden">
							<Sheet open={open} onOpenChange={setOpen}>
								<SheetTrigger asChild>
									<Button variant="outline" size="icon" className="size-11 rounded-2xl">
										<Menu className="size-5" />
									</Button>
								</SheetTrigger>
								<SheetContent side="left" className="w-[300px] rounded-r-3xl border-r-2 sm:w-[350px]">
									<SheetHeader className="text-left">
										<SheetTitle className="flex items-center gap-2.5">
											<span className="flex size-10 items-center justify-center rounded-2xl border-2 border-border bg-card shadow-[0_3px_0_0_var(--border)]">
												<Image
													src="/image/logoLogin.png"
													alt="Logo"
													width={32}
													height={32}
													priority
													className="size-7 object-contain"
													style={{ height: "auto" }}
												/>
											</span>
											<span className="text-xl font-black tracking-tight text-gradient">
												ECM System
											</span>
										</SheetTitle>
									</SheetHeader>
									<div className="flex flex-col gap-4 px-4 py-4">
										<Accordion type="single" collapsible className="w-full space-y-1.5">
											{menuItems.map((item) => (
												<Link
													key={item.title}
													href={item.href || "#"}
													onClick={() => setOpen(false)}
													className={cn(
														"flex rounded-2xl border-2 border-transparent px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
														isActive(item.href || "") &&
															"border-primary/30 bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
													)}
												>
													{item.title}
												</Link>
											))}
										</Accordion>
										<div className="mt-auto flex flex-col gap-2 border-t-2 border-border pt-6">
											<div className="pb-4 sm:hidden">
												<ServerDate />
											</div>
										</div>
									</div>
								</SheetContent>
							</Sheet>
						</div>
					</div>
				</div>
			</div>

			{/* Logout Dialog */}
			<AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
				<AlertDialogContent className="max-w-sm">
					<AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
						<div className="mb-2 flex size-16 items-center justify-center rounded-3xl bg-pop-coral-soft text-pop-coral-ink">
							<LogOut className="size-7" strokeWidth={2.5} />
						</div>
						<AlertDialogTitle>Гарахдаа итгэлтэй байна уу?</AlertDialogTitle>
						<AlertDialogDescription>
							Та системээс гарахдаа итгэлтэй байна уу?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-2 gap-2 sm:justify-center">
						<AlertDialogCancel className="flex-1">Цуцлах</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleLogout}
							className="flex-1 bg-destructive text-white shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_70%,black)] hover:bg-destructive"
						>
							Тийм, Гарах
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</header>
	);
}

const UserAvatar: React.FC<{
	userImage: string;
	userName: string;
	size?: "sm" | "md" | "lg";
	showOnlineStatus?: boolean;
}> = ({ userImage, userName, size = "md", showOnlineStatus = false }) => {
	const sizeMap = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-12 h-12" };
	const avatarSize = size === "lg" ? 48 : size === "md" ? 40 : 32;

	return (
		<div className="relative shrink-0">
			{userImage ? (
				<Image
					src={userImage}
					alt={userName}
					width={avatarSize}
					height={avatarSize}
					className={cn(
						"rounded-full object-cover ring-2 ring-primary/20",
						sizeMap[size],
					)}
				/>
			) : (
				<div
					className={cn(
						"flex items-center justify-center rounded-xl bg-gradient-to-br from-pop-violet to-pop-pink text-white",
						sizeMap[size],
					)}
				>
					<User className="size-4" strokeWidth={2.5} />
				</div>
			)}
			{showOnlineStatus && (
				<span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card bg-success" />
			)}
		</div>
	);
};
