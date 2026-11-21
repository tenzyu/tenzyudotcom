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
import { chromium } from '@playwright/test';
import { publicBrowserEnvironment } from './browser-environment.mjs';
import { initGitContentFixture } from './git-content-fixture.mjs';
import {
  article, blogIndexPath, firstNote, firstNoteId, firstPost, initialFiles, latePost,
  notesPath, reply, replyId, secondNote, secondNoteId, secondPost, serialize,
} from './publication-fixture.mjs';

process.umask(0o077);
const source = resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2);
const baseline = args[0] === '--baseline' && args[1];
assert.ok(args.length === 0 || (args.length === 2 && /^[0-9a-f]{40}$/.test(baseline)), 'Pass --baseline with an exact code commit');
const evidenceRoot = resolve(process.env.PUBLICATION_EVIDENCE_DIR ?? tmpdir());
assert.ok(evidenceRoot !== source && !evidenceRoot.startsWith(`${source}/`), 'Keep fixture evidence outside the checkout');
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
const git = initGitContentFixture(repository, initialFiles);
const revisionA = git.head();
const metrics = [];
const revisions = { A: revisionA };
let server;

const baseEnv = {
  ...publicBrowserEnvironment(),
  HOME: isolatedHome,
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
  if (baseline) {
    const archive = capture('git', ['archive', baseline]);
    capture('tar', ['--exclude=.env*', '--exclude=*/.env*', '-xf', '-', '-C', checkout], { input: archive });
    return;
  }
  const paths = capture('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard']).toString().split('\0');
  for (const path of new Set(paths)) {
    if (!path || path.split('/').some(part => part.startsWith('.env') || part === '.git')) continue;
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
const ledger = () => existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];

function countReads(rows, route) {
  const ref = rows.filter(row => row.path === branchEndpoint);
  const count = (path) => rows.filter(row => row.path === contents(path)).length;
  const scrapsRefs = route === '/sitemap.xml'
    ? ref.filter(row => row.validator === null).slice(-1).length
    : 0;
  return {
    ref: ref.length - scrapsRefs,
    refStatuses: ref.map(row => row.status),
    index: count(blogIndexPath), notes: count(notesPath),
    bodies: rows.filter(row => row.path.startsWith(contents('storage/blog/')) && row.path.endsWith('.mdx')).length,
    scrapsRef: scrapsRefs, scrapsIndex: count('storage/scraps/index.json'),
  };
}

async function read(route, label, options = {}, measure = true) {
  const before = ledger().length;
  const started = performance.now();
  const response = await fetch(`${base}${route}`, {
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
  const counts = countReads(rows, route);
  if (measure) metrics.push({ label, route, status: response.status, elapsedMs: Math.round(performance.now() - started), ...counts });
  return { status: response.status, body, counts, rows };
}

function expectContains(result, expected, status = 200) {
  assert.equal(result.status, status, `Expected status ${status} and marker ${expected}`);
  assert.ok(result.body.includes(expected), `Missing response marker: ${expected}`);
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

const code = baseline || capture('git', ['rev-parse', 'HEAD']).toString().trim();
let buildId;
console.log(`Publication fixture evidence: ${evidence}`);
try {
  copyCheckout();
  run('bun', ['--no-env-file', 'install', '--frozen-lockfile'], checkout, baseEnv, 'install');
  run('bun', ['--no-env-file', 'nx', 'run', 'ui:build', '--skip-nx-cache'], checkout, baseEnv, 'ui-build');
  run('node', ['--input-type=module', '-e',
    'import { getTweet } from "react-tweet/api"; import assert from "node:assert/strict"; await assert.rejects(getTweet("123"), error => error.name === "TwitterApiError" && error.status === 403);'],
  app, { ...env, PUBLICATION_TWEET_STATUS: '403' }, 'provider-error-control');
  run('node', [next, 'build'], app, env, 'next-build');
  buildId = readFileSync(join(app, '.next/BUILD_ID'), 'utf8');
  await start('next-start');
  if (baseline) await baselineControl();
  else await productionAcceptance();
  console.log(`Publication ${baseline ? 'control' : 'acceptance'} passed on ${code}, build ${buildId}`);
} finally {
  await stop();
  writeFileSync(join(evidence, 'results.json'), serialize({ code, buildId, revisions, requests: metrics }));
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
    await page.goto(`${base}/en/editor/blog?create=1`);
    await page.waitForURL('**/editor/login');
    await page.locator('input[name="password"]').fill(env.EDITOR_ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();
    await page.waitForURL(`${base}/en/editor`);
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
      assert.deepEqual(result.counts, { ref: 1, refStatuses: [304], index: 0, notes: 0, bodies: 0, scrapsRef: 0, scrapsIndex: 0 }, route);
    }
  }
  const sitemap = await read('/sitemap.xml', 'B warm sitemap budget');
  assert.deepEqual(sitemap.counts, { ref: 1, refStatuses: [304, 200], index: 0, notes: 0, bodies: 0, scrapsRef: 1, scrapsIndex: 1 });
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
        for (const route of [`${prefix}/blog`, `${prefix}/blog/late`, `${prefix}/notes`, `${prefix}/notes/${replyId}`]) {
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
}
