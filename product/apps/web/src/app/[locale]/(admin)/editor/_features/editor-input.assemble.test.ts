import { describe, expect, test } from 'bun:test'
import {
  parseEditorBlogSaveInput,
  validateEditorBlogPostDates,
} from './editor-input.assemble'

describe('validateEditorBlogPostDates', () => {
  test('rejects invalid publishedAt', () => {
    expect(
      validateEditorBlogPostDates({
        publishedAt: 'not-a-date',
      }),
    ).toEqual({
      success: false,
      error: 'publishedAt',
      message: 'Published At must be a valid date and time.',
    })
  })

  test('rejects updatedAt earlier than publishedAt', () => {
    expect(
      validateEditorBlogPostDates({
        publishedAt: '2026-03-26T12:00',
        updatedAt: '2026-03-26T11:59',
      }),
    ).toEqual({
      success: false,
      error: 'chronology',
      message: 'Updated At must not be earlier than Published At.',
    })
  })

  test('accepts valid chronology', () => {
    const result = validateEditorBlogPostDates({
      publishedAt: '2026-03-26T12:00',
      updatedAt: '2026-03-26T12:01',
    })

    expect(result.success).toBe(true)
    if (!result.success) {
      throw new Error('Expected valid blog post dates')
    }

    expect(Number.isNaN(result.data.publishedAt.getTime())).toBe(false)
    expect(Number.isNaN(result.data.updatedAt?.getTime() ?? NaN)).toBe(false)
    const updatedAt = result.data.updatedAt
    expect(updatedAt).toBeDefined()
    if (!updatedAt) {
      throw new Error('Expected updatedAt to be present')
    }
    expect(updatedAt.getTime()).toBeGreaterThan(result.data.publishedAt.getTime())
  })
})

describe('parseEditorBlogSaveInput', () => {
  test('accepts blog creation input without expectedVersion', () => {
    const parsed = parseEditorBlogSaveInput({
      locale: 'ja',
      slug: 'new-post',
      title: 'New Post',
      summary: 'summary',
      publishedAt: '2026-03-26T12:00',
      updatedAt: undefined,
      tags: '',
      body: '# Hello',
      expectedVersion: undefined,
    })

    expect(parsed.success).toBe(true)
  })
})
