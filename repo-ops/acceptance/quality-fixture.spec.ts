import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openGitContentFixture } from './git-content-fixture.mjs';

const routes = ['', '/portfolio', '/blog', '/notes', '/scraps', '/links', '/tools', '/osu', '/editor/login'];
const output = () => resolve(process.env.PLAYWRIGHT_OUTPUT_DIR!);
function report(name: string, data: unknown) {
  writeFileSync(resolve(output(), 'quality-' + name + '.json'), JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
}
test.beforeEach(async ({ context, baseURL }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort());
});
test.afterEach(() => {
  const fixture = readFileSync(resolve(output(), 'fixture-path'), 'utf8').trim();
  const initial = readFileSync(resolve(output(), 'fixture-head'), 'utf8').trim();
  expect(openGitContentFixture(resolve(fixture, 'content.git')).head()).toBe(initial);
});

for (const theme of ['light', 'dark'] as const) {
  test('WCAG automated inventory: ' + theme, async ({ page }, info) => {
    test.setTimeout(300_000);
    // Use the installed Storybook accessibility addon's pinned axe-core.
    const uiRequire = createRequire(resolve('product/packages/ui/package.json'));
    const addonRequire = createRequire(uiRequire.resolve('@storybook/addon-a11y'));
    const axePath = addonRequire.resolve('axe-core/axe.min.js');
    await page.addInitScript(value => localStorage.setItem('theme', value), theme);
    const reports = [];
    for (const prefix of ['', '/en']) {
      for (const route of routes) {
        const path = prefix + route || '/';
        expect((await page.goto(path))?.status(), path).toBe(200);
        await expect(page.locator('html')).toHaveClass(new RegExp(theme));
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        await page.addScriptTag({ path: axePath });
        const result = await page.evaluate(async () => {
          const result = await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa'] } });
          const rules = (items: any[]) => items.map(r => ({ id: r.id, impact: r.impact, help: r.help, helpUrl: r.helpUrl, tags: r.tags, targets: r.nodes.map((n: any) => n.target) }));
          return { version: result.testEngine.version, passes: result.passes.length, violations: rules(result.violations), incomplete: rules(result.incomplete) };
        });
        expect(result.passes + result.violations.length + result.incomplete.length, path).toBeGreaterThan(0);
        reports.push({ path, theme, ...result });
      }
    }
    report(info.project.name + '-axe-' + theme, { scope: 'automated inventory, not conformance', reports });
    // Gate newly introduced rule IDs; existing baseline rules remain visible for triage.
    const baselineRules = new Set(['label-content-name-mismatch', 'aria-required-children', 'target-size', 'color-contrast']);
    expect(reports.flatMap(r => r.violations.filter((v: any) => !baselineRules.has(v.id))), 'new automated WCAG rule violations').toEqual([]);
    console.log(JSON.stringify({ project: info.project.name, theme, scans: reports.length, violations: reports.reduce((n,r) => n + r.violations.length, 0), severe: reports.reduce((n,r) => n + r.violations.filter((v: any) => ['critical','serious'].includes(v.impact)).length,0) }));
  });
}

test('navigation and scripted interaction performance inventory', async ({ browser, baseURL, viewport }, info) => {
  test.setTimeout(360_000);
  const results = [];
  for (const path of ['/en','/en/portfolio','/en/blog','/en/notes','/en/scraps','/en/tools','/en/osu']) {
    for (let repetition = 0; repetition < 3; repetition++) {
      const context = await browser.newContext({ viewport: viewport ?? undefined, locale: 'en-US' });
      await context.route('**/*', route => new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort());
      await context.addInitScript(() => {
        const observations: Record<string, any[]> = {};
        for (const type of ['largest-contentful-paint','layout-shift','event','longtask']) {
          if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
          observations[type] = [];
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              const e = entry as any;
              observations[type].push({ name: e.name, startTime: e.startTime, duration: e.duration, value: e.value, hadRecentInput: e.hadRecentInput, interactionId: e.interactionId, processingStart: e.processingStart, processingEnd: e.processingEnd, url: e.url });
            }
          }).observe({ type, buffered: true, ...(type === 'event' ? { durationThreshold: 16 } : {}) } as PerformanceObserverInit);
        }
        (window as any).__qualityObservations = observations;
      });
      try {
        const page = await context.newPage();
        for (const phase of ['fresh-context','repeat-same-context']) {
          expect((await page.goto(baseURL + path, { waitUntil: 'load' }))?.status(), path).toBe(200);
          await page.evaluate(() => document.fonts.ready.then(() => undefined));
          await page.waitForTimeout(500);
          // Trusted browser input, not dispatchEvent().
          await page.getByRole('button', { name: /change language/i }).press('Enter');
          await expect(page.getByRole('menuitem', { name: '日本語' })).toBeVisible();
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
          const metrics = await page.evaluate(() => {
            const obs = (window as any).__qualityObservations as Record<string, any[]>;
            const lcp = obs['largest-contentful-paint']?.at(-1);
            let cls = 0, sum = 0, start = -Infinity, last = -Infinity;
            for (const e of obs['layout-shift'] ?? []) {
              if (e.hadRecentInput) continue;
              if (e.startTime - last > 1000 || e.startTime - start > 5000) { start = e.startTime; sum = 0; }
              sum += e.value; last = e.startTime; cls = Math.max(cls, sum);
            }
            const groups = new Map<number, number>();
            for (const e of obs.event ?? []) if (e.interactionId) groups.set(e.interactionId, Math.max(groups.get(e.interactionId) ?? 0, e.duration));
            const navigation = performance.getEntriesByType('navigation')[0]?.toJSON();
            const resources = performance.getEntriesByType('resource').map(e => e.toJSON()).map(e => ({
              name: new URL(e.name).pathname, initiatorType: e.initiatorType, startTime: e.startTime, fetchStart: e.fetchStart, requestStart: e.requestStart, responseStart: e.responseStart, responseEnd: e.responseEnd, duration: e.duration, transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, decodedBodySize: e.decodedBodySize, renderBlockingStatus: e.renderBlockingStatus,
            }));
            return { supported: Object.keys(obs), lcpMs: lcp?.startTime ?? null, lcpResource: lcp?.url ? new URL(lcp.url).pathname : null, cls: obs['layout-shift'] ? cls : null, interactionSampleMaxMs: groups.size ? Math.max(...groups.values()) : null, interactionGroups: groups.size, eventTiming: obs.event ?? null, longTasks: obs.longtask ?? null, navigation, resources };
          });
          expect(metrics.supported).toContain('largest-contentful-paint');
          expect(metrics.supported).toContain('event');
          expect(metrics.lcpMs, path).not.toBeNull();
          results.push({ path, repetition, phase, ...metrics });
        }
      } finally { await context.close(); }
    }
  }
  report(info.project.name + '-performance', { scope: 'local production fixture; HTTP cache disabled by request isolation; no throttle; Event Timing sample, not field INP', viewport, results });
  console.log(JSON.stringify({ project: info.project.name, navigations: results.length, lcpSamples: results.filter(r => r.lcpMs !== null).length, observedInteractionSamples: results.filter(r => r.interactionSampleMaxMs !== null).length }));
});
