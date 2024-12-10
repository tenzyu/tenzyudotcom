---
title: 'nix home-manager で dotfiles を管理する'
description: '今回のアプローチ：nix home-manager を使う'
pubDate: 'dec 10 2024'
heroImage: '/blog-placeholder-about.jpg'
---

## はじまり
Linux を使うシーンって結構あるし、ユーザー環境を (dotfiles) を stow とか chezmoi とかでいい感じに共有したいな、としばらく試しながら、stow も chezmoi も正直スッキリしない・・・と感じていた。

そこそこ作業 (Linux Ricing) しながらも、スッキリピッタリな解決策がないものかと思っていたら、たまたま YouTube で [github:nix-community/home-manager](https://github.com/nix-community/home-manager) を紹介している動画と出会った。

実はもともと、NixOS というユーザーの環境からシステムワイドの設定まですべてを記述してしまおうという Distro がある、と噂を聞いていた。\
それを聞いたのは結構古い記憶だったから、あまり気にしていなかったのだけれど、まさに今、解決したい問題は NixOS のコンセプト [^1] で解決できることに気が付いた。

## Home-manager を試そうと思った理由

> Manage a user environment using Nix - github:nix-community/home-manager

Q. ではあなたはなぜ NixOS ではなくて home-manager を試そうと思ったの？
1. 私がアクセスできる Linux を全て NixOS にするのは（私にとって）規模が大きいので、まずは手元のユーザー環境を Nix で記述することで、軽く学んでいきたかった。
2. home-manager は、NixOS の上でも使えるらしく、home-manager 管轄のコンフィグは dotfiles としての役割を残したまま移行できそうだったから。（すべてを NixOS の設定に寄せる必要はないし、home-manager の管理なら他の UNIX 系システムで使えるように見える）

## やっていく
インストールなどは公式ドキュメントに則って行う。\
Arch は pacman でも Nix を入れられるのだが、私は公式のスクリプトを使って入れた。\
nixpkgs は stable の 24.11 を使うことにする。深いワケは今のところない。

基本的には やりたいこと→参考資料→適用→トラブルシューティング の順で書いていこうと思う、あなたにとって気になる見出し・参考になる部分があれば嬉しい。

### Nix Command と Nix Flakes を使う
[Nix command - NixOS Wiki](https://wiki.nixos.org/wiki/Nix_command)\
[Flakes - NixOS Wiki](https://wiki.nixos.org/wiki/Flakes)

私が暇なときにみていた動画では、だいたいサブコマンドや `flake.nix` を使っていたのだが、そのサブコマンドを使うのは nix command というらしい。`flake.nix` は Nix flakes の機能で使うファイルらしい。\
これらは experimental な機能らしいが、これから nix command や Nix flakes の時代になる予感がするので、使っていきたい。

有効化するには、
1. [Enable flakes temporarily](https://wiki.nixos.org/wiki/Flakes#Enable_flakes_temporarily)
2. [Enable flakes permanently in NixOS](https://wiki.nixos.org/wiki/Flakes#Enable_flakes_permanently_in_NixOS)
3. [Other Distros, with Home-Manager](https://wiki.nixos.org/wiki/Flakes#Other_Distros,_with_Home-Manager)
4. [Other Distros, without Home-Manager](https://wiki.nixos.org/wiki/Flakes#Other_Distros,_without_Home-Manager)

とあったので、１と３を活用する

### Home Manager で Nix Command と Nix Flakes を使う
[sec-flakes-prerequisites | home-manager index.xhtml](https://nix-community.github.io/home-manager/index.xhtml#sec-flakes-prerequisites)\
[nix.settings | Home Manager - Option Search](https://home-manager-options.extranix.com/?query=nix.settings&release=release-24.05)\
[nix.package | Home Manager - Option Search](https://home-manager-options.extranix.com/?query=nix.package&release=release-24.05)

[Other Distros, with Home-Manager](https://wiki.nixos.org/wiki/Flakes#Other_Distros,_with_Home-Manager) で紹介されているが、少しだけ記述を変えなければいけないので一例を載せておく

in `home.nix`
```nix
  nix = {
    package = pkgs.nix;
    settings = {
      experimental-features = [ "nix-command" "flakes" ];
    };
  };
```

[home-manager/modules/misc/nix.nix at 2f23fa308a7c067e52dfcc30a0758f47043ec176 · nix-community/home-manager · GitHub](https://github.com/nix-community/home-manager/blob/2f23fa308a7c067e52dfcc30a0758f47043ec176/modules/misc/nix.nix#L222)\
どうやら `nix.settings` か `nix.extraOptions` が空ではないとき、`nix.package` が必要らしいので入れてあげる。

### .nixdefexpr がホーム直下にあるのが気になる
[[xdg-ninja]] によると、
> \[nix]: /home/tenzyu/.nix-defexpr
	New nix command line interface supports XDG Base Directory but Old Commands will still create these directories.                                                 
	To use the XDG spec with the old command line, add to  /etc/nix/nix.conf :      
	`use-xdg-base-directories = true`                                                
	You also have to manually move the the file to XDG_STATE_HOME:                  
	`mv "$HOME/.nix-defexpr" "$XDG_STATE_HOME/nix/defexpr"`                          
	See the Manual: https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-use-xdg-base-directories https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-use-xdg-base-directories                                                        
	
ということなので、やってやる。

### モジュール化したい
[Modularize Your NixOS Configuration | NixOS & Flakes Book](https://nixos-and-flakes.thiscute.world/nixos-with-flakes/modularize-the-configuration)

home-manager を選んだほとんどの理由はここにあるのだが、私はコンフィグをモジュール化したい。具体的にやりたいことは、プログラム単位、ユーザー単位で記述して、必要なものだけ取り出すのを簡単にしたい。

```
├── flake.nix
└── user
    ├── profiles
    │   ├── common.nix
    │   ├── default.nix
    │   └── tmpl-default.nix
    └── programs
        ├── btop
        │   └── default.nix
        └── zsh
            ├── config/
            └── default.nix
```

home-manager はユーザー環境を記述できる。\
今後 NixOS と連携することを考えて、ディレクトリを、home-manager 管轄のユーザー領域のコードとして user と、NixOS 管轄のシステム領域のコードとして system で切って分ける計画にした。

### やっていく2
ここからは作業、トラブルシューティングを書いていく。\
まずは cli か gui か分類して、cli のプログラムを積極的に移動していく。

### Tokyo Night テーマを入れたい
[programs.bat.themes | Home Manager - Option Search](https://home-manager-options.extranix.com/?query=programs.bat.themes&release=release-24.05)\
Example では `pkgs.fetchFromGitHub` をつかっていたので、真似をする。

[Nixpkgs Reference Manual](https://nixos.org/manual/nixpkgs/stable/#chap-pkgs-fetchers)\
こういうのは fetcher と呼ばれているらしく、再現性を損なわずに外部のリソースを使う方法を考えた先人たちが作り出したものらしい。

[nixpkgs/pkgs/build-support/fetchgithub/default.nix at master · NixOS/nixpkgs · GitHub](https://github.com/NixOS/nixpkgs/blob/master/pkgs/build-support/fetchgithub/default.nix)\
fetchFromGitHub はなんやかんやして fetchgit や fetchzip を呼び出してくれるラッパーっぽい。

[nix-prefetch-url - Nix Reference Manual](https://nix.dev/manual/nix/2.25/command-ref/nix-prefetch-url)\
`--unpack` フラグを渡して、tarball の URL を与えると、fetchFromGitHub で使える hash を返してくれるらしい。

ここまで全部やるのは結構めんどくさいけど、冪等性のためにはそういうものかって感じではある。\
`nix-prefetch-url --unpack https://github.com/folke/tokyonight.nvim/archive/refs/tags/v4.10.0.tar.gz` としてハッシュを得た。

```nix
❯ cat user/programs/bat/default.nix 

{ pkgs, ...}:
{
  programs.bat = {
    enable = true;
    themes = {
      tokyo-night = {
        src = pkgs.fetchFromGitHub {
          owner = "folke";
          repo = "tokyonight.nvim";
          rev = "v4.10.0";
          sha256 = "02662k6kxaf19w17fq71zc6hv4yylgzzmrrhhzid0sz0ghafb9dw";
        };
        # bat はsublime 構文を使っているらしい
        file = "extras/sublime/tokyonight_night.tmTheme";
      };
    };
    config = {
      theme = "tokyo-night";
    };
  };
}
```

### Catppuccin テーマを入れたい
これまでなんとなく TokyoNight を使っていたが、気分転換も兼ねて今日から Catppuccin を使いたくなったので、やっていく。

[Ports • Catppuccin](https://catppuccin.com/ports)\
たまたま Catppuccin のホームページにこんなものがあることを知ったので、眺めていると、\
[GitHub - catppuccin/nix: ❄️ Soothing pastel theme for Nix](https://github.com/catppuccin/nix)\
たまたま nix といい感じに仲良くしてくれるものを見つけたので、使っていく。

直感的にはプログラムごとにテーマを記述したほうが良い気がするが、どうせ全部やるのと、乗り換えやすさを考慮して github:catppuccin/nix を使って、グローバルで適用した。

### Man が Locale をセットできない
```
❯ man
/home/tenzyu/.local/state/nix/profile/bin/man: can't set the locale; make sure $LC_* and $LANG are correct
```
私は明示的に nix で man を入れているわけではないので、いつから nix 下の man を使うようになったのか正直わからないが、このままでは man が困ってしまうので直していく。

[Locales - NixOS Wiki](https://nixos.wiki/wiki/Locales)\
丁寧に Wiki に書かれていたので、記事内の nix shell を `home.sessionVariables` と見立てて記述する\
[home.sessionVariables | Home Manager - Option Search](https://home-manager-options.extranix.com/?query=home.sessionVariables&release=release-24.05)

```nix
  home.sessionVariables = {
    # https://nixos.wiki/wiki/Locales
    LOCALE_ARCHIVE = "${pkgs.glibcLocales}/lib/locale/locale-archive";
  };
```

### 環境変数で XDG に準拠したい
[home-manager/modules/misc/xdg.nix at release-24.05 · nix-community/home-manager · GitHub](https://github.com/nix-community/home-manager/blob/release-24.05/modules/misc/xdg.nix)\
あまり良くわからないけど、ハードコーディングしなくても、`config.xdg.cacheHome` とかでアクセスできそう。\
`xdg.enable = true;` にしなくても使えそうだけど、こうすると `home.sessionVariables` に `XDG_CACHE_HOME` とかを入れてくれるらしいよ（便利！）

ちなみに `config.xdg.enable` とかでアクセスされてるパッケージもあるらしい。\
[config.xdg.enable | Code search results · GitHub](https://github.com/search?q=repo%3Anix-community%2Fhome-manager+config.xdg.enable&type=code)

[home-manager/modules/home-environment.nix at 2f23fa308a7c067e52dfcc30a0758f47043ec176 · nix-community/home-manager · GitHub](https://github.com/nix-community/home-manager/blob/2f23fa308a7c067e52dfcc30a0758f47043ec176/modules/home-environment.nix#L477)\
その後たまたま `home.preferXdgDirectories` を見つけたので、真にしておく。

そんなにアクセスされていないように見えるが・・・\
[home.preferXdgDirectories | Code search results · GitHub](https://github.com/search?q=repo%3Anix-community%2Fhome-manager%20home.preferXdgDirectories&type=code)

`XDG_RUNTIME_DIR` は副作用の要因になるみたいで、簡単には使わせてもらえないらしい。
```nix
    NPM_CONFIG_TMP="$XDG_RUNTIME_DIR/npm";
```
例えば上記のような変数の指定に使いたいのだけれど、今回は `"${config.xdg.stateHome}/npm-runtime";` とかでお茶を濁そうと思う。

スマートな解決方法を知っている人はぜひ [@tenzyudotcom](https://x.com/tenzyudotcom) に DM してほしい。

### home.sessionVariables を読みにいく先を変えたい
私はホーム直下にドットファイルがあるのが好きじゃないので、`~/.nix-profile` ではなくて `~/.local/state/nix/profiles/profile` を使っている。\
 `~/.nix-profile` を消しているので、zsh が見つけられずに困っているので直していく。

[home-manager/modules/programs/zsh.nix at a9953635d7f34e7358d5189751110f87e3ac17da · nix-community/home-manager · GitHub](https://github.com/nix-community/home-manager/blob/a9953635d7f34e7358d5189751110f87e3ac17da/modules/programs/zsh.nix#L584)\
zsh は
```nix
. "${config.home.profileDirectory}/etc/profile.d/hm-session-vars.sh"
```
とすることで、`home.sessionVariables` の変数を適用していることがわかった。

[home-manager/modules/home-environment.nix at 2f23fa308a7c067e52dfcc30a0758f47043ec176 · nix-community/home-manager · GitHub](https://github.com/nix-community/home-manager/blob/2f23fa308a7c067e52dfcc30a0758f47043ec176/modules/home-environment.nix#L528-L534)\
私はこれまで `home.profileDirectory` を知らなかったのだけれど、特定の条件では勝手にやってくれるらしい。

[home-manager/modules/home-environment.nix at 2f23fa308a7c067e52dfcc30a0758f47043ec176 · nix-community/home-manager · GitHub](https://github.com/nix-community/home-manager/blob/2f23fa308a7c067e52dfcc30a0758f47043ec176/modules/home-environment.nix#L206-L216)\
最初は上書きすればいいと思っていたのだけれど、Read-only らしいので、`"${config.xdg.stateHome}/nix/profile"` を使ってくれる設定を再現する。

```nix
  nix = {
    package = pkgs.nixFlakes;
    settings = {
      experimental-features = [ "nix-command" "flakes" ];
      use-xdg-base-directories = true;
    };
  };
```

とりあえずこれで望んでいる場所を参照してくれた。

ちなみに、
`warning: ignoring the client-specified setting 'use-xdg-base-directories', because it is a restricted setting and you are not a trusted user`
と毎回いわれると悲しいので、`nix.settings.extra-trusted-users` に自分のユーザー名を追加した。

### 起動しないアプリを救いたい
GPU を使うプログラムが起動しないことがある。\
それは、NixOS 環境下でないと、グラフィックドライバを見つけられないから らしい。\
その解決策として NixGL を使うのがデファクトスタンダードらしい。\
[GitHub - nix-community/nixGL: A wrapper tool for nix OpenGL application \[maintainer=@guibou\]](https://github.com/nix-community/nixGL)

home-manager や nixgl の issue を見て回ると、どうやら最近 (24.11) からは、便利な関数が用意されていて、次のようにすることでアプリケーションをラップすることができる。

```nix
# flake.nix
{
  inputs = {
    nixgl.url = "github:nix-community/nixGL";
  };
}
```

```nix
{inputs, config, pkgs, ...}: {
  # nixGL.wrap をするための準備
  nixGL.packages = inputs.nixgl.packages;
  nixGL.vulkan.enable = true;
  nixGL.defaultWrapper = "mesa";
  nixGL.installScripts = [
    "mesa"
  ];

  programs.kitty = {
    enable = true;
    package = config.lib.nixGL.wrap pkgs.kitty;
  }
}
```

`config.lib.nixGL.wrap pkgs.kitty;` の部分でラップされていて、`kitty` でラップ済みのプログラムとして実行できる（すごい！）

## 終わりに
個人的に Nix に満足していて、手元のノートパソコンは既に NixOS に乗り換えた。

[Obsidian](https://obsidian.md/) を使い始めたときにも同じような感想を持ったのだけれど、これまで雲散霧消してきたものが、今後は再利用可能だと思うと、とても嬉しいし、やってよかった。\
宣言的な分 ブラックボックスであったり、Nix の思想との相性だったりあるかもしれないけど、もし暇なら試してみてほしい。

たまたま噂に聞いていた Nix のおかげで良い経験ができたので、今後もアンテナを張っていきたいと思う。\
例としては、近いうちに [Devbox](https://www.jetify.com/devbox) なんかも試そうと思う。


## Footnotes

[^1]: Reproducible, Declarative and Reliable - [Nix & NixOS | Declarative builds and deployments](https://nixos.org/)
