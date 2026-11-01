import { test as base, expect, type Page } from "@playwright/test";

const retainedRoutes = [
	"/links",
	"/tools",
	"/blog",
	"/notes",
	"/scraps",
	"/osu",
];
const removedRoutes = [
	"/archives/osu-profile",
	"/pointers",
	"/puzzles",
	"/recommendations",
];

type BrowserEvent = {
	type: "console" | "pageerror" | "requestfailed";
	message: string;
	url?: string;
};

function observeBrowserErrors(page: Page) {
	const events: BrowserEvent[] = [];
	const retiredDocument404s = new Map<string, number>();
	page.on("response", (response) => {
		const request = response.request();
		const url = new URL(response.url());
		if (
			response.status() === 404 &&
			request.resourceType() === "document" &&
			request.frame() === page.mainFrame() &&
			removedRoutes.some(
				(route) => url.pathname === route || url.pathname === `/en${route}`,
			)
		) {
			retiredDocument404s.set(
				response.url(),
				(retiredDocument404s.get(response.url()) ?? 0) + 1,
			);
		}
	});
	page.on("console", (message) => {
		if (message.type() === "error") {
			events.push({
				type: "console",
				message: message.text(),
				url: message.location().url,
			});
		}
	});
	page.on("pageerror", (error) => {
		events.push({ type: "pageerror", message: error.message });
	});
	page.on("requestfailed", (request) => {
		events.push({
			type: "requestfailed",
			message: `${request.method()} ${request.url()} ${request.failure()?.errorText ?? "unknown error"}`,
		});
	});
	return { events, retiredDocument404s };
}

const test = base.extend<{ browserEvents: BrowserEvent[] }>({
	browserEvents: [
		async ({ page }, use, testInfo) => {
			const { events, retiredDocument404s } = observeBrowserErrors(page);
			await use(events);
			await testInfo.attach("browser-events.json", {
				body: Buffer.from(`${JSON.stringify(events, null, 2)}\n`),
				contentType: "application/json",
			});
			const unexpected = events.filter((event) => {
				if (
					event.type === "console" &&
					event.message ===
						"Failed to load resource: the server responded with a status of 404 (Not Found)" &&
					event.url
				) {
					const remaining = retiredDocument404s.get(event.url) ?? 0;
					if (remaining > 0) {
						retiredDocument404s.set(event.url, remaining - 1);
						return false;
					}
				}
				return true;
			});
			expect(unexpected, "browser console, page, and network errors").toEqual(
				[],
			);
		},
		{ auto: true },
	],
});

async function expectNoHorizontalOverflow(page: Page) {
	const dimensions = await page.evaluate(() => ({
		clientWidth: document.documentElement.clientWidth,
		scrollWidth: document.documentElement.scrollWidth,
	}));
	expect(dimensions, "the document must fit the viewport").toEqual({
		clientWidth: dimensions.clientWidth,
		scrollWidth: dimensions.clientWidth,
	});
}

test("retained routes load in default Japanese and explicit English", async ({
	page,
}) => {
	for (const route of retainedRoutes) {
		for (const localizedRoute of [route, `/en${route}`]) {
			const response = await page.goto(localizedRoute, {
				waitUntil: "networkidle",
			});
			expect(response?.status(), `${localizedRoute} must load`).toBe(200);
			expect(new URL(page.url()).pathname).toBe(localizedRoute);
			await expect(page.locator("html")).toHaveAttribute(
				"lang",
				localizedRoute.startsWith("/en/") ? "en" : "ja",
			);
			await expectNoHorizontalOverflow(page);
		}
	}
});

test("primary navigation exposes retained destinations and follows a link", async ({
	page,
}) => {
	await page.goto("/en", { waitUntil: "networkidle" });
	const navigation = page.getByRole("navigation", { name: /primary/i });
	for (const route of retainedRoutes) {
		await expect(navigation.locator(`a[href="/en${route}"]`)).toBeVisible();
	}
	await navigation.locator('a[href="/en/tools"]').click();
	await expect(page).toHaveURL(/\/en\/tools$/);
	await expectNoHorizontalOverflow(page);
});

test("osu settings start current and retain historical tablet and keypad details", async ({
	page,
}) => {
	await page.goto("/en/osu", { waitUntil: "networkidle" });
	const current = page.getByRole("tab", { name: "From 2026" });
	const historical = page.getByRole("tab", { name: "Until 2025" });
	await expect(current).toHaveAttribute("aria-selected", "true");
	await expect(page.getByRole("region", { name: "Tablet" })).toBeVisible();
	await expect(page.getByRole("region", { name: "Keyboard" })).toBeVisible();
	await historical.click();
	await expect(historical).toHaveAttribute("aria-selected", "true");
	await expect(
		page.getByText("Devices and settings used until 2025."),
	).toBeVisible();
	await expect(page.getByRole("region", { name: "Tablet" })).toBeVisible();
	await expect(page.getByRole("region", { name: "Keyboard" })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test("retired routes return not found", async ({ page }) => {
	for (const route of removedRoutes) {
		for (const localizedRoute of [route, `/en${route}`]) {
			const response = await page.goto(localizedRoute, {
				waitUntil: "networkidle",
			});
			expect(response?.status(), `${localizedRoute} must stay retired`).toBe(
				404,
			);
			await expectNoHorizontalOverflow(page);
		}
	}
});

test("editor requires authentication in both locales", async ({ page }) => {
	for (const [route, loginRoute] of [
		["/editor", "/editor/login"],
		["/en/editor", "/en/editor/login"],
	]) {
		await page.goto(route, { waitUntil: "networkidle" });
		expect(new URL(page.url()).pathname).toBe(loginRoute);
		await expect(page.getByRole("main")).toBeVisible();
		await expectNoHorizontalOverflow(page);
	}
});
