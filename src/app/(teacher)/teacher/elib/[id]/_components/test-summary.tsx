"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { itemOf, teacherKey } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";

/** testInfo-ийн мэдэгдэж буй талбарууд → шошго. */
const FIELDS: [string[], string][] = [
	[["test_name", "title", "name"], "Нэр"],
	[["lesson_name"], "Хичээл"],
	[["que_cnt", "q_cnt", "question_cnt", "quecnt", "cnt"], "Асуулт"],
	[["duration", "test_time", "minute", "time"], "Хугацаа (мин)"],
	[["score", "total_score", "max_score", "point"], "Оноо"],
];

const pick = (o: Record<string, unknown>, keys: string[]) => {
	for (const k of keys) {
		const v = o[k];
		if (v !== undefined && v !== null && v !== "") return String(v);
	}
	return undefined;
};

export function TestSummary({ testId }: { testId: number }) {
	const res = useQuery({
		queryKey: teacherKey("elib", "test-info", testId),
		queryFn: () => teacherApi.elib.testInfo({ my_test_id: testId }),
		enabled: !!testId,
		staleTime: 5 * 60_000,
	});
	if (res.isLoading) return <Skeleton className="h-12 rounded-2xl" />;
	const raw =
		itemOf<Record<string, unknown>>(res.data) ??
		((Array.isArray(res.data?.RetDataFirst)
			? res.data?.RetDataFirst[0]
			: res.data?.RetDataFirst) as Record<string, unknown> | undefined);
	if (!raw) return null;
	const rows = FIELDS.map(([keys, label]) => [label, pick(raw, keys)] as const)
		.filter(([, v]) => v !== undefined)
		.slice(0, 5);
	if (rows.length === 0) return null;
	return (
		<dl className="flex flex-wrap gap-x-5 gap-y-1 rounded-2xl bg-muted/50 px-3.5 py-2.5 text-sm">
			{rows.map(([label, v]) => (
				<div key={label} className="flex gap-1.5">
					<dt className="font-semibold text-muted-foreground">{label}:</dt>
					<dd className="font-bold">{v}</dd>
				</div>
			))}
		</dl>
	);
}
