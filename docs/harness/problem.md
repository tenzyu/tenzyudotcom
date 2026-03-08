- route/page 以外の面の owner がまだ未定義です。route.ts、Server Actions、webhook、cron、queue、
  worker、DB migration、middleware をどこに置くかは今も gap です。
- feature の粒度定義がまだ弱いです。page feature、business capability、workflow 単位の切り分けが
  横断機能で揉めます。
- `shared feature` / `src/components/site-ui` / `src/components/shell` の境界がまだ揺れます。
  検索モーダル、通知センター、コマンドパレットのような「全体に出るUI」の owner が曖昧です。
- `promote only after reuse is real` は schema / policy / permission model には遅すぎる場面があり、
  例外条件をもう一段はっきりさせる余地があります。
- route を持たない runtime に対して、最初の問いが「1 route 専用か」で始まる点はまだ弱いです。
- ops runtime を未導入のまま保留する条件と、導入時の最初の owner 決定手順がまだ足りません。
- migration 規律はまだ弱いです。互換層、deprecation、途中状態の扱いが十分に書かれていません。
- この harness を repo-specific に保つのか、汎用思想としても通したいのかはまだ完全には定まっていません。
