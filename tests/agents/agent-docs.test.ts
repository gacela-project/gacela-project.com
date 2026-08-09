/**
 * The agent-facing outputs: a Markdown mirror of every page, an index, and a
 * single-file context dump. These exist so a coding agent can read the
 * documentation as its source, which means the addresses they contain have to
 * be absolute and have to point at the Markdown, not at the HTML.
 */

import { describe, expect, it } from 'vitest'

import {
  agentDocsOutputs,
  agentDocsRoutes,
  llmsFullContext,
  llmsIndex,
  mirrorMarkdown,
  mirrorPathForRoute,
} from '../../src/forge/agents/index.ts'
import type { RenderedPage, SiteConfig } from '../../src/forge/types.ts'

const site = {
  title: 'Gacela',
  tagline: 'Build modular PHP applications',
  description: 'A PHP framework for modular applications.',
  origin: 'https://gacela-project.com',
  repository: 'https://github.com/gacela-project/gacela',
  siteRepository: 'https://github.com/gacela-project/gacela-project.com',
  packagist: 'https://packagist.org/packages/gacela-project/gacela',
  social: [],
  headerLinks: [],
  sidebar: [
    {
      title: 'Getting started',
      items: [
        { title: 'Documentation', route: '/docs' },
        { title: 'Quickstart', route: '/docs/quickstart' },
      ],
    },
    { title: 'Core concepts', items: [{ title: 'Facade', route: '/docs/facade' }] },
  ],
  redirects: {},
} satisfies SiteConfig

function page(partial: Partial<RenderedPage> & { route: string }): RenderedPage {
  return {
    source: `docs/${partial.route.split('/').pop()}.md`,
    collection: 'docs',
    frontmatter: { title: 'Untitled' },
    body: '',
    html: '',
    headings: [],
    text: '',
    links: [],
    ...partial,
  }
}

describe('mirrorPathForRoute', () => {
  it('appends .md to a page route', () => {
    expect(mirrorPathForRoute('/docs/facade')).toBe('/docs/facade.md')
  })

  it('names the home page index.md, because "/.md" is not a path', () => {
    expect(mirrorPathForRoute('/')).toBe('/index.md')
  })
})

describe('mirrorMarkdown', () => {
  const routes = new Set(['/docs/facade', '/docs/factory', '/'])

  it('rewrites a site-absolute link to the absolute markdown address', () => {
    const source = page({ route: '/docs/facade', body: 'See [Factory](/docs/factory).' })

    expect(mirrorMarkdown(source, routes, site.origin)).toContain(
      '[Factory](https://gacela-project.com/docs/factory.md)',
    )
  })

  it('keeps the anchor on the end of a rewritten link', () => {
    const source = page({ route: '/docs/facade', body: 'See [Factory](/docs/factory#make).' })

    expect(mirrorMarkdown(source, routes, site.origin)).toContain(
      '[Factory](https://gacela-project.com/docs/factory.md#make)',
    )
  })

  it('leaves a link to something that is not a page alone', () => {
    const source = page({ route: '/docs/facade', body: 'See [logo](/gacela-logo.svg).' })

    expect(mirrorMarkdown(source, routes, site.origin)).toContain('[logo](/gacela-logo.svg)')
  })

  it('leaves external links alone', () => {
    const source = page({ route: '/docs/facade', body: 'See [PHP](https://php.net/docs/factory).' })

    expect(mirrorMarkdown(source, routes, site.origin)).toContain('[PHP](https://php.net/docs/factory)')
  })

  it('ends with exactly one newline, whatever the body did', () => {
    const source = page({ route: '/docs/facade', body: '# Facade\n\n\n\n' })

    expect(mirrorMarkdown(source, routes, site.origin)).toBe('# Facade\n')
  })
})

describe('llmsIndex', () => {
  const pages = [
    page({ route: '/docs', frontmatter: { title: 'Documentation', description: 'Start here.' } }),
    page({ route: '/docs/quickstart', frontmatter: { title: 'Quickstart', description: 'Install it.' } }),
    page({ route: '/docs/facade', frontmatter: { title: 'Facade', description: 'The entry point.' } }),
  ]

  it('lists every sidebar group as a heading', () => {
    const index = llmsIndex(site, pages)

    expect(index).toContain('## Getting started')
    expect(index).toContain('## Core concepts')
  })

  it('links each entry to its markdown mirror and carries its description', () => {
    expect(llmsIndex(site, pages)).toContain(
      '- [Quickstart](https://gacela-project.com/docs/quickstart.md): Install it.',
    )
  })

  it('uses the sidebar title, which may be shorter than the page title', () => {
    const shortened = [
      page({
        route: '/docs/facade',
        frontmatter: { title: 'The Facade class in depth', description: 'The entry point.' },
      }),
    ]

    expect(llmsIndex(site, shortened)).toContain('- [Facade](https://gacela-project.com/docs/facade.md)')
  })

  it('skips a sidebar entry with no page behind it rather than emitting a dead link', () => {
    const index = llmsIndex(site, [pages[1]!])

    expect(index).not.toContain('/docs/facade.md')
    expect(index).toContain('/docs/quickstart.md')
  })
})

describe('llmsFullContext', () => {
  const pages = [
    page({ route: '/docs/facade', frontmatter: { title: 'Facade' }, body: '# Facade\n\nThe entry point.' }),
    page({
      route: '/about',
      collection: 'pages',
      source: 'pages/about.md',
      frontmatter: { title: 'About' },
      body: '# About\n',
    }),
    page({
      route: '/design-system',
      frontmatter: { title: 'Design system', unlisted: true },
      body: '# Design system\n',
    }),
  ]

  it('includes the body of every documentation page', () => {
    expect(llmsFullContext(site, pages)).toContain('The entry point.')
  })

  it('labels each page with the address its markdown lives at', () => {
    expect(llmsFullContext(site, pages)).toContain('Source: https://gacela-project.com/docs/facade.md')
  })

  it('leaves out pages that are not documentation', () => {
    expect(llmsFullContext(site, pages)).not.toContain('# About')
  })

  it('leaves out unlisted pages', () => {
    expect(llmsFullContext(site, pages)).not.toContain('# Design system')
  })
})

describe('agentDocsOutputs', () => {
  const pages = [
    page({ route: '/docs/facade', frontmatter: { title: 'Facade', description: 'Entry point.' } }),
    page({ route: '/', collection: 'pages', source: 'pages/index.md', frontmatter: { title: 'Home' } }),
    page({ route: '/404', collection: 'pages', source: 'pages/404.md', frontmatter: { title: 'Lost', unlisted: true } }),
  ]

  it('writes a mirror for every listed page, at the path the .md URL resolves to', () => {
    const paths = agentDocsOutputs(site, pages).map((output) => output.path)

    expect(paths).toContain('docs/facade.md')
    expect(paths).toContain('index.md')
  })

  it('writes no mirror for an unlisted page', () => {
    const paths = agentDocsOutputs(site, pages).map((output) => output.path)

    expect(paths).not.toContain('404.md')
  })

  it('writes both agent entry points', () => {
    const paths = agentDocsOutputs(site, pages).map((output) => output.path)

    expect(paths).toContain('llms.txt')
    expect(paths).toContain('llms-full.txt')
  })
})

describe('agentDocsRoutes', () => {
  it('reports every address it publishes, so the link audit knows they exist', () => {
    const routes = agentDocsRoutes([
      page({ route: '/docs/facade' }),
      page({ route: '/404', frontmatter: { title: 'Lost', unlisted: true } }),
    ])

    expect(routes).toContain('/docs/facade.md')
    expect(routes).toContain('/llms.txt')
    expect(routes).toContain('/llms-full.txt')
    expect(routes).not.toContain('/404.md')
  })
})
