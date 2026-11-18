"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Building2,
	Globe,
	type LucideIcon,
	Mail,
	MapPin,
	Pencil,
	Phone,
} from "lucide-react";
import { useId, useState } from "react";
import {
	CheckGroup,
	num,
	type Row,
	str,
} from "@/app/(teacher)/teacher/teachers/_components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	EmptyState,
	Field,
	FormDialog,
	OptionSelect,
	PageHeader,
	Panel,
	StatusPill,
	toOptions,
} from "@/features/teacher/components";
import {
	itemOf,
	listOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";

const LEVELS = [
	{ value: 1, label: "Бага" },
	{ value: 2, label: "Дунд" },
	{ value: 3, label: "Ахлах" },
	{ value: 4, label: "Насан туршийн" },
];
const GROUPS = [
	{ value: 2, label: "Дэд бүлэг" },
	{ value: 3, label: "Групп" },
];

interface SchoolData {
	info: Row;
	levels: number[];
	groups: number[];
}

function parseInfo(res: Parameters<typeof itemOf>[0]): SchoolData | null {
	const d = itemOf<Row>(res);
	if (!d) return null;
	const info = Array.isArray(d.info) ? (d.info[0] as Row) : (d.info as Row);
	if (!info) return null;
	// Мөр бүр сонгогдсон утга; "checked" талбартай ирвэл 1-ийг нь л авна
	const rows = (v: unknown) =>
		(Array.isArray(v) ? (v as Row[]) : []).filter(
			(r) => !("checked" in r) || num(r, "checked") === 1,
		);
	return {
		info,
		levels: rows(d.levels).map((r) => num(r, "check_id", "id")),
		groups: rows(d.dedgroup).map((r) => num(r, "check", "check_id")),
	};
}

const EMPTY_FORM = {
	sch_name: "",
	sch_regnum: "",
	category_id: "",
	is_payment: false,
	aimag_id: "",
	sym_id: "",
	horoo_id: "",
	address: "",
	phone: "",
	email: "",
	web: "",
	facebook: "",
	levels: [] as number[],
	groups: [] as number[],
};
type Form = typeof EMPTY_FORM;

export default function TeacherSchoolPage() {
	const { userId, schoolId, isManager } = useTeacher();
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState<Form>(EMPTY_FORM);
	const [touched, setTouched] = useState(false);
	const ids = useId();
	const set = <K extends keyof Form>(k: K, v: Form[K]) =>
		setForm((f) => ({ ...f, [k]: v }));

	const infoKey = teacherKey("school-info", schoolId);
	const { data, isLoading } = useQuery({
		queryKey: infoKey,
		queryFn: () => teacherApi.schoolInfo.info({ school_id: schoolId }),
		enabled: !!schoolId,
	});
	const school = parseInfo(data);
	const info = school?.info;

	const categories = useQuery({
		queryKey: teacherKey("school-categories", schoolId),
		queryFn: () => teacherApi.schoolInfo.categories({ school_id: schoolId }),
		enabled: !!schoolId,
		staleTime: 10 * 60_000,
	});
	const aimags = useQuery({
		queryKey: teacherKey("aimag"),
		queryFn: () => teacherApi.schoolInfo.aimag(),
		enabled: editing,
		staleTime: 30 * 60_000,
	});
	const syms = useQuery({
		queryKey: teacherKey("sym", form.aimag_id),
		queryFn: () => teacherApi.schoolInfo.sym({ aimag_id: form.aimag_id }),
		enabled: editing && !!form.aimag_id,
		staleTime: 30 * 60_000,
	});
	const horoos = useQuery({
		queryKey: teacherKey("horoo", form.aimag_id, form.sym_id),
		queryFn: () =>
			teacherApi.schoolInfo.horoo({
				aimag_id: form.aimag_id,
				sym_id: form.sym_id,
			}),
		enabled: editing && !!form.aimag_id && !!form.sym_id,
		staleTime: 30 * 60_000,
	});

	const categoryOptions = toOptions(listOf(categories.data));
	const categoryName = categoryOptions.find(
		(o) => String(o.value) === str(info, "sch_Omch2"),
	)?.label;

	const openEditor = () => {
		if (!school) return;
		const i = school.info;
		setForm({
			sch_name: str(i, "sch_name"),
			sch_regnum: str(i, "sch_regnum"),
			category_id: num(i, "sch_Omch2") ? str(i, "sch_Omch2") : "",
			is_payment: num(i, "sch_payment111") === 1,
			aimag_id: str(i, "aimag_id"),
			sym_id: str(i, "sym_id"),
			horoo_id: str(i, "horoo_id"),
			address: str(i, "gudamj"),
			phone: str(i, "contact"),
			email: str(i, "email"),
			web: str(i, "web"),
			facebook: str(i, "orgfacebook"),
			levels: school.levels,
			groups: school.groups,
		});
		setTouched(false);
		setEditing(true);
	};

	const save = useTeacherMutation(
		(f: Form) =>
			teacherApi.schoolInfo.save({
				school_id: schoolId,
				sch_name: f.sch_name.trim(),
				sch_regnum: f.sch_regnum.trim() || undefined,
				category_id: f.category_id ? Number(f.category_id) : undefined,
				is_payment: f.is_payment ? 1 : 0,
				aimag_id: f.aimag_id,
				sym_id: f.sym_id,
				horoo_id: f.horoo_id || undefined,
				address: f.address.trim() || undefined,
				phone: f.phone.trim() || undefined,
				email: f.email.trim() || undefined,
				web: f.web.trim() || undefined,
				facebook: f.facebook.trim() || undefined,
				// Backend-ээс ирсэн утгыг хэвээр буцаана
				zasah: info?.Zasah === undefined ? undefined : Number(info.Zasah),
				chk_baga: f.levels.includes(1),
				chk_dund: f.levels.includes(2),
				chk_ahlah: f.levels.includes(3),
				chk_nasan: f.levels.includes(4),
				chk_ded: f.groups.includes(2),
				chk_group: f.groups.includes(3),
				user_id: userId,
			}),
		{
			success: "Сургуулийн мэдээлэл хадгалагдлаа",
			invalidate: [infoKey],
			onSuccess: () => setEditing(false),
		},
	);

	const emailError =
		form.email && !/^\S+@\S+\.\S+$/.test(form.email)
			? "Имэйл буруу байна"
			: undefined;
	const req = (v: string, msg = "Заавал бөглөнө") =>
		touched && !v.trim() ? msg : undefined;

	return (
		<>
			<PageHeader
				title="Сургууль"
				description="Сургуулийн үндсэн мэдээлэл"
				icon={Building2}
				actions={
					isManager &&
					school && (
						<Button onClick={openEditor}>
							<Pencil />
							Засах
						</Button>
					)
				}
			/>

			{isLoading ? (
				<div className="grid gap-4 lg:grid-cols-3">
					<Skeleton className="h-64 rounded-3xl lg:col-span-2" />
					<Skeleton className="h-64 rounded-3xl" />
				</div>
			) : !info ? (
				<Panel>
					<EmptyState text="Сургуулийн мэдээлэл олдсонгүй" />
				</Panel>
			) : (
				<div className="grid gap-4 lg:grid-cols-3">
					<Panel className="lg:col-span-2">
						<div className="mb-5 flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0">
								<h2 className="text-xl font-black tracking-tight">
									{str(info, "sch_name")}
								</h2>
								<p className="text-sm font-semibold text-muted-foreground">
									{categoryName || "Ангилал сонгоогүй"}
									{str(info, "sch_regnum") &&
										` · Регистр ${str(info, "sch_regnum")}`}
								</p>
							</div>
							<StatusPill
								tone={num(info, "sch_payment111") === 1 ? "mint" : "muted"}
							>
								{num(info, "sch_payment111") === 1 ? "Төлбөртэй" : "Төлбөргүй"}
							</StatusPill>
						</div>
						<dl className="grid gap-3 sm:grid-cols-2">
							<InfoItem
								icon={MapPin}
								label="Хаяг"
								value={[
									str(info, "AimagName"),
									str(info, "SymName"),
									str(info, "HorooName"),
									str(info, "gudamj"),
								]
									.filter(Boolean)
									.join(", ")}
								wide
							/>
							<InfoItem
								icon={Phone}
								label="Утас"
								value={str(info, "contact")}
							/>
							<InfoItem icon={Mail} label="Имэйл" value={str(info, "email")} />
							<InfoItem icon={Globe} label="Вэб" value={str(info, "web")} />
							<InfoItem
								icon={Globe}
								label="Facebook"
								value={str(info, "orgfacebook")}
							/>
						</dl>
					</Panel>
					<Panel title="Сургалтын түвшин">
						<ChipList
							items={LEVELS}
							active={school.levels}
							empty="Түвшин сонгоогүй"
						/>
						<h3 className="mt-5 mb-3 text-base font-black tracking-tight">
							Бүлэглэл
						</h3>
						<ChipList items={GROUPS} active={school.groups} empty="Сонгоогүй" />
					</Panel>
				</div>
			)}

			<FormDialog
				open={editing}
				onOpenChange={setEditing}
				title="Сургуулийн мэдээлэл засах"
				size="lg"
				pending={save.isPending}
				onSubmit={() => {
					setTouched(true);
					if (
						!form.sch_name.trim() ||
						!form.aimag_id ||
						!form.sym_id ||
						emailError
					)
						return;
					save.mutate(form);
				}}
			>
				<div className="grid gap-4 sm:grid-cols-2">
					<Field
						label="Сургуулийн нэр"
						required
						error={req(form.sch_name)}
						className="sm:col-span-2"
					>
						<Input
							value={form.sch_name}
							maxLength={250}
							onChange={(e) => set("sch_name", e.target.value)}
						/>
					</Field>
					<Field label="Регистрийн дугаар">
						<Input
							value={form.sch_regnum}
							maxLength={20}
							onChange={(e) => set("sch_regnum", e.target.value)}
						/>
					</Field>
					<Field label="Ангилал">
						<OptionSelect
							id={`${ids}-cat`}
							className="sm:w-full"
							options={categoryOptions}
							value={form.category_id}
							onChange={(v) => set("category_id", v)}
						/>
					</Field>
					<Field
						label="Аймаг, нийслэл"
						required
						error={req(form.aimag_id, "Сонгоно уу")}
					>
						<OptionSelect
							id={`${ids}-aimag`}
							className="sm:w-full"
							options={toOptions(listOf(aimags.data), "AimagID", "AimagName")}
							value={form.aimag_id}
							onChange={(v) =>
								setForm((f) => ({
									...f,
									aimag_id: v,
									sym_id: "",
									horoo_id: "",
								}))
							}
						/>
					</Field>
					<Field
						label="Сум, дүүрэг"
						required
						error={req(form.sym_id, "Сонгоно уу")}
					>
						<OptionSelect
							id={`${ids}-sym`}
							className="sm:w-full"
							disabled={!form.aimag_id}
							options={toOptions(listOf(syms.data), "SymID", "SymName")}
							value={form.sym_id}
							onChange={(v) =>
								setForm((f) => ({ ...f, sym_id: v, horoo_id: "" }))
							}
						/>
					</Field>
					<Field label="Баг, хороо">
						<OptionSelect
							id={`${ids}-horoo`}
							className="sm:w-full"
							disabled={!form.sym_id}
							options={toOptions(listOf(horoos.data), "HorooID", "HorooName")}
							value={form.horoo_id}
							onChange={(v) => set("horoo_id", v)}
						/>
					</Field>
					<Field label="Утас">
						<Input
							type="tel"
							inputMode="tel"
							value={form.phone}
							maxLength={50}
							onChange={(e) => set("phone", e.target.value)}
						/>
					</Field>
					<Field label="Хаяг (гудамж, байр)" className="sm:col-span-2">
						<Input
							value={form.address}
							maxLength={250}
							onChange={(e) => set("address", e.target.value)}
						/>
					</Field>
					<Field label="Имэйл" error={emailError}>
						<Input
							type="email"
							value={form.email}
							maxLength={100}
							onChange={(e) => set("email", e.target.value)}
						/>
					</Field>
					<Field label="Вэб хуудас">
						<Input
							value={form.web}
							maxLength={150}
							placeholder="https://"
							onChange={(e) => set("web", e.target.value)}
						/>
					</Field>
					<Field label="Facebook" className="sm:col-span-2">
						<Input
							value={form.facebook}
							maxLength={150}
							onChange={(e) => set("facebook", e.target.value)}
						/>
					</Field>
				</div>
				<CheckGroup
					legend="Сургалтын түвшин"
					options={LEVELS}
					value={form.levels}
					onChange={(v) => set("levels", v)}
					columns={2}
				/>
				<CheckGroup
					legend="Бүлэглэл"
					options={GROUPS}
					value={form.groups}
					onChange={(v) => set("groups", v)}
				/>
				<label
					htmlFor={`${ids}-pay`}
					className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
				>
					<span className="grid">
						<span className="text-sm font-bold">Төлбөртэй сургууль</span>
						<span className="text-xs font-semibold text-muted-foreground">
							Сургалтын төлбөр авдаг эсэх
						</span>
					</span>
					<Switch
						id={`${ids}-pay`}
						checked={form.is_payment}
						onCheckedChange={(c) => set("is_payment", c)}
					/>
				</label>
			</FormDialog>
		</>
	);
}

function InfoItem({
	icon: Icon,
	label,
	value,
	wide,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	wide?: boolean;
}) {
	return (
		<div
			className={`flex min-w-0 gap-3 rounded-2xl bg-muted/40 p-3 ${wide ? "sm:col-span-2" : ""}`}
		>
			<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground">
				<Icon className="size-4" />
			</span>
			<div className="min-w-0">
				<dt className="text-xs font-bold text-muted-foreground">{label}</dt>
				<dd
					className={`text-sm font-bold ${wide ? "break-words" : "truncate"}`}
				>
					{value || "—"}
				</dd>
			</div>
		</div>
	);
}

function ChipList({
	items,
	active,
	empty,
}: {
	items: { value: number; label: string }[];
	active: number[];
	empty: string;
}) {
	const on = items.filter((i) => active.includes(i.value));
	if (on.length === 0)
		return (
			<p className="text-sm font-semibold text-muted-foreground">{empty}</p>
		);
	return (
		<div className="flex flex-wrap gap-2">
			{on.map((i) => (
				<span
					key={i.value}
					className="rounded-full bg-primary-soft/60 px-3 py-1 text-sm font-bold text-primary-soft-foreground"
				>
					{i.label}
				</span>
			))}
		</div>
	);
}
