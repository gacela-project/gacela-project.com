import { describe, expect, it } from 'vitest'
import { flattenSidebar, navStateFor } from '../../src/forge/nav/index.ts'
import type { NavGroup } from '../../src/forge/types.ts'

const sidebar: readonly NavGroup[] = [
  {
    title: 'Getting started',
    items: [
      { title: 'Quickstart', route: '/docs/quickstart' },
      { title: 'Bootstrap', route: '/docs/bootstrap' },
    ],
  },
  {
    title: 'Core concepts',
    items: [
      { title: 'Facade', route: '/docs/facade' },
      { title: 'Factory', route: '/docs/factory' },
    ],
  },
]

describe('flattenSidebar', () => {
  it('returns every item in reading order', () => {
    expect(flattenSidebar(sidebar).map((item) => item.route)).toEqual([
      '/docs/quickstart',
      '/docs/bootstrap',
      '/docs/facade',
      '/docs/factory',
    ])
  })

  it('handles an empty sidebar', () => {
    expect(flattenSidebar([])).toEqual([])
  })
})

describe('navStateFor', () => {
  it('finds the current page and its group', () => {
    const state = navStateFor('/docs/facade', sidebar)

    expect(state.current).toEqual({ title: 'Facade', route: '/docs/facade' })
    expect(state.groupTitle).toBe('Core concepts')
  })

  it('links to the neighbours in reading order, across group boundaries', () => {
    const state = navStateFor('/docs/bootstrap', sidebar)

    expect(state.previous?.route).toBe('/docs/quickstart')
    expect(state.next?.route).toBe('/docs/facade')
  })

  it('has no previous on the first page and no next on the last', () => {
    expect(navStateFor('/docs/quickstart', sidebar).previous).toBeUndefined()
    expect(navStateFor('/docs/factory', sidebar).next).toBeUndefined()
  })

  it('returns an empty state for a page that is not in the sidebar', () => {
    const state = navStateFor('/about', sidebar)

    expect(state.current).toBeUndefined()
    expect(state.previous).toBeUndefined()
    expect(state.next).toBeUndefined()
    expect(state.groupTitle).toBeUndefined()
  })

  it('always exposes the full sidebar, so navigation renders on every page', () => {
    expect(navStateFor('/about', sidebar).groups).toEqual(sidebar)
  })

  it('ignores a trailing slash when matching the current page', () => {
    expect(navStateFor('/docs/facade/', sidebar).current?.route).toBe('/docs/facade')
  })
})
