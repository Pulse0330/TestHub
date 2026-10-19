"use client";

import {
	AlertTriangle,
	Ban,
	Camera,
	CheckCircle2,
	Clock,
	Copy,
	Eye,
	FileText,
	Globe,
	Keyboard,
	type LucideIcon,
	MessageSquare,
	Monitor,
	Mouse,
	Settings,
	Shield,
	ShieldAlert,
	Smartphone,
	Users,
	Volume2,
	Wifi,
	X,
	Zap,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

// ============================================
// TYPES
// ============================================

interface ExamRulesDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isMobile?: boolean;
}

interface Rule {
	icon: LucideIcon;
	title: string;
	severity: "high" | "medium" | "low";
	description: string;
}

// ============================================
// CONSTANTS
// ============================================

const DESKTOP_MONITORING_RULES: Rule[] = [
	{
		icon: Monitor,
		title: "Цонх солих / Tab солих",
		severity: "high",
		description:
			"Өөр цонх эсвэл tab руу шилжихийг хориглоно. Таны сэжигтэй үйлдэл бүртгэгдэнэ.",
	},
	{
		icon: Shield,
		title: "Fullscreen горимоос гарах",
		severity: "high",
		description: "Шалгалтын үед fullscreen горимоос гарахыг хориглоно",
	},
	{
		icon: Mouse,
		title: "Хулгана цонхноос гаргах",
		severity: "medium",
		description: "Хулганы заагчийг 3+ секунд цонхноос гаргаж болохгүй",
	},
	{
		icon: Keyboard,
		title: "Shortcut товчлуурууд",
		severity: "high",
		description:
			"Alt+Tab, Cmd+Tab, Ctrl+W зэрэг товчлууруудыг идэвхгүй болгосон",
	},
];

const MOBILE_MONITORING_RULES: Rule[] = [
	{
		icon: Smartphone,
		title: "Өөр апп руу шилжих",
		severity: "high",
		description: "Шалгалтын үед өөр application руу шилжихийг хориглоно",
	},
	{
		icon: Smartphone,
		title: "Утасны orientation өөрчлөх",
		severity: "medium",
		description: "Дэлгэцийн чиглэлийг өөрчлөх үйлдлийг хязгаарласан",
	},
	{
		icon: MessageSquare,
		title: "Notification-ууд",
		severity: "medium",
		description: "Шалгалтын үед notification харуулахгүй байхыг зөвлөж байна",
	},
	{
		icon: Volume2,
		title: "Утас ирэх",
		severity: "medium",
		description: "Утасны дуудлага ирвэл шалгалт түр зогсоно",
	},
];

const SYSTEM_RESTRICTIONS: Rule[] = [
	{
		icon: Copy,
		title: "Copy / Paste / Cut үйлдлүүд",
		severity: "high",
		description: "Текст хуулах, буулгах, таслах үйлдлүүдийг хориглоно",
	},
	{
		icon: Ban,
		title: "DevTools / Inspect Element",
		severity: "high",
		description:
			"Developer Tools нээх, баруун товч дарах, F12 дарахыг хориглоно",
	},
	{
		icon: Camera,
		title: "Screenshot / Screen Recording",
		severity: "high",
		description: "Дэлгэцийн зураг авах, бичлэг хийх оролдлогыг илрүүлнэ",
	},
	{
		icon: FileText,
		title: "Хэвлэх (Print)",
		severity: "high",
		description: "Ctrl+P, Cmd+P ашиглан хэвлэх оролдлогыг хориглоно",
	},
	{
		icon: Settings,
		title: "Browser Settings",
		severity: "medium",
		description: "Browser тохиргоо нээх, extension ашиглахыг хориглоно",
	},
	{
		icon: Globe,
		title: "Өөр веб хуудас нээх",
		severity: "high",
		description: "Шинэ tab, цонх нээх, link дарахыг хориглоно",
	},
];

const BEHAVIORAL_RULES: Rule[] = [
	{
		icon: Eye,
		title: "Камерын хяналт (опцион)",
		severity: "medium",
		description: "Зарим шалгалтад камер нээлттэй байх шаардлагатай",
	},
	{
		icon: Users,
		title: "Бусдын тусламж авах",
		severity: "high",
		description: "Өөр хүнтэй ярих, туслуулах, chat хийхийг хатуу хориглоно",
	},
	{
		icon: Wifi,
		title: "Интернэт холболт",
		severity: "high",
		description:
			"Холболт тасарвал шалгалт түр зогсоно. VPN ашиглахыг хориглоно",
	},
	{
		icon: Clock,
		title: "Цаг хугацааны хязгаар",
		severity: "medium",
		description: "Шалгалтын хугацаа дуусахад автоматаар илгээгдэнэ",
	},
	{
		icon: ShieldAlert,
		title: "Хуурамч мэдээлэл өгөх",
		severity: "high",
		description: "Бусдын нэрээр нэвтрэх, proxy ашиглахыг хориглоно",
	},
	{
		icon: Zap,
		title: "Цахилгаан тасрах",
		severity: "low",
		description: "Тасрах үед backup хийгддэг боловч дахин нэвтрэх шаардлагатай",
	},
];

const EXAM_GUIDELINES: Rule[] = [
	{
		icon: CheckCircle2,
		title: "Зөвхөн шалгалтын цонх ашиглах",
		severity: "low",
		description: "Шалгалтын үед зөвхөн шалгалтын interface дээр ажиллана уу",
	},
	{
		icon: Clock,
		title: "Цагийг зөв удирдах",
		severity: "low",
		description: "Үлдсэн хугацааг хянаж, асуултуудыг төлөвлөн хариулна уу",
	},
];

// ============================================
// SECTION HEADER
// ============================================

interface SectionHeaderProps {
	icon: LucideIcon;
	title: string;
}

const SectionHeader = React.memo<SectionHeaderProps>(function SectionHeader({
	icon: Icon,
	title,
}) {
	return (
		<div className="flex items-center gap-2 pt-3 pb-1.5">
			<span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
				<Icon className="size-3.5" strokeWidth={2.5} />
			</span>
			<span className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground sm:text-xs">
				{title}
			</span>
			<div className="ml-1 h-0.5 flex-1 rounded-full bg-border" />
		</div>
	);
});

// ============================================
// WARNING DIALOG - shown when checkbox not checked
// ============================================

interface AckWarningDialogProps {
	open: boolean;
	onClose: () => void;
}

function AckWarningDialog({ open, onClose }: AckWarningDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="w-[85vw] max-w-sm overflow-hidden p-0">
				{/* Red accent top bar */}

				<div className="px-5 pt-6 pb-5">
					{/* Icon + Title */}
					<div className="flex flex-col items-center text-center gap-3 mb-4">
						<div className="flex size-16 items-center justify-center rounded-3xl bg-destructive/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--destructive)_30%,transparent)]">
							<AlertTriangle
								className="size-8 text-destructive"
								strokeWidth={2.5}
							/>
						</div>
						<div>
							<DialogTitle className="mb-1 text-lg font-black text-foreground">
								Дүрмийг зөвшөөрөөгүй байна
							</DialogTitle>
							<DialogDescription className="text-xs font-semibold leading-relaxed">
								Шалгалт эхлүүлэхийн өмнө доорх нөхцлийг зайлшгүй зөвшөөрнө үү
							</DialogDescription>
						</div>
					</div>

					{/* Info box */}
					<div className="mb-4 rounded-2xl bg-muted p-3">
						<div className="flex items-start gap-2">
							<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-destructive" />
							<p className="text-[11px] leading-snug font-semibold text-foreground sm:text-xs">
								<span className="font-bold">"Шалгалтын дүрэм журам"</span>-ийн
								checkbox-ийг чагтална уу. Дүрмийг уншиж, зөвшөөрсний дараа
								шалгалтыг эхлүүлэх боломжтой.
							</p>
						</div>
					</div>

					{/* Action button */}
					<Button
						onClick={onClose}
						className="w-full"
					>
						Ойлголоо, буцах
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ExamRulesDialog({
	open,
	onOpenChange,
	onConfirm,
	isMobile = false,
}: ExamRulesDialogProps) {
	const [showMessage, setShowMessage] = useState(false);
	const [acknowledged, setAcknowledged] = useState(false);
	const [showAckWarning, setShowAckWarning] = useState(false);

	const handleNext = useCallback(() => {
		if (!acknowledged) {
			setShowAckWarning(true);
			return;
		}
		setShowMessage(true);
		setTimeout(() => {
			onConfirm();
			onOpenChange(false);
			setShowMessage(false);
			setAcknowledged(false);
		}, 1800);
	}, [acknowledged, onConfirm, onOpenChange]);

	const handleCancel = useCallback(() => {
		onOpenChange(false);
		setTimeout(() => {
			setAcknowledged(false);
		}, 300);
	}, [onOpenChange]);

	const monitoringRules = isMobile
		? MOBILE_MONITORING_RULES
		: DESKTOP_MONITORING_RULES;

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="flex h-[85vh] w-[90vw] max-w-3xl flex-col gap-0 overflow-hidden p-0">
					{/* Header */}
					<div className="flex-none border-b-2 border-border bg-page-gradient px-4 pt-5 pb-4 sm:px-6">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-3 text-xl font-black text-foreground sm:text-2xl">
								<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pop-violet-soft text-2xl shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_30%,transparent)]">
									🍀
								</span>
								Амжилт хүсье!
							</DialogTitle>
							<DialogDescription className="mt-1 text-xs font-semibold sm:text-sm">
								Цахимаар шалгалт өгөх дүрмийг анхааралтай уншиж эхлүүлнэ үү .
							</DialogDescription>
						</DialogHeader>

						<Alert className="mt-3 rounded-2xl border-2 border-destructive/30 bg-destructive/10 px-3 py-2">
							<AlertTriangle className="size-4 text-destructive" />
							<AlertDescription className="text-[11px] font-bold text-destructive sm:text-xs">
								⚠️ АНХААРУУЛГА: Хуулах аливаа оролдлого бүрийг системд бүртгэж
								байгааг анхаарна уу !!
							</AlertDescription>
						</Alert>
					</div>

					{/* Content */}
					<div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto bg-card px-4 py-4 sm:px-6">
						<div>
							<div className="mb-2">
								<h3 className="flex items-center gap-2 text-base font-extrabold text-foreground sm:text-lg">
									<span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
										<Shield className="size-4" strokeWidth={2.5} />
									</span>
									Шалгалтын дүрэм журам
								</h3>
							</div>

							<div className="space-y-1">
								<SectionHeader
									icon={Monitor}
									title={isMobile ? "Утасны хяналт" : "Дэлгэцийн хяналт"}
								/>
								<div className="mb-1 grid gap-2 sm:grid-cols-2">
									{monitoringRules.map((rule) => (
										<RuleItem key={rule.title} {...rule} />
									))}
								</div>

								<SectionHeader icon={Ban} title="Системийн хязгаарлалт" />
								<div className="mb-1 grid gap-2 sm:grid-cols-2">
									{SYSTEM_RESTRICTIONS.map((rule) => (
										<RuleItem key={rule.title} {...rule} />
									))}
								</div>

								<SectionHeader
									icon={Users}
									title="Хандлага болон аюулгүй байдал"
								/>
								<div className="mb-1 grid gap-2 sm:grid-cols-2">
									{BEHAVIORAL_RULES.map((rule) => (
										<RuleItem key={rule.title} {...rule} />
									))}
								</div>

								<SectionHeader icon={CheckCircle2} title="Шалгалтын зөвлөмж" />
								<div className="grid gap-2 sm:grid-cols-2">
									{EXAM_GUIDELINES.map((rule) => (
										<RuleItem key={rule.title} {...rule} />
									))}
								</div>
							</div>
						</div>

						{/* Acknowledgment */}
						<div
							className={`mt-4 rounded-2xl border-2 p-3 transition-colors duration-200 sm:p-4 ${
								acknowledged
									? "border-success bg-success/10 shadow-[0_4px_0_0_color-mix(in_oklch,var(--success)_40%,transparent)]"
									: "border-border bg-muted/60"
							}`}
						>
							<div className="flex flex-row items-start justify-between gap-3">
								<Checkbox
									id="ack-all"
									checked={acknowledged}
									onCheckedChange={() => setAcknowledged((v) => !v)}
									className="mt-0.5 size-5 rounded-md border-2 data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-white"
								/>
								<label
									htmlFor="ack-all"
									className="flex-1 cursor-pointer text-xs leading-snug font-bold text-foreground sm:text-sm"
								>
									Би Шалгалтын дүрэмтэй танилцсан бөгөөд энэ дүрмийг зөрчвөл
									шалгалтнаас гаргахыг зөвшөөрч байна.
								</label>
							</div>
						</div>
					</div>

					{/* Footer */}
					<DialogFooter className="flex flex-none flex-row items-center justify-between gap-2 border-t-2 border-border bg-muted/50 px-4 py-3 sm:justify-between sm:px-6">
						<Button
							variant="outline"
							onClick={handleCancel}
							disabled={showMessage}
							className="text-xs sm:text-sm"
						>
							<X className="size-4" />
							Цуцлах
						</Button>

						<Button
							onClick={handleNext}
							disabled={showMessage}
							className="text-xs disabled:cursor-not-allowed sm:text-sm"
						>
							{showMessage ? (
								"Бэлдэж байна..."
							) : (
								<>
									<CheckCircle2 className="size-4" />
									Шалгалт эхлүүлэх
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Warning dialog for unchecked acknowledgment */}
			<AckWarningDialog
				open={showAckWarning}
				onClose={() => setShowAckWarning(false)}
			/>
		</>
	);
}

// ============================================
// RULE ITEM
// ============================================

interface RuleItemProps {
	icon: LucideIcon;
	title: string;
	severity: "high" | "medium" | "low";
	description: string;
}

const RuleItem = React.memo<RuleItemProps>(function RuleItem({
	icon: Icon,
	title,
	description,
	severity,
}) {
	const severityConfig = useMemo(() => {
		switch (severity) {
			case "high":
				return {
					bg: "border-border bg-card",
					icon: "bg-pop-coral-soft text-pop-coral-ink",
					badge: "bg-destructive text-white",
					label: "Ноцтой",
				};
			case "medium":
				return {
					bg: "border-border bg-card",
					icon: "bg-pop-sun-soft text-pop-sun-ink",
					badge: "bg-warning text-foreground",
					label: "Дунд",
				};
			case "low":
				return {
					bg: "border-border bg-card",
					icon: "bg-pop-mint-soft text-pop-mint-ink",
					badge: "bg-success text-white",
					label: "Зөвлөмж",
				};
		}
	}, [severity]);

	return (
		<div
			className={`h-full rounded-2xl border-2 p-3 transition-all duration-200 ${severityConfig.bg}`}
		>
			<div className="flex items-start gap-3">
				<div
					className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${severityConfig.icon}`}
				>
					<Icon className="size-4" strokeWidth={2.5} />
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h4 className="text-xs leading-tight font-extrabold text-foreground sm:text-sm">
							{title}
						</h4>
						<span
							className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold`}
						></span>
					</div>
					<p className="mt-1 text-[11px] leading-snug font-semibold text-muted-foreground sm:text-xs">
						{description}
					</p>
				</div>
			</div>
		</div>
	);
});
