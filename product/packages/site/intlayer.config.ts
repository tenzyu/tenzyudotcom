import type { IntlayerConfig } from 'intlayer'
import {
  intlayer_defaultLocale,
  intlayer_locales,
} from './src/lib/intlayer/locales'

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
    liveSync: true
  }
}

export default config
