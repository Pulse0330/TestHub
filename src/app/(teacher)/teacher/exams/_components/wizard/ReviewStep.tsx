"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lightbulb, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import MathContent from "@/components/MathContent";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ConfirmDelete,
	EmptyState,
	Panel,
	StatusPill,
} from "@/features/teacher/components";
import {
	listOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import {
	type NQuestion,
	normalizeQuestions,
	num,
	QuestionBody,
	queTypeLabel,
	type Row,
	str,
} from "../shared";
import { type TestBundle, testKey } from "./MaterialWizard";
import { QuestionEditor } from "./QuestionEditor";

export function ReviewStep({
	testId,
	bundle,
	onBack,
}: {
	testId: number;
	bundle: TestBundle | undefined;
	onBack: () => void;
}) {
	const [editing, setEditing] = useState<number | null>(null);
	const [bodolt, setBodolt] = useState<NQuestion | null>(null);
	const [showCorrect, setShowCorrect] = useState(true);
	const questions = useMemo(
		() => normalizeQuestions(bundle?.raw),
		[bundle?.raw],
	);
	const info = bundle?.info ?? {};
	const totalScore = questions.reduce((s, q) => s + (q.score || 0), 0);

	const remove = useTeacherMutation(
		(id: number) => teacherApi.exam.test.question.remove({ exam_que_id: id }),
		{
			success: "Асуулт хасагдлаа",
			invalidate: [testKey(testId), teacherKey("exam-tests")],
		},
	);

	return (
		<div className="grid gap-4">
			<Panel>
				<dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
					<Meta label="Хичээл" value={str(info, "lesson_name") || "—"} />
					<Meta label="Асуулт" value={String(questions.length)} />
					<Meta
						label="Хугацаа"
						value={`${num(info, "minute", "test_minute")} мин`}
					/>
					<Meta
						label="Нийт оноо"
						value={totalScore ? String(totalScore) : "—"}
					/>
				</dl>
			</Panel>

			<Panel
				title="Асуултууд"
				actions={
					<div className="flex flex-wrap gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowCorrect((v) => !v)}
							aria-pressed={showCorrect}
						>
							{showCorrect ? "Зөв хариу нуух" : "Зөв хариу харуулах"}
						</Button>
						<Button size="sm" onClick={() => setEditing(0)}>
							<Plus />
							Асуулт нэмэх
						</Button>
					</div>
				}
			>
				{questions.length === 0 ? (
					<EmptyState text="Материалд асуулт алга. Асуулт сонгох алхам руу буцна уу.">
						<Button variant="outline" size="sm" onClick={onBack}>
							<ArrowLeft />
							Асуулт сонгох
						</Button>
					</EmptyState>
				) : (
					<ol className="grid gap-3">
						{questions.map((q, i) => (
							<li
								key={q.id || i}
								className="rounded-2xl border border-border p-4"
							>
								<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
									<div className="flex flex-wrap items-center gap-1.5">
										<StatusPill>{queTypeLabel(q.type)}</StatusPill>
										{q.score > 0 && (
											<StatusPill tone="sky">{q.score} оноо</StatusPill>
										)}
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setBodolt(q)}
										>
											<Lightbulb />
											Бодолт
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`${i + 1}-р асуулт засах`}
											onClick={() => setEditing(q.id)}
										>
											<Pencil />
										</Button>
										<ConfirmDelete
											title={`${i + 1}-р асуултыг хасах уу?`}
											description="Асуулт энэ материалаас хасагдана."
											label="Хасах"
											onConfirm={() => remove.mutate(q.id)}
											pending={remove.isPending}
										/>
									</div>
								</div>
								<QuestionBody q={q} index={i + 1} showCorrect={showCorrect} />
							</li>
						))}
					</ol>
				)}
			</Panel>

			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
				<Button variant="outline" onClick={onBack}>
					<ArrowLeft />
					Буцах
				</Button>
				<Button asChild>
					<Link href={`/teacher/exams?type=${num(info, "test_type") || 1}`}>
						Дуусгах
					</Link>
				</Button>
			</div>

			<QuestionEditor
				testId={testId}
				examQueId={editing}
				onClose={() => setEditing(null)}
			/>
			<BodoltDialog q={bodolt} onClose={() => setBodolt(null)} />
		</div>
	);
}

function Meta({ label, value }: { label: string; value: string }) {
	return (
		<div className="min-w-0">
			<dt className="text-xs font-bold text-muted-foreground">{label}</dt>
			<dd className="truncate font-black">{value}</dd>
		</div>
	);
}

/** stu_question_analyse — бодолт/шинжилгээ. */
function BodoltDialog({
	q,
	onClose,
}: {
	q: NQuestion | null;
	onClose: () => void;
}) {
	const { userId } = useTeacher();
	const { data, isLoading } = useQuery({
		queryKey: teacherKey("exam-bodolt", q?.id),
		queryFn: () =>
			teacherApi.exam.test.question.bodolt({
				exam_que_id: q?.id ?? 0,
				user_id: userId,
			}),
		enabled: !!q?.id && !!userId,
	});
	const rows = listOf<Row>(data);
	const row: Row =
		rows[0] ??
		((data?.RetData && typeof data.RetData === "object"
			? data.RetData
			: {}) as Row);
	const descr = str(row, "que_descr", "descr", "bodolt", "bodolt_html");
	const analys = str(row, "que_analys", "analys", "analys_html");
	const descrImg = str(row, "descr_img");
	const analysImg = str(row, "analys_img");
	const fallback = str(q?.raw, "que_descr");

	return (
		<Dialog open={q !== null} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="font-black">Бодолт</DialogTitle>
					<DialogDescription className="sr-only">
						Асуултын бодолт ба шинжилгээ
					</DialogDescription>
				</DialogHeader>
				{isLoading ? (
					<Skeleton className="h-32 rounded-2xl" />
				) : !(descr || analys || descrImg || fallback) ? (
					<EmptyState text="Бодолт оруулаагүй байна" />
				) : (
					<div className="grid gap-4 text-sm leading-relaxed">
						{(descr || fallback || descrImg) && (
							<section>
								<h3 className="mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
									Бодолт
								</h3>
								<MathContent html={descr || fallback} />
								{descrImg && (
									// biome-ignore lint/performance/noImgElement: гадны URL
									<img
										src={descrImg}
										alt="Бодолтын зураг"
										className="mt-2 max-h-72 rounded-xl border border-border"
									/>
								)}
							</section>
						)}
						{(analys || analysImg) && (
							<section>
								<h3 className="mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
									Шинжилгээ
								</h3>
								<MathContent html={analys} />
								{analysImg && (
									// biome-ignore lint/performance/noImgElement: гадны URL
									<img
										src={analysImg}
										alt="Шинжилгээний зураг"
										className="mt-2 max-h-72 rounded-xl border border-border"
									/>
								)}
							</section>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
