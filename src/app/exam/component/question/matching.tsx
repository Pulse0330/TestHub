"use client";

import parse from "html-react-parser";
import {
	HelpCircle,
	Maximize,
	Minimize,
	RotateCw,
	X,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function MatchingZoomImage({
	src,
	alt = "Зураг",
}: {
	src: string;
	alt?: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [zoom, setZoom] = useState(1);
	const [rotation, setRotation] = useState(0);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const dragStart = useRef({ x: 0, y: 0 });

	const close = () => {
		setIsOpen(false);
		setTimeout(() => {
			setZoom(1);
			setRotation(0);
			setPosition({ x: 0, y: 0 });
		}, 200);
	};

	return (
		<>
			<div className="relative w-full h-32 group">
				<Image
					src={src}
					alt={alt}
					fill
					sizes="280px"
					quality={85}
					style={{ objectFit: "contain" }}
					className="pointer-events-none rounded-xl"
					loading="lazy"
				/>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						setIsOpen(true);
					}}
					className="absolute top-1 right-1 z-10 flex size-8 items-center justify-center rounded-xl border-2 border-border bg-card text-foreground opacity-0 transition-opacity group-hover:opacity-100"
					title="Томруулах"
				>
					<Maximize size={14} />
				</button>
			</div>

			<Dialog open={isOpen} onOpenChange={close}>
				<DialogContent
					className="flex h-[90vh] w-[95vw] max-w-5xl flex-col p-4"
					onClick={(e) => e.stopPropagation()}
				>
					<DialogTitle className="truncate text-sm font-bold">{alt}</DialogTitle>
					<div
						role="application"
						aria-label="Зургийг чирж томруулах"
						className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-muted"
						onMouseDown={(e) => {
							if (zoom <= 1) return;
							setIsDragging(true);
							dragStart.current = {
								x: e.clientX - position.x,
								y: e.clientY - position.y,
							};
						}}
						onMouseMove={(e) => {
							if (!isDragging) return;
							setPosition({
								x: e.clientX - dragStart.current.x,
								y: e.clientY - dragStart.current.y,
							});
						}}
						onMouseUp={() => setIsDragging(false)}
						onMouseLeave={() => setIsDragging(false)}
						style={{
							cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
						}}
					>
						<div
							style={{
								transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
								transition: isDragging ? "none" : "transform 0.2s",
								width: "100%",
								height: "100%",
								position: "relative",
							}}
						>
							<Image
								src={src}
								alt={alt}
								fill
								sizes="90vw"
								quality={100}
								priority
								style={{ objectFit: "contain" }}
								className="pointer-events-none rounded-xl"
								draggable={false}
							/>
						</div>

						<div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 py-2 shadow-[0_4px_0_0_var(--border)]">
							<Button
								size="icon"
								variant="ghost"
								onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
								disabled={zoom >= 3}
							>
								<ZoomIn size={18} />
							</Button>
							<span className="w-12 text-center text-xs font-bold tabular-nums">
								{Math.round(zoom * 100)}%
							</span>
							<Button
								size="icon"
								variant="ghost"
								onClick={() =>
									setZoom((z) => {
										const n = Math.max(z - 0.25, 0.5);
										if (n <= 1) setPosition({ x: 0, y: 0 });
										return n;
									})
								}
								disabled={zoom <= 0.5}
							>
								<ZoomOut size={18} />
							</Button>
							<div className="h-5 w-0.5 rounded-full bg-border" />
							<Button
								size="icon"
								variant="ghost"
								onClick={() => setRotation((r) => (r + 90) % 360)}
							>
								<RotateCw size={18} />
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="text-xs px-2"
								onClick={() => {
									setZoom(1);
									setRotation(0);
									setPosition({ x: 0, y: 0 });
								}}
							>
								Reset
							</Button>
						</div>

						<Button
							size="icon"
							variant="secondary"
							className="absolute top-2 right-2"
							onClick={close}
						>
							<Minimize size={18} />
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

// VisuallyHidden component for accessibility
const _VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
	<span
		style={{
			position: "absolute",
			border: 0,
			width: 1,
			height: 1,
			padding: 0,
			margin: -1,
			overflow: "hidden",
			clip: "rect(0, 0, 0, 0)",
			whiteSpace: "nowrap",
			wordWrap: "normal",
		}}
	>
		{children}
	</span>
);

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
	userAnswers?: Record<number, number[]>;
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
	const [showHelp, setShowHelp] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const updateXarrow = useXarrow();
	const lastNotifiedRef = useRef<string>("");
	const onMatchChangeRef = useRef(onMatchChange);

	const colorPalette = useRef<string[]>([
		"#3b82f6",
		"#8b5cf6",
		"#ec4899",
		"#f59e0b",
		"#eab308",
		"#6366f1",
		"#a855f7",
		"#f97316",
		"#fbbf24",
		"#fb923c",
		"#c026d3",
		"#e11d48",
		"#7c3aed",
		"#4f46e5",
		"#2563eb",
		"#0284c7",
		"#facc15",
		"#fde047",
		"#fb7185",
		"#f472b6",
		"#d946ef",
		"#a78bfa",
		"#818cf8",
		"#60a5fa",
		"#fcd34d",
		"#fdba74",
		"#fed7aa",
		"#fde68a",
		"#93c5fd",
		"#c4b5fd",
		"#ddd6fe",
		"#fbcfe8",
		"#fecaca",
		"#fed7e2",
		"#fef3c7",
		"#1d4ed8",
		"#7e22ce",
		"#be185d",
		"#ca8a04",
		"#ea580c",
		"#9333ea",
		"#db2777",
		"#0369a1",
		"#4338ca",
		"#f59e42",
		"#fbbf80",
		"#a21caf",
		"#854d0e",
		"#b45309",
		"#92400e",
	]);

	const getUniqueColor = useCallback(
		(currentConnections: Connection[]): string => {
			const usedColors = new Set(currentConnections.map((c) => c.color));
			const available = colorPalette.current.filter((c) => !usedColors.has(c));

			if (available.length === 0) {
				return colorPalette.current[
					currentConnections.length % colorPalette.current.length
				];
			}

			return available[0];
		},
		[],
	);

	useEffect(() => {
		onMatchChangeRef.current = onMatchChange;
	}, [onMatchChange]);

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

		Object.entries(userAnswers).forEach(([qRefIdStr, answerIds]) => {
			const qRefId = Number(qRefIdStr);

			const question = answers.find(
				(a) => a.refid === qRefId && a.ref_child_id === -1,
			);

			if (!question) return;

			answerIds.forEach((answerId) => {
				const answer = answers.find((a) => a.answer_id === answerId);

				if (answer) {
					restored.push({
						start: `q-${question.answer_id}`,
						end: `a-${answer.answer_id}`,
						color: getUniqueColor(restored),
					});
				}
			});
		});

		setConnections(restored);
	}, [userAnswers, answers, getUniqueColor]);

	const isSelected = (id: string) => id === activeStart;

	const isConnected = (id: string) =>
		connections.some((c) => c.start === id || c.end === id);

	const getConnectionColors = (id: string) =>
		connections
			.filter((c) => c.start === id || c.end === id)
			.map((c) => c.color);

	const handleItemClick = useCallback(
		(id: string, isQuestion: boolean) => {
			if (!isQuestion && !activeStart) {
				const existingConnections = connections.filter((c) => c.end === id);

				if (existingConnections.length > 0) {
					setConnections((prev) =>
						prev.filter((c) => !existingConnections.includes(c)),
					);
				}
				return;
			}

			if (activeStart && activeStart !== id) {
				const firstIsQuestion = activeStart.startsWith("q-");

				if (firstIsQuestion && isQuestion) {
					setActiveStart(id);
					return;
				}

				if (firstIsQuestion && !isQuestion) {
					const start = activeStart;
					const end = id;

					const existingConnection = connections.find(
						(c) => c.start === start && c.end === end,
					);

					if (existingConnection) {
						setConnections((prev) =>
							prev.filter((c) => c !== existingConnection),
						);
					} else {
						setConnections((prevConnections) => {
							const color = getUniqueColor(prevConnections);
							return [...prevConnections, { start, end, color }];
						});
					}

					setActiveStart("");
					return;
				}

				return;
			}

			if (isQuestion) {
				setActiveStart(id);
			}
		},
		[activeStart, connections, getUniqueColor],
	);

	const interactiveProps = (id: string) => ({
		role: "button",
		tabIndex: 0,
		onClick: () => handleItemClick(id, id.startsWith("q-")),
		onKeyDown: (e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				handleItemClick(id, id.startsWith("q-"));
			}
		},
	});

	const renderContent = (item: QuestionItem) => {
		return (
			<div className="w-full">
				{item.answer_img && (
					<div className="mb-2">
						<MatchingZoomImage
							src={item.answer_img}
							alt={item.answer_name_html || "Зураг"}
						/>
					</div>
				)}
				{item.answer_name_html && (
					<div className="text-center text-sm font-bold">
						{parse(item.answer_name_html.trim())}
					</div>
				)}
				{!item.answer_name_html && !item.answer_img && (
					<div className="text-center text-sm font-semibold text-muted-foreground">
						Контент байхгүй
					</div>
				)}
			</div>
		);
	};

	const questionsOnly = answers.filter((a) => a.ref_child_id === -1);
	const answersOnly = answers.filter(
		(a) => a.ref_child_id && a.ref_child_id >= 1,
	);

	useEffect(() => {
		if (!onMatchChangeRef.current) return;

		const matches: Record<number, number[]> = {};

		connections.forEach((c) => {
			const startId = parseInt(c.start.replace("q-", ""), 10);
			const endId = parseInt(c.end.replace("a-", ""), 10);

			const question = answers.find((a) => a.answer_id === startId);
			const answer = answers.find((a) => a.answer_id === endId);

			if (question && answer) {
				if (!matches[question.refid]) {
					matches[question.refid] = [];
				}
				matches[question.refid].push(answer.answer_id);
			}
		});

		const str = JSON.stringify(matches);
		if (lastNotifiedRef.current !== str) {
			lastNotifiedRef.current = str;
			onMatchChangeRef.current(matches);
		}
		setTimeout(updateXarrow, 0);
	}, [connections, updateXarrow, answers]);

	return (
		<>
			<div ref={containerRef} className="w-full relative">
				<Xwrapper>
					<div className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-muted/60 px-3 py-2.5">
						<p className="text-center text-sm font-bold text-muted-foreground">
							{isMobile
								? "Асуулт → Хариулт → Асуулт дахин → Дараагийн хариулт"
								: "Асуулт сонгоод хариултаа дарна уу. Дараагийн хариулт холбохын тулд асуултаа дахин дарна уу."}
						</p>
						<button
							type="button"
							onClick={() => setShowHelp(true)}
							className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pop-sky-soft text-pop-sky-ink transition-transform hover:-translate-y-0.5"
							title="Заавар харах"
						>
							<HelpCircle className="size-5" strokeWidth={2.5} />
						</button>
					</div>

					{isMobile ? (
						<div className="space-y-4 max-h-[80vh] overflow-y-auto">
							{questionsOnly.map((q) => {
								const qid = `q-${q.answer_id}`;
								const connectedAnswers = connections.filter(
									(c) => c.start === qid,
								);
								const answerItems = connectedAnswers
									.map((c) =>
										answersOnly.find((a) => `a-${a.answer_id}` === c.end),
									)
									.filter(Boolean);

								return (
									<div key={qid} className="space-y-2">
										<div
											id={qid}
											{...interactiveProps(qid)}
											className={cn(
												"flex w-full cursor-pointer flex-col items-center rounded-2xl border-2 p-3 transition-colors",
												isSelected(qid)
													? "border-pop-sky bg-pop-sky-soft ring-4 ring-pop-sky/20"
													: isConnected(qid)
														? "border-success bg-success/10"
														: "border-border bg-card",
											)}
										>
											{renderContent(q)}
											{connectedAnswers.length > 0 && (
												<div className="mt-2 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
													{connectedAnswers.length} хариулт холбогдсон
												</div>
											)}
										</div>

										{answerItems.length > 0 && (
											<div className="ml-2 space-y-2 border-l-4 border-success/40 pl-3">
												<div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
													<span>Сонгосон хариултууд:</span>
													<span className="text-xs font-bold text-destructive">
														дарж устгана
													</span>
												</div>
												{answerItems.map(
													(answerItem) =>
														answerItem && (
															<div
																key={`mobile-answer-${answerItem.answer_id}`}
																{...interactiveProps(
																	`a-${answerItem.answer_id}`,
																)}
																className="cursor-pointer rounded-xl border-2 border-success bg-success/10 p-2 transition-all hover:border-destructive hover:bg-destructive/10 active:scale-95"
															>
																<div className="flex items-center gap-2">
																	<div className="flex-1">
																		{renderContent(answerItem)}
																	</div>
																	<X className="size-4 shrink-0 text-destructive" />
																</div>
															</div>
														),
												)}
											</div>
										)}

										{isSelected(qid) && (
											<div className="mt-2 ml-2 space-y-2 pl-3">
												<div className="mb-1 flex items-center gap-2 text-sm font-bold text-pop-sky-ink">
													<span className="inline-block size-2 animate-pulse rounded-full bg-pop-sky" />
													Холбох хариултаа сонгоно уу:
												</div>
												{answersOnly.map((a) => {
													const aid = `a-${a.answer_id}`;
													const alreadyConnected = connections.some(
														(c) => c.start === qid && c.end === aid,
													);
													return (
														<div
															key={aid}
															{...interactiveProps(aid)}
															className={cn(
																"w-full cursor-pointer rounded-xl border-2 p-2 transition-colors",
																alreadyConnected
																	? "border-success bg-success/10"
																	: "border-dashed border-pop-sky/50 bg-card hover:border-pop-sky hover:bg-pop-sky-soft",
															)}
														>
															{renderContent(a)}
														</div>
													);
												})}
											</div>
										)}
									</div>
								);
							})}
						</div>
					) : (
						<div className="grid grid-cols-2 gap-x-10 gap-y-3">
							<div className="flex justify-center">
								<h3 className="rounded-full bg-muted px-4 py-1 text-center text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
									Асуулт
								</h3>
							</div>
							<div className="flex justify-center">
								<h3 className="rounded-full bg-muted px-4 py-1 text-center text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
									Хариулт
								</h3>
							</div>

							<div className="space-y-3">
								{questionsOnly.map((q) => {
									const qid = `q-${q.answer_id}`;
									const colors = getConnectionColors(qid);
									const connectionCount = colors.length;

									return (
										<div
											key={qid}
											id={qid}
											{...interactiveProps(qid)}
											className={cn(
												"relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 bg-card p-4 transition-all",
												isSelected(qid)
													? "border-pop-sky bg-pop-sky-soft shadow-[0_4px_0_0_var(--pop-sky)] ring-4 ring-pop-sky/20"
													: isConnected(qid)
														? "border-success hover:border-destructive"
														: "border-border shadow-[0_3px_0_0_var(--border)] hover:border-pop-sky/60",
											)}
											style={
												!isSelected(qid) && colors.length > 0
													? {
															borderWidth: "2px",
															background: `linear-gradient(135deg, ${colors
																.map(
																	(c, i) =>
																		`${c}20 ${(i / colors.length) * 100}%, ${c}20 ${((i + 1) / colors.length) * 100}%`,
																)
																.join(", ")})`,
														}
													: undefined
											}
										>
											{renderContent(q)}
											{connectionCount > 0 && (
												<div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-success text-xs font-black text-white">
													{connectionCount}
												</div>
											)}
										</div>
									);
								})}
							</div>

							<div className="space-y-3">
								{answersOnly.map((a) => {
									const aid = `a-${a.answer_id}`;
									const colors = getConnectionColors(aid);
									const isConnectedAnswer = isConnected(aid);
									const isClickable = !!activeStart || isConnectedAnswer;

									return (
										<div
											key={aid}
											id={aid}
											{...interactiveProps(aid)}
											className={cn(
												"relative flex w-full flex-col items-center justify-center rounded-2xl border-2 bg-card p-4 transition-all",
												isClickable
													? "cursor-pointer"
													: "cursor-not-allowed opacity-60",
												isSelected(aid)
													? "border-pop-sky bg-pop-sky-soft"
													: isConnectedAnswer
														? "border-success bg-success/10 hover:border-destructive hover:bg-destructive/10"
														: activeStart
															? "border-dashed border-pop-sky/50 hover:border-pop-sky hover:bg-pop-sky-soft"
															: "border-border",
											)}
											style={
												!isSelected(aid) && colors.length > 0
													? {
															borderWidth: "2px",
															background: `linear-gradient(135deg, ${colors
																.map(
																	(c, i) =>
																		`${c}20 ${(i / colors.length) * 100}%, ${c}20 ${((i + 1) / colors.length) * 100}%`,
																)
																.join(", ")})`,
														}
													: undefined
											}
											title={isConnectedAnswer ? "Дарж устгана уу" : ""}
										>
											{renderContent(a)}
											{isConnectedAnswer && (
												<div className="absolute top-1 right-1 text-xs font-bold text-destructive opacity-0 transition-opacity group-hover:opacity-100">
													×
												</div>
											)}
										</div>
									);
								})}
							</div>

							{connections.map((c, idx) => (
								<Xarrow
									key={`${c.start}-${c.end}-${idx}`}
									start={c.start}
									end={c.end}
									color={c.color}
									strokeWidth={3}
									curveness={0.3}
									showHead={false}
								/>
							))}
						</div>
					)}
				</Xwrapper>
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
									✅ Холбох
								</h3>
								<ol className="list-inside list-decimal space-y-1 font-semibold text-foreground/80">
									<li>
										<strong>Асуулт</strong> баганаас асуултаа сонгоно (цэнхэр
										хүрээтэй болно)
									</li>
									<li>
										<strong>Хариулт</strong> баганаас хариултаа дарна
									</li>
									<li>Холболт үүсэх ба сонголт цуцлагдана</li>
									<li>
										Дараагийн хариулт холбохын тулд{" "}
										<strong>асуултаа дахин</strong> дарна
									</li>
								</ol>
							</div>

							<div className="rounded-2xl bg-pop-coral-soft p-3.5">
								<h3 className="mb-2 font-extrabold text-pop-coral-ink">
									❌ Устгах
								</h3>
								<ul className="list-inside list-disc space-y-1 font-semibold text-foreground/80">
									<li>
										Холбогдсон <strong>хариулт</strong> дээр дарах → холболт
										устана
									</li>
									<li>
										Асуулт сонгоод ижил хариултаа дахин дарах → холболт устана
									</li>
								</ul>
							</div>

							<div className="rounded-2xl bg-muted p-3.5">
								<h3 className="mb-2 font-extrabold">💡 Дохио өнгөнүүд</h3>
								<ul className="space-y-1 text-sm font-semibold text-foreground/80">
									<li>🔵 Цэнхэр = Идэвхтэй сонголт</li>
									<li>🟢 Ногоон = Холбогдсон</li>
									<li>🔴 Улаан = Устгах боломжтой</li>
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
}
