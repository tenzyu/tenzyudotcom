import {
  copy as copyBlob,
  del as deleteBlob,
  get as getBlob,
  head as headBlob,
  list as listBlobs,
  put as putBlob,
  type CopyCommandOptions,
  type HeadBlobResult,
  type ListBlobResultBlob,
  type PutBlobResult,
} from '@vercel/blob'
import {
  createBlobLocalStore,
  type BlobLocalMetadata,
  type BlobLocalPutOptions,
} from '@tenzyu/blob-local'
import { env, isEditorBlobStorage } from '@/config/env.infra'
import { getStorageRootDir } from './storage-root.infra'

type BlobMetadata = BlobLocalMetadata | HeadBlobResult | ListBlobResultBlob | PutBlobResult
export type ContentBlobGetResult = {
  body: Uint8Array
  json: <T>() => Promise<T>
  pathname: string
  size?: number
  text: () => Promise<string>
  uploadedAt?: Date
  url?: string
}

export type ContentBlobStore = {
  copy: (
    fromPathname: string,
    toPathname: string,
    options?: Partial<CopyCommandOptions>,
  ) => Promise<BlobMetadata>
  del: (pathname: string | readonly string[]) => Promise<void>
  get: (pathname: string) => Promise<ContentBlobGetResult | null>
  head: (pathname: string) => Promise<BlobMetadata | null>
  list: (options?: { prefix?: string }) => Promise<{ blobs: BlobMetadata[] }>
  put: (
    pathname: string,
    body: string | Buffer | Uint8Array | ArrayBuffer | Blob | ReadableStream<Uint8Array>,
    options?: BlobLocalPutOptions,
  ) => Promise<BlobMetadata>
}

let blobStore: ContentBlobStore | undefined

async function toBytes(
  body: string | Buffer | Uint8Array | ArrayBuffer | Blob | ReadableStream<Uint8Array>,
) {
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

async function wrapVercelGetResult(
  pathname: string,
  blob: Awaited<ReturnType<typeof getBlob>>,
) {
  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    return null
  }

  const body = new Uint8Array(await new Response(blob.stream).arrayBuffer())

  return {
    body,
    pathname,
    size: blob.blob.size ?? undefined,
    text: async () => Buffer.from(body).toString('utf8'),
    json: async <T>() => JSON.parse(Buffer.from(body).toString('utf8')) as T,
    uploadedAt: blob.blob.uploadedAt ?? undefined,
    url: blob.blob.url,
  } satisfies ContentBlobGetResult
}

function makeVercelBlobStore(): ContentBlobStore {
  return {
    async copy(fromPathname, toPathname, options = {}) {
      return copyBlob(fromPathname, toPathname, {
        access: 'public',
        token: env.blobReadWriteToken,
        ...options,
      })
    },

    async del(pathname) {
      await deleteBlob(pathname as string[] | string, {
        token: env.blobReadWriteToken,
      })
    },

    async get(pathname) {
      const blob = await getBlob(pathname, {
        access: 'public',
        token: env.blobReadWriteToken,
      })
      return wrapVercelGetResult(pathname, blob)
    },

    async head(pathname) {
      try {
        return await headBlob(pathname, {
          token: env.blobReadWriteToken,
        })
      } catch {
        return null
      }
    },

    async list(options = {}) {
      return listBlobs({
        prefix: options.prefix,
        token: env.blobReadWriteToken,
      })
    },

    async put(pathname, body, options = {}) {
      return putBlob(pathname, await toBytes(body), {
        access: 'public',
        addRandomSuffix: options.addRandomSuffix ?? false,
        allowOverwrite: options.allowOverwrite ?? true,
        contentType: options.contentType,
        token: env.blobReadWriteToken,
      })
    },
  }
}

export function makeContentBlobStore(): ContentBlobStore {
  if (blobStore) {
    return blobStore
  }

  blobStore = isEditorBlobStorage
    ? makeVercelBlobStore()
    : (createBlobLocalStore({
        rootDir: getStorageRootDir(),
      }) as ContentBlobStore)

  return blobStore
}
