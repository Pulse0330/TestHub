"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	EmptyState,
	Field,
	FormDialog,
	OptionSelect,
} from "@/features/teacher/components";
import {
	listOf,
	teacherKey,
	unwrap,
	useTeacher,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { ExamRuleInput } from "@/lib/teacher-api";
import { LEVELS, num, type Row, str, useExamRef } from "../shared";

interface Topic {
	key: string;
	ulesson_id: number;
	rlesson_id: number;
	name: string;
	depth: number;
}

function toTopic(r: Row): Topic {
	const u = num(r, "ulesson_id");
	const rl = num(r, "rlesson_id") || -1;
	return {
		key: `${u}:${rl}`,
		ulesson_id: u,
		rlesson_id: rl,
		name: str(r, "rlesson_name", "ulesson_name", "title", "name"),
		depth: rl > 0 ? 1 : 0,
	};
}

/**
 * Blueprint горим — бүлэг сэдэв × түвшин (1–4) тус бүрт тоо өгч,
 * санамсаргүй асуулт сонгоно (bprint_get_topic / bprint_get_questions).
 */
export function BlueprintDialog({
	open,
	onOpenChange,
	lessonId,
	lessonName,
	currId: initialCurr,
	onApply,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	lessonId: number;
	lessonName: string;
	currId: number;
	onApply: (rule: ExamRuleInput) => void;
}) {
	const { userId } = useTeacher();
	const [currId, setCurrId] = useState(String(initialCurr || ""));
	const [counts, setCounts] = useState<Record<string, number[]>>({});
	const [picked, setPicked] = useState<number[] | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (open) {
			setPicked(null);
			setCounts({});
			setCurrId(String(initialCurr || ""));
		}
	}, [open, initialCurr]);

	const currs = useExamRef("curr", { lesson_id: lessonId }, open && !!lessonId);
	const topicsQ = useQuery({
		queryKey: teacherKey("exam-bp-topics", currId, lessonId),
		queryFn: () =>
			teacherApi.exam.test.blueprintTopics({
				curr_id: Number(currId),
				lesson_id: lessonId,
				user_id: userId,
			}),
		enabled: open && !!Number(currId) && !!lessonId && !!userId,
	});
	const topics = useMemo(
		() => listOf<Row>(topicsQ.data).map(toTopic),
		[topicsQ.data],
	);

	const items = Object.entries(counts).flatMap(([key, lv]) => {
		const t = topics.find((x) => x.key === key);
		if (!t) return [];
		return lv
			.map((count, i) => ({
				ulesson_id: t.ulesson_id,
				rlesson_id: t.rlesson_id,
				level: i + 1,
				count,
			}))
			.filter((x) => x.count > 0);
	});
	const requested = items.reduce((s, x) => s + x.count, 0);

	const setCount = (key: string, level: number, v: string) => {
		setPicked(null);
		setCounts((c) => {
			const lv = [...(c[key] ?? [0, 0, 0, 0])];
			lv[level] = Math.max(0, Number(v) || 0);
			return { ...c, [key]: lv };
		});
	};

	const pick = async () => {
		if (items.length === 0) {
			toast.error("Дор хаяж нэг сэдэвт тоо оруулна уу");
			return;
		}
		setBusy(true);
		try {
			const res = unwrap(
				await teacherApi.exam.test.blueprintPick({
					lesson_id: lessonId,
					items,
					user_id: userId,
				}),
			);
			const ids = listOf<Row>(res)
				.map((r) => num(r, "question_id", "que_id", "id"))
				.filter(Boolean);
			setPicked(ids);
			if (ids.length < requested)
				toast.warning(`${requested}-аас ${ids.length} асуулт олдлоо`);
		} catch (e) {
			toast.error((e as Error).message || "Алдаа гарлаа");
		} finally {
			setBusy(false);
		}
	};

	return (
		<FormDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Blueprint-ээр сонгох"
			description={`${lessonName} · сэдэв, түвшин тус бүрт асуултын тоо оруулна`}
			size="xl"
			pending={busy}
			submitLabel={picked ? `${picked.length} асуултыг нэмэх` : "Асуулт сонгох"}
			onSubmit={() => {
				if (!picked) {
					pick();
					return;
				}
				if (picked.length === 0) return;
				onApply({
					lesson_id: lessonId,
					lesson_name: lessonName,
					sub: "0~0",
					sub_name: "Blueprint",
					count: picked.length,
					question_ids: picked,
				});
			}}
		>
			{!initialCurr && (
				<Field label="Хөтөлбөр" required>
					<OptionSelect
						options={currs.options}
						value={currId}
						onChange={(v) => {
							setCurrId(v);
							setCounts({});
							setPicked(null);
						}}
						className="sm:w-full"
					/>
				</Field>
			)}
			{picked && (
				<p
					aria-live="polite"
					className="flex items-center gap-2 rounded-2xl bg-pop-mint-soft/50 px-4 py-3 text-sm font-bold"
				>
					<CheckCircle2 className="size-4 text-pop-mint-ink" />
					{picked.length} асуулт санамсаргүй сонгогдлоо.
				</p>
			)}
			{!Number(currId) ? (
				<EmptyState text="Хөтөлбөр сонгоно уу" />
			) : topicsQ.isLoading ? (
				<div className="grid gap-2">
					{["a", "b", "c"].map((k) => (
						<Skeleton key={k} className="h-12 rounded-xl" />
					))}
				</div>
			) : topics.length === 0 ? (
				<EmptyState text="Бүлэг сэдэв олдсонгүй" />
			) : (
				<div className="overflow-x-auto">
					<table className="w-full min-w-[560px] text-sm">
						<thead>
							<tr className="text-left text-xs font-bold text-muted-foreground">
								<th className="py-2 pr-2">Сэдэв</th>
								{LEVELS.map((l) => (
									<th key={l.value} className="w-24 px-1 py-2 text-center">
										{l.label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{topics.map((t) => (
								<tr key={t.key} className="border-t border-border">
									<td
										className={
											t.depth
												? "py-1.5 pr-2 pl-4 font-semibold"
												: "py-1.5 pr-2 font-black"
										}
									>
										{t.name}
									</td>
									{LEVELS.map((l, i) => (
										<td key={l.value} className="px-1 py-1.5">
											<Input
												type="number"
												min={0}
												inputMode="numeric"
												value={counts[t.key]?.[i] || ""}
												placeholder="0"
												onChange={(e) => setCount(t.key, i, e.target.value)}
												aria-label={`${t.name} — ${l.label}`}
												className="h-9 text-center"
											/>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			{requested > 0 && (
				<p className="text-right text-sm font-bold text-muted-foreground">
					Хүссэн:{" "}
					<span className="text-foreground tabular-nums">{requested}</span>
				</p>
			)}
		</FormDialog>
	);
}
