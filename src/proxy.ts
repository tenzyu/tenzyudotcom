import type { NextRequest } from 'next/server'
import { intlayerProxy } from 'next-intlayer/proxy'

export function proxy(request: NextRequest) {
  // intlayerProxy handles the i18n routing (rewrites/redirects).
  return intlayerProxy(request)
}

export default proxy

export const config = {
  matcher:
    '/((?!api|static|assets|robots|sitemap|sw|service-worker|manifest|.*\\..*|_next).*)',
}
