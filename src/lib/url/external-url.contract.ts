const EXTERNAL_URL_PROTOCOLS = new Set(['http:', 'https:'])

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

export function parseExternalUrl(raw: string, label = 'external url'): URL {
  assertNonEmpty(raw, label)

  const url = new URL(raw)
  if (!EXTERNAL_URL_PROTOCOLS.has(url.protocol)) {
    throw new Error(`${label} must use http(s): ${raw}`)
  }

  return url
}

export function normalizeExternalUrl(raw: string, label = 'external url') {
  return parseExternalUrl(raw, label).toString()
}
