import type { NavGroup, NavLink, NavState, Page, SiteConfig, VersionTargets } from '../types.ts'

/**
 * The documentation reading order, as one flat list.
 *
 * The sidebar groups are for the eye; prev and next walk straight through them,
 * because a reader working through the docs should not fall off the end of a
 * group and have to find their own way into the next one.
 */
export function flattenSidebar(groups: readonly NavGroup[]): NavLink[] {
  return groups.flatMap((group) => [...group.items])
}

export function navStateFor(route: string, groups: readonly NavGroup[]): NavState {
  const normalized = normalize(route)
  const items = flattenSidebar(groups)
  const position = items.findIndex((item) => normalize(item.route) === normalized)

  if (position === -1) {
    return {
      groups,
      current: undefined,
      previous: undefined,
      next: undefined,
      groupTitle: undefined,
    }
  }

  return {
    groups,
    current: items[position],
    previous: items[position - 1],
    next: items[position + 1],
    groupTitle: groups.find((group) =>
      group.items.some((item) => normalize(item.route) === normalized),
    )?.title,
  }
}

function normalize(route: string): string {
  return route.length > 1 ? route.replace(/\/+$/, '') : route
}

/**
 * Where the version switcher's entries lead from a given page.
 *
 * A reader on /docs/facade who switches to 1.x should land on the same topic,
 * /docs/1.x/facade, not at the start of the archive; only when the topic does
 * not exist in the target version does the switch fall back to that version's
 * landing page. Computed at build time, so it costs no script.
 */
export function versionSwitchTargets(
  page: Pick<Page, 'collection' | 'route' | 'version'>,
  site: SiteConfig,
): VersionTargets | undefined {
  const archives = site.archives ?? []
  if (archives.length === 0) return undefined

  const slug = docSlug(page)

  const current =
    slug === undefined || slug === ''
      ? '/docs'
      : hasRoute(site.sidebar, `/docs/${slug}`)
        ? `/docs/${slug}`
        : '/docs'

  const byArchive = Object.fromEntries(
    archives.map((archive) => {
      const root = `/docs/${archive.version}`
      const target =
        slug === undefined || slug === ''
          ? root
          : hasRoute(archive.sidebar, `${root}/${slug}`)
            ? `${root}/${slug}`
            : root

      return [archive.version, target]
    }),
  )

  return { current, byArchive }
}

/** The page's name within its own docs tree: "facade", "" for an index, undefined outside docs. */
function docSlug(page: Pick<Page, 'collection' | 'route' | 'version'>): string | undefined {
  if (page.collection !== 'docs') return undefined

  const root = page.version === undefined ? '/docs' : `/docs/${page.version}`

  return page.route === root ? '' : page.route.slice(root.length + 1)
}

function hasRoute(groups: readonly NavGroup[], route: string): boolean {
  return flattenSidebar(groups).some((item) => item.route === route)
}
