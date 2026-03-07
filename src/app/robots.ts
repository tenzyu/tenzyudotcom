import type { MetadataRoute } from 'next'
import { baseUrl } from '@/app/sitemap'

const robots = (): MetadataRoute.Robots => {
  return {
    rules: { userAgent: '*', allow: ['/'] },
    host: baseUrl,
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

export default robots
