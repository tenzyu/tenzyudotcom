import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type BlobLocalMetadata = {
  pathname: string
  size: number
  uploadedAt: Date
  url: string
}

export type BlobLocalBody =
  | string
  | Buffer
  | Uint8Array
  | ArrayBuffer
  | Blob
  | ReadableStream<Uint8Array>

export type BlobLocalPutOptions = {
  addRandomSuffix?: boolean
  allowOverwrite?: boolean
  contentType?: string
}

export type BlobLocalListOptions = {
  prefix?: string
}

export type BlobLocalStoreOptions = {
  rootDir: string
}

export type BlobLocalGetResult = BlobLocalMetadata & {
  body: Uint8Array
  text: () => Promise<string>
  json: <T>() => Promise<T>
}

function normalizePathname(pathname: string) {
  return pathname.replace(/^\/+/, '').replace(/\\/g, '/')
}

function toBlobUrl(pathname: string) {
  return `blob-local://${normalizePathname(pathname)}`
}

async function toBuffer(body: BlobLocalBody) {
  if (typeof body === 'string') {
    return Buffer.from(body)
  }

  if (body instanceof Buffer) {
    return body
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body)
  }

  if (body instanceof ArrayBuffer) {
    return Buffer.from(body)
  }

  if (body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer())
  }

  return Buffer.from(await new Response(body).arrayBuffer())
}

function withRandomSuffix(pathname: string) {
  const parsed = path.posix.parse(pathname)
  return path.posix.join(parsed.dir, `${parsed.name}-${randomUUID()}${parsed.ext}`)
}

async function collectFiles(rootDir: string, currentDir: string, results: string[]) {
  const entries = await readdir(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      await collectFiles(rootDir, absolutePath, results)
      continue
    }

    results.push(path.relative(rootDir, absolutePath).split(path.sep).join('/'))
  }
}

async function buildMetadata(rootDir: string, pathname: string): Promise<BlobLocalMetadata> {
  const normalizedPathname = normalizePathname(pathname)
  const stats = await stat(path.join(rootDir, normalizedPathname))

  return {
    pathname: normalizedPathname,
    size: stats.size,
    uploadedAt: stats.mtime,
    url: toBlobUrl(normalizedPathname),
  }
}

export function createBlobLocalStore(options: BlobLocalStoreOptions) {
  const rootDir = path.resolve(options.rootDir)

  return {
    async put(pathname: string, body: BlobLocalBody, options: BlobLocalPutOptions = {}) {
      const normalizedPathname = normalizePathname(pathname)
      const finalPathname = options.addRandomSuffix
        ? withRandomSuffix(normalizedPathname)
        : normalizedPathname
      const absolutePath = path.join(rootDir, finalPathname)

      if (!options.allowOverwrite) {
        const existing = await this.head(finalPathname)
        if (existing) {
          throw new Error(`Blob already exists: ${finalPathname}`)
        }
      }

      await mkdir(path.dirname(absolutePath), { recursive: true })
      await writeFile(absolutePath, await toBuffer(body))
      return buildMetadata(rootDir, finalPathname)
    },

    async get(pathname: string): Promise<BlobLocalGetResult | null> {
      const normalizedPathname = normalizePathname(pathname)
      const absolutePath = path.join(rootDir, normalizedPathname)

      try {
        const [body, metadata] = await Promise.all([
          readFile(absolutePath),
          buildMetadata(rootDir, normalizedPathname),
        ])

        return {
          ...metadata,
          body,
          text: async () => body.toString('utf8'),
          json: async <T>() => JSON.parse(body.toString('utf8')) as T,
        }
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'ENOENT'
        ) {
          return null
        }

        throw error
      }
    },

    async head(pathname: string): Promise<BlobLocalMetadata | null> {
      try {
        return await buildMetadata(rootDir, pathname)
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'ENOENT'
        ) {
          return null
        }

        throw error
      }
    },

    async list(options: BlobLocalListOptions = {}) {
      const files: string[] = []

      await mkdir(rootDir, { recursive: true })
      await collectFiles(rootDir, rootDir, files)

      const prefix = options.prefix ? normalizePathname(options.prefix) : undefined
      const matchedFiles = prefix
        ? files.filter((pathname) => pathname.startsWith(prefix))
        : files

      const blobs = await Promise.all(
        matchedFiles.sort().map((pathname) => buildMetadata(rootDir, pathname)),
      )

      return { blobs }
    },

    async del(pathname: string | readonly string[]) {
      const pathnames = Array.isArray(pathname) ? pathname : [pathname]

      await Promise.all(
        pathnames.map(async (currentPathname) => {
          const normalizedPathname = normalizePathname(currentPathname)
          await rm(path.join(rootDir, normalizedPathname), {
            force: true,
          })
        }),
      )
    },

    async copy(fromPathname: string, toPathname: string, options: BlobLocalPutOptions = {}) {
      const sourcePathname = normalizePathname(fromPathname)
      const targetPathname = options.addRandomSuffix
        ? withRandomSuffix(normalizePathname(toPathname))
        : normalizePathname(toPathname)
      const source = await this.get(sourcePathname)

      if (!source) {
        throw new Error(`Blob not found: ${sourcePathname}`)
      }

      return this.put(targetPathname, source.body, {
        ...options,
        allowOverwrite: options.allowOverwrite ?? true,
      })
    },
  }
}
