type MathJaxApi = NonNullable<Window["MathJax"]>;

let readyPromise: Promise<MathJaxApi | null> | null = null;

/**
 * Root layout дахь config script нь `window.MathJax`-ийг энгийн объект
 * болгож тохируулдаг тул CDN script ачаалагдаж дуустал `typesetPromise`
 * байхгүй. Энэ функц library бэлэн болтол хүлээнэ (хамгийн ихдээ ~20s).
 */
export function whenMathJaxReady(): Promise<MathJaxApi | null> {
	if (typeof window === "undefined") return Promise.resolve(null);
	if (readyPromise) return readyPromise;

	readyPromise = new Promise((resolve) => {
		const started = Date.now();
		const check = () => {
			const mj = window.MathJax;
			if (mj?.typesetPromise && mj.startup?.promise) {
				mj.startup.promise.then(() => resolve(mj)).catch(() => resolve(null));
				return;
			}
			if (Date.now() - started > 20_000) {
				readyPromise = null; // дараагийн дуудалтад дахин оролдоно
				resolve(null);
				return;
			}
			setTimeout(check, 50);
		};
		check();
	});
	return readyPromise;
}

// MathJax typeset-ийг дараалуулна — зэрэг дуудвал алдаа өгдөг
let typesetChain: Promise<unknown> = Promise.resolve();

export function typesetElement(el: HTMLElement): Promise<void> {
	const run = async () => {
		const mj = await whenMathJaxReady();
		if (!mj || !el.isConnected) return;
		mj.typesetClear?.([el]);
		await mj.typesetPromise?.([el]);
	};
	const next = typesetChain.then(run, run);
	typesetChain = next.catch(() => undefined);
	return next;
}
