'use client'

import { ChevronRight } from 'lucide-react'
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
          className="group text-muted-foreground/80 hover:text-foreground h-7 px-2 text-xs"
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <span
            aria-hidden
            className="text-muted-foreground/70 mr-1 inline-flex h-3 w-3 items-center justify-center transition-transform duration-200 group-data-[state=open]:rotate-90"
          >
            <ChevronRight />
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
