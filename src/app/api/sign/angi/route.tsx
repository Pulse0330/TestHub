import { type NextRequest, NextResponse } from "next/server";

interface ClassResponse {
	RetResponse?: {
		ResponseType: boolean;
		ResponseMessage?: string;
		StatusCode?: string;
		ResponseCode?: string;
	};
	RetData?: Array<{
		id: number;
		class_name: string;
		studentgroupid: string;
		sort: number;
	}>;
}

interface ConnectionConfig {
	user: string;
	password: string;
	database: string;
	server: string;

	options: {
		encrypt: boolean;
		trustServerCertificate: boolean;
	};
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const { database, serverip } = body;

		// Зөвхөн дотоод сүлжээний сургуулийн DB сервер, энгийн DB нэр —
		// гадны сервер рүү нууц үгтэй холболт үүсгэхээс (SSRF) хамгаална.
		const isValidTarget =
			typeof database === "string" &&
			/^[A-Za-z0-9_]{1,64}$/.test(database) &&
			typeof serverip === "string" &&
			/^172\.16\.\d{1,3}\.\d{1,3}$/.test(serverip);

		if (!database || !serverip || !isValidTarget) {
			return NextResponse.json(
				{
					RetResponse: {
						ResponseType: false,
						ResponseMessage: "Database болон serverip шаардлагатай",
						StatusCode: "400",
						ResponseCode: "00",
					},
					RetData: [],
				},
				{ status: 400 },
			);
		}

		// Build connection config using selected school's info
		const conn: ConnectionConfig = {
			user: "edusr",
			password: "sql$erver43",
			database: database,
			server: serverip,

			options: {
				encrypt: false,
				trustServerCertificate: false,
			},
		};

		// Prepare payload for backend
		const payload = {
			conn,
		};

		const classResponse = await fetch("https://backend.skuul.mn/api/class", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!classResponse.ok) {
			const errorText = await classResponse.text();
			console.error("=== CLASS API: Backend error ===", errorText);
			throw new Error(`Backend API error: ${classResponse.status}`);
		}

		const classData = (await classResponse.json()) as ClassResponse;

		return NextResponse.json(classData);
	} catch (error) {
		console.error("=== CLASS API: Error ===", error);
		return NextResponse.json(
			{
				RetResponse: {
					ResponseType: false,
					ResponseMessage: "Ангийн жагсаалт татахад алдаа гарлаа",
					StatusCode: "500",
					ResponseCode: "00",
				},
				RetData: [],
			},
			{ status: 500 },
		);
	}
}
