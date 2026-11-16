import { useCallback, useEffect, useState } from "react";
import { uploadImage } from "@/utils/upload";

/** Профайл зургийг WebP болгон хөрвүүлж upload хийх, preview-г удирдах. */
export function useProfileImage() {
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>("");
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

	// Preview-ийн blob URL-ийг солигдох/unmount үед чөлөөлнө
	useEffect(() => {
		if (!imagePreview.startsWith("blob:")) return;
		return () => URL.revokeObjectURL(imagePreview);
	}, [imagePreview]);

	const convertToWebP = useCallback(
		async (
			file: File,
			quality = 0.85,
			maxWidth = 1920,
			maxHeight = 1080,
		): Promise<Blob> => {
			return new Promise((resolve, reject) => {
				const img = new Image();
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				const sourceUrl = URL.createObjectURL(file);
				img.onload = () => {
					URL.revokeObjectURL(sourceUrl);
					let { width, height } = img;
					if (width > maxWidth || height > maxHeight) {
						const ratio = Math.min(maxWidth / width, maxHeight / height);
						width = width * ratio;
						height = height * ratio;
					}
					canvas.width = width;
					canvas.height = height;
					ctx?.drawImage(img, 0, 0, width, height);
					canvas.toBlob(
						(blob) =>
							blob
								? resolve(blob)
								: reject(new Error("WebP хөрвүүлэлт амжилтгүй")),
						"image/webp",
						quality,
					);
				};
				img.onerror = () => {
					URL.revokeObjectURL(sourceUrl);
					reject(new Error("Зураг уншихад алдаа гарлаа"));
				};
				img.src = sourceUrl;
			});
		},
		[],
	);

	const handleImageChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			if (!file.type.startsWith("image/")) {
				alert("Зөвхөн зураг файл сонгоно уу");
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				alert("Зургийн хэмжээ 10MB-аас бага байх ёстой");
				return;
			}
			try {
				setIsUploadingImage(true);
				const webpBlob = await convertToWebP(file);
				setImagePreview(URL.createObjectURL(webpBlob));
				const formData = new FormData();
				formData.append(
					"file",
					webpBlob,
					file.name.replace(/\.[^/.]+$/, ".webp"),
				);
				const result = await uploadImage(formData);
				if (result.fileStatus !== 0)
					throw new Error(result.message || "Upload амжилтгүй боллоо");
				const imageUrl = result.file?.url;
				if (!imageUrl) throw new Error("Upload хариуд URL байхгүй байна");
				setUploadedImageUrl(imageUrl);
				setSelectedImage(file);
			} catch (error: unknown) {
				alert(
					error instanceof Error
						? error.message
						: "Зураг upload хийхэд алдаа гарлаа",
				);
				setImagePreview("");
				setSelectedImage(null);
				setUploadedImageUrl("");
			} finally {
				setIsUploadingImage(false);
			}
		},
		[convertToWebP],
	);

	/** Амжилттай хадгалсны дараа зургийн төлөвийг цэвэрлэнэ. */
	const resetImage = useCallback(() => {
		setSelectedImage(null);
		setImagePreview("");
		setUploadedImageUrl("");
	}, []);

	/** Сонгосон зургийг цуцалж, хуучин зураг руу буцаана. */
	const cancelImage = useCallback((fallbackUrl: string) => {
		setSelectedImage(null);
		setImagePreview(fallbackUrl);
		setUploadedImageUrl("");
	}, []);

	return {
		selectedImage,
		imagePreview,
		isUploadingImage,
		uploadedImageUrl,
		handleImageChange,
		resetImage,
		cancelImage,
	};
}
