const CPHE_EXPORT_DEFAULTS = Object.freeze({
  filenamePrefix: 'chatgpt',
  includeUser: true,
  includeAssistant: true,
  includeSystem: true,
  includeUnknown: true,
  includeMetadata: true,
  includeStandaloneCss: true
});

const CPHE_DEFAULT_SETTINGS = Object.freeze({
  exportMode: 'download',
  downloadsSubdir: 'chatgpt-partial-html-export',
  nativeOutputDir: '',
  ...CPHE_EXPORT_DEFAULTS,
  fallbackToDownload: true
});
