# ChatGPT Partial HTML Export

ChatGPT の会話を、**特定メッセージ以降だけ** HTML として保存するための個人用 Firefox 拡張。

Store には出さない前提。

## 配置

このディレクトリを `tenzyudotcom` モノレポ内の次の場所に置く。

```txt
product/apps/chatgpt-partial-html-export
```

ビルドは不要。Firefox にはこのディレクトリ直下の `manifest.json` を一時読み込みする。

## 目的

ChatGPT の長い会話から、作業に必要な後半部分だけを切り出す。

想定用途:

- LLM 作業ログの保存
- contract / handoff / review evidence の生成元保存
- 特定判断点以降の会話だけをリポジトリに残す
- ChatGPT の公式全履歴 export では粒度が荒すぎる場合の補助

## できること

- ChatGPT の各メッセージに `Export from #n` ボタンを追加
- 押したメッセージから末尾までを standalone HTML として保存
- 会話全体の visible export
- HTML を clipboard にコピー
- user / assistant / system-like / unknown role の含有制御
- Firefox Downloads 配下への保存
- Native Messaging host 経由で任意の絶対パスへ保存
- Native host 失敗時に downloads mode へ fallback

## できないこと / 割り切り

- ChatGPT の内部 API は叩かない
- 公式の会話履歴データベースにはアクセスしない
- DOM に存在しない未描画メッセージは取れない可能性がある
- Firefox の `downloads` API だけでは任意の絶対パスに直書きできない
- 任意パス出力には同梱の Native Messaging host を使う
- PDF / Markdown / JSON export はしない
- 複数ブラウザ対応は保証しない

この拡張は「現在開いている ChatGPT ページの DOM exporter」。
会話履歴 extractor ではない。

## Firefox に読み込む

1. Firefox で `about:debugging#/runtime/this-firefox` を開く
2. `Load Temporary Add-on...` を押す
3. `product/apps/chatgpt-partial-html-export/manifest.json` を選ぶ
4. ChatGPT の会話ページを開く
5. メッセージに hover して `Export from #n` を押す

一時読み込みなので、Firefox を再起動すると外れる。再度 `manifest.json` を読み込む。

必要な権限は `downloads`、`nativeMessaging`、`storage`、`clipboardWrite`、および次の ChatGPT URL のみ。

```txt
https://chatgpt.com/*
https://chat.openai.com/*
```

## 使い方

### 1. 特定ステップから保存

ChatGPT の会話ページで、各メッセージに hover すると右上に出る。

```txt
Export from #12
```

これを押すと、visible message #12 から末尾までが HTML 保存される。

`#12` は現在 DOM 上で認識された visible message order。公式の会話IDや永続IDではない。

### 2. 表示中スレッド全体を保存

Firefox toolbar の拡張アイコンを押す。

```txt
Export visible thread
```

### 3. HTML を clipboard にコピー

Firefox toolbar の拡張アイコンを押す。

```txt
Copy visible HTML
```

## 出力先

### A. 標準: Firefox downloads mode

デフォルトはこのモード。

Options で設定できる。

```txt
Output mode: Firefox downloads
Downloads subdirectory: chatgpt-partial-html-export
```

保存先は Firefox の標準 Downloads ディレクトリ配下。

例:

```txt
~/Downloads/chatgpt-partial-html-export/chatgpt-xxx-20260604-132000-from-12.html
```

Firefox 側の Downloads ディレクトリをリポジトリ配下に変えれば、downloads mode でもリポジトリへ書ける。だが、ブラウザ全体の設定変更になるので、基本は次の native mode を推奨。

`Downloads subdirectory` は Firefox Downloads 配下の相対パスとして扱う。絶対パスや `../` は sanitize され、任意の絶対パスとしては扱われない。

### B. 任意の絶対パス: native mode

リポジトリへ直接書き出したい場合はこちら。

初回だけ native host をインストールする。

```bash
cd /home/tenzyu/Documents/tenzyudotcom/product/apps/chatgpt-partial-html-export
bun run install:native-host
```

その後、Firefox の `about:debugging` で拡張を Reload。

Options を開いて、以下を設定する。

```txt
Output mode: Native host absolute path
Native output directory: /home/tenzyu/Documents/tenzyudotcom/harness/exports/chatgpt
```

保存例:

```txt
/home/tenzyu/Documents/tenzyudotcom/harness/exports/chatgpt/chatgpt-atelier-20260604-132000-from-12.html
```

Native host を消す場合:

```bash
bun run uninstall:native-host
```

Native Messaging host 名は次で統一している。

```txt
com.tenzyudotcom.chatgpt_partial_html_export
```

Firefox native manifest は次へ生成される。

```txt
~/.mozilla/native-messaging-hosts/com.tenzyudotcom.chatgpt_partial_html_export.json
```

Native mode の `Native output directory` は絶対パスのみ有効。空文字や相対パスは拒否される。存在しないディレクトリは native host が作成する。

## Options

| Option                            | 意味                                               |
| --------------------------------- | -------------------------------------------------- |
| Output mode                       | `download` または `native`                         |
| Downloads subdirectory            | Firefox Downloads 配下の相対ディレクトリ           |
| Native output directory           | native mode で使う絶対パス                         |
| Filename prefix                   | 出力ファイル名の接頭辞                             |
| Include user messages             | user role を含める                                 |
| Include assistant messages        | assistant role を含める                            |
| Include system/tool-like messages | system/tool-like role を含める                     |
| Include unknown DOM blocks        | role 判定できない block を含める                   |
| Include metadata header           | source URL / exportedAt / range をHTML先頭に入れる |
| Include standalone CSS            | HTML単体で読めるCSSを埋め込む                      |
| Fall back to downloads            | native mode失敗時にdownloads保存へ逃がす           |

## 品質確認

依存パッケージなし。Bun から構文チェックと Node.js test runner のテストを実行する。

```bash
cd product/apps/chatgpt-partial-html-export
bun run check
```

個別には以下。

```bash
bun run check:syntax
bun run test
```

`bun run check` の内容:

- JS 構文チェック
- native host unit tests
- native messaging protocol test
- path sanitize tests
- filename sanitize tests
- HTML sanitize tests
- settings normalize tests
- range selection tests

`web-ext` はこの環境に同梱されていなかったため、lint は未実施。必要ならローカルに `web-ext` を入れて次を実行する。

```bash
web-ext lint
```

## セキュリティ境界

この拡張は、外部サーバーへ送信しない。

ただし、以下には注意する。

- export した HTML には会話内容が含まれる
- native mode では指定した絶対パスへファイルを書き込む
- native host は `outputDir` が絶対パスであることを検証する
- filename は path traversal を避けるため basename 化・sanitize する
- downloads mode の subdirectory は相対パスに sanitize する
- export HTML から `script` / `iframe` / `object` / `embed` / `svg` を除去する
- inline event handler と `javascript:` URL を除去する
- shell 経由のファイル書き込みや任意コマンド実行はしない

## DOM 依存について

ChatGPT のDOMは公式契約ではない。

現在は主に以下を見ている。

```txt
[data-message-author-role]
[data-testid^="conversation-turn"]
article
```

ChatGPT 側のDOMが変わったら、`src/content.js` の `MESSAGE_SELECTORS` と `normalizeMessageCandidate()` を直す。

## なぜ内部APIを叩かないか

内部API経由のほうが完全な会話JSONを取りやすい可能性はある。

ただし、今回の目的は個人用の作業ログ切り出しなので、以下を優先する。

- アカウント安全性
- 権限面の小ささ
- 実装の単純さ
- 仕様変更に対する被害範囲の限定

そのため、あえて DOM exporter に寄せている。

## 既知の制約

長い会話では、古いメッセージがDOMから外れている可能性がある。その場合は、必要な範囲までスクロールして表示してから export する。

`Export from #n` の番号は「現在DOM上に見えているメッセージ順」。公式の会話IDや永続ステップ番号ではない。

## Manual Firefox checklist

Firefox GUI と ChatGPT ログインが必要なため、この環境では実機ランタイム確認は未実施。利用前に次を手で確認する。

1. `about:debugging#/runtime/this-firefox` で `manifest.json` を Load Temporary Add-on できる
2. `https://chatgpt.com/` または `https://chat.openai.com/` の会話ページで `Export from #n` が出る
3. SPA 遷移後と reload 後もボタンが出る
4. 3件以上ある会話で中間メッセージから export し、起点以前が HTML に含まれない
5. code block / table / list / heading が standalone HTML で読める
6. popup の `Export visible thread` が保存に成功する
7. popup の `Copy visible HTML` が clipboard に HTML 文字列をコピーする
8. Options 保存後、includeUser=false と includeAssistant=false が export に反映される
9. downloads mode で Downloads subdirectory 配下に保存される
10. `bun run install:native-host` 後に Firefox 拡張を Reload し、native mode で絶対パスへ保存される
11. nativeOutputDir を空または相対パスにした場合、エラー表示または fallbackToDownload が機能する
12. 確認後に `bun run uninstall:native-host` で native manifest を削除できる

## ライセンス

個人利用前提。`package.json` は `UNLICENSED`。
