"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/features/teacher/components";
import { teacherKey, useTeacher } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CmsTab } from "./_components/CmsTab";
import { MaterialsTab } from "./_components/MaterialsTab";
import {
	num,
	parseTestType,
	type Row,
	StatTile,
	str,
	TEST_TYPES,
	testTypeLabel,
} from "./_components/shared";
import { TakenTab } from "./_components/TakenTab";

const DASH_LABELS: Record<string, string> = {
	test_cnt: "Материал",
	ttl_cnt: "Нийт",
	total: "Нийт",
	exam_cnt: "Авсан",
	open_cnt: "Нээлттэй",
	active_cnt: "Идэвхтэй",
	close_cnt: "Хаагдсан",
	que_cnt: "Асуулт",
	stu_cnt: "Сурагч",
	cms_cnt: "CMS-ээс",
	pay_cnt: "Төлбөртэй",
};

/** my_test_list_dash-ийн хариуг (массив эсвэл объект) тоон хавтан болгоно. */
function dashTiles(data: unknown): { label: string; value: number }[] {
	if (Array.isArray(data)) {
		const rows = data as Row[];
		if (rows.length === 1 && !pickLabel(rows[0])) return objTiles(rows[0]);
		return rows.map((r) => ({
			label: pickLabel(r) || "—",
			value: num(r, "cnt", "count", "value", "total", "too"),
		}));
	}
	if (data && typeof data === "object") return objTiles(data as Row);
	return [];
}
const pickLabel = (r: Row) => str(r, "title", "name", "label", "type_name");
function objTiles(o: Row) {
	return Object.entries(o)
		.filter(([, v]) => v !== null && v !== "" && Number.isFinite(Number(v)))
		.filter(([k]) => !/(^id$|_id$)/.test(k))
		.slice(0, 6)
		.map(([k, v]) => ({ label: DASH_LABELS[k] ?? k, value: Number(v) }));
}

function ExamsPageInner() {
	const { userId } = useTeacher();
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const type = parseTestType(params.get("type"));
	const tab = params.get("tab") ?? "materials";

	const setParam = (k: string, v: string) => {
		const p = new URLSearchParams(params.toString());
		p.set(k, v);
		router.replace(`${pathname}?${p.toString()}`, { scroll: false });
	};

	const dash = useQuery({
		queryKey: teacherKey("exam-dash", type, userId),
		queryFn: () =>
			teacherApi.exam.tests.dash({ test_type: type, teacher_id: userId }),
		enabled: !!userId,
	});
	const tiles = useMemo(() => dashTiles(dash.data?.RetData), [dash.data]);

	return (
		<>
			<PageHeader
				title="Тест, шалгалт"
				description="Тест, шалгалт, сорилын материал бэлтгэх ба авах"
				icon={ClipboardList}
				actions={
					<Button asChild>
						<Link href={`/teacher/exams/new?type=${type}`}>
							<Plus />
							Шинэ {testTypeLabel(type).toLowerCase()}
						</Link>
					</Button>
				}
			/>

			<div
				role="toolbar"
				aria-label="Материалын төрөл"
				className="mb-5 inline-flex w-full gap-1 rounded-2xl bg-muted p-1 sm:w-auto"
			>
				{TEST_TYPES.map((t) => {
					const active = t.value === type;
					return (
						<button
							key={t.value}
							type="button"
							aria-pressed={active}
							onClick={() => setParam("type", String(t.value))}
							className={cn(
								"flex-1 rounded-xl px-5 py-2 text-sm font-extrabold transition-colors sm:flex-none",
								active
									? "bg-card text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{t.label}
						</button>
					);
				})}
			</div>

			{dash.isLoading ? (
				<div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
					{["a", "b", "c", "d"].map((k) => (
						<Skeleton key={k} className="h-[72px] rounded-2xl" />
					))}
				</div>
			) : tiles.length > 0 ? (
				<div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
					{tiles.map((t, i) => (
						<StatTile
							key={`${t.label}-${i}`}
							label={t.label}
							value={t.value}
							active={i === 0}
						/>
					))}
				</div>
			) : null}

			<Tabs value={tab} onValueChange={(v) => setParam("tab", v)}>
				<TabsList className="mb-1">
					<TabsTrigger value="materials">Материал</TabsTrigger>
					<TabsTrigger value="taken">Авсан</TabsTrigger>
					<TabsTrigger value="cms">CMS-ээс татах</TabsTrigger>
				</TabsList>
				<TabsContent value="materials">
					<MaterialsTab type={type} />
				</TabsContent>
				<TabsContent value="taken">
					<TakenTab type={type} />
				</TabsContent>
				<TabsContent value="cms">
					<CmsTab type={type} />
				</TabsContent>
			</Tabs>
		</>
	);
}

export default function TeacherExamsPage() {
	return (
		<Suspense fallback={<Skeleton className="h-40 rounded-3xl" />}>
			<ExamsPageInner />
		</Suspense>
	);
}
