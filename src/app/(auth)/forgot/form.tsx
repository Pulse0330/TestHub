"use client";
import Link from "next/link";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
	ArrowLeft,
	Eye,
	EyeOff,
	KeyRound,
	Loader2,
	Lock,
	MessageSquare,
	Phone,
	ShieldCheck,
	X,
} from "lucide-react";

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
import { Forgotpassword } from "@/lib/api";

const formSchema = z
	.object({
		phone: z
			.string()
			.length(8, { message: "Утасны дугаар яг 8 оронтой байх ёстой." })
			.regex(/^[0-9]+$/, { message: "Зөвхөн тоо оруулна уу." }),
		password: z
			.string()
			.min(6, { message: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой." })
			.max(50, { message: "Нууц үг хэтэрхий урт байна." }),
		confirmPassword: z.string(),
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

interface ForgotFormProps {
	onClose?: () => void;
}

export default function ForgotForm({ onClose }: ForgotFormProps) {
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isWaitingForSMS, setIsWaitingForSMS] = useState(false);
	const [isVerified, setIsVerified] = useState(
		process.env.NODE_ENV === "development",
	);
	const [isChecking, setIsChecking] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");
	const [timeLeft, setTimeLeft] = useState(0);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { phone: "", password: "", confirmPassword: "" },
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
		const phoneValidation = await form.trigger("phone");
		if (!phoneValidation) return;
		setIsChecking(true);
		try {
			const response = await axios.post("/api/otp/getcode", {
				phone: Number(form.getValues("phone")),
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

	const resetPasswordMutation = useMutation({
		mutationFn: async ({
			phone,
			password,
		}: {
			phone: string;
			password: string;
		}) => {
			return await Forgotpassword(phone, password);
		},
		onSuccess: (data) => {
			if (
				data?.RetResponse?.StatusCode === "200" &&
				data?.RetResponse?.ResponseType === true
			) {
				setIsSubmitted(true);
				toast.success(
					data.RetResponse.ResponseMessage || "Нууц үг амжилттай солигдлоо",
				);
			} else {
				toast.error(
					data?.RetResponse?.ResponseMessage || "Нууц үг солихоо алдаа гарлаа",
				);
			}
		},
		onError: () => {
			toast.error("Нууц үг солихоо алдаа гарлаа");
		},
	});

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		if (!isVerified) {
			toast.error("Эхлээд утасны дугаараа баталгаажуулна уу");
			return;
		}
		resetPasswordMutation.mutate({
			phone: values.phone,
			password: values.password,
		});
	};

	const formatTime = (seconds: number) =>
		`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
	const isPending = resetPasswordMutation.isPending;

	if (isSubmitted) {
		return (
			<AuthShell>
				{onClose && (
					<button
						type="button"
						onClick={onClose}
						className={AUTH_CLOSE_BUTTON_CLASS}
						aria-label="Хаах"
					>
						<X className="size-4" strokeWidth={2.5} />
					</button>
				)}
				<div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center sm:px-8">
					<Image
						src="/image/logoLogin.png"
						alt="EXMO logo"
						width={120}
						height={40}
						className="mx-auto mb-6 h-9 w-auto"
					/>
					<div className="relative mx-auto mb-5 flex size-20 animate-pop-in items-center justify-center rounded-full bg-success/15 text-success shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_35%,transparent)]">
						<svg
							className="size-10"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							role="img"
							aria-label="Check mark"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={3}
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<span aria-hidden="true" className="absolute -top-2 -right-3 animate-float text-2xl">
							🎉
						</span>
					</div>
					<h2 className="text-2xl font-black tracking-tight text-foreground">
						Амжилттай солигдлоо
					</h2>
					<p className="mt-2 max-w-xs text-sm font-semibold text-muted-foreground">
						Таны нууц үг амжилттай солигдлоо. Одоо шинэ нууц үгээрээ нэвтэрч
						болно.
					</p>
					<Button asChild size="lg" className="mt-6 w-full">
						<Link href="/login">
							<ArrowLeft className="size-5" strokeWidth={2.5} />
							Нэвтрэх хуудас руу буцах
						</Link>
					</Button>
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell>
			{onClose && (
				<button
					type="button"
					onClick={onClose}
					className={AUTH_CLOSE_BUTTON_CLASS}
					aria-label="Хаах"
				>
					<X className="size-4" strokeWidth={2.5} />
				</button>
			)}

			<div className="px-6 pt-6 pr-14 pb-2 sm:px-8 sm:pt-8 sm:pr-14">
				<Image
					src="/image/logoLogin.png"
					alt="EXMO logo"
					width={120}
					height={40}
					className="mb-5 hidden h-8 w-auto md:block"
				/>
				<div className="flex items-center gap-3">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-pop-sun-soft text-2xl shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_40%,transparent)]">
						<span aria-hidden="true">🔑</span>
					</div>
					<div className="min-w-0">
						<h2 className="text-2xl font-black tracking-tight text-foreground">
							Нууц үг сэргээх
						</h2>
						<p className="text-sm font-semibold text-muted-foreground">
							Бүртгэлтэй утасны дугаараа оруулна уу
						</p>
					</div>
				</div>
			</div>

			<Form {...form}>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit(onSubmit)(e);
					}}
				>
					<div className="grid gap-4 px-6 pt-5 pb-2 sm:px-8">
						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-foreground">
										Утасны дугаар
									</FormLabel>
									<div className="relative">
										<FormControl>
											<Input
												placeholder="88888888"
												type="tel"
												{...field}
												disabled={isPending || isVerified}
												maxLength={8}
												className="peer pl-11 text-lg tracking-wider"
												onChange={(e) => {
													const value = e.target.value.replace(/\D/g, "");
													field.onChange(value);
												}}
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
													<p className="text-sm font-semibold text-foreground">
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
															Мессеж илгээсний дараа доорх товчийг дарна уу.
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
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm font-bold text-foreground">
												Шинэ нууц үг
											</FormLabel>
											<div className="relative">
												<FormControl>
													<Input
														placeholder="••••••••"
														type={showPassword ? "text" : "password"}
														{...field}
														disabled={isPending}
														className="peer pr-11 pl-11"
													/>
												</FormControl>
												<Lock className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
													onClick={() => setShowPassword(!showPassword)}
													disabled={isPending}
													tabIndex={-1}
												>
													{showPassword ? (
														<EyeOff className="h-4 w-4" />
													) : (
														<Eye className="h-4 w-4" />
													)}
												</Button>
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
											<FormLabel className="text-sm font-bold text-foreground">
												Нууц үг баталгаажуулах
											</FormLabel>
											<div className="relative">
												<FormControl>
													<Input
														placeholder="••••••••"
														type={showConfirmPassword ? "text" : "password"}
														{...field}
														disabled={isPending}
														className="peer pr-11 pl-11"
													/>
												</FormControl>
												<KeyRound className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
													onClick={() =>
														setShowConfirmPassword(!showConfirmPassword)
													}
													disabled={isPending}
													tabIndex={-1}
												>
													{showConfirmPassword ? (
														<EyeOff className="h-4 w-4" />
													) : (
														<Eye className="h-4 w-4" />
													)}
												</Button>
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button
									type="submit"
									size="lg"
									className="mt-2 w-full"
									disabled={isPending}
								>
									{isPending ? (
										<Loader2 className="size-5 animate-spin" />
									) : (
										<ShieldCheck className="size-5" strokeWidth={2.5} />
									)}
									{isPending ? "Солиж байна..." : "Нууц үг солих"}
								</Button>
							</>
						)}
					</div>
				</form>
			</Form>

			<div className="flex flex-col gap-3 px-6 pt-4 pb-6 sm:px-8 sm:pb-8">
				<div className="relative w-full">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t-2 border-dashed border-border" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-card px-3 font-extrabold tracking-wider text-muted-foreground">
							Эсвэл
						</span>
					</div>
				</div>
				<Button asChild variant="link" className="w-full">
					<Link href="/login">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Нэвтрэх хуудас руу буцах
					</Link>
				</Button>
			</div>
		</AuthShell>
	);
}
