"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createSessionRequest, loginToken, loginTokenRequest } from "@/lib/api";
import { setCookie } from "@/lib/cookie";
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
		<Card className={`w-full max-w-sm bg-white dark:bg-[#0d1117] shadow-2xl rounded-2xl overflow-hidden border ${hasRootError ? "border-red-300 dark:border-red-800" : "border-gray-200 dark:border-neutral-800"}`}>
			{/* Header */}
			<CardHeader className="relative px-6 pt-6 pb-5 border-b border-gray-100 dark:border-neutral-800">
				{onClose && (
					<button
						type="button"
						onClick={onClose}
						className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all"
						aria-label="Хаах"
					>
						<X className="w-4 h-4" />
					</button>
				)}
				<Image src="/image/logoLogin.png" alt="EXMO" width={110} height={36} className="h-9 w-auto mb-4" />
				<h2 className="text-lg font-bold text-gray-900 dark:text-white">Тавтай морилно уу</h2>
				<p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Өөрийн бүртгэлээр нэвтэрч орно уу</p>
			</CardHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<CardContent className="px-6 pt-5 pb-2 grid gap-4">
						{hasRootError && (
							<div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
								<WarningIcon />
								<span className="flex-1">{errorMessage}</span>
							</div>
						)}

						<FormField control={form.control} name="username" render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm font-medium text-gray-700 dark:text-neutral-300">Нэвтрэх нэр</FormLabel>
								<FormControl>
									<Input
										placeholder="Нэвтрэх нэр"
										type="text"
										autoComplete="username"
										disabled={isLoading}
										className={`h-10 bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 focus:border-emerald-500 dark:focus:border-emerald-500 ${hasRootError ? "border-red-300 dark:border-red-800" : ""}`}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)} />

						<FormField control={form.control} name="password" render={({ field }) => (
							<FormItem>
								<div className="flex items-center justify-between">
									<FormLabel className="text-sm font-medium text-gray-700 dark:text-neutral-300">Нууц үг</FormLabel>
									<Link href="/forgot" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
										Нууц үг мартсан?
									</Link>
								</div>
								<FormControl>
									<Input
										placeholder="••••••••"
										type="password"
										autoComplete="current-password"
										disabled={isLoading}
										className={`h-10 bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 focus:border-emerald-500 dark:focus:border-emerald-500 ${hasRootError ? "border-red-300 dark:border-red-800 animate-shake" : ""}`}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)} />

						<Button
							type="submit"
							className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors mt-1"
							disabled={isLoading}
						>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{isLoading ? "Нэвтэрч байна..." : "Нэвтрэх"}
						</Button>
					</CardContent>
				</form>
			</Form>

			<CardFooter className="px-6 pt-4 pb-5 flex-col gap-4">
				<div className="relative w-full">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t border-gray-200 dark:border-neutral-700" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-white dark:bg-[#0d1117] px-2 text-gray-400 dark:text-neutral-500 tracking-wider">Эсвэл</span>
					</div>
				</div>
				<p className="text-sm text-center text-gray-500 dark:text-neutral-400">
					Бүртгэл байхгүй юу?{" "}
					<Link href="/sign" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
						Бүртгүүлэх
					</Link>
				</p>
			</CardFooter>
		</Card>
	);
}