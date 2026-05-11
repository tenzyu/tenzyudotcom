import { getLocaleFromPathname } from '@/lib/i18n/locale-precedence.domain'

const intlayer_locales = ['ja', 'en'] as const
const intlayer_defaultLocale = 'ja'

function normalizePathname(pathname: string) {
  if (!pathname) {
    return '/'
  }

  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

function splitSuffix(pathname: string) {
  const hashIndex = pathname.indexOf('#')
  const searchIndex = pathname.indexOf('?')
  const suffixIndex =
    hashIndex === -1
      ? searchIndex
      : searchIndex === -1
        ? hashIndex
        : Math.min(searchIndex, hashIndex)

  if (suffixIndex === -1) {
    return {
      pathname,
      suffix: '',
    }
  }

  return {
    pathname: pathname.slice(0, suffixIndex),
    suffix: pathname.slice(suffixIndex),
  }
}

function stripExistingLocalePrefix(pathname: string) {
  const locale = getLocaleFromPathname(pathname, intlayer_locales)
  if (!locale) {
    return pathname
  }

  const stripped = pathname.slice(locale.length + 1)
  return stripped.length > 0 ? stripped : '/'
}

export function buildLocalizedUrl(pathname: string, locale: string) {
  const normalizedInput = normalizePathname(pathname)
  const { pathname: pathnameWithoutSuffix, suffix } = splitSuffix(normalizedInput)
  const normalizedPath = stripExistingLocalePrefix(pathnameWithoutSuffix)
  const localePrefix = locale === intlayer_defaultLocale ? '' : `/${locale}`
  const resolvedPath =
    normalizedPath === '/' ? localePrefix || '/' : `${localePrefix}${normalizedPath}`

  return `${resolvedPath}${suffix}`
}
