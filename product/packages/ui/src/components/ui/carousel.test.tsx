// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'

import { Carousel, CarouselNext, CarouselPrevious } from './carousel'

const embla = vi.hoisted(() => {
  const listeners = new Map<string, Set<() => void>>()
  const state = { available: false, prev: false, next: true }
  const api = {
    canScrollPrev: () => state.prev,
    canScrollNext: () => state.next,
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    on: (event: string, listener: () => void) => {
      const callbacks = listeners.get(event) ?? new Set()
      callbacks.add(listener)
      listeners.set(event, callbacks)
      return api
    },
    off: (event: string, listener: () => void) => {
      listeners.get(event)?.delete(listener)
      return api
    },
  }
  return { state, api, listeners }
})

vi.mock('embla-carousel-react', () => ({
  default: () => [() => {}, embla.state.available ? embla.api : undefined],
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  embla.listeners.clear()
  embla.state.available = false
  embla.state.prev = false
  embla.state.next = true
})

function Controls() {
  return (
    <>
      <CarouselPrevious />
      <CarouselNext />
    </>
  )
}

it('renders disabled controls on the server even when an API is available', () => {
  embla.state.available = true
  const html = renderToString(
    <Carousel>
      <Controls />
    </Carousel>
  )
  const container = document.createElement('div')
  container.innerHTML = html
  const buttons = container.querySelectorAll('button')
  expect(buttons).toHaveLength(2)
  buttons.forEach((button) => expect(button.disabled).toBe(true))
  expect(embla.listeners.size).toBe(0)
})

it('handles a late API, selection, reinitialization, controls, keyboard, and cleanup', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  const root = createRoot(container)
  const setApi = vi.fn()
  const render = () =>
    root.render(
      <Carousel setApi={setApi}>
        <Controls />
      </Carousel>
    )
  const previous = () =>
    container.querySelector<HTMLButtonElement>(
      '[data-slot="carousel-previous"]'
    )
  const next = () =>
    container.querySelector<HTMLButtonElement>('[data-slot="carousel-next"]')
  try {
    await act(render)
    expect(previous()?.disabled).toBe(true)
    expect(next()?.disabled).toBe(true)
    expect(setApi).not.toHaveBeenCalled()
    embla.state.available = true
    await act(render)
    expect(setApi).toHaveBeenCalledWith(embla.api)
    expect(previous()?.disabled).toBe(true)
    expect(next()?.disabled).toBe(false)
    await act(() => next()?.click())
    expect(embla.api.scrollNext).toHaveBeenCalledOnce()
    await act(() => {
      embla.state.prev = true
      embla.state.next = false
      embla.listeners.get('select')?.forEach((listener) => listener())
    })
    expect(previous()?.disabled).toBe(false)
    expect(next()?.disabled).toBe(true)
    await act(() => previous()?.click())
    expect(embla.api.scrollPrev).toHaveBeenCalledOnce()
    await act(() => {
      embla.state.prev = false
      embla.state.next = true
      embla.listeners.get('reInit')?.forEach((listener) => listener())
    })
    expect(previous()?.disabled).toBe(true)
    expect(next()?.disabled).toBe(false)
    for (const key of ['ArrowLeft', 'ArrowRight']) {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      })
      await act(() => {
        next()?.dispatchEvent(event)
      })
      expect(event.defaultPrevented).toBe(true)
    }
    expect(embla.api.scrollPrev).toHaveBeenCalledTimes(2)
    expect(embla.api.scrollNext).toHaveBeenCalledTimes(2)
    embla.state.available = false
    await act(render)
    expect(previous()?.disabled).toBe(true)
    expect(next()?.disabled).toBe(true)
    expect(embla.listeners.get('select')?.size).toBe(0)
    expect(embla.listeners.get('reInit')?.size).toBe(0)
    embla.state.available = true
    await act(render)
  } finally {
    await act(() => root.unmount())
  }
  expect(embla.listeners.get('select')?.size).toBe(0)
  expect(embla.listeners.get('reInit')?.size).toBe(0)
})
