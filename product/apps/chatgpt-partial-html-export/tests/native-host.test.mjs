import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  handleMessage,
  normalizeOutputDir,
  resolveOutputPath,
  sanitizeFilename
} from '../native/host.mjs';

test('sanitizeFilename strips path traversal and preserves html extension', () => {
  assert.equal(sanitizeFilename('../evil.html'), 'evil.html');
  assert.equal(sanitizeFilename('a/b/c'), 'c.html');
  assert.equal(sanitizeFilename('a\\b\\c.html'), 'c.html');
  assert.equal(sanitizeFilename('chat:gpt?.html'), 'chat-gpt-.html');
  assert.equal(sanitizeFilename(''), 'chatgpt-export.html');
  assert.equal(sanitizeFilename('会話ログ.html'), '会話ログ.html');
});

test('normalizeOutputDir rejects relative paths', () => {
  assert.throws(() => normalizeOutputDir('relative/path'), /absolute/);
  assert.throws(() => normalizeOutputDir(''), /required/);
});

test('resolveOutputPath stays inside outputDir', () => {
  const outputDir = path.join(os.tmpdir(), 'cphe-test');
  const outputPath = resolveOutputPath(outputDir, '../export.html');
  assert.equal(outputPath, path.join(outputDir, 'export.html'));
});

test('handleMessage writes html to the requested absolute outputDir', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cphe-'));
  const response = await handleMessage({
    type: 'writeHtml',
    outputDir: tmp,
    filename: 'sample.html',
    html: '<!doctype html><title>ok</title>'
  });

  assert.equal(response.ok, true);
  assert.equal(response.path, path.join(tmp, 'sample.html'));
  const written = await fs.readFile(response.path, 'utf8');
  assert.equal(written, '<!doctype html><title>ok</title>');
});

test('handleMessage rejects relative outputDir as a machine-readable error', async () => {
  const response = await handleMessage({
    type: 'writeHtml',
    outputDir: 'relative/path',
    filename: 'sample.html',
    html: '<!doctype html><title>ok</title>'
  });

  assert.equal(response.ok, false);
  assert.match(response.error, /absolute/);
});

test('handleMessage basename-sanitizes traversal filenames before writing', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cphe-'));
  const response = await handleMessage({
    type: 'writeHtml',
    outputDir: tmp,
    filename: '../secret.html',
    html: '<!doctype html><title>ok</title>'
  });

  assert.equal(response.ok, true);
  assert.equal(response.path, path.join(tmp, 'secret.html'));
});

test('handleMessage rejects missing html', async () => {
  const response = await handleMessage({ type: 'writeHtml', outputDir: os.tmpdir(), filename: 'x.html' });
  assert.equal(response.ok, false);
  assert.match(response.error, /html/);
});

test('native messaging protocol replies to one complete frame before stdin EOF', { timeout: 10000 }, async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cphe-protocol-'));
  const hostPath = fileURLToPath(new URL('../native/host.mjs', import.meta.url));
  const child = spawn(process.execPath, [hostPath], { stdio: ['pipe', 'pipe', 'pipe'] });
  const request = Buffer.from(JSON.stringify({
    type: 'writeHtml',
    outputDir: tmp,
    filename: 'protocol.html',
    html: '<!doctype html><title>protocol</title>'
  }), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(request.length, 0);

  child.stdin.write(Buffer.concat([header, request]));
  const chunks = [];
  try {
    for await (const chunk of child.stdout) {
      chunks.push(chunk);
      const data = Buffer.concat(chunks);
      if (data.length >= 4 && data.length >= 4 + data.readUInt32LE(0)) break;
    }
  } finally { child.stdin.end(); child.kill(); }
  const output = Buffer.concat(chunks);

  assert.ok(output.length >= 4);
  const responseLength = output.readUInt32LE(0);
  const response = JSON.parse(output.subarray(4, 4 + responseLength).toString('utf8'));
  assert.equal(response.ok, true);
  assert.equal(response.path, path.join(tmp, 'protocol.html'));
});

test('native export never overwrites existing files, including concurrent collisions', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cphe-exclusive-'));
  try {
    const message = { type: 'writeHtml', outputDir: tmp, filename: 'same.html', html: 'first' };
    const results = await Promise.all([handleMessage(message), handleMessage({ ...message, html: 'second' })]);
    assert.equal(results.filter(result => result.ok).length, 1);
    assert.match(results.find(result => !result.ok).error, /EEXIST/);
    const written = await fs.readFile(path.join(tmp, 'same.html'), 'utf8');
    assert.equal(written, results[0].ok ? 'first' : 'second');
    assert.equal((await handleMessage({ ...message, html: 'third' })).ok, false);
    assert.equal(await fs.readFile(path.join(tmp, 'same.html'), 'utf8'), written);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('native export rejects a pre-existing destination symlink without touching its target', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cphe-symlink-'));
  try {
    const target = path.join(tmp, 'target.txt');
    await fs.writeFile(target, 'untouched');
    await fs.symlink(target, path.join(tmp, 'export.html'));
    const response = await handleMessage({ type: 'writeHtml', outputDir: tmp, filename: 'export.html', html: 'new' });
    assert.equal(response.ok, false);
    assert.match(response.error, /EEXIST/);
    assert.equal(await fs.readFile(target, 'utf8'), 'untouched');
    assert.ok((await fs.lstat(path.join(tmp, 'export.html'))).isSymbolicLink());
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('native messaging starts when the installed host path contains URL-escaped characters', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cphe # % 日本語-'));
  try {
    const host = path.join(tmp, 'host.mjs');
    await fs.copyFile(fileURLToPath(new URL('../native/host.mjs', import.meta.url)), host);
    const html = '<!doctype html><title>escaped path</title>';
    const request = Buffer.from(JSON.stringify({ type: 'writeHtml', outputDir: tmp, filename: 'export.html', html }));
    const header = Buffer.alloc(4);
    header.writeUInt32LE(request.length);
    const result = spawnSync(process.execPath, [host], { input: Buffer.concat([header, request]), timeout: 5000 });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr.toString());
    assert.ok(result.stdout.length >= 4, 'host must emit a native messaging response');
    assert.equal(result.stdout.length, 4 + result.stdout.readUInt32LE(0));
    const response = JSON.parse(result.stdout.subarray(4).toString('utf8'));
    assert.deepEqual(response, { ok: true, path: path.join(tmp, 'export.html') });
    assert.equal(await fs.readFile(response.path, 'utf8'), html);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
