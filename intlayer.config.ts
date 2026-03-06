import { Locales, type IntlayerConfig } from 'intlayer'

const config: IntlayerConfig = {
  internationalization: {
    locales: [Locales.JAPANESE, Locales.ENGLISH],
    defaultLocale: Locales.JAPANESE,
  },
  routing: {
    mode: 'search-params',
    // storage: 'cookie',
  },
}

export default config
