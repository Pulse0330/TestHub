"use client";

import { useQuery } from "@tanstack/react-query";
import {
	BookOpenCheck,
	ChevronDown,
	ChevronsDownUp,
	ChevronsUpDown,
	Clock,
	FileStack,
	Layers,
	MonitorPlay,
	Pencil,
	Plus,
	Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ConfirmDelete,
	EmptyState,
	FilterBar,
	OptionSelect,
	Panel,
	SearchInput,
	StatusPill,
	toOptions,
} from "@/features/teacher/components";
import {
	itemOf,
	listOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ConfirmAction } from "./ConfirmAction";
import {
	ObjectivesDialog,
	RlessonDialog,
	type RlessonEdit,
	UlessonDialog,
	type UlessonEdit,
} from "./TreeDialogs";
import { bool, num, pick, planKey, type Row, str } from "./util";

export interface RlessonNode {
	id: number;
	rlessonname?: string;
	rlessondescr?: string;
	rtime?: number;
	content_cnt?: number;
	[key: string]: unknown;
}
export interface UlessonNode {
	ulesson_id: number;
	ulesson_name?: string;
	cnt?: number;
	isschool?: number | boolean;
	rlessons?: RlessonNode[];
	[key: string]: unknown;
}

export function TreeTab({ lessonId }: { lessonId: number }) {
	const { userId, schoolId } = useTeacher();
	const [currId, setCurrId] = useState("");
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState<Set<number>>(new Set());
	const [ulessonEdit, setUlessonEdit] = useState<UlessonEdit | null>(null);
	const [rlessonEdit, setRlessonEdit] = useState<RlessonEdit | null>(null);
	const [objectivesOf, setObjectivesOf] = useState<UlessonNode | null>(null);

	// Хичээл солигдвол хөтөлбөрийн сонголтыг цэвэрлэнэ
	// biome-ignore lint/correctness/useExhaustiveDependencies: lessonId өөрчлөгдөхөд л
	useEffect(() => {
		setCurrId("");
		setOpen(new Set());
	}, [lessonId]);

	const currQ = useQuery({
		queryKey: planKey("curr", lessonId),
		queryFn: () =>
			teacherApi.plan.curr({ lesson_id: lessonId, school_id: schoolId }),
		enabled: !!lessonId,
	});
	const currOptions = useMemo(
		() => toOptions(listOf(currQ.data), "id", "currplan_name"),
		[currQ.data],
	);
	useEffect(() => {
		if (!currId && currOptions.length) setCurrId(String(currOptions[0].value));
	}, [currId, currOptions]);

	const curr = Number(currId) || 0;
	const treeKey = planKey("tree", lessonId, curr);
	const dashKey = planKey("dash", lessonId, curr);

	const treeQ = useQuery({
		queryKey: treeKey,
		queryFn: () =>
			teacherApi.plan.tree({
				lesson_id: lessonId,
				curr_id: curr,
				user_id: userId,
				school_id: schoolId,
			}),
		enabled: !!curr && !!userId,
	});
	const dashQ = useQuery({
		queryKey: dashKey,
		queryFn: () =>
			teacherApi.plan.dash({
				lesson_id: lessonId,
				curr_id: curr,
				user_id: userId,
				school_id: schoolId,
			}),
		enabled: !!curr && !!userId,
	});

	const tree = useMemo(() => listOf<UlessonNode>(treeQ.data), [treeQ.data]);

	const q = search.trim().toLowerCase();
	const visible = useMemo(() => {
		if (!q) return tree;
		return tree
			.map((u) => {
				const selfHit = str(u.ulesson_name).toLowerCase().includes(q);
				const rl = (u.rlessons ?? []).filter((r) =>
					str(r.rlessonname).toLowerCase().includes(q),
				);
				if (selfHit) return u;
				return rl.length ? { ...u, rlessons: rl } : null;
			})
			.filter((u): u is UlessonNode => u !== null);
	}, [tree, q]);

	const stats = useMemo(() => {
		const d = itemOf<Row>(dashQ.data);
		const rl = tree.flatMap((u) => u.rlessons ?? []);
		return [
			{
				label: "Бүлэг сэдэв",
				icon: Layers,
				value: num(
					pick(d, "ulesson_cnt", "cnt_ulesson", "ulesson") ?? tree.length,
				),
			},
			{
				label: "Сэдэв",
				icon: BookOpenCheck,
				value: num(
					pick(d, "rlesson_cnt", "cnt_rlesson", "rlesson") ?? rl.length,
				),
			},
			{
				label: "Нийт цаг",
				icon: Clock,
				value: num(
					pick(d, "rtime", "total_time", "time_cnt") ??
						rl.reduce((s, r) => s + num(r.rtime), 0),
				),
			},
			{
				label: "Агуулга",
				icon: FileStack,
				value: num(
					pick(d, "content_cnt", "cnt_content") ??
						rl.reduce((s, r) => s + num(r.content_cnt), 0),
				),
			},
		];
	}, [dashQ.data, tree]);

	const invalidate = [planKey("tree", lessonId), planKey("dash", lessonId)];

	const removeUlesson = useTeacherMutation(
		(id: number) => teacherApi.plan.ulesson.remove({ id, user_id: userId }),
		{ success: "Бүлэг сэдэв устгагдлаа", invalidate },
	);
	const removeRlesson = useTeacherMutation(
		(id: number) =>
			teacherApi.plan.rlesson.remove({
				id,
				lesson_id: lessonId,
				user_id: userId,
			}),
		{ success: "Сэдэв устгагдлаа", invalidate },
	);
	const toElesson = useTeacherMutation(
		(id: number) =>
			teacherApi.plan.rlesson.toElesson({
				id,
				lesson_id: lessonId,
				user_id: userId,
			}),
		{ success: "Цахим хичээл үүсгэлээ", invalidate },
	);

	const toggle = (id: number) =>
		setOpen((s) => {
			const n = new Set(s);
			if (n.has(id)) n.delete(id);
			else n.add(id);
			return n;
		});
	const addRlesson = (ulessonId: number) =>
		setRlessonEdit({
			id: 0,
			ulesson_id: ulessonId,
			name: "",
			rtime: "",
			formofstudy: "",
		});
	const allOpen = tree.length > 0 && open.size >= tree.length;

	const ulessonOptions = useMemo(
		() =>
			tree.map((u) => ({
				value: u.ulesson_id,
				label: str(u.ulesson_name),
			})),
		[tree],
	);

	return (
		<div className="grid gap-4">
			<Panel>
				<FilterBar>
					<OptionSelect
						id="plan-curr"
						options={currOptions}
						value={currId}
						onChange={(v) => {
							setCurrId(v);
							setOpen(new Set());
						}}
						placeholder={
							currQ.isLoading
								? "Ачаалж байна..."
								: currOptions.length
									? "Хөтөлбөр сонгох"
									: "Хөтөлбөр алга"
						}
						className="sm:w-72"
					/>
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Бүлэг сэдэв, сэдвээр хайх"
						className="sm:w-72"
					/>
				</FilterBar>
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
					{stats.map(({ label, icon: Icon, value }) => (
						<div
							key={label}
							className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3"
						>
							<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground">
								<Icon className="size-5" />
							</span>
							<div className="min-w-0">
								<p className="text-xl font-black tabular-nums leading-tight">
									{curr ? value : "–"}
								</p>
								<p className="truncate text-xs font-bold text-muted-foreground">
									{label}
								</p>
							</div>
						</div>
					))}
				</div>
			</Panel>

			<Panel
				title="Бүлэг сэдвүүд"
				actions={
					<div className="flex flex-wrap gap-2">
						{tree.length > 0 && (
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setOpen(
										allOpen
											? new Set()
											: new Set(tree.map((u) => u.ulesson_id)),
									)
								}
							>
								{allOpen ? <ChevronsDownUp /> : <ChevronsUpDown />}
								{allOpen ? "Бүгдийг хураах" : "Бүгдийг дэлгэх"}
							</Button>
						)}
						<Button
							size="sm"
							disabled={!curr}
							onClick={() => setUlessonEdit({ id: 0, name: "" })}
						>
							<Plus />
							Бүлэг сэдэв нэмэх
						</Button>
					</div>
				}
			>
				{!curr ? (
					<EmptyState text="Эхлээд хөтөлбөр сонгоно уу" />
				) : treeQ.isLoading ? (
					<div className="space-y-2">
						{["a", "b", "c", "d"].map((k) => (
							<Skeleton key={k} className="h-14 rounded-2xl" />
						))}
					</div>
				) : visible.length === 0 ? (
					<EmptyState
						text={
							q ? "Хайлтад тохирох сэдэв алга" : "Бүлэг сэдэв нэмээгүй байна"
						}
					/>
				) : (
					<ul className="grid gap-2">
						{visible.map((u, ui) => {
							const isOpen = open.has(u.ulesson_id) || !!q;
							const rl = u.rlessons ?? [];
							const panelId = `ul-${u.ulesson_id}`;
							return (
								<li
									key={u.ulesson_id}
									className="overflow-hidden rounded-2xl border border-border"
								>
									<div
										className={cn(
											"flex items-center gap-2 p-2 pr-3",
											isOpen && "bg-muted/40",
										)}
									>
										<button
											type="button"
											onClick={() => toggle(u.ulesson_id)}
											aria-expanded={isOpen}
											aria-controls={panelId}
											className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
										>
											<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-black text-primary-soft-foreground tabular-nums">
												{ui + 1}
											</span>
											<span className="min-w-0 flex-1">
												<span className="block truncate font-bold">
													{u.ulesson_name}
												</span>
												<span className="text-xs font-semibold text-muted-foreground">
													{num(u.cnt ?? rl.length)} сэдэв
													{bool(u.isschool) && " · Сургуулийн"}
												</span>
											</span>
											<ChevronDown
												className={cn(
													"size-4 shrink-0 text-muted-foreground transition-transform",
													isOpen && "rotate-180",
												)}
											/>
										</button>
										<div className="flex shrink-0 items-center gap-0.5">
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label="Сэдэв нэмэх"
												title="Сэдэв нэмэх"
												onClick={() => addRlesson(u.ulesson_id)}
												className="hidden sm:inline-flex"
											>
												<Plus />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label="Суралцахуйн зорилт"
												title="Суралцахуйн зорилт"
												onClick={() => setObjectivesOf(u)}
												className="hidden sm:inline-flex"
											>
												<Target />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label="Засах"
												title="Засах"
												onClick={() =>
													setUlessonEdit({
														id: u.ulesson_id,
														name: str(u.ulesson_name),
													})
												}
											>
												<Pencil />
											</Button>
											<ConfirmDelete
												title={`"${u.ulesson_name}" бүлэг сэдвийг устгах уу?`}
												description="Доторх сэдвүүд хамт устах боломжтой. Энэ үйлдлийг буцаах боломжгүй."
												onConfirm={() => removeUlesson.mutate(u.ulesson_id)}
												pending={removeUlesson.isPending}
											/>
										</div>
									</div>
									{isOpen && (
										<div id={panelId} className="border-t border-border">
											<div className="flex justify-between gap-2 px-3 pt-2 sm:hidden">
												<Button
													variant="ghost"
													size="xs"
													onClick={() => addRlesson(u.ulesson_id)}
												>
													<Plus />
													Сэдэв нэмэх
												</Button>
												<Button
													variant="ghost"
													size="xs"
													onClick={() => setObjectivesOf(u)}
												>
													<Target />
													Суралцахуйн зорилт
												</Button>
											</div>
											{rl.length === 0 ? (
												<p className="px-4 py-5 text-center text-sm font-semibold text-muted-foreground">
													Сэдэв нэмээгүй байна
												</p>
											) : (
												<ol className="divide-y divide-border">
													{rl.map((r, ri) => (
														<li
															key={r.id}
															className="flex items-start gap-3 px-3 py-2.5 sm:px-4"
														>
															<span className="mt-0.5 w-8 shrink-0 text-right text-xs font-bold text-muted-foreground tabular-nums">
																{ui + 1}.{ri + 1}
															</span>
															<div className="min-w-0 flex-1">
																<p className="text-sm font-bold">
																	{r.rlessonname}
																</p>
																{r.rlessondescr && (
																	<p className="line-clamp-2 text-xs font-semibold text-muted-foreground">
																		{r.rlessondescr}
																	</p>
																)}
																<div className="mt-1 flex flex-wrap gap-1.5">
																	<StatusPill>
																		<Clock className="mr-1 size-3" />
																		{num(r.rtime)} цаг
																	</StatusPill>
																	{num(r.content_cnt) > 0 && (
																		<StatusPill tone="mint">
																			{num(r.content_cnt)} агуулга
																		</StatusPill>
																	)}
																</div>
															</div>
															<div className="flex shrink-0 items-center gap-0.5">
																<ConfirmAction
																	title="Цахим хичээл болгох уу?"
																	description={`"${r.rlessonname}" сэдвээр цахим хичээл үүсгэнэ.`}
																	confirmLabel="Цахим хичээл болгох"
																	onConfirm={() => toElesson.mutate(r.id)}
																	pending={toElesson.isPending}
																	trigger={
																		<Button
																			variant="ghost"
																			size="icon-sm"
																			aria-label="Цахим хичээл болгох"
																			title="Цахим хичээл болгох"
																		>
																			<MonitorPlay />
																		</Button>
																	}
																/>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	aria-label="Засах"
																	title="Засах"
																	onClick={() =>
																		setRlessonEdit({
																			id: r.id,
																			ulesson_id: u.ulesson_id,
																			name: str(r.rlessonname),
																			rtime: str(r.rtime),
																			formofstudy: "",
																		})
																	}
																>
																	<Pencil />
																</Button>
																<ConfirmDelete
																	title={`"${r.rlessonname}" сэдвийг устгах уу?`}
																	onConfirm={() => removeRlesson.mutate(r.id)}
																	pending={removeRlesson.isPending}
																/>
															</div>
														</li>
													))}
												</ol>
											)}
										</div>
									)}
								</li>
							);
						})}
					</ul>
				)}
			</Panel>

			<UlessonDialog
				value={ulessonEdit}
				onClose={() => setUlessonEdit(null)}
				lessonId={lessonId}
				currId={curr}
				invalidate={invalidate}
			/>
			<RlessonDialog
				value={rlessonEdit}
				onClose={() => setRlessonEdit(null)}
				lessonId={lessonId}
				currId={curr}
				ulessonOptions={ulessonOptions}
				invalidate={invalidate}
			/>
			<ObjectivesDialog
				ulesson={objectivesOf}
				onClose={() => setObjectivesOf(null)}
			/>
		</div>
	);
}
