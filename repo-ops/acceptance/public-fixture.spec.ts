import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openGitContentFixture } from './git-content-fixture.mjs';

test.beforeEach(async ({ context, baseURL }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort());
});
test.afterEach(() => {
  const output = resolve(process.env.PLAYWRIGHT_OUTPUT_DIR ?? '/tmp/tenzyudotcom-public-fixture');
  const fixture = readFileSync(resolve(output,'fixture-path'),'utf8').trim();
  const initial = readFileSync(resolve(output,'fixture-head'),'utf8').trim();
  expect(openGitContentFixture(resolve(fixture,'content.git')).head(), 'public journeys cannot mutate synthetic content').toBe(initial);
});

for (const locale of ['ja', 'en'] as const) {
  test('stable route contract: ' + locale, async ({ page }) => {
    const prefix = locale === 'en' ? '/en' : '';
    for (const route of ['', '/portfolio', '/blog', '/notes', '/scraps', '/links', '/tools', '/osu']) {
      const path = prefix + route || '/';
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), path).toBe(200);
      expect(new URL(page.url()).pathname).toBe(path);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('main')).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: path + ' overflows viewport' }).toBe(0);
    }
  });
}

test('locale query retention, theme persistence and anonymous editor gate without Cookie Store API', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'cookieStore', { value: undefined, configurable: true }); });
  await page.goto('/en/portfolio?from=fixture');
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('button', { name: /change language/i }).press('Enter');
  await page.getByRole('menuitem', { name: '日本語' }).press('Enter');
  await expect(page).toHaveURL(/\/portfolio\?from=fixture$/);
  await expect(page.locator('html')).toHaveAttribute('lang','ja');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang','ja');
  await expect(page.locator('html')).toHaveClass(/dark/);
  for (const prefix of ['', '/en']) {
    await page.goto(prefix + '/editor');
    expect(new URL(page.url()).pathname).toBe(prefix + '/editor/login');
    await expect(page.getByRole('main')).toBeVisible();
  }
});

for (const locale of ['ja', 'en'] as const) {
  test('settings groups have native names in both eras: ' + locale, async ({ page }) => {
    await page.goto(locale === 'en' ? '/en/osu' : '/osu');
    const tablist = page.getByRole('tablist', { name: locale === 'en' ? 'Settings era' : '設定の年代' });
    const currentName = locale === 'en' ? 'From 2026' : '2026年から';
    const historicalName = locale === 'en' ? 'Until 2025' : '2025年まで';
    const current = tablist.getByRole('tab', { name: currentName, exact: true });
    const historical = tablist.getByRole('tab', { name: historicalName, exact: true });
    async function assertSettingsNames(tabName: string) {
      // Bind the query to the selected tab's accessible panel, not any
      // panel that may still exist during a WebKit transition.
      const panel = page.getByRole('tabpanel', { name: tabName, exact: true });
      await expect(panel).toBeVisible();
      const legends = panel.locator('fieldset > legend');
      await expect.poll(() => legends.count()).toBeGreaterThan(1);
      // Keep the scoped panel, but use per-element innerText and the fieldset's
      // accessible name. The bulk allTextContents query crashed Firefox pages.
      const names: string[] = [];
      for (const legend of await legends.all()) {
        const name = (await legend.innerText()).trim();
        expect(name).not.toBe('');
        await expect(legend.locator('..')).toHaveAccessibleName(name);
        names.push(name);
      }
      expect(names.length).toBeGreaterThan(1);
      expect(await panel.getByRole('group', { name: locale === 'en' ? 'Name:' : '名前:', exact: true }).count()).toBeGreaterThan(1);
      await expect(panel.locator('[id^="settings-label-"], [aria-labelledby^="settings-label-"]')).toHaveCount(0);
    }
    await expect(current).toHaveAttribute('aria-selected', 'true');
    await assertSettingsNames(currentName);
    await current.press('ArrowLeft');
    await expect(historical).toBeFocused();
    await historical.press('Enter');
    await expect(historical).toHaveAttribute('aria-selected', 'true');
    await assertSettingsNames(historicalName);
    await historical.press('ArrowRight');
    await expect(current).toBeFocused();
    await current.press('Enter');
    await expect(current).toHaveAttribute('aria-selected', 'true');
    await assertSettingsNames(currentName);
  });
}
