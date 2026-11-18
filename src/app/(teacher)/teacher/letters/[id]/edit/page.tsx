"use client";

import { useParams } from "next/navigation";
import { LetterEditor } from "../../_components/letter-editor";

export default function EditLetterPage() {
	const { id } = useParams<{ id: string }>();
	return <LetterEditor id={Number(id) || 0} />;
}
