import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { publicBrowserEnvironment } from './browser-environment.mjs';

test('public server inherits only runtime parameters, never credentials or execution hooks', () => {
  const source = {
    PATH: '/runtime/bin', HOME: '/home/fixture', __ETC_PROFILE_DONE: '1',
    PROVIDER_API_KEY: 'evidence-sentinel-never-store',
    NODE_OPTIONS: '--require=untrusted-hook', BUN_OPTIONS: 'untrusted',
    EDITOR_ADMIN_PASSWORD: 'real-password', OSU_CLIENT_SECRET: 'real-secret',
  };
  const env = publicBrowserEnvironment(source);
  assert.equal(env.PATH, source.PATH);
  assert.equal(env.__ETC_PROFILE_DONE, '1');
  for (const key of ['PROVIDER_API_KEY', 'NODE_OPTIONS', 'BUN_OPTIONS']) {
    assert.equal(Object.hasOwn(env, key), false);
  }
  for (const key of ['EDITOR_ADMIN_PASSWORD', 'EDITOR_SESSION_SECRET', 'GITHUB_CONTENT_TOKEN', 'OSU_CLIENT_ID', 'OSU_CLIENT_SECRET']) {
    assert.equal(env[key], '');
  }
  assert.equal(JSON.stringify(env).includes(source.PROVIDER_API_KEY), false);
});

test('completed public run retains all ten outcomes without the provider sentinel', {
  skip: !process.env.PLAYWRIGHT_SENTINEL_REPORT,
}, () => {
  const raw = readFileSync(process.env.PLAYWRIGHT_SENTINEL_REPORT, 'utf8');
  assert.equal(raw.includes('evidence-sentinel-never-store'), false);
  const report = JSON.parse(raw);
  assert.equal(Object.hasOwn(report.config.webServer.env, 'PROVIDER_API_KEY'), false);
  const { expected, unexpected, flaky, skipped } = report.stats;
  assert.equal(expected + unexpected + flaky + skipped, 10);
  assert.equal(skipped, 0);
});

test('serialized public Playwright config excludes inherited provider keys and preserves Chromium metadata', async () => {
  const previousKey = process.env.PROVIDER_API_KEY;
  const previousPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  process.env.PROVIDER_API_KEY = 'evidence-sentinel-never-store';
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = '/runtime/chromium';
  try {
    const { default: config } = await import('./playwright.config.ts');
    assert.equal(JSON.stringify(config).includes('evidence-sentinel-never-store'), false);
    assert.equal(Object.hasOwn(config.webServer.env, 'PROVIDER_API_KEY'), false);
    assert.equal(config.use.launchOptions.executablePath, '/runtime/chromium');
    assert.equal(config.projects.length, 2);
    assert.equal(config.webServer.env.OSU_CLIENT_SECRET, '');
  } finally {
    if (previousKey === undefined) delete process.env.PROVIDER_API_KEY;
    else process.env.PROVIDER_API_KEY = previousKey;
    if (previousPath === undefined) delete process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    else process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = previousPath;
  }
});
