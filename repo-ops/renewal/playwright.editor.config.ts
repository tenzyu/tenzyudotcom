import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';

const output = resolve(process.env.PLAYWRIGHT_OUTPUT_DIR ?? '/tmp/tenzyudotcom-editor-evidence');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
export default defineConfig({
  testDir: resolve(process.cwd(), 'repo-ops/renewal'),
  testMatch: 'editor-browser.spec.ts',
  outputDir: resolve(output, 'artifacts'),
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  reporter: [['line'], ['json', { outputFile: resolve(output, 'results.json') }]],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    viewport: { width: 1440, height: 1000 },
    launchOptions: executablePath ? { executablePath } : {},
    trace: 'on', screenshot: 'only-on-failure',
  },
  webServer: {
    cwd: process.cwd(),
    command: 'node repo-ops/renewal/start-editor-browser-server.mjs',
    url: 'http://127.0.0.1:4174/en/editor/login',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { PLAYWRIGHT_OUTPUT_DIR: output },
  },
});
