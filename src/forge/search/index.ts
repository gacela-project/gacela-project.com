/**
 * Pages to search index.
 *
 * A result that lands you at the top of a 3000 word page has only told you
 * which page to read. So a page becomes several documents: one for the page
 * itself and one for every h2/h3 section in it, each carrying the anchor that
 * scrolls straight to the passage that matched.
 */

import type { Heading, RenderedPage, SearchDocument } from '../types.ts'
import { collapse, splitSections, stripMarkup } from './internal/html.ts'

/**
 * Enough text to score and to build an excerpt from, and no more: the index is
 * downloaded by every visitor who opens search, so every document pays for its
 * own length.
 */
const MAX_TEXT = 600

const COLLECTION_CRUMB: Readonly<Record<string, string>> = { docs: 'Docs' }

export function buildSearchIndex(pages: readonly RenderedPage[]): SearchDocument[] {
  const documents: SearchDocument[] = []

  for (const page of pages) {
    if (page.frontmatter.unlisted === true) continue
    /* Archived versions stay out: a result pointing at an old release would
       answer a current question with an old answer, without saying so. */
    if (page.version !== undefined) continue

    const title = pageTitle(page)
    documents.push({
      route: page.route,
      title,
      crumb: crumbFor(page, [title]),
      /* The whole page, headings included: a page-level hit should be findable
         by anything on it, and MAX_TEXT keeps the cost of that flat. */
      text: truncate(stripMarkup(page.html) || collapse(page.text)),
    })

    const anchors = anchorLookup(page.headings)
    let parent: string | undefined

    for (const section of splitSections(page.html)) {
      if (section.depth === 2) parent = section.title
      if (section.title === '') continue

      const id = section.id ?? anchors(section.depth, section.title)
      /* No id means no way to link to the passage, and a result that cannot be
         opened is worse than one that was never offered. */
      if (id === undefined || id === '') continue

      const trail = section.depth > 2 && parent !== undefined ? [parent, section.title] : [section.title]
      documents.push({
        route: `${page.route}#${id}`,
        title: section.title,
        crumb: [title, ...trail].join(' / '),
        text: truncate(stripMarkup(section.html)),
      })
    }
  }

  return documents
}

/** Compact JSON: this is written to disk and fetched by the browser, not read by a person. */
export function serializeSearchIndex(documents: readonly SearchDocument[]): string {
  return JSON.stringify(documents)
}

function pageTitle(page: RenderedPage): string {
  const declared = page.frontmatter.title?.trim()
  if (declared !== undefined && declared !== '') return declared

  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i.exec(page.html)
  const heading = h1 === null ? '' : stripMarkup(h1[1] ?? '')
  if (heading !== '') return heading

  return routeTitle(page.route)
}

function routeTitle(route: string): string {
  const segment = route.split('/').filter(Boolean).pop()
  if (segment === undefined) return 'Home'
  const words = segment.replace(/[-_]+/g, ' ').trim()
  return words === '' ? 'Home' : words.charAt(0).toUpperCase() + words.slice(1)
}

function crumbFor(page: RenderedPage, trail: readonly string[]): string {
  const root = COLLECTION_CRUMB[page.collection]
  return (root === undefined ? trail : [root, ...trail]).join(' / ')
}

/**
 * Headings rendered without an id can still be linked to, because the renderer
 * recorded the ids it minted. Matches are consumed as they are handed out, so
 * two sections with the same wording get the two ids the renderer made unique.
 */
function anchorLookup(headings: readonly Heading[]): (depth: number, title: string) => string | undefined {
  const remaining = headings.map((heading) => ({ ...heading, key: stripMarkup(heading.text) }))

  return (depth, title) => {
    const at = remaining.findIndex((heading) => heading.depth === depth && heading.key === title)
    if (at === -1) return undefined
    const [found] = remaining.splice(at, 1)
    return found?.id
  }
}

function truncate(text: string): string {
  if (text.length <= MAX_TEXT) return text

  const head = text.slice(0, MAX_TEXT - 1)
  const lastSpace = head.lastIndexOf(' ')
  return `${(lastSpace > 0 ? head.slice(0, lastSpace) : head).trimEnd()}…`
}
