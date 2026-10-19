"use client";

import { CheckCircle2, ListOrdered } from "lucide-react";
import StyledBackButton from "@/components/backButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentView } from "@/types/course/contentView";

interface LessonSidebarProps {
	contents: ContentView[];
	currentLessonIndex: number;
	onLessonSelect: (index: number) => void;
	showBackButton?: boolean;
}

const CHIP_COLORS = [
	"bg-pop-violet-soft text-pop-violet-ink",
	"bg-pop-sky-soft text-pop-sky-ink",
	"bg-pop-mint-soft text-pop-mint-ink",
	"bg-pop-sun-soft text-pop-sun-ink",
	"bg-pop-coral-soft text-pop-coral-ink",
	"bg-pop-pink-soft text-pop-pink-ink",
];

export function LessonSidebar({
	contents,
	currentLessonIndex,
	onLessonSelect,
	showBackButton = true,
}: LessonSidebarProps) {
	const completedCount = contents.filter((c) => c.stu_worked === 1).length;
	const percent =
		contents.length > 0 ? Math.round((completedCount / contents.length) * 100) : 0;

	return (
		<Card className="gap-0 py-0 overflow-hidden flex flex-col h-full max-h-full">
			<CardHeader className="px-4 pt-4 pb-3 border-b-2 border-border shrink-0">
				<div className="flex items-center gap-3">
					{showBackButton && <StyledBackButton />}
					<div className="flex size-9 items-center justify-center rounded-xl bg-pop-sky-soft text-pop-sky-ink">
						<ListOrdered className="size-5" strokeWidth={2.5} />
					</div>
					<CardTitle className="text-lg font-black">Хичээлүүд</CardTitle>
					<span className="ml-auto rounded-full bg-pop-mint-soft px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-pop-mint-ink">
						{completedCount}/{contents.length}
					</span>
				</div>
				<div
					className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
					role="progressbar"
					aria-valuenow={percent}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label="Үзсэн"
				>
					<div
						className="h-full rounded-full bg-success transition-all duration-500"
						style={{ width: `${percent}%` }}
					/>
				</div>
			</CardHeader>
			<CardContent className="p-0 flex-1 min-h-0 flex flex-col">
				<div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
					{contents.map((item, index) => {
						const isActive = index === currentLessonIndex;
						const isCompleted = item.stu_worked === 1;
						const chipColor = CHIP_COLORS[index % CHIP_COLORS.length];

						return (
							<button
								key={item.content_id}
								onClick={() => onLessonSelect(index)}
								type="button"
								className={`
									w-full text-left rounded-2xl border-2 p-2.5 transition-all
									${isActive ? "border-primary bg-primary/10 shadow-[0_3px_0_0_var(--primary)]" : "border-transparent hover:border-border hover:bg-accent/50"}
								`}
							>
								<div className="flex items-start gap-3">
									<div className="shrink-0">
										{isCompleted ? (
											<div className="flex size-9 items-center justify-center rounded-xl bg-success text-primary-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--success)_60%,black)]">
												<CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
											</div>
										) : (
											<div
												className={`flex size-9 items-center justify-center rounded-xl ${
													isActive
														? "bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--primary-shade)]"
														: chipColor
												}`}
											>
												<span className="text-sm font-black">{index + 1}</span>
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0 space-y-1.5">
										<p
											className={`text-sm font-bold line-clamp-2 leading-snug ${
												isActive ? "text-primary" : "text-foreground"
											}`}
										>
											{item.content_name}
										</p>
										<div className="flex items-center gap-1.5 flex-wrap">
											<Badge
												variant="secondary"
												className="text-[11px] px-2 py-0.5 rounded-full"
											>
												{item.elesson_type}
											</Badge>
											{item.exam_id && (
												<Badge
													variant="sun"
													className="text-[11px] px-2 py-0.5 rounded-full"
												>
													Даалгавар
												</Badge>
											)}
											{isCompleted && (
												<Badge
													variant="mint"
													className="text-[11px] px-2 py-0.5 rounded-full"
												>
													Үзсэн
												</Badge>
											)}
										</div>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
