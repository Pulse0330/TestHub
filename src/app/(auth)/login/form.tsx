"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Book, ClipboardList, Clock, Loader2, Lock, LogIn, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type * as React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createSessionRequest, loginToken, loginTokenRequest } from "@/lib/api";
import { setCookie } from "@/lib/cookie";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

const formSchema = z.object({
	username: z.string().min(1, { message: "Нэвтрэх нэр оруулна уу." }),
	password: z.string().min(3, { message: "Нууц үг 3-аас доошгүй тэмдэгттэй байх ёстой." }),
});

type FormValues = z.infer<typeof formSchema>;

function WarningIcon() {
	return (
		<svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Warning</title>
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
		</svg>
	);
}

interface LoginFormProps {
	onClose?: () => void;
}

export function LoginForm({ onClose }: LoginFormProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get("redirect") || "/home";
	const tokenLogin = searchParams.get("token");

	const { setUser, setToken } = useAuthStore();
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { username: "", password: "" },
		mode: "onSubmit",
	});

	useEffect(() => {
		if (searchParams.get("session") === "expired") {
			toast.warning("Та үйлдэл хийгээгүй 5 минут болсон байна. Дахин нэвтэрнэ үү.");
		}
	}, [searchParams]);

	const { mutate, isPending } = useMutation({
		mutationFn: async (values: FormValues) => {
			const loginRes = await loginTokenRequest(values.username, values.password, "", "", 1);
			if (!loginRes?.RetResponse?.ResponseType) throw new Error("Нэвтрэх нэр эсвэл нууц үг буруу байна");
			if (!loginRes?.Data?.[0] || !loginRes.Token) throw new Error("Та түр хүлээгээд дахин оролдоно уу");
			const userData = loginRes.Data[0];
			const token = loginRes.Token;
			const sessionRes = await createSessionRequest(userData.id, token, "", "");
			if (!sessionRes?.RetResponse?.ResponseType) throw new Error("Session үүсгэх амжилтгүй");
			return { userData, token };
		},
		onSuccess: ({ userData, token }) => {
			setUser(userData);
			setToken(token);
			const cookies: [string, string][] = [
				["auth-token", token],
				["user-id", String(userData.id)],
				["firstname", userData.firstname ?? ""],
				["img-url", userData.img_url ?? ""],
			];
			for (const [key, val] of cookies) setCookie(key, val, 7);
			const group = Number(userData.ugroup);
			if (group === 3 || group === 4) {
				router.push("/userProfile");
			} else if (userData.is_enabled === 0) {
				toast.info("Профайл мэдээллээ бөглөнө үү", { description: "Та профайл мэдээллээ бүрэн бөглөсний дараа үндсэн хуудас цэс болон шалгалт , шалгалтын цэсийг дарж шалгалт өгөх боломжтой.", duration: 5000 });
				router.push("/userProfile");
			} else {
				router.push(redirectUrl);
			}
		},
		onError: (error: Error) => {
			form.setError("root", { type: "manual", message: error.message || "Нэвтрэх нэр эсвэл нууц үг буруу байна" });
			form.setValue("password", "");
			form.setFocus("password");
		},
	});

	const { mutate: tokenLoginMutate, isPending: tokenIsLoading } = useMutation({
		mutationFn: async ({ token1 }: { token1: string }) => {
			const loginRes = await loginToken(token1);
			if (!loginRes?.RetResponse?.ResponseType) throw new Error("Нэвтрэх нэр эсвэл нууц үг буруу байна");
			if (!loginRes?.Data?.[0] || !loginRes.Token) throw new Error("Серверээс буруу хариу ирлээ");
			const userData = loginRes.Data[0];
			const token = loginRes.Token;
			const sessionRes = await createSessionRequest(userData.id, token, "", "");
			if (!sessionRes?.RetResponse?.ResponseType) throw new Error("Session үүсгэх амжилтгүй");
			return { userData, token };
		},
		onSuccess: ({ userData, token }) => {
			setUser(userData);
			setToken(token);
			const cookies: [string, string][] = [
				["auth-token", token],
				["user-id", String(userData.id)],
				["firstname", userData.firstname ?? ""],
				["img-url", userData.img_url ?? ""],
			];
			for (const [key, val] of cookies) setCookie(key, val, 7);
			const group = Number(userData.ugroup);
			const isProfileIncomplete = userData.is_enabled === 0;
			if (isProfileIncomplete || group === 5 || group === 4) {
				if (isProfileIncomplete) {
					toast.info("Профайл мэдээллээ бөглөнө үү", { description: "Та профайл мэдээллээ бүрэн бөглөсний дараа үндсэн хуудас болон шалгалт , шалгалтын  жагсаалт хуудас руу орж шалгалтаа өгөх боломжтой .", duration: 5000 });
				}
				router.push("/userProfile");
			} else {
				router.push(redirectUrl);
			}
		},
		onError: (error: Error) => {
			form.setError("root", { type: "manual", message: error.message || "Нэвтрэх нэр эсвэл нууц үг буруу байна" });
			form.setValue("password", "");
			form.setFocus("password");
		},
	});

	useEffect(() => {
		if (tokenLogin) tokenLoginMutate({ token1: tokenLogin });
	}, [tokenLogin, tokenLoginMutate]);

	const onSubmit = (values: FormValues) => mutate(values);
	const hasRootError = !!form.formState.errors.root;
	const errorMessage = form.formState.errors.root?.message;
	const isLoading = isPending || tokenIsLoading;


	return (
		<AuthShell hasError={hasRootError}>
			{onClose && (
				<button type="button" onClick={onClose} className={AUTH_CLOSE_BUTTON_CLASS} aria-label="Хаах">
					<X className="size-4" strokeWidth={2.5} />
				</button>
			)}

			{/* Header */}
			<div className="px-6 pt-6 pr-14 pb-2 sm:px-8 sm:pt-8 sm:pr-14">
				<Image src="/image/logoLogin.png" alt="EXMO" width={110} height={36} className="mb-5 hidden h-8 w-auto md:block" />
				<div className="flex items-center gap-3">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-pop-violet-soft text-2xl shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_35%,transparent)]">
						<span aria-hidden="true">👋</span>
					</div>
					<div className="min-w-0">
						<h2 className="text-2xl font-black tracking-tight text-foreground">Тавтай морилно уу</h2>
						<p className="text-sm font-semibold text-muted-foreground">Өөрийн бүртгэлээр нэвтэрч орно уу</p>
					</div>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className="grid gap-4 px-6 pt-5 pb-2 sm:px-8">
						{hasRootError && (
							<div className="flex animate-pop-in items-start gap-2 rounded-2xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
								<WarningIcon />
								<span className="flex-1">{errorMessage}</span>
							</div>
						)}

						<FormField control={form.control} name="username" render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm font-bold text-foreground">Нэвтрэх нэр</FormLabel>
								<div className="relative">
									<FormControl>
										<Input
											placeholder="Нэвтрэх нэр"
											type="text"
											autoComplete="username"
											disabled={isLoading}
											className={`peer pl-11 ${hasRootError ? "border-destructive/60" : ""}`}
											{...field}
										/>
									</FormControl>
									<User className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
								</div>
								<FormMessage />
							</FormItem>
						)} />

						<FormField control={form.control} name="password" render={({ field }) => (
							<FormItem>
								<div className="flex items-center justify-between gap-2">
									<FormLabel className="text-sm font-bold text-foreground">Нууц үг</FormLabel>
									<Link href="/forgot" className="text-xs font-bold text-primary hover:underline">
										Нууц үг мартсан?
									</Link>
								</div>
								<div className="relative">
									<FormControl>
										<Input
											placeholder="••••••••"
											type="password"
											autoComplete="current-password"
											disabled={isLoading}
											className={`peer pl-11 ${hasRootError ? "border-destructive/60 animate-shake" : ""}`}
											{...field}
										/>
									</FormControl>
									<Lock className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
								</div>
								<FormMessage />
							</FormItem>
						)} />

						<Button type="submit" size="lg" className="mt-2 w-full" disabled={isLoading}>
							{isLoading ? <Loader2 className="size-5 animate-spin" /> : <LogIn className="size-5" strokeWidth={2.5} />}
							{isLoading ? "Нэвтэрч байна..." : "Нэвтрэх"}
						</Button>
					</div>
				</form>
			</Form>

			<div className="flex flex-col gap-4 px-6 pt-4 pb-6 sm:px-8 sm:pb-8">
				<div className="relative w-full">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t-2 border-dashed border-border" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-card px-3 font-extrabold tracking-wider text-muted-foreground">Эсвэл</span>
					</div>
				</div>
				<p className="text-center text-sm font-semibold text-muted-foreground">
					Бүртгэл байхгүй юу?{" "}
					<Link href="/sign" className="font-extrabold text-primary hover:underline">
						Бүртгүүлэх
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}

/* ─────────────────────────────────────────────────────────────
   Auth pages-д дундаа хэрэглэгдэх визуал бүрхүүл
   (desktop: өнгөлөг brand panel + форм, mobile: жижиг өнгөлөг толгой)
───────────────────────────────────────────────────────────── */

export const AUTH_INPUT_ICON_CLASS =
	"pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors peer-focus-visible:text-primary";

export const AUTH_CLOSE_BUTTON_CLASS =
	"absolute top-3 right-3 z-20 flex size-9 items-center justify-center rounded-xl border-2 border-border bg-card text-muted-foreground shadow-[0_2px_0_0_var(--border)] transition-all hover:bg-accent hover:text-foreground active:translate-y-px active:shadow-none";

const BRAND_FLOATERS = [
	{ emoji: "📚", className: "top-[12%] right-[12%] text-5xl", delay: "0s" },
	{ emoji: "✏️", className: "top-[42%] right-[6%] text-4xl", delay: "1.4s" },
	{ emoji: "🎯", className: "bottom-[24%] right-[22%] text-4xl", delay: "2.6s" },
	{ emoji: "🏆", className: "bottom-[8%] right-[6%] text-5xl", delay: "0.8s" },
];

const BRAND_CHIPS = [
	{ icon: Clock, label: "Цаг хугацаатай шалгалт" },
	{ icon: ClipboardList, label: "Дасгал ажил" },
	{ icon: Book, label: "Сургалтын агуулга" },
];

function AuthBrandPanel() {
	return (
		<div className="relative hidden min-h-[32rem] flex-col justify-between overflow-hidden bg-gradient-to-br from-pop-violet via-pop-pink to-pop-sun p-8 text-white md:flex lg:p-10">
			{/* Decorative shapes */}
			<div aria-hidden="true" className="pointer-events-none absolute inset-0">
				<div className="absolute -top-20 -left-16 size-56 rounded-full bg-primary-foreground/15" />
				<div className="absolute -right-16 -bottom-24 size-64 rotate-12 rounded-[3rem] bg-primary-foreground/10" />
				<div className="absolute bottom-[40%] left-[8%] size-5 rounded-full bg-primary-foreground/30" />
				<div className="absolute top-[18%] left-[40%] size-3 rounded-full bg-primary-foreground/40" />
				{BRAND_FLOATERS.map((f) => (
					<span
						key={f.emoji}
						className={`absolute animate-float select-none drop-shadow-md ${f.className}`}
						style={{ animationDelay: f.delay }}
					>
						{f.emoji}
					</span>
				))}
			</div>

			<div className="relative">
				<span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-extrabold">
					<span className="size-1.5 rounded-full bg-primary-foreground" />
					Шалгалт · Дасгал ажил · Сургалт — нэг дор
				</span>
			</div>

			<div className="relative max-w-[18rem]">
				<p className="text-6xl leading-none font-black tracking-tight drop-shadow-[0_4px_0_rgb(0_0_0/0.12)]">EXMO</p>
				<p className="mt-4 text-2xl leading-tight font-extrabold">Шалгалт, Сургалт, Дасгал</p>
				<p className="mt-2 hidden text-sm leading-relaxed font-semibold opacity-90 lg:block">
					Сурагч, оюутан, багш нарт зориулсан цахим шалгалт, дасгал ажил, сургалтын нэгдсэн платформ. Хаанаас ч нэвтэрч, мэдлэгээ хэмжээрэй.
				</p>
			</div>

			<div className="relative flex flex-wrap gap-2">
				{BRAND_CHIPS.map(({ icon: Icon, label }) => (
					<span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-1.5 text-xs font-bold">
						<Icon className="size-3.5" strokeWidth={2.5} />
						{label}
					</span>
				))}
			</div>
		</div>
	);
}

function AuthMobileHeader() {
	return (
		<div className="relative overflow-hidden bg-gradient-to-br from-pop-violet via-pop-pink to-pop-sun px-6 py-5 text-white md:hidden">
			<div aria-hidden="true" className="pointer-events-none absolute -top-10 -left-8 size-28 rounded-full bg-primary-foreground/15" />
			<div aria-hidden="true" className="pointer-events-none absolute -right-6 -bottom-12 size-28 rotate-12 rounded-[2rem] bg-primary-foreground/10" />
			<div className="relative flex items-center justify-between gap-3 pr-10">
				<div className="min-w-0">
					<p className="text-3xl leading-none font-black tracking-tight">EXMO</p>
					<p className="mt-1 truncate text-xs font-bold opacity-90">Шалгалт, Сургалт, Дасгал</p>
				</div>
				<div aria-hidden="true" className="flex shrink-0 gap-1 text-2xl">
					<span className="animate-float">📚</span>
					<span className="animate-float [animation-delay:1.2s]">✏️</span>
					<span className="hidden animate-float [animation-delay:2.4s] min-[400px]:inline">🎯</span>
					<span className="hidden animate-float [animation-delay:0.6s] min-[400px]:inline">🏆</span>
				</div>
			</div>
		</div>
	);
}

interface AuthShellProps {
	children: React.ReactNode;
	hasError?: boolean;
	className?: string;
}

export function AuthShell({ children, hasError, className }: AuthShellProps) {
	return (
		<div
			className={cn(
				"w-full animate-pop-in overflow-hidden rounded-3xl border-2 bg-card text-card-foreground shadow-[0_6px_0_0_var(--border)] md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]",
				hasError ? "border-destructive/50" : "border-border",
				className,
			)}
		>
			<AuthBrandPanel />
			<div className="relative flex min-w-0 flex-col">
				<AuthMobileHeader />
				{children}
			</div>
		</div>
	);
}
