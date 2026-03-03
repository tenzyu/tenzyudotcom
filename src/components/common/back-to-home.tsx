import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function BackToHome({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full py-4 ${className}`}>
      <Link
        href="/"
        className="group text-muted-foreground hover:text-primary inline-flex items-center text-sm font-medium transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Home
      </Link>
    </div>
  )
}
