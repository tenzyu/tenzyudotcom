import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn-ui/card'
import { Badge } from '@/components/shadcn-ui/badge'
import { type LucideIcon } from 'lucide-react'

export type BadgeInfo = {
  icon: LucideIcon
  text: string
  bgColor: string
  textColor: string
}

export type EnvironmentCardProps = {
  title: string
  subtitle: string
  icon: LucideIcon
  description: string
  theme: {
    bg: string
    border: string
    iconBg: string
    titleColor: string
    subtitleColor: string
  }
  badges: BadgeInfo[]
}

export function EnvironmentCard({
  title,
  subtitle,
  icon: Icon,
  description,
  theme,
  badges,
}: EnvironmentCardProps) {
  return (
    <Card
      className={`relative ${theme.bg} ${theme.border} gap-y-1 shadow-lg transition-all duration-300 hover:shadow-xl`}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 ${theme.iconBg} rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className={`text-xl ${theme.titleColor}`}>
              {title}
            </CardTitle>
            <CardDescription className={theme.subtitleColor}>
              {subtitle}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge
              key={badge.text}
              variant="secondary"
              className={`${badge.bgColor} ${badge.textColor}`}
            >
              <badge.icon className="mr-1 h-3 w-3" />
              {badge.text}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-slate-600">{description}</p>
      </CardContent>
    </Card>
  )
}
