---
name: admin-spec
description: 自分専用の、軽くて安全な編集画面を持つ
summary: 公開ページの閲覧体験を崩さず、管理者だけ item 単位で編集できる admin 仕様を定義する。
read_when:
  - admin UX を変更するとき
  - 公開ページに編集 affordance を載せるとき
skip_when:
  - 個別 route の見た目だけを調整するとき
user-invocable: false
---

# Admin Spec

## Goal

自分専用の、軽くて安全な編集機能を持つ。単なる管理画面への遷移だけでなく、公開されている各機能ページにおいて item 単位で直接編集・追加・削除ができる「inline admin affordance」を統合する。さらに、SSG（Static Site Generation）のパフォーマンスを維持したまま、Admin 機能を提供するために `AdminGate` パターンを採用する。

## Requirements

**/login**
- ログイン処理ができる。
- ログイン後は `/editor` (Dashboard) または元のページにリダイレクトする。

**/editor** (Dashboard)
- 全コレクションを俯瞰し、一括編集やシステム状態を確認できる。
- ログアウトできる。

**Integrated Admin View (/{blog,links,notes,pointers,puzzles,recommendations})**
- **SSG維持**: ページ本体は `force-static` で生成され、全ユーザーに対して最速で描画される。
- **AdminGate (Client-side)**: Hydration 後に `/api/auth/me` へ問い合わせ、Adminセッションを確認する。
- **データ分離**: Admin専用の編集データは初期HTMLには含めず、必要な時だけ取得する。
- **局所操作**: 管理者には各 item の三点リーダーを表示し、`編集` と `削除` を dropdown から実行できる。
- **削除確認**: destructive action は確認 UI を必須にする。
- **追加導線**: 追加はページ全体の巨大 form ではなく、軽い投稿 / 作成導線を優先する。
- **即時反映**: 編集後は Server Actions によりデータを更新し、`revalidatePath` で公開ページを最新状態にする。

## Editing Model

- 公開ページでは通常の閲覧 UI をそのまま表示する
- 管理者だけに item 近傍の三点リーダーを表示する
- 編集は item 単位の軽量 UI で行う
- 削除は確認ダイアログまたは確認 popover を経由する
- 大きな admin 専用 form を常設しない
- 専用 editor route は bulk editing や複雑な authoring のために残す

## Collection Policy

- `notes`
  - tweet-like に短文投稿する
  - 追加は primary CTA 1 つから行う
  - 編集項目は最小化する
- `pointers` `puzzles` `recommendations`
  - item を見ながらその場で直す
  - 編集導線は item 単位に閉じる
- `blog`
  - 一覧から専用 editor へ入る
  - authoring comfort を優先し、広い input / textarea を持つ

## Non-goals

- team collaboration
- role-based access control
- invite / org
- rich CMS
- rich login (e.g. google auth)

## UX Direction

- **Contextual Editing**: 「今見ているもの」をそのまま編集できる体験を重視する。
- **No Performance Impact**: 一般ユーザーには Admin 用の JS やデータが送られず、表示速度に影響を与えない。
- スマートフォンからも「気づいた時にすぐ直せる」操作性。
- dropdown と確認 UI を含めても、公開 UI の見通しを壊さない。

## Auth

- self-only (個人利用限定)
- HMAC署名付きセッションCookieによる認証。
- Client-side `fetch` (credentials: 'include') による動的な判定。

## Risks

- **API Latency**: Admin判定からエディタ表示までにネットワーク遅延が発生する（Loaderを表示して対応）。
- **Data Consistency**: SSGされた公開ページと、エディタで fetch した最新データに一時的な差異が生じる可能性がある（エディタ側を canonical とし、保存後に再検証を行う）。
