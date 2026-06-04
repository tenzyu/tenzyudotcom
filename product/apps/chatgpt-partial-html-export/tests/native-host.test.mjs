import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
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

test('native messaging protocol reads one request and writes one framed response', async () => {
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

  child.stdin.end(Buffer.concat([header, request]));
  const chunks = [];
  for await (const chunk of child.stdout) chunks.push(chunk);
  const output = Buffer.concat(chunks);

  assert.ok(output.length >= 4);
  const responseLength = output.readUInt32LE(0);
  const response = JSON.parse(output.subarray(4, 4 + responseLength).toString('utf8'));
  assert.equal(response.ok, true);
  assert.equal(response.path, path.join(tmp, 'protocol.html'));
});
