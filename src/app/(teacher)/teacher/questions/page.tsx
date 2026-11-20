"use client";

import {
	CloudDownload,
	FileQuestion,
	Library,
	ListChecks,
	Plus,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/features/teacher/components";
import { BankTab } from "./_components/BankTab";
import { CmsTab } from "./_components/CmsTab";
import { SourcesTab } from "./_components/SourcesTab";
import { useUrlState } from "./_components/useUrlState";

export default function TeacherQuestionsPage() {
	return (
		<>
			<PageHeader
				title="Даалгаврын сан"
				description="Даалгавар, эх сурвалж, CMS-ээс татах"
				icon={FileQuestion}
				actions={
					<Button asChild>
						<Link href="/teacher/questions/new">
							<Plus />
							Даалгавар нэмэх
						</Link>
					</Button>
				}
			/>
			<Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
				<QuestionTabs />
			</Suspense>
		</>
	);
}

function QuestionTabs() {
	const url = useUrlState();
	const tab = url.get("tab") || "bank";
	return (
		<Tabs
			value={tab}
			onValueChange={(v) => url.set({ tab: v === "bank" ? null : v })}
		>
			<TabsList>
				<TabsTrigger value="bank">
					<ListChecks />
					Даалгавар
				</TabsTrigger>
				<TabsTrigger value="sources">
					<Library />
					Эх сурвалж
				</TabsTrigger>
				<TabsTrigger value="cms">
					<CloudDownload />
					CMS-ээс татах
				</TabsTrigger>
			</TabsList>
			<TabsContent value="bank">
				<BankTab />
			</TabsContent>
			<TabsContent value="sources">
				<SourcesTab />
			</TabsContent>
			<TabsContent value="cms">
				<CmsTab />
			</TabsContent>
		</Tabs>
	);
}
