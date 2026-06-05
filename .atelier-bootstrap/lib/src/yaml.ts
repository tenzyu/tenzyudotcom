/**
 * A minimal YAML emitter scoped to the ProjectBrief and similar documents.
 *
 * Atelier v0 does not depend on a YAML library: the project brief is a
 * small, predictable shape, and emitting it ourselves avoids adding a
 * dependency to a tooling-only directory.
 *
 * The emitter supports the subset actually produced by the reader:
 *   - scalars (string, number, boolean, null)
 *   - block sequences
 *   - block mappings
 *   - nested mappings
 *
 * It does not support anchors, tags, or flow style.
 */

type YamlScalar = string | number | boolean | null
export type YamlValue =
  | YamlScalar
  | YamlValue[]
  | { [key: string]: YamlValue }

function isPlainObject(value: unknown): value is Record<string, YamlValue> {
  if (value === null || typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function formatScalar(value: YamlScalar): string {
  if (value === null) return 'null'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'string') {
    if (value === '') return '""'
    if (/^[A-Za-z0-9_\-./]+$/.test(value)) return value
    return JSON.stringify(value)
  }
  return JSON.stringify(value)
}

function indent(text: string, spaces: number): string {
  if (text === '') return ''
  const pad = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line) => (line === '' ? '' : pad + line))
    .join('\n')
}

export function emitYaml(value: YamlValue, indentSpaces = 2): string {
  return render(value, 0, indentSpaces)
}

function render(value: YamlValue, depth: number, indentSpaces: number): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]\n'
    const lines: string[] = []
    for (const item of value) {
      if (isPlainObject(item)) {
        const entries = Object.entries(item)
        if (entries.length === 0) {
          lines.push(`${'-'}\n`)
          continue
        }
        const [firstKey, firstValue] = entries[0]
        const firstRendered = render(firstValue, depth + 1, indentSpaces)
        const firstLines = firstRendered.split('\n')
        lines.push(
          `- ${firstKey}: ${stripTrailingNewline(firstLines[0])}\n` +
            indent(firstLines.slice(1).join('\n'), indentSpaces) +
            (firstRendered.endsWith('\n') ? '' : ''),
        )
        for (let i = 1; i < entries.length; i++) {
          const [k, v] = entries[i]
          const rendered = render(v, depth + 1, indentSpaces)
          lines.push(
            `  ${k}: ${stripTrailingNewline(rendered.split('\n')[0])}\n` +
              indent(rendered.split('\n').slice(1).join('\n'), indentSpaces + 2),
          )
        }
      } else if (Array.isArray(item)) {
        const rendered = render(item, depth + 1, indentSpaces)
        lines.push(`-\n${indent(rendered, indentSpaces + 2)}`)
      } else {
        lines.push(`- ${formatScalar(item)}\n`)
      }
    }
    return lines.join('')
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) return '{}\n'
    const lines: string[] = []
    for (const [k, v] of entries) {
      if (isPlainObject(v)) {
        const rendered = render(v, depth + 1, indentSpaces)
        lines.push(
          `${k}:\n${indent(rendered, indentSpaces)}`,
        )
      } else if (Array.isArray(v)) {
        const rendered = render(v, depth + 1, indentSpaces)
        lines.push(
          `${k}:\n${indent(rendered, indentSpaces)}`,
        )
      } else {
        lines.push(`${k}: ${formatScalar(v)}\n`)
      }
    }
    return lines.join('')
  }
  return `${formatScalar(value)}\n`
}

function stripTrailingNewline(s: string): string {
  return s.endsWith('\n') ? s.slice(0, -1) : s
}
