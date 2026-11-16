"use client";

import { m } from "framer-motion";
import {
	BarChart3,
	BookOpen,
	Building2,
	CheckCircle2,
	ChevronDown,
	ClipboardList,
	Clock,
	GraduationCap,
	Presentation,
	ShieldCheck,
	Smartphone,
	UserPlus,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Landing хуудасны агуулга ("Дэлгэрэнгүй харах"-ын дараа).
   Тайван өнгө: саармаг гадаргуу, үндсэн өнгө зөвхөн товч/онцлолд.
───────────────────────────────────────────────────────────── */

export const LANDING_SECTIONS = [
	{ id: "features", label: "Боломжууд" },
	{ id: "audience", label: "Хэнд зориулсан" },
	{ id: "steps", label: "Хэрхэн ажилладаг" },
	{ id: "faq", label: "Түгээмэл асуулт" },
] as const;

const STATS = [
	{ num: "8,400+", label: "Бүртгэлтэй сурагч" },
	{ num: "1,200+", label: "Шалгалтын сан" },
	{ num: "340+", label: "Сургалтын агуулга" },
	{ num: "99.9%", label: "Системийн найдвартай байдал" },
];

const FEATURES = [
	{
		icon: Clock,
		title: "Цаг хугацаатай шалгалт",
		desc: "Олон төрлийн асуулттай шалгалтыг онлайнаар өгнө. Хугацаа дуусмагц автоматаар илгээгдэж, дүн шууд гарна.",
	},
	{
		icon: ClipboardList,
		title: "Сорил",
		desc: "Элсэлтийн шалгалтын сорилын сангаар өөрийгөө сорьж, сул талаа илрүүлнэ.",
	},
	{
		icon: BookOpen,
		title: "Сургалтын агуулга",
		desc: "Видео хичээл, гарын авлага, дасгалуудыг нэг дор үзэж суралцана.",
	},
	{
		icon: BarChart3,
		title: "Дүн ба явцын тайлан",
		desc: "Шалгалт бүрийн дэлгэрэнгүй үр дүн, алдсан асуулт, явцаа нэг дороос харна.",
	},
	{
		icon: ShieldCheck,
		title: "Найдвартай хадгалалт",
		desc: "Хариулт тань автоматаар хадгалагдана — холболт тасарсан ч алдагдахгүй.",
	},
	{
		icon: Smartphone,
		title: "Хаанаас ч",
		desc: "Компьютер, таблет, утас — бүх төхөөрөмжид тохирсон.",
	},
];

const AUDIENCE = [
	{
		icon: GraduationCap,
		title: "Сурагч, оюутан",
		points: [
			"Шалгалт, сорил онлайнаар өгөх",
			"Алдаагаа тайлбартай нь давтах",
			"Ахицаа хянах",
		],
	},
	{
		icon: Presentation,
		title: "Багш",
		points: [
			"Дасгал ажил, шалгалт хуваарилах",
			"Сурагчдын дүнг нэг дороос харах",
			"Сургалтын агуулга түгээх",
		],
	},
	{
		icon: Building2,
		title: "Сургууль",
		points: [
			"Нэгдсэн шалгалт зохион байгуулах",
			"Өөрийн системээс холбогдох",
			"Тайлан, статистик",
		],
	},
];

const STEPS = [
	{
		icon: UserPlus,
		title: "Бүртгүүлэх",
		desc: "Утасны дугаараа баталгаажуулж, хэдхэн минутад бүртгэл үүсгэнэ.",
	},
	{
		icon: BookOpen,
		title: "Суралцах",
		desc: "Хичээл үзэж, дасгал ажлаа гүйцэтгэн мэдлэгээ бэхжүүлнэ.",
	},
	{
		icon: CheckCircle2,
		title: "Шалгалт өгөх",
		desc: "Тогтоосон хугацаанд шалгалт өгч, дүнгээ тэр дор нь мэднэ.",
	},
];

const FAQ = [
	{
		q: "Хэрхэн бүртгүүлэх вэ?",
		a: "«Бүртгүүлэх» товчийг дарж, утасны дугаараа баталгаажуулаад мэдээллээ бөглөхөд хангалттай.",
	},
	{
		q: "Нууц үгээ мартсан бол яах вэ?",
		a: "Нэвтрэх хэсгийн «Нууц үг мартсан?» холбоосоор орж, утасны дугаараа баталгаажуулан шинэ нууц үг үүсгэнэ.",
	},
	{
		q: "Шалгалтын үеэр интернэт тасарвал яах вэ?",
		a: "Хариулт тань автоматаар хадгалагдаж, холболт сэргэмэгц дахин илгээгдэнэ. Харин шалгалтын хугацаа зогсохгүйг анхаарна уу.",
	},
	{
		q: "Төлбөртэй шалгалт, хичээлийн төлбөрийг яаж төлөх вэ?",
		a: "QPay-ээр — банкны аппаараа QR код уншуулан төлнө. Төлбөр баталгаажмагц шууд нээгдэнэ.",
	},
	{
		q: "Утсаар ашиглаж болох уу?",
		a: "Болно. Skuul нь компьютер, таблет, утасны аль алинд тохирсон.",
	},
];

/** Харагдах үедээ зөөлөн гарч ирэх хэсэг. */
function Reveal({
	id,
	className,
	children,
}: {
	id?: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<m.section
			id={id}
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
			className={cn("scroll-mt-24", className)}
		>
			{children}
		</m.section>
	);
}

function SectionHeading({
	eyebrow,
	title,
	center,
}: {
	eyebrow: string;
	title: string;
	center?: boolean;
}) {
	return (
		<div className={cn("mb-8 sm:mb-10", center && "text-center")}>
			<p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
				{eyebrow}
			</p>
			<h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
				{title}
			</h2>
		</div>
	);
}

/** Шалгалтын дэлгэцийн жижиг загвар — платформ ямар харагддагийг үзүүлнэ. */
function ExamPreview() {
	const options = ["x = 1, x = 6", "x = 2, x = 3", "x = −2, x = −3", "x = 0"];
	return (
		<div
			aria-hidden="true"
			className="w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_40px_-16px_rgb(0_0_0/0.2)]"
		>
			<div className="mb-4 flex items-center justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-extrabold text-foreground">
						Математик · Сорил 3
					</p>
					<p className="text-xs font-semibold text-muted-foreground">
						Асуулт 7 / 30
					</p>
				</div>
				<span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold tabular-nums text-foreground">
					<Clock className="size-3.5" strokeWidth={2.5} />
					24:15
				</span>
			</div>
			<div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
				<div className="h-full w-[23%] rounded-full bg-primary" />
			</div>
			<p className="mb-3 text-sm font-bold text-foreground">
				x² − 5x + 6 = 0 тэгшитгэлийн шийдийг олно уу.
			</p>
			<div className="grid gap-2">
				{options.map((o, i) => {
					const selected = i === 1;
					return (
						<div
							key={o}
							className={cn(
								"flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold",
								selected
									? "border-primary bg-primary/5 text-foreground"
									: "border-border text-muted-foreground",
							)}
						>
							<span
								className={cn(
									"flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-black",
									selected
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground",
								)}
							>
								{String.fromCharCode(65 + i)}
							</span>
							{o}
						</div>
					);
				})}
			</div>
			<p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
				<CheckCircle2 className="size-3.5" strokeWidth={2.5} />
				Хариулт автоматаар хадгалагдлаа
			</p>
		</div>
	);
}

interface AboutSectionsProps {
	onLogin: () => void;
	onSign: () => void;
}

export function AboutSections({ onLogin, onSign }: AboutSectionsProps) {
	return (
		<div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-12">
			{/* HERO */}
			<Reveal className="grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-2 lg:gap-16">
				<div>
					<p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-muted-foreground">
						<span className="size-1.5 rounded-full bg-primary" />
						Шалгалт · Сорил · Дасгал — нэг дор
					</p>
					<h1 className="mb-5 text-4xl leading-[1.05] font-black tracking-tighter text-balance text-foreground sm:text-5xl">
						Суралцах, шалгуулах бүх зүйл нэг платформд
					</h1>
					<p className="mb-8 max-w-lg text-base leading-relaxed font-semibold text-muted-foreground">
						Skuul нь сурагч, багш, сургуульд зориулсан цахим шалгалт, сорил,
						дасгал ажил, сургалтын нэгдсэн платформ. Хаанаас ч нэвтэрч, мэдлэгээ
						хэмжээрэй.
					</p>
					<div className="flex flex-col gap-3 sm:flex-row">
						<Button size="lg" onClick={onLogin}>
							Нэвтрэх
						</Button>
						<Button size="lg" variant="outline" onClick={onSign}>
							Бүртгүүлэх
						</Button>
					</div>
				</div>
				<div className="flex justify-center lg:justify-end">
					<ExamPreview />
				</div>
			</Reveal>

			{/* STATS */}
			<Reveal className="grid grid-cols-2 gap-3 pb-12 sm:grid-cols-4 sm:pb-16">
				{STATS.map((s) => (
					<div
						key={s.label}
						className="rounded-3xl border border-border bg-card p-4 sm:p-5"
					>
						<div className="text-2xl font-black tracking-tight text-foreground tabular-nums sm:text-3xl">
							{s.num}
						</div>
						<div className="mt-1 text-xs font-bold text-muted-foreground">
							{s.label}
						</div>
					</div>
				))}
			</Reveal>

			{/* FEATURES */}
			<Reveal id="features" className="border-t border-border py-12 sm:py-16">
				<SectionHeading
					eyebrow="Платформын боломжууд"
					title="Хэрэгтэй бүх зүйл нэг дор"
				/>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map(({ icon: Icon, title, desc }) => (
						<div
							key={title}
							className="rounded-3xl border border-border bg-card p-5 transition-colors hover:border-foreground/20 sm:p-6"
						>
							<div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
								<Icon className="size-5" strokeWidth={2.25} />
							</div>
							<h3 className="mb-1.5 text-base font-extrabold text-foreground">
								{title}
							</h3>
							<p className="text-sm leading-relaxed font-medium text-muted-foreground">
								{desc}
							</p>
						</div>
					))}
				</div>
			</Reveal>

			{/* AUDIENCE */}
			<Reveal id="audience" className="border-t border-border py-12 sm:py-16">
				<SectionHeading eyebrow="Хэнд зориулсан" title="Хүн бүрт тохирно" />
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{AUDIENCE.map(({ icon: Icon, title, points }) => (
						<div
							key={title}
							className="rounded-3xl border border-border bg-card p-5 sm:p-6"
						>
							<div className="mb-4 flex items-center gap-3">
								<div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
									<Icon className="size-5" strokeWidth={2.25} />
								</div>
								<h3 className="text-lg font-extrabold text-foreground">
									{title}
								</h3>
							</div>
							<ul className="space-y-2">
								{points.map((p) => (
									<li
										key={p}
										className="flex items-start gap-2 text-sm font-semibold text-muted-foreground"
									>
										<CheckCircle2
											className="mt-0.5 size-4 shrink-0 text-foreground/50"
											strokeWidth={2.5}
										/>
										{p}
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</Reveal>

			{/* STEPS */}
			<Reveal id="steps" className="border-t border-border py-12 sm:py-16">
				<SectionHeading
					eyebrow="Хэрхэн ажилладаг"
					title="3 алхамд бэлэн"
					center
				/>
				<ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{STEPS.map(({ icon: Icon, title, desc }, i) => (
						<li
							key={title}
							className="relative rounded-3xl border border-border bg-card p-5 sm:p-6"
						>
							<span className="absolute top-4 right-5 text-4xl font-black text-muted-foreground/25 tabular-nums select-none">
								0{i + 1}
							</span>
							<div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
								<Icon className="size-5" strokeWidth={2.25} />
							</div>
							<h3 className="mb-1.5 text-base font-extrabold text-foreground">
								{title}
							</h3>
							<p className="text-sm leading-relaxed font-medium text-muted-foreground">
								{desc}
							</p>
						</li>
					))}
				</ol>
			</Reveal>

			{/* FAQ */}
			<Reveal id="faq" className="border-t border-border py-12 sm:py-16">
				<SectionHeading eyebrow="Түгээмэл асуулт" title="Асуулт байна уу?" />
				<div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
					{FAQ.map(({ q, a }) => (
						<details key={q} className="group">
							<summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-extrabold text-foreground transition-colors hover:bg-muted/50 sm:px-6 sm:text-base [&::-webkit-details-marker]:hidden">
								{q}
								<ChevronDown
									className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
									strokeWidth={2.5}
								/>
							</summary>
							<p className="px-5 pb-5 text-sm leading-relaxed font-medium text-muted-foreground sm:px-6">
								{a}
							</p>
						</details>
					))}
				</div>
			</Reveal>

			{/* CTA */}
			<Reveal className="py-12 sm:py-16">
				<div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-border bg-muted/50 p-6 sm:flex-row sm:items-center sm:p-10">
					<div>
						<h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
							Өнөөдрөөс эхлээрэй
						</h2>
						<p className="mt-2 text-sm font-semibold text-muted-foreground sm:text-base">
							Бүртгэлтэй бол нэвтэрч, үгүй бол хэдхэн минутад бүртгүүлээрэй.
						</p>
					</div>
					<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
						<Button size="lg" onClick={onLogin}>
							Нэвтрэх
						</Button>
						<Button size="lg" variant="outline" onClick={onSign}>
							Бүртгүүлэх
						</Button>
					</div>
				</div>
			</Reveal>

			{/* FOOTER */}
			<footer className="flex flex-col items-center justify-between gap-3 border-t border-border py-8 sm:flex-row">
				<div className="flex items-center gap-2">
					<Image
						src="/image/logoLogin.png"
						alt=""
						width={177}
						height={142}
						className="h-6 w-auto"
					/>
					<span className="text-sm font-black text-foreground">Skuul</span>
				</div>
				<span className="text-center text-xs font-semibold text-muted-foreground">
					© 2026 Skuul. Бүх эрх хуулиар хамгаалагдсан.
				</span>
			</footer>
		</div>
	);
}
