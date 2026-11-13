/* global browser */

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

const form = document.getElementById('optionsForm');
const statusEl = document.getElementById('status');
const restoreDefaultsButton = document.getElementById('restoreDefaults');

init();

async function init() {
  const settings = await browser.runtime.sendMessage({ type: 'CPHE_GET_SETTINGS' });
  renderSettings({ ...DEFAULT_SETTINGS, ...settings });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const settings = readSettings();
  const result = await browser.runtime.sendMessage({ type: 'CPHE_SAVE_SETTINGS', payload: settings });
  renderSettings(result.settings);
  setStatus('Saved.');
});

restoreDefaultsButton.addEventListener('click', async () => {
  const result = await browser.runtime.sendMessage({ type: 'CPHE_SAVE_SETTINGS', payload: DEFAULT_SETTINGS });
  renderSettings(result.settings);
  setStatus('Restored defaults.');
});

function renderSettings(settings) {
  form.elements.exportMode.value = settings.exportMode || 'download';
  document.getElementById('downloadsSubdir').value = settings.downloadsSubdir || '';
  document.getElementById('nativeOutputDir').value = settings.nativeOutputDir || '';
  document.getElementById('filenamePrefix').value = settings.filenamePrefix || 'chatgpt';
  document.getElementById('includeUser').checked = settings.includeUser !== false;
  document.getElementById('includeAssistant').checked = settings.includeAssistant !== false;
  document.getElementById('includeSystem').checked = settings.includeSystem !== false;
  document.getElementById('includeUnknown').checked = settings.includeUnknown !== false;
  document.getElementById('includeMetadata').checked = settings.includeMetadata !== false;
  document.getElementById('includeStandaloneCss').checked = settings.includeStandaloneCss !== false;
  document.getElementById('fallbackToDownload').checked = settings.fallbackToDownload !== false;
}

function readSettings() {
  return {
    exportMode: form.elements.exportMode.value,
    downloadsSubdir: document.getElementById('downloadsSubdir').value,
    nativeOutputDir: document.getElementById('nativeOutputDir').value,
    filenamePrefix: document.getElementById('filenamePrefix').value,
    includeUser: document.getElementById('includeUser').checked,
    includeAssistant: document.getElementById('includeAssistant').checked,
    includeSystem: document.getElementById('includeSystem').checked,
    includeUnknown: document.getElementById('includeUnknown').checked,
    includeMetadata: document.getElementById('includeMetadata').checked,
    includeStandaloneCss: document.getElementById('includeStandaloneCss').checked,
    fallbackToDownload: document.getElementById('fallbackToDownload').checked
  };
}

function setStatus(message) {
  statusEl.textContent = message;
  window.setTimeout(() => {
    if (statusEl.textContent === message) statusEl.textContent = '';
  }, 3000);
}
