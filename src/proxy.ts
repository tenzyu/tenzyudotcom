import type { NextRequest } from 'next/server'
import { intlayerProxy } from 'next-intlayer/proxy'

export function proxy(request: NextRequest) {
  // App-level locale precedence contract:
  // 1. explicit locale in the URL
  // 2. persisted locale written by the site switcher
  // 3. Accept-Language
  // 4. configured default locale
  //
  // next-intlayer's proxy already applies that order. We keep this thin wrapper
  // so the precedence remains explicit in app code and regression-tested locally.
  return intlayerProxy(request)
}

export default proxy

export const config = {
  matcher:
    '/((?!api|static|assets|robots|sitemap|sw|service-worker|manifest|.*\\..*|_next).*)',
}
