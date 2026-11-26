import { expect, test } from 'bun:test'
import { layoutVerticalText } from './vertical-layout'

test('measures and draws the same Unicode code points in vertical text', () => {
  const measured: string[] = []
  const result = layoutVerticalText('A😀日', 16, (glyph) => {
    measured.push(glyph)
    return glyph === 'A' ? 8 : 16
  })
  expect(measured).toEqual(['A', '😀', '日'])
  expect(result).toEqual({
    width: 16,
    height: 48,
    cells: [
      { glyph: 'A', x: 4, y: 0 },
      { glyph: '😀', x: 0, y: 16 },
      { glyph: '日', x: 0, y: 32 },
    ],
  })
})

test('empty vertical text has no cells', () => {
  expect(layoutVerticalText('', 16, () => 10)).toEqual({
    width: 0, height: 0, cells: [],
  })
})
