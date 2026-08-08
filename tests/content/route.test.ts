import { describe, expect, it } from 'vitest'
import { routeFor } from '../../src/forge/content/index.ts'

describe('routeFor', () => {
  it('maps a documentation file to its documentation route', () => {
    expect(routeFor('docs/facade.md')).toEqual({ collection: 'docs', route: '/docs/facade' })
  })

  it('maps the pages index to the site root', () => {
    expect(routeFor('pages/index.md')).toEqual({ collection: 'pages', route: '/' })
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
})
