// Хичээлийн нэрээр дүрс (emoji) ба өнгө тодорхойлох туслах
// Шинэ хичээл нэмэгдвэл RULES-д түлхүүр үг нэмэхэд хангалттай.

import type { FlagCode } from "@/components/FlagIcon";

export type LessonTone = "violet" | "sky" | "mint" | "sun" | "coral" | "pink";

export interface LessonVisual {
	emoji: string;
	/** Гадаад хэлний хичээлд улсын туг (emoji-гийн оронд) */
	flag?: FlagCode;
	tone: LessonTone;
	/** Сонгогдоогүй үеийн зөөлөн дэвсгэр + бичвэр */
	soft: string;
	/** Сонгогдсон үеийн хатуу дэвсгэр + бичвэр */
	solid: string;
	/** Сонгогдсон үеийн доод "3D" сүүдэр */
	shadow: string;
	/** Hover хүрээ */
	hoverBorder: string;
}

const TONES: Record<LessonTone, Omit<LessonVisual, "emoji" | "tone" | "flag">> = {
	violet: {
		soft: "bg-pop-violet-soft text-pop-violet-ink",
		solid: "bg-pop-violet text-white border-pop-violet",
		shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_60%,black)]",
		hoverBorder: "hover:border-pop-violet/60",
	},
	sky: {
		soft: "bg-pop-sky-soft text-pop-sky-ink",
		solid: "bg-pop-sky text-white border-pop-sky",
		shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sky)_60%,black)]",
		hoverBorder: "hover:border-pop-sky/60",
	},
	mint: {
		soft: "bg-pop-mint-soft text-pop-mint-ink",
		solid: "bg-pop-mint text-white border-pop-mint",
		shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-mint)_60%,black)]",
		hoverBorder: "hover:border-pop-mint/60",
	},
	sun: {
		soft: "bg-pop-sun-soft text-pop-sun-ink",
		solid: "bg-pop-sun text-[oklch(0.3_0.08_70)] border-pop-sun",
		shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_60%,black)]",
		hoverBorder: "hover:border-pop-sun/70",
	},
	coral: {
		soft: "bg-pop-coral-soft text-pop-coral-ink",
		solid: "bg-pop-coral text-white border-pop-coral",
		shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-coral)_60%,black)]",
		hoverBorder: "hover:border-pop-coral/60",
	},
	pink: {
		soft: "bg-pop-pink-soft text-pop-pink-ink",
		solid: "bg-pop-pink text-white border-pop-pink",
		shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-pink)_60%,black)]",
		hoverBorder: "hover:border-pop-pink/60",
	},
};

const ROTATION: LessonTone[] = ["violet", "sky", "mint", "sun", "coral", "pink"];

// [түлхүүр үгс (жижиг үсгээр), emoji, өнгө]
const RULES: Array<[string[], string, LessonTone, FlagCode?]> = [
	[["бүгд", "бүх", "all"], "✨", "violet"],
	[["математик", "алгебр", "геометр", "math"], "📐", "violet"],
	[["физик", "physics"], "⚡", "sky"],
	[["хими", "chemistry"], "🧪", "mint"],
	[["биологи", "biology"], "🧬", "mint"],
	[["газар зүй", "газарзүй", "geography"], "🌍", "sky"],
	[["түүх", "history"], "🏛️", "sun"],
	[["нийгэм", "иргэний"], "🤝", "sun"],
	[["монгол хэл", "уран зохиол", "утга зохиол", "монгол бичиг"], "📖", "coral"],
	[["англи", "english"], "🔤", "pink", "gb"],
	[["орос", "russian"], "🔤", "pink", "ru"],
	[["хятад", "chinese"], "🔤", "pink", "cn"],
	[["япон", "japanese"], "🔤", "pink", "jp"],
	[["солонгос", "korean"], "🔤", "pink", "kr"],
	[["герман", "german"], "🔤", "pink", "de"],
	[["франц", "french"], "🔤", "pink", "fr"],
	[["хэл"], "💬", "pink"],
	[["мэдээлэл", "програм", "компьютер", "it"], "💻", "sky"],
	[["эдийн засаг", "бизнес", "economics"], "📊", "sun"],
	[["урлаг", "зураг", "дуу", "хөгжим"], "🎨", "coral"],
	[["биеийн тамир", "спорт"], "⚽", "mint"],
	[["эрүүл мэнд"], "🩺", "coral"],
];

export function getLessonVisual(name: string | null | undefined, id = 0): LessonVisual {
	const n = (name ?? "").toLowerCase();
	for (const [keys, emoji, tone, flag] of RULES) {
		if (keys.some((k) => n.includes(k))) return { emoji, flag, tone, ...TONES[tone] };
	}
	const tone = ROTATION[Math.abs(id) % ROTATION.length];
	return { emoji: "📚", tone, ...TONES[tone] };
}
