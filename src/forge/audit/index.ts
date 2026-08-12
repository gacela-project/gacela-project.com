import type { RenderedPage } from '../types.ts'

export type LinkProblem = {
  /** The content file that contains the bad link. */
  readonly source: string
  readonly message: string
}

export type AuditOptions = {
  readonly redirects: Readonly<Record<string, string>>
  /** Paths that exist in the output but are not pages, such as files in public/. */
  readonly knownRoutes: readonly string[]
}

/**
 * Validates every internal link, including its anchor.
 *
 * URLs are the one part of a documentation site that other people build on, so
 * a dead link is treated as a build failure rather than a warning. Anchors are
 * checked too: a link to a heading that was renamed is just as broken as a link
 * to a page that was deleted, and much harder to notice by hand.
 */
export function auditLinks(
  pages: readonly RenderedPage[],
  options: AuditOptions,
): LinkProblem[] {
  const byRoute = new Map(pages.map((page) => [normalize(page.route), page]))
  const known = new Set(options.knownRoutes.map(normalize))
  const problems: LinkProblem[] = []

  const resolve = (target: string): 'ok' | 'no-page' | 'no-anchor' => {
    const [rawPath = '', anchor] = target.split('#')
    const path = normalize(rawPath)

    const redirected = options.redirects[path]
    if (redirected !== undefined && anchor === undefined) return resolve(redirected)

    if (known.has(path)) return 'ok'

    const page = byRoute.get(path)
    if (page === undefined) return 'no-page'
    if (anchor === undefined || anchor === '') return 'ok'

    return page.headings.some((heading) => heading.id === anchor) ? 'ok' : 'no-anchor'
  }

  for (const page of pages) {
    for (const link of page.links) {
      // A bare "#anchor" points at the page it appears on.
      const target = link.startsWith('#') ? `${page.route}${link}` : link
      const outcome = resolve(target)

      if (outcome === 'no-page') {
        problems.push({ source: page.source, message: `links to "${link}", which is not a page` })
      } else if (outcome === 'no-anchor') {
        problems.push({
          source: page.source,
          message: `links to "${link}", but that page has no heading with that anchor`,
        })
      }
    }
  }

  for (const [from, to] of Object.entries(options.redirects)) {
    if (resolve(to) !== 'ok') {
      problems.push({
        source: 'site.config.ts',
        message: `redirect "${from}" points at "${to}", which does not resolve`,
      })
    }
  }

  return problems
}

/**
 * Pages that exist but appear nowhere in the navigation. Not an error: some
 * pages are deliberately reachable only by link. Worth saying out loud, though,
 * because the usual cause is a nav entry someone forgot to add.
 */
export function findOrphans(
  pages: readonly RenderedPage[],
  navRoutes: readonly string[],
  headerRoutes: readonly string[],
): string[] {
  const linked = new Set([...navRoutes, ...headerRoutes].map(normalize))

  for (const page of pages) {
    for (const link of page.links) {
      linked.add(normalize(link.split('#')[0] ?? ''))
    }
  }

  return pages
    .filter((page) => page.frontmatter.unlisted !== true && !linked.has(normalize(page.route)))
    .map((page) => page.route)
    .filter((route) => route !== '/')
}

/**
 * URLs claimed by two output files at once: "docs/1.x.html" beside
 * "docs/1.x/index.html". Every host resolves /docs/1.x to one of the pair,
 * and different hosts pick differently, so the same build serves different
 * pages locally and in production. The build must publish one file per URL.
 *
 * Two shapes stay allowed. A file beside an index-less directory ("docs.html"
 * next to "docs/") is the site's normal form: only the file answers the bare
 * URL. And a pair whose second member is a redirect stub is self-consistent:
 * whichever file a host picks, the reader lands on the same page.
 */
export function findOutputCollisions(
  paths: readonly string[],
  redirectPaths: readonly string[] = [],
): string[] {
  const published = new Set(paths)
  const stubs = new Set(redirectPaths)

  return paths
    .filter((path) => {
      if (!path.endsWith('.html') || stubs.has(path)) return false

      const twin = `${path.slice(0, -5)}/index.html`

      return published.has(twin) && !stubs.has(twin)
    })
    .sort()
}

function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}
