---
name: remove-typegen-stub
description: 進行中のタスク：Next 16のtypegenの一時的なスタブファイル作成処理を削除する。
summary: cache-life.d.tsがNext本体側で安定した後にスクリプトを外すトラッキングタスク。
read_when:
  - TypeScript環境やNext.jsのバージョンアップを行う時
skip_when:
  - パッケージの依存関係アップデートを行っていない時
user-invocable: false
---

# Remove Typegen Stub (`cache-life.d.ts`)

`typecheck` 実行時は、Next 16 の `typegen` だけでは `.next/types/cache-life.d.ts` がうまく揃わない（生成されない）ことがあるため、現在はスクリプト側でモックの stub を `touch` して無理やり回避している。

Next.js 本体側での対応が安定し、`typegen` コマンドで適切に生成されるようになったらこのスクリプトと一時的なファイル（fallback）を外し、本来の仕組みのみに依存させる。
