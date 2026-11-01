# 作業記録

## 2026-10-29 初回

- 添付briefとZIPの全文・starter記録を確認。
- neko5 / NixOS を確認。GitHub developとHEAD一致、ローカルdirty stateと別content repoを確認。
- Git外バックアップ作成。初回復元比較はumaskによるmode差とgroup差で不一致。`tar -xpf` で再復元し、内容・mode一致、group差のみと確認した。
- `renewal/phase01-20261029` worktreeを作成。元作業ツリーのtracked/untracked実体1385件を保全コピーと照合し、変更なし。
- 秘密・キャッシュを除いたevaluationコピーへfrozen install。Nx graphとweb shellを起動。
- Nx経由では子shellのcommand解決に失敗。直接commandに分けて、Web104 tests、UI build、Web lint、準備後typecheckの成功とbuildのdata収集失敗を記録。
- osu-skin-coreとHTML exporterの検証を実行。
- Nix Playwright/ChromiumでPCと390pxの画像・trace取得。probeのnavigation混入を修正して取り直した。
- インベントリ・承認表・設計問題・構成案・harness調査を作成。
- 独立reviewで追加CLIの欠落検出とprocess cleanupの問題を発見し、修正した。追加回帰test込み7件成功。実データの再照合も1385/1385一致。
- reviewerは同じGPT-6 Astra系統。独立contextによるreviewは実施したが、異なるモデルfamilyによるreviewとは主張しない。初期22ログのSHAもreview側で照合一致。
- reviewのSerena起動で新worktreeのproject.ymlが自動migrationされたため、意図しない変更として復元した。元作業ツリーの既存変更は維持した。

このbranchは観測用ツールと記録を追加する。実行可能なCLIとそのtestsが成果物であり、計画だけの提出ではない。原本にある未コミットscrapsはこのbranchへcommitしていない。

実装コミット: `72ee65b` — `feat(renewal): add isolated baseline observation tools`。

記録コミットは `git log --oneline -- docs/renewal` で参照する。rawログ、backup、秘密、browser traceはcommitしない。
