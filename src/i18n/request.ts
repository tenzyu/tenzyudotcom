import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

const SUPPORTED_LANG = ['en', 'ja'] as const
const DEFAULT_LANG = 'ja'
const LANG_PARAM = 'lang'

export type SupportedLang = (typeof SUPPORTED_LANG)[number]
type LangSource = 'searchParams' | 'cookie' | 'header' | 'default'
type LangResult = { lang: SupportedLang; source: LangSource }

const isValidLocale = (
  locale: string | undefined | null,
): locale is SupportedLang => {
  return !!locale && SUPPORTED_LANG.includes(locale as SupportedLang)
}

const getLocaleFromHeaders = (headers: ReadonlyHeaders): LangResult | null => {
  const acceptLanguage = headers.get('accept-language')

  if (!acceptLanguage) return null

  const languages = new Negotiator({
    headers: { 'accept-language': acceptLanguage },
  }).languages()

  try {
    const lang = match(languages, SUPPORTED_LANG, DEFAULT_LANG) as SupportedLang
    return {
      lang,
      source: 'header',
    }
  } catch {
    return null
  }
}

const getLocaleFromSearchParams = (
  headers: ReadonlyHeaders,
): LangResult | null => {
  const paramsString = headers.get('referer')?.split('?')[1] ?? ''
  const params = new URLSearchParams(paramsString)
  const lang = params.get(LANG_PARAM)

  if (!isValidLocale(lang)) return null

  return {
    lang,
    source: 'searchParams',
  }
}

const getLocaleFromCookie = (
  cookies: ReadonlyRequestCookies,
): LangResult | null => {
  const cookieLocale = cookies.get('locale')?.value

  if (!isValidLocale(cookieLocale)) return null

  return {
    lang: cookieLocale,
    source: 'cookie',
  }
}

// Main config function
export default getRequestConfig(async () => {
  const awaited_headers = await headers()
  const awaited_cookies = await cookies()

  const localeResult = getLocaleFromSearchParams(awaited_headers) ??
    getLocaleFromCookie(awaited_cookies) ??
    getLocaleFromHeaders(awaited_headers) ?? {
      lang: DEFAULT_LANG,
      source: 'default',
    }

  console.log({ localeResult })

  return {
    locale: localeResult.lang,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    messages: (await import(`./messages/${localeResult.lang}.json`)).default,
  }
})
