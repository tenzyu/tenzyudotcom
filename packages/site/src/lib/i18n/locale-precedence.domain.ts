export type LocaleResolutionSource =
  | 'path'
  | 'persisted'
  | 'accept-language'
  | 'default'

type ResolveLocalePrecedenceInput = {
  pathname: string
  locales: readonly string[]
  defaultLocale: string
  persistedLocale?: string | null
  acceptLanguage?: string | null
}

function isSupportedLocale(
  locale: string | null | undefined,
  locales: readonly string[],
): locale is string {
  return typeof locale === 'string' && locales.includes(locale)
}

function parseAcceptLanguageValue(value: string) {
  const [tag, ...params] = value.trim().split(';')
  const normalizedTag = tag?.trim().toLowerCase()

  if (!normalizedTag) {
    return null
  }

  const qParam = params.find((param) => param.trim().startsWith('q='))
  const qValue = qParam ? Number(qParam.trim().slice(2)) : 1

  return {
    tag: normalizedTag,
    quality: Number.isFinite(qValue) ? qValue : 0,
  }
}

function matchAcceptedLocale(
  acceptLanguage: string,
  locales: readonly string[],
) {
  const candidates = acceptLanguage
    .split(',')
    .map(parseAcceptLanguageValue)
    .filter((entry) => entry !== null)
    .sort((left, right) => right.quality - left.quality)

  for (const candidate of candidates) {
    const directMatch = locales.find(
      (locale) => locale.toLowerCase() === candidate.tag,
    )

    if (directMatch) {
      return directMatch
    }

    const primaryLanguage = candidate.tag.split('-')[0]
    const partialMatch = locales.find(
      (locale) => locale.toLowerCase() === primaryLanguage,
    )

    if (partialMatch) {
      return partialMatch
    }
  }

  return null
}

export function getLocaleFromPathname(
  pathname: string,
  locales: readonly string[],
) {
  return (
    locales.find(
      (locale) =>
        pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
    ) ?? null
  )
}

export function resolveLocalePrecedence({
  pathname,
  locales,
  defaultLocale,
  persistedLocale,
  acceptLanguage,
}: ResolveLocalePrecedenceInput): {
  locale: string
  source: LocaleResolutionSource
} {
  const pathnameLocale = getLocaleFromPathname(pathname, locales)

  if (pathnameLocale) {
    return {
      locale: pathnameLocale,
      source: 'path',
    }
  }

  if (isSupportedLocale(persistedLocale, locales)) {
    return {
      locale: persistedLocale,
      source: 'persisted',
    }
  }

  const detectedLocale = acceptLanguage
    ? matchAcceptedLocale(acceptLanguage, locales)
    : null

  if (isSupportedLocale(detectedLocale, locales)) {
    return {
      locale: detectedLocale,
      source: 'accept-language',
    }
  }

  return {
    locale: defaultLocale,
    source: 'default',
  }
}
