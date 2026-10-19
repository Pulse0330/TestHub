"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, User } from "lucide-react";
import UseAnimations from "react-useanimations";
import loading2 from "react-useanimations/lib/loading2";
import { Button } from "@/components/ui/button";
import { getUserProfile } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { UserProfileResponseType } from "@/types/user";
import { ProfileContent } from "./form";

export default function UserProfilePage() {
	const { userId } = useAuthStore();

	const { data, isLoading, isError, error, refetch } =
		useQuery<UserProfileResponseType>({
			queryKey: ["userProfilePage", userId],
			queryFn: () => getUserProfile(userId || 0),
			enabled: !!userId,
			retry: 2,
		});

	if (!userId) {
		return (
			<div className="flex items-center justify-center min-h-[70vh] px-4">
				<div className="card-pop w-full max-w-md space-y-6 p-8 text-center animate-pop-in">
					<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-pop-violet-soft text-pop-violet-ink">
						<User className="size-10" strokeWidth={2.5} />
					</div>
					<div className="space-y-2">
						<h3 className="text-xl font-black text-foreground">
							Нэвтрээгүй байна
						</h3>
						<p className="text-sm font-semibold text-muted-foreground">
							Профайл үзэхийн тулд системд нэвтэрнэ үү
						</p>
					</div>
					<Button className="mt-2 w-full" size="lg">
						Нэвтрэх
					</Button>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 px-4">
				<div className="flex size-24 items-center justify-center rounded-3xl bg-pop-violet-soft shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_30%,transparent)]">
					<UseAnimations
						animation={loading2}
						size={56}
						strokeColor="var(--primary)"
						loop
					/>
				</div>
				<div className="text-center space-y-1">
					<p className="text-base font-black text-foreground">
						Профайл уншиж байна
					</p>
					<p className="text-sm font-semibold text-muted-foreground">Түр хүлээнэ үү...</p>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex items-center justify-center min-h-[70vh] px-4">
				<div className="max-w-lg w-full">
					<div className="card-pop space-y-6 p-8 animate-pop-in">
						<div className="flex flex-col items-center text-center space-y-4">
							<div className="flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
								<AlertCircle className="size-10" strokeWidth={2.5} />
							</div>
							<div className="space-y-2">
								<h3 className="text-xl font-black text-foreground">
									Алдаа гарлаа
								</h3>
								<p className="text-sm font-semibold text-muted-foreground max-w-md">
									{error instanceof Error
										? error.message
										: "Тодорхойгүй алдаа гарлаа. Дахин оролдоно уу."}
								</p>
							</div>
						</div>
						<div className="flex justify-center">
							<Button
								onClick={() => refetch()}
								variant="outline"
								className="gap-2"
							>
								<RefreshCw className="size-4" strokeWidth={2.5} />
								Дахин оролдох
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const user = data?.RetData?.[0];
	const isSuccess = data?.RetResponse?.ResponseType === true;

	if (!isSuccess || !user) {
		return (
			<div className="flex items-center justify-center min-h-[70vh] px-4">
				<div className="max-w-lg w-full">
					<div className="card-pop space-y-6 p-8 animate-pop-in">
						<div className="flex flex-col items-center text-center space-y-4">
							<div className="flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
								<AlertCircle className="size-10" strokeWidth={2.5} />
							</div>
							<div className="space-y-2">
								<h3 className="text-xl font-black text-foreground">
									Профайл татахад алдаа гарлаа
								</h3>
								<p className="text-sm font-semibold text-muted-foreground">
									Таны профайл мэдээлэл олдсонгүй
								</p>
							</div>
						</div>
						<div className="flex justify-center">
							<Button
								onClick={() => refetch()}
								variant="outline"
								className="gap-2"
							>
								<RefreshCw className="size-4" strokeWidth={2.5} />
								Дахин оролдох
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return <ProfileContent user={user} userId={userId} />;
}
