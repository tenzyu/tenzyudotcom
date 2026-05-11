import { Locales, type IntlayerConfig } from 'intlayer'

const intlayer_locales: Locales.Locales[] = [Locales.JAPANESE, Locales.ENGLISH]
const intlayer_defaultLocale = Locales.JAPANESE

const config: IntlayerConfig = {
  internationalization: {
    locales: intlayer_locales,
    defaultLocale: intlayer_defaultLocale,
  },
  dictionary: {
    fill: false,
  },
  content: {
    contentDir: ['src'],
    codeDir: ['src'],
  },
  routing: {
    mode: 'prefix-no-default',
  },
  editor: {
    applicationURL: 'http://localhost:3000',
    liveSync: true,
  },
}

export default config
