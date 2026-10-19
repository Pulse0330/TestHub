import { zodResolver } from "@hookform/resolvers/zod";
import {
	IdCard,
	KeyRound,
	Loader2,
	Lock,
	Mail,
	Phone,
	Save,
	User,
	Users,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { AUTH_INPUT_ICON_CLASS, AuthShell } from "@/app/(auth)/login/form";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const formSchema = z
	.object({
		lastname: z.string().min(1, { message: "Овог оруулна уу." }),
		firstname: z.string().min(1, { message: "Нэр оруулна уу." }),
		email: z.string().email({ message: "Хүчинтэй имэйл хаяг оруулна уу." }),
		phone: z
			.string()
			.min(8, { message: "Утасны дугаар 8 оронтой байх ёстой." })
			.regex(/^[0-9]+$/, { message: "Зөвхөн тоо оруулна уу." }),
		regnumber: z.string().min(10, { message: "Регистрийн дугаар оруулна уу." }),
		aimag: z.string().min(1, { message: "Аймаг сонгоно уу." }),
		sum: z.string().min(1, { message: "Сум сонгоно уу." }),
		school: z.string().min(1, { message: "Сургууль сонгоно уу." }),
		angi: z.string().min(1, { message: "Анги сонгоно уу." }),
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

export default function RegistrationForm() {
	const [isPending, setIsPending] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			lastname: "",
			firstname: "",
			email: "",
			phone: "",
			regnumber: "",
			aimag: "",
			sum: "",
			school: "",
			angi: "",
			password: "",
			confirmPassword: "",
		},
		mode: "onSubmit",
		resetOptions: {
			keepDirtyValues: true,
		},
	});

	const handleSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsPending(true);
		setSuccessMessage("");
		setErrorMessage("");

		try {
			const response = await fetch("/api/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(values),
			});

			const data = await response.json();

			if (response.ok) {
				setSuccessMessage("Амжилттай бүртгэгдлээ!");
				form.reset();
			} else {
				setErrorMessage(data?.message || "Бүртгэл үүсгэхэд алдаа гарлаа");
			}
		} catch (error) {
			console.error("Registration error:", error);
			setErrorMessage("Серверт холбогдоход алдаа гарлаа");
		} finally {
			setIsPending(false);
		}
	};

	return (
		<AuthShell>
			<div className="px-6 pt-6 pb-2 sm:px-8 sm:pt-8">
				<div className="flex items-center gap-3">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-pop-pink-soft text-2xl shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-pink)_35%,transparent)]">
						<span aria-hidden="true">✌️</span>
					</div>
					<div className="min-w-0">
						<h2 className="text-gradient text-2xl font-black tracking-tight">
							EXMO
						</h2>
						<p className="text-sm font-semibold text-muted-foreground">
							Та хувийн мэдээллээ бүртгүүлж баталгаажуулна уу
						</p>
					</div>
				</div>
			</div>

			<Form {...form}>
				<div className="space-y-4 px-6 pt-5 pb-6 sm:px-8 sm:pb-8">
					{/* Амжилт/Алдааны мэдэгдэл */}
					{successMessage && (
						<Alert className="animate-pop-in rounded-2xl border-2 border-success/30 bg-success/10">
							<AlertDescription className="font-bold text-success">
								{successMessage}
							</AlertDescription>
						</Alert>
					)}

					{errorMessage && (
						<Alert className="animate-pop-in rounded-2xl border-2 border-destructive/30 bg-destructive/10">
							<AlertDescription className="font-bold text-destructive">
								{errorMessage}
							</AlertDescription>
						</Alert>
					)}

					{/* Овог, Нэр */}
					<div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
						<FormField
							control={form.control}
							name="lastname"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-foreground">Овог</FormLabel>
									<div className="relative">
										<FormControl>
											<Input className="peer pl-11" placeholder="ads" {...field} disabled={isPending} />
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
											<Input className="peer pl-11" placeholder="Нэр" {...field} disabled={isPending} />
										</FormControl>
										<User className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* И-мэйл, Утасны дугаар */}
					<div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-foreground">И-мэйл</FormLabel>
									<div className="relative">
										<FormControl>
											<Input
												className="peer pl-11"
												placeholder="sadadasdw@medle.mn"
												type="email"
												{...field}
												disabled={isPending}
											/>
										</FormControl>
										<Mail className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-foreground">Утасны дугаар</FormLabel>
									<div className="relative">
										<FormControl>
											<Input
												className="peer pl-11"
												placeholder="88683329"
												type="tel"
												maxLength={8}
												{...field}
												disabled={isPending}
											/>
										</FormControl>
										<Phone className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* РД */}
					<FormField
						control={form.control}
						name="regnumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm font-bold text-foreground">РД</FormLabel>
								<div className="relative">
									<FormControl>
										<Input className="peer pl-11" placeholder="РД" {...field} disabled={isPending} />
									</FormControl>
									<IdCard className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
								</div>
								<FormMessage />
								<p className="mt-1 text-xs font-semibold text-muted-foreground">
									Өөрийн ашигладаг и-мэйл хаяг, утасны дугаараа оруулна уу.
								</p>
							</FormItem>
						)}
					/>

					{/* Аймаг/Нийслэл, Сум/Дүүрэг */}
					<div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
						<FormField
							control={form.control}
							name="aimag"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-foreground">Аймаг / Нийслэл</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger disabled={isPending} className="w-full">
												<SelectValue placeholder="Хөвсгөл аймаг" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="ulaanbaatar">Улаанбаатар</SelectItem>
											<SelectItem value="huvsgul">Хөвсгөл аймаг</SelectItem>
											<SelectItem value="darkhan">Дархан-Уул</SelectItem>
											<SelectItem value="orkhon">Орхон</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="sum"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-foreground">Сум / Дүүрэг</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger disabled={isPending} className="w-full">
												<SelectValue placeholder="Ханх сум" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="khan-uul">Хан-Уул</SelectItem>
											<SelectItem value="bayangol">Баянгол</SelectItem>
											<SelectItem value="khankh">Ханх сум</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* Сургууль, Анги */}
					<div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
						<FormField
							control={form.control}
							name="school"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-foreground">Сургууль</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger disabled={isPending} className="w-full">
												<SelectValue placeholder="Сонгоно уу" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="school1">1-р сургууль</SelectItem>
											<SelectItem value="school2">2-р сургууль</SelectItem>
											<SelectItem value="school3">3-р сургууль</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="angi"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-foreground">Анги</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger disabled={isPending} className="w-full">
												<SelectValue placeholder="Бүлэг" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="1a">1-А</SelectItem>
											<SelectItem value="1b">1-Б</SelectItem>
											<SelectItem value="2a">2-А</SelectItem>
											<SelectItem value="2b">2-Б</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* Нууц үг, Нууц үг давтах */}
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
												className="peer pl-11"
												placeholder="Нууц үг"
												type="password"
												{...field}
												disabled={isPending}
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
									<FormLabel className="text-sm font-bold text-foreground">Нууц үг давтах</FormLabel>
									<div className="relative">
										<FormControl>
											<Input
												className="peer pl-11"
												placeholder="Нууц үг"
												type="password"
												{...field}
												disabled={isPending}
											/>
										</FormControl>
										<KeyRound className={AUTH_INPUT_ICON_CLASS} strokeWidth={2.5} />
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* Бүртгүүлэх товч */}
					<Button
						type="submit"
						size="lg"
						className="mt-2 w-full"
						disabled={isPending}
						onClick={(e) => {
							e.preventDefault();
							form.handleSubmit(handleSubmit)();
						}}
					>
						{isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" strokeWidth={2.5} />}
						{isPending ? "Хадгалж байна..." : "ХАДГАЛАХ"}
					</Button>
				</div>
			</Form>
		</AuthShell>
	);
}
