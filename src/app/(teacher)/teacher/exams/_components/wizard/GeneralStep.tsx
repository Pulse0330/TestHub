"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, OptionSelect, Panel } from "@/features/teacher/components";
import {
	teacherKey,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import type { TestType } from "@/lib/teacher-api";
import {
	bool,
	num,
	type Row,
	savedIdOf,
	str,
	ToggleRow,
	toApiDateTime,
	toLocalInput,
	useExamRef,
} from "../shared";
import { testKey } from "./MaterialWizard";

const TITLE_MAX = 100;

function initForm(info: Row) {
	return {
		title: str(info, "test_title", "title"),
		descr: str(info, "descr", "test_descr"),
		help: str(info, "help", "test_help"),
		lesson_id: str(info, "lesson_id"),
		curr_id: str(info, "curr_id"),
		purpose_id: str(info, "purpose_id"),
		exam_type: str(info, "exam_type", "exam_type_id"),
		cat_id: str(info, "cat_id"),
		is_open_soril: bool(info, "is_open_soril"),
		soril_enddate: toLocalInput(str(info, "soril_enddate", "soril_edate")),
		minute: String(num(info, "minute", "test_minute") || 40),
		second: String(num(info, "second", "test_second")),
		show_bodolt: bool(info, "show_bodolt"),
		show_true_ans: bool(info, "show_true_ans"),
		show_analys: bool(info, "show_analys"),
		execute_limit: bool(info, "execute_limit"),
		is_pay: bool(info, "is_pay"),
		amount: String(num(info, "amount") || ""),
		is_pack: bool(info, "is_pack"),
	};
}
export function GeneralStep({
	type,
	testId,
	info,
	onSaved,
}: {
	type: TestType;
	testId: number;
	info: Row;
	onSaved: (id: number) => void;
}) {
	const { userId, schoolId } = useTeacher();
	const [f, setF] = useState(() => initForm(info));
	const [touched, setTouched] = useState(false);
	const set =
		<K extends keyof typeof f>(k: K) =>
		(v: (typeof f)[K]) =>
			setF((p) => ({ ...p, [k]: v }));

	const lessons = useExamRef("lessons");
	const currs = useExamRef(
		"curr",
		{ lesson_id: Number(f.lesson_id) },
		!!Number(f.lesson_id),
	);
	const purposes = useExamRef(
		"purposes",
		{ curr_id: Number(f.curr_id), lesson_id: Number(f.lesson_id) },
		!!Number(f.curr_id),
	);
	const examTypes = useExamRef("exam_types", {}, type === 2);
	const cats = useExamRef(
		"cats",
		{ lesson_id: Number(f.lesson_id) },
		type === 3,
	);

	const errors: Record<string, string> = {};
	if (!f.title.trim()) errors.title = "Гарчиг оруулна уу";
	if (f.title.length > TITLE_MAX)
		errors.title = `${TITLE_MAX} тэмдэгтээс ихгүй`;
	if (!Number(f.lesson_id)) errors.lesson = "Хичээл сонгоно уу";
	if (type === 2 && !Number(f.exam_type))
		errors.exam_type = "Шалгалтын төрөл сонгоно уу";
	if (!(Number(f.minute) > 0) && !(Number(f.second) > 0))
		errors.minute = "Хугацаа оруулна уу";
	if (type === 3 && f.is_open_soril && !f.soril_enddate)
		errors.soril_enddate = "Дуусах огноо оруулна уу";
	if (f.is_pay && !(Number(f.amount) > 0))
		errors.amount = "Үнийн дүн оруулна уу";
	const err = (k: string) => (touched ? errors[k] : undefined);

	const save = useTeacherMutation(
		() =>
			teacherApi.exam.test.save({
				test_id: testId || undefined,
				test_type: type,
				lesson_id: Number(f.lesson_id),
				purpose_id: Number(f.purpose_id) || undefined,
				title: f.title.trim(),
				descr: f.descr.trim() || undefined,
				help: f.help.trim() || undefined,
				exam_type: type === 2 ? Number(f.exam_type) : undefined,
				cat_id: type === 3 ? Number(f.cat_id) || undefined : undefined,
				is_open_soril: type === 3 ? f.is_open_soril : undefined,
				soril_enddate:
					type === 3 && f.is_open_soril
						? toApiDateTime(f.soril_enddate)
						: undefined,
				minute: Number(f.minute) || 0,
				second: Number(f.second) || 0,
				show_bodolt: f.show_bodolt,
				show_true_ans: f.show_true_ans,
				show_analys: f.show_analys,
				execute_limit: f.execute_limit,
				is_pay: f.is_pay,
				amount: f.is_pay ? Number(f.amount) : 0,
				is_pack: f.is_pay ? f.is_pack : false,
				user_id: userId,
				school_id: schoolId,
			}),
		{
			success: "Ерөнхий мэдээлэл хадгалагдлаа",
			invalidate: [
				testKey(testId),
				teacherKey("exam-tests"),
				teacherKey("exam-dash"),
			],
			onSuccess: (res) => onSaved(savedIdOf(res) || testId),
		},
	);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				setTouched(true);
				if (Object.keys(errors).length === 0) save.mutate(undefined);
			}}
			className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]"
		>
			<Panel title="Ерөнхий мэдээлэл">
				<div className="grid gap-4">
					<Field
						label="Гарчиг"
						required
						error={err("title")}
						hint={`${f.title.length}/${TITLE_MAX}`}
					>
						<Input
							value={f.title}
							maxLength={TITLE_MAX}
							onChange={(e) => set("title")(e.target.value)}
						/>
					</Field>
					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="Хичээл" required error={err("lesson")}>
							<OptionSelect
								options={lessons.options}
								value={f.lesson_id}
								onChange={(v) =>
									setF((p) => ({
										...p,
										lesson_id: v,
										curr_id: "",
										purpose_id: "",
										cat_id: "",
									}))
								}
								className="sm:w-full"
							/>
						</Field>
						<Field label="Хөтөлбөр" hint="Зорилго сонгоход ашиглана">
							<OptionSelect
								options={currs.options}
								value={f.curr_id}
								onChange={(v) =>
									setF((p) => ({ ...p, curr_id: v, purpose_id: "" }))
								}
								disabled={!Number(f.lesson_id)}
								className="sm:w-full"
							/>
						</Field>
						<Field label="Зорилго">
							<OptionSelect
								options={purposes.options}
								value={f.purpose_id}
								onChange={set("purpose_id")}
								disabled={!Number(f.curr_id)}
								placeholder={
									Number(f.curr_id) ? "Сонгох" : "Эхлээд хөтөлбөр сонгоно"
								}
								className="sm:w-full"
							/>
						</Field>
						{type === 2 && (
							<Field label="Шалгалтын төрөл" required error={err("exam_type")}>
								<OptionSelect
									options={examTypes.options}
									value={f.exam_type}
									onChange={set("exam_type")}
									className="sm:w-full"
								/>
							</Field>
						)}
						{type === 3 && (
							<Field label="Сорилын ангилал">
								<OptionSelect
									options={cats.options}
									value={f.cat_id}
									onChange={set("cat_id")}
									className="sm:w-full"
								/>
							</Field>
						)}
					</div>
					<Field label="Тайлбар">
						<Textarea
							value={f.descr}
							rows={3}
							onChange={(e) => set("descr")(e.target.value)}
						/>
					</Field>
					<Field label="Заавар" hint="Сурагч эхлэхийн өмнө харна">
						<Textarea
							value={f.help}
							rows={3}
							onChange={(e) => set("help")(e.target.value)}
						/>
					</Field>
				</div>
			</Panel>

			<div className="grid content-start gap-4">
				<Panel title="Хугацаа">
					<div className="grid grid-cols-2 gap-3">
						<Field label="Минут" error={err("minute")}>
							<Input
								type="number"
								min={0}
								inputMode="numeric"
								value={f.minute}
								onChange={(e) => set("minute")(e.target.value)}
							/>
						</Field>
						<Field label="Секунд">
							<Input
								type="number"
								min={0}
								max={59}
								inputMode="numeric"
								value={f.second}
								onChange={(e) => set("second")(e.target.value)}
							/>
						</Field>
					</div>
				</Panel>

				<Panel title="Тохиргоо">
					<div className="grid gap-2">
						<ToggleRow
							label="Бодолт харуулах"
							checked={f.show_bodolt}
							onChange={set("show_bodolt")}
						/>
						<ToggleRow
							label="Зөв хариу харуулах"
							checked={f.show_true_ans}
							onChange={set("show_true_ans")}
						/>
						<ToggleRow
							label="Шинжилгээ харуулах"
							checked={f.show_analys}
							onChange={set("show_analys")}
						/>
						<ToggleRow
							label="Нэг удаа ажиллах"
							hint="Сурагч дахин ажиллах боломжгүй"
							checked={f.execute_limit}
							onChange={set("execute_limit")}
						/>
						{type === 3 && (
							<ToggleRow
								label="Нээлттэй сорил"
								hint="Бүх сурагчдад нээлттэй"
								checked={f.is_open_soril}
								onChange={set("is_open_soril")}
							/>
						)}
						{type === 3 && f.is_open_soril && (
							<Field
								label="Сорил дуусах огноо"
								required
								error={err("soril_enddate")}
							>
								<Input
									type="datetime-local"
									value={f.soril_enddate}
									onChange={(e) => set("soril_enddate")(e.target.value)}
								/>
							</Field>
						)}
					</div>
				</Panel>

				<Panel title="Төлбөр">
					<div className="grid gap-2">
						<ToggleRow
							label="Төлбөртэй"
							checked={f.is_pay}
							onChange={set("is_pay")}
						/>
						{f.is_pay && (
							<>
								<Field label="Үнэ (₮)" required error={err("amount")}>
									<Input
										type="number"
										min={0}
										inputMode="numeric"
										value={f.amount}
										onChange={(e) => set("amount")(e.target.value)}
									/>
								</Field>
								<ToggleRow
									label="Багцад багтах"
									checked={f.is_pack}
									onChange={set("is_pack")}
								/>
							</>
						)}
					</div>
				</Panel>

				<Button type="submit" size="lg" disabled={save.isPending}>
					{save.isPending ? <Loader2 className="animate-spin" /> : null}
					Хадгалаад үргэлжлүүлэх
					<ArrowRight />
				</Button>
			</div>
		</form>
	);
}
