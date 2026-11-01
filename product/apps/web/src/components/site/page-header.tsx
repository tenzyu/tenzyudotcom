import { PageIntro } from '@tenzyu/ui/editorial'

type PageHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
}

function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <PageIntro
      title={title}
      description={description}
      eyebrow={eyebrow}
      actions={actions}
      className={className}
      {...props}
    />
  )
}

export { PageHeader }
