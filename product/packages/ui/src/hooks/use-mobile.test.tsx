// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'

import { useIsMobile } from './use-mobile'

function MobileStatus() {
  return <output>{String(useIsMobile())}</output>
}

afterEach(() => vi.unstubAllGlobals())

it('uses a false server snapshot without accessing browser APIs', () => {
  vi.stubGlobal('window', undefined)
  expect(renderToString(<MobileStatus />)).toContain('false')
})

it('reads the current media query, follows breakpoint changes, and unsubscribes', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  let matches = true
  const listeners = new Set<() => void>()
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      expect(query).toBe('(max-width: 767px)')
      return {
        get matches() {
          return matches
        },
        addEventListener: (_event: string, listener: () => void) =>
          listeners.add(listener),
        removeEventListener: (_event: string, listener: () => void) =>
          listeners.delete(listener),
      }
    })
  )
  const container = document.createElement('div')
  const root = createRoot(container)
  try {
    await act(() => root.render(<MobileStatus />))
    expect(container.textContent).toBe('true')
    expect(listeners.size).toBe(1)
    await act(() => {
      matches = false
      listeners.forEach((listener) => listener())
    })
    expect(container.textContent).toBe('false')
    await act(() => {
      matches = true
      listeners.forEach((listener) => listener())
    })
    expect(container.textContent).toBe('true')
  } finally {
    await act(() => root.unmount())
  }
  expect(listeners.size).toBe(0)
})
