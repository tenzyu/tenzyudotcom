# ブラウザ検証

## 実行したもの

`repo-ops/renewal/preview.mjs` でNext devを `127.0.0.1` のOS割当portに起動。評価コピーには `.env*` を含めず、API・本番書込資格情報を渡していない。Chromiumを実際に起動した。

|対象|1440px|390px|
|---|---|---|
|tools|200、画像取得、横幅超過・Base UI console errors|同様|
|homeの `/ja` 入力|redirect loop|redirect loop|
|osu archive|500、API資格情報不足、エラー画面の画像取得|同様|
|portfolio|200、横幅超過・Base UI console errors|同様|

初回 `browser/` は同じpageを使ったため、redirect失敗後のnavigationが次のrouteに混入した。`browser-isolated/` で修正確認後、終了処理と期待URL検査を加えた **`browser-final/`** で再実行した。比較証拠は最終版を使う。requested URL、final URL、HTTP status、console、network失敗を別々に記録する。

分離後のtools / portfolio / osuは、いずれも `/ja/...` 入力から `/en/...` へ遷移した。明示localeの優先という `src/proxy.ts` の説明と整合しない。最終probeは日本語defaultのprefix省略先を期待値として検査する。

## 再現

準備済み・秘密なしevaluationコピーを指定する。元作業ツリーでは起動しない。

```sh
node repo-ops/renewal/preview.mjs \
  "$EVALUATION_REPO" "$NEW_EXTERNAL_EVIDENCE" \
  "$PLAYWRIGHT_STORE/index.mjs" "$CHROMIUM_STORE/bin/chromium"
```

今回のstore path:

- `/nix/store/l1hz4wrvzx6zc5f7zhljhdkh9msq7m54-playwright-core-1.59.1`
- `/nix/store/js1fbcm7ylv92nrjcn32ahmn3786460a-chromium-155.0.8059.84`

これはNix browser起動の実証。repoのflakeにbrowser依存を固定した最終環境ではない。別hostでは対応する固定nixpkgsから取得し直す。

## 未実行

Playwright TestのwebServer設定、フォーム入力・保存、言語切替の網羅、視覚差分、Firefox、WebKit、実機スマホ、nekosm1。現在のprobeは探索・初期障害発見用。導線合格やproduction parityを主張しない。
