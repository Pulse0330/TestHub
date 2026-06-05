"use client";
import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import {
    BarChart3,
    ChevronDown,
    ClipboardList,
    CreditCard,
    FileText,
    LogOut,
    type LucideIcon,
    Menu,
    School,
    TrendingUp,
    UserCircle,
    X,
    Home,
    Bell
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

const NAV_LINKS = [
    { href: "/home", label: "Үндсэн хуудас", icon: Home },
    { href: "/Lists/exerciseList", label: "Дасгал ажил", icon: ClipboardList },
];

const EXAM_LINKS: Array<{ href: string; label: string; icon: LucideIcon }> = [
    { href: "/Lists/examList", label: "Шалгалтын жагсаалт", icon: FileText },
    { href: "/Lists/examResult", label: "Шалгалтын үр дүн", icon: BarChart3 },
];

const SORIL_LINKS: Array<{ href: string; label: string; icon: LucideIcon }> = [
    { href: "/Lists/sorilList", label: "Сорилын жагсаалт", icon: ClipboardList },
    { href: "/Lists/sorilResult", label: "Сорилын үр дүн", icon: TrendingUp },
];

const COURSE_LINKS: Array<{ href: string; label: string; icon: LucideIcon }> = [
    { href: "/Lists/courseList", label: "Хичээл", icon: School },
    { href: "/Lists/paymentCoureList", label: "Төлбөртэй хичээл", icon: CreditCard },
];

const NAV_SECTIONS = [
    { label: "Шалгалт", links: EXAM_LINKS },
    { label: "Сорил", links: SORIL_LINKS },
    { label: "Цахим сургалт", links: COURSE_LINKS },
];

// ── User Avatar ─────────────────────────────────────────────────
const UserAvatar: React.FC<{
    userImage: string;
    userName: string;
    size?: "sm" | "md";
}> = ({ userImage, userName, size = "md" }) => {
    const dim = size === "sm" ? 34 : 42;
    const cls = size === "sm" ? "w-8 h-8" : "w-10 h-10";
    if (userImage) {
        return (
            <Image 
                src={userImage} 
                alt={userName} 
                width={dim} 
                height={dim}
                className={cn("rounded-full object-cover flex-shrink-0 ring-2 ring-emerald-500/20 dark:ring-emerald-400/20", cls)} 
            />
        );
    }
    const initials = userName.slice(0, 1).toUpperCase();
    return (
        <div className={cn(
            "rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm", 
            cls,
            size === "sm" ? "text-xs" : "text-sm"
        )}>
            {initials}
        </div>
    );
};

// ── Sidebar Section ──────────────────────────────────────────────
const SidebarSection: React.FC<{
    label: string;
    links: Array<{ href: string; label: string; icon: LucideIcon }>;
    onClose?: () => void;
}> = ({ label, links, onClose }) => {
    const pathname = usePathname();
    const [open, setOpen] = React.useState(
        links.some((l) => pathname === l.href)
    );

    return (
        <div className="space-y-1">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
                {label}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", open && "rotate-180")} />
            </button>
            {open && (
                <div className="space-y-0.5 pl-1">
                    {links.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                                    active
                                        ? "bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.05)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-emerald-500 before:rounded-r"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <Icon className={cn(
                                    "w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105", 
                                    active ? "text-emerald-600 dark:text-emerald-400 opacity-100" : "opacity-60"
                                )} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── Sidebar Content ──────────────────────────────────────────────
const SidebarContent: React.FC<{
    userInfo: { userName: string; userImage: string; schoolName: string };
    onClose?: () => void;
    onLogout: () => void;
}> = ({ userInfo, onClose, onLogout }) => {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="flex flex-col h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100/80 dark:border-slate-800/40">
                <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/30">
                    <Image src="/image/asd.png" alt="EXMO" width={26} height={26} priority
                        style={{ width: 26, height: 26, objectFit: "contain" }} />
                </div>
                <span className="text-base font-black tracking-widest bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">EXMO</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-none">
                {/* Main links */}
                <div className="space-y-1">
                    <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Үндсэн</p>
                    {NAV_LINKS.map((link) => {
                        const Icon = link.icon;
                        const active = pathname === link.href;
                        return (
                            <Link 
                                key={link.href} 
                                href={link.href} 
                                onClick={onClose}
                                className={cn(
                                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                                    active
                                        ? "bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.05)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-emerald-500 before:rounded-r"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <Icon className={cn(
                                    "w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105", 
                                    active ? "text-emerald-600 dark:text-emerald-400 opacity-100" : "opacity-60"
                                )} />
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Sectioned links */}
                <div className="space-y-4">
                    {NAV_SECTIONS.map((section) => (
                        <SidebarSection key={section.label} label={section.label} links={section.links} onClose={onClose} />
                    ))}
                </div>
            </nav>

            {/* User footer */}
            <div className="p-4 border-t border-slate-100/80 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-md">
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button type="button"
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50 transition-all text-left shadow-none hover:shadow-sm">
                            <UserAvatar userImage={userInfo.userImage} userName={userInfo.userName} size="sm" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{userInfo.userName}</p>
                                {userInfo.schoolName && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{userInfo.schoolName}</p>
                                )}
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 opacity-60" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" sideOffset={12}
                        className="w-52 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl p-1.5 anim-fade-in animate-in slide-in-from-bottom-2 duration-200">
                        <DropdownMenuItem onClick={() => router.push("/userProfile")}
                            className="gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer text-slate-700 dark:text-slate-300 focus:bg-slate-50 dark:focus:bg-slate-800">
                            <UserCircle className="w-4 h-4 text-slate-400" />
                            Профайл
                        </DropdownMenuItem>
                        <div className="flex items-center px-1.5 py-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <ThemeSwitch className="p-0 min-w-0 w-full justify-start gap-3 h-9 px-1.5 rounded-xl text-sm" />
                        </div>
                        <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />
                        <DropdownMenuItem onClick={onLogout}
                            className="gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 font-medium">
                            <LogOut className="w-4 h-4" />
                            Гарах
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

// ── Main Navbar (Topbar) ─────────────────────────────────────────
export const Navbar01: React.FC = () => {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user, firstname, imgUrl, clearAuth } = useAuthStore();

    const userInfo = React.useMemo(() => ({
        userName: user?.fname || firstname || "Хэрэглэгч",
        userEmail: user?.email || "",
        userImage: imgUrl || user?.img_url || "",
        schoolName: user?.sch_name || "",
    }), [user, firstname, imgUrl]);

    React.useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    const handleLogout = async () => {
        try {
            for (const c of ["auth-token", "user-id", "firstname", "img-url"]) {
                Cookies.remove(c, { path: "/" });
            }
            clearAuth();
            localStorage.clear();
            sessionStorage.clear();
            queryClient.clear();
            router.push("/login");
        } catch {
            window.location.href = "/login";
        }
    };

    return (
        <>
            {/* ── Desktop: Sidebar ── */}
            <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 bg-transparent border-r border-slate-100/80 dark:border-slate-800/40 z-40">
                <SidebarContent
                    userInfo={userInfo}
                    onLogout={() => setShowLogoutDialog(true)}
                />
            </aside>

            {/* ── Mobile: Topbar ── */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100/80 dark:border-slate-800/40 z-30 flex items-center justify-between px-4 shadow-sm">
                <button type="button" onClick={() => setMobileOpen(true)}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95"
                    aria-label="Цэс нээх">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <Image src="/image/asd.png" alt="EXMO" width={26} height={26}
                        style={{ width: 26, height: 26, objectFit: "contain" }} />
                    <span className="text-sm font-black tracking-widest bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">EXMO</span>
                </div>
                <button type="button"
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-100/80 dark:border-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95">
                    <Bell className="w-4 h-4" />
                </button>
            </header>

            {/* ── Mobile: Drawer ── */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
                    <button type="button" className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} aria-label="Хаах" />
                    <div className={cn(
                        "absolute left-0 top-0 h-full w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-100/80 dark:border-slate-800/40 shadow-2xl",
                        "transform transition-transform duration-300 ease-out translate-x-0"
                    )}>
                        <div className="absolute top-4 right-4 z-10">
                            <button type="button" onClick={() => setMobileOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <SidebarContent
                            userInfo={userInfo}
                            onClose={() => setMobileOpen(false)}
                            onLogout={() => { setMobileOpen(false); setShowLogoutDialog(true); }}
                        />
                    </div>
                </div>
            )}

            {/* ── Logout Dialog ── */}
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent className="rounded-2xl border-slate-100 dark:border-slate-800/60 max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl p-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3 text-base font-bold text-slate-900 dark:text-white">
                            <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-xl">
                                <LogOut className="w-4 h-4 text-red-500" />
                            </div>
                            Системээс гарах уу?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400 pt-2 leading-relaxed">
                            Та системээс гарахдаа итгэлтэй байна уу? Дахин нэвтрэхийн тулд бүртгэлтэй имэйл, нууц үгээ оруулах шаардлагатай.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 mt-4">
                        <AlertDialogCancel className="rounded-xl text-sm border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium px-4 py-2.5">
                            Цуцлах
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout} className="rounded-xl text-sm bg-red-600 hover:bg-red-700 text-white font-medium border-none shadow-sm shadow-red-600/20 px-4 py-2.5">
                            Тийм, гарах
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};