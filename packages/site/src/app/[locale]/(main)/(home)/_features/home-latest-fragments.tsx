import { getLocalizedUrl } from 'intlayer'
import { ArrowRight, FileText, MessageSquareText, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@/app/[locale]/_features/content'
import { SectionHeader } from '@/app/[locale]/(main)/_features/section-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type HomeLatestFragmentsProps = {
  locale: string
  latestNotes: {
    body: string
    createdAt: string
  }[]
  latestPost?: {
    slug: string
    metadata: {
      title: string
      summary: string
      publishedAt: Date
    }
  }
}

const noteDateFormatter = (locale: string) =>
  new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export function HomeLatestFragments({
  locale,
  latestNotes,
  latestPost,
}: HomeLatestFragmentsProps) {
  const home = useIntlayer('page-home')
  const formatter = noteDateFormatter(locale)

  return (
    <Content size="5xl" className="space-y-6">
      <SectionHeader
        title={home.fragmentsTitle.value}
        description={home.fragmentsSubtitle.value}
      />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
        <Card variant="soft" className="gap-0">
          <CardHeader className="gap-2 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-2xl">
                <MessageSquareText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle>{home.fragmentsNotesTitle}</CardTitle>
                <CardDescription>{home.fragmentsNotesDescription}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pb-5">
            {latestNotes.map((note) => (
              <Link
                key={note.createdAt}
                href={getLocalizedUrl('/notes', locale)}
                className="hover:bg-muted/40 block rounded-2xl border border-transparent px-3 py-2 transition-colors"
              >
                <p className="text-muted-foreground mb-1 text-xs">
                  {formatter.format(new Date(note.createdAt))}
                </p>
                <p className="line-clamp-2 text-sm leading-6">{note.body}</p>
              </Link>
            ))}
            <Button asChild variant="ghost" size="sm" className="px-0">
              <Link href={getLocalizedUrl('/notes', locale)}>
                {home.fragmentsNotesLinkLabel}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {latestPost ? (
            <Card variant="soft" className="gap-0">
              <CardHeader className="gap-2 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-2xl">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle>{home.fragmentsBlogTitle}</CardTitle>
                    <CardDescription>{home.fragmentsBlogDescription}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-5">
                <Link
                  href={getLocalizedUrl(`/blog/${latestPost.slug}`, locale)}
                  className="hover:bg-muted/40 block rounded-2xl border border-transparent px-3 py-2 transition-colors"
                >
                  <p className="mb-1 text-sm font-semibold leading-6">
                    {latestPost.metadata.title}
                  </p>
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-6">
                    {latestPost.metadata.summary}
                  </p>
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <Card variant="soft" className="gap-0">
            <CardHeader className="gap-2 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-2xl">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle>{home.fragmentsThingTitle}</CardTitle>
                  <CardDescription>{home.fragmentsThingDescription}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-5">
              <p className="text-sm leading-6">{home.fragmentsThingBody}</p>
              <Button asChild variant="ghost" size="sm" className="px-0">
                <Link href={getLocalizedUrl(home.fragmentsThingHref.value, locale)}>
                  {home.fragmentsThingLinkLabel}
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Content>
  )
}
