import { spawn } from 'node:child_process';
import { mkdirSync, openSync, closeSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [rootArg, outputArg, driver, executablePath] = process.argv.slice(2);
if (!rootArg || !outputArg || !driver || !executablePath) {
  throw new Error('Usage: node preview.mjs EVALUATION_REPO NEW_OUTPUT_DIR PLAYWRIGHT_INDEX_MJS CHROMIUM');
}
const root = resolve(rootArg);
const out = resolve(outputArg);
if (out === root || out.startsWith(`${root}/`)) throw new Error('Evidence must be outside the evaluation repository');
mkdirSync(out, { mode: 0o700 });
const log = openSync(`${out}/server.log`, 'wx', 0o600);
const env = Object.fromEntries(['PATH', 'HOME', 'LANG', 'LD_LIBRARY_PATH', 'SSL_CERT_FILE', 'NIX_SSL_CERT_FILE'].filter((key) => process.env[key]).map((key) => [key, process.env[key]]));
env.NEXT_TELEMETRY_DISABLED = '1';
const server = spawn(process.execPath, [`${root}/node_modules/next/dist/bin/next`, 'dev', '--hostname', '127.0.0.1', '--port', '0'], {
  cwd: `${root}/product/apps/web`, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
});
// Port 0 prevents attaching to an unrelated existing development server.
let serverOutput = '';
const { writeSync } = await import('node:fs');
for (const stream of [server.stdout, server.stderr]) stream.on('data', (data) => {
  writeSync(log, data);
  serverOutput = `${serverOutput}${data}`.slice(-32768);
});
let spawnError;
server.on('error', (error) => { spawnError = error; });
let browser;
const observations = [];
let cleanupPromise;
function cleanup() {
  return cleanupPromise ??= (async () => {
    if (server.pid) {
      try { process.kill(-server.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
      await new Promise((r) => setTimeout(r, 1000));
      try { process.kill(-server.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
    await Promise.race([browser?.close(), new Promise((r) => setTimeout(r, 1000))]);
    server.stdout.destroy();
    server.stderr.destroy();
    closeSync(log);
    writeFileSync(`${out}/observations.json`, `${JSON.stringify(observations, null, 2)}\n`, { mode: 0o600 });
  })();
}
for (const [signal, exitCode] of [['SIGTERM', 143], ['SIGINT', 130]]) {
  process.once(signal, () => { cleanup().finally(() => process.exit(exitCode)); });
}
try {
  let origin;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (spawnError) throw spawnError;
    if (server.exitCode !== null) throw new Error(`Server exited ${server.exitCode}`);
    origin = serverOutput.match(/http:\/\/127\.0\.0\.1:(\d+)/)?.[0];
    if (origin && serverOutput.includes('Ready in')) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!origin || !serverOutput.includes('Ready in')) throw new Error('Server readiness timeout');
  const { chromium } = await import(pathToFileURL(resolve(driver)).href);
  browser = await chromium.launch({ executablePath, headless: true });
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    for (const path of ['/ja/tools', '/ja', '/ja/archives/osu-profile', '/ja/portfolio']) {
      const page = await context.newPage();
      const events = [];
      const onError = (error) => events.push({ type: 'pageerror', message: error.message });
      const onConsole = (message) => { if (message.type() === 'error') events.push({ type: 'console', message: message.text() }); };
      const onFailure = (request) => events.push({ type: 'requestfailed', url: request.url(), error: request.failure()?.errorText });
      page.on('pageerror', onError);
      page.on('console', onConsole);
      page.on('requestfailed', onFailure);
      const item = { path, width, events };
      try {
        const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle', timeout: 60000 });
        item.status = response?.status();
        item.finalUrl = page.url();
        // prefix-no-default: explicit Japanese URLs canonically lose the /ja prefix.
        item.expectedPath = path.replace(/^\/ja(?=\/|$)/, '') || '/';
        item.correctDestination = new URL(item.finalUrl).pathname === item.expectedPath;
        item.title = await page.title();
        item.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        item.screenshot = `${width}-${path.replaceAll('/', '_')}.png`;
        await page.screenshot({ path: `${out}/${item.screenshot}`, fullPage: true });
      } catch (error) { item.error = error.message; }
      observations.push(item);
      page.off('pageerror', onError);
      page.off('console', onConsole);
      page.off('requestfailed', onFailure);
      await page.close();
    }
    await context.tracing.stop({ path: `${out}/trace-${width}.zip` });
    await context.close();
  }
} finally {
  await cleanup();
}
console.log(JSON.stringify(observations.map(({ events, ...item }) => ({ ...item, errorEvents: events.length }))));
process.exitCode = observations.length === 8 && observations.every((item) => item.status === 200 && item.correctDestination && !item.error && !item.horizontalOverflow && item.events.length === 0) ? 0 : 1;
