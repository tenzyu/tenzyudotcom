import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { put, list, get } from '@vercel/blob';

/**
 * Storage sync script for Vercel Blob (Editor & Blog).
 * 
 * Usage:
 *   PUSH (Local -> Blob):
 *     BLOB_READ_WRITE_TOKEN=xxx bun scripts/sync-storage.ts push
 *   PULL (Blob -> Local):
 *     BLOB_READ_WRITE_TOKEN=xxx bun scripts/sync-storage.ts pull
 */

const STORAGE_ROOT = join(process.cwd(), 'storage');
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN is required.');
  process.exit(1);
}

async function getAllFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const res = join(dir, entry.name);
    return entry.isDirectory() ? getAllFiles(res) : [res];
  }));
  return files.flat();
}

async function push() {
  console.log('Pushing local storage files to Vercel Blob...');
  const allFiles = await getAllFiles(STORAGE_ROOT);
  const targetFiles = allFiles.filter(f => f.endsWith('.json') || f.endsWith('.mdx'));

  for (const filePath of targetFiles) {
    const relativePath = relative(STORAGE_ROOT, filePath);
    const content = await readFile(filePath);
    
    console.log(`  Uploading ${relativePath}...`);
    await put(relativePath, content, {
      access: 'public',
      addRandomSuffix: false,
      contentType: relativePath.endsWith('.json') ? 'application/json' : 'text/markdown',
      token: TOKEN,
      allowOverwrite: true,
    });
  }
  console.log('Push complete.');
}

async function pull() {
  console.log('Pulling storage files from Vercel Blob to local...');

  const { blobs } = await list({
    token: TOKEN,
  });

  if (blobs.length === 0) {
    console.log('No blobs found.');
    return;
  }

  for (const blob of blobs) {
    if (!blob.pathname.endsWith('.json') && !blob.pathname.endsWith('.mdx')) continue;

    const localPath = join(STORAGE_ROOT, blob.pathname);
    const localDir = join(localPath, '..');
    await mkdir(localDir, { recursive: true });

    console.log(`  Downloading ${blob.pathname}...`);
    const response = await get(blob.url, { 
      access: 'public',
      token: TOKEN 
    });
    
    if (!response) {
      console.warn(`  Warning: Failed to download ${blob.pathname}`);
      continue;
    }

    let content = await new Response(response.stream).text();
    
    if (blob.pathname.endsWith('.json')) {
      // Format JSON
      content = `${JSON.stringify(JSON.parse(content), null, 2)}\n`;
    }

    await writeFile(localPath, content);
  }
  console.log('Pull complete.');
}

const command = process.argv[2];

if (command === 'push') {
  push().catch(console.error);
} else if (command === 'pull') {
  pull().catch(console.error);
} else {
  console.log('Usage: bun scripts/sync-storage.ts [push|pull]');
}
