"use client";

import {
	AnimatePresence,
	domMax,
	LayoutGroup,
	LazyMotion,
	MotionConfig,
	m,
} from "framer-motion";
import {
	ArrowDown,
	BookOpen,
	ClipboardList,
	Clock,
	Moon,
	Sun,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoginForm } from "@/app/(auth)/login/form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AboutSections, LANDING_SECTIONS } from "./landing-sections";

// Бүртгэл/нууц үг сэргээх form-ууд зөвхөн dialog нээгдэхэд ачаалагдана
const SignForm = dynamic(() =>
	import("@/app/(auth)/sign/form").then((mod) => mod.SignForm),
);
const ForgotForm = dynamic(() => import("@/app/(auth)/forgot/form"));

type View = "login" | "about";
type ModalType = "sign" | "forgot" | null;

/** "Дэлгэрэнгүй харах" төлөвийг URL hash-д хадгална (Back товч ажиллана). */
const ABOUT_HASH = "#about";

/** Нэвтрэх card ↔ header хооронд морфлох нэг элемент. */
const SURFACE_ID = "auth-surface";
const SURFACE_TRANSITION = {
	type: "spring",
	stiffness: 260,
	damping: 32,
	mass: 0.9,
} as const;

/** Морфлох үед доторх агуулга эхлээд алга болж, дараа нь гарч ирнэ. */
const SURFACE_CONTENT = {
	initial: { opacity: 0 },
	animate: { opacity: 1, transition: { delay: 0.22, duration: 0.25 } },
	exit: { opacity: 0, transition: { duration: 0.1 } },
};

const SURFACE_SHADOW =
	"shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.18)]";

const HIGHLIGHTS = [
	{ icon: Clock, label: "Цаг хугацаатай онлайн шалгалт" },
	{ icon: ClipboardList, label: "Элсэлтийн шалгалтын сорил" },
	{ icon: BookOpen, label: "Хичээл, дасгал ажил" },
];

function ThemeToggle({ className }: { className?: string }) {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const isDark = mounted && resolvedTheme === "dark";
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			aria-label={isDark ? "Цайвар горим" : "Харанхуй горим"}
			onClick={() => setTheme(isDark ? "light" : "dark")}
			className={className}
		>
			{isDark ? (
				<Sun className="size-4" strokeWidth={2.5} />
			) : (
				<Moon className="size-4" strokeWidth={2.5} />
			)}
		</Button>
	);
}

function Brand({ size = "sm" }: { size?: "sm" | "lg" }) {
	return (
		<span className="flex items-center gap-2.5">
			<Image
				src="/image/logoLogin.png"
				alt=""
				width={177}
				height={142}
				priority
				className={size === "lg" ? "h-14 w-auto sm:h-16" : "h-7 w-auto"}
			/>
			<span
				className={cn(
					"font-black tracking-tight text-foreground",
					size === "lg" ? "text-4xl sm:text-5xl" : "text-lg",
				)}
			>
				Skuul
			</span>
		</span>
	);
}

export default function SkuulLanding() {
	const [view, setView] = useState<View>("login");
	const [modal, setModal] = useState<ModalType>(null);
	/** "about" руу бид өөрсдөө history push хийсэн эсэх (Back-аар буцаах). */
	const pushedAboutRef = useRef(false);

	// URL hash ↔ view (Back/Forward товч, шууд #about холбоос)
	useEffect(() => {
		const sync = () =>
			setView(window.location.hash === ABOUT_HASH ? "about" : "login");
		sync();
		window.addEventListener("popstate", sync);
		return () => window.removeEventListener("popstate", sync);
	}, []);

	const showAbout = useCallback(() => {
		window.history.pushState(window.history.state, "", ABOUT_HASH);
		pushedAboutRef.current = true;
		window.scrollTo({ top: 0 });
		setView("about");
	}, []);

	const showLogin = useCallback(() => {
		window.scrollTo({ top: 0 });
		if (pushedAboutRef.current && window.location.hash === ABOUT_HASH) {
			pushedAboutRef.current = false;
			window.history.back(); // popstate → view = "login"
			return;
		}
		window.history.replaceState(
			window.history.state,
			"",
			window.location.pathname + window.location.search,
		);
		setView("login");
	}, []);

	const scrollToSection = useCallback((id: string) => {
		document
			.getElementById(id)
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, []);

	const openSign = useCallback(() => setModal("sign"), []);
	const openForgot = useCallback(() => setModal("forgot"), []);
	const closeModal = useCallback(() => setModal(null), []);

	const authDialogClass =
		"p-0 border-0 bg-transparent shadow-none w-full max-w-[calc(100%-1.5rem)] sm:max-w-md md:max-w-3xl max-h-[94vh] overflow-y-auto scrollbar-none gap-3 [&>button:last-child]:hidden outline-none ring-0 focus:outline-none";

	return (
		<LazyMotion features={domMax} strict>
			<MotionConfig reducedMotion="user">
				<LayoutGroup>
					<div className="relative min-h-dvh overflow-x-hidden bg-background text-foreground antialiased">
						{/* Зөөлөн цэгэн дэвсгэр */}
						<div
							aria-hidden="true"
							className="pointer-events-none fixed inset-0 bg-dots opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
						/>

						<AnimatePresence mode="popLayout" initial={false}>
							{view === "login" ? (
								<m.main
									key="login"
									exit={{ opacity: 0, transition: { duration: 0.2 } }}
									className="relative mx-auto grid min-h-dvh max-w-6xl content-center items-center gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-12"
								>
									<ThemeToggle className="absolute top-4 right-4 sm:top-6 sm:right-8" />

									{/* Брэнд + тайлбар */}
									<m.div
										initial={{ opacity: 0, y: 16 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -24 }}
										transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
										className="flex flex-col items-center text-center lg:items-start lg:text-left"
									>
										<Brand size="lg" />
										<h1 className="mt-6 max-w-md text-2xl leading-tight font-black tracking-tight text-balance text-foreground sm:text-3xl">
											Шалгалт, сорил, дасгал — нэг дор
										</h1>
										<p className="mt-3 max-w-md text-sm leading-relaxed font-semibold text-muted-foreground sm:text-base">
											Сурагч, багш, сургуульд зориулсан цахим шалгалт, сургалтын
											нэгдсэн платформ.
										</p>
										<ul className="mt-6 hidden space-y-2.5 lg:block">
											{HIGHLIGHTS.map(({ icon: Icon, label }) => (
												<li
													key={label}
													className="flex items-center gap-3 text-sm font-bold text-foreground/80"
												>
													<span className="flex size-8 items-center justify-center rounded-xl bg-muted text-foreground">
														<Icon className="size-4" strokeWidth={2.25} />
													</span>
													{label}
												</li>
											))}
										</ul>
										<Button
											variant="outline"
											size="lg"
											onClick={showAbout}
											className="group mt-8 hidden lg:inline-flex"
										>
											Дэлгэрэнгүй харах
											<ArrowDown
												className="size-4 transition-transform group-hover:translate-y-0.5"
												strokeWidth={2.5}
											/>
										</Button>
									</m.div>

									{/* Нэвтрэх card — "Дэлгэрэнгүй"-д дарахад header болж дээшилнэ */}
									<div className="flex w-full flex-col items-center gap-4 lg:items-end">
										<m.div
											layoutId={SURFACE_ID}
											transition={SURFACE_TRANSITION}
											style={{ borderRadius: 24 }}
											className={cn(
												"w-full max-w-md overflow-hidden border border-border bg-card",
												SURFACE_SHADOW,
											)}
										>
											<m.div layout="position" {...SURFACE_CONTENT}>
												<LoginForm
													onForgot={openForgot}
													onSign={openSign}
													className="rounded-none border-0 bg-transparent shadow-none"
												/>
											</m.div>
										</m.div>

										<m.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1, transition: { delay: 0.3 } }}
											exit={{ opacity: 0 }}
											className="flex w-full max-w-md justify-center lg:hidden"
										>
											<Button
												variant="ghost"
												onClick={showAbout}
												className="group text-muted-foreground"
											>
												Дэлгэрэнгүй харах
												<ArrowDown
													className="size-4 transition-transform group-hover:translate-y-0.5"
													strokeWidth={2.5}
												/>
											</Button>
										</m.div>
									</div>
								</m.main>
							) : (
								<m.div
									key="about"
									exit={{ opacity: 0, transition: { duration: 0.15 } }}
									className="relative"
								>
									{/* Нэвтрэх card-аас морфолсон header */}
									<m.header
										layoutId={SURFACE_ID}
										transition={SURFACE_TRANSITION}
										style={{ borderRadius: 20 }}
										className={cn(
											"fixed inset-x-3 top-3 z-50 mx-auto max-w-6xl overflow-hidden border border-border bg-card/95 backdrop-blur-md sm:inset-x-6",
											SURFACE_SHADOW,
										)}
									>
										<m.div
											layout="position"
											{...SURFACE_CONTENT}
											className="flex h-14 items-center gap-2 px-3 sm:px-4"
										>
											<button
												type="button"
												onClick={() =>
													window.scrollTo({ top: 0, behavior: "smooth" })
												}
												className="shrink-0 rounded-xl px-1 py-1"
												aria-label="Skuul — дээш буцах"
											>
												<Brand />
											</button>

											<nav className="mx-auto hidden items-center gap-1 md:flex">
												{LANDING_SECTIONS.map((s) => (
													<button
														key={s.id}
														type="button"
														onClick={() => scrollToSection(s.id)}
														className="rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														{s.label}
													</button>
												))}
											</nav>

											<div className="ml-auto flex items-center gap-1.5 md:ml-0">
												<ThemeToggle />
												<Button
													variant="ghost"
													size="sm"
													onClick={openSign}
													className="hidden sm:inline-flex"
												>
													Бүртгүүлэх
												</Button>
												<Button size="sm" onClick={showLogin}>
													Нэвтрэх
												</Button>
											</div>
										</m.div>
									</m.header>

									<m.main
										initial={{ opacity: 0, y: 32 }}
										animate={{
											opacity: 1,
											y: 0,
											transition: { delay: 0.18, duration: 0.45 },
										}}
										className="relative pt-20"
									>
										<AboutSections onLogin={showLogin} onSign={openSign} />
									</m.main>
								</m.div>
							)}
						</AnimatePresence>

						{/* Sign Dialog */}
						<Dialog
							open={modal === "sign"}
							onOpenChange={(o) => {
								if (!o) closeModal();
							}}
						>
							<DialogContent
								className={`${authDialogClass} md:max-w-4xl`}
								onInteractOutside={(e) => e.preventDefault()}
							>
								<DialogTitle className="sr-only">Бүртгүүлэх</DialogTitle>
								<DialogDescription className="sr-only">
									Шинэ бүртгэл үүсгэхийн тулд мэдээллээ оруулна уу.
								</DialogDescription>
								<SignForm onClose={closeModal} />
							</DialogContent>
						</Dialog>

						{/* Forgot Dialog */}
						<Dialog
							open={modal === "forgot"}
							onOpenChange={(o) => {
								if (!o) closeModal();
							}}
						>
							<DialogContent
								className={authDialogClass}
								onInteractOutside={(e) => e.preventDefault()}
							>
								<DialogTitle className="sr-only">Нууц үг сэргээх</DialogTitle>
								<DialogDescription className="sr-only">
									Бүртгэлтэй утасны дугаараа оруулж нууц үгээ сэргээнэ үү.
								</DialogDescription>
								<ForgotForm onClose={closeModal} />
							</DialogContent>
						</Dialog>
					</div>
				</LayoutGroup>
			</MotionConfig>
		</LazyMotion>
	);
}
