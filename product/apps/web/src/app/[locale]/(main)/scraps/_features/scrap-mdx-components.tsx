import type { MDXComponents } from 'mdx/types'
import { Badge } from '@tenzyu/ui/badge'
import { cn } from '@tenzyu/ui'

type ScrapBlockProps = {
  title?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

type ScrapDiffProps = {
  language?: string
  before?: string
  after?: string
  className?: string
  children?: React.ReactNode
}

const SCRAP_TONE_CLASSNAME = {
  evidence:
    'border-emerald-200/70 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100',
  experiment:
    'border-sky-200/70 bg-sky-50/70 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100',
  decision:
    'border-violet-200/70 bg-violet-50/70 text-violet-950 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-100',
  hypothesis:
    'border-amber-200/70 bg-amber-50/70 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100',
  log: 'border-zinc-200/70 bg-zinc-50/70 text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-100',
  todo: 'border-orange-200/70 bg-orange-50/70 text-orange-950 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-100',
  claim:
    'border-blue-200/70 bg-blue-50/70 text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100',
  counter:
    'border-rose-200/70 bg-rose-50/70 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100',
  diff: 'border-border bg-card/70 text-foreground',
} as const

type ScrapTone = keyof typeof SCRAP_TONE_CLASSNAME

function ScrapBlock({
  tone,
  label,
  title,
  className,
  children,
}: ScrapBlockProps & {
  tone: ScrapTone
  label: string
}) {
  return (
    <section
      className={cn(
        'my-6 space-y-2 rounded-2xl border p-4 text-sm leading-relaxed',
        SCRAP_TONE_CLASSNAME[tone],
        className,
      )}
      data-scrap-block={tone}
    >
      <header className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="bg-background/40 text-xs uppercase tracking-wide"
        >
          {label}
        </Badge>
        {title ? (
          <p className="text-sm font-semibold tracking-tight">{title}</p>
        ) : null}
      </header>
      {children ? (
        <div className="space-y-2 text-sm leading-relaxed [&>p]:m-0">
          {children}
        </div>
      ) : null}
    </section>
  )
}

function Evidence(props: ScrapBlockProps) {
  return <ScrapBlock {...props} tone="evidence" label="Evidence" />
}

function Experiment(props: ScrapBlockProps) {
  return <ScrapBlock {...props} tone="experiment" label="Experiment" />
}

function Decision(props: ScrapBlockProps) {
  return <ScrapBlock {...props} tone="decision" label="Decision" />
}

function Hypothesis(props: ScrapBlockProps) {
  return <ScrapBlock {...props} tone="hypothesis" label="Hypothesis" />
}

function Log(props: ScrapBlockProps) {
  return <ScrapBlock {...props} tone="log" label="Log" />
}

function Todo(props: ScrapBlockProps) {
  return <ScrapBlock {...props} tone="todo" label="Todo" />
}

function Claim(props: ScrapBlockProps) {
  return <ScrapBlock {...props} tone="claim" label="Claim" />
}

function CounterClaim(props: ScrapBlockProps) {
  return <ScrapBlock {...props} tone="counter" label="Counter" />
}

function Diff({
  language,
  before,
  after,
  className,
  children,
}: ScrapDiffProps) {
  if (children) {
    return (
      <pre
        className={cn(
          'my-6 overflow-x-auto rounded-2xl border border-border/60 bg-card/70 p-4 text-xs',
          className,
        )}
        data-scrap-block="diff"
        data-language={language ?? 'diff'}
      >
        <code>{children}</code>
      </pre>
    )
  }

  return (
    <div
      className={cn(
        'my-6 grid gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 text-xs md:grid-cols-2',
        className,
      )}
      data-scrap-block="diff"
      data-language={language ?? 'diff'}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          before
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border/50 bg-background/60 p-3">
          <code>{before ?? ''}</code>
        </pre>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          after
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border/50 bg-background/60 p-3">
          <code>{after ?? ''}</code>
        </pre>
      </div>
    </div>
  )
}

export const SCRAP_MDX_COMPONENTS: MDXComponents = {
  Evidence,
  Experiment,
  Decision,
  Hypothesis,
  Log,
  Todo,
  Claim,
  CounterClaim,
  Diff,
}
