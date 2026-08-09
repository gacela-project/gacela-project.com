import { build } from '../pipeline.ts'
import type { Output } from '../types.ts'
import { loadSiteConfig, projectRoot, readVersion } from './context.ts'

/**
 * One build, in a process of its own, for the development server.
 *
 * The server cannot call the pipeline directly and see a change to it. Node
 * caches a module once it is imported, and nothing invalidates that cache, so a
 * rebuild in the server's own process re-runs the generator as it was when the
 * server started: editing a template or a plugin would rebuild every page and
 * produce byte for byte what it produced before.
 *
 * A process is the one thing that does start with an empty cache. This runs the
 * build, hands the result back, and exits, so the next change is built by a
 * process that has never seen the old code.
 */

export type BuildMessage =
  | { readonly ok: true; readonly pages: number; readonly outputs: readonly Output[] }
  | { readonly ok: false; readonly message: string }

const send = (message: BuildMessage): void => {
  process.send?.(message)
}

try {
  const root = projectRoot()
  const [site, version] = await Promise.all([loadSiteConfig(root), readVersion(root)])
  const result = await build({ site, root, version })

  send({ ok: true, pages: result.pages.length, outputs: result.outputs })
} catch (error) {
  send({ ok: false, message: error instanceof Error ? error.message : String(error) })
}
