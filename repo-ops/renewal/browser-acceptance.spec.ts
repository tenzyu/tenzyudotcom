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

for (const route of retainedRoutes) {
	for (const localizedRoute of [route, `/en${route}`]) {
		test(`retained route ${localizedRoute} loads in ${localizedRoute.startsWith("/en/") ? "explicit English" : "default Japanese"}`, async ({
			page,
		}) => {
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
		});
	}
}

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

test("language selector changes and retains the selected locale", async ({
	page,
}) => {
	await page.goto("/en/portfolio?from=preview", { waitUntil: "networkidle" });
	await page.evaluate(() => localStorage.setItem("theme", "dark"));
	await page.reload({ waitUntil: "networkidle" });
	await expect(page.locator("html")).toHaveClass(/dark/);
	await page.getByRole("button", { name: /change language/i }).click();
	await page.getByRole("menuitem", { name: "日本語" }).click();
	await expect.poll(() => new URL(page.url()).pathname).toBe("/portfolio");
	await expect.poll(() => new URL(page.url()).search).toBe("?from=preview");
	await expect(page.locator("html")).toHaveAttribute("lang", "ja");
	await expect(page.locator("html")).toHaveClass(/dark/);
	await page.waitForLoadState("networkidle");
	await page.reload({ waitUntil: "networkidle" });
	await expect(page.locator("html")).toHaveAttribute("lang", "ja");
	await page.getByRole("button", { name: "言語を切り替える" }).click();
	await page.getByRole("menuitem", { name: "English" }).click();
	await expect.poll(() => new URL(page.url()).pathname).toBe("/en/portfolio");
	await expect.poll(() => new URL(page.url()).search).toBe("?from=preview");
	await expect(page.locator("html")).toHaveAttribute("lang", "en");
	await expect(page.locator("html")).toHaveClass(/dark/);
	await page.waitForLoadState("networkidle");
});

test("Japanese selection works when the browser cookie write is delayed", async ({
	page,
	context,
}) => {
	await context.addCookies([
		{ name: "INTLAYER_LOCALE", value: "en", domain: "127.0.0.1", path: "/" },
	]);
	await page.addInitScript(() => {
		Object.defineProperty(window.cookieStore, "set", {
			value: () => new Promise(() => {}),
			configurable: true,
		});
	});
	await page.goto("/en/portfolio?from=preview", { waitUntil: "networkidle" });
	await page.getByRole("button", { name: /change language/i }).click();
	await page.getByRole("menuitem", { name: "日本語" }).click();
	await expect(page.locator("html")).toHaveAttribute("lang", "ja");
	await expect(page).toHaveURL(/\/portfolio\?from=preview$/);
	await page.waitForLoadState("networkidle");
	await page.reload({ waitUntil: "networkidle" });
	await expect(page.locator("html")).toHaveAttribute("lang", "ja");
});

test("osu diagrams use visible colors and the site theme", async ({ page }) => {
	await page.goto("/osu", { waitUntil: "networkidle" });
	const diagram = page.locator(".bg-visualization-primary").first();
	await expect(diagram).toBeVisible();
	expect(
		await diagram.evaluate(
			(element) => getComputedStyle(element).backgroundColor,
		),
	).not.toBe("rgba(0, 0, 0, 0)");
	const colors = await page.locator(".legacy-osu").evaluate((element) => ({
		page: getComputedStyle(element).getPropertyValue("--background").trim(),
		site: getComputedStyle(element.closest(".tz-site")!)
			.getPropertyValue("--background")
			.trim(),
	}));
	expect(colors.page).toBe(colors.site);
});

test("portfolio uses the wider layout without overflowing", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/portfolio", { waitUntil: "networkidle" });
	const width = await page
		.locator(".main-content")
		.evaluate((element) => element.getBoundingClientRect().width);
	expect(width).toBeGreaterThan(736);
	await expectNoHorizontalOverflow(page);
});

test("dark mode uses the darker site background", async ({ page }) => {
	await page.goto("/", { waitUntil: "networkidle" });
	await page.evaluate(() => localStorage.setItem("theme", "dark"));
	await page.reload({ waitUntil: "networkidle" });
	await expect(page.locator("html")).toHaveClass(/dark/);
	await expect(page.locator(".tz-site")).toHaveCSS(
		"background-color",
		"rgb(21, 20, 18)",
	);
});

test("blog tags open a filtered list and keep the filter on pagination", async ({
	page,
	context,
}) => {
	await context.addCookies([
		{ name: "INTLAYER_LOCALE", value: "ja", domain: "127.0.0.1", path: "/" },
	]);
	await page.goto("/blog", { waitUntil: "networkidle" });
	const tagLink = page.locator('a[href^="/blog?tag="]').first();
	const label = await tagLink.innerText();
	await tagLink.click();
	await expect
		.poll(() => new URL(page.url()).searchParams.get("tag"))
		.toBe(label.slice(1));
	await expect(
		page.getByRole("heading", { name: label, exact: true }),
	).toBeVisible();
	const articles = page.locator('a[href^="/blog/"]');
	await expect(articles.first()).toBeVisible();
	for (const article of await articles.all()) {
		await expect(
			article.locator("..").getByRole("link", { name: label, exact: true }),
		).toBeVisible();
	}
	const next = page.getByRole("link", { name: /next/i });
	if (await next.count()) {
		expect(await next.getAttribute("href")).toContain("tag=");
	}
	await page.getByRole("link", { name: "すべての記事" }).click();
	await expect(page).toHaveURL(/\/blog$/);
});

test("the stray LLM harness article renders its authored components", async ({
	page,
}) => {
	const response = await page.goto(
		"/en/blog/i-am-a-stray-llm-harness-engineer",
		{ waitUntil: "networkidle" },
	);
	expect(response?.status()).toBe(200);
	await expect(
		page.getByRole("heading", {
			name: /a stray LLM-harness engineer/i,
			level: 1,
		}),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "お金くれる人探してます" }),
	).toHaveAttribute("href", "https://ko-fi.com/tenzyu");
	await expect(page.getByText("キー配列を変える。")).toBeVisible();
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

test("osu tablet settings and diagram follow the selected era", async ({
	page,
}) => {
	await page.goto("/en/osu", { waitUntil: "networkidle" });
	let tablet = page.getByRole("region", { name: "Tablet" });
	await expect(tablet.getByText("400 Hz (custom firmware)")).toBeVisible();
	await expect(tablet.getByText("127", { exact: true })).toBeVisible();
	await expect(tablet.getByText("22", { exact: true })).toBeVisible();
	const currentPosition = await tablet
		.locator(".bg-visualization-primary")
		.evaluate((element) => ({
			left: element.style.left,
			top: element.style.top,
		}));
	expect(Number.parseFloat(currentPosition.left)).toBeCloseTo(
		((127 - 58 / 2) / 152) * 100,
	);
	expect(Number.parseFloat(currentPosition.top)).toBeCloseTo(
		((22 - 45.24 / 2) / 95) * 100,
	);
	await page.getByRole("tab", { name: "Until 2025" }).click();
	tablet = page.getByRole("region", { name: "Tablet" });
	await expect(tablet.getByText("83.06", { exact: true })).toBeVisible();
	await expect(tablet.getByText("26.43", { exact: true })).toBeVisible();
	await expect(tablet.getByText("400 Hz (custom firmware)")).toHaveCount(0);
});

test("osu links use the same card layout as the links page", async ({
	page,
}) => {
	await page.goto("/en/links", { waitUntil: "networkidle" });
	const linkCard = page.locator('a[data-slot="item"]').first();
	await expect(linkCard).toBeVisible();
	const style = (element: Element) => ({
		display: getComputedStyle(element).display,
		border: getComputedStyle(element).borderTopWidth,
		padding: getComputedStyle(element).padding,
	});
	const expected = await linkCard.evaluate(style);
	await page.goto("/en/osu", { waitUntil: "networkidle" });
	const osuCard = page.locator('.legacy-osu a[data-slot="item"]').first();
	await expect(osuCard).toBeVisible();
	expect(await osuCard.evaluate(style)).toEqual(expected);
});

test("portfolio shows the current Tailscale devices and balanced tag padding", async ({
	page,
}) => {
	await page.goto("/en/portfolio", { waitUntil: "networkidle" });
	await page.getByRole("button", { name: "Show environment details" }).click();
	for (const name of [
		"neko5 (Laptop)",
		"neko7 (Remote Server)",
		"nekosm1 (Android)",
	]) {
		await expect(page.getByText(name, { exact: true })).toBeVisible();
	}
	await expect(page.getByText(/neko3|neko6/)).toHaveCount(0);
	await expect(page.getByText(/CPH2523/)).toBeVisible();
	await expect(page.getByText(/Last updated: November 2026/)).toBeVisible();
	const footer = page.locator('[data-slot="card-footer"]').first();
	const padding = await footer.evaluate((element) => ({
		top: getComputedStyle(element).paddingTop,
		bottom: getComputedStyle(element).paddingBottom,
	}));
	expect(padding.top).toBe(padding.bottom);
});

test("osu contents navigation is localized", async ({ page }) => {
	await page.goto("/osu", { waitUntil: "networkidle" });
	await expect(page.getByRole("navigation", { name: "目次" })).toBeVisible();
	await page.goto("/en/osu", { waitUntil: "networkidle" });
	await expect(
		page.getByRole("navigation", { name: "Table of Contents" }),
	).toBeVisible();
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
