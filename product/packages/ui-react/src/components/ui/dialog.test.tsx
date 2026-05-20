import { describe, expect, it } from 'vitest'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './dialog'

describe('Dialog', () => {
  it('exports the composed dialog parts', () => {
    expect(Dialog).toBeTypeOf('function')
    expect(DialogTrigger).toBeDefined()
    expect(DialogPortal).toBeDefined()
    expect(DialogOverlay).toBeTypeOf('function')
    expect(DialogContent).toBeTypeOf('function')
    expect(DialogHeader).toBeTypeOf('function')
    expect(DialogFooter).toBeTypeOf('function')
    expect(DialogTitle).toBeDefined()
    expect(DialogDescription).toBeDefined()
    expect(DialogClose).toBeDefined()
  })
})
