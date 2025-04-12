import { MY_LINKS } from '@/data/links'
import { memo } from 'react'
import { LinkCard } from './link-card'

export const LinkList = memo(function LinkList() {
  return (
    <nav aria-label='Social links' className='w-full max-w-4xl mx-auto'>
      <ul className='grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 list-none p-0'>
        {MY_LINKS.map(link => (
          <li key={link.shortenUrl}>
            <LinkCard link={link} />
          </li>
        ))}
      </ul>
    </nav>
  )
})
