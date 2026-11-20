"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, ClipboardList, Play, Printer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/teacher/components";
import { teacherKey, useTeacher } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { TestType } from "@/lib/teacher-api";
import { cn } from "@/lib/utils";
import {
	num,
	objOf,
	parseTestType,
	type Row,
	str,
	testTypeLabel,
} from "../shared";
import { GeneralStep } from "./GeneralStep";
import { ReviewStep } from "./ReviewStep";
import { RulesStep } from "./RulesStep";

export const testKey = (id: number) => teacherKey("exam-test", id);

/** test.get-ийн RetData {info, rules, exam, questions}. */
export interface TestBundle {
	info: Row;
	rules: Row[];
	exam: Row;
	raw: unknown;
}

export function useTestBundle(testId: number) {
	const { userId, schoolId } = useTeacher();
	return useQuery({
		queryKey: testKey(testId),
		queryFn: () =>
			teacherApi.exam.test.get({
				test_id: testId,
				user_id: userId,
				school_id: schoolId,
			}),
		enabled: testId > 0 && !!userId,
		select: (res): TestBundle => {
			const d = objOf(res.RetData);
			const rules = d.rules;
			return {
				info: objOf(d.info ?? d),
				rules: Array.isArray(rules) ? (rules as Row[]) : [],
				exam: objOf(d.exam),
				raw: res.RetData,
			};
		},
	});
}

const STEPS = [
	{ n: 1, label: "Ерөнхий мэдээлэл" },
	{ n: 2, label: "Асуулт сонгох" },
	{ n: 3, label: "Хянах" },
] as const;

export function MaterialWizard({
	testId: initialId,
	type: typeParam,
	initialStep,
}: {
	testId: number;
	type: TestType;
	initialStep?: number;
}) {
	const router = useRouter();
	const [testId, setTestId] = useState(initialId);
	const [step, setStep] = useState(initialStep ?? (initialId ? 3 : 1));
	const bundle = useTestBundle(testId);
	const info = bundle.data?.info ?? {};
	const type: TestType = num(info, "test_type")
		? parseTestType(str(info, "test_type"))
		: typeParam;
	const title = str(info, "test_title", "title");
	const label = testTypeLabel(type);

	const goStep = (n: number) => {
		if (n > 1 && !testId) return;
		setStep(n);
	};

	return (
		<>
			<PageHeader
				title={testId ? title || label : `Шинэ ${label.toLowerCase()}`}
				description={`${label}ийн материал`}
				icon={ClipboardList}
				actions={
					<>
						<Button variant="ghost" asChild>
							<Link href={`/teacher/exams?type=${type}`}>
								<ArrowLeft />
								Жагсаалт
							</Link>
						</Button>
						{testId > 0 && (
							<>
								<Button variant="outline" asChild>
									<Link href={`/teacher/exams/${testId}/practice`}>
										<Play />
										Туршиж үзэх
									</Link>
								</Button>
								<Button variant="outline" asChild>
									<Link href={`/teacher/exams/${testId}/print`}>
										<Printer />
										Хэвлэх
									</Link>
								</Button>
							</>
						)}
					</>
				}
			/>

			<nav aria-label="Алхам" className="mb-5">
				<ol className="flex flex-wrap gap-2">
					{STEPS.map((s) => {
						const active = s.n === step;
						const done = testId > 0 && s.n < step;
						const disabled = s.n > 1 && !testId;
						return (
							<li key={s.n} className="flex-1 sm:flex-none">
								<button
									type="button"
									onClick={() => goStep(s.n)}
									disabled={disabled}
									aria-current={active ? "step" : undefined}
									className={cn(
										"flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:px-4",
										active
											? "border-primary/30 bg-primary-soft/50 text-foreground"
											: "border-border bg-card text-muted-foreground hover:text-foreground",
									)}
								>
									<span
										className={cn(
											"flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-black",
											active
												? "bg-primary-soft text-primary-soft-foreground"
												: "bg-muted",
										)}
									>
										{done ? <Check className="size-3.5" /> : s.n}
									</span>
									<span className="hidden sm:inline">{s.label}</span>
								</button>
							</li>
						);
					})}
				</ol>
				<p className="mt-2 text-sm font-bold sm:hidden">
					{STEPS[step - 1]?.label}
				</p>
			</nav>

			{testId > 0 && bundle.isLoading ? (
				<Skeleton className="h-96 rounded-3xl" />
			) : step === 1 ? (
				<GeneralStep
					key={testId}
					type={type}
					testId={testId}
					info={info}
					onSaved={(id) => {
						if (!testId && id) {
							setTestId(id);
							// Шинэ материал → засах маршрут руу (2-р алхамаас үргэлжилнэ)
							router.replace(`/teacher/exams/${id}?type=${type}&step=2`, {
								scroll: false,
							});
							return;
						}
						setStep(2);
					}}
				/>
			) : step === 2 ? (
				<RulesStep
					type={type}
					testId={testId}
					info={info}
					rules={bundle.data?.rules ?? []}
					onBack={() => setStep(1)}
					onSaved={() => setStep(3)}
				/>
			) : (
				<ReviewStep
					testId={testId}
					bundle={bundle.data}
					onBack={() => setStep(2)}
				/>
			)}
		</>
	);
}
