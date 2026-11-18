"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	Field,
	FormDialog,
	OptionSelect,
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
import {
	CheckGroup,
	ImageField,
	normOptions,
	num,
	type Row,
	str,
	toDateInput,
} from "./shared";

export const EDU_LEVELS = [
	{ value: 1, label: "Бага" },
	{ value: 2, label: "Дунд" },
	{ value: 3, label: "Ахлах" },
];

const EMPTY = {
	lastname: "",
	firstname: "",
	register: "",
	phone: "",
	email: "",
	dateofbirth: "",
	gender: "",
	ugroup: "",
	position_id: "",
	profession_id: "",
	login_name: "",
	password: "",
	img_url: "",
	edu_levels: [] as number[],
};
type Form = typeof EMPTY;

const refKey = (name: string) => teacherKey("teacher-ref", name);

export function TeacherEditor({
	teacherId,
	onClose,
	invalidateKey,
}: {
	/** null — хаалттай, 0 — шинэ */
	teacherId: number | null;
	onClose: () => void;
	invalidateKey: readonly unknown[];
}) {
	const { userId, schoolId } = useTeacher();
	const open = teacherId !== null;
	const isNew = teacherId === 0;
	const [form, setForm] = useState<Form>(EMPTY);
	const [touched, setTouched] = useState(false);
	const ids = useId();
	const set = <K extends keyof Form>(k: K, v: Form[K]) =>
		setForm((f) => ({ ...f, [k]: v }));

	const refOpts = { enabled: open, staleTime: 10 * 60_000 };
	const positions = useQuery({
		queryKey: refKey("positions"),
		queryFn: () => teacherApi.teacher.positions(),
		...refOpts,
	});
	const userTypes = useQuery({
		queryKey: refKey("usertypes"),
		queryFn: () => teacherApi.teacher.userTypes(),
		...refOpts,
	});
	const professions = useQuery({
		queryKey: refKey("professions"),
		queryFn: () => teacherApi.teacher.professions(),
		...refOpts,
	});
	const genders = useQuery({
		queryKey: refKey("genders"),
		queryFn: () => teacherApi.teacher.genders(),
		...refOpts,
	});

	const detail = useQuery({
		queryKey: teacherKey("teacher", teacherId),
		queryFn: () => teacherApi.teacher.get({ teacher_id: teacherId ?? 0 }),
		enabled: open && !isNew,
		// Засварлаж байх үед маягт дахин дүүрэхээс сэргийлнэ
		refetchOnWindowFocus: false,
	});

	// Нээх бүрд маягтыг цэвэрлэх / ачаалсан мэдээллээр дүүргэх
	useEffect(() => {
		if (!open) return;
		setTouched(false);
		if (isNew) {
			setForm(EMPTY);
			return;
		}
		const data = itemOf<Row>(detail.data);
		if (!data) return;
		const rawInfo = data.info;
		const info = (Array.isArray(rawInfo) ? rawInfo[0] : rawInfo) as
			| Row
			| undefined;
		const levels = Array.isArray(data.edu_levels)
			? (data.edu_levels as Row[]).map((r) => num(r, "elevel_id"))
			: [];
		const idOrEmpty = (...k: string[]) => {
			const n = num(info, ...k);
			return n ? String(n) : "";
		};
		setForm({
			lastname: str(info, "lastname", "lname"),
			firstname: str(info, "firstname", "fname"),
			register: str(info, "register", "regnum", "reg_num", "registr"),
			phone: str(info, "phone", "phone1"),
			email: str(info, "email"),
			dateofbirth: toDateInput(str(info, "dateofbirth", "birthday")),
			gender: idOrEmpty("gender", "gender_id", "sex"),
			ugroup: idOrEmpty("ugroup", "usertype", "user_type"),
			position_id: idOrEmpty("position_id", "posid", "pos_id"),
			profession_id: idOrEmpty("profession_id", "prof_id", "mergejil_id"),
			login_name: str(info, "login_name", "loginname"),
			password: "",
			img_url: str(info, "img_url", "imgurl", "image"),
			edu_levels: levels,
		});
	}, [open, isNew, detail.data]);

	const save = useTeacherMutation(
		(f: Form) =>
			teacherApi.teacher.save({
				teacher_id: teacherId ?? 0,
				lastname: f.lastname.trim(),
				firstname: f.firstname.trim(),
				register: f.register.trim().toUpperCase(),
				phone: f.phone.trim() || undefined,
				email: f.email.trim() || undefined,
				school_id: schoolId,
				ugroup: Number(f.ugroup),
				position_id: f.position_id ? Number(f.position_id) : undefined,
				profession_id: f.profession_id ? Number(f.profession_id) : undefined,
				login_name: f.login_name.trim() || undefined,
				password: f.password || undefined,
				user_id: userId,
				dateofbirth: f.dateofbirth || undefined,
				gender: f.gender ? Number(f.gender) : undefined,
				img_url: f.img_url || undefined,
				edu_levels: f.edu_levels,
			}),
		{
			success: isNew ? "Багш нэмэгдлээ" : "Багшийн мэдээлэл хадгалагдлаа",
			invalidate: [[...invalidateKey], teacherKey("teacher", teacherId)],
			onSuccess: onClose,
		},
	);

	const req = (v: string) =>
		touched && !v.trim() ? "Заавал бөглөнө" : undefined;
	const emailError =
		form.email && !/^\S+@\S+\.\S+$/.test(form.email)
			? "Имэйл буруу байна"
			: undefined;

	const loading = !isNew && detail.isLoading;

	return (
		<FormDialog
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={isNew ? "Багш нэмэх" : "Багшийн мэдээлэл засах"}
			size="lg"
			pending={save.isPending || loading}
			onSubmit={() => {
				setTouched(true);
				if (
					!form.lastname.trim() ||
					!form.firstname.trim() ||
					!form.register.trim() ||
					!form.ugroup ||
					emailError
				)
					return;
				save.mutate(form);
			}}
		>
			{loading ? (
				<div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-muted-foreground">
					<Loader2 className="size-4 animate-spin" />
					Ачаалж байна...
				</div>
			) : (
				<>
					<ImageField
						value={form.img_url}
						onChange={(v) => set("img_url", v)}
					/>
					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="Овог" required error={req(form.lastname)}>
							<Input
								value={form.lastname}
								maxLength={100}
								onChange={(e) => set("lastname", e.target.value)}
							/>
						</Field>
						<Field label="Нэр" required error={req(form.firstname)}>
							<Input
								value={form.firstname}
								maxLength={100}
								onChange={(e) => set("firstname", e.target.value)}
							/>
						</Field>
						<Field label="Регистр" required error={req(form.register)}>
							<Input
								value={form.register}
								maxLength={10}
								onChange={(e) => set("register", e.target.value)}
							/>
						</Field>
						<Field label="Төрсөн огноо">
							<Input
								type="date"
								value={form.dateofbirth}
								onChange={(e) => set("dateofbirth", e.target.value)}
							/>
						</Field>
						<Field label="Хүйс">
							<OptionSelect
								id={`${ids}-gender`}
								className="sm:w-full"
								options={toOptions(listOf(genders.data), "typeid", "typename")}
								value={form.gender}
								onChange={(v) => set("gender", v)}
							/>
						</Field>
						<Field label="Утас">
							<Input
								type="tel"
								inputMode="tel"
								value={form.phone}
								maxLength={20}
								onChange={(e) => set("phone", e.target.value)}
							/>
						</Field>
						<Field label="Имэйл" error={emailError} className="sm:col-span-2">
							<Input
								type="email"
								value={form.email}
								maxLength={100}
								onChange={(e) => set("email", e.target.value)}
							/>
						</Field>
						<Field
							label="Хэрэглэгчийн төрөл"
							required
							error={touched && !form.ugroup ? "Сонгоно уу" : undefined}
						>
							<OptionSelect
								id={`${ids}-ugroup`}
								className="sm:w-full"
								options={toOptions(listOf(userTypes.data))}
								value={form.ugroup}
								onChange={(v) => set("ugroup", v)}
							/>
						</Field>
						<Field label="Албан тушаал">
							<OptionSelect
								id={`${ids}-position`}
								className="sm:w-full"
								options={toOptions(listOf(positions.data))}
								value={form.position_id}
								onChange={(v) => set("position_id", v)}
							/>
						</Field>
						<Field label="Мэргэжил" className="sm:col-span-2">
							<OptionSelect
								id={`${ids}-profession`}
								className="sm:w-full"
								options={normOptions(listOf<Row>(professions.data))}
								value={form.profession_id}
								onChange={(v) => set("profession_id", v)}
							/>
						</Field>
						<Field label="Нэвтрэх нэр">
							<Input
								value={form.login_name}
								maxLength={50}
								autoComplete="off"
								onChange={(e) => set("login_name", e.target.value)}
							/>
						</Field>
						<Field
							label="Нууц үг"
							hint={isNew ? undefined : "Хоосон бол өөрчлөгдөхгүй"}
						>
							<Input
								type="password"
								value={form.password}
								maxLength={50}
								autoComplete="new-password"
								onChange={(e) => set("password", e.target.value)}
							/>
						</Field>
					</div>
					<CheckGroup
						legend="Заадаг түвшин"
						options={EDU_LEVELS}
						value={form.edu_levels}
						onChange={(v) => set("edu_levels", v)}
						columns={4}
					/>
				</>
			)}
		</FormDialog>
	);
}
