import { describe, expect, test } from 'bun:test'
import {
  BLOG_INDEX_CONTENT_TAG,
  SCRAPS_INDEX_CONTENT_TAG,
  SCRAPS_INDEX_PATHNAME,
  getBlogPostContentTag,
  getContentTagForPathname,
  getEditorCollectionContentTag,
  getScrapContentTag,
  getScrapEntryContentTag,
} from './content-tags.infra'

describe('getContentTagForPathname', () => {
  test('maps blog index pathname to blog index tag', () => {
    expect(getContentTagForPathname('blog/index.json')).toBe(
      BLOG_INDEX_CONTENT_TAG,
    )
  })

  test('maps scraps index pathname to scraps index tag', () => {
    expect(getContentTagForPathname(SCRAPS_INDEX_PATHNAME)).toBe(
      SCRAPS_INDEX_CONTENT_TAG,
    )
  })

  test('maps editor collection json to editor tag', () => {
    expect(getContentTagForPathname('editor/notes.json')).toBe(
      getEditorCollectionContentTag('notes'),
    )
  })

  test('maps blog mdx to blog slug tag', () => {
    expect(getContentTagForPathname('blog/hello.mdx')).toBe(
      getBlogPostContentTag('hello'),
    )
  })

  test('maps scrap manifest to scrap slug tag', () => {
    expect(getContentTagForPathname('scraps/foo/manifest.json')).toBe(
      getScrapContentTag('foo'),
    )
  })

  test('maps scrap lead mdx to scrap slug tag', () => {
    expect(getContentTagForPathname('scraps/foo/lead.ja.mdx')).toBe(
      getScrapContentTag('foo'),
    )
  })

  test('maps scrap entry mdx to scrap entry tag', () => {
    expect(
      getContentTagForPathname('scraps/foo/entries/e1/entry.ja.mdx'),
    ).toBe(getScrapEntryContentTag('foo', 'e1'))
  })

  test('maps scrap entry meta to scrap entry tag', () => {
    expect(getContentTagForPathname('scraps/foo/entries/e1/meta.json')).toBe(
      getScrapEntryContentTag('foo', 'e1'),
    )
  })

  test('falls back to generic file tag for unknown paths', () => {
    expect(getContentTagForPathname('other/file.json')).toBe(
      'content:file:other/file.json',
    )
  })
})
