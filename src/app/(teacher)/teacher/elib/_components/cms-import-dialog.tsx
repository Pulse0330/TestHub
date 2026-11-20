"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	EmptyState,
	FormDialog,
	OptionSelect,
	toOptions,
} from "@/features/teacher/components";
import {
	listOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CoverPicker } from "./folder-dialog";
import { elibKeys, SWATCHES } from "./shared";
import { TopicPicker, type TopicValue } from "./topic-picker";

type RefKind = "lesson" | "class" | "type" | "source" | "school";
const REF_KINDS: { kind: RefKind; label: string; field: string }[] = [
	{ kind: "lesson", label: "Хичээл", field: "lesson_code" },
	{ kind: "class", label: "Анги", field: "class_code" },
	{ kind: "type", label: "Төрөл", field: "type_code" },
	{ kind: "source", label: "Эх сурвалж", field: "source_code" },
	{ kind: "school", label: "Сургууль", field: "school_code" },
];

interface CmsRow {
	id?: number;
	cms_id?: number;
	title?: string;
	name?: string;
	l_name?: string;
	lesson_name?: string;
	class_name?: string;
	type_name?: string;
	source_name?: string;
	owner?: string;
	[key: string]: unknown;
}

const cmsIdOf = (r: CmsRow) => Number(r.cms_id ?? r.id ?? 0);

function RefSelect({
	kind,
	label,
	value,
	onChange,
}: {
	kind: RefKind;
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	const refs = useQuery({
		queryKey: teacherKey("elib", "cms-refs", kind),
		queryFn: () => teacherApi.elib.cms.refs({ kind }),
		staleTime: Number.POSITIVE_INFINITY,
	});
	return (
		<OptionSelect
			options={toOptions(listOf(refs.data), "code", "title")}
			value={value || "0"}
			allLabel={`${label}: бүгд`}
			onChange={(v) => onChange(v === "0" ? "" : v)}
			className="sm:w-full"
		/>
	);
}

/** CMS-ээс цахим хичээл импортлох. */
export function CmsImportDialog({
	open,
	onClose,
	defaults,
}: {
	open: boolean;
	onClose: () => void;
	defaults: { classId: number; lessonId: number };
}) {
	const { userId, loginName } = useTeacher();
	const [filters, setFilters] = useState<Record<string, string>>({});
	const [mine, setMine] = useState(false);
	const [picked, setPicked] = useState<number>(0);
	const [topic, setTopic] = useState<TopicValue>({
		classId: 0,
		lessonId: 0,
		rlessonId: 0,
	});
	const [image, setImage] = useState(SWATCHES[0]);
	const [isPublic, setIsPublic] = useState(false);
	const [touched, setTouched] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: зөвхөн нээгдэх үед
	useEffect(() => {
		if (!open) return;
		setPicked(0);
		setTouched(false);
		setTopic({ ...defaults, rlessonId: 0 });
	}, [open]);

	const cmsFilter = {
		login: loginName,
		...Object.fromEntries(Object.entries(filters).filter(([, v]) => !!v)),
		owner: mine ? loginName : undefined,
	};
	const list = useQuery({
		queryKey: teacherKey("elib", "cms-list", cmsFilter),
		queryFn: () => teacherApi.elib.cms.list(cmsFilter),
		enabled: open,
	});
	const rows = listOf<CmsRow>(list.data);

	const importOne = useTeacherMutation(
		() =>
			teacherApi.elib.cms.importOne({
				...cmsFilter,
				user_id: userId,
				rlesson_id: topic.rlessonId,
				cms_id: picked,
				l_image: image,
				l_flag: isPublic ? 1 : 0,
			}),
		{
			success: "Цахим хичээл импортлогдлоо",
			invalidate: [elibKeys.all],
			onSuccess: onClose,
		},
	);

	return (
		<FormDialog
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="CMS-ээс импортлох"
			description="Бэлэн цахим хичээлийг сонгож өөрийн сэдэвт хавтас болгон нэмнэ"
			size="xl"
			submitLabel="Импортлох"
			pending={importOne.isPending}
			onSubmit={() => {
				setTouched(true);
				if (!picked || !topic.rlessonId) return;
				importOne.mutate(undefined);
			}}
		>
			<div className="grid gap-2 sm:grid-cols-3">
				{REF_KINDS.map((r) => (
					<RefSelect
						key={r.kind}
						kind={r.kind}
						label={r.label}
						value={filters[r.field] ?? ""}
						onChange={(v) => {
							setFilters((f) => ({ ...f, [r.field]: v }));
							setPicked(0);
						}}
					/>
				))}
				<div className="flex h-10 items-center justify-between gap-2 rounded-xl bg-muted/50 px-3">
					<span className="text-sm font-bold">Зөвхөн миний</span>
					<Switch
						checked={mine}
						onCheckedChange={(v) => {
							setMine(v);
							setPicked(0);
						}}
						aria-label="Зөвхөн миний"
					/>
				</div>
			</div>

			<div>
				<p className="mb-2 text-sm font-bold">
					Цахим хичээл сонгох
					{touched && !picked && (
						<span className="ml-2 text-xs text-destructive">
							Нэгийг сонгоно уу
						</span>
					)}
				</p>
				{list.isLoading ? (
					<div className="space-y-2">
						{["a", "b", "c"].map((k) => (
							<Skeleton key={k} className="h-14 rounded-xl" />
						))}
					</div>
				) : rows.length === 0 ? (
					<EmptyState text="CMS-д тохирох хичээл олдсонгүй" />
				) : (
					<fieldset
						aria-label="CMS цахим хичээл"
						className="grid max-h-72 gap-1.5 overflow-y-auto rounded-2xl border border-border p-1.5"
					>
						{rows.map((r) => {
							const id = cmsIdOf(r);
							const sel = picked === id;
							return (
								<label
									key={id}
									className={cn(
										"flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40",
										sel && "bg-primary-soft/60 hover:bg-primary-soft/60",
									)}
								>
									<input
										type="radio"
										name="cms-pick"
										className="sr-only"
										checked={sel}
										onChange={() => setPicked(id)}
									/>
									<span
										aria-hidden
										className={cn(
											"size-4 shrink-0 rounded-full border-2 border-border",
											sel &&
												"border-primary-soft-foreground bg-primary-soft-foreground shadow-[inset_0_0_0_2px_var(--card)]",
										)}
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-sm font-bold">
											{r.title ?? r.l_name ?? r.name ?? `#${id}`}
										</span>
										<span className="block truncate text-xs font-semibold text-muted-foreground">
											{[r.lesson_name, r.class_name, r.type_name, r.source_name]
												.filter(Boolean)
												.join(" · ")}
										</span>
									</span>
								</label>
							);
						})}
					</fieldset>
				)}
			</div>

			<TopicPicker
				value={topic}
				onChange={setTopic}
				error={touched && !topic.rlessonId ? "Сэдэв сонгоно уу" : undefined}
			/>
			<CoverPicker value={image} onChange={setImage} />
			<div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3">
				<span className="text-sm font-bold">Нийтэд нээлттэй</span>
				<Switch
					checked={isPublic}
					onCheckedChange={setIsPublic}
					aria-label="Нийтэд нээлттэй"
				/>
			</div>
		</FormDialog>
	);
}
