---
tags:
  - obsidian
  - Status/Active
title: 'ノートを取る - Obsidian の使い方を考える'
description: '要は、このノートは、使い方 A と B を合わせて、自分の C を作るという話'
pubDate: 'Sep 29 2024'
heroImage: '/blog-placeholder-about.jpg'
---
- [今の運用方法の整理](#%E4%BB%8A%E3%81%AE%E9%81%8B%E7%94%A8%E6%96%B9%E6%B3%95%E3%81%AE%E6%95%B4%E7%90%86)
	- [このテンプレートについて](#%E3%81%93%E3%81%AE%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6)
		- [Plugins - Core](#plugins---core)
		- [Plugins - Community](#plugins---community)
		- [コンセプト](#%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88)
		- [設計思想](#%E8%A8%AD%E8%A8%88%E6%80%9D%E6%83%B3)
		- [ディレクトリ構成](#%E3%83%87%E3%82%A3%E3%83%AC%E3%82%AF%E3%83%88%E3%83%AA%E6%A7%8B%E6%88%90)
	- [よかったところ](#%E3%82%88%E3%81%8B%E3%81%A3%E3%81%9F%E3%81%A8%E3%81%93%E3%82%8D)
	- [合わなかったところ](#%E5%90%88%E3%82%8F%E3%81%AA%E3%81%8B%E3%81%A3%E3%81%9F%E3%81%A8%E3%81%93%E3%82%8D)
- [解決策のヒントを得る](#%E8%A7%A3%E6%B1%BA%E7%AD%96%E3%81%AE%E3%83%92%E3%83%B3%E3%83%88%E3%82%92%E5%BE%97%E3%82%8B)
	- [別の人の Obsidian を見てみる](#%E5%88%A5%E3%81%AE%E4%BA%BA%E3%81%AE-obsidian-%E3%82%92%E8%A6%8B%E3%81%A6%E3%81%BF%E3%82%8B)
		- [3:50 - Plugins - Core (新登場のみ)](#350---plugins---core-%E6%96%B0%E7%99%BB%E5%A0%B4%E3%81%AE%E3%81%BF)
		- [4:30 - Plugins - Community (新登場のみ)](#430---plugins---community-%E6%96%B0%E7%99%BB%E5%A0%B4%E3%81%AE%E3%81%BF)
		- [7:03 - Organization](#703---organization)
			- [Zettelkasten](#zettelkasten)
				- [Fleeting](#fleeting)
				- [Literature](#literature)
				- [Permanent](#permanent)
			- [Zettelkasten だけでは問題がある](#zettelkasten-%E3%81%A0%E3%81%91%E3%81%A7%E3%81%AF%E5%95%8F%E9%A1%8C%E3%81%8C%E3%81%82%E3%82%8B)
			- [PARA](#para)
				- [Projects](#projects)
				- [Areas](#areas)
				- [Resources](#resources)
				- [Archives](#archives)
		- [9:07 - My Organization System](#907---my-organization-system)
	- [よさそうなところ](#%E3%82%88%E3%81%95%E3%81%9D%E3%81%86%E3%81%AA%E3%81%A8%E3%81%93%E3%82%8D)
	- [合わなさそうなところ](#%E5%90%88%E3%82%8F%E3%81%AA%E3%81%95%E3%81%9D%E3%81%86%E3%81%AA%E3%81%A8%E3%81%93%E3%82%8D)
- [合わなかったところを解決していく](#%E5%90%88%E3%82%8F%E3%81%AA%E3%81%8B%E3%81%A3%E3%81%9F%E3%81%A8%E3%81%93%E3%82%8D%E3%82%92%E8%A7%A3%E6%B1%BA%E3%81%97%E3%81%A6%E3%81%84%E3%81%8F)
	- [記述するときにもっと視覚的情報を減らしたい](#%E8%A8%98%E8%BF%B0%E3%81%99%E3%82%8B%E3%81%A8%E3%81%8D%E3%81%AB%E3%82%82%E3%81%A3%E3%81%A8%E8%A6%96%E8%A6%9A%E7%9A%84%E6%83%85%E5%A0%B1%E3%82%92%E6%B8%9B%E3%82%89%E3%81%97%E3%81%9F%E3%81%84)
	- [Canvas の代わりに Excalidraw を使いたい](#canvas-%E3%81%AE%E4%BB%A3%E3%82%8F%E3%82%8A%E3%81%AB-excalidraw-%E3%82%92%E4%BD%BF%E3%81%84%E3%81%9F%E3%81%84)
	- [バックリンクを見たい](#%E3%83%90%E3%83%83%E3%82%AF%E3%83%AA%E3%83%B3%E3%82%AF%E3%82%92%E8%A6%8B%E3%81%9F%E3%81%84)
	- [外部の情報のインプットに使ったノートは別の場所に置きたい](#%E5%A4%96%E9%83%A8%E3%81%AE%E6%83%85%E5%A0%B1%E3%81%AE%E3%82%A4%E3%83%B3%E3%83%97%E3%83%83%E3%83%88%E3%81%AB%E4%BD%BF%E3%81%A3%E3%81%9F%E3%83%8E%E3%83%BC%E3%83%88%E3%81%AF%E5%88%A5%E3%81%AE%E5%A0%B4%E6%89%80%E3%81%AB%E7%BD%AE%E3%81%8D%E3%81%9F%E3%81%84)
	- [開発・動画制作・ブログのための機能性を持たせたい](#%E9%96%8B%E7%99%BA%E5%8B%95%E7%94%BB%E5%88%B6%E4%BD%9C%E3%83%96%E3%83%AD%E3%82%B0%E3%81%AE%E3%81%9F%E3%82%81%E3%81%AE%E6%A9%9F%E8%83%BD%E6%80%A7%E3%82%92%E6%8C%81%E3%81%9F%E3%81%9B%E3%81%9F%E3%81%84)
	- [深堀りしたノートや自分用のコマンドのメモを保存しておく場所がほしい](#%E6%B7%B1%E5%A0%80%E3%82%8A%E3%81%97%E3%81%9F%E3%83%8E%E3%83%BC%E3%83%88%E3%82%84%E8%87%AA%E5%88%86%E7%94%A8%E3%81%AE%E3%82%B3%E3%83%9E%E3%83%B3%E3%83%89%E3%81%AE%E3%83%A1%E3%83%A2%E3%82%92%E4%BF%9D%E5%AD%98%E3%81%97%E3%81%A6%E3%81%8A%E3%81%8F%E5%A0%B4%E6%89%80%E3%81%8C%E3%81%BB%E3%81%97%E3%81%84)
	- [タグページのシステムがほしい](#%E3%82%BF%E3%82%B0%E3%83%9A%E3%83%BC%E3%82%B8%E3%81%AE%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%81%8C%E3%81%BB%E3%81%97%E3%81%84)
	- [ノートを書くのに直接関係するわけではないファイルは隠ぺいしたい](#%E3%83%8E%E3%83%BC%E3%83%88%E3%82%92%E6%9B%B8%E3%81%8F%E3%81%AE%E3%81%AB%E7%9B%B4%E6%8E%A5%E9%96%A2%E4%BF%82%E3%81%99%E3%82%8B%E3%82%8F%E3%81%91%E3%81%A7%E3%81%AF%E3%81%AA%E3%81%84%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%81%AF%E9%9A%A0%E3%81%BA%E3%81%84%E3%81%97%E3%81%9F%E3%81%84)
	- [年別のディレクトリは年を越すときに作りたい](#%E5%B9%B4%E5%88%A5%E3%81%AE%E3%83%87%E3%82%A3%E3%83%AC%E3%82%AF%E3%83%88%E3%83%AA%E3%81%AF%E5%B9%B4%E3%82%92%E8%B6%8A%E3%81%99%E3%81%A8%E3%81%8D%E3%81%AB%E4%BD%9C%E3%82%8A%E3%81%9F%E3%81%84)
- [余談](#%E4%BD%99%E8%AB%87)
- [今後の運用方法の整理](#%E4%BB%8A%E5%BE%8C%E3%81%AE%E9%81%8B%E7%94%A8%E6%96%B9%E6%B3%95%E3%81%AE%E6%95%B4%E7%90%86)
	- [Plugins - Core](#plugins---core)
	- [Plugins - Community](#plugins---community)
	- [コンセプト](#%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88)
	- [設計思想](#%E8%A8%AD%E8%A8%88%E6%80%9D%E6%83%B3)
	- [ディレクトリ構成](#%E3%83%87%E3%82%A3%E3%83%AC%E3%82%AF%E3%83%88%E3%83%AA%E6%A7%8B%E6%88%90)
	- [タグ構成](#%E3%82%BF%E3%82%B0%E6%A7%8B%E6%88%90)
- [やってみた所感](#%E3%82%84%E3%81%A3%E3%81%A6%E3%81%BF%E3%81%9F%E6%89%80%E6%84%9F)
	- [ちなみに、今後ほしいもの](#%E3%81%A1%E3%81%AA%E3%81%BF%E3%81%AB%E4%BB%8A%E5%BE%8C%E3%81%BB%E3%81%97%E3%81%84%E3%82%82%E3%81%AE)

---

[GitHub - amatzk/obsidian-amatzk-template](https://github.com/amatzk/obsidian-amatzk-template)\
このテンプレートを導入して、 Obsidian を使い始めた。

このテンプレートは、認知負荷がとても低く、Obsidian を試してみるにはとても楽だった。\
ただ、使い始めて5日目になり、困ったことや変えたくなったもの、ほしくなったものが見えてきたので、これからの Obsidian の使い方を考えていきたい。

ちなみに、よく Notion と比較されているが、実際に使って以下のような認識になったので、用途に合わせて両方つかっていく。
- Notion は、リスト(データベース)や共有に向いている
- Obsidian は、個人的なノートや学習に向いている

要は、このノートは、使い方 A と B を合わせて、自分の C を作るという話
# 今の運用方法の整理
## このテンプレートについて
[README.md](https://github.com/amatzk/obsidian-amatzk-template/blob/main/README.md) を一部引用しながら整理していく。\
元の README をすべて読むなら、このセクションはスキップできる。
### Plugins - Core
- [Canvas](https://help.obsidian.md/Plugins/Canvas): ビジュアルノートテイクを提供してくれる
- [Command palette](https://help.obsidian.md/Plugins/Command+palette)
- [Daily notes](https://help.obsidian.md/Plugins/Daily+notes)
- [File explorer](https://help.obsidian.md/Plugins/File+explorer): \*Obsidian内では File と書かれていた
- [Graph view](https://help.obsidian.md/Plugins/Graph+view): 保管庫内のノートの関係を視覚化してくれる
- [Outgoing links](https://help.obsidian.md/Plugins/Outgoing+links)
- [Outline](https://help.obsidian.md/Plugins/Outline)
- [Page preview](https://help.obsidian.md/Plugins/Page+preview): 内部リンクにホバーしているときに cmd/ctrl を押下するとプレビューを表示してくれる
- [Quick switcher](https://help.obsidian.md/Plugins/Quick+switcher)
- [Search](https://help.obsidian.md/Plugins/Search)
- [Workspaces](https://help.obsidian.md/Plugins/Workspaces): 保管庫毎にレイアウトを保存してくれる
### Plugins - Community
- [Auto Link Title](https://github.com/zolrath/obsidian-auto-link-title): 外部サイトのURLペースト時にタイトルを自動で挿入してくれる
- [Calendar](https://github.com/liamcain/obsidian-calendar-plugin)
- [Dataview](https://github.com/blacksmithgu/obsidian-dataview): Markdownファイルを対象としたデータインデックスとクエリ言語を提供してくれる
- [Hider](https://github.com/kepano/obsidian-hider): 特定の UI の非表示ができる
- [Templater](https://github.com/SilentVoid13/Templater)
- [Git](https://github.com/Vinzent03/obsidian-git)
- [Outliner](https://github.com/vslinko/obsidian-outliner): リストの操作を拡張してくれる
- [Minimal Theme Settings](https://github.com/kepano/obsidian-minimal-settings): [Minimal Theme](https://github.com/kepano/obsidian-minimal) の拡張
- [Style Settings](https://github.com/mgmeyers/obsidian-style-settings): Minimal の CSS を変更させてくれる (snippet, theme, pluginの CSS ファイルを、Obsidian の設定からいじらせてくれる)

### コンセプト
ノートを取ることに集中できる環境。 
認知負荷が低くなるように設計した、シンプルな構成のテンプレートです。
迷いを生むような、認知負荷を上げる原因となる機能や、視覚的情報をできるだけ削っています。
### 設計思想
- ネットワーク構造の情報
- 検索による情報アクセス
- シンプルさの維持
	- シンプルなディレクトリ構造
	    - ディレクトリ構造による分類は、不整合が発生しやすいので避ける
	    - 年単位のディレクトリによるファイリング
	    - 日記やノートの新規作成時、自動でファイル配置
	- 必要最低限のタグ
	    - タグ付けによる分類は、認知負荷が大きいので避ける
	    - 使用するタグは、日記 \#diary とノート \#note のみ
	    - 日記やノートの新規作成時、タグの自動付与
- 認知負荷の低減
### ディレクトリ構成
```
00_templates/<ID>_<TemplateName>
01_diary/<YYYY>/<YYYY>-<MM>-<DD>
02_notes/<YYYY>/<NoteName>
03_assets (.md と .canvas 以外のファイル置き場)
04_canvas/<CanvasName>
05_dataview/<ID>_<DataviewName>
```
## よかったところ
- 視覚的情報が少ない（見た目がシンプル）
	- Obsidian を試してみる上で非常に体験が良い
- Graph view が入っている
	- ノードを動かせば周辺のノードも付いてくるため歩きやすい
	- ただし、数が増えたとき、使い物になるかどうかは、あまり想像できていない
- Command palette, File, Outgoing links, Outline, Quick switcher, Search が入っている
	- 保管庫全体が歩きやすい
- 使い方が簡単
	- デイリーノートのテンプレートに Tasks と Timeline がある
	- Timeline に時刻を挿入するためのテンプレートがある
	- Dataview で保管庫全体の未完了の Tasks を拾ってこれるので、雑にタスクを置ける
	- 新規作成したノートは自動で移動してくれるし、自動でテンプレートが適用される
## 合わなかったところ
- 記述するときにもっと視覚的情報を減らしたい
	- 書いている最中、左右のペインを畳んでいるが、毎回やるのはめんどくさい
- Canvas の代わりに Excalidraw を使いたい
	- Excalidraw を前から使っている
	- Excalidraw はオープンソースで、ほぼどこでも使える
	- Canvas は手書きできない
	- Canvas は要素が増えると重たくなる、かなり
- バックリンクを見たい
- 外部の情報のインプットに使ったノートは別の場所に置きたい
- 開発・動画制作・ブログのための機能性を持たせたい
	- トラッキングしたい
	- ステータスを持たせたい
- 深堀りしたノートや自分用のコマンドのメモを保存しておく場所がほしい
- タグページのシステムがほしい
	- タグとページリンクの両取りがしたい
	- Obsidian と相性がよさそうだから
	- tag pages があれば今のところ MoC が必要ないから
	- タグ管理はディレクトリ管理よりも不整合が発生しにくいと思っているから
- ノートを書くのに直接関係するわけではないファイルは隠ぺいしたい
	- templates, assets, dataview のこと
- 年別のディレクトリは年を越すときに作りたい
	- 普段から 2024/ にネストされているとエクスプローラーが圧迫されるのがあまり好きではないから
# 解決策のヒントを得る
## 別の人の Obsidian を見てみる
[Form, Function, & Fun! - My Obsidian Vault Tour \[2024\] - YouTube](https://www.youtube.com/watch?v=rAkerV8rlow)\
とりあえず、今回はこれを参考に考えることにした。\
まず、タイムスタンプをみて、どこを捨てて、どこを知りたいかを見えるようにした。\
このセクション通りにインプットをまとめていこうと思う。
```diff
- 0:00 - Intro & Thank You!
- 0:44 - Appearance Basics
- 1:23 - General Tweaks
- 1:56 - Custom Notebook Themes
- 2:49 - Daily Note Themes
- 3:29 - Video Game Themes
+ 3:50 - Plugins - Core
+ 4:30 - Plugins - Community
+ 7:03 - Organization
+ 7:33 - Zettelkasten
+ 8:29 - PARA
+ 9:07 - My Organization System
- 9:22 - Outro, More Thanks!
```
### 3:50 - Plugins - Core (新登場のみ)
動画に映っていないものについては、[GitHub のソースコード](https://github.com/CyanVoxel/Obsidian-Vault-Template/blob/main/Vault/.obsidian/core-plugins.json) から確認できた。
- [Backlinks](https://help.obsidian.md/Plugins/Backlinks)
- [Tags view](https://help.obsidian.md/Plugins/Tags+view)
- [Properties view](https://help.obsidian.md/Plugins/Properties+view)
- [Note composer](https://help.obsidian.md/Plugins/Note+composer)
- [Slash commands](https://help.obsidian.md/Plugins/Slash+commands)
- [Bookmarks](https://help.obsidian.md/Plugins/Bookmarks)
- [Word count](https://help.obsidian.md/Plugins/Word+count)
- [File Recovery](https://help.obsidian.md/Plugins/File+recovery): markdown のみ対応
- [Unique Note Creator](https://help.obsidian.md/Plugins/Unique+note+creator): 時間を基準にプレフィックスを追加して重複を避けてくれる

`"editor-status"` についてはよくわからなかったが、自分の保管庫で確認してみると同じように要素が存在していたので、何かしらの前提プラグインなのだと思う。
### 4:30 - Plugins - Community (新登場のみ)
- [Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin)
- [Spaced Repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition): Obsidian 上で暗記カードを再現する
- [Advanced Slides](https://github.com/MSzturc/obsidian-advanced-slides): 簡単なスライドのアウトプットを再現する
- [Iconize](https://github.com/FlorianWoelki/obsidian-iconize): フォルダやファイル、ノートのタイトル上などに好きな svg を表示できる
- [Smart Typography](https://github.com/mgmeyers/obsidian-smart-typography): 記号をタイポグラフィに変換する (例: `""` → `“”`)
- [Homepage](https://github.com/mirnovov/obsidian-homepage): 起動時に開くページをカスタマイズできる
- [Recent Files](https://github.com/tgrosinger/recent-files-obsidian)
- [Completr](https://github.com/tth05/obsidian-completr): 自動補完機能、LaTeX 対応
- [Paste URL into selection](https://github.com/denolehov/obsidian-url-into-selection)
- [Text Format](https://github.com/Benature/obsidian-text-format): 大文字小文字・空白改行に関するテキストの壊れたフォーマットを直せる
- [Tag Wrangler](https://github.com/pjeby/tag-wrangler): タグ操作の拡張や、タグページを作れる
- [Settings Search](https://github.com/javalent/settings-search)
- [Importer](https://github.com/obsidianmd/obsidian-importer): Evernote や Notion などから markdown としてインポートできる
- [Settings Search](https://github.com/javalent/settings-search)
### 7:03 - Organization
#### Zettelkasten
##### Fleeting
思いついたことを書く\
単なる思考やアイデア\
例: Is a Hotdog a Sandwich?
##### Literature
インプットした情報を置く\
動画、引用、イメージなど\
自分で作成したものではないメモやリソース\
例: 
```
Dscout - Is a Hotdog a Sandwich
<アンケートだったり見出しだったり>
<画像だったり動画だったり>
```
##### Permanent
fleeting で出発した思考やアイデア・疑問と、\
literature にインプットした情報を組み合わせた記事\
例: Why a  hotdog is a Sandwich and I hate it
#### Zettelkasten だけでは問題がある
単純に何かのメモ、例えばレシピをメモしたいだけの場合はどうする？\
適切なコマンドを手元に置いておきたいときはどうするか？\
取り組んでいるプロジェクトをトラックするにはどうするか？\
ここで PARA system が登場する。
#### PARA
##### Projects
期日や完了日がある短期的なもの
##### Areas
Projects より広範囲な内容で、継続的なもの（期日や完了日はない）\
絵を描く, プログラミング, 料理などの、興味のある分野について考える場所\
例：マイクラ建築したいもの, コンピューターセットアップ, レシピ
##### Resources
Zettelkasten Literature に似ている。\
基本的に自分で作成したものではないが、自分の作品に使用しているもの。少なくともそう解釈しているもの。\
例：Troubleshootings, Sketchbooks vs Notebooks
##### Archives
完了した Projects や、興味のなくなった Areas などを入れる場所
### 9:07 - My Organization System
最終的に投稿者はどのような構造にしたのか？
- 00 - Maps of Content
- 01 - Projects: PARA
- 02 - Areas: PARA
- 03 - Resources: PARA, ZETTEL
- 04 - Permanent: ZETTEL
- 05 - Fleeting: ZETTEL
- 06 - Daily
- 07 - Archives: PARA
- 99 - Meta

MoC: ノートをリンクで繋いだノート\
Daily: デイリーノートの置き場所\
Meta: Obsidian の Vault を機能させるために必要なファイル群。例えばテンプレート、フォント、アタッチメントを入れている。\*ノートに使っているスクショとかもここに入っている

## よさそうなところ
- Backlinks, Slash commands, Excalidraw プラグインを使っている
- Resources がうれしい、外部情報の置き場所になる
- Projects がうれしい、トラッキングしたいノートの行き場所として使いたい
- すべての事柄を網羅できそうだし、自分が困っていたことのほとんどを解決できそう
- 既出のメソッドを使うことで、堅牢な作りにしている
- Meta がうれしい、いろいろ隠せる
## 合わなさそうなところ
- ファイル名にタイムスタンプはいらない
	- タブでファイル名の先頭が見れなくなるのが良くない
	- ソートは標準機能でできる
	- データとしてほしくなったら dataview を使う
- ディレクトリが多すぎる
	- 元が認知負荷の小さいテンプレートだったのもあると思うが、7つは多すぎる
	- アイデアノートとプロジェクトノートで分類するのは良いと思うが、自分の求めているものはこういうディレクトリの構造化ではなさそうなことに気が付いた
- Maps of Content やいくつかのプラグインは別にいらない
	- MoC の代わりにタグページを採用したい
- PARA のディレクトリ関係だけでは不足する
	- 開発に関するノートや、コンテンツ制作に関するノートには、ステータスを持たせたい
- 必要以上に複雑になりそう
# 合わなかったところを解決していく
## 記述するときにもっと視覚的情報を減らしたい
コードエディタで広く知られている Visual Studio Code には、コーディング作業に集中するためにほとんどの UI を取り除く [Zen Mode](https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_zen-mode) という機能がある。\
今回は偶然それを知っていたので、Obsidian にも禅モードのプラグイン等がないか調べたらあったので、それを使用する。\
[Zen](https://github.com/Maxymillion/zen)
## Canvas の代わりに Excalidraw を使いたい
Canvas を無効化して、`04_canvas` を削除し、[Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin) をインストール・有効化した。
## バックリンクを見たい
[Backlinks](https://help.obsidian.md/Plugins/Backlinks) を有効化した。
## 外部の情報のインプットに使ったノートは別の場所に置きたい
`resources` ディレクトリを作り、関係するノートをすべて移動した。
## 開発・動画制作・ブログのための機能性を持たせたい
以下の意味で、`releases` ディレクトリを作り、関係するノートをすべて移動した。
- Permanent のうち外に公開したいもの
- Projects
- Areas のうち外に公開したいもの

今回は、トラッキングしやすいように以下のようにディレクトリを切らせていただいた。\
```
releases/
	blog-content/
	blog-development/
	some-tool-dev/
	video-creation/
```

さらに、ステータスを持たせたいので、タグを追加していく。\
今回は偶然 開発者向けのノートアプリ InkDrop を知っていたので、真似させていただいた。\
[Note statuses - Inkdrop User Manual](https://docs.inkdrop.app/reference/note-statuses)
- **Active**: You’re currently working on this task
- **On Hold**: You’ve paused work on this task.
- **Completed**: You’ve finished this task.
- **Dropped**: You’re no longer pursuing this task.

おそらく、`tags` プロパティとは別に `status` プロパティを用意して、one select なりサイドバーに Status 別で表示なりできるだろうが、今回は面倒だったのでタグでやることにした。\
これらのタグは `Status/On-Hold` のようにグルーピングしておいた。
## 深堀りしたノートや自分用のコマンドのメモを保存しておく場所がほしい
以下の意味で、`keep` ディレクトリを作り、関係するノートをすべて移動した。
- Permanent のうち外に公開しないもの
- Areas のうち外に公開しないもの

今回は、趣味のスコープでノートをまとめやすいように以下のようにディレクトリを切らせていただいた。
```
keep/
	as-content-creator/
	as-live-streamer/
	english-study/
```
○○で使えそうなXX や、コマンドのメモは `keep` 直下に置いた。\
Areas に置かれそうだったノートはディレクトリを切って移動した。
## タグページのシステムがほしい
今のところ納得のいく形で再現できなかったので、[TagFolder](https://github.com/vrtmrz/obsidian-tagfolder) というプラグインを使うことで妥協した。
## ノートを書くのに直接関係するわけではないファイルは隠ぺいしたい
`meta` ディレクトリを作成して、その中に移動した。\
このとき、プラグインとアタッチメントの設定も直した方が良い。\
影響するプラグインは、Daily notes と Templater
## 年別のディレクトリは年を越すときに作りたい
Daily notes プラグインの設定と notes のテンプレートを修正して、これまでのファイルをすべて移動した。\
ただ、メタディレクトリに移動した assets は、見ることがないので、年別のディレクトリは残すことにした。
# 余談
今後の運用方法を考えている最中、休憩でプラグインを探していて、いくつか新しく入れたプラグインがあるので紹介\
見た動画はこちら\
[Most USEFUL Obsidian Plugins I Actually Use - YouTube](https://youtu.be/cBm95iCcX2E)
- [Plugin Update Tracker](https://github.com/swar8080/obsidian-plugin-update-tracker): アップデートする前にどんな更新なのかを確認できる
- [Note Refactor](https://github.com/lynchjames/note-refactor-obsidian): 伸びてきたノートを分割することができる
- [Table of Contents](https://github.com/hipstersmoothie/obsidian-plugin-toc): Headings に合わせて目次を作ることができる

それと、カーソルの位置が毎回リセットされるのが嫌だったので、[Remember Cursor Position](https://github.com/dy-sh/obsidian-remember-cursor-position) をインストール・有効化した。
# 今後の運用方法の整理
## Plugins - Core
- [Backlinks](https://help.obsidian.md/Plugins/Backlinks) 
- [Command palette](https://help.obsidian.md/Plugins/Command+palette)
- [Daily notes](https://help.obsidian.md/Plugins/Daily+notes)
- [File explorer](https://help.obsidian.md/Plugins/File+explorer)
- [Graph view](https://help.obsidian.md/Plugins/Graph+view)
- [Outgoing links](https://help.obsidian.md/Plugins/Outgoing+links)
- [Outline](https://help.obsidian.md/Plugins/Outline)
- [Page preview](https://help.obsidian.md/Plugins/Page+preview)
- [Quick switcher](https://help.obsidian.md/Plugins/Quick+switcher)
- [Search](https://help.obsidian.md/Plugins/Search)
- [Slash commands](https://help.obsidian.md/Plugins/Slash+commands)
- [Workspaces](https://help.obsidian.md/Plugins/Workspaces)
## Plugins - Community
- [Auto Link Title](https://github.com/zolrath/obsidian-auto-link-title)
- [Calendar](https://github.com/liamcain/obsidian-calendar-plugin)
- [Dataview](https://github.com/blacksmithgu/obsidian-dataview)
- [Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin)
- [Git](https://github.com/Vinzent03/obsidian-git)
- [Hider](https://github.com/kepano/obsidian-hider)
- [Minimal Theme Settings](https://github.com/kepano/obsidian-minimal-settings)
- [Note Refactor](https://github.com/lynchjames/note-refactor-obsidian)
- [Outliner](https://github.com/vslinko/obsidian-outliner)
- [Paste URL into selection](https://github.com/denolehov/obsidian-url-into-selection)
- [Plugin Update Tracker](https://github.com/swar8080/obsidian-plugin-update-tracker)
- [Recent Files](https://github.com/tgrosinger/recent-files-obsidian)
- [Remember Cursor Position](https://github.com/dy-sh/obsidian-remember-cursor-position)
- [Settings Search](https://github.com/javalent/settings-search)
- [Style Settings](https://github.com/mgmeyers/obsidian-style-settings)
- [Table of Contents](https://github.com/hipstersmoothie/obsidian-plugin-toc)
- [TagFolder](https://github.com/vrtmrz/obsidian-tagfolder)
- [Templater](https://github.com/SilentVoid13/Templater)
- [Zen](https://github.com/Maxymillion/zen)
## コンセプト
よりクリエイティブな発想・活動を支えるための環境。\
シンプルかつ効率的に情報を整理し、ノートテイキングに集中できる構成を目指す。\
外部からのインプットや個人のアイデアを組み合わせ、制作活動やプロジェクト開発を管理しながら、自分のペースで創造的な活動に没頭できるようデザインされたシステム。
## 設計思想
- **より集中できるエディタへ**: Zen を採用して、ノート作成中の余計な情報や機能を排除することで、作業に集中しやすいように。
- **より追跡しやすいプロジェクトノート**: ステータス (#Status/\*) を採用し、開発やコンテンツ制作に関係したノートはディレクトリにまとめ、追跡しやすい環境に。
- **より柔軟な分類**: ディレクトリ構造に縛られないタグを使っていくことで、情報の整理を柔軟に行う。TagFolder を採用して直感的なナビゲーションを用意。
- **公私の分類**: 公開するコンテンツと個人的なメモや深掘りしたノートをディレクトリで分類する。わかりやすく公開・非公開の領域を区別。
## ディレクトリ構成
ファイルや子のディレクトリも入れながら紹介
```
05 - daily/
	2023/2023-MM-DD.md
	2024-MM-DD.md
10 - fleeting/
	2023/hogehoge.md
	fugafuga.md
15 - resources/
	troubleshoothings/
		MS Community - Optimize-VHD not found.md
	tag wrangler - tag pages.md
20 - keep/
	english-study/
		idioms i could actually use.md
	ffmpeg - convert VFR to CFR.md
25 - releases/
	blog-content/
		how-to-use-obsidian.md
	blog-development/
		fix hogehoge.md
		feat fugafuga.md
99 - meta/
	attachments/YYYY/hogehoge.png
	plugins/pininfo
	templates/
	all-tasks.md
```
\*`plugins/pininfo` は TagFolder のピン留め設定の保存先がなぜか `.obsidian` の管轄ではなかったので作成
## タグ構成
すべてをディレクトリで構造化すると破綻するので、frontmatter で好き勝手にタグを持たせて良いことにした。\
タグを利用した保管庫の探索は現状 TagFolder を使っている。\
`releases` ではそれに加えて以下のタグでステータスを持たせている。
```
#Status/
	Active
	On-Hold
	Completed
	Dropped
```
# やってみた所感
個人的には十分満足\
こういう知識のマネジメントはあまり丁寧にやってこないで、結局 雲散霧消していくばかりだったので、今度こそは蓄積できるだろうと思うと楽しみ。\
当初に想像していたよりもシンプルな構成で、今今なんとかしたかったことはだいたい解決して、今後も長く使っていけそう。\
実際にしばらく運用がうまくいったら、冒頭でも紹介していたテンプレートのように、自分もテンプレートとして共有していきたい。
## ちなみに、今後ほしいもの
- タグページシステム
- Recent files に InkDrop のようなプレビュー機能
- ページ下部に Scrapbox のような関連リンクを表示してくれる機能
- アタッチメントや内部リンク、Table of Contents(見出し) などをいい感じに解決しつつ、ブログでそのまま使えるようにアウトプットしてくれる機能
- ブログ用の記事で、編集中の改行と出力後の改行を合わせられるように Hard line break を自動でいい感じにしてくれる機能
	- 今は手動で `\↵` を入力している

\
\
ありがとうございました。