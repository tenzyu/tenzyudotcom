/* global browser */

const statusEl = document.getElementById('status');
const exportVisibleButton = document.getElementById('exportVisible');
const copyVisibleButton = document.getElementById('copyVisible');
const reinjectButton = document.getElementById('reinject');
const openOptionsButton = document.getElementById('openOptions');

init();

async function init() {
  const tab = await getActiveTab();
  const isChatGpt = tab && /^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(tab.url || '');

  setButtonsEnabled(Boolean(isChatGpt));

  if (!isChatGpt) {
    statusEl.textContent = 'Open a ChatGPT conversation tab first.';
    return;
  }

  try {
    const state = await sendToActiveTab({ type: 'CPHE_GET_PAGE_STATE' });
    statusEl.textContent = `${state.messageCount} visible messages. ${state.title}`;
  } catch (error) {
    statusEl.textContent = `Content script is not ready. Try reloading the tab. ${error.message || error}`;
  }
}

exportVisibleButton.addEventListener('click', () => runAction({ type: 'CPHE_EXPORT_VISIBLE' }));
copyVisibleButton.addEventListener('click', () => runAction({ type: 'CPHE_COPY_VISIBLE_HTML' }));
reinjectButton.addEventListener('click', () => runAction({ type: 'CPHE_REINJECT' }));
openOptionsButton.addEventListener('click', () => browser.runtime.openOptionsPage());

async function runAction(message) {
  try {
    setButtonsEnabled(false);
    const result = await sendToActiveTab(message);
    statusEl.textContent = result && result.ok === false
      ? `Failed: ${result.error || 'unknown error'}`
      : 'Done.';
  } catch (error) {
    statusEl.textContent = `Failed: ${error.message || String(error)}`;
  } finally {
    setButtonsEnabled(true);
  }
}

async function getActiveTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function sendToActiveTab(message) {
  const tab = await getActiveTab();
  if (!tab || !tab.id) throw new Error('No active tab.');
  return browser.tabs.sendMessage(tab.id, message);
}

function setButtonsEnabled(enabled) {
  exportVisibleButton.disabled = !enabled;
  copyVisibleButton.disabled = !enabled;
  reinjectButton.disabled = !enabled;
}
