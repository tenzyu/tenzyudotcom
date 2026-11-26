import { isDeepStrictEqual } from 'node:util'
import matter from 'gray-matter'
import { CST, isMap, isScalar, parseDocument } from 'yaml'
import { StorageError } from '@tenzyu/revisioned-content/contracts'
import { parseBlogFrontmatter } from './blog-frontmatter.assemble'
import type { BlogChanges } from '@tenzyu/publishing-domain/blog'

export function readBlogSource(source: string, pathname: string) {
  // Passing options keeps gray-matter from retaining every historical source.
  const { data, content } = matter(source, { language: 'yaml' })
  return { data, content, metadata: parseBlogFrontmatter(data, pathname) }
}

function ambiguousEdit() {
  return new StorageError('The source frontmatter could not be edited safely.')
}

function splitSource(source: string) {
  const block =
    /^(\uFEFF?---[ \t]*\r?\n)([\s\S]*?)(^---[ \t]*(?:\r?\n|$))/m.exec(source)
  if (block?.index !== 0) throw ambiguousEdit()
  return {
    opening: block[1],
    yaml: block[2],
    closing: block[3],
    content: source.slice(block[0].length),
  }
}

function commentsWithin(token: CST.CollectionItem, start: number, end: number) {
  const comments = new Map<number, string>()
  function collect(tokens: CST.Token[] | undefined) {
    for (const token of tokens ?? []) {
      if (
        token.type === 'comment' &&
        token.offset >= start &&
        token.offset < end
      ) {
        comments.set(token.offset, token.source)
      }
    }
  }
  CST.visit(token, (item) => {
    collect(item.start)
    collect(item.sep)
    for (const child of [item.key, item.value]) {
      if (child?.type === 'block-scalar') collect(child.props)
      if (child && 'end' in child) collect(child.end)
    }
  })
  return [...comments].sort(([a], [b]) => a - b).map(([, text]) => text)
}

type MetadataChanges = Omit<BlogChanges, 'body'>

function updateYaml(yaml: string, changes: MetadataChanges, newline: string) {
  const doc = parseDocument(yaml, { keepSourceTokens: true })
  const map = doc.contents
  if (doc.errors.length || !isMap(map) || map.flow || !map.range) {
    throw ambiguousEdit()
  }

  const edits: { start: number; end: number; text: string }[] = []
  const newFields: string[] = []
  for (const [key, value] of Object.entries(changes)) {
    const encoded = JSON.stringify(value)
    const pair = map.items.find(
      (pair) => isScalar(pair.key) && pair.key.value === key,
    )
    if (!pair) {
      newFields.push(`${key}: ${encoded}`)
      continue
    }
    if (
      !pair.srcToken ||
      !isScalar(pair.key) ||
      !pair.key.range ||
      !pair.value?.range
    ) {
      throw ambiguousEdit()
    }
    const [start, end] = pair.value.range
    if (start === end) {
      const colon = pair.srcToken.sep?.find(
        (token) => token.type === 'map-value-ind',
      )
      if (!colon) throw ambiguousEdit()
      edits.push({
        start: colon.offset + 1,
        end: colon.offset + 1,
        text: ` ${encoded}`,
      })
      continue
    }

    const valueLine = yaml.lastIndexOf('\n', start - 1) + 1
    const keyLine = yaml.lastIndexOf('\n', pair.key.range[0] - 1) + 1
    const keyIndent = pair.key.range[0] - keyLine
    const indent =
      valueLine > keyLine && start - valueLine <= keyIndent ? '  ' : ''
    const tail = yaml.slice(start, end).match(/\r?\n[ \t]*$/)?.[0] ?? ''
    const comments = commentsWithin(pair.srcToken, start, end)
    if (comments.length && !tail) throw ambiguousEdit()
    const retained = comments
      .map((comment) => newline + ' '.repeat(keyIndent) + comment)
      .join('')
    edits.push({ start, end, text: indent + encoded + retained + tail })
  }
  if (newFields.length) {
    const start = map.range[2]
    const indent = ' '.repeat(
      map.range[0] - (yaml.lastIndexOf('\n', map.range[0] - 1) + 1),
    )
    const lead = yaml[start - 1] === '\n' ? '' : newline
    edits.push({
      start,
      end: start,
      text: lead + indent + newFields.join(newline + indent) + newline,
    })
  }
  for (const { start, end, text } of edits.sort((a, b) => b.start - a.start)) {
    yaml = yaml.slice(0, start) + text + yaml.slice(end)
  }
  return yaml
}

export function editBlogSource(
  pathname: string,
  original: string | undefined,
  { body, ...changes }: BlogChanges,
) {
  const existing = original === undefined ? undefined : splitSource(original)
  const before =
    original === undefined ? undefined : readBlogSource(original, pathname)
  if (existing && existing.content !== before?.content) throw ambiguousEdit()

  const content = body ?? existing?.content ?? ''
  let source: string
  if (existing) {
    const newline = existing.opening.endsWith('\r\n') ? '\r\n' : '\n'
    const yaml = Object.keys(changes).length
      ? updateYaml(existing.yaml, changes, newline)
      : existing.yaml
    const closing =
      content && !existing.closing.endsWith('\n')
        ? existing.closing + newline
        : existing.closing
    source = existing.opening + yaml + closing + content
  } else {
    const yaml = Object.entries(changes)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}\n`)
      .join('')
    source = `---\n${yaml}---\n${content}`
  }

  let parsed: ReturnType<typeof readBlogSource>
  try {
    parsed = readBlogSource(source, pathname)
  } catch {
    throw new StorageError(
      'The resulting blog fields are invalid. Check the dates.',
    )
  }
  if (parsed.content !== content) throw ambiguousEdit()
  if (before) {
    const unedited = (data: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(data).filter(([key]) => !Object.hasOwn(changes, key)),
      )
    if (!isDeepStrictEqual(unedited(before.data), unedited(parsed.data)))
      throw ambiguousEdit()
  }
  const { publishedAt, updatedAt, ...other } = parsed.metadata
  const actual = {
    ...other,
    publishedAt: publishedAt.toISOString(),
    updatedAt: updatedAt?.toISOString(),
  }
  for (const [key, value] of Object.entries(changes) as [
    keyof MetadataChanges,
    MetadataChanges[keyof MetadataChanges],
  ][]) {
    if (!isDeepStrictEqual(actual[key], value ?? undefined))
      throw ambiguousEdit()
  }
  return { source, metadata: parsed.metadata }
}
