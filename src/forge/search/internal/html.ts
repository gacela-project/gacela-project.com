/**
 * Just enough HTML handling for the search index.
 *
 * Not a parser, and it must not become one: the only markup it ever sees is
 * what our own markdown pipeline produced, which is well formed, has no
 * attribute values containing ">" and never nests an h2 inside an h2. Under
 * those conditions a scan for heading tags is exact, and a scan is a few dozen
 * lines instead of a third runtime dependency.
 */

/** A run of content that begins at an h2 or h3 and ends at the next one. */
export type Section = {
  readonly depth: number
  /** The heading's own id attribute, when the markup carried one. */
  readonly id: string | undefined
  /** Heading text, markup stripped and entities decoded. */
  readonly title: string
  /** The HTML between this heading and the next one, heading excluded. */
  readonly html: string
}

/** Elements whose content is not prose and never belongs in the index. */
const OPAQUE = /<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi

/**
 * Text carried for a screen reader alone, such as the "opens in a new tab"
 * after an external link. It is part of the page's meaning but not of its
 * prose: indexing it would put those words in an excerpt, where a reader who
 * cannot see the page has already been told and a reader who can never needed
 * telling. Whatever is hidden from sight is hidden from search with it.
 */
const HIDDEN = /<span\b[^>]*\bclass="[^"]*\bvisually-hidden\b[^"]*"[^>]*>[\s\S]*?<\/span\s*>/gi

const COMMENT = /<!--[\s\S]*?-->/g

const TAG = /<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi

const HEADING = /<h([23])\b([^>]*)>([\s\S]*?)<\/h\1\s*>/gi

const ID_ATTR = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i

/**
 * Tags that separate words. Everything else is inline: removing it must not
 * introduce a space, or "Facade::method" would come apart in the index.
 */
const BLOCK = new Set([
  'address', 'article', 'aside', 'blockquote', 'br', 'caption', 'dd', 'details', 'div', 'dl', 'dt',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
  'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'summary', 'table', 'tbody', 'td', 'tfoot',
  'th', 'thead', 'tr', 'ul',
])

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  apos: "'",
  bull: '•',
  copy: '©',
  deg: '°',
  ellip: '…',
  gt: '>',
  hellip: '…',
  laquo: '«',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '\u2014',
  middot: '·',
  minus: '−',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
  raquo: '»',
  rdquo: '”',
  reg: '®',
  rsquo: '’',
  times: '×',
  trade: '™',
}

const ENTITY = /&(#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi

const MAX_CODE_POINT = 0x10ffff

export function decodeEntities(value: string): string {
  return value.replace(ENTITY, (whole: string, body: string) => {
    if (!body.startsWith('#')) {
      return NAMED_ENTITIES[body.toLowerCase()] ?? whole
    }
    const hex = body[1] === 'x' || body[1] === 'X'
    const code = Number.parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10)
    if (!Number.isInteger(code) || code <= 0 || code > MAX_CODE_POINT) return whole
    return String.fromCodePoint(code)
  })
}

export function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * Drops comments and opaque elements, repeatedly, because removing one can
 * leave another behind: "<!" and "--" on either side of a comment become a
 * comment opener once the text between them goes, and a single pass has
 * already walked past the join. Each round can only shorten the string, so
 * this settles.
 */
function removeUntilStable(html: string): string {
  let current = html
  let previous: string

  do {
    previous = current
    current = current.replace(COMMENT, '').replace(OPAQUE, ' ').replace(HIDDEN, '')
  } while (current !== previous)

  return current
}

/**
 * HTML to the plain text a reader would see: opaque and hidden elements dropped
 * whole, block tags turned into a space, inline tags removed, entities decoded
 * last so that an escaped "&lt;?php" in a code block never looks like a tag.
 */
export function stripMarkup(html: string): string {
  const withoutOpaque = removeUntilStable(html)
  const withoutTags = withoutOpaque.replace(TAG, (_whole: string, name: string) =>
    BLOCK.has(name.toLowerCase()) ? ' ' : '',
  )
  return collapse(decodeEntities(withoutTags))
}

/** The h2/h3 sections of a page, in document order. Content before the first heading is not one. */
export function splitSections(html: string): Section[] {
  const sections: Section[] = []
  let open: { depth: number; id: string | undefined; title: string; from: number } | undefined

  HEADING.lastIndex = 0
  let match = HEADING.exec(html)
  while (match !== null) {
    if (open !== undefined) {
      sections.push({
        depth: open.depth,
        id: open.id,
        title: open.title,
        html: html.slice(open.from, match.index),
      })
    }
    const attributes = match[2] ?? ''
    const idMatch = ID_ATTR.exec(attributes)
    open = {
      depth: Number(match[1]),
      id: idMatch === null ? undefined : (idMatch[1] ?? idMatch[2] ?? idMatch[3]),
      title: stripMarkup(match[3] ?? ''),
      from: match.index + match[0].length,
    }
    match = HEADING.exec(html)
  }

  if (open !== undefined) {
    sections.push({ depth: open.depth, id: open.id, title: open.title, html: html.slice(open.from) })
  }
  return sections
}
