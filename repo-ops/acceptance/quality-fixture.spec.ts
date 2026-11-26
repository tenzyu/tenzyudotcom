import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
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
          const rules = (items: any[]) => items.map(r => ({ id: r.id, impact: r.impact, help: r.help, helpUrl: r.helpUrl, tags: r.tags, targets: r.nodes.map((n: any) => n.target), details: r.nodes.map((n: any) => ({ target: n.target, html: n.html, failureSummary: n.failureSummary })) }));
          return { version: result.testEngine.version, passes: result.passes.length, violations: rules(result.violations), incomplete: rules(result.incomplete) };
        });
        expect(result.passes + result.violations.length + result.incomplete.length, path).toBeGreaterThan(0);
        reports.push({ path, theme, ...result });
      }
    }
    report(info.project.name + '-axe-' + theme, { scope: 'automated inventory, not conformance', reports });
    // Persist the complete inventory before enforcing the fixture's zero-violation gate.
    expect(reports.flatMap(r => r.violations.map(v => ({ path: r.path, ...v }))), 'automated WCAG violations in the covered fixture').toEqual([]);
    console.log(JSON.stringify({ project: info.project.name, theme, scans: reports.length, violations: reports.reduce((n,r) => n + r.violations.length, 0), severe: reports.reduce((n,r) => n + r.violations.filter((v: any) => ['critical','serious'].includes(v.impact)).length,0) }));
  });
}

test('navigation and scripted interaction performance inventory', async ({ browser, baseURL, viewport }, info) => {
  test.setTimeout(360_000);
  const results = [];
  // Next's installed copy is the same web-vitals implementation used by
  // next/web-vitals, without a new package or production instrumentation.
  const nextRequire = createRequire(resolve('product/apps/web/package.json'));
  const vitalsEntry = resolve(output(), 'quality-' + info.project.name + '-vitals-entry.mjs');
  const vitalsBundle = resolve(output(), 'quality-' + info.project.name + '-vitals-bundle.js');
  writeFileSync(vitalsEntry, `
    import * as vitals from ${JSON.stringify(nextRequire.resolve('next/dist/compiled/web-vitals'))};
    try {
      const key = 'quality-vitals-' + performance.timeOrigin;
      const values = {};
      for (const name of ['LCP','INP','CLS']) {
        const subscribe = vitals['on' + name] ?? vitals.default?.['on' + name];
        if (typeof subscribe !== 'function') throw new Error('Missing web-vitals metric ' + name);
        subscribe(metric => {
          values[name] = { value: metric.value, rating: metric.rating, id: metric.id, navigationType: metric.navigationType };
          try { sessionStorage.setItem(key, JSON.stringify(values)); } catch {}
        }, { reportAllChanges: true });
      }
      window.__qualityVitalsInstalled = true;
    } catch (error) { window.__qualityVitalsError = String(error); }
  `, { flag: 'wx', mode: 0o600 });
  execFileSync('bun', ['build', vitalsEntry, '--target=browser', '--format=iife', '--outfile=' + vitalsBundle], { stdio: 'inherit' });
  const initVitals = readFileSync(vitalsBundle, 'utf8');
  for (const path of ['/en','/en/portfolio','/en/blog','/en/notes','/en/scraps','/en/tools','/en/osu']) {
    for (let repetition = 0; repetition < 3; repetition++) {
      const context = await browser.newContext({
        viewport: viewport ?? undefined, locale: 'en-US',
        // A deliberately dead external proxy preserves the HTTP cache, unlike
        // Playwright route interception. Only the loopback fixture bypasses it.
        proxy: { server: 'http://127.0.0.1:9', bypass: '127.0.0.1,localhost' },
        serviceWorkers: 'block',
      });
      await context.addInitScript({ content: initVitals });
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
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        const requests = new Map<string, any>();
        cdp.on('Network.requestWillBeSent', event => {
          const url = new URL(event.request.url);
          requests.set(event.requestId, { id: event.requestId, local: url.origin === baseURL, path: url.pathname, initiator: event.initiator.type, initiatorUrl: event.initiator.url ? new URL(event.initiator.url).pathname : null, start: event.timestamp });
        });
        cdp.on('Network.responseReceived', event => {
          const row = requests.get(event.requestId);
          if (row) Object.assign(row, { status: event.response.status, mime: event.response.mimeType, fromDiskCache: event.response.fromDiskCache, timing: event.response.timing });
        });
        cdp.on('Network.requestServedFromCache', event => {
          const row = requests.get(event.requestId); if (row) row.servedFromCache = true;
        });
        cdp.on('Network.loadingFinished', event => {
          const row = requests.get(event.requestId); if (row) Object.assign(row, { encodedDataLength: event.encodedDataLength, end: event.timestamp });
        });
        let previous: any;
        for (const phase of ['cold-browser-cache','warm-browser-cache']) {
          requests.clear();
          expect((await page.goto(baseURL + path, { waitUntil: 'load' }))?.status(), path).toBe(200);
          const installation = await page.evaluate(() => ({ installed: (window as any).__qualityVitalsInstalled, error: (window as any).__qualityVitalsError }));
          expect(installation, 'installed web-vitals callbacks').toMatchObject({ installed: true });
          if (previous) {
            previous.webVitals = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key) ?? '{}'), previous.vitalsKey);
          }
          await page.evaluate(() => document.fonts.ready.then(() => undefined));
          await page.waitForTimeout(500);
          // Trusted browser input, not dispatchEvent().
          await page.getByRole('button', { name: /change language/i }).press('Enter');
          await expect(page.getByRole('menuitem', { name: '日本語' })).toBeVisible();
          await page.keyboard.press('Escape');
          await page.getByRole('button', { name: /change language/i }).press('Enter');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
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
          const vitalsKey = await page.evaluate(() => 'quality-vitals-' + performance.timeOrigin);
          previous = { path, repetition, phase, ...metrics, vitalsKey, waterfall: [...requests.values()].filter(r => r.local), webVitals: {} };
          results.push(previous);
        }
        // Same-origin navigation flushes pagehide/visibility metrics and preserves
        // the previous document's sessionStorage; it is not a measured route.
        await page.goto(baseURL + '/en/editor/login');
        previous.webVitals = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key) ?? '{}'), previous.vitalsKey);
      } finally { await context.close(); }
    }
  }
  report(info.project.name + '-performance', { scope: 'local production fixture; browser cold/warm cache; external proxy blocked; no throttle; Next bundled web-vitals, scripted laboratory lifecycle, not field p75', viewport, results });
  console.log(JSON.stringify({ project: info.project.name, navigations: results.length, lcpSamples: results.filter(r => r.lcpMs !== null).length, observedInteractionSamples: results.filter(r => r.interactionSampleMaxMs !== null).length, officialINPSamples: results.filter((r: any) => typeof r.webVitals?.INP?.value === 'number').length, warmCacheHits: results.filter((r: any) => r.phase === 'warm-browser-cache').flatMap((r: any) => r.waterfall).filter((r: any) => r.fromDiskCache || r.servedFromCache).length }));
});

test('background motion is opt-in when reduced motion is requested and can be paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/osu');
  const video = page.locator('video').first();
  const play = page.getByRole('button', { name: 'Play background video', exact: true });
  await expect(play).toBeVisible();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(true);
  await play.press('Enter');
  const pause = page.getByRole('button', { name: 'Pause background video', exact: true });
  await expect(pause).toBeVisible();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(false);
  await pause.press('Enter');
  await expect(play).toBeFocused();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(pause).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(play).toBeVisible();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(true);
});
