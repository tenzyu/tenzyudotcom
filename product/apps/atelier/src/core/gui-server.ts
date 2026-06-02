import { handleGuiRequest, type GuiServerOptions, type GuiRoute } from './gui'

export type StartedGuiServer = {
  port: number
  host: string
  stop: () => void
}

function methodOf(value: string | null): 'GET' | 'POST' {
  if (!value) return 'GET'
  const upper = value.toUpperCase()
  if (upper === 'POST') return 'POST'
  return 'GET'
}

export function startGuiServer(options: GuiServerOptions & { port: number; host: string }): StartedGuiServer {
  const bunServer = Bun.serve({
    hostname: options.host,
    port: options.port,
    development: false,
    fetch(request) {
      const url = new URL(request.url)
      const route: GuiRoute = {
        method: methodOf(request.method),
        pathname: url.pathname + url.search,
      }
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        return request.text().then((body) => {
          const response = handleGuiRequest(route, body, options)
          return new Response(response.body, {
            status: response.status,
            headers: { 'content-type': response.contentType, 'cache-control': 'no-store' },
          })
        })
      }
      const response = handleGuiRequest(route, '', options)
      return new Response(response.body, {
        status: response.status,
        headers: { 'content-type': response.contentType, 'cache-control': 'no-store' },
      })
    },
  })

  return {
    port: bunServer.port ?? options.port,
    host: options.host,
    stop: () => bunServer.stop(),
  }
}
