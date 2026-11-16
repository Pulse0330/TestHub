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

	test("login page shows the login card first", async ({ page }) => {
		await page.goto("/login");

		await expect(page.getByRole("heading", { name: "Нэвтрэх" })).toBeVisible();
		await expect(page.getByPlaceholder("Нэвтрэх нэр")).toBeVisible();
		await expect(page.getByPlaceholder("••••••••")).toBeVisible();
	});

	test("«Дэлгэрэнгүй харах» turns the card into a header and back", async ({
		page,
	}) => {
		await page.goto("/login");
		await page
			.getByRole("button", { name: "Дэлгэрэнгүй харах" })
			.first()
			.click();

		const header = page.locator("header");
		await expect(header).toBeVisible();
		await expect(page).toHaveURL(/#about$/);
		await expect(page.getByPlaceholder("Нэвтрэх нэр")).toHaveCount(0);

		// Header-ийн «Нэвтрэх» → нэвтрэх card буцна
		await header.getByRole("button", { name: "Нэвтрэх" }).click();
		await expect(page.getByPlaceholder("Нэвтрэх нэр")).toBeVisible();
		await expect(page).not.toHaveURL(/#about$/);

		// Хөтчийн Back товч мөн буцаана
		await page
			.getByRole("button", { name: "Дэлгэрэнгүй харах" })
			.first()
			.click();
		await expect(page).toHaveURL(/#about$/);
		await page.goBack();
		await expect(page.getByPlaceholder("Нэвтрэх нэр")).toBeVisible();
	});

	test("«Нууц үг мартсан?» opens the reset dialog (no 404 page)", async ({
		page,
	}) => {
		await page.goto("/login");
		await page.getByRole("button", { name: "Нууц үг мартсан?" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		expect(new URL(page.url()).pathname).toBe("/login");
	});

	test("login page with an off-site redirect param still renders", async ({
		page,
		baseURL,
	}) => {
		// The open-redirect guard (safeRedirect in login/form.tsx) only kicks in
		// after a successful login, which needs a real backend — see
		// soril-flow.spec.ts. Here we only check the page does not navigate away.
		await page.goto("/login?redirect=https://evil.example");
		await expect(page.getByPlaceholder("Нэвтрэх нэр")).toBeVisible();
		expect(new URL(page.url()).origin).toBe(new URL(baseURL ?? "").origin);
	});
});
