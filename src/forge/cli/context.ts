import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { SiteConfig } from '../types.ts'

/** The repository root, derived from this file rather than the caller's cwd. */
export function projectRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
}

/**
 * Loads site.config.ts by path rather than by import specifier, so the CLI
 * works from any working directory. The optional cache key exists for the dev
 * server, which needs a fresh module after the config file changes.
 */
export async function loadSiteConfig(root: string, cacheKey?: string): Promise<SiteConfig> {
  const path = join(root, 'site.config.ts')
  const specifier = cacheKey === undefined ? path : `${path}?v=${cacheKey}`
  const module: { site: SiteConfig } = await import(specifier)

  return module.site
}

/**
 * The Gacela release the site currently documents. A workflow keeps this file
 * in step with the framework's releases, so it is data rather than config.
 */
export async function readVersion(root: string): Promise<string> {
  const raw = await readFile(join(root, 'data/gacela.json'), 'utf8')
  const parsed: unknown = JSON.parse(raw)

  if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
    throw new Error('data/gacela.json must be an object with a "version" key.')
  }

  return String((parsed as { version: unknown }).version)
}
