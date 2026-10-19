"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Download } from "lucide-react";
import { toast } from "sonner";
import { ExamTable } from "@/app/(dash)/exam-schedule/ExamTable";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getExam, getExamSave } from "@/lib/dash.api";
import { useAuthStore } from "@/stores/useAuthStore";

export default function ExamMaterialsPage() {
	const queryClient = useQueryClient();
	const { userId } = useAuthStore();

	const { data, isLoading } = useQuery({
		queryKey: ["get_exam"],
		queryFn: () => getExam({ userId: userId ? Number(userId) : 0 }),
		enabled: !!userId,
	});

	const { mutate: examSave, isPending } = useMutation({
		mutationFn: getExamSave,
		onSuccess: (res) => {
			queryClient.invalidateQueries({ queryKey: ["get_exam"] });
			toast.success(res.RetResponse.ResponseMessage || "Амжилттай");
		},
	});

	return (
		<div className="max-w-7xl mx-auto py-6">
			<header className="mb-8 flex flex-wrap items-end justify-between gap-4 text-foreground">
				<div className="flex items-center gap-4">
					<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-pop-sky-soft text-pop-sky-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sky)_35%,transparent)]">
						<BookOpen className="size-7" strokeWidth={2.5} />
					</div>
					<div>
						<h1 className="text-2xl font-black tracking-tight md:text-3xl">
							Шалгалтын хуваарь
						</h1>
						<p className="mt-1 text-sm font-semibold text-muted-foreground">
							Та хуваарь татах дээр дарж шалгалтыг шинэчлэх боломжтой. | Нийт{" "}
							{data?.RetData?.length || 0} шалгалт байна.
						</p>
					</div>
				</div>
				{userId === 303866 && (
					<Button
						onClick={() => examSave()}
						disabled={isPending}
						className="w-full gap-2 md:w-auto"
					>
						{isPending ? (
							<div className="flex items-center gap-2">
								<Spinner />
								Татаж байна...
							</div>
						) : (
							<div className="flex items-center gap-2">
								<Download size={16} strokeWidth={2.5} />
								Хуваарь татах
							</div>
						)}
					</Button>
				)}
			</header>

			<ExamTable
				data={data?.RetData || []}
				isLoading={isLoading}
				onFetchData={() => examSave()}
			/>
		</div>
	);
}
