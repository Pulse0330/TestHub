import { AlertCircle, CheckCircle, MinusCircle, XCircle } from "lucide-react";
import type { AnswerStatus } from "./scoring";

export type AnswerFilter =
	| "all"
	| "correct"
	| "partial"
	| "wrong"
	| "unanswered";

export const STATUS_META: Record<
	AnswerStatus,
	{ Icon: typeof CheckCircle; label: string; chip: string }
> = {
	correct: {
		Icon: CheckCircle,
		label: "Зөв",
		chip: "bg-success/15 text-success",
	},
	incorrect: {
		Icon: XCircle,
		label: "Буруу",
		chip: "bg-destructive/10 text-destructive",
	},
	partial: {
		Icon: MinusCircle,
		label: "Дутуу",
		chip: "bg-pop-sun-soft text-pop-sun-ink",
	},
	pending: {
		Icon: MinusCircle,
		label: "Үнэлгээ хүлээгдэж байна",
		chip: "bg-pop-sun-soft text-pop-sun-ink",
	},
	unanswered: {
		Icon: AlertCircle,
		label: "Хариулаагүй",
		chip: "bg-muted text-muted-foreground",
	},
};

/** "Буруу" шүүлтүүр зөвхөн бүрэн буруу; "алдаатай" гүйлгэх горимд дутуу ч орно. */
export const matchesFilter = (status: AnswerStatus, filter: AnswerFilter) => {
	switch (filter) {
		case "correct":
			return status === "correct";
		case "partial":
			return status === "partial";
		case "wrong":
			return status === "incorrect";
		case "unanswered":
			return status === "unanswered";
		default:
			return true;
	}
};

export const isReviewable = (status: AnswerStatus) =>
	status === "incorrect" || status === "partial";
