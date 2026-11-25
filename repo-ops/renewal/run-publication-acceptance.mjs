import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import {
  copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync,
  readFileSync, renameSync, rmSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import { publicBrowserEnvironment } from './browser-environment.mjs';
import { externalEvidencePath } from './external-evidence-path.mjs';
import { initGitContentFixture } from './git-content-fixture.mjs';
import {
  article, blogIndexPath, directLink, directScrap, firstNote, firstNoteId, firstPost, initialFiles, latePost,
  linksPath, notesPath, reply, replyId, scrap, scrapsIndexPath, secondNote, secondNoteId, secondPost, seededLink, seededScrap, serialize,
} from './publication-fixture.mjs';

process.umask(0o077);
const source = resolve(import.meta.dirname, '../..');
const { values: options } = parseArgs({ options: {
  baseline: { type: 'string' },
  'scraps-baseline': { type: 'string' },
  'scraps-build': { type: 'string', default: 'empty' },
} });
assert.ok(!(options.baseline && options['scraps-baseline']), 'Choose one baseline control');
const baseline = options.baseline ?? options['scraps-baseline'];
assert.ok(baseline === undefined || /^[0-9a-f]{40}$/.test(baseline), 'Pass an exact baseline commit');
const buildSeed = options['scraps-build'];
assert.ok(['empty', 'populated'].includes(buildSeed), 'Choose an empty or populated Scrap build');
const evidenceRoot = externalEvidencePath(source, process.env.PUBLICATION_EVIDENCE_DIR ?? tmpdir(), { disjoint: false });
mkdirSync(evidenceRoot, { recursive: true, mode: 0o700 });
const evidence = mkdtempSync(join(evidenceRoot, 'publication-'));
const checkout = join(evidence, 'workspace');
const app = join(checkout, 'product/apps/web');
const repository = join(evidence, 'content.git');
const ledgerPath = join(evidence, 'origin.jsonl');
const rulePath = join(evidence, 'rule.json');
const isolatedHome = join(evidence, 'home');
mkdirSync(checkout);
mkdirSync(isolatedHome);
const git = initGitContentFixture(repository, buildSeed === 'populated' ? {
  ...initialFiles,
  ...seededScrap.files,
  [scrapsIndexPath]: serialize([seededScrap.projection]),
} : initialFiles);
const revisionA = git.head();
const metrics = [];
const revisions = { A: revisionA };
let server;

const baseEnv = {
  ...publicBrowserEnvironment(),
  HOME: isolatedHome,
  PATH: `${join(checkout, 'node_modules/.bin')}:${process.env.PATH}`,
  ...(process.env.BIOME_BIN ? { BIOME_BIN: process.env.BIOME_BIN } : {}),
};
const env = {
  ...baseEnv,
  NODE_ENV: 'production',
  TZ: 'UTC',
  EDITOR_ADMIN_PASSWORD: 'publication-fixture-password',
  EDITOR_SESSION_SECRET: 'publication-fixture-signing-value-not-a-secret',
  GITHUB_CONTENT_OWNER: 'fixture',
  GITHUB_CONTENT_REPO: 'editor',
  PUBLICATION_APP_ROOT: app,
  PUBLICATION_CONTROL_DIR: evidence,
  PUBLICATION_FIXTURE_REPO: repository,
  NODE_OPTIONS: `--import=${pathToFileURL(join(import.meta.dirname, 'publication-github-preload.mjs'))}`,
};

function capture(command, args, { cwd = source, input } = {}) {
  const result = spawnSync(command, args, { cwd, input, maxBuffer: 128 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr.toString());
  return result.stdout;
}

function copyCheckout() {
  const safePaths = (output) => output.toString().split('\0').filter(path =>
    path && !path.split('/').some(part => part.startsWith('.env') || part === '.git'));
  if (baseline) {
    const paths = safePaths(capture('git', ['ls-tree', '-rz', '--name-only', baseline]));
    const archive = capture('git', ['archive', baseline, '--', ...paths]);
    capture('tar', ['-xf', '-', '-C', checkout], { input: archive });
    return;
  }
  const paths = safePaths(capture('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard']));
  for (const path of new Set(paths)) {
    const from = join(source, path);
    if (!existsSync(from)) continue;
    assert.ok(lstatSync(from).isFile(), `Unsupported test checkout entry: ${path}`);
    const destination = join(checkout, path);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(from, destination);
  }
}

function run(command, args, cwd, environment, label) {
  const logPath = join(evidence, `${label}.log`);
  const log = openSync(logPath, 'w', 0o600);
  const result = spawnSync(command, args, { cwd, env: environment, stdio: ['ignore', log, log] });
  if (result.error) throw result.error;
  if (result.status !== 0 && (label === 'next-build' || label === 'ui-build')) {
    // These builds use the isolated publication fixture, not production credentials.
    console.error(readFileSync(logPath, 'utf8').slice(-24000));
  }
  assert.equal(result.status, 0, `${label} exited ${result.status}. See ${logPath}`);
}

const next = join(checkout, 'node_modules/next/dist/bin/next');
const allocation = createServer();
await new Promise(resolve => allocation.listen(0, '127.0.0.1', resolve));
const { port } = allocation.address();
await new Promise((resolve, reject) => allocation.close(error => error ? reject(error) : resolve()));
const base = `http://127.0.0.1:${port}`;

async function start(label) {
  const log = openSync(join(evidence, `${label}.log`), 'w', 0o600);
  server = spawn('node', [next, 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: app, env, stdio: ['ignore', log, log],
  });
  let spawnError;
  server.once('error', error => { spawnError = error; });
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    assert.equal(server.exitCode, null, `next start exited. See ${label}.log`);
    try {
      const response = await fetch(`${base}/en/tools`, { signal: AbortSignal.timeout(5000) });
      await response.text();
      if (response.ok) return;
    } catch {}
    await delay(150);
  }
  throw new Error(`next start did not respond. See ${label}.log`);
}

async function stop() {
  const running = server;
  if (!running || running.exitCode !== null || running.signalCode !== null) return;
  const exited = once(running, 'exit');
  running.kill('SIGTERM');
  await exited;
  server = undefined;
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => { server?.kill(signal); process.exit(signal === 'SIGINT' ? 130 : 143); });
}

const branchEndpoint = '/repos/fixture/editor/git/ref/heads/main';
const contents = (path) => `/repos/fixture/editor/contents/${path}`;
const localePrefixes = ['', '/en'];
const scrapRoute = (slug, prefix = '') => `${prefix}/scraps/${slug}`;
const scrapUrl = (slug, locale) => `https://tenzyu.com${scrapRoute(slug, locale === 'en' ? '/en' : '')}`;
const privateEntry = 'Fixture private entry body must stay private.';
const staleLead = 'Fixture stale lead must stay private.';
const draftLead = 'Fixture machine draft must stay private.';
const ledger = () => existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];

function countReads(rows) {
  const ref = rows.filter(row => row.path === branchEndpoint);
  const count = (path) => rows.filter(row => row.path === contents(path)).length;
  const payloads = rows.filter(row => row.method === 'GET' && row.path.startsWith(contents('storage/')));
  const scrapPayloads = payloads.filter(row => row.path.startsWith(contents('storage/scraps/')));
  return {
    ref: ref.length,
    refStatuses: ref.map(row => row.status),
    payloads: payloads.length,
    missingPayloads: payloads.filter(row => row.status === 404).length,
    index: count(blogIndexPath), notes: count(notesPath),
    bodies: payloads.filter(row => row.path.startsWith(contents('storage/blog/')) && row.path.endsWith('.mdx')).length,
    scrapsIndex: count(scrapsIndexPath),
    scrapManifests: scrapPayloads.filter(row => row.path.endsWith('/manifest.json')).length,
    scrapEntries: scrapPayloads.filter(row => row.path.endsWith('/meta.json')).length,
    scrapBodies: scrapPayloads.filter(row => row.path.endsWith('.mdx')).length,
    links: count(linksPath),
  };
}

async function read(route, label, options = {}, measure = true) {
  const before = ledger().length;
  const started = performance.now();
  const url = new URL(`${base}${route}`);
  // Next 16.4 validates the RSC cache-busting query against the router headers.
  // This fixture sends only RSC: 1 (no prefetch, state tree or next-url), so
  // the protocol requires an empty _rsc value, not an absent parameter.
  if (new Headers(options.headers).get('rsc') === '1') {
    url.searchParams.set('_rsc', '');
  }
  const response = await fetch(url, {
    ...options,
    headers: {
      'accept-language': route.startsWith('/en') ? 'en-US' : 'ja-JP',
      'user-agent': 'Googlebot',
      ...options.headers,
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(95_000),
  });
  const body = await response.text();
  const rows = measure ? ledger().slice(before) : [];
  const counts = countReads(rows);
  const location = response.headers.get('location');
  const cacheControl = response.headers.get('cache-control');
  if (measure) metrics.push({ label, route, status: response.status, ...(location && { location }), elapsedMs: Math.round(performance.now() - started), ...counts });
  if (new Headers(options.headers).get('rsc') === '1' && response.status === 200) {
    assert.match(response.headers.get('content-type') ?? '', /^text\/x-component(?:;|$)/i, `Expected RSC payload for ${route}`);
  }
  return { status: response.status, body, location, cacheControl, counts, rows, route };
}

function expectContains(result, expected, status = 200) {
  assert.equal(result.status, status, `Expected status ${status} and marker ${expected} for ${result.route ?? 'unknown route'}${result.location ? `; Location: ${result.location}` : ''}`);
  assert.ok(result.body.includes(expected), `Missing response marker: ${expected}`);
}

function expectWarm(result, route, absent = []) {
  assert.equal(result.counts.ref, 1, route);
  assert.deepEqual(result.counts.refStatuses, [304], route);
  assert.equal(result.counts.payloads, absent.length, route);
  assert.deepEqual(
    result.rows.filter(row => row.path.startsWith(contents('storage/'))).map(row => [row.path, row.status]).sort(),
    absent.map(path => [contents(path), 404]).sort(),
    route,
  );
}

async function warmA() {
  for (const prefix of ['', '/en']) {
    const home = await read(prefix || '/', 'A home');
    expectContains(home, firstPost.projection.metadata.title);
    expectContains(home, prefix ? firstNote.body.en : firstNote.body.ja);
    expectContains(await read(`${prefix}/blog`, 'A list'), firstPost.projection.metadata.title);
    expectContains(await read(`${prefix}/notes`, 'A notes'), prefix ? firstNote.body.en : firstNote.body.ja);
    expectContains(await read(`${prefix}/blog/first`, 'A article'), 'Fixture article body A.');
    expectContains(await read(`${prefix}/notes/${firstNoteId}`, 'A note detail'), prefix ? firstNote.body.en : firstNote.body.ja);
    assert.equal((await read(`${prefix}/blog/second`, 'A missing article')).status, 404);
    assert.equal((await read(`${prefix}/notes/${secondNoteId}`, 'A missing note')).status, 404);
  }
  expectContains(await read('/sitemap.xml', 'A sitemap'), `/notes/${firstNoteId}`);
}

async function baselineControl() {
  // The baseline may fetch a new article body while its cached catalog and notes stay at A.
  for (const prefix of ['', '/en']) {
    expectContains(await read(prefix || '/', 'A baseline home'), firstPost.projection.metadata.title);
    expectContains(await read(`${prefix}/blog`, 'A baseline blog list'), firstPost.projection.metadata.title);
    expectContains(await read(`${prefix}/blog/first`, 'A baseline article'), 'Fixture article body A.');
    expectContains(await read(`${prefix}/blog/first`, 'A baseline warm article'), 'Fixture article body A.');
    expectContains(await read(`${prefix}/notes/${firstNoteId}`, 'A baseline detail'), prefix ? firstNote.body.en : firstNote.body.ja);
  }
  expectContains(await read('/sitemap.xml', 'A baseline sitemap'), `/notes/${firstNoteId}`);
  revisions.B = git.advance({
    [blogIndexPath]: serialize([secondPost.projection, firstPost.projection, latePost.projection]),
    [secondPost.path]: secondPost.source,
    [notesPath]: serialize([secondNote, firstNote]),
  }, 'Direct baseline update B');
  for (const prefix of ['', '/en']) {
    expectContains(await read(`${prefix}/blog/second`, 'B baseline article'), 'Fixture article body B.');
    const blog = await read(`${prefix}/blog`, 'B baseline stale blog list');
    expectContains(blog, firstPost.projection.metadata.title);
    assert.ok(!blog.body.includes(secondPost.projection.metadata.title));
    assert.equal((await read(`${prefix}/notes/${secondNoteId}`, 'B baseline stale note')).status, 404);
    const list = await read(`${prefix}/notes`, 'B baseline stale list');
    expectContains(list, prefix ? firstNote.body.en : firstNote.body.ja);
    assert.ok(!list.body.includes(prefix ? secondNote.body.en : secondNote.body.ja));
  }
  const sitemap = await read('/sitemap.xml', 'B baseline stale sitemap');
  assert.equal(sitemap.status, 200);
  assert.ok(!sitemap.body.includes(`/notes/${secondNoteId}`));
}

function directPublication() {
  return git.advance({
    ...directScrap.files,
    [scrapsIndexPath]: serialize([...readScrapIndex(), directScrap.projection]),
    [linksPath]: serialize([seededLink, directLink]),
  }, 'Publish a Scrap and Link directly in Git');
}

function readScrapIndex(revision = git.head()) {
  return JSON.parse(git.file(revision, scrapsIndexPath));
}

async function scrapsBaselineControl() {
  const scrapRoute = `/scraps/${directScrap.manifest.slug}`;
  const linkRoute = `/links/${directLink.shortenUrl}`;
  for (const prefix of ['', '/en']) {
    assert.equal((await read(`${prefix}/scraps`, 'Baseline warm Scrap list')).status, 200);
    const absent = await read(`${prefix}${scrapRoute}`, 'Baseline warm missing Scrap');
    assert.equal(absent.status, buildSeed === 'empty' ? 500 : 404);
    if (buildSeed === 'populated') {
      expectContains(await read(`${prefix}/scraps/${seededScrap.manifest.slug}`, 'Baseline built Scrap'), seededScrap.manifest.title);
    }
    expectContains(await read(`${prefix}/links`, 'Baseline warm Links'), seededLink.name);
    const short = await read(`${prefix}${linkRoute}`, 'Baseline warm missing short');
    assert.equal(short.status, 307);
    assert.deepEqual(new Set(short.location?.split(', ')), new Set([prefix || '/']));
  }
  assert.equal((await read('/sitemap.xml', 'Baseline warm sitemap')).status, 200);
  revisions.direct = directPublication();
  for (const prefix of ['', '/en']) {
    await read(`${prefix}/scraps`, 'Baseline direct Scrap list');
    const detail = await read(`${prefix}${scrapRoute}`, 'Baseline direct Scrap detail');
    assert.equal(detail.status, buildSeed === 'empty' ? 500 : 200);
    const links = await read(`${prefix}/links`, 'Baseline stale Links');
    expectContains(links, seededLink.name);
    assert.ok(!links.body.includes(directLink.name));
    const short = await read(`${prefix}${linkRoute}`, 'Baseline stale short');
    assert.equal(short.status, 307);
    assert.deepEqual(new Set(short.location?.split(', ')), new Set([prefix || '/']));
  }
  expectContains(await read('/sitemap.xml', 'Baseline direct sitemap'), scrapRoute);
}

const code = baseline || capture('git', ['rev-parse', 'HEAD']).toString().trim();
let buildId;
console.log(`Publication fixture evidence: ${evidence}`);
try {
  copyCheckout();
  run('bun', ['--no-env-file', 'install', '--frozen-lockfile'], checkout, baseEnv, 'install');
  run('bun', ['--no-env-file', 'run', 'build'], join(checkout, 'product/packages/ui'), baseEnv, 'ui-build');
  run('node', ['--input-type=module', '-e',
    'import { getTweet } from "react-tweet/api"; import assert from "node:assert/strict"; await assert.rejects(getTweet("123"), error => error.name === "TwitterApiError" && error.status === 403);'],
  app, { ...env, PUBLICATION_TWEET_STATUS: '403' }, 'provider-error-control');
  run('node', [next, 'build'], app, env, 'next-build');
  buildId = readFileSync(join(app, '.next/BUILD_ID'), 'utf8');
  await start('next-start');
  if (options['scraps-baseline']) await scrapsBaselineControl();
  else if (baseline) await baselineControl();
  else await productionAcceptance();
  console.log(`Publication ${baseline ? 'control' : 'acceptance'} passed on ${code}, build ${buildId}`);
} finally {
  await stop();
  writeFileSync(join(evidence, 'results.json'), serialize({ code, buildSeed, buildId, revisions, requests: metrics }));
  rmSync(checkout, { recursive: true, force: true });
}

function readIndex(revision = git.head()) {
  return JSON.parse(git.file(revision, blogIndexPath).toString());
}

function noteWriteVersion(revision = git.head()) {
  return createHash('sha256').update((git.file(revision, notesPath)?.toString() ?? '').trimEnd()).digest('hex');
}

function exactArticle(result, title, body, prefix, slug) {
  expectContains(result, `<title>${title} | `);
  expectContains(result, body);
  expectContains(result, `rel="canonical" href="https://tenzyu.com${prefix}/blog/${slug}"`);
  expectContains(result, `<html lang="${prefix ? 'en' : 'ja'}"`);
}

async function editorPublish() {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, env: baseEnv });
  try {
    const context = await browser.newContext({ timezoneId: 'UTC', locale: 'en-US' });
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const page = await context.newPage();
    assert.equal((await context.request.get(`${base}/api/editor/notes`)).status(), 401);
    await signInEditor(page, '/en/editor/blog?create=1');
    await page.goto(`${base}/en/editor/blog?create=1`);
    const main = page.getByRole('main');
    await main.getByLabel('Slug', { exact: true }).fill('second');
    await main.getByLabel('Title', { exact: true }).fill(secondPost.projection.metadata.title);
    await main.getByLabel('Summary', { exact: true }).fill(secondPost.projection.metadata.summary);
    await main.getByLabel('Published at', { exact: true }).fill('2026-03-03T00:00');
    await main.getByLabel('Tags, separated by commas').fill('fixture');
    await main.getByLabel('Content, in MDX').fill('Fixture article body B.\n\n<KoFiLink label="Fixture publication support" />\n');
    await main.getByRole('button', { name: 'Save post', exact: true }).click();
    const receipt = main.getByRole('status').locator('code');
    await receipt.waitFor({ state: 'visible' });
    revisions.blogPublication = await receipt.textContent();
    assert.equal(revisions.blogPublication, git.head());
    assert.deepEqual(git.parents(revisions.blogPublication), [revisionA]);
    assert.ok(git.file(revisions.blogPublication, secondPost.path).toString().includes('Fixture article body B.'));
    assert.ok(readIndex().some(post => post.slug === 'second'));
    // Chromium's loopback exception for Secure cookies is part of this session.
    const editorApi = (collection, data) => page.evaluate(async ({ collection, data }) => {
      const response = await fetch(`/api/editor/${collection}`, data ? {
        method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
      } : undefined);
      return { status: response.status, body: await response.json() };
    }, { collection, data });
    const blogState = await editorApi('blog');
    assert.equal(blogState.status, 200);
    const edited = blogState.body.collection.find(post => post.slug === 'second');
    assert.equal(edited.version, git.listing(git.head()).find(item => item.path === secondPost.path).sha);
    assert.equal(edited.metadata.title, secondPost.projection.metadata.title);

    const loaded = await editorApi('notes');
    assert.equal(loaded.status, 200);
    assert.equal(loaded.body.version, noteWriteVersion());
    const put = await editorApi('notes', {
      sourceJson: serialize([secondNote, reply, firstNote]), expectedVersion: loaded.body.version,
    });
    assert.equal(put.status, 200, JSON.stringify(put.body));
    revisions.B = git.head();
    assert.deepEqual(git.parents(revisions.B), [revisions.blogPublication]);
    assert.equal(put.body.version, noteWriteVersion());
    const reread = await editorApi('notes');
    assert.equal(reread.body.version, put.body.version);
    await context.close();
  } finally {
    await browser.close();
  }
}

async function signInEditor(page, route) {
  await page.goto(`${base}${route}`);
  await page.waitForURL('**/editor/login');
  await page.locator('input[name="password"]').fill(env.EDITOR_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await page.waitForURL(`${base}/en/editor`);
}

function setRule(rule) {
  const staged = join(evidence, 'rule-next.json');
  writeFileSync(staged, serialize(rule));
  renameSync(staged, rulePath);
}

async function waitHeld(label) {
  const path = join(evidence, `${label}.held`);
  const deadline = Date.now() + 30_000;
  while (!existsSync(path)) {
    if (Date.now() > deadline) throw new Error(`Fixture did not hold ${label}`);
    await delay(20);
  }
  return Number(readFileSync(path, 'utf8'));
}

function release(label) {
  writeFileSync(join(evidence, `${label}.release`), '');
}

async function withFault(rule, operation) {
  setRule(rule);
  try { return await operation(); }
  finally { unlinkSync(rulePath); }
}

async function verifyBudget() {
  for (const prefix of ['', '/en']) {
    for (const route of [prefix || '/', `${prefix}/blog`, `${prefix}/blog/second`, `${prefix}/notes`, `${prefix}/notes/${secondNoteId}`]) {
      const result = await read(route, 'B warm budget');
      assert.equal(result.status, 200, route);
      expectWarm(result, route);
    }
  }
  const sitemap = await read('/sitemap.xml', 'B warm sitemap budget');
  assert.equal(sitemap.status, 200);
  expectWarm(sitemap, '/sitemap.xml');
}

async function verifyB() {
  for (const prefix of ['', '/en']) {
    const home = await read(prefix || '/', 'B home');
    expectContains(home, secondPost.projection.metadata.title);
    expectContains(home, prefix ? secondNote.body.en : secondNote.body.ja);
    assert.equal(home.counts.bodies, 0);
    const list = await read(`${prefix}/blog`, 'B list');
    expectContains(list, `href="${prefix}/blog/second"`);
    assert.equal(list.counts.bodies, 0);
    const post = await read(`${prefix}/blog/second`, 'B article');
    exactArticle(post, secondPost.projection.metadata.title, 'Fixture article body B.', prefix, 'second');
    expectContains(post, `href="${prefix}/blog/first"`);
    expectContains(post, 'Fixture publication support');
    expectContains(post, 'https://ko-fi.com/tenzyu');
    assert.ok(post.counts.bodies <= 1);
    expectContains(await read(`${prefix}/notes`, 'B note list'), prefix ? secondNote.body.en : secondNote.body.ja);
    expectContains(await read(`${prefix}/notes/${secondNoteId}`, 'B note detail'), prefix ? secondNote.body.en : secondNote.body.ja);
    expectContains(await read(`${prefix}/notes/${replyId}`, 'B threaded reply'), prefix ? reply.body.en : reply.body.ja);
  }
  const sitemap = await read('/sitemap.xml', 'B sitemap');
  expectContains(sitemap, 'https://tenzyu.com/en/blog/second');
  expectContains(sitemap, `https://tenzyu.com/en/notes/${secondNoteId}`);
}

async function verifyWithdrawal() {
  for (const prefix of ['', '/en']) {
    const body = prefix ? secondNote.body.en : secondNote.body.ja;
    assert.equal((await read(`${prefix}/notes/${secondNoteId}`, 'withdrawn detail')).status, 404);
    for (const headers of [{}, { rsc: '1' }]) {
      const feed = await read(`${prefix}/notes`, headers.rsc ? 'withdrawn RSC feed' : 'withdrawn HTML feed', { headers });
      expectContains(feed, prefix ? reply.body.en : reply.body.ja);
      assert.ok(!feed.body.includes(body), 'Withdrawn note text leaked');
      const payload = feed.body.replaceAll('\\"', '"');
      assert.ok(!payload.includes(`"id":"${secondNoteId}"`), 'Withdrawn note DTO leaked');
      assert.ok(!payload.includes(`href="${prefix}/notes/${secondNoteId}"`), 'Hidden parent was linked');
    }
    const home = await read(prefix || '/', 'withdrawn home');
    expectContains(home, prefix ? reply.body.en : reply.body.ja);
    assert.ok(!home.body.includes(body));
    const child = await read(`${prefix}/notes/${replyId}`, 'published child permalink');
    expectContains(child, prefix ? reply.body.en : reply.body.ja);
    assert.ok(!child.body.includes(body));
  }
  const sitemap = await read('/sitemap.xml', 'withdrawn sitemap');
  expectContains(sitemap, `https://tenzyu.com/en/notes/${replyId}`);
  assert.ok(!sitemap.body.includes(`/notes/${secondNoteId}`));
}

async function productionAcceptance() {
  await warmA();

  // The direct change occurs while a request pinned at A still awaits its body.
  setRule({ path: contents(latePost.path), ref: revisionA, hold: 'old-body' });
  const oldBody = read('/en/blog/late', 'held A body', {}, false);
  assert.equal(await waitHeld('old-body'), 200);
  try {
    await editorPublish();
    await verifyB();
    await verifyBudget();

    const direct = article('late', 'Fixture Late C', '2026-03-04T00:00:00.000Z', 'Fixture late body C.');
    revisions.C = git.advance({
      [blogIndexPath]: serialize([direct.projection, ...readIndex().filter(post => post.slug !== 'late')]),
      [direct.path]: direct.source,
    }, 'Direct Git correction C');
    for (const prefix of ['', '/en']) {
      const current = await read(`${prefix}/blog/late`, 'C direct article');
      exactArticle(current, direct.projection.metadata.title, 'Fixture late body C.', prefix, 'late');
      assert.ok(!current.body.includes('Fixture late body A.'));
      assert.ok(current.counts.bodies <= 1);
    }
  } finally {
    release('old-body');
  }
  const prior = await oldBody;
  exactArticle(prior, latePost.projection.metadata.title, 'Fixture late body A.', '/en', 'late');
  assert.ok(!prior.body.includes('Fixture Late C') && !prior.body.includes(secondPost.projection.metadata.title));
  expectContains(await read('/en/blog/late', 'C after late A fill'), 'Fixture late body C.');

  // A 304 can arrive after another render has stored a different validator.
  setRule({ path: branchEndpoint, validator: `"${revisions.C}"`, hold: 'old-validator' });
  const oldValidator = read(`/en/notes/${secondNoteId}`, 'held C validator', {}, false);
  assert.equal(await waitHeld('old-validator'), 304);
  try {
    const notes = JSON.parse(git.file(git.head(), notesPath).toString());
    revisions.D = git.advance({
      [notesPath]: serialize(notes.map(note => note.id === secondNoteId ? { ...note, published: false } : note)),
    }, 'Withdraw note D directly in Git');
    await verifyWithdrawal();
  } finally {
    release('old-validator');
  }
  expectContains(await oldValidator, secondNote.body.en);
  assert.equal((await read(`/en/notes/${secondNoteId}`, 'D after old 304')).status, 404);

  for (const status of [403, 404]) {
    await withFault({ path: branchEndpoint, status }, async () => {
      for (const prefix of ['', '/en']) {
        const home = await read(prefix || '/', `ref ${status} home shell`);
        expectContains(home, prefix ? 'Recent writing is temporarily unavailable.' : '最近の記録を読み込めませんでした。');
        for (const route of ['/blog', '/notes', '/scraps', '/links', '/tools', '/osu', '/portfolio']) {
          expectContains(home, `href="${prefix}${route}"`);
        }
        assert.ok(!home.body.includes('Fixture Late C'));
        for (const route of ['/blog', '/blog/late', '/notes', `/notes/${replyId}`, '/scraps', '/scraps/direct-scrap', '/links', '/links/seeded-link'].map(route => `${prefix}${route}`)) {
          assert.equal((await read(route, `ref ${status} unavailable`)).status, 500, route);
        }
      }
      assert.equal((await read('/sitemap.xml', `ref ${status} sitemap error`)).status, 500);
    });
  }
  await withFault({ path: contents('storage/blog/denied.mdx'), status: 403 }, async () => {
    assert.equal((await read('/en/blog/denied', 'body 403')).status, 500);
  });

  const broken = article('broken', 'Fixture Broken', '2026-03-05T00:00:00.000Z', 'Not returned.');
  const missing = article('missing', 'Fixture Missing', '2026-03-05T00:00:00.000Z', 'Not present.');
  revisions.E = git.advance({
    [blogIndexPath]: serialize([broken.projection, missing.projection, ...readIndex()]),
    [broken.path]: 'Invalid blog source without required frontmatter.\n',
  }, 'Inject bad indexed sources E');
  assert.equal((await read('/en/blog/broken', 'malformed body')).status, 500);
  assert.equal((await read('/en/blog/missing', 'indexed body absent')).status, 500);
  assert.equal((await read('/en/blog/unindexed', 'true article absence')).status, 404);

  const legacy = article('legacy', 'Fixture Legacy', '2026-03-05T00:00:00.000Z', 'Unlisted legacy body.');
  revisions.F = git.advance({ [blogIndexPath]: null, [notesPath]: null, [legacy.path]: legacy.source }, 'Empty projections F');
  for (const prefix of ['', '/en']) {
    const home = await read(prefix || '/', 'confirmed empty home');
    expectContains(home, prefix ? 'New writing will appear in the blog and notes.' : '新しい記録は、ブログとノートに掲載します。');
    assert.equal((await read(`${prefix}/blog`, 'confirmed empty catalog')).status, 200);
    assert.equal((await read(`${prefix}/notes`, 'confirmed empty notes')).status, 200);
    expectContains(await read(`${prefix}/blog/legacy`, 'unlisted legacy path'), 'Unlisted legacy body.');
    assert.equal((await read(`${prefix}/notes/${replyId}`, 'confirmed absent note')).status, 404);
  }

  await stop();
  await start('next-start-cold');
  const cold = await read('/en/blog/legacy', 'cold process same build');
  expectContains(cold, 'Unlisted legacy body.');
  assert.deepEqual(cold.rows.filter(row => row.path === branchEndpoint).map(row => [row.status, row.validator]), [[200, null]]);
  assert.equal(readFileSync(join(app, '.next/BUILD_ID'), 'utf8'), buildId);
  assert.deepEqual(ledger().filter(row => row.method !== 'GET').map(row => [row.method, row.path, row.status]), [
    ['POST', '/repos/fixture/editor/git/trees', 201],
    ['POST', '/repos/fixture/editor/git/commits', 201],
    ['PATCH', '/repos/fixture/editor/git/refs/heads/main', 200],
    ['PUT', contents(notesPath), 200],
  ]);
  await verifyScrapsAndLinks();
  await verifyBlogAliases();
}

async function verifyBlogAliases() {
  const original = article('rename-proof-a', 'Fixture canonical article', '2026-07-01T00:00:00.000Z', 'Fixture canonical article body.');
  const prior = git.file(git.head(), blogIndexPath);
  const existing = prior ? JSON.parse(prior.toString()) : [];
  const b = 'rename-proof-b';
  const c = 'rename-proof-c';
  revisions.aliasFixture = git.advance({
    [original.path]: original.source,
    [blogIndexPath]: serialize([original.projection, ...existing]),
  }, 'Seed original Blog address');
  for (const prefix of localePrefixes) {
    exactArticle(await read(`${prefix}/blog/rename-proof-a`, 'Original Blog address'), original.projection.metadata.title, 'Fixture canonical article body.', prefix, 'rename-proof-a');
  }

  function move(old, next, aliases) {
    return git.advance({
      [`storage/blog/${old}.mdx`]: null,
      [`storage/blog/${next}.mdx`]: original.source,
      [blogIndexPath]: serialize([{
        ...original.projection, slug: next, pathname: `blog/${next}.mdx`, aliases,
      }, ...existing]),
    }, `Move fixture Blog address to ${next}`);
  }

  revisions.aliasFirstMove = move('rename-proof-a', b, ['rename-proof-a']);
  for (const prefix of localePrefixes) {
    const response = await read(`${prefix}/blog/rename-proof-a`, 'First Blog redirect');
    assert.equal(response.status, 307);
    assert.equal(new URL(response.location, base).pathname, `${prefix}/blog/${b}`);
  }

  revisions.aliasSecondMove = move(b, c, ['rename-proof-a', b]);
  for (const prefix of localePrefixes) {
    for (const old of ['rename-proof-a', b]) {
      const alias = await read(`${prefix}/blog/${old}?tag=fixture`, 'Current Blog alias redirect');
      assert.equal(alias.status, 307);
      assert.equal(new URL(alias.location, base).href, `${base}${prefix}/blog/${c}?tag=fixture`);
      assert.match(alias.cacheControl, /no-store/);
    }
    const post = await read(`${prefix}/blog/${c}`, 'Current canonical Blog article');
    exactArticle(post, original.projection.metadata.title, 'Fixture canonical article body.', prefix, c);
    expectWarm(await read(`${prefix}/blog/${c}`, 'Warm canonical Blog article'), `${prefix}/blog/${c}`);
    const list = await read(`${prefix}/blog`, 'Canonical Blog listing');
    expectContains(list, `href="${prefix}/blog/${c}"`);
    for (const old of ['rename-proof-a', b]) assert.ok(!list.body.includes(`href="${prefix}/blog/${old}"`));
  }
  const sitemap = await read('/sitemap.xml', 'Canonical Blog sitemap');
  expectContains(sitemap, `https://tenzyu.com/en/blog/${c}`);
  for (const old of ['rename-proof-a', b]) assert.ok(!sitemap.body.includes(`/blog/${old}`));
}

function alternates(markup, element) {
  return Object.fromEntries([...markup.matchAll(new RegExp(`<${element}\\b[^>]*>`, 'g'))].flatMap(([tag]) => {
    const locale = tag.match(/\bhreflang="([^"]+)"/i)?.[1];
    const url = tag.match(/\bhref="([^"]+)"/)?.[1];
    return locale && url ? [[locale, url]] : [];
  }));
}

function expectScrapDetail(result, { slug, title, summary }, prefix, lead, locales) {
  const locale = prefix ? 'en' : 'ja';
  expectContains(result, `<html lang="${locale}"`);
  expectContains(result, `<title>${title} | `);
  expectContains(result, `<meta name="description" content="${summary}"`);
  expectContains(result, `<meta property="og:title" content="${title}"`);
  expectContains(result, `rel="canonical" href="${scrapUrl(slug, locale)}"`);
  expectContains(result, `<meta name="robots" content="${locales.includes(locale) ? 'index' : 'noindex'}, follow"`);
  assert.equal(result.body.match(/<h1\b[^>]*>([^<]*)<\/h1>/)?.[1], title);
  if (lead) expectContains(result, `<p>${lead}</p>`);
  assert.deepEqual(alternates(result.body, 'link'), Object.fromEntries(locales.map(locale => [locale, scrapUrl(slug, locale)])));
}

async function expectScrapListing({ slug, title }, locales, label) {
  for (const prefix of localePrefixes) {
    const list = await read(`${prefix}/scraps`, `${label} list`);
    expectContains(list, `href="${scrapRoute(slug, prefix)}"`);
    expectContains(list, title);
  }
  const sitemap = await read('/sitemap.xml', `${label} sitemap`);
  assert.equal(sitemap.status, 200);
  if (!locales.length) {
    assert.ok(!sitemap.body.includes(scrapRoute(slug)), slug);
    return;
  }
  const url = scrapUrl(slug, locales.includes('ja') ? 'ja' : 'en');
  const entry = sitemap.body.match(/<url>[\s\S]*?<\/url>/g)?.find(item => item.includes(`<loc>${url}</loc>`));
  assert.ok(entry, `Missing sitemap entry for ${url}`);
  assert.deepEqual(alternates(entry, 'xhtml:link'), {
    ...Object.fromEntries(locales.map(locale => [locale, scrapUrl(slug, locale)])),
    'x-default': url,
  });
}

async function expectHiddenScrap({ slug, title }, label, privateText = '') {
  for (const prefix of localePrefixes) {
    const url = scrapRoute(slug, prefix);
    const detail = await read(url, `${label} detail`, { headers: { 'user-agent': 'Mozilla/5.0 Chrome/149.0.0.0' } });
    assert.equal(detail.status, 404, url);
    const list = await read(`${prefix}/scraps`, `${label} list`);
    assert.equal(list.status, 200);
    assert.ok(!list.body.includes(`href="${url}"`));
    for (const response of [detail, list]) {
      assert.ok(!response.body.includes(title));
      if (privateText) assert.ok(!response.body.includes(privateText));
    }
  }
  const sitemap = await read('/sitemap.xml', `${label} sitemap`);
  assert.equal(sitemap.status, 200);
  assert.ok(!sitemap.body.includes(scrapRoute(slug)));
}

function expectRedirect(result, destination) {
  assert.equal(result.status, 307);
  assert.equal(result.location, destination);
}

async function verifyEditorScrap() {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, env: baseEnv });
  const slug = 'editor-scrap';
  const summary = 'Fixture editor summary.';
  const before = ledger().length;
  try {
    const context = await browser.newContext({ timezoneId: 'UTC', locale: 'en-US' });
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const page = await context.newPage();
    const route = '/en/editor/scraps?create=1';
    await signInEditor(page, route);
    await page.goto(`${base}${route}`);
    const main = page.getByRole('main');
    await main.getByLabel('Slug', { exact: true }).fill(slug);
    await main.getByLabel('Question or hypothesis').fill('Can a warmed reader open a publication?');
    await main.getByLabel('Summary', { exact: true }).fill(summary);
    const documentStart = await page.evaluate(() => performance.timeOrigin);
    page.on('dialog', dialog => dialog.accept());

    const draft = { title: 'Fixture Scrap Draft', lead: 'Only the editor can see this draft.' };
    const published = { title: 'Fixture Scrap Published', lead: 'Fixture published lead.' };
    const updated = { title: 'Fixture Scrap Updated', lead: 'Fixture updated lead.' };
    const stages = [
      { label: 'draft', ...draft, published: false, status: 'open' },
      { label: 'prepare', ...published, published: false, status: 'open' },
      { label: 'publish', ...published, published: true, status: 'open' },
      { label: 'update', ...updated, published: true, status: 'open' },
      { label: 'close', ...updated, published: true, status: 'closed' },
      { label: 'unpublish', ...updated, published: false, status: 'closed' },
      { label: 'archive', ...updated, published: false, status: 'archived' },
    ];
    for (const stage of stages) {
      const parent = git.head();
      if (['draft', 'prepare', 'update'].includes(stage.label)) {
        if (stage.label !== 'draft') await main.getByRole('button', { name: 'Edit lead', exact: true }).click();
        await main.getByLabel('Title', { exact: true }).fill(stage.title);
        await main.getByLabel('Lead, in MDX', { exact: true }).fill(stage.lead);
        const submit = main.getByRole('button', { name: stage.label === 'draft' ? 'Create draft' : 'Save details and lead', exact: true });
        await submit.click();
      } else {
        const labels = { publish: 'Publish scrap', close: 'Close scrap', unpublish: 'Unpublish', archive: 'Archive scrap' };
        await main.getByRole('button', { name: labels[stage.label], exact: true }).click();
      }
      await main.getByRole('status').filter({ hasText: 'Saved to Git' }).locator('code').filter({
        hasNotText: parent,
      }).waitFor({ state: 'visible' });
      await main.locator('[aria-busy="false"]').waitFor({ state: 'visible' });
      const revision = git.head();
      revisions[`scrap-${stage.label}`] = revision;
      assert.deepEqual(git.parents(revision), [parent]);
      const manifest = JSON.parse(git.file(revision, `storage/scraps/${slug}/manifest.json`));
      const index = readScrapIndex(revision).find(entry => entry.slug === slug);
      for (const stored of [index, manifest]) {
        assert.equal(stored.status, stage.status);
        assert.equal(stored.published, stage.published);
        assert.equal(stored.title, stage.title);
        assert.equal(stored.summary, summary);
      }
      assert.equal(git.file(revision, `storage/scraps/${slug}/lead.en.mdx`).toString().trimEnd(), stage.lead);
      const expected = { slug, title: stage.title, summary };
      if (!stage.published || stage.status === 'archived') {
        await expectHiddenScrap(expected, stage.label, stage.lead);
      } else {
        for (const prefix of localePrefixes) {
          const detail = await read(scrapRoute(slug, prefix), `${stage.label} detail`);
          expectScrapDetail(detail, expected, prefix, stage.lead, ['en']);
          if (stage.status === 'closed') expectContains(detail, prefix ? 'This scrap is closed.' : 'このスクラップはクローズされています。');
          if (!prefix) expectContains(detail, 'リクエストされた言語の翻訳がないため、主言語版を表示しています。');
          assert.ok(!detail.body.includes(draft.lead));
        }
        await expectScrapListing(expected, ['en'], stage.label);
      }
      if (stage.label === 'prepare' || stage.label === 'update') {
        await main.getByRole('button', { name: 'Back to Scrap controls' }).click();
      }
    }
    assert.equal(await page.evaluate(() => performance.timeOrigin), documentStart);
    assert.deepEqual(ledger().slice(before).filter(row => row.method !== 'GET').map(row => [row.method, row.status]),
      stages.flatMap(() => [['POST', 201], ['POST', 201], ['PATCH', 200]]));
  } finally {
    await browser.close();
  }
}

async function verifyScrapsAndLinks() {
  for (const prefix of localePrefixes) {
    for (const slug of ['editor-scrap', directScrap.manifest.slug, 'seeded']) {
      const initial = await read(scrapRoute(slug, prefix), 'Build seed detail');
      if (slug === 'seeded' && buildSeed === 'populated') {
        expectScrapDetail(initial, seededScrap.manifest, prefix, prefix ? 'Seeded English lead.' : '既存の公開スクラップ', ['ja', 'en']);
      } else {
        assert.equal(initial.status, 404);
      }
    }
    expectContains(await read(`${prefix}/links`, 'Warm seeded Links list'), seededLink.name);
    expectRedirect(await read(`${prefix}/links/${seededLink.shortenUrl}`, 'Warm seeded short'), seededLink.url);
    const absent = await read(`${prefix}/links/${directLink.shortenUrl}`, 'Warm missing short');
    expectRedirect(absent, prefix || '/');
  }
  expectContains(await read('/en/osu', 'Cached osu Links consumer'), seededLink.name);
  await verifyEditorScrap();
  const parent = git.head();
  const direct = revisions.scrapDirect = directPublication();
  assert.deepEqual(git.parents(direct), [parent]);
  await expectScrapListing(directScrap.manifest, ['ja', 'en'], 'Direct');
  const japanese = await read(scrapRoute(directScrap.manifest.slug), 'Direct JA detail');
  expectScrapDetail(japanese, directScrap.manifest, '', '直接コミットしたスクラップ', ['ja', 'en']);
  assert.equal(japanese.counts.scrapManifests, 1);
  assert.equal(japanese.counts.scrapBodies, 1);
  assert.ok(japanese.rows.filter(row => row.path.startsWith(contents('storage/scraps/'))).every(row => row.ref === direct));

  for (const prefix of localePrefixes) {
    expectContains(await read(`${prefix}/links`, 'Direct Links list'), directLink.name);
    expectRedirect(await read(`${prefix}/links/${directLink.shortenUrl}`, 'Direct short destination'), 'https://example.invalid/%E5%87%BA%E7%89%88?source=fixture');
    expectRedirect(await read(`${prefix}/links/${seededLink.shortenUrl}`, 'Existing short destination'), seededLink.url);
  }

  const slug = directScrap.manifest.slug;
  const heldPath = contents(`storage/scraps/${slug}/lead.en.mdx`);
  setRule({ path: heldPath, ref: direct, hold: 'scrap-old-lead' });
  const held = read(scrapRoute(slug, '/en'), 'Held direct Scrap', {}, false);
  assert.equal(await waitHeld('scrap-old-lead'), 200);
  const updated = scrap(slug, 'Fixture Direct Updated Scrap', {
    ja: { state: 'stale', text: staleLead },
    en: { state: 'original', text: 'Direct updated lead.' },
  }, { primaryLocale: 'en' });
  const unlisted = scrap('unlisted', 'Fixture Unlisted Scrap', { ja: { state: 'original', text: 'Unlisted lead.' } });
  const unreviewed = scrap('unreviewed', 'Fixture Unreviewed Scrap', { ja: { state: 'machine-draft', text: draftLead } });
  const hidden = scrap('hidden', 'Fixture Hidden Scrap', { ja: { state: 'original', text: 'Private Scrap lead.' } }, { published: false });
  const entry = `scraps/${slug}/entries/private`;
  updated.manifest.entryIds = ['private'];
  updated.projection.entryCount = 1;
  try {
    revisions.scrapNew = git.advance({
      ...updated.files, ...unlisted.files, ...unreviewed.files, ...hidden.files,
      [updated.manifestPath]: serialize(updated.manifest),
      [`storage/${entry}/meta.json`]: serialize({
        id: 'private', scrapSlug: slug, kind: 'note', createdAt: updated.manifest.createdAt, published: false,
        documents: [{ locale: 'en', pathname: `${entry}/entry.en.mdx`, state: 'original' }],
      }),
      [`storage/${entry}/entry.en.mdx`]: privateEntry,
      [scrapsIndexPath]: serialize([...readScrapIndex().filter(item => item.slug !== slug), updated.projection, hidden.projection, unreviewed.projection]),
    }, 'Update published Scrap and add read-policy controls');
    for (const prefix of localePrefixes) {
      const route = scrapRoute(slug, prefix);
      const html = await read(route, 'Fresh Scrap while prior revision is held');
      expectScrapDetail(html, updated.manifest, prefix, 'Direct updated lead.', ['en']);
      const rsc = await read(route, 'Warm Scrap RSC', { headers: { rsc: '1' } });
      expectContains(rsc, 'Direct updated lead.');
      for (const result of [html, rsc]) {
        assert.ok(!result.body.includes(staleLead));
        assert.ok(!result.body.includes(privateEntry));
        assert.ok(!result.rows.some(row => row.path === contents(`storage/${entry}/entry.en.mdx`)));
      }
    }
  } finally {
    release('scrap-old-lead');
  }
  const prior = await held;
  expectScrapDetail(prior, directScrap.manifest, '/en', 'Direct English lead.', ['ja', 'en']);
  assert.ok(!prior.body.includes(updated.manifest.title) && !prior.body.includes('Direct updated lead.'));
  const heldPayloads = ledger().filter(row => row.path === heldPath && row.ref === direct && row.status === 200);
  assert.equal(heldPayloads.length, 1);
  metrics.push({ label: 'Held prior Scrap detail', route: scrapRoute(slug, '/en'), status: prior.status, revision: direct, scrapBodies: heldPayloads.length });
  for (const prefix of localePrefixes) {
    for (const route of [`${prefix}/scraps`, scrapRoute(slug, prefix), `${prefix}/links`, `${prefix}/links/${directLink.shortenUrl}`]) {
      const expectedStatus = route.endsWith(directLink.shortenUrl) ? 307 : 200;
      assert.equal((await read(route, 'Prime payload cache')).status, expectedStatus);
      const warm = await read(route, 'Warm public payload budget');
      assert.equal(warm.status, expectedStatus);
      expectWarm(warm, route);
    }
  }
  await expectScrapListing(updated.manifest, ['en'], 'Updated direct');
  const sitemap = await read('/sitemap.xml', 'Warm shared sitemap payload budget');
  assert.equal(sitemap.status, 200);
  expectWarm(sitemap, '/sitemap.xml', [blogIndexPath, notesPath]);
  await expectHiddenScrap(hidden.manifest, 'Hidden', 'Private Scrap lead.');
  await expectScrapListing(unreviewed.manifest, [], 'No indexable locale');
  for (const prefix of localePrefixes) {
    const page = await read(scrapRoute(unreviewed.manifest.slug, prefix), 'Unreviewed detail');
    expectScrapDetail(page, unreviewed.manifest, prefix, null, []);
    assert.ok(!page.body.includes(draftLead));
  }

  await withFault({ path: contents('storage/scraps/unlisted/lead.ja.mdx'), status: 403 }, async () => {
    assert.equal((await read(scrapRoute('unlisted'), 'Unavailable lead')).status, 500);
  });
  for (const prefix of localePrefixes) {
    expectScrapDetail(await read(scrapRoute('unlisted', prefix), 'Unlisted public detail'), unlisted.manifest, prefix, 'Unlisted lead.', ['ja']);
    const list = await read(`${prefix}/scraps`, 'Omits unlisted Scrap');
    assert.equal(list.status, 200);
    assert.ok(!list.body.includes(unlisted.manifest.title));
  }
  const unlistedSitemap = await read('/sitemap.xml', 'Sitemap omits unlisted Scrap');
  assert.equal(unlistedSitemap.status, 200);
  assert.ok(!unlistedSitemap.body.includes(scrapRoute('unlisted')));
  await verifyScrapStorageFailures();
}

async function verifyScrapStorageFailures() {
  const missing = scrap('missing-lead', 'Fixture Missing Lead', { ja: { state: 'original', text: 'Unavailable.' } });
  const missingEntry = scrap('missing-entry', 'Fixture Missing Entry', { ja: { state: 'original', text: 'Required entry is absent.' } });
  const orphan = { ...missing.projection, slug: 'missing-manifest' };
  revisions.scrapBroken = git.advance({
    [missing.manifestPath]: serialize(missing.manifest),
    ...missingEntry.files,
    [missingEntry.manifestPath]: serialize({ ...missingEntry.manifest, entryIds: ['absent-entry'] }),
    'storage/scraps/malformed/manifest.json': serialize({ slug: 'malformed' }),
    [scrapsIndexPath]: serialize([...readScrapIndex(), missing.projection, orphan]),
    [linksPath]: serialize([seededLink, { ...directLink, shortenUrl: seededLink.shortenUrl }]),
  }, 'Inject missing Scrap files and invalid Links');
  for (const prefix of localePrefixes) {
    for (const path of ['/scraps/missing-lead', '/scraps/missing-entry', '/scraps/missing-manifest', '/scraps/malformed', '/links', '/links/seeded-link']) {
      assert.equal((await read(`${prefix}${path}`, 'Invalid storage')).status, 500, path);
    }
    assert.equal((await read(`${prefix}/scraps/absent`, 'Confirmed absence in same revision')).status, 404);
  }
  revisions.scrapBadIndex = git.advance({ [scrapsIndexPath]: serialize({ unexpected: [] }) }, 'Inject invalid Scrap index schema');
  for (const route of ['/scraps', '/en/scraps', '/sitemap.xml']) {
    assert.equal((await read(route, 'Invalid Scrap index')).status, 500, route);
  }
  revisions.scrapEmptyFiles = git.advance({ [scrapsIndexPath]: null, [linksPath]: null }, 'Remove optional projections');
  for (const prefix of localePrefixes) {
    assert.equal((await read(`${prefix}/scraps`, 'Confirmed empty Scrap list')).status, 200);
    assert.equal((await read(`${prefix}/links`, 'Confirmed empty Links')).status, 200);
    expectRedirect(await read(`${prefix}/links/${seededLink.shortenUrl}`, 'Confirmed absent short'), prefix || '/');
  }
}
