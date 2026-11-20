"use client";

import { Check, ImagePlus, Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormDialog } from "@/features/teacher/components";
import { useTeacher, useTeacherMutation } from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
	type ElibRow,
	EXT,
	elibKeys,
	extOf,
	isColor,
	SWATCHES,
	uploadFile,
} from "./shared";
import { TopicPicker, type TopicValue } from "./topic-picker";

/** Хавтас үүсгэх / засах. folder: null хаалттай, id 0 шинэ. */
export function FolderDialog({
	folder,
	defaults,
	onClose,
	onSaved,
}: {
	folder: ElibRow | null;
	defaults: { classId: number; lessonId: number };
	onClose: () => void;
	onSaved?: (id: number) => void;
}) {
	const { userId } = useTeacher();
	const open = folder !== null;
	const [topic, setTopic] = useState<TopicValue>({
		classId: 0,
		lessonId: 0,
		rlessonId: 0,
	});
	const [desc, setDesc] = useState("");
	const [image, setImage] = useState(SWATCHES[0]);
	const [isPublic, setIsPublic] = useState(false);
	const [touched, setTouched] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: зөвхөн нээгдэх үед
	useEffect(() => {
		if (!folder) return;
		setTouched(false);
		setTopic({
			classId: folder.id ? 0 : defaults.classId,
			lessonId: folder.id ? 0 : defaults.lessonId,
			rlessonId: Number(folder.rlesson_id ?? 0),
		});
		setDesc(folder.l_desc ?? "");
		setImage(folder.l_image || SWATCHES[0]);
		setIsPublic(Number(folder.l_flag) === 1);
	}, [folder]);

	const save = useTeacherMutation(
		() =>
			teacherApi.elib.save({
				user_id: userId,
				elib_id: folder?.id ?? 0,
				rlesson_id: topic.rlessonId,
				l_desc: desc.trim(),
				l_image: image,
				l_flag: isPublic ? 1 : 0,
			}),
		{
			success: "Хавтас хадгалагдлаа",
			invalidate: [elibKeys.all],
			onSuccess: (res) => {
				onClose();
				const id = Number(
					(res.RetData as { elib_id?: number } | undefined)?.elib_id ?? 0,
				);
				if (id) onSaved?.(id);
			},
		},
	);

	const topicError =
		touched && !topic.rlessonId ? "Сэдэв сонгоно уу" : undefined;

	return (
		<FormDialog
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={folder?.id ? "Хавтас засах" : "Шинэ хавтас"}
			description="Цахим хичээлийн хавтас нь нэг ээлжит хичээлийн сэдэвтэй холбогдоно"
			size="lg"
			pending={save.isPending}
			onSubmit={() => {
				setTouched(true);
				if (!topic.rlessonId) return;
				save.mutate(undefined);
			}}
		>
			<TopicPicker
				value={topic}
				onChange={setTopic}
				currentLabel={folder?.topic_name ?? folder?.l_name}
				error={topicError}
			/>
			<Field label="Тайлбар" hint={`${desc.length}/500`}>
				<Textarea
					value={desc}
					maxLength={500}
					rows={3}
					onChange={(e) => setDesc(e.target.value)}
				/>
			</Field>
			<CoverPicker value={image} onChange={setImage} />
			<div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3">
				<div>
					<p className="text-sm font-bold">Нийтэд нээлттэй</p>
					<p className="text-xs font-semibold text-muted-foreground">
						Бусад багш нар үзэх боломжтой (зөвхөн унших)
					</p>
				</div>
				<Switch
					checked={isPublic}
					onCheckedChange={setIsPublic}
					aria-label="Нийтэд нээлттэй"
				/>
			</div>
		</FormDialog>
	);
}

/** Нүүр: өнгө эсвэл зураг. */
export function CoverPicker({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: string) => void;
}) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);

	const onFile = async (file?: File) => {
		if (!file) return;
		if (!(EXT.image as readonly string[]).includes(extOf(file.name))) {
			toast.error("Зөвхөн jpg, png, gif, webp зураг");
			return;
		}
		setUploading(true);
		try {
			onChange((await uploadFile(file)).url);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Алдаа гарлаа");
		} finally {
			setUploading(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	};

	return (
		<fieldset className="grid gap-2">
			<legend className="mb-1.5 text-sm font-bold">Нүүр</legend>
			<div className="flex flex-wrap items-center gap-2">
				{SWATCHES.map((c) => (
					<button
						key={c}
						type="button"
						aria-label={`Өнгө ${c}`}
						aria-pressed={value === c}
						onClick={() => onChange(c)}
						className={cn(
							"flex size-9 items-center justify-center rounded-xl border-2 border-transparent transition-transform hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
							value === c && "border-primary-soft-foreground/50",
						)}
						style={{ backgroundColor: c }}
					>
						{value === c && (
							<Check className="size-4 text-primary-soft-foreground" />
						)}
					</button>
				))}
				<input
					ref={fileRef}
					type="file"
					accept={EXT.image.map((e) => `.${e}`).join(",")}
					className="sr-only"
					tabIndex={-1}
					aria-hidden
					onChange={(e) => onFile(e.target.files?.[0])}
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={uploading}
					onClick={() => fileRef.current?.click()}
				>
					{uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
					Зураг
				</Button>
			</div>
			{value && !isColor(value) && (
				<div className="flex items-center gap-3">
					{/* biome-ignore lint/performance/noImgElement: байршуулсан зураг */}
					<img
						src={value}
						alt="Нүүр зураг"
						className="h-16 w-28 rounded-xl border border-border object-cover"
					/>
					<Button
						type="button"
						variant="ghost"
						size="xs"
						onClick={() => onChange(SWATCHES[0])}
					>
						Зураг хасах
					</Button>
				</div>
			)}
		</fieldset>
	);
}

/** Хавтасны нүүрний арын дэвсгэр. */
export function Cover({
	image,
	className,
	children,
}: {
	image?: string;
	className?: string;
	children?: ReactNode;
}) {
	const color = isColor(image) ? image : undefined;
	const url = image && !color ? image : undefined;
	return (
		<div
			className={cn("relative overflow-hidden bg-muted", className)}
			style={
				color
					? { backgroundColor: color }
					: url
						? {
								backgroundImage: `url("${url.replace(/"/g, "%22")}")`,
								backgroundSize: "cover",
								backgroundPosition: "center",
							}
						: undefined
			}
		>
			{children}
		</div>
	);
}
