import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { projectRoot } from './context.ts'
import { createStaticServer } from './serve.ts'

const outDir = join(projectRoot(), 'dist')
const port = Number(process.env['PORT'] ?? 4321)

const server = createStaticServer(async (path) => {
  try {
    return { contents: new Uint8Array(await readFile(join(outDir, path))) }
  } catch {
    return undefined
  }
})

server.listen(port, () => {
  console.log(`Serving dist/ on http://localhost:${port}`)
})
