# ChatGPT partial HTML export

This personal Firefox WebExtension exports the rendered part of a ChatGPT conversation as standalone HTML from a chosen message onward. It does not use ChatGPT internal APIs or extract unloaded or virtualized history. This is a DOM exporter, not a conversation backup service.

## Install the extension and export a conversation

1. Open `about:debugging#/runtime/this-firefox` in Firefox. Choose **Load Temporary Add-on…**.
2. Select `manifest.json` in the extension directory.
3. Open a ChatGPT conversation.
4. Hover over a message. Select **Export from #n** to export that message and all rendered messages after it. To export the entire rendered conversation, select **Export visible thread** or **Copy visible HTML** in the popup.

Reload the temporary add-on after restarting Firefox. `#n` is rendered message order, not a stable conversation ID. To include older content, scroll to it before exporting. Permissions are scoped to Firefox downloads, nativeMessaging, storage, clipboardWrite and ChatGPT hosts.

## Output

The default mode writes through Firefox Downloads to a sanitized relative subdirectory. It cannot write to arbitrary absolute paths. To choose an absolute destination, install the local Node.js Native Messaging host:

```sh
cd product/apps/chatgpt-partial-html-export
bun run install:native-host
# Reload the extension; select Native host absolute path in Options.
bun run uninstall:native-host   # when no longer needed
```

The host name is `com.tenzyudotcom.chatgpt_partial_html_export`. Its Firefox manifest is under `~/.mozilla/native-messaging-hosts`. Native mode failure can fall back to Downloads if enabled. Options include filename prefix, user/assistant/system-like/unknown roles, metadata header and embedded CSS. Never write private conversations into a public checkout.

## Export constraints

The content script captures the visible DOM, builds HTML and sends it to the background script. Firefox Downloads or the native host writes the file locally. The native host requires an absolute directory and sanitizes the filename. The exporter strips scripts, iframes, embeds, SVG, inline event handlers and JavaScript URLs. These controls reduce risk, not a universal HTML-safety guarantee. The exporter is designed to avoid private ChatGPT APIs and outbound export uploads. The page DOM is subject to change. Selectors in `src/content.js` include `[data-message-author-role]`, `[data-testid^="conversation-turn"]` and `article`.

The extension does not export Markdown, PDF or JSON, extract unloaded history or guarantee compatibility across browsers. See [architecture](docs/ARCHITECTURE.md).

## Verify the extension

```sh
bun run check        # JS syntax + Node native host/exporter tests
```

Manual Firefox verification must cover: loading/reloading, SPA navigation, slice boundaries, HTML formatting, popup actions, role filtering, Downloads destination sanitization, native host write/failure/fallback and uninstall. Automated Node tests do not prove browser runtime behavior. See the [original expanded checklist](https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/product/apps/chatgpt-partial-html-export/README.md) when needed.
