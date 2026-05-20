import { describe, expect, it } from 'vitest'

import { Button, buttonVariants } from './button'

describe('Button', () => {
  it('exports the component entry', () => {
    expect(Button).toBeTypeOf('function')
  })

  it('maps variants to stable token classes', () => {
    expect(buttonVariants({ variant: 'secondary' })).toContain('bg-secondary')
    expect(buttonVariants({ variant: 'destructive' })).toContain(
      'text-destructive'
    )
  })
})
