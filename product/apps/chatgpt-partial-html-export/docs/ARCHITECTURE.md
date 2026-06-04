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

The extension does not call OpenAI or ChatGPT internal APIs. It only exports DOM already rendered in the current tab.

That choice is intentional:

- lower account-safety risk
- smaller permission surface
- no dependency on private ChatGPT API contracts
- easier to reason about what is exported

The tradeoff is that messages not currently rendered by the page may not be exportable until the conversation is scrolled/loaded in the browser.
