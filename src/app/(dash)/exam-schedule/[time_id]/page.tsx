"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Clock, Download } from "lucide-react";
import { use } from "react";
import { toast } from "sonner";
import { ExamTimeTable } from "@/app/(dash)/exam-schedule/[time_id]/ExamTimeTable";
import { VariantList } from "@/app/(dash)/exam-schedule/[time_id]/VariantList";
import { IBackButton } from "@/components/iBackButton";
import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton"; // Skeleton байвал ашиглах
import { Spinner } from "@/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	getExamInfo,
	getExamMateralVariantDownload,
	getExamMetaralList,
	getExamRegistrationList,
} from "@/lib/dash.api";
import { useAuthStore } from "@/stores/useAuthStore";

interface ExamTimePageProps {
	params: Promise<{ time_id: string }>;
}

export default function ExamTimePage({ params }: ExamTimePageProps) {
	const queryClient = useQueryClient();

	const { time_id: rawId } = use(params);
	const { userId } = useAuthStore();
	const [time_id, exam_id] = rawId.split("-");

	const { data: registrationData, isLoading: isListLoading } = useQuery({
		queryKey: ["get_exam_registration_list", time_id, userId],
		queryFn: () =>
			getExamRegistrationList({
				userId: userId ? Number(userId) : 0,
				examDateId: Number(time_id),
			}),
		enabled: !!userId && !!time_id,
	});

	const { data: examInfo, isLoading: isInfoLoading } = useQuery({
		queryKey: ["api_exam_info_by_examdateid", time_id, userId],
		queryFn: () =>
			getExamInfo({
				userId: userId ? Number(userId) : 0,
				examDateId: Number(time_id),
			}),
		enabled: !!userId && !!time_id,
		select: (res) => res.RetData?.[0],
	});

	const { data: materalData, isLoading: materalIsLoading } = useQuery({
		queryKey: ["api_examination_variants", time_id, userId, exam_id],
		queryFn: () =>
			getExamMetaralList({
				userId: userId ? Number(userId) : 0,
				examDateId: Number(time_id),
				examId: Number(exam_id),
			}),
		enabled: !!userId && !!time_id && !!exam_id,
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			const payload = {
				userId: userId || 0,
				examId: Number(exam_id),
				examDateId: Number(time_id) || 0,
			};

			return getExamMateralVariantDownload(payload);
		},
		onSuccess: (res) => {
			if (res.RetData.error_code === "VAL_003") {
				toast.error(res.RetData.details);
			} else {
				queryClient.invalidateQueries({
					queryKey: ["get_exam_materal_list"],
				});
			}
		},
	});

	const hasMaterial = (materalData?.RetData?.length ?? 0) > 0;

	return (
		<div className="py-6 max-w-7xl mx-auto space-y-8">
			<header className="flex flex-wrap items-end justify-between gap-4 text-foreground">
				<div className="flex min-w-0 items-center gap-3 md:gap-4">
					<IBackButton className="shrink-0" />
					<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-pop-violet-soft text-pop-violet-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_35%,transparent)]">
						<CalendarRange className="size-7" strokeWidth={2.5} />
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-3">
							{isInfoLoading ? (
								<Skeleton className="h-8 w-64 rounded-xl" />
							) : (
								<h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
									{examInfo?.name || "Шалгалтын мэдээлэл"}
								</h1>
							)}
						</div>

						<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
							<span className="inline-flex items-center gap-1.5 rounded-full bg-pop-sky-soft px-3 py-1 text-xs font-bold text-pop-sky-ink">
								<Clock size={14} strokeWidth={2.5} />
								Үргэлжлэх хугацаа:{" "}
								<span className="font-extrabold">
									{examInfo?.duration || 0} минут
								</span>
							</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 lg:w-auto">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<Button
										onClick={() => mutate()}
										disabled={isPending || hasMaterial}
									>
										{isPending ? (
											<div className="flex items-center gap-2">
												<Spinner />
												Татаж байна...
											</div>
										) : (
											<div className="flex items-center gap-2">
												<Download strokeWidth={2.5} /> Материал татах
											</div>
										)}
									</Button>
								</span>
							</TooltipTrigger>
							{hasMaterial && (
								<TooltipContent>
									<p>Материал татагдсан байна, дахин татах шаардлагагүй</p>
								</TooltipContent>
							)}
						</Tooltip>
					</TooltipProvider>
				</div>
			</header>
			<VariantList
				data={materalData?.RetData || null}
				isLoading={materalIsLoading}
			/>
			<ExamTimeTable
				data={registrationData?.RetData || []} // Шууд датаг дамжуулна
				isLoading={isListLoading || isInfoLoading}
				timeId={Number(time_id)}
				exam_id={Number(exam_id)}
			/>
		</div>
	);
}
