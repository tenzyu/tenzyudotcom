# 合格状況と未検証

|段階|状態|証拠または不足|
|---|---|---|
|Phase 0 ローカル状態と退避|実施|Git refs・dirty state・ignored inventory・独立content repoを保全。tar復元照合|
|Phase 0 再現|実施、正常化は未完了|install、shell、test、lint、typecheck、build失敗、browser失敗を記録|
|Phase 1 インベントリ|初版作成|pruned directoryを除く機械所在一覧と製品/route/packageの評価表。全資産の個別価値・権利評価は未完了|
|Phase 1 削減の承認|未取得|02-decisions の採否待ち|
|Phase 2 設計|初期問題を実コードで確認|全巨大component、全cast、全依存の監査と比較プロトタイプは未実施|
|Phase 3 ハーネス|初期調査と観測CLI追加|旧指示/MCPの退役未実施。モデル成功率・token費用未測定|
|Phase 4 browser|Chromium probe実行、失敗|正式Playwright Testと3 engines、操作導線、比較画面は未完了|
|Phase 5 更新・移行|未着手|neko7・nekosm1・実機スマホ・承認後撤去が必要|

## 偽の完了を防ぐ区別

- `bun test` 成功はbrowser表示成功を意味しない。
- typecheck成功はNextのpage data収集成功を意味しない。
- API資格情報なしでの失敗は、本番でも必ず同じ失敗になるという証明ではない。
- tar内容一致は、別hostで所有groupや外部依存まで一致する証明ではない。
- file所在の機械分類は、利用頻度・削除許可・ライセンスの確認ではない。
- 旧 `.next` があるだけでは最終成功日時を確定できない。最後の成功buildの対応commit・環境は未確認。GitHub CIは未認証で取得できなかった。

## 次に安全に進められる単位

1. locale redirectと横幅超過の原因を分け、再現テスト付きで修正する。
2. Nxの子shell環境差を最小再現する。
3. GitHub書込を使わない明示的snapshot読込を設計し、取得元・時点を持つfixtureでbuildを再現する。
4. osuのデータ出典表を作り、本人確認用の小さな比較画面を作る。

削除、認証変更、移設、公開ページの統合は承認後に実施する。
