export type DotGenerationParams = {
  text: string
  fontSize: number
  threshold: number
  pixelChar: string
  emptyChar: string
  orientation: 'horizontal' | 'vertical'
}

/**
 * Generates an ASCII art representation of the given text using a canvas.
 * Optimized for performance using Uint32Array views and string array joining.
 */
export function generateDotArt({
  text,
  fontSize,
  threshold,
  pixelChar,
  emptyChar,
  orientation,
}: DotGenerationParams): string {
  if (!text) return ''

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return ''

  // Font setup
  const font = `bold ${fontSize}px sans-serif`
  ctx.font = font
  ctx.textBaseline = 'top'

  // Calculate dimensions
  let width = 0
  let height = 0

  if (orientation === 'horizontal') {
    const metrics = ctx.measureText(text)
    width = Math.ceil(metrics.width)
    height = fontSize
  } else {
    // Vertical: max width of chars, height = char count * line height
    let maxWidth = 0
    for (const char of text) {
      const metrics = ctx.measureText(char)
      maxWidth = Math.max(maxWidth, metrics.width)
    }
    width = Math.ceil(maxWidth)
    height = fontSize * text.length
  }

  // Sanity check for dimensions to prevent crashes
  if (width === 0 || height === 0) return ''

  // Resize canvas
  canvas.width = width
  canvas.height = height

  // Clear background (white = 255, 255, 255)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Draw text (black = 0, 0, 0)
  ctx.fillStyle = '#000000'
  ctx.font = font
  ctx.textBaseline = 'top'

  if (orientation === 'horizontal') {
    ctx.fillText(text, 0, 2)
  } else {
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const metrics = ctx.measureText(char)
      const x = (width - metrics.width) / 2
      const y = i * fontSize + 2
      ctx.fillText(char, x, y)
    }
  }

  // Pixel analysis
  const imageData = ctx.getImageData(0, 0, width, height)
  const data32 = new Uint32Array(imageData.data.buffer)

  // Pre-allocate array for rows
  const rows = new Array(height)

  for (let y = 0; y < height; y++) {
    let row = ''
    const rowOffset = y * width
    for (let x = 0; x < width; x++) {
      // Little-endian: AABBGGRR
      // White: 0xFFFFFFFF
      // Black: 0xFF000000 (with alpha 255)
      // We need brightness.
      // Since we draw black text on white background:
      // Darker pixels have lower values.

      // Using raw bytes for compatibility and avoiding endianness issues in logic if complex
      // But for speed, let's just grab the 32-bit value.
      const pixel = data32[rowOffset + x]

      // Extract RGB (ignoring Alpha which should be 255)
      const r = pixel & 0xff
      const g = (pixel >> 8) & 0xff
      const b = (pixel >> 16) & 0xff

      // Perceptual brightness (Rec. 601) or simple average
      // Simple average was used in original: (r+g+b)/3
      // Let's stick to simple average for consistency, or perform a slight optimization
      // (r+g+b) / 3 < threshold  <=>  r+g+b < threshold * 3
      if (r + g + b < threshold * 3) {
        row += pixelChar
      } else {
        row += emptyChar
      }
    }
    rows[y] = row
  }

  return rows.join('\n')
}
