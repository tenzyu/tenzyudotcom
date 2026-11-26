import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { createHash } from 'node:crypto';
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
          // Inspect the concrete axe-incomplete contrast targets. Canvas resolves
          // CSS Color 4 values (including OKLCH) to sRGB for WCAG luminance.
          // A non-opaque paint stack is not guessed; report it as unresolved.
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext('2d')!;
          function rgba(value: string) {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = value;
            ctx.fillRect(0, 0, 1, 1);
            return Array.from(ctx.getImageData(0, 0, 1, 1).data);
          }
          function luminance(color: number[]) {
            const c = color.slice(0, 3).map(v => {
              const s = v / 255;
              return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
            });
            return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
          }
          const contrastEvidence = result.incomplete
            .filter((rule: any) => rule.id === 'color-contrast')
            .flatMap((rule: any) => rule.nodes.map((node: any) => {
              const selector = node.target.length === 1 && typeof node.target[0] === 'string' ? node.target[0] : null;
              const element = selector ? document.querySelector(selector) : null;
              if (!element) return { target: node.target, unresolved: 'selector is not a local element' };
              const foreground = rgba(getComputedStyle(element).color);
              let background: number[] | undefined;
              for (let e: Element | null = element; e; e = e.parentElement) {
                const style = getComputedStyle(e);
                if (style.backgroundImage !== 'none' || style.opacity !== '1' || style.mixBlendMode !== 'normal') break;
                const paint = rgba(style.backgroundColor);
                if (paint[3] === 255) { background = paint; break; }
                if (paint[3] !== 0) break;
              }
              if (!background || foreground[3] !== 255) return { target: node.target, unresolved: 'non-opaque or complex paint stack' };
              const [light, dark] = [luminance(foreground), luminance(background)].sort((a,b) => b-a);
              const ratio = (light + .05) / (dark + .05);
              return { target: node.target, text: element.textContent?.trim(), foreground, background, ratio, minimum: 4.5,
                scope: 'computed opaque color pair; overlap and actual glyph visibility still require inspection' };
            }));
          return { version: result.testEngine.version, passes: result.passes.length, violations: rules(result.violations), incomplete: rules(result.incomplete), contrastEvidence };
        });
        expect(result.passes + result.violations.length + result.incomplete.length, path).toBeGreaterThan(0);
        const contrastScreenshots = [];
        for (const [index, target] of result.contrastEvidence.entries()) {
          if (target.target.length !== 1 || typeof target.target[0] !== 'string') continue;
          const locator = page.locator(target.target[0]);
          if (await locator.count() !== 1 || !(await locator.isVisible())) continue;
          const file = 'quality-' + info.project.name + '-' + theme + '-contrast-' + reports.length + '-' + index + '.png';
          // Capture the surrounding layout, not just an isolated glyph.
          await locator.locator('..').screenshot({ path: resolve(output(), file), animations: 'disabled' });
          contrastScreenshots.push({ target: target.target, file });
        }
        reports.push({ path, theme, ...result, contrastScreenshots });
      }
    }
    report(info.project.name + '-axe-' + theme, { scope: 'automated inventory, not conformance', reports });
    for (const scan of reports) for (const target of scan.contrastEvidence) {
      if ('ratio' in target) expect(target.ratio, scan.path + ' ' + JSON.stringify(target.target)).toBeGreaterThanOrEqual(4.5);
    }
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

test('keyboard focus restoration and narrow CSS viewport reflow', async ({ page }, info) => {
  test.setTimeout(180_000);
  const observations = [];
  // 720 CSS px corresponds to a 1440px viewport at 200% browser zoom.
  // 320 CSS px exercises WCAG reflow width; neither simulates actual browser zoom.
  for (const width of [720, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['', '/en'].flatMap(prefix => routes.map(route => prefix + route || '/'))) {
      expect((await page.goto(path))?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      observations.push({ width, path, ...dimensions });
    }
  }
  await page.goto('/en/portfolio');
  const language = page.getByRole('button', { name: /change language/i });
  await language.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(language).toBeFocused();
  const focus = await language.evaluate(el => {
    const style = getComputedStyle(el);
    return { focusVisible: el.matches(':focus-visible'), outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
  });
  await language.press('Enter');
  await expect(page.getByRole('menuitem', { name: '日本語' })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(language).toBeFocused();
  report(info.project.name + '-keyboard-reflow', { observations, focus,
    scope: 'keyboard focus restoration and CSS viewport reflow; actual zoom and screen reader experience not simulated' });
  expect(focus.focusVisible).toBe(true);
  expect(focus.boxShadow !== 'none' || (focus.outlineStyle !== 'none' && focus.outlineWidth !== '0px')).toBe(true);
  for (const row of observations) expect(row.scroll, row.path + ' at ' + row.width + ' CSS px').toBeLessThanOrEqual(row.viewport);
});

test('same-build runtime chunk and font attribution', async ({ browser, baseURL, viewport }, info) => {
  test.setTimeout(180_000);
  const build = resolve('product/apps/web/.next');
  const buildId = readFileSync(resolve(build, 'BUILD_ID'), 'utf8').trim();
  const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex');
  const modules = (map: any): string[] => [
    ...(Array.isArray(map.sources) ? map.sources.filter((s: unknown) => typeof s === 'string') : []),
    ...(Array.isArray(map.sections) ? map.sections.flatMap((section: any) => modules(section.map ?? {})) : []),
  ];
  const assets = new Map<string, any>();
  const routeEvidence = [];
  const mapInventory = readdirSync(resolve(build, 'static'), { recursive: true, encoding: 'utf8' })
    .filter(file => file.endsWith('.map')).sort();
  const effectiveSourceMaps = JSON.parse(readFileSync(resolve(build, 'required-server-files.json'), 'utf8'))
    .config.productionBrowserSourceMaps === true;
  for (const path of ['/en','/en/portfolio','/en/blog','/en/notes','/en/scraps','/en/tools','/en/osu']) {
    const context = await browser.newContext({
      viewport: viewport ?? undefined, locale: 'en-US', serviceWorkers: 'block',
      proxy: { server: 'http://127.0.0.1:9', bypass: '127.0.0.1,localhost' },
    });
    try {
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable', { maxTotalBufferSize: 100 * 1024 * 1024, maxResourceBufferSize: 8 * 1024 * 1024 });
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
      const responses = new Map<string, { path: string, mime: string }>();
      const completed = new Set<string>();
      cdp.on('Network.responseReceived', event => {
        const url = new URL(event.response.url);
        if (url.origin !== baseURL || !url.pathname.startsWith('/_next/static/') || event.response.status !== 200) return;
        if (!/\.(js|css|woff2)$/.test(url.pathname)) return;
        responses.set(event.requestId, { path: url.pathname, mime: event.response.mimeType });
      });
      cdp.on('Network.loadingFinished', event => completed.add(event.requestId));
      expect((await page.goto(baseURL + path, { waitUntil: 'load' }))?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      await page.getByRole('button', { name: /change language/i }).press('Enter');
      await expect(page.getByRole('menuitem', { name: '日本語' })).toBeVisible();
      await page.keyboard.press('Escape');
      const { result: coverage } = await cdp.send('Profiler.takePreciseCoverage');
      await cdp.send('Profiler.stopPreciseCoverage');
      const loaded = [];
      for (const [id, response] of responses) {
        if (!completed.has(id)) continue;
        const rel = response.path.slice('/_next/'.length);
        expect(rel.split('/').every(part => part && part !== '..' && part !== '.')).toBe(true);
        const disk = resolve(build, rel);
        const bytes = readFileSync(disk);
        const network = await cdp.send('Network.getResponseBody', { requestId: id });
        const body = Buffer.from(network.body, network.base64Encoded ? 'base64' : 'utf8');
        expect(hash(body), response.path + ' HTTP body must equal generated asset').toBe(hash(bytes));
        loaded.push(response.path);
        if (assets.has(response.path)) continue;
        const record: any = { sha256: hash(bytes), bytes: bytes.length, mime: response.mime };
        if (disk.endsWith('.js')) {
          // Turbopack hashes map and JS names independently (vercel/next.js#100891).
          // Resolve the directive from the exact body already matched to disk, not a guessed sidecar.
          const directive = bytes.toString('utf8').match(/(?:^|\r?\n)\/\/[#@]\s*sourceMappingURL=(\S+)\s*$/)?.[1];
          record.modules = null;
          record.mapStatus = 'no-directive';
          if (directive) {
            let mapBytes: Buffer | undefined;
            if (/^data:application\/json(?:;charset=[^;,]+)?;base64,/.test(directive)) {
              mapBytes = Buffer.from(directive.slice(directive.indexOf(',') + 1), 'base64');
              record.mapPath = 'inline';
            } else {
              const mapURL = new URL(directive, baseURL + response.path);
              const parts = decodeURIComponent(mapURL.pathname).slice('/_next/'.length).split('/');
              if (mapURL.origin !== baseURL || !mapURL.pathname.startsWith('/_next/static/') ||
                  mapURL.search || mapURL.hash || !mapURL.pathname.endsWith('.map') ||
                  parts.some(part => !part || part === '.' || part === '..' || part.includes('\\'))) {
                throw new Error('Source map directive escapes the synthetic static build');
              }
              record.mapPath = parts.join('/');
              const mapFile = resolve(build, ...parts);
              if (existsSync(mapFile)) mapBytes = readFileSync(mapFile);
            }
            record.mapStatus = 'missing';
            if (mapBytes) {
              record.mapSha256 = hash(mapBytes);
              record.modules = [...new Set(modules(JSON.parse(mapBytes.toString())))].sort();
              record.mapStatus = record.modules.length ? 'mapped' : 'empty';
            }
          }
        }
        if (disk.endsWith('.css')) {
          record.fontFaces = [...bytes.toString().matchAll(/@font-face\s*\{([^}]+)\}/g)].map(match => ({
            family: match[1].match(/font-family\s*:\s*([^;]+)/)?.[1] ?? null,
            unicodeRange: match[1].match(/unicode-range\s*:\s*([^;]+)/)?.[1] ?? null,
            files: [...match[1].matchAll(/url\(([^)]+)\)/g)].map(url => basename(url[1].replace(/['"]/g, ''))),
          }));
        }
        assets.set(response.path, record);
      }
      const scriptCoverage = coverage.flatMap(script => {
        if (!script.url.startsWith(baseURL + '/_next/static/')) return [];
        const asset = new URL(script.url).pathname;
        if (!loaded.includes(asset)) return [];
        const ranges = script.functions.flatMap(fn => fn.ranges);
        return [{ asset, functions: script.functions.length, ranges: ranges.length, executedRanges: ranges.filter(range => range.count > 0).length }];
      });
      routeEvidence.push({ path, loaded: [...new Set(loaded)].sort(), scriptCoverage });
    } finally { await context.close(); }
  }
  const mapped = [...assets.entries()].filter(([path, asset]) => path.endsWith('.js') && asset.modules?.length);
  const routeMapping = routeEvidence.map(route => {
    const executed = route.scriptCoverage.filter(script => script.executedRanges > 0);
    const mappedExecuted = executed.filter(script => assets.get(script.asset)?.modules?.length);
    return { path: route.path, executed: executed.length, mappedExecuted: mappedExecuted.length,
      unmappedExecuted: executed.filter(script => !assets.get(script.asset)?.modules?.length).map(script => script.asset) };
  });
  report(info.project.name + '-same-build-attribution', {
    buildId, effectiveSourceMaps, mapInventory, assets: Object.fromEntries(assets), routes: routeEvidence, routeMapping,
    scope: 'synthetic diagnostic production build; HTTP body and file SHA-256 joined to source maps, script-level V8 coverage and CSS font-face declarations; no per-module compressed byte or CPU attribution claim',
  });
  expect(effectiveSourceMaps, 'synthetic build must enable browser maps').toBe(true);
  expect(mapped.length, 'at least one fetched JS chunk must have a source map').toBeGreaterThan(0);
  expect(mapped.some(([, asset]) => asset.modules.some((source: string) =>
    /(?:^|\/)product\/(?:apps\/web|packages)\//.test(source) && !source.includes('/node_modules/'))),
    'mapped chunks must include first-party product modules').toBe(true);
  for (const route of routeMapping) {
    expect(route.executed, route.path + ' executed script count').toBeGreaterThan(0);
    expect(route.mappedExecuted, route.path + ' executed mapped script count').toBeGreaterThan(0);
  }
});
