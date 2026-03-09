---
name: harness-guard
description: harness主導の作業のための安全性と実行の制約。
read_when:
  - リスクのある編集を行う時
  - 構造的なリファクタリング、レビュー、または最終報告を行う前
user-invocable: false
---

# Guard

この文書は guard rule の正本である。
LLM 向けの短い要約は `docs/GUARDRAILS.md` を使う。

## Purpose

Guard は、入力と出力、そして実行過程を監視する層である。
壊しやすい操作を狭い安全域に閉じ込めるためにある。

## When to Apply

この文書を読むのは次のとき。

- 変更を実行する前に unsafe な操作がないか確認したい
- 大きな refactor や directory 再編を始める
- review や監査として問題点を洗い出す
- 最終報告で何を明示すべきか確認したい

## Input Guard

エージェントは依頼を受けたら、最初に次の分類を行う。

- 構造変更か
- feature 実装か
- content 更新か
- pure logic 修正か
- config / policy 修正か
- performance / bundle 改善か
- dependency / tooling 更新か
- ops / runtime 境界の変更か
- security / outbound boundary の変更か
- 調査 / review か

そして以下を必ず見分ける。

- 変更対象が route-local か shared か
- request が `docs/design-docs/core-beliefs.md` や `docs/design-docs/structure-rules.md` の原則から外れていないか
- 依頼が current scope を越えていないか
- 一時データと恒久データが混ざっていないか
- unsafe な操作が必要か
- user の価値観や運用思想を聞かないと structural decision を切れないか
- 新しい noun / route / workflow / runtime を持ち込むが、
  その判断基準が harness にまだないか

## Workflow

Guard は次の順で使う。

1. request を分類する
2. slow down 条件がないか確認する
3. user の思想確認が必要なら、短いインタビューを先に行う
4. 未設計の新機能なら、実装をエミュレートして詰まりどころと分岐を先に列挙する
5. その判断基準が harness にないなら、実装より先に docs 更新を優先する
6. 既存コードの慣性を止める必要があるなら、その宣言は harness に残す
7. 具体的な失敗、成功条件、検討分岐は `docs/exec-plans/completed/*.md` に作業ログとして残す
8. `docs/exec-plans/completed` を full spec や rule の置き場にしない
9. 実行中は structure / mutation / tool boundary を監視する
10. harness gap が見えたら docs 更新か follow-up debt 化を判断する
11. docs を更新した場合は、rule のまとまり方と思想競合を review する
12. 最終報告で structural decision と未検証事項を明示する

### Refuse / Slow Down Conditions

次の条件では、そのまま進めずに一段階判断を遅くする。

- 既存の shared 層を route-private が逆参照している
- identifiers を翻訳辞書に入れようとしている
- `src/lib` に UI や route-only helper を置こうとしている
- route convention file が transform や metadata assembly を直接抱えている
- feature を差し置いて syntax-first の bucket を増やそうとしている
- reuse が実証される前に過剰な抽象化や promote をしようとしている
- current code に合わせるために harness の原則を弱めようとしている
- docs を読んでも placement 候補が複数残り、どれを第一候補にするか決めきれない
- locale UX や公開 affordance の方針が user の意図次第で分かれる
- destructive な git / filesystem 操作が必要
- 新機能の goal / operating model / boundary policy が未設計
- 既存コードに引っ張られたくないのに、その停止宣言が harness に存在しない

## Execution Guard

エージェントは実行中に以下を守る。

### Structural Guard

- file placement は `docs/design-docs/structure-rules.md` を正本として使う
- 現状構造が target とズレる場合、可能なら変更単位の中で target へ一歩寄せる
- directory 再編は workflow 改善の根拠があるときだけ行う
- `page.tsx`, `layout.tsx`, `generateMetadata`, `generateStaticParams` は route entry として薄く保つ
- route entry で見つけた transform / SEO / editorial shaping は `_features/lib` または feature component へ寄せる

### Mutation Guard

- unrelated changes を巻き戻さない
- user changes を消さない
- 既存構造を壊すときは、先に移動先を作る
- rename 後に import を一括で確認する

### Tool Boundary Guard

- Intlayer の利用境界は `docs/design-docs/tools-boundary.md` と `docs/design-docs/structure-rules.md` に従う
- hidden prompt scaffolding や model-specific な convenience layer を増やさない
- internal barrel import を増やさない
- `src/lib/editorial` を canonical source の代わりに使わない
- `*.content.ts` に author-curated record や fetch input を押し込まない
- `*.contract.ts` で view model assembly まで済ませない
- `*.assemble.ts` で raw input の validate をやり直さない

### Outbound Boundary Guard

- external web URL は raw string のまま site-wide primitive や shared helper に流し込まない
  - `http(s)` の parse / normalize を `*.contract.ts` で通す
- `ExternalLink` は validated な `http(s)` 用 primitive として扱う
  - custom scheme や app deep link を混ぜない
- `iframe src` は feature-local の builder で組み立てる
  - component 本体で host や query string を直書きしない
- `window.open` を使うなら `noopener,noreferrer` を付ける
- locale 配下の redirect fallback は locale を落とさない
- remote script を route/layout に差し込むなら、dev でも default-on にしない
  - env contract で explicit opt-in にする

### UX / Content / Accessibility Guard

- locale path を持つ route では、visible IA を unlocalized data のまま公開しない
  - locale-neutral な固有名詞だけが data に残るのは許容する
- `prefix-no-default` routing では、default locale の internal route を強制 prefix 付きで組み立てない
  - locale-aware link / redirect は framework helper で生成する
- site が複数の primary route を持つなら、home だけを discovery の唯一入口にしない
  - shell か nav で主要導線を最低限 expose する
- primary navigation や primary action に dead affordance を置かない
  - disabled item を出すなら、user-facing な理由と代替導線が必要
- tab / filter / sort など、見える状態を切り替える UI は shareable なら URL へ乗せる
- site shell では main landmark への到達性を確保する
  - skip link
  - utility nav の label
  - sticky header と競合しない focus / jump 導線

### Editorial Revalidation Guard

- public editorial route の freshness は、原則として request-time dynamic ではなく write-side の明示的な revalidation で反映する
- revalidation の owner は対象 feature か editorial workflow owner の近くに置き、route entry や ad-hoc helper に散らさない
- affected path、locale、trigger 条件、freshness source of truth の具体設計は関連 task の `docs/exec-plans/completed/*.md` に作業ログとして残し、ここには再利用できる最小ルールだけを残す
- dynamic segment や tag taxonomy が未整理な段階で rule を広げない
  - まず関連 task の active/completed plan に具体策を書く

### Editorial Planning Trigger

editorial workflow を実装する前に、次が未設計なら短いインタビューを先に行う。

- route placement
- primary nav exposure
- source shape
- auth model
- storage model
- publish / draft semantics
- fallback / failure policy
- auto-enrichment policy

### Verification Guard

変更に応じて、実行可能な verification を最低 1 つは通す。

- runtime / route / data flow を触ったら `build`
- formatter / linter / config / import graph を触ったら、まず non-mutating な `lint` を使う
- rewrite を伴う `lint:fix` や `format` は、意図して tree を直すときだけ使う
- test が存在する repo では、影響範囲に応じた test を通す
- caching / revalidate / fetch timeout を触ったら、magic number のまま散っていないか確認する
- external SDK wrapper や route-local loader を触ったら、request 内 dedupe と error boundary が崩れていないか確認する

test を増やす価値が高いのは次のとき。

- parse / normalize / validate をしている
- branch が多い pure logic がある
- metadata / structured data / contract を組み立てている
- bug を再発防止したい

逆に、静的 page の見た目だけを snapshot で広く固定するのは慎重にする。
保守コストに対して得が小さいなら、build と non-mutating lint を優先する。

repo に test が未整備なら、それ自体を gap として報告する。
ただし test 不在を理由に build/lint まで省略しない。

repo が `nix develop -c` を標準入口にしているなら、
verification でもその入口を優先して環境差異を減らす。

環境差異で command が失敗する場合は、黙って諦めない。

- NixOS など platform 固有の実行問題か
- tool binary の配布形態が原因か
- repo-local に吸収できるか

を切り分け、回避策を docs か repo に還元する。

ops runtime がまだ repo に存在しない場合は、
そのためだけに test/ops の枠を増やさない。
必要が現れた時点で owner を定義する。

### Harness Gap Guard

次の両方を満たしたら、harness gap として扱う。

- 既存 docs を読んでも placement / boundary の判断に追加推論が必要だった
- その追加推論が他の task でも再利用されそうである

- 同じ task で安全に更新できるなら `docs/design-docs` か `docs/workflows` を直す
- 直さない場合は、最終報告で不足している rule を具体的に列挙する
- 「今回はこうしたが docs にはない」を曖昧なまま残さない

docs を更新した後は、更新内容そのものを review する。

- LLM がその rule を 1 回の routing で読める粒度か
- 既存の `docs/design-docs/*.md`、`docs/GUARDRAILS.md`、`docs/ARCHITECTURE.md` と競合していないか
- 同じ概念が別名で増えていないか
- `AGENTS.md` から辿れる位置に置かれているか
- 実装前後の失敗条件と成功条件が、必要なら `docs/exec-plans/completed/*.md` に残っているか

## Output Guard

最終出力では、次を明示する。

- 何を promote したか
- 何を demote したか
- どの structural decision を採ったか
- 何を harness に宣言し、何を `cases` に逃がしたか
- まだ検証していないことは何か

出力で避けるべきこと:

- 実際にはしていない build / test をしたように書く
- 曖昧な「整理しました」で終える
- file placement の根拠を省く

## Negative Capabilities

この repo でエージェントにさせないこと:

- route-private を習慣的に shared へ押し上げること
- 開発者の探索動線より syntax bucket の整然さを優先すること
- 既存配置を理由に target architecture を空文化させること
- repo 全体の思想に反する convenience layer を追加すること

## Lightweight, Replaceable Design

Guard は model-specific であってはならない。

必要なのは:

- path-based constraints
- ownership-based constraints
- side-effect awareness
- honesty in reporting

不要なのは:

- 特定モデル向けの長大な振る舞いチューニング
- hidden chain-of-thought 前提の安全装置
