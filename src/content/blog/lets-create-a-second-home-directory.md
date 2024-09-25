---
title: '第２のホームディレクトを作って好き勝手しちゃおう'
description: '今回のアプローチ：引っ越し'
pubDate: 'Sep 26 2024'
heroImage: '/20240926041123.png'
---

> [!CAUTION]  
> 今のところユーザー名が `tenzy` と `tenzyu` でハードコードしているので、あなたのユーザー名に直して利用してください。

## 今回のアプローチ：引っ越し
実際のホームディレクトリを思うがままにするには、Windows の呪縛があまりにも多すぎました。  
`C:\Users\tenzy`、ここはもう終わっています。  
`Documents` を `documents` にリネームすることもかないません。  
![](/20240926020517.png)
なので、`C:\home\tenzyu` を作って、そのなかに `media/videos` や `workspaces/` など好きなことをするために、引っ越すことにしました。  
実際のホームディレクトリは見捨てます。

### 先に引っ越したあとの写真
![](/20240926041123.png)
\*左が Windows 標準のホームディレクトリ 右がこれからホームディレクトリとみなす場所

### 引っ越し先を作って権限をコピーする
まずは `C:\home\tenzyu` をファイルエクスプローラーなりパワーシェルなりすきな方法で作ってください。  
次に `C:\Users\tenzy` の権限をコピーしていきます。

1. PowerShell を管理者権限で開く  
スタートメニューを右クリックして「**Windows PowerShell (管理者)**」を選択します。  
2. `C:\Users\tenzy` の権限をエクスポート  
以下のコマンドを実行して、`C:\Users\tenzy` の権限をバックアップします。  
```powershell
Get-Acl "C:\Users\tenzy" | Export-Clixml -Path "C:\Users\tenzy\acl_tenzy.xml"
```
このコマンドは、`C:\Users\tenzy` のセキュリティ設定を `C:\Users\tenzy\acl_tenzy.xml` というファイルに保存します。  
3. `C:\home\tenzyu` に権限を適用  
次に、バックアップしたセキュリティ設定を `C:\home\tenzyu` に適用します。  
```powershell
$acl = Import-Clixml -Path "C:\Users\tenzy\acl_tenzy.xml"
Set-Acl -Path "C:\home\tenzyu" -AclObject $acl
```
これで、`C:\Users\tenzy` の権限が `C:\home\tenzyu` にコピーされます。  

### ファイルを移してあげる
`Documents` や、ポータブルなソフトウェア (例: 棒読みちゃん) を好きなように `C:\home\tenzyu` に移してあげましょう  
ついでにいらないファイルは消してしまいましょう。

#### 私の場合
とりあえず `C:\home\tenzyu` 配下に以下のディレクトリを作って移動しました。
- `apps`: ユーザー単位でインストールしたソフトやポータブルなソフトが入っています
- `downloads`
- `keep`: 領収書とかバックアップとかが入っています
- `media`: `music`, `pictures`, `videos` が入っています
- `workspaces`: `codes`(プログラム)や `video-creation`(動画編集) などの作業場です

### シムリンクを作る
ファイルの移動が終わったら、必要や好みに応じてシムリンクを作ってあげましょう  

#### 私の場合
- `C:\Users\tenzy\AppData\Local\Programs` にはユーザー単位でインストールしたアプリが入っているらしいので、`C:\home\tenzyu\apps` に移してシムリンクを作成しました。
- `C:\Users\tenzy\Documents` には `WindowsPowerShell` のようなものが作成されることがあるので、`C:\Users\tenzy\Documents\workspaces` としました。
```
New-Item -ItemType SymbolicLink -Path C:\Users\tenzy\Documents\workspaces -Target C:\home\tenzyu\workspaces
New-Item -ItemType SymbolicLink -Path C:\Users\tenzy\Downloads -Target C:\home\tenzyu\downloads
New-Item -ItemType SymbolicLink -Path C:\Users\tenzy\Music -Target C:\home\tenzyu\media\music
New-Item -ItemType SymbolicLink -Path C:\Users\tenzy\Pictures -Target C:\home\tenzyu\media\pictures
New-Item -ItemType SymbolicLink -Path C:\Users\tenzy\Videos -Target C:\home\tenzyu\media\videos
New-Item -ItemType SymbolicLink -Path C:\Users\tenzy\AppData\Local\Programs -Target C:\home\tenzyu\apps
```
- [KNOWNFOLDERID (Knownfolders.h) - Win32 apps | Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/shell/knownfolderid#FOLDERID_UserProgramFiles)
- [PSModulePath について - PowerShell | Microsoft Learn](https://learn.microsoft.com/ja-jp/powershell/module/microsoft.powershell.core/about/about_psmodulepath?view=powershell-7.4#long-description)

#### 放置したファイル・ディレクトリ
- `AppData` 自体 (今のところ全部なんとかする必要はなかったので)
- `Desktop` (私は使わないので)
- `Favorites` (私は使わないので)
- `Links` (私は使わないので)
- `Saved Games` (よくわからないので)
- `Searches` (よくわからないので)
- `各種 dotfiles` (全部 `C:\home\tenzyu\.dotfiles` にシムリンクを作成したいけどよくわからないので)
- `NTUSER.DAT` (触ってはいけないので)

## 今後解決していきたい問題
- dotfiles の管理
	- `C:\home\tenzyu\.dotfiles` を作って、`C:\Users\tenzy` にあるドットファイル全部のシムリンクを作ってあげて、触れるようにしたい
		- やってない理由: ドットファイルの増減をトラッキングするのがめんどくさそうだから・よくわからないから
- グローバルで入れたソフトをユーザー単位で入れなおしたい
	- やってない理由: めんどくさいから・実際に他ユーザーを使うことがないので、気持ちの問題だから

## やってみた所感
個人的には満足  
なにか作業したいときに Windows 由来やほかのプログラム由来のファイル・ディレクトリが目に入ってこないのがうれしいです。  
そのうちブログもホームページも充実させます。  
今日はこのブログを書いたところまで