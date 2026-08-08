import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

import type { Page } from '../types.ts'
import { parseFrontmatter } from './frontmatter.ts'
import { routeFor } from './route.ts'

/**
 * Reads every markdown file under contentDir into a Page.
 *
 * This is the only place the build touches the content tree. Everything after
 * it works on Page objects, which is what makes the rest of the generator
 * testable without a filesystem.
 */
export async function loadPages(contentDir: string): Promise<Page[]> {
  const entries = await readdir(contentDir, { recursive: true, withFileTypes: true })

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => relative(contentDir, join(entry.parentPath, entry.name)))
    .sort()

  const pages = await Promise.all(files.map((file) => readPage(contentDir, file)))

  assertUniqueRoutes(pages)

  return pages
}

async function readPage(contentDir: string, source: string): Promise<Page> {
  const raw = await readFile(join(contentDir, source), 'utf8')

  try {
    const { frontmatter, body } = parseFrontmatter(raw)
    const { collection, route } = routeFor(source)

    return { source, collection, route, frontmatter, body }
  } catch (cause) {
    throw new Error(`Could not read content file "${source}": ${(cause as Error).message}`, {
      cause,
    })
  }
}

function assertUniqueRoutes(pages: readonly Page[]): void {
  const seen = new Map<string, string>()

  for (const page of pages) {
    const previous = seen.get(page.route)
    if (previous !== undefined) {
      throw new Error(`Route "${page.route}" is claimed by both ${previous} and ${page.source}.`)
    }
    seen.set(page.route, page.source)
  }
}
