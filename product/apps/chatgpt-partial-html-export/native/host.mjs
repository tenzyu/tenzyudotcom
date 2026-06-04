#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const MAX_MESSAGE_BYTES = 64 * 1024 * 1024;

export async function handleMessage(message) {
  try {
    if (!message || typeof message !== 'object') {
      return { ok: false, error: 'Message must be an object.' };
    }

    if (message.type !== 'writeHtml') {
      return { ok: false, error: `Unsupported message type: ${String(message.type)}` };
    }

    if (typeof message.html !== 'string' || message.html.length === 0) {
      return { ok: false, error: 'html must be a non-empty string.' };
    }

    const outputDir = normalizeOutputDir(message.outputDir);
    const filename = sanitizeFilename(message.filename || 'chatgpt-export.html');
    const outputPath = resolveOutputPath(outputDir, filename);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, message.html, 'utf8');

    return { ok: true, path: outputPath };
  } catch (error) {
    return { ok: false, error: error && error.message ? error.message : String(error) };
  }
}

export function normalizeOutputDir(value) {
  const outputDir = String(value || '').trim();
  if (!outputDir) {
    throw new Error('outputDir is required.');
  }
  if (!path.isAbsolute(outputDir)) {
    throw new Error(`outputDir must be absolute: ${outputDir}`);
  }
  return path.resolve(outputDir);
}

export function sanitizeFilename(value) {
  const basename = String(value || 'chatgpt-export.html').replace(/\\/g, '/').split('/').pop();
  const safe = basename
    .normalize('NFKC')
    .replace(/[\\/<>:"|?*]+/g, '-')
    .replaceAll(String.fromCharCode(0), '-')
    .replace(/./gs, char => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? '' : char;
    })
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .slice(0, 180);

  const finalName = safe || 'chatgpt-export.html';
  return /\.html?$/i.test(finalName) ? finalName : `${finalName}.html`;
}

export function resolveOutputPath(outputDir, filename) {
  const resolvedDir = path.resolve(outputDir);
  const resolvedPath = path.resolve(resolvedDir, sanitizeFilename(filename));
  const relative = path.relative(resolvedDir, resolvedPath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Resolved output path escapes outputDir.');
  }

  return resolvedPath;
}

async function readNativeMessage() {
  const chunks = [];
  let total = 0;

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
    total += chunk.length;
    if (total > MAX_MESSAGE_BYTES + 4) {
      throw new Error('Native message is too large.');
    }
  }

  const buffer = Buffer.concat(chunks);
  if (buffer.length < 4) {
    throw new Error('Native message length prefix is missing.');
  }

  const length = buffer.readUInt32LE(0);
  if (length > MAX_MESSAGE_BYTES) {
    throw new Error(`Native message exceeds maximum size: ${length}`);
  }

  const body = buffer.subarray(4, 4 + length);
  if (body.length !== length) {
    throw new Error('Native message body is truncated.');
  }

  return JSON.parse(body.toString('utf8'));
}

function writeNativeMessage(message) {
  const json = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(json.length, 0);
  process.stdout.write(Buffer.concat([header, json]));
}

async function main() {
  try {
    const message = await readNativeMessage();
    const response = await handleMessage(message);
    writeNativeMessage(response);
  } catch (error) {
    writeNativeMessage({ ok: false, error: error && error.message ? error.message : String(error) });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
