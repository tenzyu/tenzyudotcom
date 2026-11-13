import { expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentMDX } from '../../_features/content-mdx'
import { blogMdxComponents } from './mdx-components'

test('renders the article’s aside and support link', async () => {
  const content = await ContentMDX({
    source:
      '<OtakuAside label="NixOS">便利な環境</OtakuAside>\n\n<KoFiLink label="お金くれる人探してます" />',
    scope: 'blog',
    additionalComponents: blogMdxComponents,
  })
  const html = renderToStaticMarkup(content)
  expect(html).toContain('便利な環境')
  expect(html).toContain('https://ko-fi.com/tenzyu')
  expect(html).toContain('お金くれる人探してます')
})
