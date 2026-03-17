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
  editor: {
    applicationURL: 'http://localhost:3000',
    liveSync: true
  }
}

export default config
