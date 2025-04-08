import type { NextConfig } from "next";

import { i18n } from './next-i18next.config'

const nextConfig: NextConfig = {
  i18n,
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
  },
};

export default nextConfig;
