  - [x] ./ai-reports の、具体的な失敗/成功じゃないもの、例えば repo-specific な仕様とかは、 ./repo-specific に移動する。
  - [x] ./ai-reports はディレクトリ名からその正体がわかりにくいので、適切な名前を提案してもらってそれにする。
  - [x] ./ai-reports の運用方法について、frontmatter と、本文に参照の相対パスのみを設置して、frontmatter には いつ参照を読みに行くべきなのか と 要約 、またLLMの摩擦を減らす内容を記述して、./ai-reports 配下のさらに下にディレクトリを作ってそこに本文をまとめる。
  - [x] ./ai-reports は harness 配下に移動する
  - [x] ./ai-reports の運用方法を README.md に置いて、LLM が困らないようにする。 
  - [x] [P2] Sort notes by parsed timestamps, not raw ISO strings — /home/tenzyu/Documents/tenzyudotcom/src/app/[locale]/(main)/notes/
    _features/notes.assemble.ts:19-20
    This ordering breaks once the notes come from mixed time zone offsets. The admin editor seeds new rows with new
    Date().toISOString() (Z), while the checked-in data already uses +09:00; comparing the raw strings here can therefore place a
    newer note below an older one on /notes even though both values pass validation.
  - [x] [P2] Keep recommendation previews in sync with edited rows — /home/tenzyu/Documents/tenzyudotcom/src/app/[locale]/(admin)/
    editorial/_features/recommendations-editor-client.tsx:124-125
    previews is computed once from the initial server-rendered entries, but the client lets admins reorder, remove, add, and edit
    those entries. Because the UI still reads previews[index], the preview text quickly drifts away from the row it is shown for, so
    after a move/delete or URL edit the editor can display the wrong video/channel preview next to the item being saved.
  - [x] [P3] Format note timestamps with the active locale — /home/tenzyu/Documents/tenzyudotcom/src/app/[locale]/(main)/notes/
    _features/notes-page-content.tsx:28-32
    On the English notes page, timestamps are still rendered with ja-JP, so users see Japanese-formatted dates even when the rest of
    the page is localized to English. This only shows up on /en/notes, but it is a user-visible regression in the new page.
