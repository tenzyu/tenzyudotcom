import { memo } from 'react'

import { MY_LINKS } from '@/data/links'

import { LinkCard } from './link-card'

export const LinkList = memo(function LinkList() {
  return (
    <nav aria-label="Social links" className="mx-auto w-full max-w-4xl">
      <ul className="xs:grid-cols-2 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-3">
        {MY_LINKS.map((link) => (
          <li key={link.shortenUrl}>
            <LinkCard link={link} />
          </li>
        ))}
      </ul>
    </nav>
  )
})
