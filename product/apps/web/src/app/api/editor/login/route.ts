import { getLocalizedUrl } from 'intlayer'
import { parseEditorLoginInput } from '@/features/content-editor/editor-input.assemble'
import {
  checkEditorLoginRateLimit,
  clearEditorLoginRateLimit,
  createEditorAdminSession,
  isSameOriginEditorRequest,
  verifyEditorAdminPassword,
} from '@/features/editor-auth/editor-session'

function redirectTo(path: string, locale: string) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: getLocalizedUrl(path, locale),
      'Cache-Control': 'private, no-store',
    },
  })
}

// Login must be dispatched only through a route-bound HTTP endpoint, not a
// Server Action ID that Next.js can forward from another page. This path is
// also the external WAF ingress contract.
export async function POST(request: Request) {
  if (!isSameOriginEditorRequest(request)) {
    return new Response(null, {
      status: 403,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }

  // Server Actions used to impose this limit before dispatch. Preserve it
  // for the new Route Handler without trusting client Content-Length.
  const limit = 1024 * 1024
  let received = 0
  const body = request.body?.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      received += chunk.byteLength
      if (received > limit) throw new Error('Editor login request too large')
      controller.enqueue(chunk)
    },
  }))
  let formData: FormData | null
  try {
    formData = await new Response(body, {
      headers: { 'Content-Type': request.headers.get('content-type') ?? '' },
    }).formData()
  } catch {
    if (received > limit) {
      return new Response(null, {
        status: 413,
        headers: { 'Cache-Control': 'private, no-store' },
      })
    }
    formData = null
  }
  const parsed = parseEditorLoginInput({
    locale: formData?.get('locale') ?? null,
    password: formData?.get('password') ?? null,
  })

  if (!parsed.success) {
    return redirectTo('/editor/login?error=invalid', 'ja')
  }

  if (
    !(await checkEditorLoginRateLimit()) ||
    !verifyEditorAdminPassword(parsed.data.password)
  ) {
    // Preserve the existing process-local budget and invalid-login delay.
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return redirectTo('/editor/login?error=invalid', parsed.data.locale)
  }

  await clearEditorLoginRateLimit()
  await createEditorAdminSession()
  return redirectTo('/editor', parsed.data.locale)
}
