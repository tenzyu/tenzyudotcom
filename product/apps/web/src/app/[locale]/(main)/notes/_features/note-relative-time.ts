export function formatRelativeNoteTime(
  createdAt: string,
  locale: string,
  nowMs = Date.now(),
) {
  const createdAtMs = new Date(createdAt).getTime()
  const diffMs = Math.max(0, nowMs - createdAtMs)
  const hourMs = 60 * 60 * 1000
  const dayMs = 24 * hourMs

  if (diffMs < dayMs) {
    const hoursAgo = Math.max(1, Math.floor(diffMs / hourMs))
    return locale === 'ja' ? `${hoursAgo}時間前` : `${hoursAgo}h ago`
  }

  const daysAgo = Math.max(1, Math.floor(diffMs / dayMs))
  return locale === 'ja' ? `${daysAgo}日前` : `${daysAgo}d ago`
}
