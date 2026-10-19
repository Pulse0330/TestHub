"use client";

import { Check, Crop, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

// 3:4 харьцаа (өргөн:өндөр)
const ASPECT_RATIO = 3 / 4;

interface ImageCropModalProps {
	open: boolean;
	imageSrc: string | null;
	onConfirm: (croppedBlob: Blob) => void;
	onCancel: () => void;
}

export function ImageCropModal({
	open,
	imageSrc,
	onConfirm,
	onCancel,
}: ImageCropModalProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement | null>(null);

	const [scale, setScale] = useState(1);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [canvasSize, setCanvasSize] = useState({ w: 300, h: 400 });
	const [imgLoaded, setImgLoaded] = useState(false);

	// Canvas хэмжээ тооцоолох
	useEffect(() => {
		if (!open) return;
		const updateSize = () => {
			const maxW = Math.min(window.innerWidth - 80, 420);
			const maxH = Math.min(window.innerHeight - 260, 480);
			// 3:4 харьцаагаар container-т багтаах
			let w = maxW;
			let h = w / ASPECT_RATIO;
			if (h > maxH) {
				h = maxH;
				w = h * ASPECT_RATIO;
			}
			setCanvasSize({ w: Math.floor(w), h: Math.floor(h) });
		};
		updateSize();
		window.addEventListener("resize", updateSize);
		return () => window.removeEventListener("resize", updateSize);
	}, [open]);

	// Зураг ачаалах ба анхны байршил тооцоолох
	useEffect(() => {
		if (!imageSrc || !open) return;
		setImgLoaded(false);
		const img = new window.Image();
		img.onload = () => {
			imgRef.current = img;
			// Зургийг canvas-т бүтэн багтаах scale
			const scaleX = canvasSize.w / img.naturalWidth;
			const scaleY = canvasSize.h / img.naturalHeight;
			const fitScale = Math.max(scaleX, scaleY); // cover
			setScale(fitScale);
			// Төв дээр байрлуулах
			const scaledW = img.naturalWidth * fitScale;
			const scaledH = img.naturalHeight * fitScale;
			setOffset({
				x: (canvasSize.w - scaledW) / 2,
				y: (canvasSize.h - scaledH) / 2,
			});
			setImgLoaded(true);
		};
		img.src = imageSrc;
	}, [imageSrc, open, canvasSize.w, canvasSize.h]);

	// Canvas дээр зурах
	useEffect(() => {
		const canvas = canvasRef.current;
		const img = imgRef.current;
		if (!canvas || !img || !imgLoaded) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Зураг зурах
		const scaledW = img.naturalWidth * scale;
		const scaledH = img.naturalHeight * scale;
		ctx.drawImage(img, offset.x, offset.y, scaledW, scaledH);

		// Харанхуй overlay (crop хүрээнээс гадна)
		ctx.fillStyle = "rgba(0,0,0,0.55)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Crop хүрээг тодруулах (source-over ашиглан зургийг дахин зурах)
		ctx.save();
		ctx.beginPath();
		ctx.rect(0, 0, canvas.width, canvas.height);
		ctx.clip();
		ctx.drawImage(img, offset.x, offset.y, scaledW, scaledH);
		ctx.restore();

		// Crop хүрээний зах
		ctx.strokeStyle = "rgba(255,255,255,0.9)";
		ctx.lineWidth = 2;
		ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

		// Rule of thirds шугам
		ctx.strokeStyle = "rgba(255,255,255,0.25)";
		ctx.lineWidth = 1;
		for (let i = 1; i < 3; i++) {
			ctx.beginPath();
			ctx.moveTo((canvas.width / 3) * i, 0);
			ctx.lineTo((canvas.width / 3) * i, canvas.height);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, (canvas.height / 3) * i);
			ctx.lineTo(canvas.width, (canvas.height / 3) * i);
			ctx.stroke();
		}

		// Булангийн зах тодруулах
		const cornerLen = 20;
		ctx.strokeStyle = "rgba(255,255,255,1)";
		ctx.lineWidth = 3;
		const corners = [
			[1, 1, 1, 0, 0, 1],
			[canvas.width - 1, 1, -1, 0, 0, 1],
			[1, canvas.height - 1, 1, 0, 0, -1],
			[canvas.width - 1, canvas.height - 1, -1, 0, 0, -1],
		];
		for (const [cx, cy, dx, , , dy] of corners) {
			ctx.beginPath();
			ctx.moveTo(cx + dx * cornerLen, cy);
			ctx.lineTo(cx, cy);
			ctx.lineTo(cx, cy + dy * cornerLen);
			ctx.stroke();
		}
	}, [scale, offset, imgLoaded]);

	// Drag handlers
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			setIsDragging(true);
			setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
		},
		[offset],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!isDragging || !imgRef.current) return;
			const img = imgRef.current;
			const scaledW = img.naturalWidth * scale;
			const scaledH = img.naturalHeight * scale;
			let newX = e.clientX - dragStart.x;
			let newY = e.clientY - dragStart.y;
			// Canvas-аас гараахгүйгээр хязгаарлах
			newX = Math.min(0, Math.max(canvasSize.w - scaledW, newX));
			newY = Math.min(0, Math.max(canvasSize.h - scaledH, newY));
			setOffset({ x: newX, y: newY });
		},
		[isDragging, dragStart, scale, canvasSize],
	);

	const handleMouseUp = useCallback(() => setIsDragging(false), []);

	// Touch handlers
	const touchStartRef = useRef<{ x: number; y: number } | null>(null);
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			const t = e.touches[0];
			touchStartRef.current = {
				x: t.clientX - offset.x,
				y: t.clientY - offset.y,
			};
		},
		[offset],
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!touchStartRef.current || !imgRef.current) return;
			e.preventDefault();
			const t = e.touches[0];
			const img = imgRef.current;
			const scaledW = img.naturalWidth * scale;
			const scaledH = img.naturalHeight * scale;
			let newX = t.clientX - touchStartRef.current.x;
			let newY = t.clientY - touchStartRef.current.y;
			newX = Math.min(0, Math.max(canvasSize.w - scaledW, newX));
			newY = Math.min(0, Math.max(canvasSize.h - scaledH, newY));
			setOffset({ x: newX, y: newY });
		},
		[scale, canvasSize],
	);

	// Zoom
	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			e.preventDefault();
			if (!imgRef.current) return;
			const img = imgRef.current;
			const delta = e.deltaY > 0 ? -0.1 : 0.1;
			const minScale = Math.max(
				canvasSize.w / img.naturalWidth,
				canvasSize.h / img.naturalHeight,
			);
			const newScale = Math.max(minScale, Math.min(scale + delta, 4));

			// Zoom anchor: canvas center
			const anchorX = canvasSize.w / 2;
			const anchorY = canvasSize.h / 2;
			const ratio = newScale / scale;
			let newX = anchorX - ratio * (anchorX - offset.x);
			let newY = anchorY - ratio * (anchorY - offset.y);
			const scaledW = img.naturalWidth * newScale;
			const scaledH = img.naturalHeight * newScale;
			newX = Math.min(0, Math.max(canvasSize.w - scaledW, newX));
			newY = Math.min(0, Math.max(canvasSize.h - scaledH, newY));

			setScale(newScale);
			setOffset({ x: newX, y: newY });
		},
		[scale, offset, canvasSize],
	);

	const zoomIn = () => {
		if (!imgRef.current) return;
		const newScale = Math.min(scale + 0.15, 4);
		const img = imgRef.current;
		const scaledW = img.naturalWidth * newScale;
		const scaledH = img.naturalHeight * newScale;
		const ratio = newScale / scale;
		let newX = canvasSize.w / 2 - ratio * (canvasSize.w / 2 - offset.x);
		let newY = canvasSize.h / 2 - ratio * (canvasSize.h / 2 - offset.y);
		newX = Math.min(0, Math.max(canvasSize.w - scaledW, newX));
		newY = Math.min(0, Math.max(canvasSize.h - scaledH, newY));
		setScale(newScale);
		setOffset({ x: newX, y: newY });
	};

	const zoomOut = () => {
		if (!imgRef.current) return;
		const img = imgRef.current;
		const minScale = Math.max(
			canvasSize.w / img.naturalWidth,
			canvasSize.h / img.naturalHeight,
		);
		const newScale = Math.max(minScale, scale - 0.15);
		const scaledW = img.naturalWidth * newScale;
		const scaledH = img.naturalHeight * newScale;
		const ratio = newScale / scale;
		let newX = canvasSize.w / 2 - ratio * (canvasSize.w / 2 - offset.x);
		let newY = canvasSize.h / 2 - ratio * (canvasSize.h / 2 - offset.y);
		newX = Math.min(0, Math.max(canvasSize.w - scaledW, newX));
		newY = Math.min(0, Math.max(canvasSize.h - scaledH, newY));
		setScale(newScale);
		setOffset({ x: newX, y: newY });
	};

	const resetPosition = () => {
		if (!imgRef.current) return;
		const img = imgRef.current;
		const fitScale = Math.max(
			canvasSize.w / img.naturalWidth,
			canvasSize.h / img.naturalHeight,
		);
		const scaledW = img.naturalWidth * fitScale;
		const scaledH = img.naturalHeight * fitScale;
		setScale(fitScale);
		setOffset({
			x: (canvasSize.w - scaledW) / 2,
			y: (canvasSize.h - scaledH) / 2,
		});
	};

	// Crop хийж blob үүсгэх
	const handleConfirm = useCallback(() => {
		if (!imgRef.current) return;
		const img = imgRef.current;
		const outputCanvas = document.createElement("canvas");
		// Гаралтын хэмжээ: 300x400px (3:4)
		outputCanvas.width = 300;
		outputCanvas.height = 400;
		const ctx = outputCanvas.getContext("2d");
		if (!ctx) return;

		// Canvas-аас зурагт хувиргах
		const scaleToOriginal = img.naturalWidth / (img.naturalWidth * scale);
		const srcX = -offset.x * scaleToOriginal;
		const srcY = -offset.y * scaleToOriginal;
		const srcW = canvasSize.w * scaleToOriginal;
		const srcH = canvasSize.h * scaleToOriginal;

		ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 300, 400);

		outputCanvas.toBlob(
			(blob) => {
				if (blob) onConfirm(blob);
			},
			"image/webp",
			0.92,
		);
	}, [scale, offset, canvasSize, onConfirm]);

	if (!imageSrc) return null;

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
			<DialogContent className="sm:max-w-md rounded-3xl border-2 p-0 overflow-hidden gap-0">
				<DialogHeader className="px-5 pt-5 pb-4">
					<div className="flex items-center gap-3 text-left">
						<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pop-violet-soft text-pop-violet-ink shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-violet)_30%,transparent)]">
							<Crop className="size-5" strokeWidth={2.5} />
						</span>
						<div className="min-w-0">
							<DialogTitle className="text-base font-black">
								Зургийг тааруулах{" "}
								<span className="ml-1 inline-flex items-center rounded-full bg-pop-sky-soft px-2 py-0.5 align-middle text-[11px] font-extrabold text-pop-sky-ink">(3×4)</span>
							</DialogTitle>
							<p className="mt-0.5 text-xs font-semibold text-muted-foreground">
								Зургийг чирж байрлуулах, scroll / товчлуур ашиглан томруулна уу
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="px-5">
					<div
						ref={containerRef}
						className="relative mx-auto overflow-hidden rounded-2xl border-2 border-border bg-muted shadow-[0_4px_0_0_var(--border)] select-none"
						style={{ width: canvasSize.w, height: canvasSize.h }}
					>
						<canvas
							ref={canvasRef}
							width={canvasSize.w}
							height={canvasSize.h}
							className={`block ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
							onMouseDown={handleMouseDown}
							onMouseMove={handleMouseMove}
							onMouseUp={handleMouseUp}
							onMouseLeave={handleMouseUp}
							onWheel={handleWheel}
							onTouchStart={handleTouchStart}
							onTouchMove={handleTouchMove}
							onTouchEnd={() => {
								touchStartRef.current = null;
							}}
						/>
						{!imgLoaded && (
							<div className="absolute inset-0 flex items-center justify-center bg-muted">
								<svg
									className="animate-spin w-8 h-8 text-primary"
									viewBox="0 0 24 24"
									fill="none"
								>
									<title>loading</title>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
									/>
								</svg>
							</div>
						)}
					</div>
				</div>

				{/* Zoom controls */}
				<div className="mx-5 mt-4 flex items-center justify-center gap-2 rounded-2xl bg-muted p-2">
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={zoomOut}
						className="size-9"
					>
						<ZoomOut className="size-4" strokeWidth={2.5} />
					</Button>
					<div className="flex-1 relative h-2.5 bg-card border-2 border-border rounded-full overflow-hidden max-w-[160px]">
						<div
							className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
							style={{
								width: `${Math.min(100, ((scale - 0.1) / 3.9) * 100)}%`,
							}}
						/>
					</div>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={zoomIn}
						className="size-9"
					>
						<ZoomIn className="size-4" strokeWidth={2.5} />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={resetPosition}
						className="size-9 text-muted-foreground hover:text-primary"
					>
						<RotateCcw className="size-4" strokeWidth={2.5} />
					</Button>
				</div>

				{/* Actions */}
				<div className="flex gap-3 px-5 pt-4 pb-5">
					<Button
						type="button"
						variant="outline"
						className="flex-1"
						onClick={onCancel}
					>
						<X className="size-4" strokeWidth={2.5} /> Цуцлах
					</Button>
					<Button
						type="button"
						className="flex-1"
						onClick={handleConfirm}
						disabled={!imgLoaded}
					>
						<Check className="size-4" strokeWidth={2.75} /> Хадгалах
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
