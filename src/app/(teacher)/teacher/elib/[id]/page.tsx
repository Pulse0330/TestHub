"use client";

import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	BarChart3,
	Eye,
	Globe,
	Loader2,
	Lock,
	Pencil,
	PencilRuler,
	Save,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ConfirmDelete,
	EmptyState,
	formatDateTime,
	StatusPill,
} from "@/features/teacher/components";
import {
	itemOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { Cover, FolderDialog } from "../_components/folder-dialog";
import { type ElibRow, elibKeys, isOwner } from "../_components/shared";
import { ContentEditor } from "./_components/content-editor";
import { ContentPreview } from "./_components/content-preview";
import { type EditItem, fromRow, toInput, validate } from "./_components/items";
import { ReportTab } from "./_components/report-tab";

const first = (v: unknown) =>
	(Array.isArray(v) ? v[0] : v) as Record<string, unknown> | undefined;

export default function ElibFolderPage() {
	const params = useParams<{ id: string }>();
	const elibId = Number(params.id) || 0;
	const router = useRouter();
	const { userId } = useTeacher();
	const [items, setItems] = useState<EditItem[]>([]);
	const [snapshot, setSnapshot] = useState("[]");
	const [errors, setErrors] = useState<Record<string, string | undefined>>({});
	const [editing, setEditing] = useState<ElibRow | null>(null);

	const head = useQuery({
		queryKey: elibKeys.get(elibId),
		queryFn: () => teacherApi.elib.get({ elib_id: elibId }),
		enabled: !!elibId,
	});
	const contents = useQuery({
		queryKey: elibKeys.contents(elibId),
		queryFn: () => teacherApi.elib.contents({ elib_id: elibId }),
		enabled: !!elibId,
		refetchOnWindowFocus: false,
	});

	const folder = useMemo(() => {
		const h =
			itemOf<Record<string, unknown>>(head.data) ??
			first(head.data?.RetDataFirst) ??
			first(contents.data?.RetDataFirst);
		return h ? ({ ...h, id: elibId } as ElibRow) : undefined;
	}, [head.data, contents.data, elibId]);
	const owner = isOwner(folder);

	useEffect(() => {
		const rows = contents.data?.RetDataSecond;
		const next = (Array.isArray(rows) ? rows : []).map((r) =>
			fromRow(r as Record<string, unknown>),
		);
		setItems(next);
		setSnapshot(JSON.stringify(next.map(toInput)));
		setErrors({});
	}, [contents.data]);

	const dirty = useMemo(
		() => JSON.stringify(items.map(toInput)) !== snapshot,
		[items, snapshot],
	);
	useEffect(() => {
		if (!dirty) return;
		const h = (e: BeforeUnloadEvent) => e.preventDefault();
		window.addEventListener("beforeunload", h);
		return () => window.removeEventListener("beforeunload", h);
	}, [dirty]);

	const save = useTeacherMutation(
		() =>
			teacherApi.elib.saveContents({
				user_id: userId,
				elib_id: elibId,
				items: items.map(toInput),
			}),
		{
			success: "Контент хадгалагдлаа",
			invalidate: [elibKeys.contents(elibId), elibKeys.all],
		},
	);
	const remove = useTeacherMutation(
		() => teacherApi.elib.remove({ user_id: userId, elib_id: elibId }),
		{
			success: "Хавтас устгагдлаа",
			invalidate: [elibKeys.all],
			onSuccess: () => router.push("/teacher/elib"),
		},
	);

	const onSave = () => {
		const errs: Record<string, string | undefined> = {};
		for (const it of items) {
			const e = validate(it);
			if (e) errs[it.key] = e;
		}
		setErrors(errs);
		const n = Object.keys(errs).length;
		if (n) {
			toast.error(`${n} контентод алдаа байна`);
			return;
		}
		save.mutate(undefined);
	};

	if (head.isLoading || contents.isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-40 rounded-3xl" />
				<Skeleton className="h-64 rounded-3xl" />
			</div>
		);
	}
	if (!folder) {
		return (
			<EmptyState text="Хавтас олдсонгүй">
				<Button asChild variant="outline" size="sm">
					<Link href="/teacher/elib">Буцах</Link>
				</Button>
			</EmptyState>
		);
	}

	const title = String(folder.topic_name || folder.l_name || "Хавтас");
	const rlessonId = Number(folder.rlesson_id ?? 0);

	return (
		<>
			<Link
				href="/teacher/elib"
				className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Цахим хичээл
			</Link>

			<section className="mb-5 overflow-hidden rounded-3xl border border-border bg-card">
				<Cover image={folder.l_image} className="h-20 sm:h-24" />
				<div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
					<div className="min-w-0">
						<h1 className="text-xl font-black tracking-tight sm:text-2xl">
							{title}
						</h1>
						<p className="text-sm font-semibold text-muted-foreground">
							{[folder.class_name, folder.lesson_name, folder.teach_name]
								.filter(Boolean)
								.join(" · ")}
						</p>
						{folder.l_desc && (
							<p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground">
								{folder.l_desc}
							</p>
						)}
						<div className="mt-2 flex flex-wrap gap-1.5">
							{Number(folder.l_flag) === 1 ? (
								<StatusPill tone="mint">
									<Globe className="mr-1 size-3" />
									Нээлттэй
								</StatusPill>
							) : (
								<StatusPill>
									<Lock className="mr-1 size-3" />
									Хаалттай
								</StatusPill>
							)}
							{folder.l_date && (
								<StatusPill>
									{formatDateTime(folder.l_date).slice(0, 10)}
								</StatusPill>
							)}
							{!owner && <StatusPill tone="sky">Зөвхөн унших</StatusPill>}
						</div>
					</div>
					{owner && (
						<div className="flex shrink-0 gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setEditing(folder)}
							>
								<Pencil />
								Засах
							</Button>
							<ConfirmDelete
								iconOnly={false}
								title={`"${title}" хавтсыг устгах уу?`}
								description="Сурагч үзсэн эсвэл тест өгсөн бол устгах боломжгүй."
								onConfirm={() => remove.mutate(undefined)}
								pending={remove.isPending}
							/>
						</div>
					)}
				</div>
			</section>

			{owner ? (
				<Tabs defaultValue="edit">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<TabsList>
							<TabsTrigger value="edit">
								<PencilRuler />
								Контент
								<span className="tabular-nums opacity-70">{items.length}</span>
							</TabsTrigger>
							<TabsTrigger value="preview">
								<Eye />
								Харах
							</TabsTrigger>
							<TabsTrigger value="report">
								<BarChart3 />
								Тайлан
							</TabsTrigger>
						</TabsList>
						<div className="flex items-center gap-2">
							{dirty && (
								<StatusPill tone="sun">Хадгалаагүй өөрчлөлт</StatusPill>
							)}
							<Button onClick={onSave} disabled={save.isPending || !dirty}>
								{save.isPending ? (
									<Loader2 className="animate-spin" />
								) : (
									<Save />
								)}
								Хадгалах
							</Button>
						</div>
					</div>
					<TabsContent value="edit">
						<ContentEditor
							items={items}
							setItems={setItems}
							errors={errors}
							rlessonId={rlessonId}
						/>
					</TabsContent>
					<TabsContent value="preview">
						<ContentPreview items={items} />
					</TabsContent>
					<TabsContent value="report">
						<ReportTab elibId={elibId} />
					</TabsContent>
				</Tabs>
			) : (
				<ContentPreview items={items} />
			)}

			<FolderDialog
				folder={editing}
				defaults={{ classId: 0, lessonId: 0 }}
				onClose={() => setEditing(null)}
			/>
		</>
	);
}
