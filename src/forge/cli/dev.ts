import { watch } from 'node:fs'
import { join } from 'node:path'

import { build } from '../pipeline.ts'
import { loadSiteConfig, projectRoot, readVersion } from './context.ts'
import { createStaticServer } from './serve.ts'

/**
 * Development server.
 *
 * The whole site builds in well under a second, so there is no incremental
 * pipeline and no module graph to invalidate: a change rebuilds everything
 * into memory and the next request gets it. Simpler, and it can never serve a
 * stale page because part of the graph was missed.
 */

const root = projectRoot()
const port = Number(process.env['PORT'] ?? 4321)

let outputs = new Map<string, string | Uint8Array>()
let generation = 0
let building: Promise<void> = Promise.resolve()

async function rebuild(): Promise<void> {
  const started = performance.now()

  try {
    const site = await loadSiteConfig(root, String(Date.now()))
    const version = await readVersion(root)
    const result = await build({ site, root, version })

    outputs = new Map(result.outputs.map((output) => [output.path, output.contents]))
    generation += 1

    console.log(`Rebuilt ${result.pages.length} pages in ${Math.round(performance.now() - started)}ms`)
  } catch (error) {
    console.error(`Build failed: ${(error as Error).message}`)
  }
}

building = rebuild()

const server = createStaticServer(async (path) => {
  await building

  if (path === 'dev-generation') return { contents: String(generation) }

  const contents = outputs.get(path)
  return contents === undefined ? undefined : { contents }
})

server.listen(port, () => {
  console.log(`Gacela site on http://localhost:${port}`)
})

for (const directory of ['content', 'src', 'public', 'data']) {
  watch(join(root, directory), { recursive: true }, () => {
    building = rebuild()
  })
}

watch(join(root, 'site.config.ts'), () => {
  building = rebuild()
})
