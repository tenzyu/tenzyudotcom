export function getTwitterShareUri(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

export function getEmailShareUri(title: string, url: string): string {
  return `mailto:?subject=${title}&body=${url}`
}

export const copyToClipboard = (text: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text)
  }
}

/**
 * コンテンツをシェアするためのユーティリティ関数
 * @param platform シェアするプラットフォーム（twitter, email, copy）
 * @param url シェアするURL
 * @param title シェアするタイトル
 * @returns シェア結果
 */
export const shareContent = (platform: string, url: string, title: string) => {
  let uri = ''
  let copied = false

  switch (platform) {
    case 'twitter':
      uri = getTwitterShareUri(title, url)
      break
    case 'email':
      uri = getEmailShareUri(title, url)
      break
    case 'copy':
      copyToClipboard(encodeURIComponent(url))
      copied = true
      break
  }

  return { uri, copied }
}
