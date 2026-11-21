import { expect, test } from 'bun:test'
import { reconcileSourceInput, replaceSourceRange } from './source-text.domain'

test('keeps line endings and hard breaks around a textarea edit', () => {
  const source = '日本語  \r\nOld title\r\n\n<Evidence />\r\n'
  expect(
    reconcileSourceInput(source, '日本語  \nNew title\n\n<Evidence />\n'),
  ).toBe('日本語  \r\nNew title\r\n\n<Evidence />\r\n')
})

test('inserts a link at selection offsets from a normalized textarea', () => {
  expect(
    replaceSourceRange(
      'First  \r\nselected\r\nLast',
      8,
      16,
      '[selected](https://example.com)',
    ),
  ).toBe('First  \r\n[selected](https://example.com)\r\nLast')
})
