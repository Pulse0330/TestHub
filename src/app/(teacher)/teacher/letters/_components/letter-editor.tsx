"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Mail, Save, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Field,
	OptionSelect,
	PageHeader,
	Panel,
} from "@/features/teacher/components";
import {
	itemOf,
	listOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { LetterTarget, SavedId } from "@/lib/teacher-api";
import { cn } from "@/lib/utils";
import {
	bool,
	fromLocalInput,
	lettersKey,
	num,
	pick,
	type Row,
	str,
	toLocalInput,
} from "../_lib/shared";
import { Attachments, type LetterFileInput } from "./attachments";
import { FieldGroup } from "./field-group";
import { HtmlEditor } from "./html-editor";
import { RecipientsBuilder } from "./recipients-builder";

interface Form {
	type_id: string;
	subject: string;
	body: string;
	priority: number;
	require_ack: boolean;
	sender_name: string;
	sender_title: string;
	sender_org: string;
	send_date: string;
	expire_date: string;
}

const EMPTY: Form = {
	type_id: "",
	subject: "",
	body: "",
	priority: 1,
	require_ack: false,
	sender_name: "",
	sender_title: "",
	sender_org: "",
	send_date: "",
	expire_date: "",
};

export function LetterEditor({ id }: { id: number }) {
	const router = useRouter();
	const { userId, schoolId, schoolName } = useTeacher();
	const [form, setForm] = useState<Form>(EMPTY);
	const [targets, setTargets] = useState<LetterTarget[]>([]);
	const [files, setFiles] = useState<LetterFileInput[]>([]);
	const [confirmSend, setConfirmSend] = useState(false);
	const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
	const set = <K extends keyof Form>(k: K, v: Form[K]) =>
		setForm((f) => ({ ...f, [k]: v }));

	const typesQ = useQuery({
		queryKey: lettersKey("types"),
		queryFn: () => teacherApi.letterAdmin.types(),
	});
	const sendersQ = useQuery({
		queryKey: lettersKey("senders", schoolId),
		queryFn: () => teacherApi.letterAdmin.senders({ school_id: schoolId }),
	});
	const detailQ = useQuery({
		queryKey: lettersKey("get", id),
		queryFn: () => teacherApi.letterAdmin.get({ id }),
		enabled: id > 0,
	});

	// Засах үед өгөгдлийг маягт руу ачаална
	useEffect(() => {
		if (!detailQ.data) return;
		const d = itemOf<Row>(detailQ.data);
		const l = (d?.letter as Row | undefined) ?? d;
		if (!l) return;
		setForm({
			type_id: str(l, "type_id"),
			subject: str(l, "subject"),
			body: str(l, "body"),
			priority: num(l, "priority") || 1,
			require_ack: bool(l, "require_ack"),
			sender_name: str(l, "sender_name"),
			sender_title: str(l, "sender_title"),
			sender_org: str(l, "sender_org"),
			send_date: toLocalInput(pick(l, "send_date")),
			expire_date: toLocalInput(pick(l, "expire_date")),
		});
		setTargets(
			((d?.targets as Row[] | undefined) ?? []).map((t) => ({
				aimag_id: num(t, "aimag_id"),
				sym_id: num(t, "sym_id"),
				schooldb: str(t, "schooldb", "school_db"),
				class_id: num(t, "class_id"),
				label: str(t, "label", "target_label", "title"),
			})),
		);
		setFiles(
			((d?.files as Row[] | undefined) ?? []).map((f) => ({
				filename: str(f, "file_url", "filename"),
				uploaded: str(f, "uploaded"),
				file_ext: str(f, "file_ext"),
				file_size: num(f, "file_size"),
			})),
		);
	}, [detailQ.data]);

	const typeOpts = useMemo(
		() =>
			listOf<Row>(typesQ.data).map((r) => ({
				value: str(r, "id", "type_id"),
				label: str(r, "title", "type_name", "name"),
			})),
		[typesQ.data],
	);
	const senders = useMemo(() => {
		const seen = new Set<string>();
		return listOf<Row>(sendersQ.data)
			.map((r) => ({
				sender_name: str(r, "sender_name", "name"),
				sender_title: str(r, "sender_title", "title"),
				sender_org: str(r, "sender_org", "org"),
			}))
			.filter((s) => {
				const k = `${s.sender_name}|${s.sender_title}|${s.sender_org}`;
				if (!s.sender_name || seen.has(k)) return false;
				seen.add(k);
				return true;
			})
			.slice(0, 6);
	}, [sendersQ.data]);

	const save = useTeacherMutation(
		(send: boolean) =>
			teacherApi.letterAdmin.save({
				id,
				type_id: Number(form.type_id),
				subject: form.subject.trim(),
				body: form.body,
				priority: form.priority,
				require_ack: form.require_ack,
				sender_name: form.sender_name.trim() || undefined,
				sender_title: form.sender_title.trim() || undefined,
				sender_org: form.sender_org.trim() || undefined,
				send_date: fromLocalInput(form.send_date),
				expire_date: fromLocalInput(form.expire_date),
				school_id: schoolId,
				user_id: userId,
				targets,
				files,
				send,
			}),
		{
			invalidate: [lettersKey()],
			onSuccess: (res, send) => {
				const r = itemOf<SavedId>(res);
				const newId = Number(r?.RtrID ?? r?.NewID ?? r?.RetID ?? id) || id;
				setConfirmSend(false);
				router.push(
					send || !newId ? "/teacher/letters" : `/teacher/letters/${newId}`,
				);
			},
		},
	);

	const validate = (send: boolean) => {
		const e: typeof errors = {};
		if (!form.type_id) e.type_id = "Төрөл сонгоно уу";
		if (!form.subject.trim()) e.subject = "Гарчиг оруулна уу";
		if (send && !form.body.trim()) e.body = "Агуулга оруулна уу";
		if (
			form.send_date &&
			form.expire_date &&
			form.expire_date <= form.send_date
		)
			e.expire_date = "Дуусах огноо илгээх огнооноос хойш байна";
		setErrors(e);
		if (Object.keys(e).length) {
			toast.error(Object.values(e)[0]);
			return false;
		}
		if (send && targets.length === 0) {
			toast.error("Хүлээн авагч сонгоно уу");
			return false;
		}
		return true;
	};

	if (id > 0 && detailQ.isLoading) {
		return (
			<div className="grid gap-4">
				<Skeleton className="h-14 rounded-2xl" />
				<Skeleton className="h-96 rounded-3xl" />
			</div>
		);
	}

	const actions = (
		<>
			<Button
				type="button"
				variant="outline"
				disabled={save.isPending}
				onClick={() => validate(false) && save.mutate(false)}
			>
				{save.isPending && save.variables === false ? (
					<Loader2 className="animate-spin" />
				) : (
					<Save />
				)}
				Ноорог хадгалах
			</Button>
			<Button
				type="button"
				disabled={save.isPending}
				onClick={() => validate(true) && setConfirmSend(true)}
			>
				<Send />
				{form.send_date ? "Товлож илгээх" : "Илгээх"}
			</Button>
		</>
	);

	return (
		<>
			<Link
				href="/teacher/letters"
				className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Захидлууд
			</Link>
			<PageHeader
				title={id > 0 ? "Захидал засах" : "Шинэ захидал"}
				description={schoolName || "Захидал бичиж илгээх"}
				icon={Mail}
				actions={actions}
			/>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
				<div className="grid min-w-0 content-start gap-4">
					<Panel title="Захидал">
						<div className="grid gap-4">
							<div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
								<Field label="Төрөл" required error={errors.type_id}>
									<OptionSelect
										options={typeOpts}
										value={form.type_id}
										onChange={(v) => set("type_id", v)}
										placeholder="Төрөл сонгох"
										className="sm:w-full"
									/>
								</Field>
								<Field label="Гарчиг" required error={errors.subject}>
									<Input
										value={form.subject}
										maxLength={250}
										onChange={(e) => set("subject", e.target.value)}
										placeholder="Захидлын гарчиг"
									/>
								</Field>
							</div>
							<FieldGroup label="Агуулга" required>
								<HtmlEditor
									value={form.body}
									onChange={(v) => set("body", v)}
									placeholder="<p>Эрхэм эцэг эх, сурагчид аа...</p>"
								/>
								{errors.body && (
									<span className="text-xs font-bold text-destructive">
										{errors.body}
									</span>
								)}
							</FieldGroup>
							<FieldGroup label="Хавсралт">
								<Attachments files={files} onChange={setFiles} />
							</FieldGroup>
						</div>
					</Panel>
					<Panel title="Хүлээн авагч">
						<RecipientsBuilder
							schoolId={schoolId}
							targets={targets}
							onChange={setTargets}
						/>
					</Panel>
				</div>

				<div className="grid content-start gap-4">
					<Panel title="Тохиргоо">
						<div className="grid gap-4">
							<fieldset className="grid gap-1.5">
								<legend className="mb-1.5 text-sm font-bold">
									Чухал байдал
								</legend>
								<div className="grid grid-cols-2 gap-2">
									{[
										{ v: 1, l: "Энгийн" },
										{ v: 2, l: "Яаралтай" },
									].map((o) => (
										<button
											key={o.v}
											type="button"
											aria-pressed={form.priority === o.v}
											onClick={() => set("priority", o.v)}
											className={cn(
												"rounded-xl border-2 px-3 py-2 text-sm font-bold transition-colors",
												form.priority === o.v
													? "border-primary-soft-shade bg-primary-soft text-primary-soft-foreground"
													: "border-border text-muted-foreground hover:text-foreground",
											)}
										>
											{o.l}
										</button>
									))}
								</div>
							</fieldset>
							<label
								htmlFor="letter-require-ack"
								className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-muted/40 p-3"
							>
								<Checkbox
									id="letter-require-ack"
									checked={form.require_ack}
									onCheckedChange={(c) => set("require_ack", c === true)}
									className="mt-0.5"
								/>
								<span className="grid">
									<span className="text-sm font-bold">
										Танилцсан тэмдэглэгээ
									</span>
									<span className="text-xs font-semibold text-muted-foreground">
										Хүлээн авагч "Танилцсан" товч дарна
									</span>
								</span>
							</label>
							<Field
								label="Илгээх огноо"
								hint="Хоосон бол шууд илгээнэ"
								error={errors.send_date}
							>
								<Input
									type="datetime-local"
									value={form.send_date}
									onChange={(e) => set("send_date", e.target.value)}
								/>
							</Field>
							<Field label="Дуусах огноо" error={errors.expire_date}>
								<Input
									type="datetime-local"
									value={form.expire_date}
									onChange={(e) => set("expire_date", e.target.value)}
								/>
							</Field>
						</div>
					</Panel>
					<Panel title="Илгээгч">
						<div className="grid gap-3">
							{senders.length > 0 && (
								<div className="grid gap-1.5">
									<span className="text-xs font-bold text-muted-foreground">
										Сүүлд ашигласан
									</span>
									<div className="flex flex-wrap gap-1.5">
										{senders.map((s) => (
											<button
												key={`${s.sender_name}|${s.sender_title}|${s.sender_org}`}
												type="button"
												onClick={() => setForm((f) => ({ ...f, ...s }))}
												className="max-w-full truncate rounded-full border border-border px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-primary-soft/50 hover:text-primary-soft-foreground"
												title={[s.sender_title, s.sender_org]
													.filter(Boolean)
													.join(", ")}
											>
												{s.sender_name}
											</button>
										))}
									</div>
								</div>
							)}
							<Field label="Нэр">
								<Input
									value={form.sender_name}
									maxLength={150}
									onChange={(e) => set("sender_name", e.target.value)}
								/>
							</Field>
							<Field label="Албан тушаал">
								<Input
									value={form.sender_title}
									maxLength={150}
									onChange={(e) => set("sender_title", e.target.value)}
								/>
							</Field>
							<Field label="Байгууллага">
								<Input
									value={form.sender_org}
									maxLength={250}
									onChange={(e) => set("sender_org", e.target.value)}
									placeholder={schoolName}
								/>
							</Field>
						</div>
					</Panel>
				</div>
			</div>

			<div className="mt-4 flex flex-wrap justify-end gap-2">{actions}</div>

			<AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{form.send_date ? "Захидлыг товлох уу?" : "Захидлыг илгээх үү?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{form.send_date
								? `${form.send_date.replace("T", " ")}-д ${targets.length} бүлэг хүлээн авагч руу илгээгдэнэ.`
								: `${targets.length} бүлэг хүлээн авагч руу одоо илгээнэ. Илгээсний дараа буцаах боломжгүй.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Болих</AlertDialogCancel>
						<AlertDialogAction
							disabled={save.isPending}
							onClick={(e) => {
								e.preventDefault();
								save.mutate(true);
							}}
						>
							{save.isPending && <Loader2 className="animate-spin" />}
							Илгээх
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
