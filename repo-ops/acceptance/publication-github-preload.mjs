import { appendFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fixtureBase, openGitContentFixture } from './git-content-fixture.mjs';

const { PUBLICATION_CONTROL_DIR: control, PUBLICATION_FIXTURE_REPO: repository,
  PUBLICATION_APP_ROOT: app, PUBLICATION_TWEET_STATUS: tweetStatus = '404' } = process.env;
if (!control || !repository || !app) throw new Error('Publication preload requires private fixture paths');
const fixture = openGitContentFixture(repository, { allowNotesWrite: true });
const require = createRequire(join(app, 'package.json'));
const nextEnvPath = require.resolve('@next/env');
const nextEnv = require(nextEnvPath);
require.cache[nextEnvPath].exports = {
  ...nextEnv,
  loadEnvConfig: () => ({ combinedEnv: process.env, parsedEnv: {}, loadedEnvFiles: [] }),
};

const matchesFixture = (url) => url.href.startsWith(`${fixtureBase}/`);

function matchingRule(request, url) {
  const path = join(control, 'rule.json');
  if (!existsSync(path)) return null;
  const rule = JSON.parse(readFileSync(path, 'utf8'));
  const ref = url.searchParams.get('ref');
  const validator = request.headers.get('if-none-match');
  if (request.method !== 'GET' || rule.path !== url.pathname ||
      (rule.ref !== undefined && rule.ref !== ref) ||
      (rule.validator !== undefined && rule.validator !== validator)) return null;
  if (rule.hold) unlinkSync(path);
  return rule;
}

async function holdResponse(rule, response) {
  writeFileSync(join(control, `${rule.hold}.held`), String(response.status));
  const release = join(control, `${rule.hold}.release`);
  const deadline = Date.now() + 90_000;
  while (!existsSync(release)) {
    if (Date.now() > deadline) throw new Error('Timed out waiting to release fixture response');
    await delay(20);
  }
}

globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  if (request.headers.has('authorization')) throw new Error('Publication fixture requires credential-free origin requests');
  const url = new URL(request.url);
  const started = performance.now();
  const rule = matchesFixture(url) ? matchingRule(request, url) : null;
  let response;
  if (rule?.status) {
    response = Response.json({ message: 'Injected content origin failure' }, { status: rule.status });
  } else if (matchesFixture(url)) {
    response = await fixture.fetch(request);
  } else if (url.origin === 'https://cdn.syndication.twimg.com' &&
      url.pathname === '/tweet-result' && request.method === 'GET') {
    response = Response.json({ message: 'Synthetic Tweet response' }, { status: Number(tweetStatus) });
  } else {
    response = Response.json({ message: 'Network denied by publication fixture' }, { status: 403 });
  }
  if (rule?.hold) await holdResponse(rule, response);
  appendFileSync(join(control, 'origin.jsonl'), `${JSON.stringify({
    method: request.method, host: url.hostname, path: url.pathname,
    ref: url.searchParams.get('ref'), validator: request.headers.get('if-none-match'),
    etag: response.headers.get('etag'), status: response.status,
    elapsedMs: Math.round(performance.now() - started),
  })}\n`, { mode: 0o600 });
  return response;
};
