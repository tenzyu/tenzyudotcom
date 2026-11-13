export function formatDate(
  targetDate: Date,
  locale = 'en-US',
  includeRelative = false,
) {
  const currentDate = new Date()

  const yearsAgo = currentDate.getFullYear() - targetDate.getFullYear()
  const monthsAgo = currentDate.getMonth() - targetDate.getMonth()
  const daysAgo = currentDate.getDate() - targetDate.getDate()

  let formattedDate = ''

  const isJa = locale.startsWith('ja')

  if (yearsAgo > 0) {
    formattedDate = isJa ? `${yearsAgo}年前` : `${yearsAgo}y ago`
  } else if (monthsAgo > 0) {
    formattedDate = isJa ? `${monthsAgo}ヶ月前` : `${monthsAgo}mo ago`
  } else if (daysAgo > 0) {
    formattedDate = isJa ? `${daysAgo}日前` : `${daysAgo}d ago`
  } else {
    formattedDate = isJa ? '今日' : 'Today'
  }

  const fullDate = targetDate.toLocaleString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (!includeRelative) {
    return fullDate
  }

  return `${fullDate} (${formattedDate})`
}
