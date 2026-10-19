"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy, User } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getExamRank } from "@/lib/api";
import type { LeaderboardResponse } from "@/types/exam/examRank";

interface RankModalProps {
	examId: number;
	userId: number;
	onClose: () => void;
	open: boolean;
}

export default function RankModal({
	examId,
	userId,
	onClose,
	open,
}: RankModalProps) {
	const { data: rankData, isLoading } = useQuery<LeaderboardResponse>({
		queryKey: ["examRank", examId, userId],
		queryFn: () => getExamRank(examId, userId),
		enabled: !!examId && !!userId && open,
	});

	const leaderboard = rankData?.RetData || [];

	const getMedalEmoji = (rank: number) => {
		if (rank === 1) return "🥇";
		if (rank === 2) return "🥈";
		if (rank === 3) return "🥉";
		return null;
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-hidden rounded-3xl border-2 p-0">
				{/* Header */}
				<DialogHeader className="border-b-2 bg-pop-sun-soft px-6 py-5 text-left">
					<div className="flex items-center justify-between">
						<DialogTitle className="flex items-center gap-3 text-xl font-black">
							<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card text-pop-sun-ink shadow-[0_3px_0_0_var(--border)]">
								<Trophy className="size-6" strokeWidth={2.5} />
							</span>
							Өндөр оноо асван хүүхдүүд
						</DialogTitle>
					</div>
					<p className="pl-14 text-sm font-bold text-pop-sun-ink">
						{leaderboard.length} оролцогч
					</p>
				</DialogHeader>

				<ScrollArea className="h-[calc(90vh-80px)]">
					<div className="p-4 sm:p-6">
						{isLoading ? (
							<div className="space-y-3">
								{[0, 1, 2, 3, 4, 5, 6, 7].map((id) => (
									<Skeleton key={`skeleton-${id}`} className="h-20 w-full rounded-2xl" />
								))}
							</div>
						) : leaderboard.length === 0 ? (
							<div className="text-center py-12">
								<div className="mx-auto mb-3 flex size-20 items-center justify-center rounded-full bg-pop-sun-soft text-pop-sun-ink">
									<Trophy className="size-10" strokeWidth={2.5} />
								</div>
								<p className="font-bold text-muted-foreground">Мэдээлэл байхгүй байна</p>
							</div>
						) : (
							<div className="space-y-2">
								{leaderboard.map((item) => {
									const isCurrentUser = item.userid === userId;
									const rank = item.ranks;
									const medal = getMedalEmoji(rank);

									return (
										<div
											key={item.userid}
											className={`flex items-center gap-3 rounded-2xl border-2 p-3 transition-all hover:bg-accent/50 ${
												isCurrentUser
													? "border-primary bg-primary/10 shadow-[0_3px_0_0_var(--primary)]"
													: medal
														? "border-pop-sun/50 bg-pop-sun-soft/60"
														: "border-border bg-card"
											}`}
										>
											{/* Rank */}
											<div className="flex w-10 shrink-0 items-center justify-center">
												{medal ? (
													<span className="text-3xl">{medal}</span>
												) : (
													<span className="flex size-8 items-center justify-center rounded-xl border-2 border-border bg-muted text-sm font-black text-muted-foreground">
														{rank}
													</span>
												)}
											</div>

											{/* Avatar */}
											{item.img_av ? (
												<Image
													src={item.img_av}
													alt={item.fname}
													width={48}
													height={48}
													className="size-12 shrink-0 rounded-full border-2 border-border object-cover"
												/>
											) : (
												<div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-pop-violet-soft">
													<User className="size-6 text-pop-violet-ink" />
												</div>
											)}

											{/* User Info */}
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-0.5">
													<p className="truncate font-extrabold">{item.fname}</p>
													{isCurrentUser && (
														<Badge variant="default">
															Та
														</Badge>
													)}
												</div>
												{item.sch_name && (
													<p className="truncate text-sm font-semibold text-muted-foreground">
														{item.sch_name}
													</p>
												)}
											</div>

											{/* Score */}
											<div className="text-right shrink-0">
												<p className="text-xl font-black tabular-nums text-primary">{item.point}</p>
												<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">оноо</p>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
