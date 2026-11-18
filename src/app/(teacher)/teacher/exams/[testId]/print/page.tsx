"use client";

import { useParams } from "next/navigation";
import { PrintView } from "../../_components/PrintView";

export default function ExamPrintPage() {
	return (
		<PrintView testId={Number(useParams<{ testId: string }>().testId) || 0} />
	);
}
