/* global browser */

const CPHE_BUTTON_CLASS = 'cphe-export-button';
const CPHE_BOUNDARY_CLASS = 'cphe-message-boundary';
const CPHE_TOAST_CLASS = 'cphe-toast';

const MESSAGE_SELECTORS = [
  '[data-message-author-role]',
  '[data-testid^="conversation-turn"]',
  'article'
];

const CONTROL_SELECTORS = [
  `.${CPHE_BUTTON_CLASS}`,
  'button',
  'form',
  'input',
  'textarea',
  'select',
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  '[aria-label*="Copy"]',
  '[aria-label*="Share"]',
  '[aria-label*="Read aloud"]',
  '[aria-label*="Rate"]',
  '[data-testid*="copy"]',
  '[data-testid*="share"]',
  '[data-testid*="feedback"]'
];

const WRITING_BLOCK_SELECTORS = [
  '[data-writing-block="true"]',
  '[data-writing-block]',
  '[data-testid="writing-block-container"]',
  '[id^="writing-block-"]'
].join(',');

const WRITING_BLOCK_CONTENT_SELECTORS = [
  '.writing-block-editor',
  '[data-writing-block-editor]',
  '.ProseMirror',
  '.markdown',
  '[contenteditable="true"]'
].join(',');

const DEFAULT_SETTINGS = Object.freeze({
  filenamePrefix: 'chatgpt',
  includeUser: true,
  includeAssistant: true,
  includeSystem: true,
  includeUnknown: true,
  includeMetadata: true,
  includeStandaloneCss: true
});

let observer = null;
let injectQueued = false;

if (typeof browser !== 'undefined' && typeof document !== 'undefined') {
  init();
}

function init() {
  injectButtonsSoon();
  observeConversationChanges();

  browser.runtime.onMessage.addListener((message) => {
    if (!message || typeof message !== 'object') return false;

    if (message.type === 'CPHE_EXPORT_VISIBLE') {
      return exportFromIndex(0);
    }

    if (message.type === 'CPHE_COPY_VISIBLE_HTML') {
      return copyHtmlFromIndex(0);
    }

    if (message.type === 'CPHE_REINJECT') {
      injectButtons();
      return Promise.resolve({ ok: true, count: getMessages().length });
    }

    if (message.type === 'CPHE_GET_PAGE_STATE') {
      return Promise.resolve(getPageState());
    }

    return false;
  });
}

function observeConversationChanges() {
  if (observer) observer.disconnect();

  observer = new MutationObserver(() => injectButtonsSoon());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function injectButtonsSoon() {
  if (injectQueued) return;
  injectQueued = true;
  window.setTimeout(() => {
    injectQueued = false;
    injectButtons();
  }, 300);
}

function injectButtons() {
  const messages = getMessages();
  messages.forEach((message, index) => {
    const root = message.root;
    if (!root) return;

    root.classList.add(CPHE_BOUNDARY_CLASS);

    const existingButton = root.querySelector(`:scope > .${CPHE_BUTTON_CLASS}`);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = CPHE_BUTTON_CLASS;
    button.dataset.cpheIndex = String(index);
    button.textContent = `Export from #${index + 1}`;
    button.title = `Export this ChatGPT conversation from message #${index + 1}`;
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await exportFromIndex(index);
    });

    if (existingButton) {
      existingButton.replaceWith(button);
    } else {
      root.prepend(button);
    }
  });
}

async function exportFromIndex(startIndex) {
  try {
    const settings = await getSettings();
    const exportPayload = buildExportPayload(startIndex, settings);

    if (exportPayload.metadata.messageCount === 0) {
      showToast('No messages matched the current export filters.');
      return { ok: false, error: 'No messages matched the current export filters.' };
    }

    const result = await browser.runtime.sendMessage({
      type: 'CPHE_EXPORT_HTML',
      payload: exportPayload
    });

    if (result && result.ok) {
      if (result.mode === 'native') {
        showToast(`Exported HTML: ${result.path}`);
      } else if (result.fallback) {
        showToast(result.warning || 'Native export failed; downloaded instead.');
      } else {
        showToast('Exported HTML via Firefox downloads.');
      }
    }

    return result;
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    showToast(`Export failed: ${message}`);
    return { ok: false, error: message };
  }
}

async function copyHtmlFromIndex(startIndex) {
  try {
    const settings = await getSettings();
    const exportPayload = buildExportPayload(startIndex, settings);
    if (exportPayload.metadata.messageCount === 0) {
      showToast('No messages matched the current export filters.');
      return { ok: false, error: 'No messages matched the current export filters.' };
    }
    await navigator.clipboard.writeText(exportPayload.html);
    showToast('Copied exported HTML to clipboard.');
    return { ok: true };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    showToast(`Copy failed: ${message}`);
    return { ok: false, error: message };
  }
}

async function getSettings() {
  try {
    const settings = await browser.runtime.sendMessage({ type: 'CPHE_GET_SETTINGS' });
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (_) {
    return { ...DEFAULT_SETTINGS };
  }
}

function getPageState() {
  return {
    title: getConversationTitle(),
    url: location.href,
    messageCount: getMessages().length
  };
}

function buildExportPayload(startIndex, settings) {
  const allMessages = getMessages();
  const selectedMessages = selectMessagesForExport(allMessages, startIndex, settings);

  const metadata = {
    title: getConversationTitle(),
    sourceUrl: location.href,
    exportedAt: new Date().toISOString(),
    startIndex: Math.max(0, startIndex),
    totalVisibleMessages: allMessages.length,
    messageCount: selectedMessages.length,
    roles: selectedMessages.map(message => message.role)
  };

  const html = buildStandaloneHtml(selectedMessages, metadata, settings);
  const filename = buildFilename(metadata.title, metadata.startIndex, settings.filenamePrefix);

  return { html, filename, metadata };
}

function selectMessagesForExport(messages, startIndex, settings) {
  return messages
    .slice(Math.max(0, startIndex))
    .filter(message => shouldIncludeRole(message.role, settings));
}

function getMessages() {
  const candidates = [];

  for (const selector of MESSAGE_SELECTORS) {
    document.querySelectorAll(selector).forEach(node => {
      const normalized = normalizeMessageCandidate(node);
      if (normalized) candidates.push(normalized);
    });
  }

  const seen = new Set();
  const unique = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.root)) continue;
    if (!candidate.root.isConnected) continue;
    if (!candidate.root.textContent || !candidate.root.textContent.trim()) continue;
    seen.add(candidate.root);
    unique.push(candidate);
  }

  unique.sort((a, b) => {
    const position = a.root.compareDocumentPosition(b.root);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });

  return unique;
}

function normalizeMessageCandidate(node) {
  if (!(node instanceof HTMLElement)) return null;

  const roleNode = node.matches('[data-message-author-role]')
    ? node
    : node.querySelector('[data-message-author-role]');

  const role = normalizeRole(roleNode ? roleNode.getAttribute('data-message-author-role') : null);

  let root = roleNode ? roleNode.closest('article') : null;
  if (!root) root = node.closest('[data-testid^="conversation-turn"]');
  if (!root && node.matches('[data-testid^="conversation-turn"]')) root = node;
  if (!root && node.matches('article')) root = node;
  if (!root && roleNode) root = roleNode;

  if (!root || !(root instanceof HTMLElement)) return null;

  const rootText = root.textContent || '';
  if (!rootText.trim()) return null;

  return { root, role };
}

function normalizeRole(role) {
  const value = String(role || '').toLowerCase().trim();
  if (value === 'user') return 'user';
  if (value === 'assistant') return 'assistant';
  if (value === 'system') return 'system';
  if (value === 'tool') return 'tool';
  return 'unknown';
}

function shouldIncludeRole(role, settings) {
  if (role === 'user') return settings.includeUser !== false;
  if (role === 'assistant') return settings.includeAssistant !== false;
  if (role === 'system') return settings.includeSystem !== false;
  if (role === 'tool') return settings.includeSystem !== false;
  return settings.includeUnknown !== false;
}

function buildStandaloneHtml(messages, metadata, settings) {
  const title = escapeHtml(metadata.title || 'ChatGPT Export');
  const styles = settings.includeStandaloneCss === false ? '' : getExportStyles();
  const metadataBlock = settings.includeMetadata === false ? '' : buildMetadataBlock(metadata);
  const messageHtml = messages.map((message, index) => buildMessageHtml(message, index, metadata.startIndex)).join('\n');

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
${styles}
</head>
<body>
<main class="cphe-document">
<header class="cphe-document-header">
<h1>${title}</h1>
${metadataBlock}
</header>
${messageHtml}
</main>
</body>
</html>
`;
}

function buildMetadataBlock(metadata) {
  return `<dl class="cphe-metadata">
<dt>Source</dt><dd><a href="${escapeAttribute(metadata.sourceUrl)}">${escapeHtml(metadata.sourceUrl)}</a></dd>
<dt>Exported at</dt><dd>${escapeHtml(metadata.exportedAt)}</dd>
<dt>Range</dt><dd>from visible message #${metadata.startIndex + 1}; ${metadata.messageCount} exported / ${metadata.totalVisibleMessages} visible</dd>
</dl>`;
}

function buildMessageHtml(message, localIndex, startIndex) {
  const clone = prepareExportClone(message.root);
  sanitizeExportFragment(clone);

  const absoluteIndex = startIndex + localIndex + 1;
  return `<section class="cphe-message cphe-role-${escapeAttribute(message.role)}" data-role="${escapeAttribute(message.role)}" data-visible-index="${absoluteIndex}">
<header class="cphe-message-header"><span>#${absoluteIndex}</span><span>${escapeHtml(message.role)}</span></header>
<div class="cphe-message-body">${clone.innerHTML}</div>
</section>`;
}

function prepareExportClone(originalRoot) {
  const clone = originalRoot.cloneNode(true);
  appendShadowDomSnapshots(clone, originalRoot);
  hydrateWritingBlocks(clone, originalRoot);
  return clone;
}

function appendShadowDomSnapshots(cloneRoot, originalRoot) {
  const cloneElements = [cloneRoot, ...queryAll(cloneRoot, '*')];
  const originalElements = [originalRoot, ...queryAll(originalRoot, '*')];

  originalElements.forEach((originalElement, index) => {
    const shadowRoot = originalElement.shadowRoot;
    const cloneElement = cloneElements[index];
    if (!shadowRoot || !cloneElement || !hasMeaningfulText(shadowRoot)) return;

    const snapshot = document.createElement('div');
    snapshot.className = 'cphe-shadow-dom-snapshot';
    snapshot.append(shadowRoot.cloneNode(true));
    cloneElement.append(snapshot);
  });
}

function hydrateWritingBlocks(cloneRoot, originalRoot) {
  const cloneBlocks = queryAll(cloneRoot, WRITING_BLOCK_SELECTORS);
  if (cloneBlocks.length === 0) return;

  const originalBlocks = queryAll(originalRoot, WRITING_BLOCK_SELECTORS);
  cloneBlocks.forEach((cloneBlock, index) => {
    if (!isLikelyEmptyWritingBlock(cloneBlock)) return;

    const originalBlock = originalBlocks[index] || null;
    const replacement = findWritingBlockExportContent(originalBlock, originalRoot);
    if (!replacement) return;

    cloneBlock.replaceChildren(replacement);
    cloneBlock.classList.add('cphe-writing-block-export');
  });
}

function isLikelyEmptyWritingBlock(block) {
  const editor = block.querySelector('.writing-block-editor, [data-writing-block-editor]');
  if (editor && !hasMeaningfulText(editor)) return true;
  return !hasMeaningfulText(block);
}

function findWritingBlockExportContent(originalBlock, originalRoot) {
  const candidates = [];
  if (originalBlock) {
    candidates.push(...collectWritingBlockLocalCandidates(originalBlock));
  }
  candidates.push(...collectWritingBlockPortalCandidates(originalBlock, originalRoot));

  const best = candidates
    .filter(candidate => candidate && hasMeaningfulText(candidate))
    .sort((a, b) => getReadableNodeText(b).length - getReadableNodeText(a).length)[0];

  if (best) {
    return buildWritingBlockReplacement(best.cloneNode(true), 'Writing block');
  }

  const fallbackText = getReadableNodeText(originalBlock || '').trim();
  if (fallbackText.length >= 20) {
    const pre = document.createElement('pre');
    pre.textContent = fallbackText;
    return buildWritingBlockReplacement(pre, 'Writing block text fallback');
  }

  const warning = document.createElement('p');
  warning.textContent = 'Writing block content was not present in accessible DOM at export time.';
  return buildWritingBlockReplacement(warning, 'Writing block unavailable');
}

function collectWritingBlockLocalCandidates(originalBlock) {
  const candidates = [];
  const contentNodes = queryAll(originalBlock, WRITING_BLOCK_CONTENT_SELECTORS);
  candidates.push(...contentNodes.filter(hasMeaningfulText));
  if (originalBlock.shadowRoot) {
    candidates.push(originalBlock.shadowRoot);
    candidates.push(...queryAll(originalBlock.shadowRoot, WRITING_BLOCK_CONTENT_SELECTORS));
  }
  return candidates;
}

function collectWritingBlockPortalCandidates(originalBlock, originalRoot) {
  if (typeof document === 'undefined') return [];

  const messageId = getMessageId(originalRoot);
  const blockId = originalBlock ? originalBlock.id : '';
  const expectedIds = [messageId, blockId].filter(Boolean);
  if (expectedIds.length === 0) return [];

  return queryAll(document, WRITING_BLOCK_SELECTORS)
    .filter(candidate => candidate !== originalBlock)
    .filter(candidate => !originalRoot.contains(candidate))
    .filter(candidate => {
      const haystack = `${candidate.id || ''} ${candidate.getAttribute('data-testid') || ''}`;
      return expectedIds.some(id => haystack.includes(id) || Boolean(queryOne(candidate, `[id*="${cssString(id)}"]`)));
    })
    .flatMap(candidate => {
      const contentNodes = queryAll(candidate, WRITING_BLOCK_CONTENT_SELECTORS).filter(hasMeaningfulText);
      return contentNodes.length > 0 ? contentNodes : [candidate];
    });
}

function buildWritingBlockReplacement(content, label) {
  const wrapper = document.createElement('div');
  wrapper.className = 'cphe-writing-block-content';

  const header = document.createElement('div');
  header.className = 'cphe-writing-block-label';
  header.textContent = label;

  wrapper.append(header, content);
  return wrapper;
}

function getMessageId(root) {
  const node = root && root.matches && root.matches('[data-message-id]')
    ? root
    : queryOne(root, '[data-message-id]');
  return node ? node.getAttribute('data-message-id') || '' : '';
}

function queryAll(root, selector) {
  if (!root || typeof root.querySelectorAll !== 'function') return [];
  return [...root.querySelectorAll(selector)];
}

function queryOne(root, selector) {
  if (!root || typeof root.querySelector !== 'function') return null;
  return root.querySelector(selector);
}

function hasMeaningfulText(node) {
  return getReadableNodeText(node).replace(/\s+/g, ' ').trim().length >= 8;
}

function getReadableNodeText(node) {
  if (!node) return '';
  return String(node.innerText || node.textContent || '');
}

function cssString(value) {
  return String(value).replace(/["\\]/g, '\\$&');
}

function sanitizeExportFragment(root) {
  root.classList.remove(CPHE_BOUNDARY_CLASS);
  CONTROL_SELECTORS.forEach(selector => {
    root.querySelectorAll(selector).forEach(element => {
      element.remove();
    });
  });

  [root, ...root.querySelectorAll('*')].forEach(element => {
    [...element.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || '').trim();
      if (name.startsWith('on')) {
        element.removeAttribute(attr.name);
        return;
      }
      if ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'formaction') && /^javascript:/i.test(value)) {
        element.removeAttribute(attr.name);
        return;
      }
      if (name === 'srcdoc') {
        element.removeAttribute(attr.name);
        return;
      }
      if (name === 'contenteditable') {
        element.removeAttribute(attr.name);
      }
    });
  });
}

function getReadableText(root) {
  const clone = root.cloneNode(true);
  sanitizeExportFragment(clone);
  return (clone.textContent || '').trim();
}

function getConversationTitle() {
  const title = document.title
    .replace(/\s*[–-]\s*ChatGPT\s*$/i, '')
    .replace(/^ChatGPT\s*[–-]\s*/i, '')
    .trim();

  if (title && title.toLowerCase() !== 'chatgpt') return title;

  const firstUserMessage = getMessages().find(message => message.role === 'user');
  const text = firstUserMessage ? getReadableText(firstUserMessage.root) : '';
  return text ? text.slice(0, 60) : 'ChatGPT Conversation';
}

function buildFilename(title, startIndex, prefix) {
  const timestamp = formatTimestamp(new Date());
  const slug = slugify(title || 'conversation').slice(0, 80) || 'conversation';
  const safePrefix = slugify(prefix || 'chatgpt') || 'chatgpt';
  return `${safePrefix}-${slug}-${timestamp}-from-${startIndex + 1}.html`;
}

function formatTimestamp(date) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function slugify(value) {
  const basename = String(value || '').replace(/\\/g, '/').split('/').pop();
  return String(basename || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\\/<>:"|?*]+/g, '-')
    .replaceAll(String.fromCharCode(0), '-')
    .replace(/./gs, char => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? '' : char;
    })
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^\.+/, '')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function getExportStyles() {
  return `<style>
:root { color-scheme: light dark; }
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.65;
  background: Canvas;
  color: CanvasText;
}
.cphe-document {
  max-width: 980px;
  margin: 0 auto;
  padding: 40px 20px 80px;
}
.cphe-document-header {
  border-bottom: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
  margin-bottom: 28px;
  padding-bottom: 20px;
}
.cphe-document h1 {
  margin: 0 0 16px;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  line-height: 1.15;
}
.cphe-metadata {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 12px;
  margin: 0;
  font-size: 0.9rem;
}
.cphe-metadata dt {
  font-weight: 700;
  opacity: 0.75;
}
.cphe-metadata dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.cphe-message {
  border: 1px solid color-mix(in srgb, CanvasText 14%, transparent);
  border-radius: 14px;
  margin: 18px 0;
  overflow: hidden;
  background: color-mix(in srgb, Canvas 96%, CanvasText 4%);
}
.cphe-message-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid color-mix(in srgb, CanvasText 12%, transparent);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.72;
}
.cphe-message-body {
  padding: 18px;
  overflow-wrap: anywhere;
}
.cphe-role-user {
  background: color-mix(in srgb, Canvas 94%, CanvasText 6%);
}
.cphe-role-assistant {
  background: Canvas;
}
.cphe-message-body > :first-child { margin-top: 0; }
.cphe-message-body > :last-child { margin-bottom: 0; }
.cphe-writing-block-content {
  border: 1px solid color-mix(in srgb, CanvasText 14%, transparent);
  border-radius: 12px;
  margin: 1em 0;
  padding: 14px;
  background: color-mix(in srgb, Canvas 92%, CanvasText 8%);
}
.cphe-writing-block-label {
  margin-bottom: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.68;
}
pre {
  overflow-x: auto;
  padding: 14px;
  border-radius: 10px;
  background: color-mix(in srgb, CanvasText 88%, Canvas 12%);
  color: Canvas;
}
code, pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
:not(pre) > code {
  padding: 0.12em 0.3em;
  border-radius: 0.35em;
  background: color-mix(in srgb, CanvasText 10%, transparent);
}
blockquote {
  margin-left: 0;
  padding-left: 1em;
  border-left: 3px solid color-mix(in srgb, CanvasText 24%, transparent);
  opacity: 0.9;
}
table {
  border-collapse: collapse;
  width: 100%;
  display: block;
  overflow-x: auto;
}
th, td {
  border: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
  padding: 6px 8px;
  vertical-align: top;
}
a { color: LinkText; }
img, video, canvas, svg { max-width: 100%; height: auto; }
</style>`;
}

function showToast(message) {
  const existing = document.querySelector(`.${CPHE_TOAST_CLASS}`);
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = CPHE_TOAST_CLASS;
  toast.textContent = message;
  document.documentElement.append(toast);
  window.setTimeout(() => toast.remove(), 5200);
}

if (typeof globalThis !== 'undefined') {
  globalThis.CPHE_TEST_API = {
    buildFilename,
    buildStandaloneHtml,
    hydrateWritingBlocks,
    normalizeRole,
    prepareExportClone,
    sanitizeExportFragment,
    selectMessagesForExport,
    shouldIncludeRole,
    slugify
  };
}
