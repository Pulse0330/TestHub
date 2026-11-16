import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		// Pure logic tests run in node; files that need the DOM opt in with
		// a `// @vitest-environment jsdom` docblock.
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}"],
		exclude: ["node_modules", "e2e/**", ".next/**"],
		restoreMocks: true,
	},
});
