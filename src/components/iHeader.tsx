"use client";
import { useQueryClient } from "@tanstack/react-query";
import {
	BarChart3,
	BookOpen,
	ChevronDown,
	ClipboardList,
	CreditCard,
	Dumbbell,
	FileText,
	Home,
	LogOut,
	type LucideIcon,
	Presentation,
	School,
	Target,
	TrendingUp,
	UserCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitch } from "@/components/ui/ui-theme";
import { isTeacherGroup } from "@/features/teacher/hooks";
import { clearSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

// ════════════════════════════════════════════════════════════════
// Navigation model
// Нэг "хэсэг" (section) нь 1+ дэд хуудастай. Дэд хуудсууд нь
// header-ийн доор segmented tab болж харагдана.
// ════════════════════════════════════════════════════════════════
type SubLink = { href: string; label: string; icon: LucideIcon };
type Section = {
	key: string;
	label: string;
	short: string;
	icon: LucideIcon;
	tone: string; // active pill colors
	links: SubLink[];
};

/** Идэвхтэй цэсний нэг өнгө (pastel цэнхэр) — бүх хэсэгт ижил */
const ACTIVE_TONE = "bg-primary-soft text-primary-soft-foreground";

export const NAV: Section[] = [
	{
		key: "home",
		label: "Нүүр",
		short: "Нүүр",
		icon: Home,
		tone: ACTIVE_TONE,
		links: [{ href: "/home", label: "Үндсэн хуудас", icon: Home }],
	},
	{
		key: "exam",
		label: "Шалгалт",
		short: "Шалгалт",
		icon: FileText,
		tone: ACTIVE_TONE,
		links: [
			{ href: "/Lists/examList", label: "Шалгалтын жагсаалт", icon: FileText },
			{ href: "/Lists/examResult", label: "Шалгалтын үр дүн", icon: BarChart3 },
		],
	},
	{
		key: "soril",
		label: "Сорил",
		short: "Сорил",
		icon: Target,
		tone: ACTIVE_TONE,
		links: [
			{
				href: "/Lists/sorilList",
				label: "Сорилын жагсаалт",
				icon: ClipboardList,
			},
			{ href: "/Lists/sorilResult", label: "Сорилын үр дүн", icon: TrendingUp },
		],
	},
	{
		key: "exercise",
		label: "Дасгал ажил",
		short: "Дасгал",
		icon: Dumbbell,
		tone: ACTIVE_TONE,
		links: [
			{ href: "/Lists/exerciseList", label: "Дасгал ажил", icon: Dumbbell },
		],
	},
	{
		key: "course",
		label: "Цахим сургалт",
		short: "Хичээл",
		icon: BookOpen,
		tone: ACTIVE_TONE,
		links: [
			{ href: "/Lists/courseList", label: "Хичээл", icon: School },
			{
				href: "/Lists/paymentCoureList",
				label: "Төлбөртэй хичээл",
				icon: CreditCard,
			},
		],
	},
];

const isLinkActive = (pathname: string, href: string) =>
	pathname === href || pathname.startsWith(`${href}/`);

export const findSection = (pathname: string) =>
	NAV.find((s) => s.links.some((l) => isLinkActive(pathname, l.href)));

// ── User Avatar ─────────────────────────────────────────────────
const UserAvatar: React.FC<{
	userImage: string;
	userName: string;
	size?: "sm" | "md";
}> = ({ userImage, userName, size = "md" }) => {
	const dim = size === "sm" ? 36 : 44;
	const cls = size === "sm" ? "size-9" : "size-11";
	if (userImage) {
		return (
			<Image
				src={userImage}
				alt={userName}
				width={dim}
				height={dim}
				className={cn(
					"flex-shrink-0 rounded-full object-cover ring-2 ring-pop-violet/40 ring-offset-2 ring-offset-card",
					cls,
				)}
			/>
		);
	}
	return (
		<div
			className={cn(
				"flex flex-shrink-0 items-center justify-center rounded-full bg-pop-sky-soft font-black text-pop-sky-ink",
				cls,
				size === "sm" ? "text-sm" : "text-base",
			)}
		>
			{userName.slice(0, 1).toUpperCase()}
		</div>
	);
};

// ── Logo ─────────────────────────────────────────────────────────
const Logo = () => (
	<Link href="/home" className="group flex shrink-0 items-center gap-2.5">
		<Image
			src="/image/logoLogin.png"
			alt=""
			width={177}
			height={142}
			priority
			className="h-8 w-auto transition-transform group-hover:-rotate-6"
		/>
		<span className="text-xl font-black tracking-tight text-foreground">
			Skuul
		</span>
	</Link>
);

// ── User menu (shared desktop/mobile) ────────────────────────────
const UserMenu: React.FC<{
	userInfo: {
		userName: string;
		userImage: string;
		schoolName: string;
		userEmail: string;
		isTeacher?: boolean;
	};
	onLogout: () => void;
	compact?: boolean;
}> = ({ userInfo, onLogout, compact }) => {
	const router = useRouter();
	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label="Хэрэглэгчийн цэс"
					className={cn(
						"flex items-center gap-2.5 rounded-full transition-colors",
						compact
							? "p-0.5"
							: "border-2 border-border bg-card py-1 pr-3 pl-1 hover:bg-accent",
					)}
				>
					<UserAvatar
						userImage={userInfo.userImage}
						userName={userInfo.userName}
						size="sm"
					/>
					{!compact && <ChevronDown className="size-4 text-muted-foreground" />}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={10} className="w-64 p-2">
				{(userInfo.schoolName || userInfo.userEmail) && (
					<div className="mb-2 space-y-0.5 rounded-xl bg-muted px-3 py-2.5">
						{userInfo.schoolName && (
							<p className="truncate text-xs font-bold text-foreground">
								{userInfo.schoolName}
							</p>
						)}
						{userInfo.userEmail && (
							<p className="truncate text-xs font-semibold text-muted-foreground">
								{userInfo.userEmail}
							</p>
						)}
					</div>
				)}
				<DropdownMenuItem
					onClick={() => router.push("/userProfile")}
					className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm font-bold"
				>
					<UserCircle className="size-4" />
					Профайл
				</DropdownMenuItem>
				{userInfo.isTeacher && (
					<DropdownMenuItem
						onClick={() => router.push("/teacher")}
						className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm font-bold"
					>
						<Presentation className="size-4" />
						Багшийн хэсэг
					</DropdownMenuItem>
				)}
				<div className="flex items-center rounded-xl px-1.5 py-1 transition-colors hover:bg-accent">
					<ThemeSwitch
						showLabels
						className="h-9 min-w-0 justify-start gap-3 rounded-xl px-1.5 text-sm font-bold"
					/>
				</div>
				<DropdownMenuSeparator className="my-1.5" />
				<DropdownMenuItem
					onClick={onLogout}
					className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-destructive focus:bg-pop-coral-soft focus:text-destructive"
				>
					<LogOut className="size-4" />
					Гарах
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

// ── Section sub-tabs (Жагсаалт | Үр дүн) ─────────────────────────
export const SectionTabs: React.FC = () => {
	const pathname = usePathname();
	const section = findSection(pathname);
	if (!section || section.links.length < 2) return null;
	return (
		<div className="mb-6 flex justify-center sm:justify-start">
			<div className="inline-flex w-full gap-1 rounded-2xl border-2 border-border bg-card p-1 sm:w-auto">
				{section.links.map((l) => {
					const active = isLinkActive(pathname, l.href);
					const Icon = l.icon;
					return (
						<Link
							key={l.href}
							href={l.href}
							className={cn(
								"flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-all sm:flex-none",
								active
									? section.tone
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
						>
							<Icon className="size-4" strokeWidth={2.5} />
							{l.label}
						</Link>
					);
				})}
			</div>
		</div>
	);
};

// ── Main Navbar ──────────────────────────────────────────────────
export const Navbar01: React.FC = () => {
	const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const queryClient = useQueryClient();
	const user = useAuthStore((s) => s.user);
	const firstname = useAuthStore((s) => s.firstname);
	const imgUrl = useAuthStore((s) => s.imgUrl);
	const current = findSection(pathname);

	const userInfo = React.useMemo(
		() => ({
			userName: user?.fname || firstname || "Хэрэглэгч",
			userEmail: user?.email || "",
			userImage: imgUrl || user?.img_url || "",
			schoolName: user?.sch_name || "",
			isTeacher: isTeacherGroup(user?.ugroup),
		}),
		[user, firstname, imgUrl],
	);

	const handleLogout = async () => {
		try {
			clearSession({ wipeStorage: true });
			queryClient.clear();
			router.push("/login");
		} catch {
			window.location.href = "/login";
		}
	};

	return (
		<>
			{/* ── Top bar (desktop + mobile) ── */}
			<header className="fixed inset-x-0 top-0 z-40 border-b-2 border-border bg-card/90 backdrop-blur-xl">
				<div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-6 lg:px-6 xl:gap-4 xl:px-10">
					<Logo />

					{/* Мэндчилгээ — логоны хажууд */}
					<p className="min-w-0 max-w-56 shrink truncate border-l-2 border-border pl-3 text-sm font-semibold text-muted-foreground lg:max-w-40 xl:max-w-64 xl:pl-4">
						Сайн уу,{" "}
						<span className="font-extrabold text-foreground">
							{userInfo.userName}
						</span>
					</p>

					{/* Desktop nav */}
					<nav className="hidden flex-1 items-center gap-0.5 lg:ml-1 lg:flex xl:ml-4 xl:gap-1">
						{NAV.map((s) => {
							const Icon = s.icon;
							const active = current?.key === s.key;
							return (
								<Link
									key={s.key}
									href={s.links[0].href}
									className={cn(
										"flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-extrabold whitespace-nowrap transition-all xl:px-4",
										active
											? s.tone
											: "text-muted-foreground hover:bg-muted hover:text-foreground",
									)}
								>
									<Icon className="size-4 lg:max-xl:hidden" strokeWidth={2.5} />
									{s.label}
								</Link>
							);
						})}
					</nav>

					<div className="ml-auto flex shrink-0 items-center gap-2.5">
						<div className="hidden shrink-0 lg:block">
							<UserMenu
								userInfo={userInfo}
								onLogout={() => setShowLogoutDialog(true)}
							/>
						</div>
						<div className="shrink-0 lg:hidden">
							<UserMenu
								compact
								userInfo={userInfo}
								onLogout={() => setShowLogoutDialog(true)}
							/>
						</div>
					</div>
				</div>
			</header>

			{/* ── Mobile bottom tab bar ── */}
			<nav
				aria-label="Үндсэн цэс"
				className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
			>
				<div className="mx-auto grid max-w-lg grid-cols-5">
					{NAV.map((s) => {
						const Icon = s.icon;
						const active = current?.key === s.key;
						return (
							<Link
								key={s.key}
								href={s.links[0].href}
								className="group flex flex-col items-center gap-1 py-2"
							>
								<span
									className={cn(
										"flex h-8 w-14 items-center justify-center rounded-full transition-all",
										active
											? s.tone
											: "text-muted-foreground group-active:scale-90",
									)}
								>
									<Icon className="size-5" strokeWidth={2.5} />
								</span>
								<span
									className={cn(
										"text-[11px] font-extrabold",
										active ? "text-foreground" : "text-muted-foreground",
									)}
								>
									{s.short}
								</span>
							</Link>
						);
					})}
				</div>
			</nav>

			{/* ── Logout Dialog ── */}
			<AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
				<AlertDialogContent className="max-w-sm">
					<AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
						<div className="mb-2 flex size-16 items-center justify-center rounded-3xl bg-pop-coral-soft text-pop-coral-ink">
							<LogOut className="size-7" strokeWidth={2.5} />
						</div>
						<AlertDialogTitle>Системээс гарах уу?</AlertDialogTitle>
						<AlertDialogDescription className="leading-relaxed">
							Дахин нэвтрэхийн тулд бүртгэлтэй имэйл, нууц үгээ оруулах
							шаардлагатай.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-2 gap-2 sm:justify-center">
						<AlertDialogCancel className="flex-1">Цуцлах</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleLogout}
							className="flex-1 bg-destructive text-white shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_70%,black)] hover:bg-destructive"
						>
							Тийм, гарах
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
