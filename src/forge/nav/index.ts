import type { NavGroup, NavLink, NavState } from '../types.ts'

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
