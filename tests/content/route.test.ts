import { describe, expect, it } from 'vitest'
import { routeFor } from '../../src/forge/content/index.ts'

describe('routeFor', () => {
  it('maps a documentation file to its documentation route', () => {
    expect(routeFor('docs/facade.md')).toEqual({ collection: 'docs', route: '/docs/facade' })
  })

  it('maps the pages index to the site root', () => {
    expect(routeFor('pages/index.md')).toEqual({ collection: 'pages', route: '/' })
  })

  it('maps the docs index to the collection root, not to /docs/index', () => {
    expect(routeFor('docs/index.md')).toEqual({ collection: 'docs', route: '/docs' })
  })

  it('maps a standalone page to a top level route', () => {
    expect(routeFor('pages/about.md')).toEqual({ collection: 'pages', route: '/about' })
  })

  it('normalises windows path separators', () => {
    expect(routeFor('docs\\service-map.md')).toEqual({
      collection: 'docs',
      route: '/docs/service-map',
    })
  })

  it('rejects a file outside a known collection', () => {
    expect(() => routeFor('drafts/secret.md')).toThrow(/drafts/)
  })

  it('rejects a nested file, because the flat shape is what keeps routes stable', () => {
    expect(() => routeFor('docs/advanced/extra.md')).toThrow(/nested/i)
  })

  /* A version directory is the one sanctioned nesting: "1.x" in a route is a
     promise, not an accident of the filesystem. */
  it('maps an archived doc under its version', () => {
    expect(routeFor('docs/1.x/facade.md')).toEqual({
      collection: 'docs',
      route: '/docs/1.x/facade',
      version: '1.x',
    })
  })

  it('maps an archive index to the version root', () => {
    expect(routeFor('docs/1.x/index.md')).toEqual({
      collection: 'docs',
      route: '/docs/1.x',
      version: '1.x',
    })
  })

  it('rejects nesting inside a version directory', () => {
    expect(() => routeFor('docs/1.x/advanced/extra.md')).toThrow(/nested/i)
  })

  it('rejects a version directory under pages', () => {
    expect(() => routeFor('pages/1.x/about.md')).toThrow(/nested/i)
  })
})
