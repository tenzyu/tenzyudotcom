function getTwitterShareUri(text: string, url: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

function getEmailShareUri(title: string, url: string): string {
  return `mailto:?subject=${title}&body=${url}`
}

function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined') {
    void navigator.clipboard.writeText(text)
  }
}

type SharePlatform = 'twitter' | 'email' | 'copy'

export function shareContent(
  platform: SharePlatform,
  url: string,
  title: string,
) {
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
      copyToClipboard(url)
      copied = true
      break
  }

  return { uri, copied }
}
