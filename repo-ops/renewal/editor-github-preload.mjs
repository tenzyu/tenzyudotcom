import { appendFileSync, readFileSync, unlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { openGitContentFixture } from './git-content-fixture.mjs';

const require = createRequire(new URL('../../product/apps/web/package.json', import.meta.url));
const nextEnv = require('@next/env');
require.cache[require.resolve('@next/env')].exports = {
  ...nextEnv,
  loadEnvConfig: () => ({ combinedEnv: process.env, parsedEnv: {}, loadedEnvFiles: [] }),
};

const { EDITOR_FIXTURE_LEDGER: ledger, EDITOR_FIXTURE_REPO: repository,
  EDITOR_FIXTURE_REF_LOSS: refLoss, EDITOR_FIXTURE_DOCUMENT_LOSS: documentLoss, EDITOR_FIXTURE_ORIGIN: origin } = process.env;
if (!ledger || !repository) throw new Error('The editor fixture needs a bare repository and a ledger');
const fixture = openGitContentFixture(repository, { allowNotesWrite: true, allowLinksWrite: true });

function takeRule(path) {
  if (!path) return null;
  try {
    const failure = readFileSync(path, 'utf8').trim();
    unlinkSync(path);
    return failure;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
}

const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  const { method } = request;
  if (url.origin === origin && method === 'GET') return nativeFetch(request, { redirect: 'error' });
  if (method === 'GET' && url.origin === 'https://cdn.syndication.twimg.com' && url.pathname === '/tweet-result') {
    return Response.json({ message: 'Synthetic Tweet response' }, { status: 404 });
  }
  const loss = method === 'PATCH' && url.href === 'https://api.github.com/repos/fixture/editor/git/refs/heads/main'
    ? takeRule(refLoss) : null;
  const documentRule = method === 'PUT' && /^\/repos\/fixture\/editor\/contents\/storage\/editor\/(notes|links)\.json$/.test(url.pathname)
    ? takeRule(documentLoss) : null;
  const connectionLost = loss || (documentRule !== 'reject' && documentRule);
  const response = documentRule === 'reject'
    ? new Response(null, { status: 429 })
    : connectionLost === 'before' ? null : await fixture.fetch(request);
  appendFileSync(ledger, `${JSON.stringify({
    method, path: url.pathname, status: connectionLost ? 'connection-lost' : response.status,
  })}\n`, { mode: 0o600 });
  if (connectionLost) throw new TypeError('Fixture dropped the GitHub response');
  return response;
};
