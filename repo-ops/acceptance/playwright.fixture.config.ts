import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';
import { externalEvidencePath } from '../evidence/external-evidence-path.mjs';

const output = externalEvidencePath(process.cwd(), process.env.PLAYWRIGHT_OUTPUT_DIR ?? '/tmp/tenzyudotcom-public-fixture');
const baseURL = 'http://127.0.0.1:4175';
const profiles = [{ name: 'desktop', viewport: { width: 1440, height: 900 } }, { name: 'narrow', viewport: { width: 390, height: 844 } }];
export default defineConfig({
  testDir: resolve(process.cwd(), 'repo-ops/acceptance'),
  testMatch: 'public-fixture.spec.ts',
  outputDir: resolve(output, 'artifacts'),
  workers: 1, retries: 0, forbidOnly: true,
  timeout: 180_000, expect: { timeout: 20_000 },
  reporter: [['line'], ['json', { outputFile: resolve(output, 'results.json') }]],
  use: { baseURL, locale: 'ja-JP', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: (['chromium', 'firefox', 'webkit'] as const).flatMap(browserName =>
    profiles.map(({ name, viewport }) => ({ name: browserName + '-' + name, use: { browserName, viewport } }))),
  webServer: {
    cwd: process.cwd(),
    command: 'node repo-ops/acceptance/start-editor-browser-server.mjs',
    url: baseURL + '/en/editor/login',
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 8000 },
    timeout: 360_000,
    env: { PLAYWRIGHT_OUTPUT_DIR: output, PLAYWRIGHT_EDITOR_PORT: '4175', EDITOR_BROWSER_PRODUCTION: '1', EDITOR_FIXTURE_SEED: 'public' },
  },
});
