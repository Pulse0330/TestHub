"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { parseTestType } from "../_components/shared";
import { MaterialWizard } from "../_components/wizard/MaterialWizard";

function NewMaterial() {
	const params = useSearchParams();
	return <MaterialWizard testId={0} type={parseTestType(params.get("type"))} />;
}

export default function NewExamMaterialPage() {
	return (
		<Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
			<NewMaterial />
		</Suspense>
	);
}
