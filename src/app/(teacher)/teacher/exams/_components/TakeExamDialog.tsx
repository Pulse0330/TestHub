"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormDialog, OptionSelect } from "@/features/teacher/components";
import {
	listOf,
	pagedOf,
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { ExamAddressInput, TestType } from "@/lib/teacher-api";
import {
	nowLocalInput,
	num,
	optionLabel,
	type Row,
	str,
	testTypeLabel,
	toApiDateTime,
	toLocalInput,
	useExamRef,
} from "./shared";

export const examsKey = (type: TestType) => teacherKey("exam-exams", type);

export interface ExamEditing {
	examId: number;
	testId: number;
	minute: number;
	sdate: string;
	edate: string;
	enddate: string;
}

const addrKey = (a: ExamAddressInput) =>
	[a.type_id, a.aimag_id, a.sym_id, a.school_id, a.zclass_id, a.class_id].join(
		"|",
	);

const addrLabel = (a: ExamAddressInput) =>
	[
		a.type_name,
		a.aimagidname,
		a.districtname,
		a.schoolname,
		a.zclass_name,
		a.classname,
	]
		.filter(Boolean)
		.join(" · ");

function rowToAddress(r: Row): ExamAddressInput {
	return {
		type_id: num(r, "type_id", "addr_type"),
		type_name: str(r, "type_name", "addr_type_name"),
		aimag_id: num(r, "aimag_id"),
		aimagidname: str(r, "aimagidname", "aimag_name"),
		sym_id: num(r, "sym_id"),
		districtname: str(r, "districtname", "sym_name"),
		school_id: str(r, "school_id", "dbname"),
		schoolname: str(r, "schoolname", "school_name"),
		zclass_id: num(r, "zclass_id"),
		zclass_name: str(r, "zclass_name"),
		class_id: str(r, "class_id"),
		classname: str(r, "classname", "class_name"),
	};
}

/**
 * Шалгалт авах / засах (examadd_iud).
 * testId = 0 бол материалыг энд сонгоно.
 */
export function TakeExamDialog({
	open,
	onOpenChange,
	type,
	testId,
	testTitle,
	defaultMinute = 0,
	editing,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	type: TestType;
	testId: number;
	testTitle?: string;
	defaultMinute?: number;
	editing?: ExamEditing | null;
}) {
	const { userId, schoolId } = useTeacher();
	const examId = editing?.examId ?? 0;
	const [form, setForm] = useState({
		testId: 0,
		minute: "40",
		sdate: "",
		edate: "",
		enddate: "",
	});
	const [address, setAddress] = useState<ExamAddressInput[]>([]);
	const [touched, setTouched] = useState(false);

	// Нээх бүрт маягтыг шинэчилнэ
	useEffect(() => {
		if (!open) return;
		setTouched(false);
		setAddress([]);
		setForm({
			testId: editing?.testId || testId,
			minute: String(editing?.minute || defaultMinute || 40),
			sdate: toLocalInput(editing?.sdate) || nowLocalInput(60),
			edate: toLocalInput(editing?.edate) || nowLocalInput(60 * 24 * 7),
			enddate: toLocalInput(editing?.enddate) || nowLocalInput(60 * 24 * 7),
		});
	}, [open, editing, testId, defaultMinute]);

	// Засах үед хамрах хүрээг ачаална
	const existing = useQuery({
		queryKey: teacherKey("exam-address", examId),
		queryFn: () => teacherApi.exam.exams.address({ exam_id: examId }),
		enabled: open && examId > 0,
	});
	useEffect(() => {
		if (existing.data) setAddress(listOf<Row>(existing.data).map(rowToAddress));
	}, [existing.data]);

	// Материал сонгох (Авсан табаас нээгдсэн үед)
	const needTest = !testId && !editing;
	const tests = useQuery({
		queryKey: teacherKey("exam-tests-pick", type, userId),
		queryFn: () =>
			teacherApi.exam.tests.list({
				test_type: type,
				teacher_id: userId,
				school_id: schoolId,
				page: 1,
				size: 200,
			}),
		enabled: open && needTest && !!userId,
	});
	const testOptions = pagedOf<Row>(tests.data).rows.map((r) => ({
		value: num(r, "test_id", "id"),
		label: str(r, "test_title", "title", "name") || "Нэргүй",
	}));

	const save = useTeacherMutation(
		() =>
			teacherApi.exam.exams.save({
				exam_id: examId || undefined,
				test_id: form.testId,
				minute: Number(form.minute),
				sdate: toApiDateTime(form.sdate),
				edate: toApiDateTime(form.edate),
				enddate: toApiDateTime(form.enddate),
				test_type: type,
				user_id: userId,
				school_id: schoolId,
				address,
			}),
		{
			success: examId ? "Шалгалт шинэчлэгдлээ" : "Шалгалт товлогдлоо",
			invalidate: [examsKey(type), teacherKey("exam-dash")],
			onSuccess: () => onOpenChange(false),
		},
	);

	const errors = useMemo(() => {
		const e: Record<string, string> = {};
		if (!form.testId) e.test = "Материал сонгоно уу";
		if (!(Number(form.minute) > 0)) e.minute = "Хугацаа 0-ээс их байна";
		if (!form.sdate) e.sdate = "Эхлэх огноо оруулна уу";
		if (!form.edate) e.edate = "Дуусах огноо оруулна уу";
		else if (form.sdate && form.edate <= form.sdate)
			e.edate = "Эхлэх огнооноос хойш байх ёстой";
		if (!form.enddate) e.enddate = "Хаагдах огноо оруулна уу";
		else if (form.edate && form.enddate < form.edate)
			e.enddate = "Дуусах огнооноос өмнө байж болохгүй";
		if (address.length === 0) e.address = "Дор хаяж нэг хүрээ нэмнэ үү";
		return e;
	}, [form, address]);
	const err = (k: string) => (touched ? errors[k] : undefined);

	return (
		<FormDialog
			open={open}
			onOpenChange={onOpenChange}
			title={examId ? "Шалгалт засах" : `${testTypeLabel(type)} авах`}
			description={testTitle || undefined}
			size="lg"
			pending={save.isPending}
			submitLabel={examId ? "Хадгалах" : "Товлох"}
			onSubmit={() => {
				setTouched(true);
				if (Object.keys(errors).length === 0) save.mutate(undefined);
			}}
		>
			{needTest && (
				<Field label="Материал" required error={err("test")}>
					<OptionSelect
						options={testOptions}
						value={form.testId || ""}
						onChange={(v) => setForm((f) => ({ ...f, testId: Number(v) }))}
						placeholder={tests.isLoading ? "Ачаалж байна..." : "Сонгох"}
						className="sm:w-full"
					/>
				</Field>
			)}
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Үргэлжлэх хугацаа (мин)" required error={err("minute")}>
					<Input
						type="number"
						min={1}
						inputMode="numeric"
						value={form.minute}
						onChange={(e) => setForm((f) => ({ ...f, minute: e.target.value }))}
					/>
				</Field>
				<Field label="Эхлэх" required error={err("sdate")}>
					<Input
						type="datetime-local"
						value={form.sdate}
						onChange={(e) => setForm((f) => ({ ...f, sdate: e.target.value }))}
					/>
				</Field>
				<Field
					label="Дуусах"
					required
					error={err("edate")}
					hint="Сурагч энэ хүртэл эхлүүлж болно"
				>
					<Input
						type="datetime-local"
						value={form.edate}
						onChange={(e) => setForm((f) => ({ ...f, edate: e.target.value }))}
					/>
				</Field>
				<Field
					label="Хаагдах"
					required
					error={err("enddate")}
					hint="Дуусахаас хойш эсвэл тэнцүү"
				>
					<Input
						type="datetime-local"
						value={form.enddate}
						onChange={(e) =>
							setForm((f) => ({ ...f, enddate: e.target.value }))
						}
					/>
				</Field>
			</div>
			<AddressBuilder
				value={address}
				onChange={setAddress}
				error={err("address")}
				loading={existing.isLoading && examId > 0}
			/>
		</FormDialog>
	);
}

function AddressBuilder({
	value,
	onChange,
	error,
	loading,
}: {
	value: ExamAddressInput[];
	onChange: (v: ExamAddressInput[]) => void;
	error?: string;
	loading?: boolean;
}) {
	const [sel, setSel] = useState({
		type: "",
		aimag: "",
		sym: "",
		school: "",
		zclass: "",
		cls: "",
	});
	const types = useExamRef("addr_types");
	const aimags = useExamRef("aimags");
	const syms = useExamRef(
		"syms",
		{ aimag_id: Number(sel.aimag) },
		!!Number(sel.aimag),
	);
	const schools = useExamRef(
		"schools",
		{ aimag_id: Number(sel.aimag), sym_id: Number(sel.sym) },
		!!Number(sel.sym),
	);
	const zclasses = useExamRef("classes");
	const myClasses = useExamRef("my_classes");

	const add = () => {
		const a: ExamAddressInput = {
			type_id: Number(sel.type) || 0,
			type_name: optionLabel(types.options, sel.type),
			aimag_id: Number(sel.aimag) || 0,
			aimagidname: optionLabel(aimags.options, sel.aimag),
			sym_id: Number(sel.sym) || 0,
			districtname: optionLabel(syms.options, sel.sym),
			school_id: sel.school,
			schoolname: optionLabel(schools.options, sel.school),
			zclass_id: Number(sel.zclass) || 0,
			zclass_name: optionLabel(zclasses.options, sel.zclass),
			class_id: sel.cls,
			classname: optionLabel(myClasses.options, sel.cls),
		};
		if (value.some((x) => addrKey(x) === addrKey(a))) return;
		onChange([...value, a]);
		setSel((s) => ({ ...s, cls: "", zclass: "" }));
	};

	const set = (k: keyof typeof sel) => (v: string) =>
		setSel((s) => {
			const next = { ...s, [k]: v === "0" ? "" : v };
			if (k === "aimag") Object.assign(next, { sym: "", school: "" });
			if (k === "sym") next.school = "";
			return next;
		});

	return (
		<fieldset className="grid gap-3 rounded-2xl border border-border p-4">
			<legend className="px-1 text-sm font-bold">
				Хамрах хүрээ <span className="text-destructive">*</span>
			</legend>
			<div className="grid gap-3 sm:grid-cols-2">
				<Field label="Хүрээний төрөл" required>
					<OptionSelect
						options={types.options}
						value={sel.type}
						onChange={set("type")}
						className="sm:w-full"
					/>
				</Field>
				<Field label="Миний анги">
					<OptionSelect
						options={myClasses.options}
						value={sel.cls}
						onChange={set("cls")}
						placeholder="Сонгохгүй"
						allLabel="Сонгохгүй"
						className="sm:w-full"
					/>
				</Field>
				<Field label="Аймаг/хот">
					<OptionSelect
						options={aimags.options}
						value={sel.aimag}
						onChange={set("aimag")}
						placeholder="Сонгохгүй"
						allLabel="Сонгохгүй"
						className="sm:w-full"
					/>
				</Field>
				<Field label="Сум/дүүрэг">
					<OptionSelect
						options={syms.options}
						value={sel.sym}
						onChange={set("sym")}
						disabled={!sel.aimag}
						placeholder="Сонгохгүй"
						allLabel="Сонгохгүй"
						className="sm:w-full"
					/>
				</Field>
				<Field label="Сургууль">
					<OptionSelect
						options={schools.options}
						value={sel.school}
						onChange={set("school")}
						disabled={!sel.sym}
						placeholder="Сонгохгүй"
						allLabel="Сонгохгүй"
						className="sm:w-full"
					/>
				</Field>
				<Field label="Анги (түвшин)">
					<OptionSelect
						options={zclasses.options}
						value={sel.zclass}
						onChange={set("zclass")}
						placeholder="Сонгохгүй"
						allLabel="Сонгохгүй"
						className="sm:w-full"
					/>
				</Field>
			</div>
			<div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={add}
					disabled={!sel.type}
				>
					<Plus />
					Хүрээ нэмэх
				</Button>
			</div>
			{loading ? (
				<p className="text-xs font-semibold text-muted-foreground">
					Хүрээг ачаалж байна...
				</p>
			) : value.length > 0 ? (
				<ul className="flex flex-wrap gap-2" aria-label="Сонгосон хүрээ">
					{value.map((a) => (
						<li
							key={addrKey(a)}
							className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary-soft/50 py-1 pr-1 pl-3 text-xs font-bold text-primary-soft-foreground"
						>
							<MapPin className="size-3.5 shrink-0" />
							<span className="truncate">{addrLabel(a) || "Хүрээ"}</span>
							<button
								type="button"
								onClick={() =>
									onChange(value.filter((x) => addrKey(x) !== addrKey(a)))
								}
								className="rounded-full p-1 hover:bg-card/70"
								aria-label={`${addrLabel(a)} хасах`}
							>
								<X className="size-3" />
							</button>
						</li>
					))}
				</ul>
			) : null}
			{error && <p className="text-xs font-bold text-destructive">{error}</p>}
		</fieldset>
	);
}
