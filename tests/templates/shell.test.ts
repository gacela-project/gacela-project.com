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
