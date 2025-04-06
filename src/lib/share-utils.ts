/**
 * コンテンツをシェアするためのユーティリティ関数
 * @param platform シェアするプラットフォーム（twitter, email, copy）
 * @param url シェアするURL
 * @param title シェアするタイトル
 * @returns シェア結果
 */
export const shareContent = (platform: string, url: string, title: string) => {
  // NOTE: これもっといいリファクタリングあると思う =>
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  let shareUrl = ''
  let copied = false

  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
      break
    case 'email':
      shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
      break
    case 'copy':
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(url)
        copied = true
      }
      break
  }

  return { url: shareUrl, copied }
}
