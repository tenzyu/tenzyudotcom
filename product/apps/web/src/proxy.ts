import type { NextRequest } from 'next/server'
import { intlayerProxy } from 'next-intlayer/proxy'

export function proxy(request: NextRequest) {
  const response = intlayerProxy(request)
  const pathname = request.nextUrl.pathname

  const rewrite = response.headers.get('x-middleware-rewrite')
  if (rewrite) {
    const target = new URL(rewrite)
    if (target.pathname !== '/') {
      target.pathname = target.pathname.replace(/\/$/, '')
    }
    response.headers.set('x-middleware-rewrite', target.href)
  }

  if (pathname === '/ja' || pathname.startsWith('/ja/')) {
    response.cookies.set('INTLAYER_LOCALE', 'ja', {
      path: '/',
      sameSite: 'lax',
    })
  }

  return response
}

export default proxy

export const config = {
  matcher:
    '/((?!api|static|assets|robots|sitemap|sw|service-worker|manifest|.*\\..*|_next).*)',
}
