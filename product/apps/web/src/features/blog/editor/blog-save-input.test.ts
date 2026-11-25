import { describe, expect, test } from 'bun:test'
import { parseEditorBlogSaveInput } from './blog-save-input'

function submission(fields: Record<string, string>) {
  const form = new FormData()
  for (const [key, value] of Object.entries({
    locale: 'ja',
    slug: 'new-post',
    ...fields,
  })) {
    form.set(key, value)
  }
  return form
}

describe('parseEditorBlogSaveInput', () => {
  test('accepts the old empty create precondition and an explicit instant', () => {
    expect(
      parseEditorBlogSaveInput(
        submission({
          title: 'New Post',
          summary: 'summary',
          body: '# Hello  \r\n',
          publishedAt: '2026-03-26T12:00:16.248+09:00',
          expectedVersion: '',
        }),
      ),
    ).toMatchObject({
      success: true,
      command: {
        intent: 'create',
        changes: {
          publishedAt: '2026-03-26T03:00:16.248Z',
          body: '# Hello  \r\n',
        },
      },
    })
  })

  test('requires an edit token that is a blob OID', () => {
    expect(
      parseEditorBlogSaveInput(submission({ expectedVersion: 'f'.repeat(64) })),
    ).toMatchObject({ success: false, error: 'conflict' })
  })

  test('distinguishes omitted fields and explicitly cleared optional fields', () => {
    expect(
      parseEditorBlogSaveInput(
        submission({
          intent: 'edit',
          expectedVersion: 'a'.repeat(40),
          changes: '{"updatedAt":null,"tags":null}',
        }),
      ),
    ).toMatchObject({
      success: true,
      command: { intent: 'edit', changes: { updatedAt: null, tags: null } },
    })
  })

  test.each([
    { image: '/replacement.png' },
    { publishedAt: '2026-03-26T12:00' },
    { publishedAt: '2026-03-26T12:00+99:99' },
  ])('rejects disallowed or ambiguous edits (%j)', (changes) => {
    expect(
      parseEditorBlogSaveInput(
        submission({
          intent: 'edit',
          expectedVersion: 'a'.repeat(40),
          changes: JSON.stringify(changes),
        }),
      ),
    ).toMatchObject({ success: false, error: 'invalid' })
  })
})
