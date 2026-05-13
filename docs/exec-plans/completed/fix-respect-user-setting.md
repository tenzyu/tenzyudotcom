---
name: fix-respect-user-setting
description: LanguageSwitcher で選んだ locale を端末言語より優先して保持する
summary: locale の優先順位を URL と user-selected locale 中心に固定し、Accept-Language の上書きを防ぐ。
read_when:
  - locale 選択後の再訪で言語が戻る不具合を直すとき
  - proxy の locale precedence を確認するとき
execution-ready: true
---

## Goal

ユーザーがサイト上で明示的に選んだ locale を、以後のアクセスとリダイレクト判定で最優先に扱う。`Accept-Language` や端末既定言語は、未選択時の初期推定にのみ使う。

## Scope

- locale 選択 UI とその永続化処理
- `proxy.ts` による locale 解決の優先順位
- locale 付き / locale なし URL 間の遷移挙動
- 必要なら Intlayer 依存の利用方法を repo ルールへ追記

## Out Of Scope

- 対応言語の追加
- 翻訳コンテンツの変更
- locale path ベースの routing 構造変更

## Current Problem

- 一部端末で `LanguageSwitcher` で選んだ locale が次の遷移や再訪時に尊重されない
- 現在の `LanguageSwitcher` は `setLocale(locale)` と `Link` 遷移を同時に行っており、永続化の責務が曖昧
- `proxy.ts` は `intlayerProxy(request)` に全面委譲しており、明示選択 locale の優先順位がコード上で見えない

## Functional Spec

### 1. Locale Priority

locale 解決の優先順位を次で固定する。

1. URL に含まれる明示 locale
2. サイト上でユーザーが最後に選んだ persisted locale
3. `Accept-Language` などの端末既定言語
4. アプリ既定 locale

### 2. URL Behavior

- `/:locale/...` へ到達済みのリクエストは、その locale を尊重し、端末言語で上書きしない
- locale なし URL へ来たときだけ、persisted locale または端末言語を用いて locale 付き URL へ解決する
- LanguageSwitcher で locale を切り替えた直後の遷移先 URL は、必ず選択した locale prefix を含む

### 3. Persistence Behavior

- LanguageSwitcher 操作時に、明示選択 locale を同期的または遷移前に確実に永続化する
- persisted locale が存在する間は、端末言語判定で上書きしない
- 永続化に失敗しても、少なくとも直後の遷移は URL locale によって正しい表示になる

### 4. LanguageSwitcher Contract

- `setLocale` と `Link` の二重責務を整理する
- 実装は次のどちらかに統一する
  - locale 永続化を明示的に行ってから router/navigation する
  - Intlayer 推奨の単一フローへ寄せ、競合する処理を消す
- 切り替え操作後に、現在 locale 表示と遷移先 locale が不一致にならない

### 5. Proxy Contract

- `proxy.ts` で locale 優先順位が読める状態にする
- Intlayer の標準 proxy を継続利用する場合でも、この repo が期待する precedence をコメントか薄い wrapper で明示する
- persisted locale があるのに `Accept-Language` で別 locale へ redirect される挙動は不可

### 6. Observability / Regression Guard

- locale 選択後の再訪ケースを再現できるテストを追加する
- 少なくとも次の回帰を防ぐ
  - `ja` を選んだのに再訪で `en` へ飛ぶ
  - `en` URL に居るのに `ja` へ戻される
  - 初回訪問者だけが端末言語に応じて誘導される、という仕様が壊れる

## Deliverables

- locale 優先順位を固定した実装
- `LanguageSwitcher` の責務整理
- proxy locale 判定の明文化
- 回帰防止テスト
- 学びを durable rule へ反映

## Task Breakdown

1. 現行の locale persistence と proxy precedence を特定する
2. LanguageSwitcher の切り替えフローを単一責務に整理する
3. persisted locale を尊重する proxy / wrapper へ調整する
4. URL locale、persisted locale、Accept-Language の優先順位をテストで固定する
5. 判断を rule へ昇格する

## Subagent Contract

- plan path: `docs/exec-plans/active/fix-respect-user-setting.md`
- allowed file scope:
  - `src/components/shell/**`
  - `src/proxy.ts`
  - `src/app/**`
  - `docs/design-docs/rules/**`
- required verification:
  - `bun run lint`
  - `bun run build`
  - locale 関連 test
- expected return format:
  - root cause
  - changed files
  - precedence after fix
  - verification result

## Verification

- `bun run lint`
- `bun run build`
- locale 選択後、locale なし URL 再訪でも選択 locale が使われること
- `Accept-Language` が選択 locale と異なっていても、persisted locale が優先されること
- locale prefix 付き URL は常にその locale のまま表示されること
- 初回訪問で persisted locale がない場合のみ端末言語が効くこと

## Completion Signal

- どの端末でも、サイト上で最後に選んだ言語が優先される
- URL と表示 locale と永続化 locale が矛盾しない
- proxy の挙動を次回以降に再解釈しなくてよい程度に rule / code comments が残っている

## References

- [](/docs/design-docs/rules/next-intlayer-entrypoint-contract.md)
- [](/docs/design-docs/rules/use-proxy-instead-middleware.md)
- [](/docs/design-docs/rules/admin-gate-pattern.md)
- [](/docs/design-docs/rules/dependency-inversion.md)
