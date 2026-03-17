import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { get, list, put, del } from '@vercel/blob'
import { createBlobLocalStore } from '@tenzyu/blob-local'
import { getStorageRootDir } from '../src/lib/content-store/storage-root.infra'

type SyncEntry = {
  localHash: string | null
  remoteHash: string | null
}

type SyncState = {
  entries: Record<string, SyncEntry>
}

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN
const storageRoot = getStorageRootDir()
const stateDir = path.join(storageRoot, '.sync-state')
const statePath = path.join(stateDir, 'vercel-blob.json')
const localBlobStore = createBlobLocalStore({
  rootDir: storageRoot,
})

if (!TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN is required.')
  process.exit(1)
}

function isSyncTarget(pathname: string) {
  return !pathname.startsWith('.sync-state/') &&
    (pathname.endsWith('.json') || pathname.endsWith('.mdx'))
}

function hashContent(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

function buildConflictContent(localContent: string, remoteContent: string, pathname: string) {
  return [
    `<<<<<<< LOCAL (${pathname})`,
    localContent.trimEnd(),
    '=======',
    remoteContent.trimEnd(),
    '>>>>>>> REMOTE',
    '',
  ].join('\n')
}

async function loadState(): Promise<SyncState> {
  try {
    return JSON.parse(await readFile(statePath, 'utf8')) as SyncState
  } catch {
    return { entries: {} }
  }
}

async function saveState(state: SyncState) {
  await mkdir(stateDir, { recursive: true })
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

async function getLocalText(pathname: string) {
  const blob = await localBlobStore.get(pathname)
  return blob ? blob.text() : null
}

async function getRemoteText(pathname: string) {
  const remote = await get(pathname, {
    access: 'public',
    token: TOKEN,
  })

  if (!remote || remote.statusCode !== 200 || !remote.stream) {
    return null
  }

  return new Response(remote.stream).text()
}

async function listLocalPathnames() {
  const { blobs } = await localBlobStore.list()
  return blobs.map((blob) => blob.pathname).filter(isSyncTarget)
}

async function listRemotePathnames() {
  const { blobs } = await list({ token: TOKEN })
  return blobs.map((blob) => blob.pathname).filter(isSyncTarget)
}

async function push() {
  console.log('Pushing local storage files to Vercel Blob...')
  const state = await loadState()
  const localPathnames = await listLocalPathnames()
  const remotePathnames = await listRemotePathnames()
  const allPathnames = [...new Set([...localPathnames, ...remotePathnames, ...Object.keys(state.entries)])].sort()
  let hasConflicts = false

  for (const pathname of allPathnames) {
    const localContent = await getLocalText(pathname)
    const remoteContent = await getRemoteText(pathname)
    const base = state.entries[pathname] ?? { localHash: null, remoteHash: null }
    const localHash = localContent ? hashContent(localContent) : null
    const remoteHash = remoteContent ? hashContent(remoteContent) : null
    const localChanged = localHash !== base.localHash
    const remoteChanged = remoteHash !== base.remoteHash

    if (localHash === remoteHash) {
      state.entries[pathname] = { localHash, remoteHash }
      continue
    }

    if (!localChanged && remoteChanged) {
      console.warn(`Conflict: remote changed for ${pathname}. Pull before pushing.`)
      hasConflicts = true
      continue
    }

    if (localChanged && remoteChanged) {
      console.warn(`Conflict: both local and remote changed for ${pathname}.`)
      hasConflicts = true
      continue
    }

    if (localContent === null) {
      await del(pathname, { token: TOKEN })
      delete state.entries[pathname]
      console.log(`  Deleted remote ${pathname}`)
      continue
    }

    await put(pathname, localContent, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: pathname.endsWith('.json') ? 'application/json' : 'text/markdown',
      token: TOKEN,
    })
    state.entries[pathname] = { localHash, remoteHash: localHash }
    console.log(`  Uploaded ${pathname}`)
  }

  await saveState(state)

  if (hasConflicts) {
    process.exitCode = 1
    console.warn('Push finished with conflicts.')
    return
  }

  console.log('Push complete.')
}

async function pull() {
  console.log('Pulling storage files from Vercel Blob to local...')
  const state = await loadState()
  const localPathnames = await listLocalPathnames()
  const remotePathnames = await listRemotePathnames()
  const allPathnames = [...new Set([...localPathnames, ...remotePathnames, ...Object.keys(state.entries)])].sort()
  let hasConflicts = false

  for (const pathname of allPathnames) {
    const localContent = await getLocalText(pathname)
    const remoteContent = await getRemoteText(pathname)
    const base = state.entries[pathname] ?? { localHash: null, remoteHash: null }
    const localHash = localContent ? hashContent(localContent) : null
    const remoteHash = remoteContent ? hashContent(remoteContent) : null
    const localChanged = localHash !== base.localHash
    const remoteChanged = remoteHash !== base.remoteHash

    if (localHash === remoteHash) {
      state.entries[pathname] = { localHash, remoteHash }
      continue
    }

    if (!localChanged && remoteChanged) {
      if (remoteContent === null) {
        await localBlobStore.del(pathname)
        delete state.entries[pathname]
        console.log(`  Deleted local ${pathname}`)
      } else {
        const normalized =
          pathname.endsWith('.json')
            ? `${JSON.stringify(JSON.parse(remoteContent), null, 2)}\n`
            : remoteContent

        await localBlobStore.put(pathname, normalized, {
          allowOverwrite: true,
          contentType: pathname.endsWith('.json') ? 'application/json' : 'text/markdown',
        })
        const nextHash = hashContent(normalized)
        state.entries[pathname] = { localHash: nextHash, remoteHash: remoteHash ?? nextHash }
        console.log(`  Downloaded ${pathname}`)
      }
      continue
    }

    if (localChanged && remoteChanged) {
      if (localContent !== null && remoteContent !== null) {
        const conflictContent = buildConflictContent(localContent, remoteContent, pathname)
        await localBlobStore.put(pathname, conflictContent, {
          allowOverwrite: true,
          contentType: pathname.endsWith('.json') ? 'text/plain' : 'text/markdown',
        })
        console.warn(`Conflict markers written for ${pathname}`)
      } else {
        console.warn(`Conflict: deletion/update mismatch for ${pathname}`)
      }
      hasConflicts = true
      continue
    }

    if (localChanged && !remoteChanged) {
      console.warn(`Skipped ${pathname}; local changes are newer than sync base.`)
      hasConflicts = true
    }
  }

  await saveState(state)

  if (hasConflicts) {
    process.exitCode = 1
    console.warn('Pull finished with conflicts.')
    return
  }

  console.log('Pull complete.')
}

const command = process.argv[2]

if (command === 'push') {
  push().catch(console.error)
} else if (command === 'pull') {
  pull().catch(console.error)
} else {
  console.log('Usage: bun scripts/sync-storage.ts [push|pull]')
}
