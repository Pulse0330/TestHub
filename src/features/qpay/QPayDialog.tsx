"use client";

import axios from "axios";
import {
	AlertCircle,
	CheckCircle2,
	Loader2,
	QrCode,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { QPayInvoiceResponse } from "@/types/Qpay/qpayinvoice";

export interface QPayDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	qpayData: QPayInvoiceResponse | null;
	userId?: string | number | null;
	onPaymentSuccess?: () => void;
	/** Амжилттай төлсний дараах тайлбар */
	successMessage?: string;
	/** Төлбөр хүлээгдэж байх үеийн тайлбар */
	description?: string;
	accent?: "sky" | "coral";
}

type PaymentStatus = "pending" | "success" | "failed";

const SUCCESS_CLOSE_DELAY = 2000;
const MESSAGE_DURATION = 5000;

const ACCENT = {
	sky: {
		icon: "bg-pop-sky-soft text-pop-sky-ink shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-sky)_35%,transparent)]",
		panel: "border-2 border-dashed border-pop-sky/50 bg-pop-sky-soft",
		label: "text-pop-sky-ink",
		loader: "text-pop-sky",
	},
	coral: {
		icon: "bg-pop-coral-soft text-pop-coral-ink",
		panel: "bg-pop-coral-soft bg-dots",
		label: "text-pop-coral-ink",
		loader: "text-pop-coral",
	},
} as const;

const NOTICE_CLASS = "animate-in fade-in-0 zoom-in-95 duration-200";

/**
 * Шалгалт болон хичээлийн төлбөрт ашиглагдах нийтлэг QPay dialog.
 * - Бүх timer-ийг ref-д хадгалж, dialog хаагдах/unmount үед цэвэрлэнэ.
 * - Хаагдсаны дараа ирсэн хариуг (stale response) үл тооно.
 */
export default function QPayDialog({
	open,
	onOpenChange,
	qpayData,
	userId,
	onPaymentSuccess,
	successMessage = "Таны төлбөр амжилттай төлөгдлөө.",
	description = "Доорх QR кодыг банкны аппликейшнээр уншуулан төлбөр төлнө үү",
	accent = "sky",
}: QPayDialogProps) {
	const [isChecking, setIsChecking] = useState(false);
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
	const [showNotPaidMessage, setShowNotPaidMessage] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
	// Dialog нээгдэх бүрт шинэ session — хуучин хүсэлтийн хариуг хаяна
	const sessionRef = useRef(0);
	// Амжилттай төлсөн ч callback хараахан дуудагдаагүй эсэх
	const successPendingRef = useRef(false);
	const onPaymentSuccessRef = useRef(onPaymentSuccess);
	const onOpenChangeRef = useRef(onOpenChange);
	useEffect(() => {
		onPaymentSuccessRef.current = onPaymentSuccess;
		onOpenChangeRef.current = onOpenChange;
	});

	const clearTimers = useCallback(() => {
		for (const t of timersRef.current) clearTimeout(t);
		timersRef.current.clear();
	}, []);

	const schedule = useCallback((fn: () => void, ms: number) => {
		const t = setTimeout(() => {
			timersRef.current.delete(t);
			fn();
		}, ms);
		timersRef.current.add(t);
	}, []);

	const flushPendingSuccess = useCallback(() => {
		if (!successPendingRef.current) return;
		successPendingRef.current = false;
		onPaymentSuccessRef.current?.();
	}, []);

	// Dialog хаагдахад: timer цэвэрлэх, төлөв reset хийх
	useEffect(() => {
		if (open) return;
		sessionRef.current++;
		clearTimers();
		// Амжилттай төлөөд 2 секунд хүлээлгүй хаасан бол callback-ийг алгасахгүй
		flushPendingSuccess();
		setPaymentStatus("pending");
		setShowNotPaidMessage(false);
		setError(null);
		setIsChecking(false);
	}, [open, clearTimers, flushPendingSuccess]);

	// Unmount
	useEffect(
		() => () => {
			sessionRef.current++;
			clearTimers();
			flushPendingSuccess();
		},
		[clearTimers, flushPendingSuccess],
	);

	const checkPaymentStatus = async () => {
		if (!qpayData?.invoice_id || !userId) {
			setError("Invoice ID эсвэл User ID байхгүй байна");
			return;
		}

		const session = sessionRef.current;
		try {
			setIsChecking(true);
			setShowNotPaidMessage(false);
			setError(null);

			const response = await axios.post("/api/qpay/check", {
				userid: userId.toString(),
				invoice_id: qpayData.invoice_id,
			});
			if (session !== sessionRef.current) return;

			if (response.data?.RetResponse?.ResponseType === true) {
				setPaymentStatus("success");
				if (onPaymentSuccessRef.current) {
					successPendingRef.current = true;
					schedule(() => {
						flushPendingSuccess();
						onOpenChangeRef.current(false);
					}, SUCCESS_CLOSE_DELAY);
				}
			} else {
				setShowNotPaidMessage(true);
				schedule(() => setShowNotPaidMessage(false), MESSAGE_DURATION);
			}
		} catch {
			if (session !== sessionRef.current) return;
			setError("Төлбөр шалгахад алдаа гарлаа. Дахин оролдоно уу.");
			setPaymentStatus("failed");
			schedule(() => {
				setError(null);
				setPaymentStatus("pending");
			}, MESSAGE_DURATION);
		} finally {
			if (session === sessionRef.current) setIsChecking(false);
		}
	};

	const tone = ACCENT[accent];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border-2">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3 text-2xl font-black">
						<span
							className={cn(
								"flex size-11 items-center justify-center rounded-2xl",
								tone.icon,
							)}
							aria-hidden="true"
						>
							<QrCode className="size-6" strokeWidth={2.5} />
						</span>
						QPay Төлбөр
						{paymentStatus === "success" && (
							<CheckCircle2 className="ml-1 size-6 animate-pop-in text-success" />
						)}
					</DialogTitle>
					<DialogDescription className="font-semibold">
						{paymentStatus === "success"
							? "Төлбөр амжилттай төлөгдлөө!"
							: description}
					</DialogDescription>
				</DialogHeader>

				{qpayData ? (
					<div className="space-y-5 py-2">
						{paymentStatus === "success" && (
							<div
								className={cn(
									"rounded-2xl border-2 border-success/40 bg-success/10 p-5",
									NOTICE_CLASS,
								)}
							>
								<div className="flex items-center gap-4">
									<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-success">
										<CheckCircle2 className="size-7 text-white" />
									</div>
									<div>
										<h3 className="text-lg font-extrabold text-success">
											Төлбөр амжилттай!
										</h3>
										<p className="text-sm font-semibold text-foreground/80">
											{successMessage}
										</p>
									</div>
								</div>
							</div>
						)}

						{showNotPaidMessage && paymentStatus !== "success" && (
							<div
								className={cn(
									"rounded-2xl border-2 border-pop-sun/50 bg-pop-sun-soft p-5",
									NOTICE_CLASS,
								)}
							>
								<div className="flex items-center gap-4">
									<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning">
										<XCircle className="size-7 text-foreground" />
									</div>
									<div>
										<h3 className="text-lg font-extrabold text-pop-sun-ink">
											Төлбөр төлөгдөөгүй байна
										</h3>
										<p className="text-sm font-semibold text-foreground/80">
											QR кодоор төлбөр төлсний дараа "Төлбөр шалгах" товчийг
											дарна уу.
										</p>
									</div>
								</div>
							</div>
						)}

						{error && (
							<div
								className={cn(
									"rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-5",
									NOTICE_CLASS,
								)}
							>
								<div className="flex items-center gap-4">
									<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive">
										<AlertCircle className="size-7 text-white" />
									</div>
									<div>
										<h3 className="text-lg font-extrabold text-destructive">
											Алдаа гарлаа
										</h3>
										<p className="text-sm font-semibold text-foreground/80">
											{error}
										</p>
									</div>
								</div>
							</div>
						)}

						<div
							className={cn(
								"flex flex-col items-center justify-center rounded-3xl p-6",
								tone.panel,
							)}
						>
							<p
								className={cn(
									"mb-4 text-xs font-extrabold uppercase tracking-wide",
									tone.label,
								)}
							>
								QR код уншуулах
							</p>
							{/* QR код уншигдахын тулд цагаан дэвсгэр шаардлагатай */}
							<div className="rounded-2xl border-2 border-border bg-[oklch(1_0_0)] p-4 shadow-[0_4px_0_0_var(--border)]">
								{qpayData.qr_image ? (
									<Image
										src={`data:image/png;base64,${qpayData.qr_image}`}
										alt="QPay QR Code"
										width={256}
										height={256}
										className="size-56 sm:size-64"
										unoptimized
									/>
								) : (
									<div className="flex size-56 items-center justify-center rounded-xl bg-muted sm:size-64">
										<p className="text-sm font-bold text-muted-foreground">
											QR код байхгүй
										</p>
									</div>
								)}
							</div>
						</div>

						<div>
							{userId && (
								<Button
									onClick={checkPaymentStatus}
									disabled={isChecking || paymentStatus === "success"}
									variant={paymentStatus === "success" ? "success" : "default"}
									size="lg"
									className="w-full font-extrabold"
								>
									{isChecking ? (
										<>
											<Loader2 className="size-4 animate-spin" />
											Шалгаж байна...
										</>
									) : paymentStatus === "success" ? (
										<>
											<CheckCircle2 className="size-4" />
											Төлбөр төлөгдсөн
										</>
									) : (
										"Төлбөр шалгах"
									)}
								</Button>
							)}
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12">
						<Loader2 className={cn("mb-4 size-12 animate-spin", tone.loader)} />
						<p className="font-bold text-muted-foreground">Уншиж байна...</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
