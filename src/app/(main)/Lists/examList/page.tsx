"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
	AlertCircle,
	CalendarClock,
	CheckCircle2,
	ChevronDown,
	Search,
	X,
	Zap,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import LessonFilter from "@/components/LessonFilter";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useServerTime } from "@/hooks/useServerTime";
import { getexamfiltertlists, getTestFilter } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
	ApiExamlistsResponse,
	ExamlistsData,
} from "@/types/exam/examList";
import type { QPayInvoiceResponse } from "@/types/Qpay/qpayinvoice";
import ExamCard, { parseExamDate } from "./examcard";
import QPayDialog from "./qpayDialog";

interface Lesson {
	lesson_id: number;
	lesson_name: string;
	sort: number;
}

interface TestFilterResponse {
	RetResponse: {
		ResponseMessage: string;
		StatusCode: string;
		ResponseCode: string;
		ResponseType: boolean;
	};
	RetData: Lesson[];
}

type ExamStatus = "active" | "upcoming" | "ended";

const isPaidExam = (exam: ExamlistsData) =>
	exam.ispaydescr === "Төлбөртэй" && exam.ispurchased === 0;
const isExpiredExam = (exam: ExamlistsData) =>
	exam.flag === 3 || exam.flag_name === "Хугацаа дууссан";

/** Status from flags first, refined by server time vs. ognoo/enddate. */
const getExamStatus = (exam: ExamlistsData, nowMs: number | null): ExamStatus => {
	if (isExpiredExam(exam) || exam.flag >= 2) return "ended";
	const endMs = parseExamDate(exam.enddate);
	if (nowMs !== null && endMs !== null && endMs < nowMs) return "ended";
	if (exam.flag === 1) return "active";
	return "upcoming";
};

export default function ExamListPage() {
	const { userId } = useAuthStore();
	const { isLoading: isTimeLoading, currentTime } = useServerTime();
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedLessonId, setSelectedLessonId] = useState<number>(0);
	const [showEnded, setShowEnded] = useState(false);
	const SKELETON_KEYS = Array.from({ length: 6 }, (_, i) => `skeleton-${i}`);
	// QPay states
	const [qpayDialogOpen, setQpayDialogOpen] = useState(false);
	const [qpayData, setQpayData] = useState<QPayInvoiceResponse | null>(null);
	const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

	const { data: lessonData } = useQuery<TestFilterResponse>({
		queryKey: ["testFilter", userId],
		queryFn: () => getTestFilter(userId || 0),
		enabled: !!userId,
	});

	const {
		data: queryData,
		isPending,
		refetch,
	} = useQuery<ApiExamlistsResponse>({
		queryKey: ["examlists", userId, selectedLessonId],
		queryFn: () => getexamfiltertlists(userId || 0, selectedLessonId),
		enabled: !!userId,
	});

	const data = useMemo(() => queryData?.RetData || [], [queryData]);
	const lessons = useMemo(() => lessonData?.RetData || [], [lessonData]);

	// Remove duplicates by exam_id
	const uniqueData = useMemo(() => {
		const seen = new Set<number>();
		return data.filter((exam) => {
			if (seen.has(exam.exam_id)) return false;
			seen.add(exam.exam_id);
			return true;
		});
	}, [data]);

	// Filter exams by search term
	const filteredData = useMemo(() => {
		if (!searchTerm.trim()) return uniqueData;

		const lowercaseSearch = searchTerm.toLowerCase();
		return uniqueData.filter((exam) =>
			exam.title.toLowerCase().includes(lowercaseSearch),
		);
	}, [uniqueData, searchTerm]);

	// Group by status — recomputed once a minute (not every tick)
	const nowMinute = currentTime
		? Math.floor(currentTime.getTime() / 60000) * 60000
		: null;
	const groups = useMemo(() => {
		const active: ExamlistsData[] = [];
		const upcoming: ExamlistsData[] = [];
		const ended: ExamlistsData[] = [];
		for (const exam of filteredData) {
			const s = getExamStatus(exam, nowMinute);
			if (s === "active") active.push(exam);
			else if (s === "upcoming") upcoming.push(exam);
			else ended.push(exam);
		}
		const byStart = (a: ExamlistsData, b: ExamlistsData) =>
			(parseExamDate(a.ognoo) ?? 0) - (parseExamDate(b.ognoo) ?? 0);
		const byEnd = (a: ExamlistsData, b: ExamlistsData) =>
			(parseExamDate(a.enddate) ?? 0) - (parseExamDate(b.enddate) ?? 0);
		active.sort(byEnd);
		upcoming.sort(byStart);
		ended.sort((a, b) => byEnd(b, a));
		return { active, upcoming, ended };
	}, [filteredData, nowMinute]);

	const handleCreateInvoice = async (exam: ExamlistsData) => {
		if (!userId) {
			alert("Нэвтрэх шаардлагатай");
			return;
		}

		try {
			setIsCreatingInvoice(true);

			const response = await axios.post("/api/examqpay/invoice", {
				amount: exam.amount?.toString() || "0",
				userid: userId.toString(),
				device_token: "",
				orderid: exam.bill_type?.toString() || "0",
				bilid: exam.exam_id.toString(),
				classroom_id: "0",
			});

			if (response.data) {
				setQpayData(response.data);
				setQpayDialogOpen(true);
			}
		} catch (error) {
			console.error("Error creating QPay invoice:", error);
			alert("Төлбөрийн QR код үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.");
		} finally {
			setIsCreatingInvoice(false);
		}
	};

	const handlePaymentSuccess = () => {
		refetch();
	};

	if (isTimeLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="space-y-3 text-center">
					<div className="mx-auto size-12 animate-spin rounded-full border-4 border-pop-sky border-t-transparent" />
					<p className="font-bold text-muted-foreground">Уншиж байна...</p>
				</div>
			</div>
		);
	}

	const renderCard = (
		exam: ExamlistsData,
		variant: "featured" | "compact" | "row",
	) => (
		<ExamCard
			exam={exam}
			isPaid={isPaidExam(exam)}
			isExpired={isExpiredExam(exam)}
			onPayClick={() => handleCreateInvoice(exam)}
			isCreatingInvoice={isCreatingInvoice}
			variant={variant}
			now={currentTime}
		/>
	);

	return (
		<TooltipProvider>
			<div className="h-full">
				<div className="flex w-full flex-col">
					{/* Sticky toolbar: lesson chips + search */}
					<div className="mb-6 border-b-2 border-border pb-4">
						<div className="flex flex-col-reverse gap-3">
							<div className="min-w-0 flex-1">
								<LessonFilter
									lessons={lessons}
									selectedLessonId={selectedLessonId}
									onLessonSelect={setSelectedLessonId}
								/>
							</div>
							<SearchBox
								value={searchTerm}
								onChange={setSearchTerm}
								placeholder="Шалгалт хайх..."
							/>
						</div>
					</div>

					{isPending ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
							{SKELETON_KEYS.map((key) => (
								<SkeletonCard key={key} />
							))}
						</div>
					) : filteredData.length === 0 ? (
						/* Empty State */
						<div className="flex flex-col items-center justify-center space-y-3 py-14 text-center">
							<div className="flex size-20 items-center justify-center rounded-full bg-pop-sky-soft text-pop-sky-ink">
								<AlertCircle className="size-10" strokeWidth={2.5} />
							</div>
							<p className="text-xl font-extrabold text-foreground">
								Шалгалт олдсонгүй
							</p>
							<p className="text-sm font-semibold text-muted-foreground">
								{searchTerm
									? `"${searchTerm}" хайлтад тохирох шалгалт алга`
									: "Хуудсаа ахин ажлуулаад үзээрэй"}
							</p>
						</div>
					) : (
						<div className="space-y-10 pb-4">
							{/* Active now */}
							<Section
								icon={<Zap className="size-4" strokeWidth={2.5} />}
								tone="bg-pop-mint-soft text-pop-mint-ink"
								title="Одоо идэвхтэй"
								count={groups.active.length}
							>
								{groups.active.length > 0 ? (
									<div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
										{groups.active.map((exam, index) => (
											<div
												key={exam.exam_id}
												className="h-full animate-pop-in"
												style={{
													animationDelay: `${Math.min(index, 12) * 40}ms`,
												}}
											>
												{renderCard(exam, "featured")}
											</div>
										))}
									</div>
								) : (
									<MiniEmpty
										emoji="😌"
										text="Яг одоо идэвхтэй шалгалт алга. Удахгүй болох шалгалтуудаа доороос хараарай."
									/>
								)}
							</Section>

							{/* Upcoming */}
							{groups.upcoming.length > 0 && (
								<Section
									icon={<CalendarClock className="size-4" strokeWidth={2.5} />}
									tone="bg-pop-sky-soft text-pop-sky-ink"
									title="Удахгүй"
									count={groups.upcoming.length}
								>
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
										{groups.upcoming.map((exam, index) => (
											<div
												key={exam.exam_id}
												className="h-full animate-pop-in"
												style={{
													animationDelay: `${Math.min(index, 12) * 30}ms`,
												}}
											>
												{renderCard(exam, "compact")}
											</div>
										))}
									</div>
								</Section>
							)}

							{/* Ended (collapsible) */}
							{groups.ended.length > 0 && (
								<section>
									<button
										type="button"
										onClick={() => setShowEnded((v) => !v)}
										aria-expanded={showEnded}
										className="mb-3 flex w-full items-center gap-2 text-left"
									>
										<span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
											<CheckCircle2 className="size-4" strokeWidth={2.5} />
										</span>
										<h2 className="text-base font-extrabold text-muted-foreground">
											Дууссан
										</h2>
										<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-black text-muted-foreground">
											{groups.ended.length}
										</span>
										<span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
											{showEnded ? "Хураах" : "Харах"}
											<ChevronDown
												className={cn(
													"size-4 transition-transform",
													showEnded && "rotate-180",
												)}
											/>
										</span>
									</button>
									{showEnded && (
										<div className="card-pop divide-y-2 divide-border overflow-hidden opacity-90">
											{groups.ended.map((exam) => (
												<div key={exam.exam_id}>{renderCard(exam, "row")}</div>
											))}
										</div>
									)}
								</section>
							)}
						</div>
					)}
				</div>
			</div>

			<QPayDialog
				open={qpayDialogOpen}
				onOpenChange={setQpayDialogOpen}
				qpayData={qpayData}
				userId={userId}
				onPaymentSuccess={handlePaymentSuccess}
			/>
		</TooltipProvider>
	);
}

function Section({
	icon,
	tone,
	title,
	count,
	children,
}: {
	icon: ReactNode;
	tone: string;
	title: string;
	count: number;
	children: ReactNode;
}) {
	return (
		<section>
			<div className="mb-3 flex items-center gap-2">
				<span
					className={cn(
						"flex size-7 items-center justify-center rounded-lg",
						tone,
					)}
				>
					{icon}
				</span>
				<h2 className="text-lg font-black tracking-tight text-foreground">
					{title}
				</h2>
				<span
					className={cn("rounded-full px-2 py-0.5 text-xs font-black", tone)}
				>
					{count}
				</span>
			</div>
			{children}
		</section>
	);
}

function MiniEmpty({ emoji, text }: { emoji: string; text: string }) {
	return (
		<div className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-border bg-card/60 p-5">
			<span className="text-3xl" aria-hidden>
				{emoji}
			</span>
			<p className="text-sm font-semibold text-muted-foreground">{text}</p>
		</div>
	);
}

function SearchBox({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
}) {
	return (
		<div className="relative w-full shrink-0 sm:w-64">
			<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				aria-label={placeholder}
				className="h-10 rounded-full pr-9 pl-9"
			/>
			{value && (
				<button
					type="button"
					onClick={() => onChange("")}
					aria-label="Цэвэрлэх"
					className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
				>
					<X className="size-3.5" />
				</button>
			)}
		</div>
	);
}

const SkeletonCard = () => (
	<div className="card-pop flex h-full w-full flex-col gap-4 p-5">
		<Skeleton className="h-20 w-full rounded-2xl" />
		<div className="space-y-2">
			<Skeleton className="h-5 w-full rounded-lg" />
			<Skeleton className="h-5 w-3/4 rounded-lg" />
		</div>
		<div className="flex flex-wrap gap-2">
			<Skeleton className="h-6 w-20 rounded-full" />
			<Skeleton className="h-6 w-20 rounded-full" />
			<Skeleton className="h-6 w-24 rounded-full" />
		</div>
		<Skeleton className="mt-auto h-10 w-full rounded-xl" />
	</div>
);
