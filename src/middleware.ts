import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Create a new response object
  const response = NextResponse.next()

  // Add the full URL path including search params to x-current-path header
  response.headers.set('x-current-path', request.url)

  return response
}

export const config = {
  matcher: '/:path*',
}
