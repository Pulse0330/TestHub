"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	Field,
	FormDialog,
	formatDateTime,
	OptionSelect,
	type SelectOption,
	toOptions,
} from "@/features/teacher/components";
import {
	listOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { type LiveInfo, liveKeys } from "./shared";

interface FormState {
	lesson_id: string;
	lesson_name: string;
	sdate: string;
	contime: string;
	ltype: string;
	url: string;
	title: string;
	pass: string;
	descr: string;
	ispay: boolean;
	amount: string;
}

const EMPTY: FormState = {
	lesson_id: "",
	lesson_name: "",
	sdate: "",
	contime: "40",
	ltype: "",
	url: "",
	title: "",
	pass: "",
	descr: "",
	ispay: false,
	amount: "",
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function fromInfo(i: LiveInfo): FormState {
	return {
		lesson_id: str(i.lesson_id),
		lesson_name: str(i.live_title ?? i.lesson_name),
		sdate: formatDateTime(i.sdate).replace(" ", "T"),
		contime: str(i.contime || 40),
		ltype: str(i.ltype),
		url: str(i.url),
		title: str(i.title),
		pass: str(i.pass),
		descr: str(i.descr),
		ispay: Number(i.ispay) === 1,
		amount: Number(i.amount) ? str(i.amount) : "",
	};
}

/** Live хичээл бүртгэх / засах. liveId: null хаалттай, 0 шинэ. */
export function LiveForm({
	liveId,
	onClose,
	typeOptions,
}: {
	liveId: number | null;
	onClose: () => void;
	typeOptions: SelectOption[];
}) {
	const { userId } = useTeacher();
	const open = liveId !== null;
	const [form, setForm] = useState<FormState>(EMPTY);
	const [touched, setTouched] = useState(false);
	const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
		setForm((f) => ({ ...f, [k]: v }));

	const lessons = useQuery({
		queryKey: teacherKey("live", "lessons", userId, 0),
		queryFn: () => teacherApi.live.lessons({ user_id: userId }),
		enabled: open && !!userId,
	});
	const info = useQuery({
		queryKey: liveKeys.info(liveId ?? 0),
		queryFn: () => teacherApi.live.info({ live_id: liveId ?? 0 }),
		enabled: !!liveId,
	});

	useEffect(() => {
		if (!open) return;
		setTouched(false);
		if (!liveId) {
			setForm(EMPTY);
			return;
		}
		const first = info.data?.RetDataFirst as LiveInfo | LiveInfo[] | undefined;
		const i = Array.isArray(first) ? first[0] : first;
		if (i) setForm(fromInfo(i));
	}, [open, liveId, info.data]);

	const save = useTeacherMutation(
		(f: FormState) =>
			teacherApi.live.save({
				user_id: userId,
				live_id: liveId ?? 0,
				lesson_id: Number(f.lesson_id),
				lesson_name: f.lesson_name.trim(),
				sdate: f.sdate.replace("T", " ").slice(0, 16),
				contime: Number(f.contime),
				ltype: Number(f.ltype),
				url: f.url.trim(),
				title: f.title.trim(),
				pass: f.pass.trim(),
				descr: f.descr.trim(),
				ispay: f.ispay ? 1 : 0,
				amount: f.ispay ? Number(f.amount) : 0,
			}),
		{
			success: "Live хичээл хадгалагдлаа",
			invalidate: [liveKeys.all],
			onSuccess: onClose,
		},
	);

	const errors: Partial<Record<keyof FormState, string>> = {};
	if (!form.lesson_id) errors.lesson_id = "Хичээл сонгоно уу";
	if (!form.lesson_name.trim()) errors.lesson_name = "Сэдэв оруулна уу";
	if (!form.sdate) errors.sdate = "Эхлэх цаг оруулна уу";
	if (!(Number(form.contime) > 0)) errors.contime = "0-ээс их минут";
	if (!form.ltype) errors.ltype = "Төрөл сонгоно уу";
	if (!form.url.trim()) errors.url = "Холбоос оруулна уу";
	else if (!/^https?:\/\//i.test(form.url.trim()))
		errors.url = "http(s):// -ээр эхэлсэн холбоос";
	if (form.ispay && !(Number(form.amount) > 0))
		errors.amount = "Төлбөрийн дүн 0-ээс их байна";
	const err = (k: keyof FormState) => (touched ? errors[k] : undefined);

	const lessonOptions = toOptions(listOf(lessons.data));
	const loadingInfo = !!liveId && info.isLoading;

	return (
		<FormDialog
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={liveId ? "Live хичээл засах" : "Live хичээл нэмэх"}
			size="lg"
			pending={save.isPending || loadingInfo}
			onSubmit={() => {
				setTouched(true);
				if (Object.keys(errors).length) return;
				save.mutate(form);
			}}
		>
			{loadingInfo ? (
				<div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-muted-foreground">
					<Loader2 className="size-4 animate-spin" />
					Ачаалж байна...
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2">
					<Field label="Хичээл" required error={err("lesson_id")}>
						<OptionSelect
							options={lessonOptions}
							value={form.lesson_id}
							onChange={(v) => set("lesson_id", v)}
							placeholder="Хичээл сонгох"
							className="sm:w-full"
						/>
					</Field>
					<Field label="Төрөл" required error={err("ltype")}>
						<OptionSelect
							options={typeOptions}
							value={form.ltype}
							onChange={(v) => set("ltype", v)}
							placeholder="Zoom, Meet ..."
							className="sm:w-full"
						/>
					</Field>
					<Field
						label="Сэдэв"
						required
						error={err("lesson_name")}
						className="sm:col-span-2"
					>
						<Input
							value={form.lesson_name}
							maxLength={250}
							onChange={(e) => set("lesson_name", e.target.value)}
						/>
					</Field>
					<Field label="Эхлэх огноо, цаг" required error={err("sdate")}>
						<Input
							type="datetime-local"
							value={form.sdate}
							onChange={(e) => set("sdate", e.target.value)}
						/>
					</Field>
					<Field
						label="Үргэлжлэх хугацаа (минут)"
						required
						error={err("contime")}
					>
						<Input
							type="number"
							min={1}
							inputMode="numeric"
							value={form.contime}
							onChange={(e) => set("contime", e.target.value)}
						/>
					</Field>
					<Field
						label="Холбоос (URL)"
						required
						error={err("url")}
						className="sm:col-span-2"
					>
						<Input
							type="url"
							value={form.url}
							maxLength={500}
							placeholder="https://zoom.us/j/..."
							onChange={(e) => set("url", e.target.value)}
						/>
					</Field>
					<Field label="Meeting ID" hint="25 хүртэл тэмдэгт">
						<Input
							value={form.title}
							maxLength={25}
							onChange={(e) => set("title", e.target.value)}
						/>
					</Field>
					<Field label="Нууц үг" hint="50 хүртэл тэмдэгт">
						<Input
							value={form.pass}
							maxLength={50}
							onChange={(e) => set("pass", e.target.value)}
						/>
					</Field>
					<Field
						label="Тайлбар"
						hint={`${form.descr.length}/150`}
						className="sm:col-span-2"
					>
						<Textarea
							value={form.descr}
							maxLength={150}
							rows={2}
							onChange={(e) => set("descr", e.target.value)}
						/>
					</Field>
					<div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3 sm:col-span-2">
						<div>
							<p className="text-sm font-bold">Төлбөртэй хичээл</p>
							<p className="text-xs font-semibold text-muted-foreground">
								Суралцагч төлбөр төлж холбогдоно
							</p>
						</div>
						<Switch
							checked={form.ispay}
							onCheckedChange={(v) => set("ispay", v)}
							aria-label="Төлбөртэй хичээл"
						/>
					</div>
					{form.ispay && (
						<Field label="Төлбөрийн дүн (₮)" required error={err("amount")}>
							<Input
								type="number"
								min={1}
								inputMode="numeric"
								value={form.amount}
								onChange={(e) => set("amount", e.target.value)}
							/>
						</Field>
					)}
				</div>
			)}
		</FormDialog>
	);
}
