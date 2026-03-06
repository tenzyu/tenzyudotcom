import { Locales, type IntlayerConfig } from 'intlayer'

const config: IntlayerConfig = {
  internationalization: {
    locales: [Locales.JAPANESE, Locales.ENGLISH],
    defaultLocale: Locales.JAPANESE,
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
}

export default config
