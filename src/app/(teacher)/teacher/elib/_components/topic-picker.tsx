"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Field, OptionSelect, toOptions } from "@/features/teacher/components";
import { listOf, useTeacher } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { elibKeys, type TreeUnit } from "./shared";

export interface TopicValue {
	classId: number;
	lessonId: number;
	rlessonId: number;
}

/** Анги → Хичээл → Сэдэв (нэгжээр бүлэглэсэн) сонголт. */
export function TopicPicker({
	value,
	onChange,
	currentLabel,
	error,
}: {
	value: TopicValue;
	onChange: (v: TopicValue) => void;
	/** Засах үед сонгогдсон сэдвийн нэр (мод ачаалаагүй үед) */
	currentLabel?: string;
	error?: string;
}) {
	const { userId } = useTeacher();
	const { classId, lessonId, rlessonId } = value;

	const classes = useQuery({
		queryKey: elibKeys.classes(userId),
		queryFn: () => teacherApi.elib.classes({ user_id: userId }),
		enabled: !!userId,
	});
	const lessons = useQuery({
		queryKey: elibKeys.lessons(userId, classId),
		queryFn: () =>
			teacherApi.elib.lessons({ user_id: userId, class_id: classId }),
		enabled: !!userId,
	});
	const units = useTopicTree(classId, lessonId);
	const inTree = units.some((u) =>
		u.topics.some((t) => t.rlesson_id === rlessonId),
	);

	return (
		<div className="grid gap-3 sm:grid-cols-2">
			<Field label="Анги">
				<OptionSelect
					options={toOptions(listOf(classes.data))}
					value={classId}
					allLabel="Бүх анги"
					onChange={(v) =>
						onChange({ classId: Number(v), lessonId: 0, rlessonId })
					}
					className="sm:w-full"
				/>
			</Field>
			<Field label="Хичээл">
				<OptionSelect
					options={toOptions(listOf(lessons.data))}
					value={lessonId || ""}
					placeholder="Хичээл сонгох"
					onChange={(v) =>
						onChange({ classId, lessonId: Number(v), rlessonId })
					}
					className="sm:w-full"
				/>
			</Field>
			<Field
				label="Ээлжит хичээлийн сэдэв"
				required
				error={error}
				hint={
					!lessonId
						? currentLabel
							? `Одоогийн сэдэв: ${currentLabel}`
							: "Эхлээд хичээл сонгоно уу"
						: undefined
				}
				className="sm:col-span-2"
			>
				<Select
					value={inTree ? String(rlessonId) : undefined}
					onValueChange={(v) =>
						onChange({ classId, lessonId, rlessonId: Number(v) })
					}
					disabled={!lessonId || units.length === 0}
				>
					<SelectTrigger className="w-full">
						<SelectValue
							placeholder={
								rlessonId && currentLabel
									? currentLabel
									: lessonId && units.length === 0
										? "Сэдэв олдсонгүй"
										: "Сэдэв сонгох"
							}
						/>
					</SelectTrigger>
					<SelectContent>
						{units.map((u) => (
							<SelectGroup key={u.ulesson_id}>
								<SelectLabel className="text-xs font-extrabold text-muted-foreground">
									{u.ulesson_name}
								</SelectLabel>
								{u.topics.map((t) => (
									<SelectItem key={t.rlesson_id} value={String(t.rlesson_id)}>
										{t.title}
									</SelectItem>
								))}
							</SelectGroup>
						))}
					</SelectContent>
				</Select>
			</Field>
		</div>
	);
}

/** Сэдвийн мод (lessonId сонгогдсон үед). */
export function useTopicTree(classId: number, lessonId: number): TreeUnit[] {
	const { userId, schoolId } = useTeacher();
	const tree = useQuery({
		queryKey: elibKeys.tree(classId, lessonId),
		queryFn: () =>
			teacherApi.elib.tree({
				user_id: userId,
				school_id: schoolId,
				class_id: classId,
				lesson_id: lessonId,
			}),
		enabled: !!userId && !!lessonId,
	});
	return listOf<TreeUnit>(tree.data).map((u) => ({
		...u,
		topics: Array.isArray(u.topics) ? u.topics : [],
	}));
}
