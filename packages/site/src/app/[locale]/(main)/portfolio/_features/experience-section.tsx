import { useIntlayer } from 'next-intlayer/server'
import { SectionHeader } from '@/app/[locale]/(main)/_features/section-header'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PORTFOLIO_EXPERIENCES } from './portfolio.source'

export function ExperienceSection() {
  const content = useIntlayer('page-portfolio')

  return (
    <div className="space-y-8">
      <SectionHeader
        title={content.experience.sectionTitle.value}
        variant="underline"
      />
      <div className="space-y-6">
        {PORTFOLIO_EXPERIENCES.map((experience) => {
          const exp = content.experience.items[experience.id]

          return (
            <Card key={experience.id} variant="soft" className="gap-0 p-0">
              <CardHeader className="gap-3 pt-5 pb-4">
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
              <CardContent className="space-y-4 pb-4">
                <div className="text-muted-foreground text-sm leading-6">
                  <p>
                    {content.experience.businessLabel} {exp.business}
                  </p>
                  <p>
                    {content.experience.capitalLabel} {exp.capital} /{' '}
                    {content.experience.employeesLabel} {exp.employees}
                  </p>
                </div>
                <ul className="text-foreground list-inside list-disc pl-2 text-sm leading-relaxed">
                  {(exp.responsibilities as ReadonlyArray<{ value: string }>).map((resp) => (
                    <li key={resp.value}>{resp.value}</li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 pt-0 pb-5">
                  {experience.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
