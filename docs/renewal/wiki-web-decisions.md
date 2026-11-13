# Web の判断と再発防止

2026-11-13 時点。新しい証拠が見つかったら、コードとテストに照らしてこのページを訂正する。ここには、次の作業で再調査しやすい判断だけを残す。

## 記事の MDX コンポーネント

ブログ記事「a stray LLM-harness engineer を名乗らせていただく〜ｗ」は、本文で `OtakuAside` と `KoFiLink` を使う。`KoFiLink` がブログの MDX コンポーネント一覧にない状態では、記事の描画時に `Expected component KoFiLink to be defined` が発生する。コンパイル時ではなく React の描画時に失敗するため、MDX の評価が成功しただけでは記事を表示できる証拠にならない。

`product/apps/web/src/app/[locale]/(main)/blog/_features/mdx-components.tsx` に `KoFiLink` を登録した。`custom-mdx.test.tsx` は実際の描画とリンク先を確認する。`repo-ops/renewal/browser-acceptance.spec.ts` は該当記事の本文をブラウザで確認する。修正は `c0184f7`。

## 言語切り替え

日本語は URL にプレフィックスを付けない既定言語だが、保存済みの英語 Cookie があると、クライアントの Cookie 書き込み完了前に移動した場合、日本語選択後も英語に戻る。Cookie 書き込みを遅延させたブラウザテストで、修正前に `lang="en"` が残ることを再現した。

日本語選択時は明示的な `/ja` を経由する。`product/apps/web/src/proxy.ts` が日本語の選択を Cookie に保存してから正規 URL にリダイレクトする。遅延ケースと往復切り替えは `repo-ops/renewal/browser-acceptance.spec.ts` が対象。修正は `475f0bc`。

## osu! の記事と設定図

設定図の `bg-visualization-*` は色名が Tailwind に登録されていないと透明になる。共有 UI のビルド済み CSS 側に色名を置くだけでは、Web アプリのクラスが生成されなかった。色名とアプリ固有の値は `product/apps/web/src/app/globals.css` にある。

旧 `osu/legacy.css` は図だけでなくページ内の共通テーマ変数も上書きしていたため、他ページとの色の差になっていた。削除後、共通テーマを使う。ブラウザで図の色とテーマ変数を確認した。修正は `475f0bc`。

記事本文に書くコンポーネントは、本文とブログの登録一覧の両方を直す必要がある。上記の `KoFiLink` はこの見落としで発生した。現行の記事では `OtakuAside` と `KoFiLink` の両方が使われている。

ポートフォリオは `neko5`（dynabook BJ65/FS、A6BJFSFAL511）、`neko7`（この開発環境、開発サーバー）、`nekosm1`（OPPO Reno9 A、CPH2523）の三機構成で、Tailscale 経由で接続する。旧 neko3 と neko6 は現状の構成ではない。修正は `7917a83`。

2026 年の Wacom CTL-472 は X=127、Y=22、回転 180 度、カスタムファームウェアで 400 Hz。2025 年までは X=83.06、Y=26.43。年代を分けたのは、共有オブジェクトを変更すると旧設定まで変わるため。値は `osu/_features/osu/settings.data.ts`、年代ごとの表示は `settings.test.tsx` とブラウザテストにある。修正は `7917a83`。

## 検証環境での制約

実リポジトリの dotenv と外部コンテンツへの書き込みは扱わない。Next.js など dotenv を読む可能性があるツールは dotenv を除外した隔離コピーで使った。詳細な境界はルートの `AGENTS.md` が正本。

2026-11-13 の隔離コピーでは、Nx 経由の子プロセスが `bun` と `tsc` を見つけられず失敗した。一方、Nix 開発環境内で Web のコマンドを直接実行すると、テスト、型チェック、Biome lint は通った。原因は未確定なので、Nx 自体の恒久的な欠陥とは断定しない。

同日の別のビルドはコンパイルと型チェックを通過した後、静的ページ生成の GitHub コンテンツ取得で HTTP 403 を受けて失敗した。認証情報なしのブラウザ検証では記事の取得に 404 が出たため、最後の該当記事テストは GitHub の公開 raw ファイルを読み取り専用で返す一時アダプターを使った。実コンテンツを更新したり、デプロイ環境を検証したりはしていない。

## 記憶の扱い

このページは一次資料の代替ではない。ユーザーの訂正、コード、実際のテスト結果を優先する。古い `docs/renewal` の引き継ぎは当時の状態であり、現状とは限らない。Anthropic の [The components of agent memory](https://www.anthropic.com/research/components-of-agent-memory) は、記憶を元の記録と照合して訂正し、必要な知識を小さく保つことを説明している。資料を網羅的に複製することは目的ではない。
