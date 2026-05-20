import { describe, expect, it } from 'vitest'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion'

describe('Accordion', () => {
  it('exports the composed accordion parts', () => {
    expect(Accordion).toBeTypeOf('function')
    expect(AccordionItem).toBeDefined()
    expect(AccordionTrigger).toBeDefined()
    expect(AccordionContent).toBeDefined()
  })
})
