export function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items
  }

  const next = [...items]
  const [item] = next.splice(index, 1)
  if (!item) {
    return items
  }
  next.splice(targetIndex, 0, item)
  return next
}
