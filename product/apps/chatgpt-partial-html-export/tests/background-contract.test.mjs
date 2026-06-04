import assert from 'node:assert/strict';
import test from 'node:test';

await import('../src/background.js');

const {
  joinRelativeDownloadPath,
  normalizeSettings,
  sanitizeFilename,
  sanitizeFilenameStem,
  sanitizeRelativePath
} = globalThis.CPHE_BACKGROUND_TEST_API;

test('sanitizeFilename basename-sanitizes unsafe filenames', () => {
  assert.equal(sanitizeFilename('../x.html'), 'x.html');
  assert.equal(sanitizeFilename('a/b/c.html'), 'c.html');
  assert.equal(sanitizeFilename('a\\b\\c.html'), 'c.html');
  assert.equal(sanitizeFilename(''), 'chatgpt-export.html');
  assert.equal(sanitizeFilename('日本語タイトル.html'), '日本語タイトル.html');
});

test('sanitizeFilenameStem removes separators and dangerous filename characters', () => {
  assert.equal(sanitizeFilenameStem('../chat:gpt?'), 'chat-gpt');
});

test('sanitizeRelativePath keeps safe relative subdirectories', () => {
  assert.equal(sanitizeRelativePath('exports/chatgpt'), 'exports/chatgpt');
});

test('sanitizeRelativePath neutralizes traversal absolute and backslash paths', () => {
  assert.equal(sanitizeRelativePath('../secret'), 'secret');
  assert.equal(sanitizeRelativePath('/tmp/x'), 'tmp/x');
  assert.equal(sanitizeRelativePath('..\\secret\\x'), 'secret/x');
});

test('joinRelativeDownloadPath never returns an absolute path', () => {
  assert.equal(joinRelativeDownloadPath('/tmp/../exports', '../x.html'), 'tmp/exports/x.html');
});

test('normalizeSettings coerces invalid values to the contract defaults', () => {
  assert.deepEqual(normalizeSettings({
    exportMode: 'bad',
    downloadsSubdir: '../secret',
    nativeOutputDir: '  /tmp/export  ',
    filenamePrefix: '../chat:gpt?',
    includeUser: false,
    includeAssistant: 0,
    includeSystem: null,
    includeUnknown: undefined,
    includeMetadata: false,
    includeStandaloneCss: false,
    fallbackToDownload: false
  }), {
    exportMode: 'download',
    downloadsSubdir: 'secret',
    nativeOutputDir: '/tmp/export',
    filenamePrefix: 'chat-gpt',
    includeUser: false,
    includeAssistant: true,
    includeSystem: true,
    includeUnknown: true,
    includeMetadata: false,
    includeStandaloneCss: false,
    fallbackToDownload: false
  });
});
