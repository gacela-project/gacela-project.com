import { describe, expect, it } from 'vitest'
import { flattenSidebar, navStateFor, versionSwitchTargets } from '../../src/forge/nav/index.ts'
import type { NavGroup, SiteConfig } from '../../src/forge/types.ts'

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

describe('versionSwitchTargets', () => {
  const site = {
    sidebar: [
      {
        title: 'Docs',
        items: [
          { title: 'Quickstart', route: '/docs/quickstart' },
          { title: 'Upgrading', route: '/docs/upgrading' },
        ],
      },
    ],
    archives: [
      {
        version: '1.x',
        label: '1.21.0',
        sidebar: [
          { title: 'Docs', items: [{ title: 'Quickstart', route: '/docs/1.x/quickstart' }] },
        ],
      },
    ],
  } as unknown as SiteConfig

  it('is nothing while there is no archive to switch to', () => {
    const bare = { sidebar: [], archives: [] } as unknown as SiteConfig

    expect(
      versionSwitchTargets({ collection: 'docs', route: '/docs/quickstart' }, bare),
    ).toBeUndefined()
  })

  it('keeps the reader on the same page when the other version has it', () => {
    const targets = versionSwitchTargets({ collection: 'docs', route: '/docs/quickstart' }, site)

    expect(targets).toEqual({
      current: '/docs/quickstart',
      byArchive: { '1.x': '/docs/1.x/quickstart' },
    })
  })

  it('falls back to the version landing page when the page does not exist there', () => {
    const targets = versionSwitchTargets({ collection: 'docs', route: '/docs/upgrading' }, site)

    expect(targets?.byArchive['1.x']).toBe('/docs/1.x')
  })

  it('maps an archived page back to its current equivalent', () => {
    const targets = versionSwitchTargets(
      { collection: 'docs', route: '/docs/1.x/quickstart', version: '1.x' },
      site,
    )

    expect(targets).toEqual({
      current: '/docs/quickstart',
      byArchive: { '1.x': '/docs/1.x/quickstart' },
    })
  })

  it('maps an archived page with no current equivalent to the docs landing', () => {
    const withExtra = {
      ...site,
      archives: [
        {
          version: '1.x',
          label: '1.21.0',
          sidebar: [{ title: 'Docs', items: [{ title: 'Gone', route: '/docs/1.x/gone' }] }],
        },
      ],
    } as unknown as SiteConfig

    const targets = versionSwitchTargets(
      { collection: 'docs', route: '/docs/1.x/gone', version: '1.x' },
      withExtra,
    )

    expect(targets?.current).toBe('/docs')
  })

  it('sends the indexes to each other', () => {
    const targets = versionSwitchTargets({ collection: 'docs', route: '/docs' }, site)

    expect(targets).toEqual({ current: '/docs', byArchive: { '1.x': '/docs/1.x' } })
  })

  it('offers the landing pages from a page outside the docs', () => {
    const targets = versionSwitchTargets({ collection: 'pages', route: '/about' }, site)

    expect(targets).toEqual({ current: '/docs', byArchive: { '1.x': '/docs/1.x' } })
  })
})
