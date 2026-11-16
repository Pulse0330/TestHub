import { deleteCookie } from "@/lib/cookie";
import { useAuthStore } from "@/stores/useAuthStore";

/** Идэвхгүй байх хугацаа — үүний дараа автоматаар гаргана. */
export const IDLE_TIMEOUT_MINUTES = 60;
export const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

/** Бүх tab-ийн хамгийн сүүлийн идэвхийн хугацааг хадгалах localStorage key. */
export const LAST_ACTIVITY_KEY = "last-activity";

const AUTH_COOKIES = ["auth-token", "user-id", "firstname", "img-url"] as const;

/**
 * Нэвтрэлтийн мэдээллийг (cookie, store, localStorage) бүрэн цэвэрлэнэ.
 * `wipeStorage` үед хуваалцсан компьютер дээр өмнөх хэрэглэгчийн
 * өгөгдөл үлдэхгүйн тулд бүх local/session storage-ийг цэвэрлэнэ.
 */
export function clearSession({ wipeStorage = false } = {}) {
	for (const name of AUTH_COOKIES) deleteCookie(name);
	try {
		useAuthStore.getState().clearAuth();
		if (wipeStorage) {
			localStorage.clear();
			sessionStorage.clear();
		} else {
			localStorage.removeItem("auth-storage");
			localStorage.removeItem(LAST_ACTIVITY_KEY);
		}
	} catch (e) {
		console.error("Logout алдаа:", e);
	}
}
