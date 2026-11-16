import { expect, test } from "@playwright/test";

/**
 * Smoke tests that need no backend: they only exercise the auth proxy
 * (src/proxy.ts) and the public landing/login page.
 */

test.describe("unauthenticated access", () => {
	test("protected /home redirects to /login?redirect=/home", async ({
		page,
		context,
	}) => {
		await context.clearCookies();
		await page.goto("/home");

		await expect(page).toHaveURL(/\/login\?/);
		const url = new URL(page.url());
		expect(url.pathname).toBe("/login");
		expect(url.searchParams.get("redirect")).toBe("/home");
	});

	test("login page renders and opens the login form", async ({ page }) => {
		await page.goto("/login");

		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

		// The nav "Нэвтрэх" (Log in) button opens the login dialog
		await page.getByRole("button", { name: "Нэвтрэх", exact: true }).click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog.getByPlaceholder("Нэвтрэх нэр")).toBeVisible();
		await expect(dialog.getByPlaceholder("••••••••")).toBeVisible();
		await expect(
			dialog.getByRole("button", { name: "Нэвтрэх", exact: true }),
		).toBeVisible();
	});

	test("login page with an off-site redirect param still renders", async ({
		page,
		baseURL,
	}) => {
		// The open-redirect guard (safeRedirect in login/form.tsx) only kicks in
		// after a successful login, which needs a real backend — see
		// soril-flow.spec.ts. Here we only check the page does not navigate away.
		await page.goto("/login?redirect=https://evil.example");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		expect(new URL(page.url()).origin).toBe(new URL(baseURL ?? "").origin);
	});
});
