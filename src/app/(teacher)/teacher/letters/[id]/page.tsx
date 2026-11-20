"use client";

import { useParams } from "next/navigation";
import { LetterDetail } from "../_components/letter-detail";

export default function LetterDetailPage() {
	const { id } = useParams<{ id: string }>();
	return <LetterDetail id={Number(id) || 0} />;
}
