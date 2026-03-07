import { useIntlayer } from 'next-intlayer/server'
import { SectionHeader } from '@/components/site/section-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ExperienceSection() {
  const content = useIntlayer('portfolio')

  return (
    <div className="space-y-8">
      <SectionHeader
        title={content.experience.sectionTitle.value}
        variant="underline"
      />
      <div className="space-y-10">
        {content.experience.items.map((exp) => (
          <Card
            key={exp.company.value + exp.period.value}
            variant="soft"
            className="p-0"
          >
            <CardHeader className="gap-2">
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between">
                <CardTitle className="text-lg font-semibold">
                  {exp.company}
                </CardTitle>
                <span className="text-muted-foreground text-sm font-medium">
                  {exp.period}
                </span>
              </div>
              <p className="text-sm font-medium">
                {exp.role} ({exp.position})
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-muted-foreground text-sm leading-relaxed">
                <p>
                  {content.experience.businessLabel} {exp.business}
                </p>
                <p>
                  {content.experience.capitalLabel} {exp.capital} /{' '}
                  {content.experience.employeesLabel} {exp.employees}
                </p>
              </div>
              <ul className="text-foreground list-inside list-disc pl-2 text-sm leading-relaxed">
                {exp.responsibilities.map((resp, idx) => (
                  <li key={idx}>{resp}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 pt-2">
                {exp.technologies.map((tech) => (
                  <Badge key={tech.value} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
