import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

const supportedLocales = ['en', 'ja'] as const
const defaultLocale = 'ja'

export type SupportedLocales = (typeof supportedLocales)[number]

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get('locale')?.value
  // NOTE: これは条件分岐で、実際に SupportedLocales が来るわけではないけど
  const locale = supportedLocales.includes(
    (cookieLocale ?? '') as SupportedLocales,
  )
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      cookieLocale!
    : defaultLocale

  return {
    locale,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
