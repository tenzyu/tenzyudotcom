'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useIntlayer } from 'next-intlayer'

import { Button } from '@/components/ui/button'

type ErrorBoundaryProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const content = useIntlayer('errorBoundary')

  useEffect(() => {
    // エラーをログに記録
    console.error('Error:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tighter">{content.title}</h1>
        <p className="text-muted-foreground">
          {error.message || content.fallbackMessage}
        </p>
        {error.digest && (
          <p className="text-muted-foreground text-sm">
            {content.errorId} {error.digest}
          </p>
        )}
      </div>
      <Button
        variant="soft"
        onClick={() => {
          reset()
          toast.success(content.retrying)
        }}
      >
        {content.retry}
      </Button>
    </div>
  )
}
