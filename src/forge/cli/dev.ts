import { fork } from 'node:child_process'
import { watch } from 'node:fs'
import { join } from 'node:path'

import type { BuildMessage } from './build-worker.ts'
import { projectRoot } from './context.ts'
import { GENERATION_PATH, injectLiveReload } from './live-reload.ts'
import { createStaticServer } from './serve.ts'

/**
 * Development server.
 *
 * The whole site builds in well under a second, so there is no incremental
 * pipeline and no module graph to invalidate: a change rebuilds everything
 * into memory and the next request gets it. Simpler, and it can never serve a
 * stale page because part of the graph was missed.
 *
 * The build itself runs in a separate process, which is what lets a change to
 * the generator or a template take effect: see build-worker.ts. This process
 * only watches, holds the result and serves it, so the port stays bound and the
 * page in the browser keeps its connection across a rebuild.
 */

const root = projectRoot()
const port = Number(process.env['PORT'] ?? 4321)
const worker = new URL('build-worker.ts', import.meta.url)

/** Long enough to swallow the burst of events one save produces. */
const COALESCE_MS = 30

let outputs = new Map<string, string | Uint8Array>()
let generation = 0
let building: Promise<void> = Promise.resolve()

function rebuild(): Promise<void> {
  const started = performance.now()

  return new Promise((resolve) => {
    const child = fork(worker, {
      /* The default serialiser is JSON, which cannot carry the byte arrays the
         binary outputs are made of. */
      serialization: 'advanced',
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    })

    let answered = false

    child.on('message', (message: BuildMessage) => {
      answered = true

      if (!message.ok) {
        console.error(`Build failed: ${message.message}`)
        return
      }

      outputs = new Map(message.outputs.map((output) => [output.path, output.contents]))
      generation += 1

      console.log(`Rebuilt ${message.pages} pages in ${Math.round(performance.now() - started)}ms`)
    })

    /* A build that dies without a word still has to release the request that is
       waiting on it, or the server answers nothing until the next save. */
    child.on('exit', (code) => {
      if (!answered) console.error(`Build failed: the builder exited with code ${code ?? 0}`)
      resolve()
    })

    child.on('error', (error) => {
      answered = true
      console.error(`Build failed: ${error.message}`)
      resolve()
    })
  })
}

/**
 * One build at a time, and one more if anything changed while it ran.
 *
 * Saving a file raises several events, and an editor writing a directory raises
 * one per file. Without this each would start a process of its own.
 */
let running = false
let again = false
let timer: NodeJS.Timeout | undefined

function scheduleRebuild(): void {
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (running) {
      again = true
      return
    }

    running = true
    building = rebuild().finally(() => {
      running = false

      if (again) {
        again = false
        scheduleRebuild()
      }
    })
  }, COALESCE_MS)
}

building = rebuild()

const server = createStaticServer(async (path) => {
  await building

  if (path === GENERATION_PATH) return { contents: String(generation) }

  const contents = outputs.get(path)
  if (contents === undefined) return undefined

  /* The watcher is added on the way out rather than built in, so what the
     pipeline produced stays exactly what production will serve. */
  if (path.endsWith('.html') && typeof contents === 'string') {
    return { contents: injectLiveReload(contents) }
  }

  return { contents }
})

server.listen(port, () => {
  console.log(`Gacela site on http://localhost:${port}`)
})

for (const directory of ['content', 'src', 'public', 'data']) {
  watch(join(root, directory), { recursive: true }, scheduleRebuild)
}

watch(join(root, 'site.config.ts'), scheduleRebuild)
