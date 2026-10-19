"use client";

import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-page-gradient transition-colors duration-500 p-4 relative overflow-hidden">
			{/* Decorative floaters */}
			<div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-16 -left-16 size-56 rounded-full bg-pop-violet-soft" />
				<div className="absolute -bottom-20 -right-12 size-72 rotate-12 rounded-[3rem] bg-pop-sun-soft" />
				<div className="absolute top-[18%] right-[14%] size-16 rotate-45 rounded-2xl border-4 border-pop-pink/40" />
				<div className="absolute bottom-[22%] left-[12%] size-6 rounded-full bg-pop-sky/50" />
				<span className="absolute top-[14%] left-[10%] text-4xl sm:text-5xl animate-float">📚</span>
				<span className="absolute top-[26%] right-[8%] text-4xl animate-float [animation-delay:1.3s]">✏️</span>
				<span className="absolute bottom-[16%] left-[18%] text-4xl animate-float [animation-delay:2.4s]">🎯</span>
				<span className="absolute bottom-[12%] right-[16%] text-4xl sm:text-5xl animate-float [animation-delay:0.7s]">🏆</span>
			</div>

			<div className="relative flex flex-col items-center animate-pop-in">
				{/* Big 404 */}
				<div className="relative">
					<p className="text-gradient text-[7rem] sm:text-[10rem] leading-none font-black tracking-tighter select-none">
						404
					</p>
					<span
						aria-hidden="true"
						className="absolute -top-2 -right-6 sm:-right-10 text-5xl sm:text-6xl animate-wiggle [animation-iteration-count:infinite] [animation-duration:2.4s]"
					>
						🙈
					</span>
				</div>

				{/* Message */}
				<h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mt-2 text-center">
					Хуудас олдсонгүй
				</h2>
				<p className="text-base sm:text-lg font-semibold text-muted-foreground mt-2 text-center max-w-md">
					Уучлаарай, таны хайж буй хуудас олдсонгүй эсвэл устгагдсан байна.
				</p>

				{/* Buttons */}
				<div className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:w-auto">
					<Button asChild size="lg" className="group w-full sm:w-auto">
						<Link href="/home">
							<Home className="size-5 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
							Нүүр хуудас руу буцах
						</Link>
					</Button>

					<Button
						onClick={() => window.history.back()}
						variant="outline"
						size="lg"
						className="group w-full sm:w-auto"
					>
						<ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
						Буцах
					</Button>
				</div>
			</div>
		</div>
	);
}
