// URL-аар орж ирсэн (integration) шалгалт дууссан эсвэл гарсны дараах хуудас.
// Буцах хаяг (domname) өгөгдөөгүй үед харагдана — хэрэглэгч өөрийн системээсээ гарна.

import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Шалгалт дууслаа | EXMO",
};

export default function IntegrationExamFinishedPage() {
	return (
		<main className="flex min-h-dvh items-center justify-center bg-page-gradient p-4">
			<div className="card-pop w-full max-w-md p-6 text-center sm:p-8">
				<span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-pop-mint-soft text-pop-mint-ink">
					<CheckCircle2 className="size-9" strokeWidth={2.5} />
				</span>
				<h1 className="mb-2 text-xl font-black tracking-tight text-foreground sm:text-2xl">
					Шалгалтын цонхноос гарлаа
				</h1>
				<p className="font-semibold text-muted-foreground">
					Та энэ цонхыг хааж, өөрийн систем рүүгээ буцна уу.
				</p>
			</div>
		</main>
	);
}
