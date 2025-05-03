import Link from 'next/link'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn-ui/card'

export type TocSection = {
  id: string
  title: string
}

type TableOfContentsProps = {
  sections: TocSection[]
}

export const TableOfContents = ({ sections }: TableOfContentsProps) => {
  if (!sections || sections.length === 0) {
    return null
  }

  return (
    <Card className="mx-auto w-full max-w-xs text-center">
      <CardHeader>
        <CardTitle className="text-lg">Table of Contents</CardTitle>
      </CardHeader>
      <CardContent>
        <nav aria-label="Table of contents">
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <Link
                  href={`#${section.id}`}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200"
                >
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  )
}
