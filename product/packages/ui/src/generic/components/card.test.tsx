import { describe, expect, it } from 'vitest'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card'

describe('Card', () => {
  it('exports the composed card parts', () => {
    expect(Card).toBeTypeOf('function')
    expect(CardHeader).toBeTypeOf('function')
    expect(CardTitle).toBeTypeOf('function')
    expect(CardDescription).toBeTypeOf('function')
    expect(CardAction).toBeTypeOf('function')
    expect(CardContent).toBeTypeOf('function')
    expect(CardFooter).toBeTypeOf('function')
  })
})
