"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/features/teacher/components";
import { teacherKey, useTeacher } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import {
	correctSummary,
	normalizeQuestions,
	num,
	objOf,
	pick,
	QuestionBody,
	str,
	ToggleRow,
} from "./shared";

// Хэвлэхэд зөвхөн #exam-print харагдана (shell-ийн sidebar, header нуугдана)
const PRINT_CSS = `
@media print {
	@page { margin: 14mm; }
	body * { visibility: hidden !important; }
	#exam-print, #exam-print * { visibility: visible !important; }
	#exam-print { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; box-shadow: none !important; padding: 0 !important; background: #fff !important; color: #000 !important; }
	#exam-print li { break-inside: avoid; }
}`;

/** my_test_pdf — хэвлэхэд бэлэн хуудас. */
export function PrintView({ testId }: { testId: number }) {
	const { userId } = useTeacher();
	const [withKey, setWithKey] = useState(false);
	const [withCorrect, setWithCorrect] = useState(false);
	const { data, isLoading } = useQuery({
		queryKey: teacherKey("exam-export", testId),
		queryFn: () =>
			teacherApi.exam.test.export({ test_id: testId, user_id: userId }),
		enabled: testId > 0 && !!userId,
	});
	const questions = useMemo(
		() => normalizeQuestions(data?.RetData),
		[data?.RetData],
	);
	const root = objOf(data?.RetData);
	const info = objOf(pick(root, "info", "test"));
	const title =
		str(info, "test_title", "title") || str(root, "test_title", "title");
	const lesson = str(info, "lesson_name") || str(root, "lesson_name");
	const minute = num(info, "minute") || num(root, "minute");
	const total = questions.reduce((s, q) => s + (q.score || 0), 0);

	return (
		<>
			<style>{PRINT_CSS}</style>
			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
				<Button variant="ghost" asChild className="self-start">
					<Link href={`/teacher/exams/${testId}`}>
						<ArrowLeft />
						Материал руу
					</Link>
				</Button>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<ToggleRow
						label="Зөв хариу тэмдэглэх"
						checked={withCorrect}
						onChange={setWithCorrect}
					/>
					<ToggleRow
						label="Хариуны түлхүүр"
						checked={withKey}
						onChange={setWithKey}
					/>
					<Button
						onClick={() => window.print()}
						disabled={isLoading || !questions.length}
					>
						<Printer />
						Хэвлэх
					</Button>
				</div>
			</div>

			<article
				id="exam-print"
				className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 sm:p-10"
			>
				{isLoading ? (
					<div className="grid gap-3">
						<Skeleton className="h-8 w-2/3 rounded-xl" />
						<Skeleton className="h-40 rounded-xl" />
						<Skeleton className="h-40 rounded-xl" />
					</div>
				) : questions.length === 0 ? (
					<EmptyState text="Хэвлэх асуулт алга" />
				) : (
					<>
						<header className="mb-6 border-b border-border pb-4 text-center">
							<h1 className="text-xl font-black">{title || "Материал"}</h1>
							<p className="mt-1 text-sm font-semibold text-muted-foreground">
								{[
									lesson,
									minute ? `${minute} минут` : "",
									`${questions.length} асуулт`,
									total ? `${total} оноо` : "",
								]
									.filter(Boolean)
									.join(" · ")}
							</p>
							<div className="mt-4 grid grid-cols-2 gap-6 text-left text-sm font-semibold">
								<p>Нэр: ..............................................</p>
								<p>Анги: .....................</p>
							</div>
						</header>
						<ol className="grid gap-5">
							{questions.map((q, i) => (
								<li key={q.id || i}>
									<QuestionBody
										q={q}
										index={i + 1}
										showCorrect={withCorrect}
										compact={false}
									/>
									{(q.type === 3 || q.type === 4) && !withCorrect && (
										<p className="mt-2 text-sm">
											Хариу: ...............................
										</p>
									)}
								</li>
							))}
						</ol>
						{withKey && (
							<section className="mt-8 border-t border-border pt-4 break-before-page">
								<h2 className="mb-2 text-base font-black">Хариуны түлхүүр</h2>
								<ol className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
									{questions.map((q, i) => (
										<li key={q.id || i} className="tabular-nums">
											<span className="font-black">{i + 1}.</span>{" "}
											{correctSummary(q) || "—"}
										</li>
									))}
								</ol>
							</section>
						)}
					</>
				)}
			</article>
		</>
	);
}
