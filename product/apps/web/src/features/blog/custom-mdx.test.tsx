import { expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentMDX, prepareContentMDX } from '@/components/site/content-mdx'
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

test('projects table-of-contents anchors from the same compiled headings', async () => {
  const source = [
    '## Alpha',
    '#### Alpha',
    '### Alpha',
    '## Alpha-1',
    '```md\n## Phantom\n```',
    'Setext heading\n---',
    '## [Link](https://example.com) and `code`',
  ].join('\n\n')
  const { content, headings } = await prepareContentMDX({ source, scope: 'blog' })
  expect(headings).toEqual([
    { id: 'alpha', level: 2, title: 'Alpha' },
    { id: 'alpha-2', level: 3, title: 'Alpha' },
    { id: 'alpha-1-1', level: 2, title: 'Alpha-1' },
    { id: 'setext-heading', level: 2, title: 'Setext heading' },
    { id: 'link-and-code', level: 2, title: 'Link and code' },
  ])
  const html = renderToStaticMarkup(content)
  for (const { id, level } of headings) {
    expect(html).toContain(`<h${level} id="${id}"`)
  }
  expect(html).toContain('<h4 id="alpha-1"')
  expect(html).not.toContain('id="phantom"')
  expect(renderToStaticMarkup(content)).toBe(html)
})

test('renders dynamic MDX headings without publishing a guessed table-of-contents link', async () => {
  const { content, headings } = await prepareContentMDX({
    source: '## Value {1 + 1}',
    scope: 'blog',
  })
  expect(headings).toEqual([])
  expect(renderToStaticMarkup(content)).toContain('<h2 id="value-2"')
})

test('reserves static anchors and repeats dynamic allocation without render-to-render drift', async () => {
  const { content, headings } = await prepareContentMDX({
    source: ['## Value 2', '## Value {1 + 1}', '### Value {1 + 1}'].join('\n\n'),
    scope: 'blog',
  })
  expect(headings).toEqual([{ id: 'value-2', level: 2, title: 'Value 2' }])
  const html = renderToStaticMarkup(content)
  expect([...html.matchAll(/<h[23] id="([^"]+)"/g)].map((match) => match[1])).toEqual([
    'value-2', 'value-2-1', 'value-2-2',
  ])
  expect(renderToStaticMarkup(content)).toBe(html)
})

test('allocates a large repeated heading family without changing suffix semantics', async () => {
  const source = Array.from({ length: 128 }, () => '## Repeat').join('\n\n')
  const { headings } = await prepareContentMDX({ source, scope: 'blog' })
  expect(headings.map(({ id }) => id)).toEqual(
    Array.from({ length: 128 }, (_, index) => index ? `repeat-${index}` : 'repeat'),
  )
})
