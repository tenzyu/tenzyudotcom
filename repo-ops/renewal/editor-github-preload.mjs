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
  EDITOR_FIXTURE_REF_LOSS: refLoss, EDITOR_FIXTURE_ORIGIN: origin } = process.env;
if (!ledger || !repository) throw new Error('The editor fixture needs a bare repository and a ledger');
const fixture = openGitContentFixture(repository);

function takeRefLoss() {
  if (!refLoss) return null;
  try {
    const failure = readFileSync(refLoss, 'utf8').trim();
    unlinkSync(refLoss);
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
  const loss = method === 'PATCH' && url.href === 'https://api.github.com/repos/fixture/editor/git/refs/heads/main'
    ? takeRefLoss() : null;
  const response = loss === 'before' ? null : await fixture.fetch(request);
  appendFileSync(ledger, `${JSON.stringify({
    method, path: url.pathname, status: loss ? 'connection-lost' : response.status,
  })}\n`, { mode: 0o600 });
  if (loss) throw new TypeError('Fixture dropped the ref response');
  return response;
};
