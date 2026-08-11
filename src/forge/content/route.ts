import type { Collection } from '../types.ts'

export type RouteInfo = {
  readonly collection: Collection
  readonly route: string
  /** Set when the file lives in an archived docs line, e.g. "1.x". */
  readonly version?: string
}

/** "1.x", "2.x": a frozen line of an old major, never a specific release. */
const VERSION_DIRECTORY = /^\d+\.x$/

const COLLECTIONS: Record<string, Collection> = {
  docs: 'docs',
  pages: 'pages',
}

/**
 * Turns a path relative to content/ into the URL it will be published at.
 *
 * Both collections are deliberately flat. Nesting would make a route depend on
 * a directory name, and directory names get reorganised, which is how
 * documentation sites end up breaking links they promised to keep.
 *
 * The one sanctioned nesting is a version directory under docs/: "1.x" in
 * a route is a promise made on purpose, not an accident of the filesystem,
 * and the files inside it are frozen, so they cannot be reorganised.
 */
export function routeFor(relativePath: string): RouteInfo {
  const segments = relativePath.replace(/\\/g, '/').replace(/\.md$/, '').split('/')
  const [directory, name, ...rest] = segments

  const collection = directory === undefined ? undefined : COLLECTIONS[directory]
  if (collection === undefined) {
    throw new Error(
      `Content file "${relativePath}" is not in a known collection. Expected docs/ or pages/.`,
    )
  }

  if (collection === 'docs' && name !== undefined && VERSION_DIRECTORY.test(name) && rest.length === 1) {
    const page = rest[0]!

    return {
      collection,
      version: name,
      route: page === 'index' ? `/docs/${name}` : `/docs/${name}/${page}`,
    }
  }

  if (name === undefined || rest.length > 0) {
    throw new Error(
      `Content file "${relativePath}" is nested. Collections are flat, so put it directly in ${directory}/.`,
    )
  }

  if (collection === 'pages') {
    return { collection, route: name === 'index' ? '/' : `/${name}` }
  }

  // The docs index is the landing page of the collection, so it answers at
  // /docs. Publishing it at /docs/index would leave /docs with nothing on it.
  return { collection, route: name === 'index' ? '/docs' : `/docs/${name}` }
}
