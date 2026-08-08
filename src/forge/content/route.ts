import type { Collection } from '../types.ts'

export type RouteInfo = {
  readonly collection: Collection
  readonly route: string
}

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

  if (name === undefined || rest.length > 0) {
    throw new Error(
      `Content file "${relativePath}" is nested. Collections are flat, so put it directly in ${directory}/.`,
    )
  }

  if (collection === 'pages') {
    return { collection, route: name === 'index' ? '/' : `/${name}` }
  }

  return { collection, route: `/docs/${name}` }
}
