import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { put, list, get } from '@vercel/blob';

/**
 * Editorial storage sync script for Vercel Blob.
 * 
 * Usage:
 *   PUSH (Local -> Blob):
 *     BLOB_READ_WRITE_TOKEN=xxx bun scripts/sync-editorial.ts push
 *   PULL (Blob -> Local):
 *     BLOB_READ_WRITE_TOKEN=xxx bun scripts/sync-editorial.ts pull
 */

const LOCAL_DIR = join(process.cwd(), 'storage', 'editorial');
const BLOB_PREFIX = process.env.EDITORIAL_BLOB_PREFIX || 'editorial';
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN is required.');
  process.exit(1);
}

async function push() {
  console.log('Pushing local editorial files to Vercel Blob...');
  const files = await readdir(LOCAL_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  for (const filename of jsonFiles) {
    const filePath = join(LOCAL_DIR, filename);
    const content = await readFile(filePath);
    const blobPath = `${BLOB_PREFIX}/${filename}`;

    console.log(`  Uploading ${filename} -> ${blobPath}...`);
    await put(blobPath, content, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
      token: TOKEN,
    });
  }
  console.log('Push complete.');
}

async function pull() {
  console.log('Pulling editorial files from Vercel Blob to local...');
  await mkdir(LOCAL_DIR, { recursive: true });

  const { blobs } = await list({
    prefix: `${BLOB_PREFIX}/`,
    token: TOKEN,
  });

  if (blobs.length === 0) {
    console.log('No blobs found with prefix:', BLOB_PREFIX);
    return;
  }

  for (const blob of blobs) {
    const filename = blob.pathname.split('/').pop();
    if (!filename || !filename.endsWith('.json')) continue;

    console.log(`  Downloading ${blob.pathname} -> ${filename}...`);
    const response = await get(blob.url, { token: TOKEN });
    const content = await response.text();
    
    // Format JSON with 2 spaces to keep it clean
    const formatted = JSON.stringify(JSON.parse(content), null, 2);
    await writeFile(join(LOCAL_DIR, filename), `${formatted}\n`);
  }
  console.log('Pull complete.');
}

const command = process.argv[2];

if (command === 'push') {
  push().catch(console.error);
} else if (command === 'pull') {
  pull().catch(console.error);
} else {
  console.log('Usage: bun scripts/sync-editorial.ts [push|pull]');
}
