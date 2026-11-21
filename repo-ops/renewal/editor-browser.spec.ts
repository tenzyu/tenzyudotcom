import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Browser, type BrowserContextOptions } from '@playwright/test';
import { openGitContentFixture } from './git-content-fixture.mjs';
import { article, scrap, serialize } from './publication-fixture.mjs';

async function isolateBrowser(context: import('@playwright/test').BrowserContext, base: string) {
  await context.route('**/*', route =>
    new URL(route.request().url()).origin === base ? route.continue() : route.abort());
}

test.beforeEach(async ({ context, baseURL }) => {
  await isolateBrowser(context, new URL(baseURL!).origin);
});

async function readerContext(browser: Browser, base: string, options?: BrowserContextOptions) {
  const context = await browser.newContext(options);
  await isolateBrowser(context, base);
  return context;
}

test('Scrap draft, repeated writes and publication stay on the public pages', async ({ page, browser, baseURL }) => {
  const base = new URL(baseURL!).origin;
  const { directory, git } = editorFixture();
  const reader = await readerContext(browser, base, { locale: 'ja-JP', viewport: { width: 1440, height: 1000 } });
  const slug = 'contextual-browser-scrap';
  const title = 'Contextual Scrap fixture';
  const path = `storage/scraps/${slug}`;
  const initial = git.head();
  const lead = 'Original fixture lead.  \nSecond line.\n\n<Evidence>\n\nFixture evidence.\n\n</Evidence>\n';
  const readAnonymous = async (status: number) => {
    for (const prefix of ['', '/en']) {
      const response = await reader.request.get(`${base}${prefix}/scraps/${slug}`, {
        headers: { 'Accept-Language': prefix ? 'en' : 'ja' },
      });
      expect(response.status()).toBe(status);
      const html = await response.text();
      expect(html).not.toContain('HIDDEN SCRAP ENTRY');
      if (status === 200) {
        expect(html).toContain(`<title>${title}`);
        expect(html).toContain('Fixture evidence.');
        expect(html).toContain(`https://tenzyu.com${prefix}/scraps/${slug}`);
        if (!prefix) expect(html).toContain('noindex');
      }
    }
  };
  try {
    await signIn(page, base);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/en/scraps`);
    const documentStart = await page.evaluate(() => performance.timeOrigin);
    await readAnonymous(404);
    await page.getByRole('button', { name: 'Edit this page' }).press('Enter');
    await page.getByRole('button', { name: 'Create a scrap' }).click();
    const editor = page.getByRole('dialog', { name: 'Scrap editor' });
    await editor.getByLabel('Slug', { exact: true }).fill(slug);
    await editor.getByLabel('Title', { exact: true }).fill(title);
    await editor.getByLabel('Question or hypothesis').fill('Does a draft become reachable at publication?');
    const source = editor.getByLabel('Lead, in MDX');
    await source.focus();
    const keyboard = await page.context().newCDPSession(page);
    await keyboard.send('Input.imeSetComposition', { text: 'にほんご', selectionStart: 4, selectionEnd: 4 });
    await keyboard.send('Input.insertText', { text: '日本語' });
    await keyboard.detach();
    await expect(source).toHaveValue('日本語');
    await source.fill(lead);
    await source.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(0, 8));
    await source.press('Control+k');
    await expect(source).toHaveValue('[Original](https://example.com)' + lead.slice(8));
    await source.press('Control+z');
    await expect(source).toHaveValue(lead);
    await source.fill(lead + '\n| A | B |\n| - | - |\n| 1 | 2 |\n\n{alert("draft only")}');
    await editor.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(editor.getByRole('table')).toBeVisible();
    await expect(editor.getByText('Fixture evidence.', { exact: true })).toBeVisible();
    await expect(editor.getByText(/Unsupported MDX at line/)).toBeVisible();
    expect(git.head()).toBe(initial);
    await editor.getByRole('button', { name: 'Write', exact: true }).click();
    await source.fill(lead);
    await page.route(url => url.pathname === '/api/editor/scrap' && url.searchParams.get('slug') === slug, route => route.fulfill({ status: 503 }), { times: 1 });
    await editor.getByRole('button', { name: 'Create draft' }).click();
    await expect(editor.getByRole('alert')).toContainText('saved version could not be loaded');
    const created = git.head();
    expect(git.parents(created)).toEqual([initial]);
    expect(git.file(created, `${path}/lead.en.mdx`)?.toString()).toBe(lead);
    await editor.getByRole('button', { name: 'Refresh editor' }).click();
    await expect(editor.getByRole('button', { name: 'Publish scrap' })).toBeVisible();
    expect(git.head()).toBe(created);
    expect((await reader.request.get(`${base}/api/editor/scrap?slug=${slug}`)).status()).toBe(401);
    await readAnonymous(404);

    await editor.getByRole('button', { name: 'Append entry' }).click();
    const entry = editor.getByLabel('Entry, in MDX');
    const append = editor.getByRole('button', { name: 'Append entry' });
    await entry.fill('First public entry.');
    await editor.getByLabel('Published entry').check();
    writeFileSync(resolve(directory, 'drop-ref-response'), 'before', { mode: 0o600 });
    await append.click();
    await expect(editor.getByRole('alert')).toContainText('outcome is unknown');
    await editor.getByRole('button', { name: 'Check saved change' }).click();
    await expect(editor.getByRole('alert')).toContainText('Git still matches');
    await expect(entry).toHaveValue('First public entry.');
    expect(git.head()).toBe(created);

    await append.click();
    await expect(entry).toHaveValue('');
    const first = git.head();
    expect(git.parents(first)).toEqual([created]);
    await entry.fill('HIDDEN SCRAP ENTRY');
    writeFileSync(resolve(directory, 'drop-ref-response'), 'after', { mode: 0o600 });
    await append.click();
    await expect(editor.getByRole('alert')).toContainText('outcome is unknown');
    await editor.getByRole('button', { name: 'Check saved change' }).click();
    await expect(entry).toHaveValue('');
    const second = git.head();
    expect(git.parents(second)).toEqual([first]);
    const manifestPath = `${path}/manifest.json`;
    const manifest = JSON.parse(git.file(second, manifestPath)!.toString());
    expect(new Set(manifest.entryIds).size).toBe(2);
    expect(git.file(second, `${path}/entries/${manifest.entryIds[1]}/entry.en.mdx`)?.toString()).toBe('HIDDEN SCRAP ENTRY');

    page.on('dialog', dialog => dialog.accept());
    await editor.getByRole('button', { name: 'Back to Scrap controls' }).click();
    await editor.getByRole('button', { name: 'Edit entry 1' }).click();
    await expect(entry).toHaveValue('First public entry.');
    await entry.fill('Edited public entry.');
    await editor.getByRole('button', { name: 'Save entry' }).click();
    await expect.poll(() => git.head()).not.toBe(second);
    await expect(editor.getByRole('status').filter({ hasText: git.head() })).toBeVisible();
    await editor.getByRole('combobox', { name: /Document language/ }).selectOption('ja');
    await entry.fill('翻訳された記録。');
    await editor.getByRole('button', { name: 'Save entry' }).click();
    await expect(editor.getByText(/Translation state.*manual/)).toBeVisible();
    await editor.getByRole('button', { name: 'Back to Scrap controls' }).click();
    await editor.getByRole('button', { name: 'Publish scrap' }).click();
    await expect(editor.getByRole('status').filter({ hasText: 'Available to readers.' })).toBeVisible();
    await readAnonymous(200);
    await editor.getByRole('link', { name: 'Open public scrap' }).click();
    await expect(page).toHaveURL(`${base}/en/scraps/${slug}`);
    await expect(page.getByText('Edited public entry.', { exact: true })).toBeVisible();
    await expect(page.locator('[data-scrap-lead] br')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.getByRole('button', { name: 'Manage scrap' }).click();
    await editor.getByRole('button', { name: 'Close scrap' }).click();
    await expect(editor.getByRole('button', { name: 'Reopen scrap' })).toBeEnabled();
    await readAnonymous(200);
    await editor.getByRole('button', { name: 'Reopen scrap' }).click();
    await expect(editor.getByRole('button', { name: 'Close scrap' })).toBeEnabled();
    await editor.getByRole('button', { name: 'Archive scrap' }).click();
    await expect(page).toHaveURL(`${base}/en/scraps?draft=${slug}`);
    await expect(editor.getByRole('button', { name: 'Reopen scrap' })).toBeVisible();
    await readAnonymous(404);
    expect(JSON.parse(git.file(git.head(), manifestPath)!.toString()).status).toBe('archived');
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart);
  } finally {
    await reader.close();
  }
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
  const reader = await readerContext(browser, base);
  const page = await context.newPage();
  const main = page.getByRole('main');
  const status = main.getByRole('status').filter({ hasText: /Saved\.|No changes to save/ });
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
    await expect(staleMain.getByRole('alert')).toContainText(/changed|old edit version/);
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
    await expect(save).toBeDisabled();
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
  const blogIndex = 'storage/blog/index.json';
  const originalBlog = git.file(git.head(), blogIndex);
  const seeded = git.advance({
    [notesFile]: serialize(graph),
    [blogIndex]: '{ malformed fixture Blog index',
  }, 'Seed branched Notes with an unrelated Blog error');
  const reader = await readerContext(browser, base, { locale: 'ja-JP', viewport: { width: 1440, height: 1000 } });
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
    await ja.getByRole('link', { name: '返信先 親ノート' }).press('Enter');
    await expect(ja).toHaveURL(`${base}/notes/1801`);
    await ja.getByRole('article').filter({ hasText: '次の返信' }).getByRole('link', { name: 'ノートの固定リンク' }).press('Enter');
    await expect(ja).toHaveURL(`${base}/notes/1803`);
    await ja.setViewportSize({ width: 390, height: 844 });
    expect(await ja.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await expect(ja.getByRole('link', { name: '返信先 親ノート' })).toHaveAttribute('href', '/notes/1801');

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

    await page.getByRole('article').filter({ hasText: 'Edited first reply' })
      .filter({ hasNotText: 'Grandchild' }).getByRole('link', { name: 'Note permalink' }).click();
    await expect(page).toHaveURL(`${base}/en/notes/1802`);
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
    await expect(page).toHaveURL(`${base}/en/notes/1801`);
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

    await page.getByRole('link', { name: 'Back to notes' }).click();
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
    await expect(create).toBeHidden();
    await expect(page.getByRole('article').getByText('Recovered fixture note', { exact: true })).toBeVisible();
    const recovered = git.head();
    expect(git.parents(recovered)).toEqual([deleted]);
    expect(JSON.parse(git.file(recovered, notesFile)!.toString()).filter((entry: { body: { en: string } }) =>
      entry.body.en === 'Recovered fixture note')).toHaveLength(1);

    await page.context().clearCookies();
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByRole('button', { name: 'Exit edit mode' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Write note' })).toHaveCount(0);
  } finally {
    git.advance({ [blogIndex]: originalBlog?.toString() ?? null }, 'Restore fixture Blog catalog');
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
  await edit.getByRole('combobox', { name: 'Category', exact: true }).selectOption('Build');
  await edit.getByRole('combobox', { name: 'Position', exact: true }).selectOption('first-fixture');
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

  await page.getByRole('button', { name: 'Add link', exact: true }).click();
  const add = page.getByRole('dialog', { name: 'Add link' });
  await add.getByLabel('Name', { exact: true }).fill('Added fixture link');
  await add.getByLabel('Display ID', { exact: true }).fill('shown-id');
  await add.getByLabel('Destination URL').fill('https://example.com/added');
  await add.getByLabel('Short code').fill('added-fixture');
  await add.getByLabel('Icon name').fill('github');
  await add.getByRole('button', { name: 'Save link' }).click();
  await expect(add).toBeHidden();
  const added = git.head();
  expect(git.parents(added)).toEqual([saved]);
  expect((await page.request.get(`${base}/en/links/added-fixture`, { maxRedirects: 0 })).headers().location)
    .toBe('https://example.com/added');
  await page.getByRole('button', { name: 'Link actions for added-fixture' }).click();
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  const remove = page.getByRole('alertdialog', { name: 'Delete link?' });
  await remove.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(remove).toBeHidden();
  const removed = git.head();
  expect(git.parents(removed)).toEqual([added]);
  const withdrawn = await page.request.get(`${base}/en/links/added-fixture`, { maxRedirects: 0 });
  expect(withdrawn.status()).toBe(307);
  expect(new URL(withdrawn.headers().location, base).pathname).toBe('/en');
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Change language' }).press('Enter');
  await page.getByRole('menuitem', { name: /Japanese|日本語/ }).press('Enter');
  await expect(page).toHaveURL(`${base}/links`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await page.getByRole('button', { name: 'このページを編集' }).press('Enter');
  await page.getByRole('button', { name: 'リンクを追加', exact: true }).press('Enter');
  const localizedEditor = page.getByRole('dialog', { name: 'リンクを追加' });
  await expect(localizedEditor.getByRole('heading')).toBeFocused();
  await localizedEditor.getByRole('button', { name: 'キャンセル' }).click();
  await page.getByRole('contentinfo').getByRole('button', { name: '共有', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'コピー', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(`${base}/links`);

});


test('Blog edits in place and renames the indexed blob while preserving all old addresses', async ({ page, browser, baseURL }) => {
  const base = new URL(baseURL!).origin;
  const { directory, git } = editorFixture();
  const indexPath = 'storage/blog/index.json';
  const first = 'contextual-a';
  const middle = 'contextual-b';
  const last = 'contextual-c';
  const oldFile = 'storage/blog/nested/owned-source.mdx';
  const title = 'Contextual Blog article';
  const body = 'Original hard break.  \nSecond line.\n\n[Original address](/en/blog/contextual-a)\n\n<KoFiLink label="Contextual support link" />\n';
  const source = article(first, title, '2026-05-23T12:34:56.789Z', body.trimEnd());
  const post = { ...source.projection, pathname: 'blog/nested/owned-source.mdx', extension: { fixture: true } };
  const index = JSON.parse(git.file(git.head(), indexPath)?.toString() ?? '[]');
  const proof = scrap('authored-outcome', 'Authored Scrap outcome', { en: { state: 'original', text: 'Outcome leads to the old Blog address.' } }, { primaryLocale: 'en' });
  const scrapsIndexPath = 'storage/scraps/index.json';
  const scraps = JSON.parse(git.file(git.head(), scrapsIndexPath)?.toString() ?? '[]');
  const authored = source.source.replace('summary: ', '# Preserve this comment\nfixtureField: { untouched: true }\nsummary: ').replaceAll('\n', '\r\n');
  const seeded = git.advance({
    [oldFile]: authored,
    [indexPath]: serialize([post, ...index]),
    ...proof.files,
    [proof.manifestPath]: serialize({ ...proof.manifest, outcomes: [{ kind: 'blog', relation: 'derived-into', slug: first, title: 'Authored Blog outcome' }] }),
    [scrapsIndexPath]: serialize([{ ...proof.projection, hasOutcomes: true }, ...scraps]),
    'storage/unrelated.txt': 'Keep these bytes.\n',
  }, 'Seed Blog URL identity fixtures');
  const output = resolve(process.env.PLAYWRIGHT_OUTPUT_DIR ?? '/tmp/tenzyudotcom-editor-evidence');
  const fileReads = () => readFileSync(resolve(output, 'github-ledger.jsonl'), 'utf8').trim().split('\n').filter(Boolean)
    .map(line => JSON.parse(line)).filter(row => row.method === 'GET' && row.path.includes('/contents/storage/blog/'));
  const reader = await readerContext(browser, base, { locale: 'ja-JP' });
  try {
    await signIn(page, base);
    await page.goto(`${base}/en/blog/${first}`);
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    await page.getByRole('button', { name: 'Edit this page' }).click();
    expect((await reader.request.get(`${base}/api/editor/blog/article?slug=${first}`)).status()).toBe(401);
    await page.waitForLoadState('networkidle');
    const legacyStart = fileReads().length;
    const legacyStatus = await page.evaluate(async () => {
      const response = await fetch('/api/editor/blog', { cache: 'no-store' });
      await response.text();
      return response.status;
    });
    expect(legacyStatus).toBe(200);
    const legacyReads = fileReads().slice(legacyStart);
    expect(legacyReads.filter(row => row.path.endsWith('.mdx'))).toHaveLength(index.length + 1);
    const cursor = fileReads().length;
    await page.getByRole('button', { name: 'Edit post', exact: true }).click();
    const edit = page.getByRole('dialog', { name: 'Edit post' });
    const input = edit.getByLabel('Content, in MDX');
    await expect(input).toHaveValue(body);
    const selectedReads = fileReads().slice(cursor).map(row => row.path);
    expect([...new Set(selectedReads)]).toEqual([
      '/repos/fixture/editor/contents/storage/blog/index.json',
      '/repos/fixture/editor/contents/storage/blog/nested/owned-source.mdx',
    ]);
    if (process.env.EDITOR_BROWSER_PRODUCTION === '1') expect(selectedReads).toHaveLength(2);
    await edit.getByLabel('Title', { exact: true }).fill('Updated contextual article');
    await edit.getByRole('button', { name: 'Save post' }).click();
    await expect(edit.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible();
    await expect(edit.getByRole('button', { name: 'Save post' })).toBeEnabled();
    const edited = git.head();
    expect(git.parents(edited)).toEqual([seeded]);
    expect(git.file(edited, oldFile)?.toString()).toContain('# Preserve this comment\r\nfixtureField: { untouched: true }');
    expect(git.file(edited, oldFile)?.toString().endsWith(body.replaceAll('\n', '\r\n'))).toBe(true);
    await input.fill(body + '\nOne more edit.\n');
    await edit.getByRole('button', { name: 'Save post' }).click();
    await expect.poll(() => git.head()).not.toBe(edited);
    await expect(edit.getByRole('status').filter({ hasText: git.head() })).toBeVisible();
    const sourceHead = git.head();
    const exact = git.file(sourceHead, oldFile)!;
    expect(exact.toString().endsWith('One more edit.\r\n')).toBe(true);
    expect(git.parents(sourceHead)).toEqual([edited]);
    await edit.getByRole('button', { name: 'Close editor' }).click();
    await expect(edit).toBeHidden();

    const rename = page.getByRole('dialog', { name: 'Change URL' });
    const startRename = async (next: string) => {
      await page.getByRole('button', { name: 'Change URL', exact: true }).click();
      await rename.getByLabel('New slug').fill(next);
      await expect(rename.getByText(`/en/blog/${next}`, { exact: true })).toBeVisible();
    };
    await startRename(middle);
    expect(git.head()).toBe(sourceHead);
    writeFileSync(resolve(directory, 'drop-ref-response'), 'after', { mode: 0o600 });
    await rename.getByRole('button', { name: 'Confirm URL change' }).click();
    await expect(rename.getByRole('alert')).toContainText('Publication outcome unknown');
    const firstMove = git.head();
    expect(git.parents(firstMove)).toEqual([sourceHead]);
    await rename.getByRole('button', { name: 'Check publication' }).click();
    await expect(page).toHaveURL(`${base}/en/blog/${middle}`);
    expect(git.head()).toBe(firstMove);
    expect(git.file(firstMove, oldFile)).toBeNull();
    expect(git.file(firstMove, `storage/blog/${middle}.mdx`)).toEqual(exact);

    await startRename(last);
    await rename.getByRole('button', { name: 'Confirm URL change' }).click();
    await expect(page).toHaveURL(`${base}/en/blog/${last}`);
    const secondMove = git.head();
    expect(git.parents(secondMove)).toEqual([firstMove]);
    expect(git.file(secondMove, `storage/blog/${last}.mdx`)).toEqual(exact);
    expect(git.file(secondMove, `storage/blog/${middle}.mdx`)).toBeNull();
    expect(git.file(secondMove, 'storage/unrelated.txt')?.toString()).toBe('Keep these bytes.\n');
    const stored = JSON.parse(git.file(secondMove, indexPath)!.toString());
    expect(stored.filter((entry: { slug: string }) => [first, middle, last].includes(entry.slug))).toEqual([
      expect.objectContaining({ slug: last, aliases: [first, middle], extension: { fixture: true } }),
    ]);

    for (const prefix of ['', '/en']) {
      await reader.clearCookies();
      const headers = { 'Accept-Language': prefix ? 'en' : 'ja' };
      for (const old of [first, middle]) {
        const response = await reader.request.get(`${base}${prefix}/blog/${old}?tag=fixture`, { maxRedirects: 0, headers });
        expect(response.status()).toBe(307);
        expect(new URL(response.headers().location, base).href).toBe(`${base}${prefix}/blog/${last}?tag=fixture`);
        expect(response.headers()['cache-control']).toContain('no-store');
      }
      const latest = await reader.request.get(`${base}${prefix}/blog/${last}`, { headers });
      expect(latest.status()).toBe(200);
      expect(await latest.text()).toContain(`https://tenzyu.com${prefix}/blog/${last}`);
      const list = await reader.request.get(`${base}${prefix}/blog`, { headers });
      const html = await list.text();
      expect(html).toContain(`href="${prefix}/blog/${last}"`);
      expect(html).not.toContain(`href="${prefix}/blog/${first}"`);
    }
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
    await expect(page.getByRole('button', { name: 'Contextual support link' })).toHaveAttribute('href', 'https://ko-fi.com/tenzyu');
    await expect(page.getByRole('link', { name: 'Original address' })).toHaveAttribute('href', '/en/blog/contextual-a');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('contentinfo').getByRole('button', { name: 'Share', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Copy', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(`${base}/en/blog/${last}`);
    const outcome = await reader.newPage();
    await outcome.goto(`${base}/en/scraps/authored-outcome`);
    const oldOutcome = outcome.getByRole('link', { name: 'Authored Blog outcome' });
    await expect(oldOutcome).toHaveAttribute('href', '/en/blog/contextual-a');
    await oldOutcome.click();
    await expect(outcome).toHaveURL(`${base}/en/blog/${last}`);
    expect(git.head()).toBe(secondMove);
  } finally {
    await reader.close();
  }
});
