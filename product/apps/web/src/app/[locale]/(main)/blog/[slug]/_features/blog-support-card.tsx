import { HeartHandshake } from 'lucide-react'
import { useIntlayer } from 'next-intlayer/server'
import { KoFiLink } from '@/app/[locale]/_features/shell/kofi-link'

export function BlogSupportCard() {
  const content = useIntlayer('page-blog')

  return (
    <section className="border-border/60 bg-card/70 rounded-2xl border p-5">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-2xl">
          <HeartHandshake className="h-4 w-4" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold">
            {content.post.supportTitle.value}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {content.post.supportDescription.value}
          </p>
          <KoFiLink label={content.post.supportLinkLabel.value} />
        </div>
      </div>
    </section>
  )
}
