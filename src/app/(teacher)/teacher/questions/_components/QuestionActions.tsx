"use client";

import { useQuery } from "@tanstack/react-query";
import {
	BadgeCheck,
	Eye,
	EyeOff,
	FlagTriangleRight,
	History,
	Lightbulb,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { MathContent } from "@/components/MathContent";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	EmptyState,
	Field,
	FormDialog,
	formatDateTime,
	StatusPill,
} from "@/features/teacher/components";
import {
	itemOf,
	listOf,
	useTeacher,
	useTeacherMutation,
} from "@/features/teacher/hooks";
import { teacherApi } from "@/lib/api";
import { ConfirmAction } from "./ui";
import { num, pick, qKey, type Row, str } from "./util";

const LOG_TYPES: Record<
	number,
	{ label: string; tone: "mint" | "sun" | "coral" | "sky" | "muted" }
> = {
	1: { label: "Үүсгэсэн", tone: "sky" },
	2: { label: "Зассан", tone: "muted" },
	3: { label: "Алдаа мэдэгдсэн", tone: "coral" },
	4: { label: "Засаад хянуулсан", tone: "sun" },
	5: { label: "Баталгаажсан", tone: "mint" },
};

/**
 * Даалгаврын нэмэлт үйлдлүүд: бодолт, түүх, алдаа мэдэгдэх,
 * зассан гэж тэмдэглэх, нуух/ил болгох, устгах.
 */
export function QuestionActions({
	questionId,
	hidden,
	onDeleted,
	showSolutionButton = true,
}: {
	questionId: number;
	/** Мэдэгдэж байвал нуух/ил болгох шошгыг тохируулна */
	hidden?: boolean;
	onDeleted?: () => void;
	showSolutionButton?: boolean;
}) {
	const { userId, schoolId } = useTeacher();
	const [dialog, setDialog] = useState<
		"log" | "report" | "fixed" | "bodolt" | "delete" | null
	>(null);
	const [descr, setDescr] = useState("");
	const close = () => setDialog(null);
	const invalidate = [
		qKey("list"),
		qKey("get", questionId),
		qKey("log", questionId),
	];

	const saveLog = useTeacherMutation(
		(v: { log_type: number; descr?: string }) =>
			teacherApi.question.saveLog({
				question_id: questionId,
				user_id: userId,
				...v,
			}),
		{
			success: "Хадгалагдлаа",
			invalidate,
			onSuccess: () => {
				setDescr("");
				close();
			},
		},
	);
	const hide = useTeacherMutation(
		() =>
			teacherApi.question.hide({
				question_id: questionId,
				user_id: userId,
				school_id: schoolId,
			}),
		{
			success: hidden ? "Даалгаврыг ил болголоо" : "Даалгаврыг нуулаа",
			invalidate,
		},
	);
	const remove = useTeacherMutation(
		() =>
			teacherApi.question.remove({
				question_id: questionId,
				user_id: userId,
				school_id: schoolId,
			}),
		{
			success: "Даалгавар устгагдлаа",
			invalidate: [qKey("list")],
			onSuccess: () => {
				close();
				onDeleted?.();
			},
		},
	);

	return (
		<>
			{showSolutionButton && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setDialog("bodolt")}
				>
					<Lightbulb />
					<span className="hidden sm:inline">Бодолт</span>
				</Button>
			)}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Бусад үйлдэл"
					>
						<MoreHorizontal />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					{!showSolutionButton && (
						<DropdownMenuItem onSelect={() => setDialog("bodolt")}>
							<Lightbulb />
							Бодолт харах
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onSelect={() => setDialog("log")}>
						<History />
						Хяналтын түүх
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => setDialog("report")}>
						<FlagTriangleRight />
						Алдаа мэдэгдэх
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => setDialog("fixed")}>
						<BadgeCheck />
						Зассан, дахин хянуулах
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => hide.mutate(undefined)}
						disabled={hide.isPending}
					>
						{hidden ? <Eye /> : <EyeOff />}
						{hidden === undefined
							? "Нуух / ил болгох"
							: hidden
								? "Ил болгох"
								: "Нуух"}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => setDialog("delete")}
					>
						<Trash2 />
						Устгах
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<LogDialog
				questionId={dialog === "log" ? questionId : 0}
				onClose={close}
			/>
			<BodoltDialog
				questionId={dialog === "bodolt" ? questionId : 0}
				onClose={close}
			/>
			<FormDialog
				open={dialog === "report"}
				onOpenChange={(o) => !o && close()}
				title="Алдаа мэдэгдэх"
				description={`Даалгавар #${questionId}`}
				submitLabel="Илгээх"
				pending={saveLog.isPending}
				onSubmit={() => {
					if (!descr.trim()) return;
					saveLog.mutate({ log_type: 3, descr: descr.trim() });
				}}
			>
				<Field label="Алдааны тайлбар" required>
					<Textarea
						value={descr}
						rows={4}
						maxLength={1000}
						onChange={(e) => setDescr(e.target.value)}
						placeholder="Ямар алдаа байгааг тодорхой бичнэ үү"
						required
					/>
				</Field>
			</FormDialog>
			<ConfirmAction
				open={dialog === "fixed"}
				onOpenChange={(o) => !o && close()}
				title="Зассан гэж тэмдэглэх үү?"
				description="Даалгаврыг дахин хяналтад илгээнэ."
				confirmLabel="Тэмдэглэх"
				pending={saveLog.isPending}
				onConfirm={() => saveLog.mutate({ log_type: 4 })}
			/>
			<ConfirmAction
				open={dialog === "delete"}
				onOpenChange={(o) => !o && close()}
				title={`Даалгавар #${questionId}-г устгах уу?`}
				description="Шалгалтад ашиглагдаж буй даалгаврыг устгах боломжгүй. Энэ үйлдлийг буцаах боломжгүй."
				confirmLabel="Устгах"
				pending={remove.isPending}
				onConfirm={() => remove.mutate(undefined)}
			/>
		</>
	);
}

// ============================================================
// Хяналтын түүх
// ============================================================
function LogDialog({
	questionId,
	onClose,
}: {
	questionId: number;
	onClose: () => void;
}) {
	const { data, isLoading } = useQuery({
		queryKey: qKey("log", questionId),
		queryFn: () => teacherApi.question.log({ question_id: questionId }),
		enabled: questionId > 0,
	});
	const rows = listOf<Row>(data);
	return (
		<Dialog open={questionId > 0} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-xl">
				<DialogHeader className="border-b border-border p-5 pr-12 text-left">
					<DialogTitle className="text-lg font-black">
						Хяналтын түүх
					</DialogTitle>
					<DialogDescription className="font-semibold">
						Даалгавар #{questionId}
					</DialogDescription>
				</DialogHeader>
				<div className="min-h-0 flex-1 overflow-y-auto p-5">
					{isLoading ? (
						<div className="space-y-2">
							{["a", "b", "c"].map((k) => (
								<Skeleton key={k} className="h-14 rounded-xl" />
							))}
						</div>
					) : rows.length === 0 ? (
						<EmptyState text="Түүх алга" />
					) : (
						<ol className="relative grid gap-3 border-l-2 border-border pl-4">
							{rows.map((r, i) => {
								const t = num(pick(r, "log_type", "logtype", "type_id"));
								const meta = LOG_TYPES[t];
								const label = str(
									pick(r, "log_type_name", "type_name", "logname") ??
										meta?.label ??
										`Төрөл ${t}`,
								);
								return (
									// biome-ignore lint/suspicious/noArrayIndexKey: id байхгүй байж болно
									<li key={i} className="grid gap-1">
										<span className="absolute -left-[5px] mt-1.5 size-2 rounded-full bg-border" />
										<div className="flex flex-wrap items-center gap-2">
											<StatusPill tone={meta?.tone ?? "muted"}>
												{label}
											</StatusPill>
											<span className="text-xs font-semibold text-muted-foreground tabular-nums">
												{formatDateTime(
													pick(
														r,
														"created_at",
														"createdate",
														"regdate",
														"log_date",
														"date",
													),
												)}
											</span>
											<span className="text-xs font-bold text-muted-foreground">
												{str(
													pick(
														r,
														"user_name",
														"login_name",
														"fname",
														"username",
													),
												)}
											</span>
										</div>
										{str(pick(r, "descr", "description", "note")) && (
											<p className="text-sm font-semibold">
												{str(pick(r, "descr", "description", "note"))}
											</p>
										)}
									</li>
								);
							})}
						</ol>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ============================================================
// Бодолт / шинжилгээ
// ============================================================
function BodoltDialog({
	questionId,
	onClose,
}: {
	questionId: number;
	onClose: () => void;
}) {
	const { data, isLoading } = useQuery({
		queryKey: qKey("bodolt", questionId),
		queryFn: () => teacherApi.question.bodolt({ question_id: questionId }),
		enabled: questionId > 0,
	});
	const d = itemOf<Row>(data);
	const sections = [
		{
			title: "Бодолт",
			html: str(pick(d, "que_descr", "bodolt", "descr", "solution")),
			img: str(pick(d, "descr_img_url", "descr_img")),
		},
		{
			title: "Шинжилгээ",
			html: str(pick(d, "que_analys", "analys", "analysis")),
			img: str(pick(d, "analys_img_url", "analys_img")),
		},
	].filter((s) => s.html || s.img);

	return (
		<Dialog open={questionId > 0} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex max-h-[88dvh] flex-col gap-0 p-0 sm:max-w-2xl">
				<DialogHeader className="border-b border-border p-5 pr-12 text-left">
					<DialogTitle className="text-lg font-black">Бодолт</DialogTitle>
					<DialogDescription className="font-semibold">
						Даалгавар #{questionId}
					</DialogDescription>
				</DialogHeader>
				<div className="min-h-0 flex-1 overflow-y-auto p-5">
					{isLoading ? (
						<Skeleton className="h-40 rounded-xl" />
					) : sections.length === 0 ? (
						<EmptyState text="Бодолт оруулаагүй байна" />
					) : (
						<div className="grid gap-5">
							{sections.map((s) => (
								<section key={s.title} className="grid gap-2">
									<h3 className="text-sm font-extrabold text-muted-foreground">
										{s.title}
									</h3>
									{s.html && <MathContent html={s.html} />}
									{s.img && (
										// biome-ignore lint/performance/noImgElement: гадны URL
										<img
											src={s.img}
											alt={s.title}
											className="max-h-80 rounded-xl border border-border object-contain"
										/>
									)}
								</section>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
