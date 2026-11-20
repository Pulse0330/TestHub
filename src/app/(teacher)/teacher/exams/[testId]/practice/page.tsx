"use client";

import { useParams } from "next/navigation";
import { PracticeView } from "../../_components/PracticeView";

export default function ExamPracticePage() {
	const { testId } = useParams<{ testId: string }>();
	return <PracticeView testId={Number(testId) || 0} />;
}
