import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * E2E tests. By default starts the app with `next dev` on PORT (3000), or
 * reuses a dev server already listening there (Next 16 refuses to start a
 * second `next dev` in the same project directory).
 * Set E2E_BASE_URL to run against an already running server instead.
 *
 * Artifacts go under node_modules/.cache so they never show up as
 * untracked files in git.
 */
export default defineConfig({
	testDir: "./e2e",
	outputDir: "node_modules/.cache/playwright/test-results",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: [
		["list"],
		[
			"html",
			{ open: "never", outputFolder: "node_modules/.cache/playwright/report" },
		],
	],
	timeout: 60_000,
	use: {
		baseURL: BASE_URL,
		trace: "retain-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: process.env.E2E_BASE_URL
		? undefined
		: {
				command: `bun run dev --port ${PORT}`,
				url: `${BASE_URL}/login`,
				reuseExistingServer: !process.env.CI,
				timeout: 180_000,
			},
});
