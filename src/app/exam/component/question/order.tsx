"use client";

import {
	DragDropContext,
	Draggable,
	type DraggableProvided,
	type DraggableStateSnapshot,
	Droppable,
	type DroppableProvided,
	type DropResult,
} from "@hello-pangea/dnd";
import parse from "html-react-parser";
import { HelpCircle } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// -----------------------------
// Types
// -----------------------------
interface Answer {
	answer_id: number;
	answer_name_html: string;
}

interface DragAndDropProps {
	answers: Answer[];
	droppableId?: string;
	onOrderChange?: (orderedIds: number[]) => void;
	disabled?: boolean;
}

interface DragAndDropWrapperProps {
	questionId: number;
	examId?: number;
	userId?: number;
	answers: Answer[];
	userAnswers?: number[];
	onOrderChange?: (orderedIds: number[]) => void;
}

// -----------------------------
// DragAndDrop Component
// -----------------------------
const DragAndDrop: React.FC<DragAndDropProps> = ({
	answers,
	droppableId = "droppable",
	onOrderChange,
	disabled = false,
}) => {
	const [items, setItems] = useState<Answer[]>(answers || []);

	useEffect(() => {
		setItems(answers || []);
	}, [answers]);

	const onDragEnd = (result: DropResult) => {
		if (disabled || !result.destination) return;

		const newItems = Array.from(items);
		const [removed] = newItems.splice(result.source.index, 1);
		newItems.splice(result.destination.index, 0, removed);

		setItems(newItems);
		onOrderChange?.(newItems.map((i) => i.answer_id));
	};

	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<Droppable droppableId={droppableId}>
				{(provided: DroppableProvided) => (
					<div
						{...provided.droppableProps}
						ref={provided.innerRef}
						className="space-y-2.5"
					>
						{items.map((item, index) => (
							<Draggable
								key={item.answer_id}
								draggableId={String(item.answer_id)}
								index={index}
								isDragDisabled={disabled}
							>
								{(
									providedDraggable: DraggableProvided,
									snapshot: DraggableStateSnapshot,
								) => (
									<div
										ref={providedDraggable.innerRef}
										{...providedDraggable.draggableProps}
										{...providedDraggable.dragHandleProps}
										className={cn(
											buttonVariants({
												variant: "outline",
												size: "default",
											}),
											"relative h-auto min-h-14 w-full select-none justify-start gap-3 whitespace-normal rounded-2xl py-3 pr-4 pl-3 text-left transition-colors duration-200",
											disabled
												? "cursor-default"
												: "cursor-grab active:cursor-grabbing",
											snapshot.isDragging &&
												"cursor-grabbing border-primary bg-primary/10 text-primary shadow-[0_6px_0_0_var(--primary)] ring-4 ring-primary/20",
										)}
										style={{ ...providedDraggable.draggableProps.style }}
									>
										{/* Дугаар */}
										<div className="flex size-8 shrink-0 items-center justify-center rounded-xl border-2 border-primary/30 bg-primary/10 text-sm font-black text-primary">
											{index + 1}
										</div>

										<div className="min-w-0 flex-1 text-sm font-bold text-foreground sm:text-base">
											{item.answer_name_html
												? parse(item.answer_name_html)
												: ""}
										</div>

										{/* Drag indicator */}
										{!disabled && (
											<div className="grid shrink-0 grid-cols-2 gap-0.5 text-muted-foreground opacity-60">
												<div className="size-1 rounded-full bg-current" />
												<div className="size-1 rounded-full bg-current" />
												<div className="size-1 rounded-full bg-current" />
												<div className="size-1 rounded-full bg-current" />
												<div className="size-1 rounded-full bg-current" />
												<div className="size-1 rounded-full bg-current" />
											</div>
										)}
									</div>
								)}
							</Draggable>
						))}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
};

// -----------------------------
// DragAndDropWrapper Component
// -----------------------------
const DragAndDropWrapper: React.FC<DragAndDropWrapperProps> = ({
	answers,
	userAnswers = [],
	onOrderChange,
}) => {
	const [items, setItems] = useState<Answer[]>([]);
	const [showHelp, setShowHelp] = useState(false);
	const prevUserAnswersRef = useRef<number[]>([]);
	const initialShuffledRef = useRef<Answer[]>([]);

	const shuffleArray = useCallback((array: Answer[]): Answer[] => {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}, []);

	useEffect(() => {
		if (userAnswers.length > 0) {
			const sorted = userAnswers
				.map((id) => answers.find((a) => a.answer_id === id))
				.filter(Boolean) as Answer[];

			if (sorted.length > 0) {
				setItems(sorted);
				prevUserAnswersRef.current = userAnswers;
				return;
			}
		}

		if (initialShuffledRef.current.length === 0) {
			const shuffled = shuffleArray(answers);
			initialShuffledRef.current = shuffled;
			setItems(shuffled);
		} else {
			setItems(initialShuffledRef.current);
		}
	}, [answers, shuffleArray, userAnswers]);

	useEffect(() => {
		const hasChanged =
			JSON.stringify(prevUserAnswersRef.current) !==
			JSON.stringify(userAnswers);

		if (!hasChanged) return;

		if (userAnswers.length > 0) {
			const sorted = userAnswers
				.map((id) => answers.find((a) => a.answer_id === id))
				.filter(Boolean) as Answer[];

			if (sorted.length > 0) {
				setItems(sorted);
				prevUserAnswersRef.current = userAnswers;
			}
		} else if (prevUserAnswersRef.current.length > 0) {
			if (initialShuffledRef.current.length > 0) {
				setItems(initialShuffledRef.current);
			} else {
				const shuffled = shuffleArray(answers);
				initialShuffledRef.current = shuffled;
				setItems(shuffled);
			}
			prevUserAnswersRef.current = [];
		}
	}, [userAnswers, answers, shuffleArray]);

	const handleOrderChange = useCallback(
		(orderedIds: number[]) => {
			onOrderChange?.(orderedIds);
		},
		[onOrderChange],
	);

	return (
		<>
			<div className="space-y-4">
				<div className="space-y-3 rounded-2xl border-2 border-border bg-muted/40 p-3 sm:p-4">
					<div className="flex items-center justify-between gap-2">
						<h3 className="text-sm font-extrabold text-foreground sm:text-base">
							Зөв дараалалд оруулна уу:
						</h3>
						<button
							type="button"
							onClick={() => setShowHelp(true)}
							className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pop-sky-soft text-pop-sky-ink transition-transform hover:-translate-y-0.5"
							title="Заавар харах"
						>
							<HelpCircle className="size-5" strokeWidth={2.5} />
						</button>
					</div>

					<DragAndDrop
						answers={items}
						onOrderChange={handleOrderChange}
						disabled={false}
					/>
				</div>
			</div>

			{/* Help Dialog */}
			<Dialog open={showHelp} onOpenChange={setShowHelp}>
				<DialogContent className="max-w-md">
					<DialogTitle className="flex items-center gap-3">
						<span className="flex size-10 items-center justify-center rounded-xl bg-pop-sky-soft text-pop-sky-ink">
							<HelpCircle className="size-5" strokeWidth={2.5} />
						</span>
						<span className="text-xl font-black">Хэрхэн ашиглах вэ?</span>
					</DialogTitle>

					<div className="space-y-4">
						<div className="space-y-3 text-sm">
							<div className="rounded-2xl bg-pop-sky-soft p-3.5">
								<h3 className="mb-2 font-extrabold text-pop-sky-ink">
									🖱️ Компьютер дээр
								</h3>
								<ol className="list-inside list-decimal space-y-2 font-semibold text-foreground/80">
									<li>
										Хариултын хэсгийг{" "}
										<strong className="text-pop-sky-ink">
											чирж
										</strong>{" "}
										зөв байрлалд нь тавина
									</li>
									<li>Чирч байх үед элемент томорч, сүүдэртэй болно</li>
									<li>Байрлалд нь таарч суухад гэрэлтэнэ</li>
									<li>Дарааллыг өөрчлөхийн тулд дахин чирж байршуулна</li>
								</ol>
							</div>

							<div className="rounded-2xl bg-pop-mint-soft p-3.5">
								<h3 className="mb-2 font-extrabold text-pop-mint-ink">
									📱 Гар утсан дээр
								</h3>
								<ol className="list-inside list-decimal space-y-2 font-semibold text-foreground/80">
									<li>
										Хариултыг{" "}
										<strong className="text-pop-mint-ink">
											удаан дарж
										</strong>
										{} барьж, чирч хөдөлгөнө
									</li>
									<li>Зөв байрлалд нь хүргэж, гараа суллана</li>
									<li>Дугаар нь автоматаар шинэчлэгдэнэ</li>
								</ol>
							</div>

							<div className="rounded-2xl bg-muted p-3.5">
								<h3 className="mb-2 font-extrabold">💡 Тэмдэглэл</h3>
								<ul className="space-y-1 text-sm font-semibold text-foreground/80">
									<li>🔢 Дугаарууд автоматаар шинэчлэгдэнэ</li>
									<li>🎯 Зөв дараалал нь дээрээс доош чиглэлтэй</li>
									<li>🔄 Хэдэн ч удаа өөрчлөх боломжтой</li>
									<li>✅ Өөрчлөлт бүр хадгалагдана</li>
								</ul>
							</div>

							<div className="rounded-2xl bg-pop-violet-soft p-3.5">
								<h3 className="mb-2 font-extrabold text-pop-violet-ink">
									⌨️ Гарын товчлуур
								</h3>
								<ul className="space-y-1 text-sm font-semibold text-foreground/80">
									<li>
										<kbd className="rounded-md border-2 border-border bg-card px-1.5 py-0.5 text-xs font-bold">
											Tab
										</kbd>{" "}
										- Элементүүдийг сонгох
									</li>
									<li>
										<kbd className="rounded-md border-2 border-border bg-card px-1.5 py-0.5 text-xs font-bold">
											Space
										</kbd>{" "}
										- Элементийг барих/суллах
									</li>
									<li>
										<kbd className="rounded-md border-2 border-border bg-card px-1.5 py-0.5 text-xs font-bold">
											↑↓
										</kbd>{" "}
										- Дээш/доош хөдөлгөх
									</li>
								</ul>
							</div>
						</div>

						<Button
							onClick={() => setShowHelp(false)}
							className="w-full"
							size="lg"
							variant="default"
						>
							Ойлголоо
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default DragAndDropWrapper;
