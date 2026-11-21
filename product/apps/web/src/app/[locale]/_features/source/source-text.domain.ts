export function textareaText(source: string) {
  return source.replace(/\r\n?/g, '\n')
}

function sourceOffset(source: string, position: number) {
  let offset = 0
  for (let index = 0; index < position && offset < source.length; index++) {
    if (source[offset] === '\r' && source[offset + 1] === '\n') offset++
    offset++
  }
  return offset
}

export function replaceSourceRange(
  source: string,
  start: number,
  end: number,
  text: string,
) {
  const first = sourceOffset(source, start)
  const last = sourceOffset(source, end)
  const newline = source.match(/\r\n|\n|\r/)?.[0] ?? '\n'
  return (
    source.slice(0, first) +
    textareaText(text).replaceAll('\n', newline) +
    source.slice(last)
  )
}

export function reconcileSourceInput(source: string, input: string) {
  const old = textareaText(source)
  let start = 0
  let end = old.length
  let inputEnd = input.length
  while (
    start < old.length &&
    start < input.length &&
    old[start] === input[start]
  )
    start++
  while (
    end > start &&
    inputEnd > start &&
    old[end - 1] === input[inputEnd - 1]
  ) {
    end--
    inputEnd--
  }
  return replaceSourceRange(source, start, end, input.slice(start, inputEnd))
}
