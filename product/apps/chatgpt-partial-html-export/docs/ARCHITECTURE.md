# HTML export architecture

This is a local-only Firefox WebExtension.

```txt
ChatGPT page
  content script
    injects "Export from #n" buttons
    reads currently rendered message DOM
    builds standalone HTML
    sends HTML payload to background script

Extension background
  download mode
    writes HTML via browser.downloads.download()
  native mode
    sends HTML to Native Messaging host

Native host
  Node.js stdio process
  validates absolute outputDir
  sanitizes filename
  writes HTML to disk
```

## API and export boundary

The extension does not call OpenAI or ChatGPT internal APIs. It exports only the DOM already rendered in the current tab.

Reading the rendered DOM avoids private ChatGPT API dependencies and reduces the required permissions and account-safety risk.

The exporter cannot read messages until the page renders them. Scroll or load earlier messages before exporting them.
