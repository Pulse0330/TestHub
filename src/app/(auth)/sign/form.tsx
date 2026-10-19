"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
	KeyRound,
	Loader2,
	Lock,
	Mail,
	MessageSquare,
	Phone,
	ShieldCheck,
	User,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";
import * as z from "zod";
import {
	AUTH_CLOSE_BUTTON_CLASS,
	AUTH_INPUT_ICON_CLASS,
	AuthShell,
} from "@/app/(auth)/login/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { registerSysUserRequest } from "@/lib/api";

const formSchema = z
	.object({
		phone: z
			.string()
			.min(8, { message: "Утасны дугаар 8 оронтой байх ёстой." })
			.regex(/^[0-9]+$/, { message: "Зөвхөн тоо оруулна уу." }),
		lastname: z.string().min(1, { message: "Овог оруулна уу." }),
		firstname: z.string().min(1, { message: "Нэр оруулна уу." }),
		email: z.string().email({ message: "Хүчинтэй имэйл хаяг оруулна уу." }),
		password: z
			.string()
			.min(6, { message: "Нууц үг 6-аас доошгүй тэмдэгттэй байх ёстой." }),
		confirmPassword: z
			.string()
			.min(1, { message: "Нууц үг дахин оруулна уу." }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Нууц үг таарахгүй байна",
		path: ["confirmPassword"],
	});

const getDeviceInfo = () => {
	const parser = new UAParser();
	const device = parser.getDevice();
	const os = parser.getOS();
	const browser = parser.getBrowser();
	if (device.model) return device.model;
	return `${os.name || "Unknown"} - ${browser.name || "Unknown"}`;
};

const isMobileDevice = () => {
	const parser = new UAParser();
	const device = parser.getDevice();
	return device.type === "mobile" || device.type === "tablet" ? 1 : 0;
};

interface SignFormProps {
	onClose?: () => void;
}

export function SignForm({ onClose }: SignFormProps) {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);
	const [isWaitingForSMS, setIsWaitingForSMS] = useState(false);
	const [isVerified, setIsVerified] = useState(false);
	const [isChecking, setIsChecking] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");
	const [timeLeft, setTimeLeft] = useState(0);
	const [isTeacher, setIsTeacher] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			phone: "",
			lastname: "",
			firstname: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		mode: "onSubmit",
	});

	useEffect(() => {
		if (timeLeft <= 0) return;
		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					setIsWaitingForSMS(false);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [timeLeft]);

	const handleRequestCode = async () => {
		const phone = form.getValues("phone");
		const phoneValidation = await form.trigger("phone");
		if (!phoneValidation) return;
		setIsChecking(true);
		try {
			const response = await axios.post("/api/otp/getcode", {
				phone: Number(phone),
				conftype: "1",
				bundleid: "ikh_skuul.mn",
				devicemodel: getDeviceInfo(),
				ismob: isMobileDevice(),
			});
			if (response.data.RetResponse?.ResponseType) {
				setVerificationCode(response.data.RetResponse.RtrGenCode);
				setTimeLeft(Number(response.data.RetResponse.RtrGenCodeSeconds || 180));
				setIsWaitingForSMS(true);
				toast.success(response.data.RetResponse.ResponseMessage);
			} else {
				toast.error(
					response.data.RetResponse?.ResponseMessage ||
						"Код үүсгэхэд алдаа гарлаа",
				);
			}
		} catch {
			toast.error("Код үүсгэхэд алдаа гарлаа");
		} finally {
			setIsChecking(false);
		}
	};

	const handleCheckVerification = async () => {
		if (!verificationCode) {
			toast.error("Эхлээд код үүсгэнэ үү");
			return;
		}
		setIsChecking(true);
		try {
			const response = await axios.post("/api/otp/smscheck", {
				phone: Number(form.getValues("phone")),
				code: Number(verificationCode),
			});
			if (response.data.RetResponse?.ResponseType) {
				toast.success("Утасны дугаар баталгаажлаа!");
				setIsVerified(true);
				setIsWaitingForSMS(false);
				setTimeLeft(0);
			} else {
				toast.error("Баталгаажуулалт амжилтгүй");
			}
		} catch {
			toast.error("Баталгаажуулахад алдаа гарлаа");
		} finally {
			setIsChecking(false);
		}
	};

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		if (!isVerified) {
			toast.error("Эхлээд утасны дугаараа баталгаажуулна уу");
			return;
		}
		setIsPending(true);
		try {
			const data = await registerSysUserRequest(
				values.email,
				values.firstname,
				values.lastname,
				values.phone,
				values.password,
				isTeacher ? "4" : "0",
			);
			if (data?.RetResponse?.ResponseType) {
				toast.success("Амжилттай бүртгэгдлээ! Нэвтрэнэ үү.");
				router.push("/login");
			} else {
				toast.error(
					data?.RetResponse?.ResponseMessage || "Бүртгэл үүсгэхэд алдаа гарлаа",
				);
			}
		} catch {
			toast.error("Серверт холбогдоход алдаа гарлаа");
		} finally {
			setIsPending(false);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<AuthShell>
			{onClose && (
				<button type="button" onClick={onClose} className={AUTH_CLOSE_BUTTON_CLASS} aria-label="Хаах">
					<X className="size-4" strokeWidth={2.5} />
				</button>
			)}

			<div className="px-6 pt-6 pr-14 pb-2 sm:px-8 sm:pt-8 sm:pr-14">
				<Image src="/image/asd.png" alt="EXMO" width={110} height={36} className="mb-5 hidden h-8 w-auto md:block" />
				<div className="flex items-center gap-3">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-pop-mint-soft text-2xl shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-mint)_35%,transparent)]">
						<span aria-hidden="true">🚀</span>
					</div>
					<div className="min-w-0">
						<h2 className="text-2xl font-black tracking-tight text-foreground">Бүртгүүлэх</h2>
						<p className="text-sm font-semibold text-muted-foreground">Шинэ бүртгэл үүсгэх</p>
					</div>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className="grid gap-4 px-6 pt-5 pb-2 sm:px-8">
						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-foreground">Утасны дугаар</FormLabel>
									<div className="relative">
										<FormControl>
											<Input
												placeholder="88888888"
												type="tel"
												{...field}
												disabled={isPending || isVerified}
												maxLength={8}
												className="peer pl-11 text-base tracking-wider"
											/>
										</FormControl>
										<Phone className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>

						{!isVerified && (
							<div className="space-y-3">
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={handleRequestCode}
									disabled={isChecking || isWaitingForSMS}
								>
									{isChecking && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									{isWaitingForSMS ? (
										<>
											<MessageSquare className="mr-2 h-4 w-4" />
											{formatTime(timeLeft)}
										</>
									) : (
										"Баталгаажуулах код авах"
									)}
								</Button>
								{isWaitingForSMS && verificationCode && (
									<Alert className="animate-pop-in rounded-2xl border-2 border-pop-sky/40 bg-pop-sky-soft">
										<AlertDescription className="py-2">
											<div className="space-y-4">
												<div className="flex gap-3">
													<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pop-sky text-xs font-black text-primary-foreground">
														1
													</div>
													<p className="text-sm leading-relaxed font-semibold text-foreground">
														Доорх кодыг{" "}
														<span className="font-black text-pop-sky-ink">
															142076
														</span>{" "}
														дугаарт мессежээр илгээнэ үү.
													</p>
												</div>
												<div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-pop-sky bg-card p-4">
													<span className="text-3xl font-black tracking-widest text-pop-sky-ink select-all">
														{verificationCode}
													</span>
												</div>
												<div className="flex gap-3 pt-2">
													<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pop-sky text-xs font-black text-primary-foreground">
														2
													</div>
													<div className="flex-1 space-y-3">
														<p className="text-sm font-semibold text-foreground">
															Мессеж илгээсний дараа доорх товчийг дарж
															баталгаажуулна уу.
														</p>
														<Button
															type="button"
															className="w-full"
															onClick={handleCheckVerification}
															disabled={isChecking}
														>
															{isChecking ? (
																<>
																	<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																	Шалгаж байна...
																</>
															) : (
																"Баталгаажуулалт шалгах"
															)}
														</Button>
													</div>
												</div>
											</div>
										</AlertDescription>
									</Alert>
								)}
							</div>
						)}

						{isVerified && (
							<Alert className="animate-pop-in rounded-2xl border-2 border-success/30 bg-success/10 text-success">
								<ShieldCheck className="h-4 w-4 text-success" />
								<AlertDescription className="font-bold text-success">
									Утасны дугаар амжилттай баталгаажлаа
								</AlertDescription>
							</Alert>
						)}

						{isVerified && (
							<>
								<div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
									<FormField
										control={form.control}
										name="lastname"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm font-bold text-foreground">Овог</FormLabel>
												<div className="relative">
													<FormControl>
														<Input
															placeholder="Овог"
															{...field}
															disabled={isPending}
															className="peer pl-11"
														/>
													</FormControl>
													<Users className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="firstname"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm font-bold text-foreground">Нэр</FormLabel>
												<div className="relative">
													<FormControl>
														<Input
															placeholder="Нэр"
															{...field}
															disabled={isPending}
															className="peer pl-11"
														/>
													</FormControl>
													<User className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm font-bold text-foreground">Имэйл хаяг</FormLabel>
											<div className="relative">
												<FormControl>
													<Input
														placeholder="example@email.com"
														type="email"
														{...field}
														disabled={isPending}
														className="peer pl-11"
													/>
												</FormControl>
												<Mail className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-muted px-4 py-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
									<input
										type="checkbox"
										id="isTeacher"
										checked={isTeacher}
										onChange={(e) => setIsTeacher(e.target.checked)}
										disabled={isPending}
										className="size-5 cursor-pointer rounded accent-primary"
									/>
									<label
										htmlFor="isTeacher"
										className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-bold text-foreground select-none"
									>
										<span aria-hidden="true">🧑‍🏫</span>
										Багшаар бүртгүүлэх
									</label>
								</div>
								<div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm font-bold text-foreground">Нууц үг</FormLabel>
												<div className="relative">
													<FormControl>
														<Input
															placeholder="••••••"
															type="password"
															{...field}
															disabled={isPending}
															className="peer pl-11"
														/>
													</FormControl>
													<Lock className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="confirmPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm font-bold text-foreground">Давтах</FormLabel>
												<div className="relative">
													<FormControl>
														<Input
															placeholder="••••••"
															type="password"
															{...field}
															disabled={isPending}
															className="peer pl-11"
														/>
													</FormControl>
													<KeyRound className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<Button
									type="submit"
									size="lg"
									className="mt-2 w-full"
									disabled={isPending}
								>
									{isPending ? (
										<Loader2 className="size-5 animate-spin" />
									) : (
										<UserPlus className="size-5" strokeWidth={2.5} />
									)}
									{isPending ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
								</Button>
							</>
						)}
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
					Бүртгэлтэй юу?{" "}
					<Link href="/login" className="font-extrabold text-primary hover:underline">
						Нэвтрэх
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}
