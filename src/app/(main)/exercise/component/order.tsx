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
import { CheckCircle2, GripVertical, XCircle } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Answer {
	answer_id: number;
	answer_name_html: string;
	refid?: number;
}

interface DragAndDropProps {
	answers: Answer[];
	droppableId?: string;
	onOrderChange?: (orderedIds: number[]) => void;
	disabled?: boolean;
	showCorrect?: boolean;
	correctIds?: number[];
}

interface DragAndDropWrapperProps {
	questionId: number;
	examId?: number;
	userId?: number;
	answers: Answer[];
	mode: "exam" | "review";
	userAnswers?: number[];
	correctAnswers?: number[];
	onOrderChange?: (orderedIds: number[]) => void;
}

const DragAndDrop: React.FC<DragAndDropProps> = ({
	answers,
	droppableId = "droppable",
	onOrderChange,
	disabled = false,
	showCorrect = false,
	correctIds = [],
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
					<div {...provided.droppableProps} ref={provided.innerRef}>
						{items.map((item, index) => {
							const isCorrect =
								showCorrect &&
								correctIds &&
								correctIds[index] === item.answer_id;

							return (
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
												buttonVariants({ variant: "outline", size: "default" }),
												"w-full mb-2.5 h-auto min-h-14 whitespace-normal justify-start rounded-2xl border-2 p-3 sm:p-4 font-bold transition-colors duration-200 select-none",
												disabled
													? "cursor-default"
													: "cursor-grab hover:border-pop-mint hover:bg-pop-mint-soft/40",
												snapshot.isDragging &&
													"cursor-grabbing border-primary bg-primary/10 text-primary shadow-[0_6px_0_0_var(--primary)] ring-4 ring-primary/20",
												isCorrect &&
													"border-success bg-success/10 text-foreground shadow-[0_4px_0_0_var(--success)]",
												showCorrect &&
													!isCorrect &&
													"border-destructive bg-destructive/10 text-foreground shadow-[0_4px_0_0_var(--destructive)]",
											)}
											style={{ ...providedDraggable.draggableProps.style }}
										>
											<div className="flex items-center gap-3 w-full">
												{!disabled && (
													<GripVertical
														className="size-5 shrink-0 text-muted-foreground"
														aria-hidden="true"
													/>
												)}
												<span
													className={cn(
														"shrink-0 size-8 rounded-xl border-2 flex items-center justify-center text-sm font-black",
														snapshot.isDragging
															? "border-primary bg-primary text-primary-foreground"
															: isCorrect
																? "border-success bg-success text-primary-foreground"
																: showCorrect
																	? "border-destructive bg-destructive text-primary-foreground"
																	: "border-border bg-muted text-muted-foreground",
													)}
												>
													{index + 1}
												</span>
												<div className="flex-1 min-w-0 text-sm sm:text-base">
													{item.answer_name_html
														? parse(item.answer_name_html)
														: ""}
												</div>
												{showCorrect && (
													<span className="shrink-0">
														{isCorrect ? (
															<CheckCircle2
																className="size-6 text-success"
																strokeWidth={2.75}
															/>
														) : (
															<XCircle
																className="size-6 text-destructive"
																strokeWidth={2.75}
															/>
														)}
													</span>
												)}
											</div>
										</div>
									)}
								</Draggable>
							);
						})}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
};

const DragAndDropWrapper: React.FC<DragAndDropWrapperProps> = ({
	answers,
	mode,
	userAnswers = [],
	correctAnswers = [],
	onOrderChange,
}) => {
	const [items, setItems] = useState<Answer[]>(answers);
	const prevUserAnswersRef = useRef<number[]>([]);

	// ⭐ Remove duplicates based on refid
	const uniqueAnswers = useMemo(() => {
		const seen = new Map<number, Answer>();

		answers.forEach((answer) => {
			const key = answer.refid ?? answer.answer_id;
			if (!seen.has(key)) {
				seen.set(key, answer);
			}
		});

		const unique = Array.from(seen.values());

		if (unique.length > 0 && unique[0].refid !== undefined) {
			unique.sort((a, b) => (a.refid ?? 0) - (b.refid ?? 0));
		}

		console.log("=== Ordering Debug ===");
		console.log("Total answers:", answers.length);
		console.log("Unique answers:", unique.length);
		console.log("User answers:", userAnswers);
		console.log("Correct answers:", correctAnswers);
		console.log("====================");

		return unique;
	}, [answers, userAnswers, correctAnswers]);

	useEffect(() => {
		const hasChanged =
			JSON.stringify(prevUserAnswersRef.current) !==
			JSON.stringify(userAnswers);

		if (!hasChanged) return;

		if (userAnswers.length > 0) {
			const sorted = userAnswers
				.map((id) => uniqueAnswers.find((a) => a.answer_id === id))
				.filter(Boolean) as Answer[];

			if (sorted.length > 0) {
				setItems(sorted);
				prevUserAnswersRef.current = userAnswers;
			}
		} else if (prevUserAnswersRef.current.length > 0) {
			setItems(uniqueAnswers);
			prevUserAnswersRef.current = [];
		}
	}, [userAnswers, uniqueAnswers]);

	const handleOrderChange = useCallback(
		(orderedIds: number[]) => {
			if (mode === "exam") {
				onOrderChange?.(orderedIds);
			}
		},
		[onOrderChange, mode],
	);

	const reviewStats = useMemo(() => {
		if (mode !== "review") return null;

		let correct = 0;
		let wrong = 0;

		items.forEach((item, index) => {
			if (correctAnswers[index] === item.answer_id) {
				correct++;
			} else {
				wrong++;
			}
		});

		return { correct, wrong, total: items.length };
	}, [items, correctAnswers, mode]);

	const correctOrderedAnswers = useMemo(() => {
		if (mode !== "review" || correctAnswers.length === 0) return [];

		return correctAnswers
			.map((id) => uniqueAnswers.find((a) => a.answer_id === id))
			.filter(Boolean) as Answer[];
	}, [correctAnswers, uniqueAnswers, mode]);

	return (
		<div className="space-y-4">
			{mode === "review" && reviewStats && (
				<div className="bg-pop-sky-soft border-2 border-pop-sky/40 p-4 rounded-2xl">
					<div className="flex flex-wrap items-center justify-between gap-2 mb-2">
						<h4 className="font-extrabold text-pop-sky-ink text-sm sm:text-base">
							Дарааллын үр дүн
						</h4>
						<div className="flex items-center gap-2 text-sm">
							<span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-success font-extrabold">
								<CheckCircle2 className="size-4" strokeWidth={2.75} />
								{reviewStats.correct}
							</span>
							<span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-destructive font-extrabold">
								<XCircle className="size-4" strokeWidth={2.75} />
								{reviewStats.wrong}
							</span>
						</div>
					</div>
					<p className="text-xs font-semibold text-pop-sky-ink">
						{reviewStats.total > 0
							? `Нийт ${reviewStats.total} элементээс ${reviewStats.correct} зөв байрлуулсан`
							: "Хариулаагүй"}
					</p>
				</div>
			)}

			<div className="p-3 sm:p-4 border-2 border-border rounded-2xl space-y-3 bg-muted/50">
				<h3 className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-foreground">
					<span aria-hidden="true">🔢</span>
					{mode === "exam"
						? "Зөв дараалалд оруулна уу:"
						: "Таны өгсөн дараалал:"}
				</h3>

				<DragAndDrop
					answers={items}
					onOrderChange={handleOrderChange}
					disabled={mode === "review"}
					showCorrect={mode === "review"}
					correctIds={correctAnswers}
				/>

				{mode === "review" && (
					<div className="mt-4 space-y-2 text-sm font-semibold bg-card border-2 border-border p-3 rounded-xl">
						<div className="flex items-center gap-2 text-success">
							<CheckCircle2 className="size-4 shrink-0" strokeWidth={2.75} />
							<span>Зөв байрлалд байгаа хариулт</span>
						</div>
						<div className="flex items-center gap-2 text-destructive">
							<XCircle className="size-4 shrink-0" strokeWidth={2.75} />
							<span>Буруу байрлалд байгаа хариулт</span>
						</div>
					</div>
				)}
			</div>

			{mode === "review" && correctOrderedAnswers.length > 0 && (
				<div className="p-4 border-2 border-success rounded-2xl bg-success/10 space-y-3 animate-pop-in">
					<h3 className="font-extrabold text-base sm:text-lg text-success flex items-center gap-2">
						<CheckCircle2 className="size-5" strokeWidth={2.75} />
						Зөв дараалал:
					</h3>

					<div className="space-y-2">
						{correctOrderedAnswers.map((answer, index) => (
							<div
								key={answer.answer_id}
								className="flex items-center gap-3 p-3 bg-card rounded-2xl border-2 border-success/50 shadow-[0_3px_0_0_color-mix(in_oklch,var(--success)_40%,transparent)]"
							>
								<span className="shrink-0 size-8 rounded-xl bg-success text-primary-foreground flex items-center justify-center font-black text-sm">
									{index + 1}
								</span>
								<div className="flex-1 min-w-0 text-sm sm:text-base font-bold text-foreground">
									{answer.answer_name_html
										? parse(answer.answer_name_html)
										: ""}
								</div>
								<CheckCircle2
									className="size-5 text-success shrink-0"
									strokeWidth={2.75}
								/>
							</div>
						))}
					</div>

					<div className="text-xs font-semibold text-foreground/80 bg-card/70 p-2.5 rounded-xl">
						💡 Энэ бол зөв дараалал юм. Таны хариултыг дээрх хэсэгтэй харьцуулна
						уу.
					</div>
				</div>
			)}
		</div>
	);
};

export default DragAndDropWrapper;
