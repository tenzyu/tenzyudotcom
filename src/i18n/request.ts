import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  const supportedLocales = ['en', 'ja']
  const defaultLocale = 'en'

  const cookieLocale = (await cookies()).get('locale')?.value
  const locale = supportedLocales.includes(cookieLocale ?? '')
    ? cookieLocale!
    : defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
