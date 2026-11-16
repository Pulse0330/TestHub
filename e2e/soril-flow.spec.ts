import { expect, test } from "@playwright/test";

/**
 * Full happy-path flow against the REAL backend:
 *   login → soril list → open soril detail dialog → start.
 *
 * Runs only when credentials are provided, e.g. (Git Bash):
 *   E2E_USERNAME=student1 E2E_PASSWORD=secret bun run test:e2e
 *
 * Use a dedicated test account: pressing "start" really starts (or resumes)
 * a soril attempt for that user on the server.
 *
 * Note: login sends ugroup 3/4 users and users with is_enabled === 0 to
 * /userProfile instead of the redirect target, so the account must be a
 * regular, fully-enabled student.
 */

const USERNAME = process.env.E2E_USERNAME;
const PASSWORD = process.env.E2E_PASSWORD;

test.describe("soril flow (needs E2E_USERNAME / E2E_PASSWORD)", () => {
	test.skip(
		!USERNAME || !PASSWORD,
		"Set E2E_USERNAME and E2E_PASSWORD to run the backend-backed flow",
	);

	test("login → soril list → detail dialog → start", async ({ page }) => {
		test.setTimeout(120_000);

		// 1. Log in, asking to come back to the soril list afterwards
		await page.goto("/login?redirect=/Lists/sorilList");
		await page.getByRole("button", { name: "Нэвтрэх", exact: true }).click();
		const loginDialog = page.getByRole("dialog");
		await loginDialog.getByPlaceholder("Нэвтрэх нэр").fill(USERNAME ?? "");
		await loginDialog.getByPlaceholder("••••••••").fill(PASSWORD ?? "");
		await loginDialog
			.getByRole("button", { name: "Нэвтрэх", exact: true })
			.click();

		// 2. Redirect target honoured (same-origin path)
		await expect(page).toHaveURL(/\/Lists\/sorilList/, { timeout: 30_000 });

		// 3. Open the first soril that is not payment-locked.
		//    Unlocked cards have aria-label "<name> сорил нээх".
		const card = page.getByRole("button", { name: /сорил нээх$/ }).first();
		await expect(card).toBeVisible({ timeout: 30_000 });
		await card.click();

		// 4. Detail dialog is shown with a primary action
		const detail = page.getByRole("dialog");
		await expect(detail).toBeVisible();
		await expect(detail.getByRole("button", { name: "Болих" })).toBeVisible();
		// Label is "Эхлүүлэх" / "Үргэлжлүүлэх" / "Дахин эхлүүлэх", or the
		// backend-provided flag_name — so pick the last non-"Болих" footer button.
		const primary = detail
			.getByRole("button")
			.filter({ hasNotText: "Болих" })
			.filter({ hasNotText: /^Close$/ })
			.last();
		await expect(primary).toBeEnabled();

		// 5. Start → navigates to /soril/<exam_id>
		await primary.click();
		await expect(page).toHaveURL(/\/soril\/\d+/, { timeout: 30_000 });
	});

	test("off-site redirect param is ignored after login", async ({ page }) => {
		await page.goto("/login?redirect=https://evil.example");
		await page.getByRole("button", { name: "Нэвтрэх", exact: true }).click();
		const loginDialog = page.getByRole("dialog");
		await loginDialog.getByPlaceholder("Нэвтрэх нэр").fill(USERNAME ?? "");
		await loginDialog.getByPlaceholder("••••••••").fill(PASSWORD ?? "");
		await loginDialog
			.getByRole("button", { name: "Нэвтрэх", exact: true })
			.click();

		// safeRedirect() falls back to /home for non-relative targets
		await expect(page).toHaveURL(/\/home/, { timeout: 30_000 });
		expect(page.url()).not.toContain("evil.example");
	});
});
