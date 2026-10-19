import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExamVariant } from "@/types/dashboard/exam.types";

interface Props {
	data?: ExamVariant[] | null;
	isLoading?: boolean;
}

export function VariantList({ data, isLoading }: Props) {
	// 1️⃣ Loading
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48 rounded-xl" />
				</CardHeader>

				<CardContent className="space-y-4">
					<Skeleton className="h-4 w-40 rounded-xl" />

					<div className="flex gap-2">
						<Skeleton className="h-10 px-3 w-20 rounded-full" />
						<Skeleton className="h-10 px-3 w-20 rounded-full" />
						<Skeleton className="h-10 px-3 w-20 rounded-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	// 2️⃣ Data байхгүй
	if (!data || data.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center gap-3 py-10 text-center text-sm font-semibold text-muted-foreground">
					<span className="flex size-14 items-center justify-center rounded-full bg-pop-sun-soft text-2xl">
						📦
					</span>
					Шалгалтын материал вариантууд татагдаагүй байна. | Шалгалт эхлэхээс 1
					цагийн өмнө татна.
				</CardContent>
			</Card>
		);
	}

	// 3️⃣ Data байгаа
	const lesson = data[0];

	return (
		<Card className="gap-2">
			<CardHeader>
				<CardTitle className="flex items-center gap-2.5 text-lg font-black">
					<span className="flex size-8 items-center justify-center rounded-xl bg-pop-mint-soft text-base">
						📚
					</span>
					{lesson.lesson_name}
				</CardTitle>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-2">
					{data.map((v, i) => (
						<Badge
							key={`${v.variantId}-${i}`}
							variant={
								(["violet", "sky", "mint", "sun", "coral", "pink"] as const)[i % 6]
							}
							className="h-10 rounded-full px-4 text-sm font-bold"
						>
							Хувилбар: {v.variant_number}
						</Badge>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
