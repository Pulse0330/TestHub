import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_API_URL: "https://clickup.ecm.mn/api",
		NEXT_PUBLIC_OTP_API_URL: "https://api-message.ecm.mn",
		NEXT_PUBLIC_EXAM_API_URL: "https://clickup.ecm.mn",
	},
	images: {
		unoptimized: true,
		qualities: [75, 90],
	},
	reactStrictMode: true,

	experimental: {
		// Build бүр цэвэр эхэлнэ — хуучин .next/cache (жишээ нь өмнөх
		// node_modules-ийн замууд) build-ийг эвдэхээс сэргийлнэ.
		turbopackFileSystemCacheForBuild: false,
	},

	compiler: {
		removeConsole:
			process.env.NODE_ENV === "production"
				? {
						exclude: ["error", "warn"],
					}
				: false,
	},

	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{ key: "X-DNS-Prefetch-Control", value: "on" },
					{ key: "X-Frame-Options", value: "SAMEORIGIN" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Referrer-Policy", value: "origin-when-cross-origin" },
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
				],
			},
		];
	},
};

export default nextConfig;
