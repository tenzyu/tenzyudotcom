/* global browser */

const NATIVE_HOST_NAME = 'com.tenzyudotcom.chatgpt_partial_html_export';

const DEFAULT_SETTINGS = Object.freeze({
  exportMode: 'download',
  downloadsSubdir: 'chatgpt-partial-html-export',
  nativeOutputDir: '',
  filenamePrefix: 'chatgpt',
  includeUser: true,
  includeAssistant: true,
  includeSystem: true,
  includeUnknown: true,
  includeMetadata: true,
  includeStandaloneCss: true,
  fallbackToDownload: true
});

if (typeof browser !== 'undefined') {
  browser.runtime.onMessage.addListener((message, sender) => {
    if (!message || typeof message !== 'object') {
      return false;
    }

    if (message.type === 'CPHE_EXPORT_HTML') {
      return handleExportHtml(message.payload);
    }

    if (message.type === 'CPHE_GET_SETTINGS') {
      return getSettings();
    }

    if (message.type === 'CPHE_SAVE_SETTINGS') {
      return saveSettings(message.payload);
    }

    return false;
  });
}

async function getSettings() {
  const stored = await browser.storage.local.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

async function saveSettings(nextSettings) {
  const safe = normalizeSettings(nextSettings || {});
  await browser.storage.local.set(safe);
  return { ok: true, settings: { ...DEFAULT_SETTINGS, ...safe } };
}

function normalizeSettings(input) {
  return {
    exportMode: input.exportMode === 'native' ? 'native' : 'download',
    downloadsSubdir: sanitizeRelativePath(input.downloadsSubdir || DEFAULT_SETTINGS.downloadsSubdir),
    nativeOutputDir: String(input.nativeOutputDir || '').trim(),
    filenamePrefix: sanitizeFilenameStem(input.filenamePrefix || DEFAULT_SETTINGS.filenamePrefix),
    includeUser: input.includeUser !== false,
    includeAssistant: input.includeAssistant !== false,
    includeSystem: input.includeSystem !== false,
    includeUnknown: input.includeUnknown !== false,
    includeMetadata: input.includeMetadata !== false,
    includeStandaloneCss: input.includeStandaloneCss !== false,
    fallbackToDownload: input.fallbackToDownload !== false
  };
}

async function handleExportHtml(payload) {
  if (!payload || typeof payload.html !== 'string') {
    throw new Error('Invalid export payload: html is required.');
  }

  const settings = await getSettings();
  const filename = sanitizeFilename(payload.filename || 'chatgpt-export.html');

  if (settings.exportMode === 'native') {
    try {
      const result = await writeWithNativeHost({
        html: payload.html,
        filename,
        outputDir: settings.nativeOutputDir,
        metadata: payload.metadata || null
      });
      return { ok: true, mode: 'native', path: result.path };
    } catch (error) {
      if (!settings.fallbackToDownload) {
        throw new Error(`Native export failed: ${error.message || String(error)}`);
      }

      const downloadResult = await writeWithDownloadsApi(payload.html, filename, settings.downloadsSubdir);
      return {
        ok: true,
        mode: 'download',
        fallback: true,
        warning: `Native export failed; downloaded instead. ${error.message || String(error)}`,
        downloadId: downloadResult.id
      };
    }
  }

  const downloadResult = await writeWithDownloadsApi(payload.html, filename, settings.downloadsSubdir);
  return { ok: true, mode: 'download', downloadId: downloadResult.id };
}

async function writeWithNativeHost(message) {
  if (!message.outputDir) {
    throw new Error('Native output directory is empty. Set it in extension options first.');
  }

  const response = await browser.runtime.sendNativeMessage(NATIVE_HOST_NAME, {
    type: 'writeHtml',
    html: message.html,
    filename: message.filename,
    outputDir: message.outputDir,
    metadata: message.metadata
  });

  if (!response || response.ok !== true) {
    throw new Error((response && response.error) || 'Native host returned an invalid response.');
  }

  return response;
}

async function writeWithDownloadsApi(html, filename, subdir) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const relativeFilename = joinRelativeDownloadPath(subdir, filename);

  try {
    const id = await browser.downloads.download({
      url,
      filename: relativeFilename,
      saveAs: false,
      conflictAction: 'uniquify'
    });
    return { id };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

function joinRelativeDownloadPath(subdir, filename) {
  const safeSubdir = sanitizeRelativePath(subdir || '');
  const safeFilename = sanitizeFilename(filename || 'chatgpt-export.html');
  return safeSubdir ? `${safeSubdir}/${safeFilename}` : safeFilename;
}

function sanitizeRelativePath(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => part !== '.' && part !== '..')
    .map(sanitizeFilenameStem)
    .filter(Boolean)
    .join('/');
}

function sanitizeFilename(value) {
  const basename = String(value || 'chatgpt-export.html').replace(/\\/g, '/').split('/').pop();
  const normalized = String(basename || 'chatgpt-export.html')
    .normalize('NFKC')
    .replace(/[\\/<>:"|?*]+/g, '-')
    .replaceAll(String.fromCharCode(0), '-')
    .replace(/./gs, char => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? '' : char;
    })
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .slice(0, 180);

  const withName = normalized || 'chatgpt-export.html';
  return /\.html?$/i.test(withName) ? withName : `${withName}.html`;
}

function sanitizeFilenameStem(value) {
  const basename = String(value || '').replace(/\\/g, '/').split('/').pop();
  return String(basename || '')
    .normalize('NFKC')
    .replace(/[\\/<>:"|?*]+/g, '-')
    .replaceAll(String.fromCharCode(0), '-')
    .replace(/./gs, char => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? '' : char;
    })
    .replace(/\s+/g, '-')
    .replace(/^\.+/, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

if (typeof globalThis !== 'undefined') {
  globalThis.CPHE_BACKGROUND_TEST_API = {
    joinRelativeDownloadPath,
    normalizeSettings,
    sanitizeFilename,
    sanitizeFilenameStem,
    sanitizeRelativePath
  };
}
