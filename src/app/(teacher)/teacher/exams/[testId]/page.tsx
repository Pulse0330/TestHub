"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { parseTestType } from "../_components/shared";
import { MaterialWizard } from "../_components/wizard/MaterialWizard";

function EditMaterial() {
	const { testId } = useParams<{ testId: string }>();
	const params = useSearchParams();
	const step = Number(params.get("step"));
	return (
		<MaterialWizard
			key={testId}
			testId={Number(testId) || 0}
			type={parseTestType(params.get("type"))}
			initialStep={step >= 1 && step <= 3 ? step : undefined}
		/>
	);
}

export default function ExamMaterialPage() {
	return (
		<Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
			<EditMaterial />
		</Suspense>
	);
}
