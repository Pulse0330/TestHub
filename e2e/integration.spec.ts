import { expect, test } from "@playwright/test";

/**
 * Гадны системээс URL-аар орж ирэх шалгалт (integration).
 * integration.ecm.mn болон backend-ийг mock хийнэ — бодит сервер дуудахгүй.
 */

const EXAM_FILL = {
	message: "OK",
	code: "200",
	status: "10",
	success: true,
	ExamInfo: [
		{
			id: 40,
			title: "Integration тест шалгалт",
			minut: 30,
			exam_type: 3,
			start_eid: 1,
			starteddate: new Date().toISOString(),
		},
	],
	Questions: [],
	Answers: [],
	ChoosedAnswer: [],
	ChoosedFiles: [],
	RetData: [],
};

test.describe("integration exam via URL", () => {
	test.beforeEach(async ({ page, context }) => {
		await context.clearCookies();
		await page.route("**/integration.ecm.mn/**", (route) =>
			route.fulfill({ json: EXAM_FILL }),
		);
		await page.route("**/backend.skuul.mn/**", (route) =>
			route.fulfill({
				json: { RetResponse: { StatusCode: "200" }, RetData: [] },
			}),
		);
	});

	test("нэвтрээгүй ч dbname+userid-тэй шалгалтын URL login руу шилжихгүй", async ({
		page,
	}) => {
		const fill = page.waitForRequest(
			(req) =>
				req.url().includes("/IntegrationExamFill") && req.method() === "POST",
		);
		await page.goto(
			"/exam/40?dbname=ikh_test&userid=77439&classroom_id=3216&domname=https://example.mn/done",
		);

		expect(new URL(page.url()).pathname).toBe("/exam/40");
		const body = (await fill).postDataJSON();
		expect(body).toMatchObject({
			exam_id: 40,
			user_id: 77439,
			classroom_id: 3216,
			dbnamelist: [{ dbname: "ikh_test" }],
		});
	});

	test("dbname байхгүй шалгалтын URL нэвтрэлт шаардана", async ({ page }) => {
		await page.goto("/exam/40?userid=77439");
		await expect(page).toHaveURL(/\/login\?/);
	});

	test("/exam/finished нэвтрэлтгүй харагдана", async ({ page }) => {
		await page.goto("/exam/finished");
		await expect(
			page.getByRole("heading", { name: "Шалгалтын цонхноос гарлаа" }),
		).toBeVisible();
	});
});
