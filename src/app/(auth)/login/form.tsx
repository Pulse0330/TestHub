"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
	Book,
	ClipboardList,
	Clock,
	Loader2,
	Lock,
	LogIn,
	User,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type * as React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createSessionRequest, loginToken, loginTokenRequest } from "@/lib/api";
import { IDLE_TIMEOUT_MINUTES } from "@/lib/auth";
import { setCookie } from "@/lib/cookie";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

const formSchema = z.object({
	username: z.string().min(1, { message: "Нэвтрэх нэр оруулна уу." }),
	password: z
		.string()
		.min(3, { message: "Нууц үг 3-аас доошгүй тэмдэгттэй байх ёстой." }),
});

type FormValues = z.infer<typeof formSchema>;

function WarningIcon() {
	return (
		<svg
			className="h-4 w-4 shrink-0 mt-0.5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<title>Warning</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
			/>
		</svg>
	);
}

/** Зөвхөн өөрийн домэйн доторх зам руу redirect хийнэ (open redirect-ээс хамгаална). */
function safeRedirect(raw: string | null): string {
	if (
		!raw ||
		!raw.startsWith("/") ||
		raw.startsWith("//") ||
		raw.startsWith("/\\")
	) {
		return "/home";
	}
	return raw;
}

interface LoginFormProps {
	/** "Нууц үг мартсан?" — нууц үг сэргээх dialog нээнэ */
	onForgot?: () => void;
	/** "Бүртгүүлэх" — бүртгэлийн dialog нээнэ */
	onSign?: () => void;
	className?: string;
}

/** Энгийн, тайван нэвтрэх card (landing хуудасны эхний дэлгэц). */
export function LoginForm({ onForgot, onSign, className }: LoginFormProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectUrl = safeRedirect(searchParams.get("redirect"));
	const tokenLogin = searchParams.get("token");

	const setUser = useAuthStore((s) => s.setUser);
	const setToken = useAuthStore((s) => s.setToken);
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { username: "", password: "" },
		mode: "onSubmit",
	});

	useEffect(() => {
		if (searchParams.get("session") === "expired") {
			toast.warning(
				`Та үйлдэл хийгээгүй ${IDLE_TIMEOUT_MINUTES} минут болсон байна. Дахин нэвтэрнэ үү.`,
			);
		}
	}, [searchParams]);

	const { mutate, isPending } = useMutation({
		mutationFn: async (values: FormValues) => {
			const loginRes = await loginTokenRequest(
				values.username,
				values.password,
				"",
				"",
				1,
			);
			if (!loginRes?.RetResponse?.ResponseType)
				throw new Error("Нэвтрэх нэр эсвэл нууц үг буруу байна");
			if (!loginRes?.Data?.[0] || !loginRes.Token)
				throw new Error("Та түр хүлээгээд дахин оролдоно уу");
			const userData = loginRes.Data[0];
			const token = loginRes.Token;
			const sessionRes = await createSessionRequest(userData.id, token, "", "");
			if (!sessionRes?.RetResponse?.ResponseType)
				throw new Error("Session үүсгэх амжилтгүй");
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
				toast.info("Профайл мэдээллээ бөглөнө үү", {
					description:
						"Та профайл мэдээллээ бүрэн бөглөсний дараа үндсэн хуудас цэс болон шалгалт , шалгалтын цэсийг дарж шалгалт өгөх боломжтой.",
					duration: 5000,
				});
				router.push("/userProfile");
			} else {
				router.push(redirectUrl);
			}
		},
		onError: (error: Error) => {
			form.setError("root", {
				type: "manual",
				message: error.message || "Нэвтрэх нэр эсвэл нууц үг буруу байна",
			});
			form.setValue("password", "");
			form.setFocus("password");
		},
	});

	const { mutate: tokenLoginMutate, isPending: tokenIsLoading } = useMutation({
		mutationFn: async ({ token1 }: { token1: string }) => {
			const loginRes = await loginToken(token1);
			if (!loginRes?.RetResponse?.ResponseType)
				throw new Error("Нэвтрэх нэр эсвэл нууц үг буруу байна");
			if (!loginRes?.Data?.[0] || !loginRes.Token)
				throw new Error("Серверээс буруу хариу ирлээ");
			const userData = loginRes.Data[0];
			const token = loginRes.Token;
			const sessionRes = await createSessionRequest(userData.id, token, "", "");
			if (!sessionRes?.RetResponse?.ResponseType)
				throw new Error("Session үүсгэх амжилтгүй");
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
					toast.info("Профайл мэдээллээ бөглөнө үү", {
						description:
							"Та профайл мэдээллээ бүрэн бөглөсний дараа үндсэн хуудас болон шалгалт , шалгалтын  жагсаалт хуудас руу орж шалгалтаа өгөх боломжтой .",
						duration: 5000,
					});
				}
				router.push("/userProfile");
			} else {
				router.push(redirectUrl);
			}
		},
		onError: (error: Error) => {
			form.setError("root", {
				type: "manual",
				message: error.message || "Нэвтрэх нэр эсвэл нууц үг буруу байна",
			});
			form.setValue("password", "");
			form.setFocus("password");
		},
	});

	useEffect(() => {
		if (!tokenLogin) return;
		// Token-ийг хаягийн мөр/түүхээс шууд арилгана (Referer, history-д үлдээхгүй)
		const url = new URL(window.location.href);
		url.searchParams.delete("token");
		window.history.replaceState(window.history.state, "", url.toString());
		tokenLoginMutate({ token1: tokenLogin });
	}, [tokenLogin, tokenLoginMutate]);

	const onSubmit = (values: FormValues) => mutate(values);
	const hasRootError = !!form.formState.errors.root;
	const errorMessage = form.formState.errors.root?.message;
	const isLoading = isPending || tokenIsLoading;

	return (
		<div
			className={cn(
				"w-full rounded-3xl border bg-card text-card-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.18)]",
				hasRootError ? "border-destructive/50" : "border-border",
				className,
			)}
		>
			{/* Header */}
			<div className="px-6 pt-7 pb-1 sm:px-8 sm:pt-8">
				<h2 className="text-2xl font-black tracking-tight text-foreground">
					Нэвтрэх
				</h2>
				<p className="mt-1 text-sm font-semibold text-muted-foreground">
					Өөрийн бүртгэлээр нэвтэрч орно уу
				</p>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className="grid gap-4 px-6 pt-5 pb-2 sm:px-8">
						{hasRootError && (
							<div
								role="alert"
								className="flex animate-pop-in items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive"
							>
								<WarningIcon />
								<span className="flex-1">{errorMessage}</span>
							</div>
						)}

						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-foreground">
										Нэвтрэх нэр
									</FormLabel>
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
							)}
						/>

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center justify-between gap-2">
										<FormLabel className="text-sm font-bold text-foreground">
											Нууц үг
										</FormLabel>
										{onForgot && (
											<button
												type="button"
												onClick={onForgot}
												className="text-xs font-bold text-primary hover:underline"
											>
												Нууц үг мартсан?
											</button>
										)}
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
							)}
						/>

						<Button
							type="submit"
							size="lg"
							className="mt-2 w-full"
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="size-5 animate-spin" />
							) : (
								<LogIn className="size-5" strokeWidth={2.5} />
							)}
							{isLoading ? "Нэвтэрч байна..." : "Нэвтрэх"}
						</Button>
					</div>
				</form>
			</Form>

			{onSign && (
				<p className="px-6 pt-3 pb-7 text-center text-sm font-semibold text-muted-foreground sm:px-8 sm:pb-8">
					Бүртгэл байхгүй юу?{" "}
					<button
						type="button"
						onClick={onSign}
						className="font-extrabold text-primary hover:underline"
					>
						Бүртгүүлэх
					</button>
				</p>
			)}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────
   Бүртгэл / нууц үг сэргээх dialog-д дундаа хэрэглэгдэх бүрхүүл
   (desktop: тайван brand panel + форм, mobile: жижиг толгой)
───────────────────────────────────────────────────────────── */

export const AUTH_INPUT_ICON_CLASS =
	"pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors peer-focus-visible:text-primary";

export const AUTH_CLOSE_BUTTON_CLASS =
	"absolute top-3 right-3 z-20 flex size-9 items-center justify-center rounded-xl border-2 border-border bg-card text-muted-foreground shadow-[0_2px_0_0_var(--border)] transition-all hover:bg-accent hover:text-foreground active:translate-y-px active:shadow-none";

const BRAND_CHIPS = [
	{ icon: Clock, label: "Цаг хугацаатай шалгалт" },
	{ icon: ClipboardList, label: "Дасгал ажил" },
	{ icon: Book, label: "Сургалтын агуулга" },
];

function AuthBrandPanel() {
	return (
		<div className="relative hidden min-h-[32rem] flex-col justify-between overflow-hidden border-r border-border bg-muted/60 p-8 md:flex lg:p-10">
			<Image
				src="/image/logoLogin.png"
				alt=""
				width={177}
				height={142}
				className="h-12 w-auto self-start"
			/>

			<div className="relative max-w-[18rem]">
				<p className="text-5xl leading-none font-black tracking-tight text-foreground">
					Skuul
				</p>
				<p className="mt-4 text-xl leading-snug font-extrabold text-foreground">
					Шалгалт, сорил, дасгал — нэг дор
				</p>
				<p className="mt-2 hidden text-sm leading-relaxed font-semibold text-muted-foreground lg:block">
					Сурагч, оюутан, багш нарт зориулсан цахим шалгалт, дасгал ажил,
					сургалтын нэгдсэн платформ.
				</p>
			</div>

			<div className="relative flex flex-wrap gap-2">
				{BRAND_CHIPS.map(({ icon: Icon, label }) => (
					<span
						key={label}
						className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground"
					>
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
		<div className="flex items-center gap-3 border-b border-border bg-muted/60 px-6 py-4 pr-14 md:hidden">
			<Image
				src="/image/logoLogin.png"
				alt=""
				width={177}
				height={142}
				className="h-8 w-auto"
			/>
			<div className="min-w-0">
				<p className="text-xl leading-none font-black tracking-tight text-foreground">
					Skuul
				</p>
				<p className="mt-1 truncate text-xs font-bold text-muted-foreground">
					Шалгалт, сорил, дасгал — нэг дор
				</p>
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
				"w-full animate-pop-in overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.18)] md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]",
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
