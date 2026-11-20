"use client";

// ЗӨВХӨН ХӨГЖҮҮЛЭЛТЭД: URL-аар шууд нэвтэрнэ (production build-д 404).
// Жишээ:
//   /dev-login                         → багш, /teacher руу
//   /dev-login?role=manager            → менежер
//   /dev-login?role=student&to=/home   → сурагч
//   /dev-login?user_id=12&school_id=3&sch_name=...&name=...&login=...

import { useQueryClient } from "@tanstack/react-query";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { setCookie } from "@/lib/cookie";
import { useAuthStore } from "@/stores/useAuthStore";
import type { User } from "@/types/login/loginToken/loginToken";

const ROLE_GROUP = { manager: 3, teacher: 4, student: 5 } as const;

function DevLogin() {
	const params = useSearchParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const setUser = useAuthStore((s) => s.setUser);
	const setToken = useAuthStore((s) => s.setToken);

	useEffect(() => {
		const role = (params.get("role") ?? "teacher") as keyof typeof ROLE_GROUP;
		const ugroup = ROLE_GROUP[role] ?? 4;
		const id = Number(params.get("user_id") ?? 1);
		const name = params.get("name") ?? "Dev";
		const user = {
			id,
			fname: name,
			firstname: name,
			lastname: "",
			ugroup,
			school_id: Number(params.get("school_id") ?? 1),
			sch_name: params.get("sch_name") ?? "Dev сургууль",
			login_name: params.get("login") ?? "dev",
			is_enabled: 1,
			img_url: "",
		} as unknown as User;
		const token = "dev-token";

		queryClient.clear();
		setUser(user);
		setToken(token);
		setCookie("auth-token", token, 7);
		setCookie("user-id", String(id), 7);
		setCookie("firstname", name, 7);
		setCookie("img-url", "", 7);

		const to = params.get("to") ?? (ugroup === 5 ? "/home" : "/teacher");
		router.replace(to.startsWith("/") ? to : "/teacher");
	}, [params, router, queryClient, setUser, setToken]);

	return (
		<p className="p-8 text-sm font-semibold text-muted-foreground">
			Dev нэвтрэлт…
		</p>
	);
}

export default function DevLoginPage() {
	if (process.env.NODE_ENV !== "development") notFound();
	return (
		<Suspense>
			<DevLogin />
		</Suspense>
	);
}
