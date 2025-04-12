import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

const supportedLocales = ['en', 'ja'] as const
const defaultLocale = 'ja'

export type SupportedLocales = (typeof supportedLocales)[number]

async function getLocaleFromHeaders(): Promise<SupportedLocales> {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language')

  if (!acceptLanguage) return defaultLocale

  const languages = new Negotiator({
    headers: { 'accept-language': acceptLanguage },
  }).languages()

  try {
    const locale = match(languages, supportedLocales, defaultLocale)
    return locale as SupportedLocales
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return defaultLocale
  }
}

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get('locale')?.value
  const headerLocale = await getLocaleFromHeaders()

  // Priority: Cookie > Accept-Language Header > Default
  const locale = supportedLocales.includes(cookieLocale as SupportedLocales)
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      cookieLocale!
    : headerLocale

  return {
    locale,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    messages: (await import(`./messages/${locale}.json`)).default,
    // Add timeZone if needed
    timeZone: 'Asia/Tokyo',
  }
})
