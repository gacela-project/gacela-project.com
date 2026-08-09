import type { Output, RenderedPage, SiteConfig } from '../../types.ts'

/**
 * Markdown for machines.
 *
 * A coding agent that reads the rendered HTML is reading our layout as much as
 * our documentation. These outputs give it the source instead: one .md per
 * page, an index of them, and a single file with all of it concatenated.
 *
 * Everything here is addressed absolutely. An agent that fetched one file has
 * no base URL to resolve "/docs/facade" against.
 */

const INDEX_FILE = 'llms.txt'
const FULL_FILE = 'llms-full.txt'

/** `/docs/facade` is published at `/docs/facade.md`; the home page at `/index.md`. */
export function mirrorPathForRoute(route: string): string {
  return route === '/' ? '/index.md' : `${route}.md`
}

/** Pages that get a mirror. Unlisted pages are excluded here as everywhere else. */
function listed(pages: readonly RenderedPage[]): readonly RenderedPage[] {
  return pages.filter((page) => page.frontmatter.unlisted !== true)
}

/**
 * One page's body, with every link that points at another page rewritten to the
 * absolute address of that page's mirror. Links to assets and to other sites
 * are left exactly as they were.
 */
export function mirrorMarkdown(
  page: RenderedPage,
  routes: ReadonlySet<string>,
  origin: string,
): string {
  const body = page.body.replace(
    /\]\((\/[^)\s#]*)(#[^)\s]*)?\)/g,
    (match, path: string, anchor: string | undefined) =>
      routes.has(path) ? `](${origin}${mirrorPathForRoute(path)}${anchor ?? ''})` : match,
  )

  return `${body.trim()}\n`
}

/**
 * The index. It follows the sidebar rather than the filesystem, because the
 * sidebar is where the reading order is decided, and an agent benefits from
 * that order as much as a person does.
 */
export function llmsIndex(site: SiteConfig, pages: readonly RenderedPage[]): string {
  const byRoute = new Map(listed(pages).map((page) => [page.route, page]))
  const lines: string[] = [
    `# ${site.title} documentation`,
    '',
    `> ${site.description}`,
    '',
    'Every document below is the source of truth for the feature it describes.',
    '',
  ]

  for (const group of site.sidebar) {
    const entries = group.items.filter((item) => byRoute.has(item.route))
    if (entries.length === 0) continue

    lines.push(`## ${group.title}`, '')

    for (const item of entries) {
      const description = byRoute.get(item.route)?.frontmatter.description
      const address = `${site.origin}${mirrorPathForRoute(item.route)}`

      lines.push(`- [${item.title}](${address})${description === undefined ? '' : `: ${description}`}`)
    }

    lines.push('')
  }

  lines.push(
    '## Everything at once',
    '',
    `- [Complete documentation](${site.origin}/${FULL_FILE}): every page above in one file.`,
    '',
  )

  return `${lines.join('\n').trim()}\n`
}

/** Every documentation page concatenated, each one labelled with its address. */
export function llmsFullContext(site: SiteConfig, pages: readonly RenderedPage[]): string {
  const documentation = listed(pages).filter((page) => page.collection === 'docs')
  const routes = new Set(listed(pages).map((page) => page.route))

  const lines: string[] = [
    `# ${site.title} documentation, complete`,
    '',
    `Index: ${site.origin}/${INDEX_FILE}`,
    '',
  ]

  for (const page of documentation) {
    lines.push(
      '---',
      '',
      `Source: ${site.origin}${mirrorPathForRoute(page.route)}`,
      '',
      mirrorMarkdown(page, routes, site.origin).trim(),
      '',
    )
  }

  return `${lines.join('\n').trim()}\n`
}

export function agentDocsOutputs(
  site: SiteConfig,
  pages: readonly RenderedPage[],
): Output[] {
  const published = listed(pages)
  const routes = new Set(published.map((page) => page.route))

  return [
    ...published.map((page) => ({
      path: mirrorPathForRoute(page.route).replace(/^\//, ''),
      contents: mirrorMarkdown(page, routes, site.origin),
    })),
    { path: INDEX_FILE, contents: llmsIndex(site, pages) },
    { path: FULL_FILE, contents: llmsFullContext(site, pages) },
  ]
}

/**
 * The addresses these outputs occupy. The link audit needs them: they are real
 * URLs that pages link to, but they are not pages, so nothing else knows.
 */
export function agentDocsRoutes(pages: readonly RenderedPage[]): string[] {
  return [
    ...listed(pages).map((page) => mirrorPathForRoute(page.route)),
    `/${INDEX_FILE}`,
    `/${FULL_FILE}`,
  ]
}
