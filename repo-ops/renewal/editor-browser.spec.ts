import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { openGitContentFixture } from './git-content-fixture.mjs';

test('editor creates, edits, appends, publishes and serves only public content', async ({ page, browser, baseURL }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const reader = await browser.newContext();
  const publicPage = await reader.newPage();
  publicPage.on('pageerror', error => errors.push(error.message));
  const base = new URL('/en', baseURL).href;
  const slug = 'browser-proof';
  const title = 'Browser lifecycle proof';
  const saved = async () => {
    await expect(page.getByRole('link', { name: 'Load saved scrap', exact: true })).toBeVisible();
    await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
    await page.getByRole('link', { name: 'Load saved scrap', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Save details and lead', exact: true })).toBeEnabled();
  };
  const hidden = async () => {
    const response = await publicPage.goto(`${base}/scraps/${slug}`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(404);
    await expect(publicPage.getByText('Original fixture lead', { exact: true })).toHaveCount(0);
    await publicPage.goto(`${base}/scraps`);
    await expect(publicPage.getByRole('link', { name: title, exact: true })).toHaveCount(0);
  };
  await page.goto(`${base}/editor/scraps`, { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/editor\/login/);
  await page.locator('input[name="password"]').fill('fixture-password-not-a-secret');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await expect(page).toHaveURL(`${base}/editor`);
  await page.goto(`${base}/editor/scraps`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Create a scrap', exact: true }).click();
  await page.getByLabel('Slug', { exact: true }).fill(slug);
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Question or hypothesis').fill('Can the editor persist and publish a research log?');
  await page.getByLabel('Lead, in MDX', { exact: true }).fill('Original fixture lead');
  await page.getByRole('button', { name: 'Create scrap', exact: true }).click();
  await saved();
  await page.reload();
  await expect(page.getByLabel('Lead, in MDX', { exact: true })).toHaveValue('Original fixture lead');
  await expect(page.getByLabel('Published on the site')).not.toBeChecked();
  await hidden();
  await page.getByLabel('Lead, in MDX', { exact: true }).fill('Edited fixture lead survives reload.');
  await page.getByRole('button', { name: 'Save details and lead', exact: true }).click();
  await saved();
  await page.reload();
  await expect(page.getByLabel('Lead, in MDX', { exact: true })).toHaveValue('Edited fixture lead survives reload.');
  const append = page.locator('form').filter({ has: page.getByRole('button', { name: 'Append entry', exact: true }) });
  await append.getByLabel('Entry, in MDX', { exact: true }).fill('Published fixture entry survives reload.');
  await append.getByLabel('Published entry', { exact: true }).check();
  await append.getByRole('button', { name: 'Append entry', exact: true }).click();
  await saved();
  await page.reload();
  const entry = page.locator('form').filter({ has: page.getByRole('button', { name: 'Save entry', exact: true }) });
  await expect(entry.getByLabel('Entry, in MDX', { exact: true })).toHaveValue('Published fixture entry survives reload.');
  await append.getByLabel('Entry, in MDX', { exact: true }).fill('Private fixture entry must never reach readers.');
  await append.getByRole('button', { name: 'Append entry', exact: true }).click();
  await saved();
  await page.reload();
  await expect(page.getByLabel('Entry, in MDX', { exact: true }).filter({ hasText: 'Private fixture entry must never reach readers.' })).toHaveCount(1);
  await hidden();
  await page.getByLabel('Published on the site').check();
  await page.getByRole('button', { name: 'Save details and lead', exact: true }).click();
  await saved();
  await page.reload();
  await expect(page.getByLabel('Published on the site')).toBeChecked();
  await publicPage.goto(`${base}/scraps`, { waitUntil: 'networkidle' });
  await publicPage.getByRole('link', { name: title, exact: true }).click();
  await expect(publicPage).toHaveURL(`${base}/scraps/${slug}`);
  await expect(publicPage.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(publicPage.getByText('Edited fixture lead survives reload.', { exact: true })).toBeVisible();
  await expect(publicPage.getByText('Published fixture entry survives reload.', { exact: true })).toBeVisible();
  await expect(publicPage.getByText('Private fixture entry must never reach readers.', { exact: true })).toHaveCount(0);
  expect(await publicPage.content()).not.toContain('Private fixture entry must never reach readers.');
  await publicPage.reload();
  await expect(publicPage.getByText('Edited fixture lead survives reload.', { exact: true })).toBeVisible();
  await expect(publicPage.getByText('Published fixture entry survives reload.', { exact: true })).toBeVisible();
  await expect(publicPage.getByText('Private fixture entry must never reach readers.', { exact: true })).toHaveCount(0);
  await publicPage.screenshot({ path: testInfo.outputPath('published.png'), fullPage: true });
  expect(errors).toEqual([]);
  const ledger = readFileSync(resolve(process.env.PLAYWRIGHT_OUTPUT_DIR ?? '/tmp/tenzyudotcom-editor-evidence', 'github-ledger.jsonl'), 'utf8');
  expect(ledger).not.toContain('fixture-token');
  const rows = ledger.trim().split('\n');
  expect(rows.filter(row => /^\{"method":"PATCH","path":"\/repos\/fixture\/editor\/git\/refs\/heads\/main","status":200\}$/.test(row))).toHaveLength(5);
  const mutations = rows.filter(row => !row.startsWith('{"method":"GET"'));
  expect(mutations).toHaveLength(15);
  expect(mutations.every(row => /^\{"method":"(?:POST|PATCH)","path":"\/repos\/fixture\/editor\/git\/(?:trees|commits|refs\/heads\/main)","status":20[01]\}$/.test(row))).toBe(true);
  await testInfo.attach('github-ledger', { body: ledger, contentType: 'application/x-ndjson' });
  await reader.close();
});

test('blog editor preserves Git source, stale drafts and uncertain publication receipts', async ({ browser, baseURL }) => {
  if (!baseURL) throw new Error('The editor fixture needs a base URL');
  const base = baseURL;
  const output = resolve(process.env.PLAYWRIGHT_OUTPUT_DIR ?? '/tmp/tenzyudotcom-editor-evidence');
  const directory = readFileSync(resolve(output, 'fixture-path'), 'utf8');
  const git = openGitContentFixture(resolve(directory, 'content.git'));
  const ledger = () => readFileSync(resolve(output, 'github-ledger.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  const start = ledger().length;
  const context = await browser.newContext({ timezoneId: 'Asia/Tokyo' });
  const reader = await browser.newContext();
  const page = await context.newPage();
  const main = page.getByRole('main');
  const status = main.getByRole('status');
  const body = main.getByLabel('Content, in MDX');
  const save = main.getByRole('button', { name: 'Save post', exact: true });
  const check = main.getByRole('button', { name: 'Check publication', exact: true });
  const slug = 'fixture-atomic-blog';
  const post = `storage/blog/${slug}.mdx`;
  const index = 'storage/blog/index.json';
  const draft = 'Draft content with deliberate two spaces.  \n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n<KoFiLink label="Fixture support link" />\n';
  const editorPost = `${base}/en/editor/blog?slug=${slug}`;
  try {
    const initial = git.head();
    await page.goto(`${base}/en/editor/blog?create=1`);
    await expect(page).toHaveURL(/\/editor\/login/);
    expect((await reader.request.get(`${base}/api/editor/blog`)).status()).toBe(401);
    await page.locator('input[name="password"]').fill('fixture-password-not-a-secret');
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();
    await expect(page).toHaveURL(`${base}/en/editor`);
    await page.goto(`${base}/en/editor/blog?create=1`);
    await main.getByLabel('Slug', { exact: true }).fill(slug);
    await main.getByLabel('Title', { exact: true }).fill('Fixture article');
    await main.getByLabel('Summary', { exact: true }).fill('An invented article');
    await main.getByLabel('Published at', { exact: true }).fill('2026-04-18T18:20');
    await main.getByLabel('Tags, separated by commas').fill('second, first');
    await body.fill(draft);
    await save.click();
    await expect(status).toContainText('Saved.');
    const written = git.head();
    await expect(status).toContainText(written);
    expect(git.parents(written)).toEqual([initial]);
    const authored = git.file(written, post)!.toString();
    expect(authored).toContain('2026-04-18T09:20:00.000Z');
    expect(authored.endsWith(draft)).toBe(true);
    const entries = JSON.parse(git.file(written, index)!.toString());
    expect(entries[0]).toMatchObject({ slug, metadata: { publishedAt: '2026-04-18T09:20:00.000Z' } });

    entries[0].metadata.publishedAt = '2026-04-18T09:20:27.456Z';
    entries[0].metadata.image = '/fixture-cover.png';
    const header = authored.slice(0, -draft.length).replace('09:20:00.000Z', '09:20:27.456Z')
      .replace('summary: ', '# Keep this author comment\nimage: /fixture-cover.png\ncustom: { first: true }\nsummary: ');
    const crlfDraft = draft.replaceAll('\n', '\r\n');
    const precise = git.advance({
      [post]: header.replaceAll('\n', '\r\n') + crlfDraft,
      [index]: JSON.stringify(entries) + '\n',
    }, 'Add precise timestamp and authored metadata');

    const stale = await context.newPage();
    await stale.goto(editorPost);
    const staleMain = stale.getByRole('main');
    await expect(staleMain.getByLabel('Published at', { exact: true })).toHaveValue('2026-04-18T18:20');
    await page.goto(editorPost);
    await save.click();
    await expect(status).toContainText('No changes to save.');
    expect(git.head()).toBe(precise);
    await main.getByLabel('Title', { exact: true }).fill('Metadata-only update');
    await save.click();
    await expect(status).toContainText('Saved.');
    const updated = git.head();
    const updatedSource = git.file(updated, post)!.toString();
    expect(updatedSource).toContain('# Keep this author comment\r\nimage: /fixture-cover.png\r\ncustom: { first: true }');
    expect(updatedSource).toContain('2026-04-18T09:20:27.456Z');
    expect(updatedSource.endsWith(crlfDraft)).toBe(true);

    const unsaved = 'My stale form draft.  \n\n' + draft;
    const staleBody = staleMain.getByLabel('Content, in MDX');
    await staleBody.fill(unsaved);
    await staleMain.getByRole('button', { name: 'Save post', exact: true }).click();
    await expect(staleMain.getByRole('alert')).toContainText('reload the editor');
    await expect(staleBody).toHaveValue(unsaved);
    expect(git.head()).toBe(updated);
    await stale.close();

    await page.goto(editorPost);
    await body.fill(unsaved);
    writeFileSync(resolve(directory, 'drop-ref-response'), 'before', { mode: 0o600 });
    await save.click();
    await expect(main.getByRole('alert')).toContainText('Publication outcome unknown');
    const unreachable = (await main.getByRole('alert').locator('code').textContent())!;
    expect(git.isAncestor(unreachable, git.head())).toBe(false);
    await check.click();
    await expect(main.getByRole('alert')).toContainText('still unconfirmed');
    await expect(body).toHaveValue(unsaved);
    await expect(save).toHaveCount(0);
    expect(git.head()).toBe(updated);

    await page.goto(editorPost);
    const finalDraft = 'Fresh draft after checking Git.\n\n' + draft;
    await body.fill(finalDraft);
    writeFileSync(resolve(directory, 'drop-ref-response'), 'after', { mode: 0o600 });
    await save.click();
    await expect(main.getByRole('alert')).toContainText('Publication outcome unknown');
    const accepted = (await main.getByRole('alert').locator('code').textContent())!;
    expect(git.head()).toBe(accepted);
    const later = git.advance({ 'storage/fixture.txt': 'Unrelated revision\n' }, 'Advance fixture');
    await check.click();
    await expect(status).toContainText(later);
    await expect(status).toContainText(accepted);
    await expect(body).toHaveValue(finalDraft);
    expect(git.parents(accepted)).toEqual([updated]);
    expect(git.head()).toBe(later);

    const publicPage = await reader.newPage();
    expect((await publicPage.goto(`${base}/en/blog/${slug}`))?.status()).toBe(200);
    await expect(publicPage.getByRole('heading', { name: 'Metadata-only update', exact: true })).toBeVisible();
    await expect(publicPage.getByRole('table')).toBeVisible();
    await expect(publicPage.getByRole('button', { name: 'Fixture support link' })).toHaveAttribute('href', 'https://ko-fi.com/tenzyu');
    await expect(publicPage.getByText('Fresh draft after checking Git.', { exact: true })).toBeVisible();
    expect(ledger().slice(start).filter(row => row.method === 'PATCH').map(row => row.status))
      .toEqual([200, 200, 'connection-lost', 'connection-lost']);
  } finally {
    await context.close();
    await reader.close();
  }
});

const notesFile = 'storage/editor/notes.json';
const linksFile = 'storage/editor/links.json';
const graph = [
  { id: '1801', body: { ja: '親ノート', en: 'Fixture root' }, createdAt: '2026-05-01T00:00:00Z' },
  { id: '1802', parentId: '1801', body: { ja: '最初の返信', en: 'First reply' }, createdAt: '2026-05-02T00:00:00Z' },
  { id: '1803', parentId: '1801', body: { ja: '次の返信', en: 'Second reply' }, createdAt: '2026-05-03T00:00:00Z' },
  { id: '1804', parentId: '1802', body: { ja: '孫ノート', en: 'Grandchild' }, createdAt: '2026-05-04T00:00:00Z' },
  { id: '1805', published: false, body: { ja: 'HIDDEN NOTE FIXTURE', en: '' }, createdAt: '2026-05-05T00:00:00Z' },
  { id: '1806', parentId: '1805', body: { ja: '公開された子', en: 'Promoted note' }, createdAt: '2026-05-06T00:00:00Z' },
];

function editorFixture() {
  const output = resolve(process.env.PLAYWRIGHT_OUTPUT_DIR ?? '/tmp/tenzyudotcom-editor-evidence');
  const directory = readFileSync(resolve(output, 'fixture-path'), 'utf8');
  return { directory, git: openGitContentFixture(resolve(directory, 'content.git')) };
}

async function signIn(page: import('@playwright/test').Page, base: string) {
  await page.goto(`${base}/en/editor/login`);
  await page.locator('input[name="password"]').fill('fixture-password-not-a-secret');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await expect(page).toHaveURL(`${base}/en/editor`);
}

test('Notes project the visible graph and persist item commands with focus and recovery', async ({ page, browser, baseURL }) => {
  const base = new URL(baseURL!).origin;
  const { directory, git } = editorFixture();
  const seeded = git.advance({ [notesFile]: JSON.stringify(graph, null, 2) + '\n' }, 'Seed branched Notes');
  const reader = await browser.newContext({ locale: 'ja-JP', viewport: { width: 1440, height: 1000 } });
  try {
    const ja = await reader.newPage();
    const response = await ja.goto(`${base}/notes`);
    expect(response?.status()).toBe(200);
    expect(await response?.text()).not.toContain('HIDDEN NOTE FIXTURE');
    await expect(ja.locator('html')).toHaveAttribute('lang', 'ja');
    await ja.getByRole('article').filter({ hasText: '孫ノート' }).getByRole('link', { name: 'ノートの固定リンク' }).press('Enter');
    await expect(ja).toHaveURL(`${base}/notes/1804`);
    await expect(ja.getByRole('link', { name: 'ノートの固定リンク' }).and(ja.locator('[aria-current="page"]'))).toHaveAttribute('href', '/notes/1804');
    await ja.getByRole('link', { name: '返信先 最初の返信' }).press('Enter');
    await expect(ja).toHaveURL(`${base}/notes/1802`);

    await signIn(page, base);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/en/notes`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await expect(page.getByRole('article').filter({ hasText: 'Promoted note' }).getByRole('link')).toHaveCount(1);
    await page.getByRole('button', { name: 'Edit this page' }).press('Enter');
    const article = page.getByRole('article').filter({ hasText: 'First reply' }).filter({ hasNotText: 'Grandchild' });
    const actions = article.getByRole('button', { name: 'Note actions' });
    await actions.press('Enter');
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Edit note' });
    await expect(dialog.getByRole('heading')).toBeFocused();
    await expect(dialog.getByLabel('English text')).toHaveValue('First reply');
    await dialog.getByLabel('English text').fill('Edited first reply');

    const stale = await page.context().newPage();
    await stale.goto(`${base}/en/notes`);
    await stale.getByRole('button', { name: 'Edit this page' }).click();
    await stale.getByRole('article').filter({ hasText: 'First reply' }).filter({ hasNotText: 'Grandchild' })
      .getByRole('button', { name: 'Note actions' }).click();
    await stale.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    const staleDialog = stale.getByRole('dialog', { name: 'Edit note' });
    await staleDialog.getByLabel('English text').fill('Draft from stale tab');

    const put = page.waitForRequest(req => req.method() === 'POST' && req.url().endsWith('/api/editor/notes/item'));
    await dialog.getByRole('button', { name: 'Save note' }).click();
    const payload = (await put).postDataJSON();
    expect(payload.command).toMatchObject({ kind: 'edit', id: '1802', body: { ja: '最初の返信', en: 'Edited first reply' } });
    expect(payload).not.toHaveProperty('sourceJson');
    await expect(page.getByRole('status').filter({ hasText: 'Saved to Git' })).toBeVisible();
    await expect(page.getByText('Edited first reply', { exact: true })).toBeVisible();
    const edited = git.head();
    expect(git.parents(edited)).toEqual([seeded]);

    await staleDialog.getByRole('button', { name: 'Save note' }).click();
    await expect(staleDialog.getByRole('alert')).toContainText('This item changed');
    await expect(staleDialog.getByLabel('English text')).toHaveValue('Draft from stale tab');
    await staleDialog.getByRole('button', { name: 'Compare latest' }).click();
    await expect(staleDialog.getByText('Edited first reply', { exact: true })).toBeVisible();
    expect(git.head()).toBe(edited);
    await stale.close();

    const openDelete = async () => {
      await page.getByRole('article').filter({ hasText: 'Edited first reply' }).filter({ hasNotText: 'Grandchild' })
        .getByRole('button', { name: 'Note actions' }).click();
      await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    };
    await openDelete();
    const confirmation = page.getByRole('alertdialog', { name: 'Delete note?' });
    await expect(confirmation).toContainText('1 direct replies');
    await confirmation.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirmation).toBeHidden();
    expect(git.head()).toBe(edited);

    await openDelete();
    writeFileSync(resolve(directory, 'drop-document-response'), 'reject', { mode: 0o600 });
    await confirmation.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(confirmation.getByRole('alert')).toContainText('Storage is unavailable');
    expect(git.head()).toBe(edited);
    await confirmation.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(confirmation).toBeHidden();
    await expect(page.getByText('Edited first reply', { exact: true })).toHaveCount(0);
    const deleted = git.head();
    expect(git.parents(deleted)).toEqual([edited]);
    const entries = JSON.parse(git.file(deleted, notesFile)!.toString());
    expect(entries.find((entry: { id: string }) => entry.id === '1804').parentId).toBe('1801');
    await expect(page.getByRole('article').filter({ hasText: 'Grandchild' })).toContainText('Reply to Fixture root');
    expect((await reader.request.get(`${base}/en/notes/1802`)).status()).toBe(404);
    expect((await reader.request.get(`${base}/api/editor/notes/item?id=1805`)).status()).toBe(401);

    const denied = await page.request.post(`${base}/api/editor/notes/item`, { headers: { Origin: 'https://invalid.example' }, data: payload });
    expect(denied.status()).toBe(403);
    expect(git.head()).toBe(deleted);

    await page.getByRole('button', { name: 'Write note' }).click();
    const create = page.getByRole('dialog', { name: 'Write note' });
    await create.getByLabel('Japanese text', { exact: true }).fill('同じ下書き');
    await create.getByLabel('English text').fill('Recovered fixture note');
    writeFileSync(resolve(directory, 'drop-document-response'), 'before', { mode: 0o600 });
    await create.getByRole('button', { name: 'Post note' }).click();
    await expect(create.getByRole('alert')).toContainText('outcome is unknown');
    expect(git.head()).toBe(deleted);
    await create.getByRole('button', { name: 'Check saved change' }).click();
    await expect(create.getByRole('alert')).toContainText('Git still matches');
    await expect(create.getByLabel('English text')).toHaveValue('Recovered fixture note');
    writeFileSync(resolve(directory, 'drop-document-response'), 'after', { mode: 0o600 });
    await create.getByRole('button', { name: 'Post note' }).click();
    await expect(page.getByText('Recovered fixture note', { exact: true })).toBeVisible();
    const recovered = git.head();
    expect(git.parents(recovered)).toEqual([deleted]);
    expect(JSON.parse(git.file(recovered, notesFile)!.toString()).filter((entry: { body: { en: string } }) =>
      entry.body.en === 'Recovered fixture note')).toHaveLength(1);

    await page.context().clearCookies();
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByRole('button', { name: 'Exit edit mode' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Write note' })).toHaveCount(0);
  } finally {
    await reader.close();
  }
});

test('Links edit category, order and short identity and share the current page', async ({ page, baseURL }) => {
  const base = new URL(baseURL!).origin;
  const { git } = editorFixture();
  const seedLinks = [
    { name: 'First fixture link', id: 'same-display-id', url: 'https://example.com/first', shortenUrl: 'first-fixture', icon: 'github', category: 'Build' },
    { name: 'Second fixture link', id: 'same-display-id', url: 'https://example.com/second', shortenUrl: 'second-fixture', icon: 'github', category: 'Social' },
  ];
  const started = git.advance({ [linksFile]: JSON.stringify(seedLinks, null, 2) + '\n' }, 'Seed Links');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    window.open = (url) => {
      document.documentElement.dataset.shareTarget = String(url);
      return null;
    };
  });
  await signIn(page, base);
  await page.goto(`${base}/en/notes`);
  const documentStart = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole('banner').getByRole('link', { name: 'Links', exact: true }).click();
  await expect(page).toHaveURL(`${base}/en/links`);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart);
  const share = async () => {
    await page.getByRole('contentinfo').getByRole('button', { name: 'Share', exact: true }).click();
    return page.getByRole('dialog', { name: /Share.*tenzyu\.com/ });
  };
  await (await share()).getByRole('button', { name: 'Copy', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${base}/en/links`);
  await page.goBack();
  await expect(page).toHaveURL(`${base}/en/notes`);
  await (await share()).getByRole('button', { name: 'X', exact: true }).click();
  expect(new URL((await page.locator('html').getAttribute('data-share-target'))!).searchParams.get('url')).toBe(`${base}/en/notes`);
  await page.goForward();
  await expect(page).toHaveURL(`${base}/en/links`);
  await (await share()).getByRole('button', { name: 'Email', exact: true }).click();
  expect(new URL((await page.locator('html').getAttribute('data-share-target'))!).searchParams.get('body')).toBe(`${base}/en/links`);
  await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new DOMException('Denied', 'NotAllowedError')); });
  const shareDialog = await share();
  await shareDialog.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(shareDialog.getByRole('textbox')).toHaveValue(`${base}/en/links`);
  await expect(shareDialog.getByRole('textbox')).toBeFocused();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Edit this page' }).click();
  await page.getByRole('button', { name: 'Link actions for second-fixture' }).click();
  await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
  const edit = page.getByRole('dialog', { name: 'Edit link' });
  await edit.getByLabel('Short code').fill('first-fixture');
  await edit.getByRole('button', { name: 'Save link' }).click();
  await expect(edit.getByRole('alert')).toContainText('Duplicate link shortenUrl');
  expect(git.head()).toBe(started);
  await edit.getByLabel('Short code').fill('moved-fixture');
  await edit.getByLabel('Category').selectOption('Build');
  await edit.getByLabel('Position').selectOption('first-fixture');
  await expect(edit.getByText('/en/links/moved-fixture', { exact: true })).toBeVisible();
  await edit.getByRole('button', { name: 'Save link' }).click();
  await expect(edit).toBeHidden();
  const saved = git.head();
  expect(git.parents(saved)).toEqual([started]);
  expect(JSON.parse(git.file(saved, linksFile)!.toString()).map((entry: { shortenUrl: string }) => entry.shortenUrl))
    .toEqual(['moved-fixture', 'first-fixture']);
  const redirect = await page.request.get(`${base}/en/links/moved-fixture`, { maxRedirects: 0 });
  expect(redirect.status()).toBe(307);
  expect(redirect.headers().location).toBe('https://example.com/second');
});
