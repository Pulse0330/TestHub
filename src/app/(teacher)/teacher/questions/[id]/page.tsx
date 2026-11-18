"use client";

import { useParams } from "next/navigation";
import { QuestionEditor } from "../_components/QuestionEditor";

export default function EditQuestionPage() {
	const { id } = useParams<{ id: string }>();
	const questionId = Number(id) || 0;
	// id өөрчлөгдөхөд (шинэ → хадгалсан) маягтыг дахин эхлүүлнэ
	return <QuestionEditor key={questionId} questionId={questionId} />;
}
