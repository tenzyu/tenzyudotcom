import fs from 'node:fs'
import path from 'node:path'

import matter from 'gray-matter'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Frontmatter<T = Record<string, any>> = {
  title: string
  summary: string
  image?: string
  publishedAt: Date
  updatedAt?: Date
} & T

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MDXData<T = Record<string, any>> = {
  metadata: Frontmatter<T>
  slug: string
  rawContent: string
}

async function getMDXFiles(dir: string): Promise<string[]> {
  return (await fs.promises.readdir(dir)).filter(
    (file) => path.extname(file) === '.mdx',
  )
}

async function readMDXFile<T>(filePath: string): Promise<MDXData<T>> {
  const rawContent = await fs.promises.readFile(filePath, 'utf-8')
  const { data, content } = matter(rawContent)
  return {
    metadata: data as Frontmatter<T>,
    slug: path.basename(filePath, path.extname(filePath)),
    rawContent: content,
  }
}

async function getMDXData<T>(dir: string): Promise<MDXData<T>[]> {
  const files = await getMDXFiles(dir)

  return Promise.all(files.map((file) => readMDXFile<T>(path.join(dir, file))))
}

export async function getBlogPosts() {
  const posts = await getMDXData(
    path.join(process.cwd(), 'src', 'content', 'blog'),
  )
  return posts.sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() -
      new Date(a.metadata.publishedAt).getTime(),
  )
}
