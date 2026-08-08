import { describe, expect, it } from 'vitest'
import { auditLinks } from '../../src/forge/audit/index.ts'
import type { RenderedPage } from '../../src/forge/types.ts'

const page = (over: Partial<RenderedPage> & Pick<RenderedPage, 'route'>): RenderedPage => ({
  source: `docs${over.route}.md`,
  collection: 'docs',
  frontmatter: {},
  body: '',
  html: '',
  text: '',
  headings: [],
  links: [],
  ...over,
})

describe('auditLinks', () => {
  it('passes when every link resolves', () => {
    const problems = auditLinks(
      [page({ route: '/docs/facade', links: ['/docs/factory'] }), page({ route: '/docs/factory' })],
      { redirects: {}, knownRoutes: [] },
    )

    expect(problems).toEqual([])
  })

  it('reports a link to a page that does not exist', () => {
    const problems = auditLinks([page({ route: '/docs/facade', links: ['/docs/nope'] })], {
      redirects: {},
      knownRoutes: [],
    })

    expect(problems).toHaveLength(1)
    expect(problems[0]?.message).toContain('/docs/nope')
    expect(problems[0]?.source).toBe('docs/docs/facade.md')
  })

  it('accepts a link to a declared redirect', () => {
    const problems = auditLinks([page({ route: '/a', links: ['/old'] })], {
      redirects: { '/old': '/a' },
      knownRoutes: [],
    })

    expect(problems).toEqual([])
  })

  it('accepts a link to a file that is not a page, such as an asset', () => {
    const problems = auditLinks([page({ route: '/a', links: ['/og-image.png'] })], {
      redirects: {},
      knownRoutes: ['/og-image.png'],
    })

    expect(problems).toEqual([])
  })

  it('resolves an anchor against the headings of the target page', () => {
    const problems = auditLinks(
      [
        page({ route: '/docs/facade', links: ['/docs/provider#provides'] }),
        page({
          route: '/docs/provider',
          headings: [{ depth: 2, id: 'provides', text: 'Provides' }],
        }),
      ],
      { redirects: {}, knownRoutes: [] },
    )

    expect(problems).toEqual([])
  })

  it('reports an anchor that no heading provides', () => {
    const problems = auditLinks(
      [
        page({ route: '/docs/facade', links: ['/docs/provider#missing'] }),
        page({ route: '/docs/provider', headings: [] }),
      ],
      { redirects: {}, knownRoutes: [] },
    )

    expect(problems).toHaveLength(1)
    expect(problems[0]?.message).toContain('#missing')
  })

  it('resolves an anchor on the page that declares the link', () => {
    const problems = auditLinks(
      [
        page({
          route: '/about',
          links: ['#why'],
          headings: [{ depth: 2, id: 'why', text: 'Why' }],
        }),
      ],
      { redirects: {}, knownRoutes: [] },
    )

    expect(problems).toEqual([])
  })

  it('follows a redirect that carries an anchor', () => {
    const problems = auditLinks(
      [
        page({ route: '/a', links: ['/why-decoupling'] }),
        page({ route: '/about', headings: [{ depth: 2, id: 'why', text: 'Why' }] }),
      ],
      { redirects: { '/why-decoupling': '/about#why' }, knownRoutes: [] },
    )

    expect(problems).toEqual([])
  })

  it('reports a redirect whose destination does not exist', () => {
    const problems = auditLinks([page({ route: '/a' })], {
      redirects: { '/old': '/gone' },
      knownRoutes: [],
    })

    expect(problems).toHaveLength(1)
    expect(problems[0]?.message).toContain('/gone')
  })

  it('reports each broken link once per page that has it', () => {
    const problems = auditLinks(
      [page({ route: '/a', links: ['/nope'] }), page({ route: '/b', links: ['/nope'] })],
      { redirects: {}, knownRoutes: [] },
    )

    expect(problems).toHaveLength(2)
  })

  it('ignores a trailing slash on either side of the comparison', () => {
    const problems = auditLinks(
      [page({ route: '/a', links: ['/docs/facade/'] }), page({ route: '/docs/facade' })],
      { redirects: {}, knownRoutes: [] },
    )

    expect(problems).toEqual([])
  })
})
