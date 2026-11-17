# ChatGPT Partial HTML Export

A personal **Firefox WebExtension** that exports the currently rendered part of a ChatGPT conversation as standalone HTML, starting at a chosen message. No ChatGPT internal API is used, and it does not extract unloaded/virtualized history. This is a DOM exporter, not a conversation backup service.

## Install and export

1. Open Firefox `about:debugging#/runtime/this-firefox` and choose **Load Temporary Add-on…**.
2. Select this directory's `manifest.json` and open a ChatGPT conversation.
3. Hover a message; **Export from #n** includes that message onward. The popup also offers **Export visible thread** and **Copy visible HTML**.

The temporary add-on must be reloaded after restarting Firefox. `#n` is rendered message order, not a stable conversation ID. Scroll to render older content first. Permissions are scoped to Firefox downloads, nativeMessaging, storage, clipboardWrite and ChatGPT hosts.

## Output

Default mode uses Firefox Downloads and a sanitized relative subdirectory; it cannot directly write arbitrary absolute paths. Optional native mode allows a selected absolute destination through a local Node.js Native Messaging host:

```sh
cd product/apps/chatgpt-partial-html-export
bun run install:native-host
# Reload the extension; select Native host absolute path in Options.
bun run uninstall:native-host   # when no longer needed
```

Host name: `com.tenzyudotcom.chatgpt_partial_html_export`, with a Firefox manifest under `~/.mozilla/native-messaging-hosts`. Native mode failure can fall back to Downloads if enabled. Options include filename prefix, user/assistant/system-like/unknown roles, metadata header and embedded CSS. Never write private conversations into a public checkout.

## Security and limitations

The content script captures visible DOM, builds HTML and sends it to the background script; Downloads or native host writes locally. Native host requires an absolute directory and sanitizes the filename; exporter strips scripts, iframes, embeds, SVG, inline event handlers and JavaScript URLs. These controls reduce risk, not a universal HTML-safety guarantee. No private ChatGPT API or outbound export upload is intended. The page DOM is not stable; selectors in `src/content.js` include `[data-message-author-role]`, `[data-testid^="conversation-turn"]` and `article`.

No Markdown/PDF/JSON exporter, unloaded history extraction, or cross-browser compatibility guarantee is provided. See [architecture](docs/ARCHITECTURE.md).

## Verification

```sh
bun run check        # JS syntax + Node native host/exporter tests
```

Manual Firefox verification is still necessary: loading/reloading, SPA navigation, slice boundaries, HTML formatting, popup actions, role filtering, Downloads destination sanitization, native host write/failure/fallback and uninstall. Automated Node tests do not prove browser runtime behavior. See the [original expanded checklist](https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/product/apps/chatgpt-partial-html-export/README.md) when needed.
