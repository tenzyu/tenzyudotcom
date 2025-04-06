import { MY_LINKS } from '@/data/links'
import { LinkCard } from './link-card'

export function LinkList() {
  return (
    <div className='w-full max-w-4xl mx-auto'>
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
        {MY_LINKS.map(link => (
          <LinkCard key={link.shortenUrl} link={link} />
        ))}
      </div>
    </div>
  )
}
