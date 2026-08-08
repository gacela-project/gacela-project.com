import type { Frontmatter } from '../types.ts'

/**
 * The frontmatter keys this site uses. Anything else is a typo, and a typo in
 * a title is invisible at review time but obvious at build time, so unknown
 * keys are an error rather than something to ignore.
 */
const KNOWN_KEYS = new Set(['title', 'description', 'layout', 'unlisted'])

const DELIMITER = /^---[ \t]*$/

export type ParsedDocument = {
  readonly frontmatter: Frontmatter
  readonly body: string
}

/**
 * Parses a leading `---` block as a flat map of scalars.
 *
 * This is not a YAML parser and is not trying to be one. The site's
 * frontmatter is four optional scalar keys; supporting nesting, anchors and
 * multi-line strings would be a dependency's worth of behaviour that no
 * content file uses.
 */
export function parseFrontmatter(raw: string): ParsedDocument {
  const source = raw.replace(/\r\n/g, '\n')
  const lines = source.split('\n')

  if (lines[0] === undefined || !DELIMITER.test(lines[0])) {
    return { frontmatter: {}, body: raw }
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && DELIMITER.test(line))
  if (closingIndex === -1) {
    // An unterminated block is far more likely to be a horizontal rule at the
    // top of a document than a broken header, so it stays part of the body.
    return { frontmatter: {}, body: raw }
  }

  const frontmatter: Record<string, string | boolean> = {}

  for (const line of lines.slice(1, closingIndex)) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf(':')
    if (separator === -1) {
      throw new Error(`Frontmatter line is not a "key: value" pair: ${trimmed}`)
    }

    const key = trimmed.slice(0, separator).trim()
    if (!KNOWN_KEYS.has(key)) {
      throw new Error(
        `Unknown frontmatter key "${key}". Known keys are: ${[...KNOWN_KEYS].join(', ')}.`,
      )
    }

    frontmatter[key] = parseScalar(trimmed.slice(separator + 1).trim())
  }

  return {
    frontmatter: frontmatter as Frontmatter,
    body: lines.slice(closingIndex + 1).join('\n'),
  }
}

function parseScalar(value: string): string | boolean {
  if (value === 'true') return true
  if (value === 'false') return false

  const quoted = /^(['"])(.*)\1$/.exec(value)
  return quoted?.[2] ?? value
}
