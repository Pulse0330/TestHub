"use client";

import parse from "html-react-parser";
import {
	CheckCircle2,
	Lightbulb,
	Maximize2,
	RotateCcw,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface QuestionItem {
	refid: number;
	answer_id: number;
	question_id: number | null;
	answer_name_html: string;
	answer_descr: string;
	answer_img: string | null;
	ref_child_id: number | null;
	is_true?: boolean;
}

interface MatchingByLineProps {
	answers: QuestionItem[];
	onMatchChange?: (matches: Record<number, number[]>) => void;
	readonly?: boolean;
	userAnswers?: Record<number, number | number[]>;
}

interface Connection {
	start: string;
	end: string;
	color: string;
}

export default function MatchingByLine({
	answers = [],
	onMatchChange,
	userAnswers = {},
}: MatchingByLineProps) {
	const [connections, setConnections] = useState<Connection[]>([]);
	const [activeStart, setActiveStart] = useState<string>("");
	const [isMobile, setIsMobile] = useState(false);
	const [zoomedImage, setZoomedImage] = useState<string | null>(null);
	const [showResults, setShowResults] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const updateXarrow = useXarrow();
	const lastNotifiedRef = useRef<string>("");
	const isRestoringRef = useRef(false);
	const onMatchChangeRef = useRef(onMatchChange);

	const colorPalette = useRef<string[]>([
		"#6366f1",
		"#8b5cf6",
		"#d946ef",
		"#ec4899",
		"#06b6d4",
		"#3b82f6",
		"#64748b",
		"#a855f7",
	]);

	const getUniqueColor = useCallback(
		(currentConnections: Connection[]): string => {
			const usedColors = new Set(currentConnections.map((c) => c.color));
			const available = colorPalette.current.filter((c) => !usedColors.has(c));
			if (available.length === 0) {
				return colorPalette.current[
					Math.floor(Math.random() * colorPalette.current.length)
				];
			}
			return available[Math.floor(Math.random() * available.length)];
		},
		[],
	);

	const handleImageClick = useCallback(
		(e: React.MouseEvent, imageUrl: string) => {
			e.stopPropagation();
			setZoomedImage(imageUrl);
		},
		[],
	);

	useEffect(() => {
		onMatchChangeRef.current = onMatchChange;
	}, [onMatchChange]);

	// Notify parent when connections change
	useEffect(() => {
		if (isRestoringRef.current) return;
		if (!onMatchChangeRef.current) return;

		const matches: Record<number, number[]> = {};
		for (const c of connections) {
			const qId = parseInt(c.start.replace("q-", ""), 10);
			const aId = parseInt(c.end.replace("a-", ""), 10);
			if (!matches[qId]) matches[qId] = [];
			matches[qId].push(aId);
		}

		const key = JSON.stringify(matches);
		if (lastNotifiedRef.current === key) return;
		lastNotifiedRef.current = key;
		onMatchChangeRef.current(matches);
	}, [connections]);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		const container = containerRef.current?.parentElement;
		if (container) {
			const handleScroll = () => updateXarrow();
			container.addEventListener("scroll", handleScroll);
			return () => container.removeEventListener("scroll", handleScroll);
		}
		window.addEventListener("resize", updateXarrow);
		return () => window.removeEventListener("resize", updateXarrow);
	}, [updateXarrow]);

	useEffect(() => {
		if (Object.keys(userAnswers).length === 0) return;

		const restored: Connection[] = [];
		Object.entries(userAnswers).forEach(([qAnswerIdStr, answerIdOrIds]) => {
			const qAnswerId = Number(qAnswerIdStr);

			const question = answers.find(
				(a) =>
					a.answer_id === qAnswerId &&
					a.ref_child_id !== null &&
					a.ref_child_id >= 1,
			);
			if (!question) return;

			const answerIds = Array.isArray(answerIdOrIds)
				? answerIdOrIds
				: [answerIdOrIds];

			for (const answerId of answerIds) {
				const answer = answers.find((a) => a.answer_id === answerId);
				if (answer) {
					restored.push({
						start: `q-${question.answer_id}`,
						end: `a-${answer.answer_id}`,
						color: getUniqueColor(restored),
					});
				}
			}
		});

		isRestoringRef.current = true;
		setConnections(restored);
		Promise.resolve().then(() => {
			isRestoringRef.current = false;
		});
	}, [userAnswers, answers, getUniqueColor]);

	const handleItemClick = useCallback(
		(id: string, isQuestion: boolean) => {
			if (showResults) return;

			if (isQuestion) {
				setActiveStart((prev) => (prev === id ? "" : id));
				return;
			}

			if (!activeStart) return;

			setConnections((prev) => {
				const alreadyConnected = prev.find(
					(c) => c.start === activeStart && c.end === id,
				);

				if (alreadyConnected) {
					return prev.filter((c) => !(c.start === activeStart && c.end === id));
				}

				const color = getUniqueColor(prev);
				return [...prev, { start: activeStart, end: id, color }];
			});
		},
		[getUniqueColor, showResults, activeStart],
	);

	const getConnectionCorrectness = (connection: Connection) => {
		const startId = parseInt(connection.start.replace("q-", ""), 10);
		const endId = parseInt(connection.end.replace("a-", ""), 10);
		const question = answers.find((a) => a.answer_id === startId);
		const answer = answers.find((a) => a.answer_id === endId);
		return question?.ref_child_id === answer?.refid;
	};

	const handleCheckAnswers = () => setShowResults(true);

	const handleReset = () => {
		setShowResults(false);
		setConnections([]);
		setActiveStart("");
		lastNotifiedRef.current = "";
	};

	// ✅ FIX 1: renderContent — grid class буруу орсныг засав, анхны байдалд буцаав
	const renderContent = (item: QuestionItem) => (
		<div className="flex flex-col gap-2">
			{item.answer_img && (
				<div className="relative group/img w-full aspect-video sm:aspect-square max-h-40 bg-muted rounded-xl overflow-hidden border-2 border-border">
					<Image
						src={item.answer_img}
						alt="Content"
						fill
						className="object-contain p-2 transition-transform group-hover/img:scale-105"
					/>
					<div
						onPointerDown={(e) => {
							e.stopPropagation();
							handleImageClick(
								e as unknown as React.MouseEvent,
								item.answer_img as string,
							);
						}}
						className="absolute top-2 right-2 p-1.5 rounded-xl bg-card border-2 border-border opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer hover:bg-accent pointer-events-auto"
					>
						<Maximize2 className="size-4 text-foreground" strokeWidth={2.5} />
					</div>
				</div>
			)}
			{item.answer_name_html && (
				<div className="text-sm sm:text-base font-bold text-foreground wrap-break-words">
					{parse(item.answer_name_html.trim())}
				</div>
			)}
		</div>
	);

	const questionsOnly = answers.filter(
		(a) => a.ref_child_id !== null && a.ref_child_id >= 1,
	);
	const answersOnly = answers.filter((a) => a.ref_child_id === -1);

	return (
		<div
			className="w-full max-w-5xl mx-auto p-1 sm:p-4 select-none"
			ref={containerRef}
		>
			<Xwrapper>
				{/* Header Section */}
				<div className="text-center mb-8 space-y-3">
					<h2 className="text-lg sm:text-xl font-black text-foreground">
						{/* ✅ FIX 2: isMobile state-ийн оронд CSS class ашиглав */}
						<span className="md:hidden">Тохирохыг сонгоно уу</span>
						<span className="hidden md:inline">
							Асуулт ба хариултыг холбоно уу
						</span>
					</h2>
					{!showResults && (
						<div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pop-sun-soft text-pop-sun-ink rounded-full text-sm font-bold">
							<Lightbulb className="size-4" strokeWidth={2.5} />
							Картууд дээр дарж холболт хийнэ
						</div>
					)}
				</div>

				{/* Status Bar */}
				<div className="flex flex-wrap justify-center gap-4 mb-8 sm:mb-10">
					{!showResults ? (
						<Button
							onClick={handleCheckAnswers}
							disabled={connections.length === 0}
							size="lg"
							className="rounded-2xl px-8"
						>
							<CheckCircle2 className="size-5 mr-1" strokeWidth={2.75} />
							Шалгах ({connections.length}/{questionsOnly.length})
						</Button>
					) : (
						<div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 animate-in fade-in zoom-in">
							<Button
								onClick={handleReset}
								variant="outline"
								className="rounded-2xl px-6 h-11"
							>
								<RotateCcw className="size-4 mr-1" strokeWidth={2.75} />
								Дахин эхлэх
							</Button>
							<div className="flex gap-2">
								<span className="text-success font-extrabold flex items-center gap-1.5 rounded-full bg-success/10 border-2 border-success/40 px-4 py-1.5">
									<div className="size-2.5 rounded-full bg-success" />
									{
										connections.filter((c) => getConnectionCorrectness(c))
											.length
									}{" "}
									зөв
								</span>
								<span className="text-destructive font-extrabold flex items-center gap-1.5 rounded-full bg-destructive/10 border-2 border-destructive/40 px-4 py-1.5">
									<div className="size-2.5 rounded-full bg-destructive" />
									{
										connections.filter((c) => !getConnectionCorrectness(c))
											.length
									}{" "}
									буруу
								</span>
							</div>
						</div>
					)}
				</div>

				{/* ✅ FIX 3: Main Content — isMobile state-ийн оронд Tailwind responsive class */}
				<div className="grid gap-6 relative grid-cols-1 md:grid-cols-2 md:gap-x-32">
					{/* Questions Column */}
					<div className="grid gap-4 items-start">
						{/* ✅ FIX 4: {!isMobile && ...} оронд hidden md:block */}
						<h3 className="hidden md:block text-center font-extrabold text-muted-foreground text-xs uppercase tracking-widest mb-2">
							Асуултууд
						</h3>
						{questionsOnly.map((q) => {
							const id = `q-${q.answer_id}`;
							const isActive = activeStart === id;
							const qConnections = connections.filter((c) => c.start === id);
							const count = qConnections.length;
							const dotColor = qConnections[0]?.color;

							return (
								<button
									key={id}
									id={id}
									type="button"
									onClick={() => handleItemClick(id, true)}
									className={cn(
										"w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-[border-color,background-color,box-shadow] relative bg-card shadow-[0_4px_0_0_var(--border)]",
										isActive
											? "border-primary bg-primary/10 ring-4 ring-primary/20 shadow-[0_4px_0_0_var(--primary)]"
											: "border-border hover:border-primary/40 hover:bg-accent/40",
									)}
									style={
										!showResults && !isActive && dotColor
											? { borderColor: dotColor }
											: {}
									}
								>
									<div className="flex items-center gap-4">
										<div className="flex-1">{renderContent(q)}</div>
										{/* ✅ FIX 5: hidden md:flex */}
										<div
											className={cn(
												"hidden md:flex min-w-[1.25rem] h-5 rounded-full border-2 border-card shrink-0 items-center justify-center text-[10px] font-black text-white transition-all",
												count > 0 ? "px-1" : "w-5 bg-muted border-border",
											)}
											style={
												count > 0
													? {
															backgroundColor: dotColor,
															borderColor: dotColor,
														}
													: {}
											}
										>
											{count > 1 ? count : ""}
										</div>
									</div>
								</button>
							);
						})}
					</div>

					{/* Answers Column */}
					<div className="grid gap-4 items-start">
						{/* ✅ FIX 6: hidden md:block */}
						<h3 className="hidden md:block text-center font-extrabold text-muted-foreground text-xs uppercase tracking-widest mb-2">
							Хариултууд
						</h3>
						{answersOnly.map((a) => {
							const id = `a-${a.answer_id}`;
							const aConnections = connections.filter((c) => c.end === id);
							const count = aConnections.length;
							const connected = count > 0;
							const lastColor = aConnections[count - 1]?.color;

							return (
								<button
									key={id}
									id={id}
									type="button"
									onClick={() => handleItemClick(id, false)}
									className={cn(
										"w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-[border-color,background-color,box-shadow] bg-card shadow-[0_4px_0_0_var(--border)]",
										activeStart && !connected
											? "border-dashed border-primary/50 bg-primary/5 animate-pulse"
											: "border-border hover:border-primary/40 hover:bg-accent/40",
									)}
									style={
										!showResults && lastColor ? { borderColor: lastColor } : {}
									}
								>
									<div className="flex items-center gap-4">
										{/* ✅ FIX 7: hidden md:flex */}
										<div
											className={cn(
												"hidden md:flex min-w-[1.25rem] h-5 rounded-full border-2 border-card shrink-0 items-center justify-center text-[10px] font-black text-white transition-all",
												count > 0 ? "px-1" : "w-5 bg-muted border-border",
											)}
											style={
												count > 0
													? {
															backgroundColor: lastColor,
															borderColor: lastColor,
														}
													: {}
											}
										>
											{count > 1 ? count : ""}
										</div>
										<div className="flex-1">{renderContent(a)}</div>
									</div>
								</button>
							);
						})}
					</div>

					{/* Desktop Arrows — Xarrow CSS media query мэдэхгүй тул isMobile state хэвээр */}
					{!isMobile &&
						connections.map((c) => (
							<Xarrow
								key={`${c.start}-${c.end}`}
								start={c.start}
								end={c.end}
								color={
									showResults
										? getConnectionCorrectness(c)
											? "#10b981"
											: "#ef4444"
										: c.color
								}
								strokeWidth={3}
								curveness={0.3}
								showHead={false}
								startAnchor="right"
								endAnchor="left"
							/>
						))}
				</div>
			</Xwrapper>

			{/* Zoom Dialog */}
			<Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
				<DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
					<DialogTitle className="sr-only">Зураг</DialogTitle>
					<DialogClose className="fixed top-4 right-4 z-50 bg-card text-foreground border-2 border-border rounded-xl p-2 shadow-[0_3px_0_0_var(--border)]">
						<XCircle className="size-6" strokeWidth={2.5} />
					</DialogClose>
					{zoomedImage && (
						<div className="relative w-full aspect-video">
							<Image
								src={zoomedImage}
								alt="Zoomed"
								fill
								className="object-contain"
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
