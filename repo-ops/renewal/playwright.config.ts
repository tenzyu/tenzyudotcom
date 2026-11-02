import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const repositoryRoot = resolve(process.cwd());
const outputDir = resolve(
	process.env.PLAYWRIGHT_OUTPUT_DIR ?? "/tmp/tenzyudotcom-browser-evidence",
);
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

if (
	outputDir === repositoryRoot ||
	outputDir.startsWith(`${repositoryRoot}/`)
) {
	throw new Error("PLAYWRIGHT_OUTPUT_DIR must be outside the repository");
}

export default defineConfig({
	testDir: resolve(repositoryRoot, "repo-ops/renewal"),
	testMatch: "browser-acceptance.spec.ts",
	outputDir,
	fullyParallel: false,
	forbidOnly: true,
	retries: 0,
	workers: 1,
	reporter: [["line"], ["json", { outputFile: `${outputDir}/results.json` }]],
	expect: { timeout: 10_000 },
	timeout: 60_000,
	use: {
		baseURL: "http://127.0.0.1:4173",
		locale: "ja-JP",
		launchOptions: chromiumExecutablePath
			? { executablePath: chromiumExecutablePath }
			: undefined,
		screenshot: "only-on-failure",
		trace: "retain-on-failure",
	},
	projects: [
		{
			name: "desktop-1440-chromium",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1440, height: 900 },
			},
		},
		{
			name: "mobile-390-chromium",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 390, height: 844 },
				isMobile: true,
				hasTouch: true,
			},
		},
	],
	webServer: {
		command: "node repo-ops/renewal/start-browser-server.mjs",
		cwd: repositoryRoot,
		env: {
			BROWSER_EVIDENCE_DIR: outputDir,
			EDITOR_ADMIN_PASSWORD: "",
			EDITOR_SESSION_SECRET: "",
			GITHUB_CONTENT_TOKEN: "",
			GITHUB_CONTENT_OWNER: "tenzyu",
			GITHUB_CONTENT_REPO: "tenzyudotcom-content",
			GITHUB_CONTENT_BRANCH: "main",
			GITHUB_CONTENT_ROOT: "storage",
			NEXT_TELEMETRY_DISABLED: "1",
			OSU_CLIENT_ID: "",
			OSU_CLIENT_SECRET: "",
		},
		url: "http://127.0.0.1:4173/en/tools",
		reuseExistingServer: false,
		timeout: 120_000,
	},
});
