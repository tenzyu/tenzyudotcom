# ChatGPT partial HTML export

This personal Firefox WebExtension exports the rendered part of a ChatGPT conversation as standalone HTML from a chosen message onward. It does not use ChatGPT internal APIs or extract unloaded or virtualized history. This is a DOM exporter, not a conversation backup service.

## Install and export

1. Open Firefox `about:debugging#/runtime/this-firefox` and choose **Load Temporary Add-on…**.
2. Select this directory's `manifest.json` and open a ChatGPT conversation.
3. Hover over a message. **Export from #n** includes that message and all rendered messages after it. The popup also offers **Export visible thread** and **Copy visible HTML**.

Reload the temporary add-on after restarting Firefox. `#n` is rendered message order, not a stable conversation ID. Scroll to render older content first. Permissions are scoped to Firefox downloads, nativeMessaging, storage, clipboardWrite and ChatGPT hosts.

## Output

Default mode uses Firefox Downloads and a sanitized relative subdirectory. It cannot write to arbitrary absolute paths. Optional native mode allows a selected absolute destination through a local Node.js Native Messaging host:

```sh
cd product/apps/chatgpt-partial-html-export
bun run install:native-host
# Reload the extension; select Native host absolute path in Options.
bun run uninstall:native-host   # when no longer needed
```

The host name is `com.tenzyudotcom.chatgpt_partial_html_export`. Its Firefox manifest is under `~/.mozilla/native-messaging-hosts`. Native mode failure can fall back to Downloads if enabled. Options include filename prefix, user/assistant/system-like/unknown roles, metadata header and embedded CSS. Never write private conversations into a public checkout.

## Security and limitations

The content script captures the visible DOM, builds HTML and sends it to the background script. Firefox Downloads or the native host writes the file locally. The native host requires an absolute directory and sanitizes the filename. The exporter strips scripts, iframes, embeds, SVG, inline event handlers and JavaScript URLs. These controls reduce risk, not a universal HTML-safety guarantee. No private ChatGPT API or outbound export upload is intended. The page DOM is subject to change. Selectors in `src/content.js` include `[data-message-author-role]`, `[data-testid^="conversation-turn"]` and `article`.

The extension does not export Markdown, PDF or JSON, extract unloaded history or guarantee compatibility across browsers. See [architecture](docs/ARCHITECTURE.md).

## Verification

```sh
bun run check        # JS syntax + Node native host/exporter tests
```

Manual Firefox verification must cover: loading/reloading, SPA navigation, slice boundaries, HTML formatting, popup actions, role filtering, Downloads destination sanitization, native host write/failure/fallback and uninstall. Automated Node tests do not prove browser runtime behavior. See the [original expanded checklist](https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/product/apps/chatgpt-partial-html-export/README.md) when needed.
