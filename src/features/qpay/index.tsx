"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { QPayDialogProps } from "./QPayDialog";

const QPayDialogImpl = dynamic(() => import("./QPayDialog"), { ssr: false });

/**
 * QPay dialog-ийг зөвхөн анх нээгдэх үед ачаална (lazy chunk).
 * Нэг нээгдсэний дараа хаалтын animation болон timer cleanup ажиллахын
 * тулд mount хэвээр үлдэнэ.
 */
export default function QPayDialog(props: QPayDialogProps) {
	const [everOpened, setEverOpened] = useState(props.open);
	if (props.open && !everOpened) setEverOpened(true);
	if (!everOpened) return null;
	return <QPayDialogImpl {...props} />;
}

export type { QPayDialogProps };
