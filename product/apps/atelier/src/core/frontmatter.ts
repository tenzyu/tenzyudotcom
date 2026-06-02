import type { HarnessFrontmatter } from './schema'

export type ParsedFrontmatter = {
  frontmatter: HarnessFrontmatter | null
  frontmatterRaw: string | null
  body: string
  error?: string
}

function asFrontmatterRecord(value: unknown): HarnessFrontmatter {
  if (value === null || value === undefined) return {}
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Frontmatter must be a YAML mapping')
  }
  return value as HarnessFrontmatter
}

export function parseFrontmatter(raw: string): ParsedFrontmatter {
  const lines = raw.split(/\r?\n/)
  const firstLine = lines[0]?.trim()

  if (firstLine !== '---') {
    return {
      frontmatter: null,
      frontmatterRaw: null,
      body: raw,
    }
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---')

  if (closingIndex === -1) {
    return {
      frontmatter: null,
      frontmatterRaw: raw,
      body: '',
      error: 'Missing closing frontmatter fence',
    }
  }

  const frontmatterRaw = lines.slice(1, closingIndex).join('\n')
  const body = lines.slice(closingIndex + 1).join('\n')

  try {
    const parsed = Bun.YAML.parse(frontmatterRaw)
    return {
      frontmatter: asFrontmatterRecord(parsed),
      frontmatterRaw,
      body,
    }
  } catch (error) {
    return {
      frontmatter: null,
      frontmatterRaw,
      body,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

