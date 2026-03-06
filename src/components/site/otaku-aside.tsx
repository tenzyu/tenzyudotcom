'use client'

import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

type OtakuAsideProps = {
  label: string
  children: ReactNode
}

export function OtakuAside({ label, children }: OtakuAsideProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="group h-7 px-2 text-xs text-muted-foreground/80 hover:text-foreground"
        >
          <span
            aria-hidden
            className="mr-1 inline-flex h-3 w-3 items-center justify-center text-muted-foreground/70 transition-transform duration-200 group-data-[state=open]:rotate-90"
          >
            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 2.5 L8 6 L4 9.5" />
            </svg>
          </span>
          <span>{label}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="text-muted-foreground text-xs leading-relaxed">
        <div className="pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
