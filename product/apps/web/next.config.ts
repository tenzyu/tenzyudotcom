import { withIntlayer } from 'next-intlayer/server'
import createMDX from '@next/mdx'

import type { NextConfig } from 'next'
import { isProduction } from './src/config/env.infra'

const nextConfig: NextConfig = {
  transpilePackages: ['@tenzyu/revisioned-content', '@tenzyu/publishing-domain'],
  skipProxyUrlNormalize: true,
  // Only the synthetic loopback diagnostic build may expose browser source maps.
  productionBrowserSourceMaps:
    process.env.REPO_OPS_FIXTURE_SOURCE_MAPS === '1' &&
    process.env.GITHUB_CONTENT_OWNER === 'fixture' &&
    process.env.GITHUB_CONTENT_REPO === 'editor' &&
    !process.env.VERCEL && !process.env.VERCEL_ENV,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
        search: '',
      },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
      { protocol: 'https', hostname: 'assets.ppy.sh' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: [
      'radix-ui',
      'lucide-react',
      'sonner',
      'class-variance-authority',
      'next-themes',
    ],
    optimizeCss: true,
    webpackBuildWorker: true,
  },
  compiler: {
    removeConsole: isProduction,
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  async redirects() {
    return [
      {
        source: '/u/:path*',
        destination: '/links/:path*',
        permanent: true,
      },
    ]
  },
}

const prettyCodeOptions = {
  theme: 'github-dark',
  keepBackground: true,
}

const autolinkHeadingsOptions = {
  properties: {
    className: 'anchor',
  },
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [['remark-gfm']],
    rehypePlugins: [
      ['rehype-slug'],
      ['rehype-pretty-code', prettyCodeOptions],
      ['rehype-autolink-headings', autolinkHeadingsOptions],
    ],
  },
})

export default async function config() {
  const intlayerConfig = await withIntlayer(nextConfig, {
    enableTurbopack: true,
  })

  return withMDX(intlayerConfig)
}
