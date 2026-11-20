"use client";

import { AlertCircle } from "lucide-react";
import UseAnimations from "react-useanimations";
import loading2 from "react-useanimations/lib/loading2";
import { Button } from "@/components/ui/button";

export function NotLoggedInState() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center p-4">
			<div className="card-pop animate-pop-in max-w-md space-y-4 p-8 text-center">
				<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-pop-sun-soft">
					<AlertCircle className="size-10 text-pop-sun-ink" />
				</div>
				<div>
					<h3 className="mb-2 text-2xl font-black">
						Хэрэглэгч нэвтрээгүй байна
					</h3>
					<p className="text-muted-foreground">Та эхлээд системд нэвтэрнэ үү</p>
				</div>
			</div>
		</div>
	);
}

export function LoadingState() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center">
			<div className="flex flex-col items-center space-y-6">
				<div className="relative">
					<div className="absolute inset-0 rounded-full bg-primary/15 animate-pulse" />
					<UseAnimations
						animation={loading2}
						size={80}
						strokeColor="var(--primary)"
						loop
					/>
				</div>
				<div className="space-y-2 text-center">
					<p className="text-xl font-black animate-pulse">Ачааллаж байна...</p>
					<p className="text-sm text-muted-foreground">
						Шалгалтын дэлгэрэнгүй мэдээллийг уншиж байна
					</p>
				</div>
			</div>
		</div>
	);
}

export function ErrorState({
	message,
	onBack,
}: {
	message: string;
	onBack: () => void;
}) {
	return (
		<div className="flex min-h-[60vh] items-center justify-center p-4">
			<div className="card-pop animate-pop-in w-full max-w-md space-y-4 p-8 text-center">
				<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-destructive/15">
					<AlertCircle className="w-10 h-10 text-destructive" />
				</div>
				<h3 className="text-2xl font-black text-destructive">Алдаа гарлаа</h3>
				<p className="text-sm text-destructive/80">{message}</p>
				<Button onClick={onBack}>Буцах</Button>
			</div>
		</div>
	);
}

export function NotFoundState({
	message,
	onBack,
}: {
	message: string | undefined;
	onBack: () => void;
}) {
	return (
		<div className="flex min-h-[60vh] items-center justify-center p-4">
			<div className="card-pop animate-pop-in max-w-md space-y-6 p-8 text-center">
				<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-pop-sun-soft">
					<AlertCircle className="size-10 text-pop-sun-ink" />
				</div>
				<h3 className="text-2xl font-black">Мэдээлэл олдсонгүй</h3>
				<p className="text-muted-foreground">
					{message || "Шалгалтын дэлгэрэнгүй мэдээлэл олдсонгүй"}
				</p>
				<Button onClick={onBack}>Буцах</Button>
			</div>
		</div>
	);
}
