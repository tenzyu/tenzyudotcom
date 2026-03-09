---
name: vercel-editorial-storage
description: 現在のeditorialストレージバックエンドとしてVercel Blobを選択したケース記録。
summary: Vercel上の自分専用のeditorialデータについて、レコード全体の検証と置き換えはKVスタイルのプリミティブよりもオブジェクトストレージに適しているため、プライベートBlobが現在の第一選択ストレージである。
read_when:
  - editorialコレクションのための代替ストレージバックエンドを評価する時
  - ストレージインターフェースがJSON/MDXレコードをどのように読み取り、置き換え、構造化するかを変更する時
skip_when:
  - 公開向けの一般的なファイルアップロード（画像など）を実装する時
body_refs:
  - ./vercel-editorial-storage/body.md
user-invocable: false
---

./vercel-editorial-storage/body.md
