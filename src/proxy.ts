import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get("auth-token")?.value;

	const publicRoutes = [
		"/login",
		"/sign",
		"/forgot",
		"/not-found",
		"/guide.pdf",
	];

	const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r));

	// Гадны системээс URL-аар орж ирсэн шалгалт (dbname, userid) болон
	// түүний дууссан хуудас — нэвтрэлт шаардахгүй
	const { searchParams } = request.nextUrl;
	const isIntegrationExam =
		pathname.startsWith("/exam/") &&
		!!searchParams.get("dbname") &&
		!!searchParams.get("userid");
	// Хөгжүүлэлтийн шууд нэвтрэлт (production-д хуудас нь 404)
	const isDevLogin =
		process.env.NODE_ENV === "development" && pathname === "/dev-login";
	if (isIntegrationExam || isDevLogin || pathname === "/exam/finished") {
		return NextResponse.next();
	}

	// Token байхгүй бол login руу
	if (!token) {
		if (isPublicRoute) {
			return NextResponse.next();
		}
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Token байгаа үед public route руу орохыг хориглох
	if (isPublicRoute) {
		return NextResponse.redirect(new URL("/home", request.url));
	}

	// Token байвал үргэлжлүүлэх
	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api/|_next/|_static/|_vercel|favicon.ico|ECM.png|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|JPG|jpeg|gif|webp|css|js)$).*)",
	],
};
