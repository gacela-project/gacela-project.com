import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname } from 'node:path'

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

export type FileLookup = (path: string) => Promise<{ contents: string | Uint8Array } | undefined>

/**
 * Serves the built site the way a static host does: extensionless URLs map to
 * `.html` files, a missing page renders 404.html with a 404 status. Matching
 * production here is the point, because a link that works in preview and
 * breaks in production is the failure this avoids.
 */
export function createStaticServer(lookup: FileLookup) {
  return createServer((request: IncomingMessage, response: ServerResponse) => {
    void respond(request, response, lookup)
  })
}

async function respond(
  request: IncomingMessage,
  response: ServerResponse,
  lookup: FileLookup,
): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost')
  const path = decodeURIComponent(url.pathname)

  for (const candidate of candidates(path)) {
    const file = await lookup(candidate)
    if (file === undefined) continue

    response.writeHead(200, {
      'content-type': TYPES[extname(candidate)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    })
    response.end(file.contents)
    return
  }

  const notFound = await lookup('404.html')
  response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
  response.end(notFound?.contents ?? 'Not found')
}

function candidates(path: string): string[] {
  const clean = path.replace(/^\/+/, '')

  if (clean === '') return ['index.html']
  if (extname(clean) !== '') return [clean]

  return [`${clean}.html`, `${clean}/index.html`]
}
