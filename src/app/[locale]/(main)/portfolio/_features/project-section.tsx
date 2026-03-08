import { useIntlayer } from 'next-intlayer/server'
import { ExternalLink } from '@/components/site-ui/external-link'
import { SectionHeader } from '@/components/site-ui/section-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProjectsSection() {
  const content = useIntlayer('page-portfolio')

  return (
    <div className="space-y-8">
      <SectionHeader
        title={content.projects.sectionTitle.value}
        variant="underline"
      />
      <div className="space-y-10">
        {content.projects.items.map((project) => (
          <Card key={project.name.value} variant="soft" className="p-0">
            <CardHeader className="gap-2">
              <CardTitle className="text-lg font-semibold">
                {project.name}
              </CardTitle>
              <p className="text-primary text-sm leading-relaxed font-medium">
                {project.highlight}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">{project.description}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong>{content.projects.motivationLabel}</strong>{' '}
                {project.motivation}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {project.technologies.map((tech) => (
                  <Badge key={tech.value} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 pt-2 text-sm font-medium">
                {project.github ? (
                  <Button
                    variant="ghost"
                    className="text-primary h-auto px-0 hover:bg-transparent hover:underline"
                    asChild
                  >
                    <ExternalLink href={project.github.value}>
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
                    <ExternalLink href={project.demo.value}>
                      {content.projects.demoLabel} &rarr;
                    </ExternalLink>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
