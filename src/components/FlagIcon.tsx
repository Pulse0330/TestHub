// Улсын тугийн жижиг SVG дүрс.
// Windows дээр туг emoji (🇬🇧) "GB" гэж үсгээр харагддаг тул SVG ашиглана.
import { cn } from "@/lib/utils";

export type FlagCode = "gb" | "ru" | "cn" | "jp" | "kr" | "de" | "fr" | "mn";

const FLAGS: Record<FlagCode, React.ReactNode> = {
	gb: (
		<>
			<rect width="60" height="40" fill="#012169" />
			<path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="8" />
			<path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" strokeWidth="3" />
			<path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="12" />
			<path d="M30 0V40M0 20H60" stroke="#C8102E" strokeWidth="7" />
		</>
	),
	ru: (
		<>
			<rect width="60" height="40" fill="#fff" />
			<rect y="13.33" width="60" height="13.34" fill="#0039A6" />
			<rect y="26.67" width="60" height="13.33" fill="#D52B1E" />
		</>
	),
	cn: (
		<>
			<rect width="60" height="40" fill="#DE2910" />
			<path
				fill="#FFDE00"
				d="M10 5l1.76 5.42h5.7l-4.61 3.35 1.76 5.42L10 15.84l-4.61 3.35 1.76-5.42-4.61-3.35h5.7z"
			/>
			<circle cx="20" cy="4" r="1.6" fill="#FFDE00" />
			<circle cx="24" cy="8" r="1.6" fill="#FFDE00" />
			<circle cx="24" cy="14" r="1.6" fill="#FFDE00" />
			<circle cx="20" cy="18" r="1.6" fill="#FFDE00" />
		</>
	),
	jp: (
		<>
			<rect width="60" height="40" fill="#fff" />
			<circle cx="30" cy="20" r="12" fill="#BC002D" />
		</>
	),
	kr: (
		<>
			<rect width="60" height="40" fill="#fff" />
			<path d="M20 20a10 10 0 0 1 20 0z" fill="#CD2E3A" />
			<path d="M20 20a10 10 0 0 0 20 0z" fill="#0047A0" />
			<circle cx="25" cy="20" r="5" fill="#CD2E3A" />
			<circle cx="35" cy="20" r="5" fill="#0047A0" />
			<g stroke="#000" strokeWidth="2">
				<path d="M6 8l6-4M7 10l6-4M8 12l6-4" />
				<path d="M46 28l6 4M47 26l6 4M48 24l6 4" />
				<path d="M46 12l6-4M47 14l6-4M48 16l6-4" />
				<path d="M6 32l6 4M7 30l6 4M8 28l6 4" />
			</g>
		</>
	),
	de: (
		<>
			<rect width="60" height="13.34" fill="#000" />
			<rect y="13.33" width="60" height="13.34" fill="#DD0000" />
			<rect y="26.67" width="60" height="13.33" fill="#FFCE00" />
		</>
	),
	fr: (
		<>
			<rect width="20" height="40" fill="#0055A4" />
			<rect x="20" width="20" height="40" fill="#fff" />
			<rect x="40" width="20" height="40" fill="#EF4135" />
		</>
	),
	mn: (
		<>
			<rect width="60" height="40" fill="#C4272F" />
			<rect x="20" width="20" height="40" fill="#015197" />
			<g fill="#F9CF02">
				<circle cx="10" cy="14" r="3" />
				<path d="M10 7l1.2 3h-2.4z" />
				<rect x="6" y="19" width="8" height="2" />
				<rect x="6" y="30" width="8" height="2" />
				<rect x="4" y="19" width="1.6" height="13" />
				<rect x="14.4" y="19" width="1.6" height="13" />
				<circle cx="10" cy="25.5" r="3" />
			</g>
		</>
	),
};

export function FlagIcon({
	code,
	className,
}: {
	code: FlagCode;
	className?: string;
}) {
	return (
		<svg
			viewBox="0 0 60 40"
			aria-hidden="true"
			className={cn(
				"h-5 w-[30px] shrink-0 overflow-hidden rounded-[4px] shadow-[0_0_0_1px_rgb(0_0_0/0.12)]",
				className,
			)}
		>
			<defs>
				<clipPath id={`flag-${code}`}>
					<rect width="60" height="40" rx="4" />
				</clipPath>
			</defs>
			<g clipPath={`url(#flag-${code})`}>{FLAGS[code]}</g>
		</svg>
	);
}
