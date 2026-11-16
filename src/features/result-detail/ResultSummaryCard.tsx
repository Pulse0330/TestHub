"use client";

import { memo } from "react";
import type { ExamDunApiResponse } from "@/types/exam/examDun";
import type { ExamSummary } from "@/types/exam/examResultMore";

export type DunInfo = ExamDunApiResponse["RetData"][number];

interface ResultSummaryCardProps {
	examSummary: ExamSummary;
	dunInfo: DunInfo | undefined;
}

/** Дүнгийн толгой: хичээлийн нэр, хувь, үнэлгээ, статистик. */
export const ResultSummaryCard = memo(function ResultSummaryCard({
	examSummary,
	dunInfo,
}: ResultSummaryCardProps) {
	return (
		<div className="card-pop animate-pop-in overflow-hidden">
			{/* Толгой хэсэг */}
			<div className="relative overflow-hidden bg-gradient-to-br from-pop-violet to-pop-pink p-6 text-white md:p-8">
				<div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary-foreground/10" />
				<div className="pointer-events-none absolute -bottom-16 left-1/3 size-48 rounded-full bg-primary-foreground/10" />
				<div className="relative flex flex-col items-center gap-6 md:flex-row md:justify-between">
					<div className="flex min-w-0 flex-col items-center gap-4 text-center md:items-start md:text-left">
						<div className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/20 shadow-[0_4px_0_0_color-mix(in_oklch,var(--foreground)_20%,transparent)]">
							<svg
								className="size-7"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.5}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
						<h2 className="wrap-break-word text-2xl font-black tracking-tight md:text-3xl">
							{examSummary.lesson_name}
						</h2>
						{dunInfo && (
							<p className="wrap-break-word rounded-full bg-primary-foreground/20 px-4 py-1.5 text-sm font-extrabold md:text-base">
								🏆 {dunInfo.title}
							</p>
						)}
					</div>

					{/* Шалгалтын хувь */}
					<div className="flex shrink-0 flex-col items-center gap-3">
						<div className="relative size-36 md:size-40">
							<svg
								className="size-full -rotate-90"
								viewBox="0 0 120 120"
								aria-hidden="true"
							>
								<circle
									cx="60"
									cy="60"
									r="52"
									fill="none"
									strokeWidth="12"
									className="stroke-primary-foreground/25"
								/>
								<circle
									cx="60"
									cy="60"
									r="52"
									fill="none"
									strokeWidth="12"
									strokeLinecap="round"
									className="stroke-primary-foreground transition-all duration-700 ease-out"
									strokeDasharray={2 * Math.PI * 52}
									strokeDashoffset={
										2 *
										Math.PI *
										52 *
										(1 -
											Math.min(Math.max(examSummary.point_perc, 0), 100) / 100)
									}
								/>
							</svg>
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<div className="flex items-end">
									<p className="text-4xl font-black leading-none">
										{examSummary.point_perc.toFixed(1)}
									</p>
									<p className="text-lg font-black opacity-80">%</p>
								</div>
								{dunInfo && (
									<span className="mt-1 text-lg font-black opacity-90">
										({dunInfo.tuval})
									</span>
								)}
							</div>
						</div>
						<p className="text-xs font-extrabold uppercase tracking-wide opacity-90">
							Шалгалтын хувь
						</p>
						{/* Хувийн визуал индикатор */}
						<div className="flex w-36 gap-1">
							{Array.from({ length: 10 }).map((_, i) => (
								<div
									key={`percent-indicator-${examSummary.test_id}-${i}`}
									className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
										i < Math.floor(examSummary.point_perc / 10)
											? "bg-primary-foreground"
											: "bg-primary-foreground/25"
									}`}
									style={{ transitionDelay: `${i * 50}ms` }}
								/>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Статистик */}
			<div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:p-6 lg:grid-cols-6">
				{/* Нийт асуулт */}
				<div className="animate-pop-in rounded-2xl bg-pop-violet-soft p-4">
					<div className="mb-2 flex items-center justify-between gap-2">
						<p className="text-xs font-bold uppercase tracking-wide text-pop-violet-ink">
							Нийт асуулт
						</p>
						<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-pop-violet text-primary-foreground">
							<svg
								className="size-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.5}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
					</div>
					<p className="text-2xl font-black text-pop-violet-ink md:text-3xl">
						{examSummary.test_ttl}
					</p>
				</div>

				{/* Зөв хариулт */}
				<div
					className="animate-pop-in rounded-2xl bg-success/15 p-4"
					style={{ animationDelay: "50ms" }}
				>
					<div className="mb-2 flex items-center justify-between gap-2">
						<p className="text-xs font-bold uppercase tracking-wide text-success">
							Зөв
						</p>
						<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-success text-primary-foreground">
							<svg
								className="size-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Зөв</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={3}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
					</div>
					<p className="text-2xl font-black text-success md:text-3xl">
						{examSummary.correct_ttl}
					</p>
				</div>

				{/* Буруу хариулт */}
				<div
					className="animate-pop-in rounded-2xl bg-destructive/15 p-4"
					style={{ animationDelay: "100ms" }}
				>
					<div className="mb-2 flex items-center justify-between gap-2">
						<p className="text-xs font-bold uppercase tracking-wide text-destructive">
							Буруу
						</p>
						<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive text-primary-foreground">
							<svg
								className="size-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Буруу</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={3}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</div>
					</div>
					<p className="text-2xl font-black text-destructive md:text-3xl">
						{examSummary.wrong_ttl}
					</p>
				</div>

				{/* Хариулаагүй */}
				<div
					className="animate-pop-in rounded-2xl bg-muted p-4"
					style={{ animationDelay: "150ms" }}
				>
					<div className="mb-2 flex items-center justify-between gap-2">
						<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
							Хариулаагүй
						</p>
						<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted-foreground/20 text-muted-foreground">
							<svg
								className="size-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Хариулаагүй</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.5}
									d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
					</div>
					<p className="text-2xl font-black text-muted-foreground md:text-3xl">
						{examSummary.not_answer}
					</p>
				</div>

				{/* Оноо харьцуулалт */}
				<div
					className="animate-pop-in col-span-2 rounded-2xl bg-pop-sky-soft p-4"
					style={{ animationDelay: "200ms" }}
				>
					<div className="space-y-3">
						{/* Авах оноо */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="size-2 rounded-full bg-pop-sun" />
								<p className="text-xs font-bold uppercase tracking-wide text-pop-sky-ink">
									Авах оноо
								</p>
							</div>
							<p className="text-xl font-black text-pop-sky-ink">
								{examSummary.ttl_point}
							</p>
						</div>

						{/* Progress bar */}
						<div className="relative h-3 overflow-hidden rounded-full bg-card">
							<div
								className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pop-sky to-pop-violet transition-all duration-700 ease-out"
								style={{
									width: `${examSummary.ttl_point > 0 ? Math.min((examSummary.point / examSummary.ttl_point) * 100, 100) : 0}%`,
								}}
							/>
						</div>

						{/* Авсан оноо */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="size-2 rounded-full bg-primary" />
								<p className="text-xs font-bold uppercase tracking-wide text-pop-sky-ink">
									Авсан оноо
								</p>
							</div>
							<p className="text-2xl font-black text-primary">
								{examSummary.point}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
});
