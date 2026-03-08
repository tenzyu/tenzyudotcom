import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/config/site'
import { ROBOTS_RULES } from '@/config/site-policy'

const robots = (): MetadataRoute.Robots => {
  return {
    rules: ROBOTS_RULES,
    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}

export default robots
