import { mirrorPathForRoute } from '../agents/index.ts'
import { docLayout, type DocArchiveContext } from '../../templates/doc.ts'
import { homeLayout } from '../../templates/home.ts'
import { notFoundLayout, pageLayout } from '../../templates/page.ts'
import { documentShell, type ShellAssets } from '../../templates/shell.ts'
import { versionSwitchTargets } from '../nav/index.ts'
import type { NavState, RenderedPage, SiteConfig, VersionTargets } from '../types.ts'
import { html, render, type Raw } from './html.ts'

export type SiteAssets = ShellAssets

export type PageContext = {
  readonly site: SiteConfig
  readonly page: RenderedPage
  readonly nav: NavState
  readonly assets: SiteAssets
  readonly version: string
}

/**
 * Chooses a layout and wraps it in the document shell.
 *
 * Layout selection is the only branch in the render path, and it is driven by
 * the page's own frontmatter plus its collection, so adding a layout means
 * adding a case here and nowhere else.
 */
export function renderPage(context: PageContext): string {
  const { page, site } = context
  const targets = versionSwitchTargets(page, site)
  const archive = archiveContext(context, targets)

  return documentShell({
    site,
    assets: context.assets,
    version: context.version,
    route: page.route,
    versionTargets: targets,
    canonicalRoute: archive?.currentRoute,
    archiveLabel: archive?.label,
    /* The Reference menus follow the version being read; the switcher is the
       one control that crosses versions. */
    docsTree:
      page.version === undefined
        ? undefined
        : site.archives?.find((candidate) => candidate.version === page.version)?.sidebar,
    title: documentTitle(context),
    description: page.frontmatter.description ?? site.description,
    /* The same test the mirror writer uses, so the link and the file cannot
       disagree about whether the page has one. */
    markdownPath:
      page.frontmatter.unlisted === true ? undefined : mirrorPathForRoute(page.route),
    main: body(context, archive),
    layout: page.frontmatter.layout ?? page.collection,
  })
}

function body(context: PageContext, archive: DocArchiveContext | undefined): Raw {
  const { page } = context

  if (page.frontmatter.layout === 'home') return homeLayout({ site: context.site, page })
  if (page.frontmatter.layout === 'not-found') return notFoundLayout()
  if (page.collection === 'docs') {
    return docLayout({ site: context.site, page, nav: context.nav, archive })
  }

  return pageLayout(page)
}

/**
 * What an archived page needs to say about itself: which line it belongs to,
 * and where its current equivalent lives. The equivalent comes from the same
 * mapping the version switcher uses, so the banner, the canonical link and the
 * menu can never disagree about where "current" is.
 */
function archiveContext(
  context: PageContext,
  targets: VersionTargets | undefined,
): DocArchiveContext | undefined {
  const { page, site } = context
  if (page.version === undefined) return undefined

  const archive = site.archives?.find((candidate) => candidate.version === page.version)
  if (archive === undefined) return undefined

  return {
    version: archive.version,
    label: archive.label,
    currentVersion: context.version,
    currentRoute: targets?.current ?? '/docs',
  }
}

function documentTitle(context: PageContext): string {
  const { page, site } = context
  const title = page.frontmatter.title

  if (page.route === '/') return `${site.title}: ${site.tagline}`
  if (title === undefined) return site.title

  return `${title} · ${site.title}`
}

/**
 * A page that only exists to forward an old URL to its new home.
 *
 * A static host cannot issue a 301, so this does the next best thing: it tells
 * crawlers the canonical address, redirects the browser immediately, and still
 * shows a working link if the redirect is blocked.
 */
export function renderRedirect(from: string, to: string, site: SiteConfig): string {
  return `<!doctype html>\n${render(html`<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting to ${to}</title>
    <link rel="canonical" href="${site.origin}${to}" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0; url=${to}" />
  </head>
  <body>
    <p>${from} has moved to <a href="${to}">${to}</a>.</p>
  </body>
</html>`)}\n`
}
