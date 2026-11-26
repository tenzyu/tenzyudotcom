import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '../../lib/utils'

type FrameProps = ComponentPropsWithoutRef<'div'>
type IntroProps = Omit<ComponentPropsWithoutRef<'header'>, 'title'> & {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}
type PanelProps = Omit<ComponentPropsWithoutRef<'section'>, 'title'> & {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

function SiteFrame({ className, ...props }: FrameProps) {
  return <div className={cn('tz-site', className)} {...props} />
}

function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  className,
  ...props
}: IntroProps) {
  return (
    <header className={cn('tz-page-intro', className)} {...props}>
      <div className="tz-page-intro-copy">
        {eyebrow ? <p className="tz-eyebrow">{eyebrow}</p> : null}
        <h1 className="tz-page-title">{title}</h1>
        {description ? (
          <div className="tz-page-description">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="tz-page-actions">{actions}</div> : null}
    </header>
  )
}

function ReadingColumn({ className, ...props }: FrameProps) {
  return <div className={cn('tz-reading-column', className)} {...props} />
}

function EditorialList({
  className,
  ...props
}: ComponentPropsWithoutRef<'ul'>) {
  return <ul className={cn('tz-editorial-list', className)} {...props} />
}

function EditorialEntry({
  className,
  ...props
}: ComponentPropsWithoutRef<'li'>) {
  return <li className={cn('tz-editorial-entry', className)} {...props} />
}

function EditorPanel({
  children,
  title,
  description,
  actions,
  className,
  ...props
}: PanelProps) {
  return (
    <section className={cn('tz-editor-panel', className)} {...props}>
      {title || description || actions ? (
        <header className="tz-editor-panel-header">
          <div>
            {title ? <h2 className="tz-editor-panel-title">{title}</h2> : null}
            {description ? (
              <p className="tz-editor-panel-description">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="tz-page-actions">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}

export {
  SiteFrame,
  PageIntro,
  ReadingColumn,
  EditorialList,
  EditorialEntry,
  EditorPanel,
}
