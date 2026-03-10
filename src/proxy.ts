import type { NextRequest } from 'next/server'
import { intlayerProxy } from 'next-intlayer/proxy'

export function proxy(request: NextRequest) {
  const response = intlayerProxy(request)
  response.headers.set('x-pathname', request.nextUrl.pathname)

  return response
}

export const config = {
  matcher:
    '/((?!api|static|assets|robots|sitemap|sw|service-worker|manifest|.*\\..*|_next).*)',
}
