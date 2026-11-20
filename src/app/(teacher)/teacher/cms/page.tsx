"use client";

import { useQuery } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, Panel } from "@/features/teacher/components";
import { listOf } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { CmsRefKind } from "@/lib/teacher-api";
import { cmsKey, KindPanel } from "./_components/kind-panel";

interface Kind {
	kind: CmsRefKind;
	title: string;
	scope?: string;
}

export default function TeacherCmsPage() {
	const [active, setActive] = useState<string>("");
	const { data, isLoading } = useQuery({
		queryKey: cmsKey("kinds"),
		queryFn: () => teacherApi.cmsRef.kinds(),
	});
	const kinds = listOf<Kind>(data);
	const current = active || kinds[0]?.kind || "";
	const currentKind = kinds.find((k) => k.kind === current);

	return (
		<>
			<PageHeader
				title="CMS лавлах"
				description="CMS-ээс лавлах сонгож татах"
				icon={Database}
			/>
			{isLoading ? (
				<div className="grid gap-4">
					<Skeleton className="h-11 w-full max-w-2xl rounded-2xl" />
					<Skeleton className="h-80 rounded-3xl" />
				</div>
			) : kinds.length === 0 ? (
				<Panel>
					<EmptyState text="Лавлахын төрөл олдсонгүй" />
				</Panel>
			) : (
				<Tabs value={current} onValueChange={setActive}>
					<TabsList aria-label="Лавлахын төрөл" className="w-full sm:w-fit">
						{kinds.map((k) => (
							<TabsTrigger key={k.kind} value={k.kind}>
								{k.title}
							</TabsTrigger>
						))}
					</TabsList>
					{currentKind?.scope && (
						<p className="-mt-1 text-xs font-semibold text-muted-foreground">
							Хамрах хүрээ: {currentKind.scope}
						</p>
					)}
					{kinds.map((k) => (
						<TabsContent key={k.kind} value={k.kind}>
							{k.kind === current && <KindPanel kind={k.kind} />}
						</TabsContent>
					))}
				</Tabs>
			)}
		</>
	);
}
