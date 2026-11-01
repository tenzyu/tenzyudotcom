import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mock } from 'bun:test'
import type { ReactNode } from 'react'
import type { ScrapEditorState } from '../scrap-editor.assemble'

const require = createRequire(import.meta.url)
const { JSDOM } = require('jsdom')
const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'http://localhost' },
)
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Document: dom.window.Document,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  HTMLFormElement: dom.window.HTMLFormElement,
  Event: dom.window.Event,
  MouseEvent: dom.window.MouseEvent,
  FormData: dom.window.FormData,
  IS_REACT_ACT_ENVIRONMENT: true,
})
const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
type PanelProps = {
  children: ReactNode
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}
mock.module('@tenzyu/ui/editorial', () => ({
  EditorPanel: ({ children, title, description, actions }: PanelProps) => (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
      {actions}
      {children}
    </section>
  ),
  EditorialList: ({ children }: PanelProps) => <div>{children}</div>,
  EditorialEntry: ({ children }: PanelProps) => <article>{children}</article>,
}))
let failure = 'conflict'
mock.module('@/app/[locale]/(admin)/editor/_features/scraps.actions', () => ({
  saveScrapAction: async () => ({
    status: 'error',
    error: failure,
    message: 'Draft kept',
  }),
}))
mock.module('@/app/[locale]/(admin)/editor/_features/actions', () => ({
  saveBlogPostAction: async () => ({ error: failure, message: 'Draft kept' }),
  saveEditorCollectionAction: async () => ({
    status: 'error',
    error: failure,
    message: 'Draft kept',
  }),
}))
const { ScrapEditorWorkspace } =
  await import('@/app/[locale]/(admin)/editor/_features/scraps-editor-client')
const { BlogEditor } =
  await import('@/app/[locale]/(admin)/editor/_features/blog-editor')
const { LinksEditorClient } =
  await import('@/app/[locale]/(admin)/editor/_features/links-editor-client')
const { NotesEditorClient } =
  await import('@/app/[locale]/(admin)/editor/_features/notes-editor-client')
const rootNode = document.getElementById('root')
assert.ok(rootNode)
const root = createRoot(rootNode)
async function fill(name: string, value: string, formIndex = 0) {
  const field = rootNode
    ?.querySelectorAll('form')
    [formIndex]?.querySelector(name.startsWith('#') ? name : `[name="${name}"]`)
  assert.ok(
    field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement,
  )
  const setter = Object.getOwnPropertyDescriptor(
    field instanceof HTMLTextAreaElement
      ? dom.window.HTMLTextAreaElement.prototype
      : dom.window.HTMLInputElement.prototype,
    'value',
  )?.set
  assert.ok(setter)
  await act(async () => {
    setter.call(field, value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function submit(formIndex = 0) {
  const form = rootNode?.querySelectorAll('form')[formIndex]
  assert.ok(form)
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}
for (failure of ['conflict', 'save', 'uncertain']) {
  await act(async () => {
    root.render(
      <ScrapEditorWorkspace
        key={`scrap-${failure}`}
        locale="ja"
        scrap={null}
        nextEntryId="entry-one"
      />,
    )
  })
  for (const [name, value] of Object.entries({
    slug: 'my-draft',
    title: 'Unsaved title',
    hypothesis: 'Unsaved question',
    lead: 'Unsaved lead',
  }))
    await fill(name, value)
  await submit()
  assert.equal(
    rootNode.querySelector<HTMLInputElement>('[name="title"]')?.value,
    'Unsaved title',
  )
  assert.equal(
    rootNode.querySelector<HTMLTextAreaElement>('[name="lead"]')?.value,
    'Unsaved lead',
  )
  assert.ok(
    rootNode
      .querySelector('[role="alert"]')
      ?.textContent?.includes('Draft kept'),
  )
  assert.equal(
    rootNode.querySelector('fieldset')?.disabled,
    failure === 'uncertain',
  )
  await act(async () => {
    root.render(
      <BlogEditor
        key={`blog-${failure}`}
        locale="ja"
        posts={[]}
        startCreating
      />,
    )
  })
  await fill('title', 'Unsaved blog title')
  await fill('body', 'Unsaved blog body')
  await submit()
  assert.equal(
    rootNode.querySelector<HTMLInputElement>('[name="title"]')?.value,
    'Unsaved blog title',
  )
  assert.equal(
    rootNode.querySelector<HTMLTextAreaElement>('[name="body"]')?.value,
    'Unsaved blog body',
  )
}
failure = 'conflict'
const scrap: ScrapEditorState = {
  version: 'v1',
  manifest: {
    id: 'research',
    slug: 'research',
    title: 'Research',
    hypothesis: 'Question',
    tags: [],
    status: 'open',
    published: false,
    primaryLocale: 'ja',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    lead: [],
    entryIds: ['one'],
  },
  lead: [],
  entries: [
    {
      meta: {
        id: 'one',
        scrapSlug: 'research',
        kind: 'note',
        published: false,
        createdAt: '2026-01-01T00:00:00Z',
        documents: [
          {
            locale: 'ja',
            state: 'original',
            pathname: 'scraps/research/entries/one/entry.ja.mdx',
          },
        ],
      },
      documents: [
        {
          locale: 'ja',
          state: 'original',
          pathname: 'scraps/research/entries/one/entry.ja.mdx',
          source: 'Existing entry',
        },
      ],
    },
  ],
}
await act(async () => {
  root.render(
    <ScrapEditorWorkspace
      key="existing"
      locale="ja"
      scrap={scrap}
      nextEntryId="entry-two"
    />,
  )
})
await fill('body', 'Unsaved appended entry', 1)
await submit(1)
assert.equal(
  rootNode
    .querySelectorAll('form')[1]
    ?.querySelector<HTMLTextAreaElement>('[name="body"]')?.value,
  'Unsaved appended entry',
)
await fill('body', 'Unsaved revised entry', 2)
await submit(2)
assert.equal(
  rootNode
    .querySelectorAll('form')[2]
    ?.querySelector<HTMLTextAreaElement>('[name="body"]')?.value,
  'Unsaved revised entry',
)
await act(async () => {
  root.render(
    <LinksEditorClient
      locale="ja"
      expectedVersion="v1"
      initialEntries={[
        {
          id: 'one',
          name: 'Link draft',
          url: 'https://example.com',
          shortenUrl: 'one',
          icon: '',
          category: 'Social',
        },
      ]}
      labels={{
        add: 'Add',
        save: 'Save',
        name: 'Name',
        id: 'ID',
        url: 'URL',
        shortenUrl: 'Short URL',
        icon: 'Icon',
        category: 'Category',
        moveUp: 'Up',
        moveDown: 'Down',
        remove: 'Remove',
        fetchMetadata: 'Fetch',
      }}
    />,
  )
})
await fill('#link-0-name', 'Revised link draft')
await submit()
assert.ok(
  rootNode
    .querySelector<HTMLInputElement>('[name="sourceJson"]')
    ?.value.includes('Revised link draft'),
)
await act(async () => {
  root.render(
    <NotesEditorClient
      locale="ja"
      expectedVersion="v1"
      initialEntries={[
        {
          id: 'one',
          body: { ja: 'Original note', en: '' },
          createdAt: '2026-01-01T00:00:00Z',
          published: false,
        },
      ]}
      labels={{
        add: 'Add',
        save: 'Save',
        id: 'ID',
        parent: 'Parent',
        topLevel: 'Top level',
        bodyJa: 'Japanese',
        bodyEn: 'English',
        createdAt: 'Created at',
        externalUrl: 'External URL',
        published: 'Published',
        moveUp: 'Up',
        moveDown: 'Down',
        remove: 'Remove',
      }}
    />,
  )
})
await fill('#note-one-body-ja', 'Revised note draft')
await submit()
assert.ok(
  rootNode
    .querySelector<HTMLInputElement>('[name="sourceJson"]')
    ?.value.includes('Revised note draft'),
)
await act(async () => {
  root.unmount()
})
dom.window.close()
