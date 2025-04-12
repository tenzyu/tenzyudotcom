'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/shadcn-ui/button'

type ErrorBoundaryProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // エラーをログに記録
    console.error('Error:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tighter">
          Something went wrong!
        </h1>
        <p className="text-muted-foreground">
          {error.message || 'An unexpected error occurred'}
        </p>
        {error.digest && (
          <p className="text-muted-foreground text-sm">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        onClick={() => {
          reset()
          toast.success('Retrying...')
        }}
      >
        Try again
      </Button>
    </div>
  )
}
