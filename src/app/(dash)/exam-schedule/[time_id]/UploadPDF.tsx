import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress"; // shadcn progress суулгасан байх
import type { StudentSeat } from "@/types/dashboard/exam.types";
import { uploadWithProgress } from "@/utils/upload";

interface UploadPDFDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUploadSuccess: (file: UploadFileResult) => void;
	selectRow: StudentSeat | null;
}

export interface UploadFileResult {
	fileStatus: number;
	message: string;
	file: {
		name: string;
		savedName: string;
		url: string;
	};
}

export function UploadPDFDialog({
	open,
	onOpenChange,
	onUploadSuccess,
	selectRow,
}: UploadPDFDialogProps) {
	const [file, setFile] = useState<File | null>(null);
	const [progress, setProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { "application/pdf": [".pdf"] },
		maxFiles: 1,
	});

	const handleUpload = async () => {
		if (!file || !selectRow) return;

		setIsUploading(true);
		const formData = new FormData();
		formData.append("file", file);

		try {
			const result = await uploadWithProgress(formData, (percent) => {
				setProgress(percent);
			});
			// Серверээс ирсэн өгөгдлийг эцэг рүү дамжуулна
			onUploadSuccess(result);
			setFile(null);
			setProgress(0);
			onOpenChange(false);
		} catch (error) {
			console.error("Upload failed", error);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3">
						<span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-pop-coral-soft text-pop-coral-ink">
							<FileText className="size-5" strokeWidth={2.5} />
						</span>
						{selectRow?.last_name[0]}.{selectRow?.first_name}
					</DialogTitle>
					<DialogDescription className="font-semibold">
						{selectRow?.register_number} • {selectRow?.seat_number}-р суудал
					</DialogDescription>
				</DialogHeader>

				{!file ? (
					<div
						{...getRootProps()}
						className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 py-8 text-center transition-colors ${isDragActive ? "border-primary bg-primary/10" : "border-border bg-muted/40 hover:border-primary hover:bg-primary/5"}`}
					>
						<input {...getInputProps()} />
						<span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-pop-sky-soft text-pop-sky-ink">
							<UploadCloud className="size-7" strokeWidth={2.5} />
						</span>
						<p className="text-sm font-bold text-muted-foreground">
							PDF файлаа энд чирч оруулна уу
						</p>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex items-center justify-between rounded-2xl border-2 border-border bg-muted/50 p-3">
							<div className="flex items-center gap-2 overflow-hidden">
								<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pop-coral-soft text-pop-coral-ink">
									<FileText className="size-5" strokeWidth={2.5} />
								</span>
								<span className="truncate text-sm font-bold">{file.name}</span>
							</div>
							{!isUploading && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setFile(null)}
								>
									<X className="size-4" />
								</Button>
							)}
						</div>

						{isUploading && (
							<div className="space-y-2">
								<Progress value={progress} />
								<p className="text-center text-xs font-bold text-muted-foreground">
									{progress}% байршуулж байна...
								</p>
							</div>
						)}
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isUploading}
					>
						Цуцлах
					</Button>
					<Button onClick={handleUpload} disabled={!file || isUploading}>
						{isUploading ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Илгээж байна...
							</>
						) : (
							"Илгээх"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
