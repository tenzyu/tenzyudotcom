import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Read a JSON file. Returns `undefined` when the file does not exist.
 */
export async function readJson<T = unknown>(filePath: string): Promise<T | undefined> {
  try {
    const text = await readFile(filePath, 'utf8')
    return JSON.parse(text) as T
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw err
  }
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

export async function readText(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return ''
    throw err
  }
}

export async function writeText(filePath: string, value: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, value, 'utf8')
}
