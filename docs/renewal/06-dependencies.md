# 環境と依存の確認

|対象|確認値|根拠・判断|
|---|---|---|
|host|neko5、Linux x86_64、NixOS kernel 7.3.0|実行環境で確認|
|Nix|2.34.9|`nix --version`|
|Bun|実行1.3.13、packageManager/CIは1.3.10|再現条件の差。frozen installは成功|
|Node|22.22.3|`node --version`|
|Nx|22.7.2|root packageとfrozen install|
|Next|16.2.6|build banner|
|TypeScript|6.0.3|root catalog|
|React|catalog ^19.2.6|lockで解決。今回更新なし|
|Intlayer|build banner 8.10.0|catalog範囲だけを実行versionとみなさない|
|Rust / Cargo|1.95.0 / 1.95.0|実行command|
|Tauri|Rust manifest major 2、JS catalog ^2.11.0 / CLI ^2.11.2|実際のnative buildは未実行|
|Playwright / Chromium|1.59.1 / 155.0.8059.84|一時Nix storeに取得しbrowser probe実行|

`flake.lock` はローカルで変更されている。nixpkgs rev `a799d3e3886da994fa307f817a6bc705ae538eeb`、Serena rev `b5b9cc4ffc8144cef4064dee09433eb592cfebdc`。既存の変更を採用・破棄せず保存した。

## 観測から言えること

- `nix develop .#web --no-write-lock-file --command bun --version` 成功。Web専用shellは既に存在する。
- `bun install --frozen-lockfile --ignore-scripts` 成功。install scriptを使わなくても今回のUI/Webコンパイルは進んだ。全native toolの利用可能性は証明していない。
- UIのdistを準備しないWeb型検査は多数のmodule not foundになる。これは未生成の依存とアプリの型不具合を分けて扱う必要がある。
- Next buildはコンパイルと型検査を通る。stack刷新の必要性をこの失敗だけから結論づけられない。
- Nx経由commandの子shell PATH失敗は未解決。direct script成功からNx廃止の優位性は証明できない。

依存の一括更新、lockfile再生成、脆弱性解消済みとの主張は行っていない。セキュリティadvisoryとEOLの網羅確認はPhase 5で別途必要。
