import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import type { BlogHeading } from '../../_features/blog.domain'

export function BlogPostTableOfContents({
  headings,
}: {
  headings: BlogHeading[]
}) {
  const content = useIntlayer('page-blog')

  if (headings.length === 0) {
    return null
  }

  return (
    <aside className="border-border/60 bg-card/70 space-y-4 rounded-2xl border p-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold tracking-wide">
          {content.post.tableOfContentsTitle.value}
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {content.post.tableOfContentsDescription.value}
        </p>
      </div>
      <nav aria-label={content.post.tableOfContentsTitle.value}>
        <ol className="space-y-2 text-sm">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={heading.level === 3 ? 'pl-4' : undefined}
            >
              <Link
                href={`#${heading.id}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {heading.title}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  )
}
