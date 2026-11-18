"use client";

import { useQuery } from "@tanstack/react-query";
import { CloudDownload, ListTree, NotebookTabs, Route } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	EmptyState,
	OptionSelect,
	PageHeader,
	toOptions,
} from "@/features/teacher/components";
import { listOf, useTeacher } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { CmsTab } from "./_components/CmsTab";
import { TopicsTab } from "./_components/TopicsTab";
import { TreeTab } from "./_components/TreeTab";
import { planKey } from "./_components/util";

export default function TeacherPlanPage() {
	const { userId } = useTeacher();
	const [lessonId, setLessonId] = useState("");
	const [tab, setTab] = useState("topics");

	const { data, isLoading } = useQuery({
		queryKey: planKey("lessons", userId),
		queryFn: () => teacherApi.plan.lessons({ user_id: userId }),
		enabled: !!userId,
	});
	const lessonOptions = useMemo(() => toOptions(listOf(data)), [data]);

	// Эхний хичээлийг автоматаар сонгоно
	useEffect(() => {
		if (!lessonId && lessonOptions.length) {
			setLessonId(String(lessonOptions[0].value));
		}
	}, [lessonId, lessonOptions]);

	const lesson = Number(lessonId) || 0;

	return (
		<>
			<PageHeader
				title="Сургалтын төлөвлөгөө"
				description="Хөтөлбөр, бүлэг сэдэв, сэдвүүд"
				icon={Route}
				actions={
					<OptionSelect
						id="plan-lesson"
						options={lessonOptions}
						value={lessonId}
						onChange={setLessonId}
						placeholder={isLoading ? "Ачаалж байна..." : "Хичээл сонгох"}
						className="sm:w-64"
					/>
				}
			/>

			{!lesson ? (
				<div className="rounded-3xl border border-border bg-card">
					<EmptyState
						text={
							isLoading
								? "Хичээлүүдийг ачаалж байна..."
								: lessonOptions.length
									? "Хичээл сонгоно уу"
									: "Танд хуваарилагдсан хичээл алга"
						}
					/>
				</div>
			) : (
				<Tabs value={tab} onValueChange={setTab}>
					<TabsList>
						<TabsTrigger value="topics">
							<NotebookTabs />
							Хөтөлбөр
						</TabsTrigger>
						<TabsTrigger value="tree">
							<ListTree />
							Бүлэг сэдэв, сэдэв
						</TabsTrigger>
						<TabsTrigger value="cms">
							<CloudDownload />
							CMS-ээс татах
						</TabsTrigger>
					</TabsList>
					<TabsContent value="topics">
						<TopicsTab lessonId={lesson} />
					</TabsContent>
					<TabsContent value="tree">
						<TreeTab lessonId={lesson} />
					</TabsContent>
					<TabsContent value="cms">
						<CmsTab lessonId={lesson} />
					</TabsContent>
				</Tabs>
			)}
		</>
	);
}
