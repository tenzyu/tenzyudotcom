# Architecture

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

## Boundary

The extension does not call OpenAI or ChatGPT internal APIs. It exports only the DOM already rendered in the current tab.

This design reduces account-safety risk and requires fewer permissions. It avoids dependence on private ChatGPT API contracts. Exported content is limited to the DOM visible in the browser.

Messages that the page has not rendered may become exportable only after the user scrolls or loads them in the browser.
