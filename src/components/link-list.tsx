import { Card, CardContent } from '@/components/ui/card'
import { MY_LINKS } from '@/data/links'
import { LinkCard } from './link-card'

export function LinkList() {
  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardContent className='px-6'>
        <div className='space-y-2'>
          {MY_LINKS.map(link => (
            <LinkCard key={link.shortenUrl} link={link} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
