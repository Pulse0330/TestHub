"use client";

import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { HtmlEditor } from "./ui";

export interface AnswerItem {
	key: string;
	/** 3: шошго, 6: зүүн талын агуулга */
	text: string;
	/** 1/2/5: хариулт, 3: зөв хариу, 6: баруун талын агуулга */
	html: string;
	is_true: boolean;
	/** 6: тайлбар */
	descr: string;
}

let seq = 0;
export const newAnswer = (p: Partial<AnswerItem> = {}): AnswerItem => ({
	key: `a${Date.now().toString(36)}${seq++}`,
	text: "",
	html: "",
	is_true: false,
	descr: "",
	...p,
});

export const letter = (i: number) => String.fromCharCode(65 + (i % 26));

const HELP: Record<number, string> = {
	1: "Нэг зөв хариулт сонгоно.",
	2: "Нэг буюу хэд хэдэн зөв хариулт тэмдэглэнэ.",
	3: "Нөхөх талбар бүрийн шошго болон зөв хариуг оруулна.",
	4: "Задгай даалгаварт хариултын сонголт шаардлагагүй — багш шалгана.",
	5: "Зөв дарааллаар нь оруулна. Сурагчид холилдож харагдана.",
	6: "Зүүн, баруун талын хос бүрийг зөв харгалзуулж оруулна.",
};

export function AnswersEditor({
	type,
	items,
	onChange,
}: {
	type: number;
	items: AnswerItem[];
	onChange: (items: AnswerItem[]) => void;
}) {
	const update = (i: number, p: Partial<AnswerItem>) =>
		onChange(items.map((a, j) => (j === i ? { ...a, ...p } : a)));
	const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
	const move = (i: number, d: -1 | 1) => {
		const j = i + d;
		if (j < 0 || j >= items.length) return;
		const next = [...items];
		[next[i], next[j]] = [next[j], next[i]];
		onChange(next);
	};
	const setCorrect = (i: number) => {
		if (type === 1) onChange(items.map((a, j) => ({ ...a, is_true: j === i })));
		else update(i, { is_true: !items[i].is_true });
	};

	if (!type) {
		return (
			<p className="rounded-2xl bg-muted/50 p-4 text-sm font-semibold text-muted-foreground">
				Эхлээд даалгаврын төрлөө сонгоно уу.
			</p>
		);
	}
	if (type === 4) {
		return (
			<p className="rounded-2xl bg-muted/50 p-4 text-sm font-semibold text-muted-foreground">
				{HELP[4]}
			</p>
		);
	}

	const addLabel =
		type === 6 ? "Хос нэмэх" : type === 3 ? "Талбар нэмэх" : "Хариулт нэмэх";

	return (
		<div className="grid gap-3">
			<p className="text-xs font-semibold text-muted-foreground">
				{HELP[type]}
			</p>
			<ol className="grid gap-2.5">
				{items.map((a, i) => (
					<li
						key={a.key}
						className={cn(
							"rounded-2xl border border-border p-3",
							(type === 1 || type === 2) &&
								a.is_true &&
								"border-pop-mint bg-pop-mint-soft/40",
						)}
					>
						<div className="mb-2 flex items-center gap-2">
							<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-black tabular-nums">
								{type === 5 || type === 3 || type === 6 ? i + 1 : letter(i)}
							</span>
							{(type === 1 || type === 2) && (
								<button
									type="button"
									aria-pressed={a.is_true}
									onClick={() => setCorrect(i)}
									className={cn(
										"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
										a.is_true
											? "border-transparent bg-pop-mint-soft text-pop-mint-ink"
											: "border-border text-muted-foreground hover:text-foreground",
									)}
								>
									<Check className="size-3.5" />
									{a.is_true ? "Зөв хариулт" : "Зөв гэж тэмдэглэх"}
								</button>
							)}
							<div className="ml-auto flex items-center gap-0.5">
								{type === 5 && (
									<>
										<Button
											type="button"
											variant="ghost"
											size="icon-xs"
											aria-label="Дээш"
											disabled={i === 0}
											onClick={() => move(i, -1)}
										>
											<ArrowUp />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon-xs"
											aria-label="Доош"
											disabled={i === items.length - 1}
											onClick={() => move(i, 1)}
										>
											<ArrowDown />
										</Button>
									</>
								)}
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									aria-label="Устгах"
									className="text-muted-foreground hover:text-destructive"
									onClick={() => remove(i)}
								>
									<Trash2 />
								</Button>
							</div>
						</div>

						{type === 3 ? (
							<div className="grid gap-2 sm:grid-cols-[minmax(0,14rem)_1fr]">
								{/* biome-ignore lint/a11y/noLabelWithoutControl: контрол label дотор байна */}
								<label className="grid gap-1">
									<span className="text-xs font-bold text-muted-foreground">
										Шошго
									</span>
									<Input
										value={a.text}
										placeholder={`(${i + 1})`}
										onChange={(e) => update(i, { text: e.target.value })}
									/>
								</label>
								<HtmlEditor
									label="Зөв хариу"
									value={a.html}
									onChange={(v) => update(i, { html: v })}
									rows={1}
									compact
								/>
							</div>
						) : type === 6 ? (
							<div className="grid gap-2">
								<div className="grid gap-2 md:grid-cols-2">
									<HtmlEditor
										label={`Зүүн тал ${i + 1}`}
										value={a.text}
										onChange={(v) => update(i, { text: v })}
										rows={2}
									/>
									<HtmlEditor
										label={`Баруун тал ${i + 1}`}
										value={a.html}
										onChange={(v) => update(i, { html: v })}
										rows={2}
									/>
								</div>
								<Input
									value={a.descr}
									placeholder="Тайлбар (заавал биш)"
									aria-label="Тайлбар"
									onChange={(e) => update(i, { descr: e.target.value })}
								/>
							</div>
						) : (
							<HtmlEditor
								label={`Хариулт ${type === 5 ? i + 1 : letter(i)}`}
								value={a.html}
								onChange={(v) => update(i, { html: v })}
								rows={2}
								compact
							/>
						)}
					</li>
				))}
			</ol>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="w-fit"
				onClick={() => onChange([...items, newAnswer()])}
			>
				<Plus />
				{addLabel}
			</Button>
		</div>
	);
}

/** Төрөл бүрийн шалгалт — алдааны мессеж эсвэл null. */
export function validateAnswers(
	type: number,
	items: AnswerItem[],
): string | null {
	const filled = items.filter((a) => a.html.trim());
	switch (type) {
		case 1:
			if (filled.length < 2) return "Дор хаяж 2 хариулт оруулна уу";
			if (items.filter((a) => a.is_true).length !== 1)
				return "Яг нэг зөв хариулт тэмдэглэнэ үү";
			return null;
		case 2:
			if (filled.length < 2) return "Дор хаяж 2 хариулт оруулна уу";
			if (!items.some((a) => a.is_true))
				return "Дор хаяж нэг зөв хариулт тэмдэглэнэ үү";
			return null;
		case 3:
			if (!filled.length) return "Нөхөх талбарын зөв хариуг оруулна уу";
			return null;
		case 5:
			if (filled.length < 2) return "Дор хаяж 2 мөр оруулна уу";
			return null;
		case 6:
			if (items.filter((a) => a.text.trim() && a.html.trim()).length < 2)
				return "Дор хаяж 2 бүтэн хос оруулна уу";
			return null;
		default:
			return null;
	}
}
