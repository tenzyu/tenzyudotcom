import assert from 'node:assert/strict';
import test from 'node:test';

await import('../src/content.js');

const {
  buildFilename,
  buildStandaloneHtml,
  hydrateWritingBlocks,
  normalizeRole,
  prepareExportClone,
  sanitizeExportFragment,
  selectMessagesForExport,
  shouldIncludeRole,
  slugify
} = globalThis.CPHE_TEST_API;

test('normalizeRole preserves known ChatGPT roles including tool', () => {
  assert.equal(normalizeRole('user'), 'user');
  assert.equal(normalizeRole('assistant'), 'assistant');
  assert.equal(normalizeRole('system'), 'system');
  assert.equal(normalizeRole('tool'), 'tool');
  assert.equal(normalizeRole('other'), 'unknown');
});

test('selectMessagesForExport starts at the requested visible index', () => {
  const messages = [
    { role: 'user', id: 0 },
    { role: 'assistant', id: 1 },
    { role: 'user', id: 2 },
    { role: 'assistant', id: 3 }
  ];

  assert.deepEqual(selectMessagesForExport(messages, 2, {}).map(message => message.id), [2, 3]);
});

test('selectMessagesForExport applies include role settings', () => {
  const messages = [
    { role: 'user', id: 'u' },
    { role: 'assistant', id: 'a' },
    { role: 'system', id: 's' },
    { role: 'tool', id: 't' },
    { role: 'unknown', id: 'x' }
  ];

  assert.deepEqual(
    selectMessagesForExport(messages, 0, { includeUser: false }).map(message => message.id),
    ['a', 's', 't', 'x']
  );
  assert.deepEqual(
    selectMessagesForExport(messages, 0, { includeAssistant: false }).map(message => message.id),
    ['u', 's', 't', 'x']
  );
  assert.deepEqual(
    selectMessagesForExport(messages, 0, { includeSystem: false }).map(message => message.id),
    ['u', 'a', 'x']
  );
  assert.deepEqual(
    selectMessagesForExport(messages, 0, { includeUnknown: false }).map(message => message.id),
    ['u', 'a', 's', 't']
  );
});

test('selectMessagesForExport can produce zero messages for error UX', () => {
  const messages = [{ role: 'user', id: 1 }];
  assert.equal(selectMessagesForExport(messages, 0, { includeUser: false }).length, 0);
});

test('shouldIncludeRole maps tool to the system/tool-like include flag', () => {
  assert.equal(shouldIncludeRole('tool', { includeSystem: false }), false);
  assert.equal(shouldIncludeRole('tool', { includeSystem: true }), true);
});

test('slugify and buildFilename produce filename-safe html names with Japanese text', () => {
  assert.equal(slugify('../会話:ログ?'), '会話-ログ');
  assert.match(buildFilename('日本語タイトル', 1, '../chat:gpt'), /^chat-gpt-日本語タイトル-\d{8}-\d{6}-from-2\.html$/);
});

test('sanitizeExportFragment removes dangerous nodes and attributes', () => {
  const removed = [];
  const script = removableElement('script', removed);
  const iframe = removableElement('iframe', removed);
  const object = removableElement('object', removed);
  const embed = removableElement('embed', removed);
  const svg = removableElement('svg', removed);
  const link = elementWithAttributes({ href: 'javascript:alert(1)', onclick: 'evil()' });
  const image = elementWithAttributes({ src: 'javascript:alert(1)', srcdoc: '<script></script>' });
  const editor = elementWithAttributes({ contenteditable: 'true' });
  const root = {
    attributes: [{ name: 'onload', value: 'evil()' }],
    classList: { remove() {} },
    querySelectorAll(selector) {
      if (selector === 'script') return [script];
      if (selector === 'iframe') return [iframe];
      if (selector === 'object') return [object];
      if (selector === 'embed') return [embed];
      if (selector === 'svg') return [svg];
      if (selector === '*') return [link, image, editor];
      return [];
    },
    removeAttribute(name) {
      this.attributes = this.attributes.filter(attr => attr.name !== name);
    }
  };

  sanitizeExportFragment(root);

  assert.deepEqual(removed.sort(), ['embed', 'iframe', 'object', 'script', 'svg']);
  assert.deepEqual(root.attributes, []);
  assert.equal(link.hasAttribute('href'), false);
  assert.equal(link.hasAttribute('onclick'), false);
  assert.equal(image.hasAttribute('src'), false);
  assert.equal(image.hasAttribute('srcdoc'), false);
  assert.equal(editor.hasAttribute('contenteditable'), false);
});

test('hydrateWritingBlocks fills an empty message block from matching portal content', () => {
  const previousDocument = globalThis.document;
  const portalContent = fakeNode({ textContent: 'Full markdown prompt body from the portal.' });
  const portalBlock = fakeNode({ id: 'writing-block-message-1', textContent: portalContent.textContent });
  portalBlock.querySelectorAll = selector => selector.includes('writing-block-editor') ? [portalContent] : [];

  globalThis.document = {
    querySelectorAll(selector) {
      return selector.includes('data-writing-block') ? [portalBlock] : [];
    },
    createElement(tagName) {
      return fakeNode({ tagName });
    }
  };

  const cloneEditor = fakeNode({ textContent: '' });
  const cloneBlock = fakeNode({ id: 'writing-block-message-1', textContent: '' });
  cloneBlock.querySelector = selector => selector.includes('writing-block-editor') ? cloneEditor : null;
  const cloneRoot = fakeNode({});
  cloneRoot.querySelectorAll = selector => selector.includes('data-writing-block') ? [cloneBlock] : [];

  const originalBlock = fakeNode({ id: 'writing-block-message-1', textContent: '' });
  originalBlock.querySelectorAll = () => [];
  const messageNode = fakeNode({ attributes: { 'data-message-id': 'message-1' } });
  const originalRoot = fakeNode({});
  originalRoot.querySelectorAll = selector => selector.includes('data-writing-block') ? [originalBlock] : [];
  originalRoot.querySelector = selector => selector === '[data-message-id]' ? messageNode : null;
  originalRoot.contains = node => node === originalBlock;

  hydrateWritingBlocks(cloneRoot, originalRoot);

  assert.equal(cloneBlock.children.length, 1);
  assert.equal(cloneBlock.children[0].children[1].textContent, 'Full markdown prompt body from the portal.');

  globalThis.document = previousDocument;
});

test('buildStandaloneHtml includes standalone metadata and respects CSS option', () => {
  const message = {
    role: 'assistant',
    root: fakeMessageRoot('<p>Hello</p><pre><code>const x = 1;</code></pre><table><tbody><tr><td>ok</td></tr></tbody></table>')
  };
  const html = buildStandaloneHtml([message], {
    title: '<Conversation>',
    sourceUrl: 'https://chatgpt.com/c/1?x=<y>',
    exportedAt: '2026-06-04T00:00:00.000Z',
    startIndex: 1,
    totalVisibleMessages: 3,
    messageCount: 1,
    roles: ['assistant']
  }, { includeMetadata: true, includeStandaloneCss: false });

  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /&lt;Conversation&gt;/);
  assert.match(html, /from visible message #2; 1 exported \/ 3 visible/);
  assert.match(html, /<pre><code>const x = 1;<\/code><\/pre>/);
  assert.match(html, /<table>/);
  assert.doesNotMatch(html, /<style>/);
});

function elementWithAttributes(attributes) {
  return {
    attributes: Object.entries(attributes).map(([name, value]) => ({ name, value })),
    removeAttribute(name) {
      this.attributes = this.attributes.filter(attr => attr.name !== name);
    },
    hasAttribute(name) {
      return this.attributes.some(attr => attr.name === name);
    }
  };
}

function fakeNode({ id = '', tagName = 'div', textContent = '', attributes = {} }) {
  return {
    id,
    tagName,
    textContent,
    innerText: textContent,
    children: [],
    attributes: Object.entries(attributes).map(([name, value]) => ({ name, value })),
    classList: {
      values: [],
      add(value) { this.values.push(value); },
      remove() {}
    },
    append(...nodes) {
      this.children.push(...nodes);
    },
    replaceChildren(...nodes) {
      this.children = nodes;
    },
    cloneNode() {
      return fakeNode({ id, tagName, textContent, attributes });
    },
    getAttribute(name) {
      if (name === 'id') return id;
      const attr = this.attributes.find(item => item.name === name);
      return attr ? attr.value : null;
    },
    matches(selector) {
      return selector === '[data-message-id]' && this.getAttribute('data-message-id');
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    contains() { return false; }
  };
}

function removableElement(name, removed) {
  return { remove: () => removed.push(name) };
}

function fakeMessageRoot(innerHTML) {
  return {
    cloneNode() {
      return {
        innerHTML,
        attributes: [],
        classList: { remove() {} },
        querySelectorAll() { return []; }
      };
    }
  };
}
