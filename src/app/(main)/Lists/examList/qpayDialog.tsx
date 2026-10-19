import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	CheckCircle2,
	Loader2,
	QrCode,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { QPayInvoiceResponse } from "@/types/Qpay/qpayinvoice";

interface QPayDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	qpayData: QPayInvoiceResponse | null;
	userId?: string | number | null;
	onPaymentSuccess?: () => void;
}

export default function QPayDialog({
	open,
	onOpenChange,
	qpayData,
	userId,
	onPaymentSuccess,
}: QPayDialogProps) {
	const [isChecking, setIsChecking] = useState(false);
	const [paymentStatus, setPaymentStatus] = useState<
		"pending" | "success" | "failed"
	>("pending");
	const [showNotPaidMessage, setShowNotPaidMessage] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Dialog хаагдахад төлөв reset хийх
	useEffect(() => {
		if (!open) {
			setPaymentStatus("pending");
			setShowNotPaidMessage(false);
			setError(null);
			setIsChecking(false);
		}
	}, [open]);

	const checkPaymentStatus = async () => {
		if (!qpayData?.invoice_id || !userId) {
			setError("Invoice ID эсвэл User ID байхгүй байна");
			console.error("Missing invoice_id or userId");
			return;
		}

		try {
			setIsChecking(true);
			setShowNotPaidMessage(false);
			setError(null);

			const response = await axios.post("/api/qpay/check", {
				userid: userId.toString(),
				invoice_id: qpayData.invoice_id,
			});

			console.log("Payment Check Response:", response.data);

			if (response.data?.RetResponse?.ResponseType === true) {
				setPaymentStatus("success");

				// Амжилттай төлбөрийн дараа callback дуудах
				if (onPaymentSuccess) {
					setTimeout(() => {
						onPaymentSuccess();
						onOpenChange(false);
					}, 2000);
				}
			} else {
				// Төлбөр төлөгдөөгүй
				setShowNotPaidMessage(true);
				setTimeout(() => {
					setShowNotPaidMessage(false);
				}, 5000);
			}
		} catch (error) {
			console.error("Payment check error:", error);
			setError("Төлбөр шалгахад алдаа гарлаа. Дахин оролдоно уу.");
			setPaymentStatus("failed");

			setTimeout(() => {
				setError(null);
				setPaymentStatus("pending");
			}, 5000);
		} finally {
			setIsChecking(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border-2">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3 text-2xl font-black">
						<span className="flex size-11 items-center justify-center rounded-2xl bg-pop-sky-soft text-pop-sky-ink shadow-[0_3px_0_0_color-mix(in_oklch,var(--pop-sky)_35%,transparent)]">
							<QrCode className="size-6" strokeWidth={2.5} />
						</span>
						QPay Төлбөр
						{paymentStatus === "success" && (
							<CheckCircle2 className="ml-1 size-6 text-success" />
						)}
					</DialogTitle>
					<DialogDescription className="font-semibold">
						{paymentStatus === "success"
							? "Төлбөр амжилттай төлөгдлөө!"
							: "Доорх QR кодыг банкны аппликейшнээр уншуулан төлбөр төлнө үү"}
					</DialogDescription>
				</DialogHeader>

				{qpayData ? (
					<div className="space-y-5 py-2">
						{/* Төлбөр амжилттай төлөгдсөн мэдэгдэл */}
						<AnimatePresence>
							{paymentStatus === "success" && (
								<motion.div
									initial={{ scale: 0.9, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.9, opacity: 0 }}
									className="rounded-2xl border-2 border-success/40 bg-success/10 p-5"
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
												Таны төлбөр амжилттай төлөгдлөө. Та шалгалт өгөх
												боломжтой боллоо.
											</p>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>

						{/* Төлбөр төлөгдөөгүй мэдэгдэл */}
						<AnimatePresence>
							{showNotPaidMessage && paymentStatus !== "success" && (
								<motion.div
									initial={{ scale: 0.9, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.9, opacity: 0 }}
									className="rounded-2xl border-2 border-pop-sun/50 bg-pop-sun-soft p-5"
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
								</motion.div>
							)}
						</AnimatePresence>

						{/* Алдааны мэдэгдэл */}
						<AnimatePresence>
							{error && (
								<motion.div
									initial={{ scale: 0.9, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.9, opacity: 0 }}
									className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-5"
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
								</motion.div>
							)}
						</AnimatePresence>

						{/* QR Code Section */}
						<div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-pop-sky/50 bg-pop-sky-soft p-6">
							<p className="mb-4 text-xs font-extrabold uppercase tracking-wide text-pop-sky-ink">
								QR код уншуулах
							</p>
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
										<p className="text-sm font-bold text-muted-foreground">QR код байхгүй</p>
									</div>
								)}
							</div>

							{/* Short URL */}
						</div>

						{/* Payment Check Button */}
						<div>
							{userId && (
								<Button
									onClick={checkPaymentStatus}
									disabled={isChecking || paymentStatus === "success"}
									variant={paymentStatus === "success" ? "success" : "default"}
									size="lg"
									className="w-full"
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

						{/* Bank Apps Grid - uncomment if needed */}
						{/* {qpayData.urls && qpayData.urls.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Банкны аппликейшнууд
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {qpayData.urls.map((bank, index) => (
                    <motion.a
                      key={`${bank.name}-${index}`}
                      href={bank.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card p-4 shadow-[0_3px_0_0_var(--border)] transition-colors hover:border-primary"
                    >
                      <Image
                        src={bank.logo}
                        alt={bank.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-contain rounded-lg"
                      />
                      <span className="text-xs font-medium text-center line-clamp-2">
                        {bank.description}
                      </span>
                    </motion.a>
                  ))}
                </div>
              </div>
            )} */}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12">
						<Loader2 className="mb-4 size-12 animate-spin text-pop-sky" />
						<p className="font-bold text-muted-foreground">Уншиж байна...</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
