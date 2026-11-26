import { describe, expect, test } from 'bun:test'
import { parseBlogSaveCommand, parseEditorBlogSaveInput } from './blog-save-input'
import { BlogWorkspaceRequestSchema } from './blog-workspace.validation'

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

describe('blog write slug boundaries', () => {
  test.each([
    ['new-post', true],
    ['  new-post  ', true],
    ['a', true],
    ['0', true],
    ['-post', false],
    ['New-Post', false],
    ['日本語', false],
    ['a/b', false],
    ['a_b', false],
    ['', false],
  ] as const)('applies the same write rules to form and JSON input (%s)', (slug, valid) => {
    const form = parseEditorBlogSaveInput(submission({
      slug,
      intent: 'edit',
      expectedVersion: 'a'.repeat(40),
      changes: '{}',
    }))
    const request = BlogWorkspaceRequestSchema.safeParse({
      operation: 'save',
      slug,
      intent: 'edit',
      expectedVersion: 'a'.repeat(40),
      changes: {},
    })
    expect(form.success).toBe(valid)
    expect(request.success).toBe(valid)
    if (form.success && request.success && request.data.operation === 'save') {
      expect(form.command.slug).toBe(slug.trim())
      expect(request.data.slug).toBe(slug.trim())
    }
  })

  test('retains a historical slug as a rename source, not a new slug', () => {
    const request = {
      operation: 'rename',
      oldSlug: 'Historical_Post',
      newSlug: 'new-post',
      expectedVersion: 'a'.repeat(40),
    }
    expect(BlogWorkspaceRequestSchema.safeParse(request).success).toBe(true)
    expect(BlogWorkspaceRequestSchema.safeParse({
      ...request,
      newSlug: request.oldSlug,
    }).success).toBe(false)
  })
})

describe('direct Blog command validation', () => {
  test.each([
    { intent: 'create', expectedVersion: undefined, changes: { title: 'T', summary: 'S', publishedAt: '2026-03-26T12:00:16.248+09:00', body: 'Body  \\r\\n', tags: ['tag', 'tag'] } },
    { intent: 'edit', expectedVersion: 'a'.repeat(40), changes: { updatedAt: null, tags: null } },
    { intent: 'edit', expectedVersion: 'bad', changes: { image: 'invalid' } },
    { intent: 'edit', expectedVersion: 'a'.repeat(40), changes: { image: 'invalid' } },
    { intent: 'create', expectedVersion: 'a'.repeat(40), changes: {} },
  ] as const)('matches the legacy FormData adapter for %j', (input) => {
    const direct = parseBlogSaveCommand({ slug: 'new-post', ...input })
    const form = parseEditorBlogSaveInput(submission({
      intent: input.intent,
      expectedVersion: input.expectedVersion ?? '',
      changes: JSON.stringify(input.changes),
    }))
    if (form.success) {
      expect(direct).toEqual({ success: true, command: form.command })
    } else {
      expect(direct).toEqual(form)
    }
  })

  test('does not turn a numeric overflow into an explicit null update', () => {
    const input = BlogWorkspaceRequestSchema.parse(JSON.parse(
      '{"operation":"save","slug":"new-post","intent":"edit","expectedVersion":"'+ 'a'.repeat(40) +'","changes":{"updatedAt":1e400}}',
    ))
    if (input.operation !== 'save') throw new Error('unexpected operation')
    expect(parseBlogSaveCommand(input)).toMatchObject({ success: false, error: 'invalid' })
  })
})
