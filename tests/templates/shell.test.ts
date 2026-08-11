import { describe, expect, it } from 'vitest'

import { html } from '../../src/forge/render/index.ts'
import type { SiteConfig } from '../../src/forge/types.ts'
import { documentShell, type ShellContext } from '../../src/templates/shell.ts'

const site = {
  title: 'Gacela',
  tagline: 'Build modular PHP applications',
  description: 'A PHP framework for modular applications.',
  origin: 'https://gacela-project.com',
  repository: 'https://github.com/gacela-project/gacela',
  siteRepository: 'https://github.com/gacela-project/gacela-project.com',
  packagist: 'https://packagist.org/packages/gacela-project/gacela',
  social: [],
  headerLinks: [{ title: 'About', route: '/about' }],
  sidebar: [{ title: 'Getting started', items: [{ title: 'Documentation', route: '/docs' }] }],
  redirects: {},
} as unknown as SiteConfig

function shell(overrides: Partial<ShellContext> = {}): string {
  return documentShell({
    site,
    assets: { css: '/assets/facet.css', js: '/assets/site.js', fonts: [] },
    version: '2.1.0',
    route: '/docs/facade',
    title: 'Facade · Gacela',
    description: 'The entry point of a module.',
    markdownPath: '/docs/facade.md',
    main: html`<main></main>`,
    layout: 'docs',
    ...overrides,
  })
}

/**
 * The Markdown mirror is advertised in the head, so an agent holding the HTML
 * can find the source without being told the convention. The previous site did
 * this through VitePress's transformHead.
 */
describe('markdown alternate link', () => {
  it('points a page at its mirror, absolutely', () => {
    expect(shell()).toContain(
      '<link rel="alternate" type="text/markdown" href="https://gacela-project.com/docs/facade.md" />',
    )
  })

  /* No mirror is written for an unlisted page, so advertising one would send
     whoever followed it to a 404. */
  it('offers nothing when the page has no mirror', () => {
    const html = shell({ route: '/design-system', markdownPath: undefined })

    expect(html).not.toContain('text/markdown')
  })
})

describe('version menu', () => {
  const archived = {
    ...site,
    archives: [
      {
        version: '1.x',
        label: '1.21.0',
        sidebar: [{ title: 'Getting started', items: [{ title: 'Quickstart', route: '/docs/1.x/quickstart' }] }],
      },
    ],
  } as unknown as SiteConfig

  it('stays a plain release link while there is nothing to choose between', () => {
    const html = shell()

    expect(html).not.toContain('version-menu')
    expect(html).toContain('releases/tag/2.1.0')
  })

  it('becomes a dropdown once an archive exists', () => {
    const html = shell({ site: archived })

    expect(html).toContain('<details class="version-menu')
    expect(html).toContain('href="/docs"')
    expect(html).toContain('href="/docs/1.x"')
    expect(html).toContain('1.21.0')
  })

  it('keeps the release notes reachable from inside the menu', () => {
    const html = shell({ site: archived })

    expect(html).toContain('releases/tag/2.1.0')
  })

  it('shows the version the page belongs to on the summary', () => {
    const html = shell({ site: archived, route: '/docs/1.x/quickstart', archiveLabel: '1.21.0' })

    expect(html).toMatch(/<summary[^>]*>[\s\S]*?1\.21\.0[\s\S]*?<\/summary>/)
  })

  it('is present in the mobile drawer as well', () => {
    const html = shell({ site: archived })

    expect(html.match(/class="version-menu/g)?.length).toBeGreaterThanOrEqual(2)
  })
})

describe('reference menu version scoping', () => {
  /* The Reference menu only renders beside a "/docs" header link. */
  const richer = {
    ...site,
    headerLinks: [{ title: 'Get started', route: '/docs' }],
    sidebar: [
      { title: 'Core', items: [{ title: 'Facade', route: '/docs/facade' }] },
    ],
  } as unknown as SiteConfig

  it('lists the current tree by default', () => {
    const html = shell({ site: richer })

    expect(html).toContain('href="/docs/facade"')
  })

  /* On an archived page every piece of chrome speaks for the same version;
     the switcher is the one cross-version control. */
  it('lists the tree of the version being read when one is given', () => {
    const html = shell({
      site: richer,
      route: '/docs/1.x/quickstart',
      docsTree: [{ title: 'Old', items: [{ title: 'Quickstart', route: '/docs/1.x/quickstart' }] }],
    })

    expect(html).toContain('href="/docs/1.x/quickstart"')
    expect(html).not.toContain('href="/docs/facade"')
  })
})

describe('canonical override', () => {
  it('lets an archived page declare its current equivalent as canonical', () => {
    const html = shell({ route: '/docs/1.x/facade', canonicalRoute: '/docs/facade' })

    expect(html).toContain('<link rel="canonical" href="https://gacela-project.com/docs/facade" />')
    expect(html).toContain('<meta property="og:url" content="https://gacela-project.com/docs/facade" />')
  })
})
