import { describe, expect, test } from 'bun:test'
import { createTextDocumentVersion } from './text-document.infra'

describe('createTextDocumentVersion', () => {
  test('ignores trailing newlines when hashing content', () => {
    expect(createTextDocumentVersion('hello')).toBe(
      createTextDocumentVersion('hello\n'),
    )
    expect(createTextDocumentVersion('hello')).toBe(
      createTextDocumentVersion('hello\n\n'),
    )
  })
})
