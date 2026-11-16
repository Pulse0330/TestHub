// app/api/qpay/check/route.ts
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userid, invoice_id } = body;

		if (!userid || !invoice_id) {
			return NextResponse.json(
				{
					RetResponse: {
						ResponseMessage: "User ID болон Invoice ID шаардлагатай",
						StatusCode: "400",
						ResponseCode: "99",
						ResponseType: false,
					},
					RetData: null,
				},
				{ status: 400 },
			);
		}

		const payload = {
			userid: userid.toString(),
			invoice_id: invoice_id,
			conn: {
				user: "edusr",
				password: "sql$erver43",
				database: "ikh_skuul",
				server: "172.16.1.79",

				options: {
					encrypt: false,
					trustServerCertificate: false,
				},
			},
		};

		const response = await fetch("https://ottapp.ecm.mn/api/get_qpaycheckweb", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		console.error("QPay Check Error:", error);

		return NextResponse.json(
			{
				RetResponse: {
					ResponseMessage: "Төлбөрийн статус шалгахад алдаа гарлаа",
					StatusCode: "500",
					ResponseCode: "99",
					ResponseType: false,
				},
				RetData: null,
			},
			{ status: 500 },
		);
	}
}
