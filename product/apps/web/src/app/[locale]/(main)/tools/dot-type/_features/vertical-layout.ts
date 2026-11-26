export function layoutVerticalText(
  text: string,
  fontSize: number,
  measureWidth: (glyph: string) => number,
) {
  const glyphs = Array.from(text, (glyph) => ({ glyph, width: measureWidth(glyph) }))
  const width = Math.ceil(glyphs.reduce((max, glyph) => Math.max(max, glyph.width), 0))
  return {
    width,
    height: glyphs.length * fontSize,
    cells: glyphs.map(({ glyph, width: glyphWidth }, index) => ({
      glyph,
      x: (width - glyphWidth) / 2,
      y: index * fontSize,
    })),
  }
}
