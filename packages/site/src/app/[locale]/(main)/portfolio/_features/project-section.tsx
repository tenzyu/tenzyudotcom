import { useIntlayer } from 'next-intlayer/server'
import { ExternalLink } from '@/app/[locale]/_features/external-link'
import { SectionHeader } from '@/app/[locale]/(main)/_features/section-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PORTFOLIO_PROJECTS } from './portfolio.source'

export function ProjectsSection() {
  const content = useIntlayer('page-portfolio')

  return (
    <div className="space-y-8">
      <SectionHeader
        title={content.projects.sectionTitle.value}
        variant="underline"
      />
      <div className="space-y-6">
        {PORTFOLIO_PROJECTS.map((project) => {
          const projectContent = content.projects.items[project.id]
          const note = 'note' in projectContent ? projectContent.note : null

          return (
            <Card key={project.id} variant="soft" className="gap-0 p-0">
              <CardHeader className="gap-2 pt-5 pb-4">
                <CardTitle className="text-lg font-semibold">
                  {projectContent.name}
                </CardTitle>
                <p className="text-primary text-sm font-medium">
                  {projectContent.highlight}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pb-4">
                <p className="text-sm leading-6">
                  {projectContent.description}
                </p>
                <p className="text-muted-foreground text-sm leading-6">
                  <strong>{content.projects.motivationLabel}</strong>{' '}
                  {projectContent.motivation}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-3 pt-0 pb-5">
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 text-sm font-medium">
                  {project.github ? (
                    <Button
                      variant="ghost"
                      className="text-primary h-auto px-0 hover:bg-transparent hover:underline"
                      asChild
                    >
                      <ExternalLink href={project.github}>
                        {content.projects.githubLabel} &rarr;
                      </ExternalLink>
                    </Button>
                  ) : null}
                  {project.demo ? (
                    <Button
                      variant="ghost"
                      className="text-primary h-auto px-0 hover:bg-transparent hover:underline"
                      asChild
                    >
                      <ExternalLink href={project.demo}>
                        {content.projects.demoLabel} &rarr;
                      </ExternalLink>
                    </Button>
                  ) : null}
                </div>
                {note ? (
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong>{content.projects.notePrefix}</strong>
                    {note}
                  </p>
                ) : null}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
