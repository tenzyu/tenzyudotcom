---
name: admin-spec
description: 自分専用の、軽くて安全な編集画面を持つ
---

# Admin Spec

## Goal

自分専用の、軽くて安全な編集機能を持つ。単なる管理画面への遷移だけでなく、公開されている各機能ページ（Blog, Notes, Links等）において直接編集・追加・削除ができる「Admin View」を統合する。さらに、SSG（Static Site Generation）のパフォーマンスを維持したまま、Admin機能を提供するために「AdminGate (Client-side Verification)」パターンを採用する。

## Requirements

**/login**
- ログイン処理ができる。
- ログイン後は `/editor` (Dashboard) または元のページにリダイレクトする。

**/editor** (Dashboard)
- 全コレクションを俯瞰し、一括編集やシステム状態を確認できる。
- ログアウトできる。

**Deferred Integrated Admin View (/{blog,links,notes,pointers,puzzles,recommendations})**
- **SSG維持**: ページ本体は `force-static` で生成され、全ユーザーに対して最速で描画される。
- **AdminGate (Client-side)**: Hydration 後に `/api/auth/me` へ問い合わせ、Adminセッションを確認する。
- **データ分離**: Admin専用の編集データ（全エントリ、バージョン情報等）は初期HTMLには含まれず、Admin判定成功後に `/api/editor/[collection]` から別途 fetch する。
- **追加/編集/削除**: 既存の専用UIを統合し、その場で操作可能。
- **即時反映**: 編集後は Server Actions によりデータを更新し、`revalidatePath` で公開ページを最新状態にする。

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

## Auth

- self-only (個人利用限定)
- HMAC署名付きセッションCookieによる認証。
- Client-side `fetch` (credentials: 'include') による動的な判定。

## Risks

- **API Latency**: Admin判定からエディタ表示までにネットワーク遅延が発生する（Loaderを表示して対応）。
- **Data Consistency**: SSGされた公開ページと、エディタで fetch した最新データに一時的な差異が生じる可能性がある（エディタ側を canonical とし、保存後に再検証を行う）。
