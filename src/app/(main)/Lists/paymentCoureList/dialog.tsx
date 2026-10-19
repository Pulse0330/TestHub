import axios from "axios";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, QrCode, XCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
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
	userId?: string | number;
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

	const checkPaymentStatus = async () => {
		if (!qpayData?.invoice_id || !userId) {
			console.log("Missing invoice_id or userId, skipping check");
			return;
		}

		try {
			setIsChecking(true);
			setShowNotPaidMessage(false);
			const response = await axios.post("/api/qpay/check", {
				userid: userId.toString(),
				invoice_id: qpayData.invoice_id,
			});

			console.log("Payment Check Response:", response.data);

			if (response.data.RetResponse.ResponseType === true) {
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
			setShowNotPaidMessage(true);
			setTimeout(() => {
				setShowNotPaidMessage(false);
			}, 5000);
		} finally {
			setIsChecking(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-2">
				<DialogHeader>
					<DialogTitle className="text-2xl font-black flex items-center gap-3">
						<span
							className="flex size-11 items-center justify-center rounded-2xl bg-pop-coral-soft text-pop-coral-ink"
							aria-hidden="true"
						>
							<QrCode className="size-6" strokeWidth={2.5} />
						</span>
						QPay Төлбөр
						{paymentStatus === "success" && (
							<CheckCircle2
								className="size-6 text-success ml-1 animate-pop-in"
								strokeWidth={2.75}
							/>
						)}
					</DialogTitle>
					<DialogDescription className="font-semibold">
						{paymentStatus === "success" ? "Төлбөр амжилттай төлөгдлөө!" : ""}
					</DialogDescription>
				</DialogHeader>

				{qpayData && (
					<div className="space-y-5 py-2">
						{/* Төлбөр амжилттай төлөгдсөн мэдэгдэл */}
						{paymentStatus === "success" && (
							<motion.div
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								className="p-5 bg-success/10 rounded-2xl border-2 border-success"
							>
								<div className="flex items-center gap-4">
									<div className="size-12 shrink-0 rounded-2xl bg-success flex items-center justify-center">
										<CheckCircle2
											className="size-7 text-primary-foreground"
											strokeWidth={2.75}
										/>
									</div>
									<div>
										<h3 className="text-lg font-black text-success">
											Төлбөр амжилттай!
										</h3>
										<p className="text-sm font-semibold text-foreground/80">
											Таны төлбөр амжилттай төлөгдлөө. Хичээлүүд таны бүртгэлд
											нэмэгдлээ.
										</p>
									</div>
								</div>
							</motion.div>
						)}

						{/* Төлбөр төлөгдөөгүй мэдэгдэл */}
						{showNotPaidMessage && paymentStatus !== "success" && (
							<motion.div
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.9, opacity: 0 }}
								className="p-3 bg-pop-sun-soft rounded-2xl border-2 border-warning"
							>
								<div className="flex items-center gap-3">
									<div className="size-8 shrink-0 rounded-xl bg-warning/30 text-pop-sun-ink flex items-center justify-center">
										<XCircle className="size-5" strokeWidth={2.5} />
									</div>
									<div>
										<h3 className="font-extrabold text-pop-sun-ink">
											Төлбөр төлөгдөөгүй байна
										</h3>
									</div>
								</div>
							</motion.div>
						)}

						<div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-pop-coral-soft rounded-3xl bg-dots">
							<p className="text-sm font-extrabold uppercase tracking-wide text-pop-coral-ink mb-4">
								QR код уншуулах
							</p>
							{/* QR код уншигдахын тулд цагаан дэвсгэр шаардлагатай */}
							<div className="bg-white p-4 rounded-2xl border-2 border-border shadow-[0_4px_0_0_var(--border)]">
								<Image
									src={`data:image/png;base64,${qpayData.qr_image}`}
									alt="QPay QR Code"
									width={256}
									height={256}
									className="size-56 sm:size-64"
									unoptimized
								/>
							</div>
						</div>
						<div className="pt-1">
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
											<Loader2 className="size-4 mr-1 animate-spin" />
											Шалгаж байна...
										</>
									) : paymentStatus === "success" ? (
										<>
											<CheckCircle2 className="size-4 mr-1" strokeWidth={2.75} />
											Төлбөр төлөгдсөн
										</>
									) : (
										"Төлбөр шалгах"
									)}
								</Button>
							)}
						</div>
						{/* 	{qpayData.urls && qpayData.urls.length > 0 && (
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
											className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary transition-colors bg-white dark:bg-slate-800 shadow-sm hover:shadow-md"
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
				)}
			</DialogContent>
		</Dialog>
	);
}
