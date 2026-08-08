import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path/posix'

export type ClientScript = {
  readonly name: string
  readonly source: string
}

/** `@import url('x.css')`, `@import "x.css"` and `@import url(x.css)`. */
const IMPORT = /^[ \t]*@import\s+(?:url\(\s*(['"]?)([^'")]+)\1\s*\)|(['"])([^'"]+)\3)\s*;[ \t]*$/gm

/**
 * Flattens a CSS entry point and everything it imports into one stylesheet.
 *
 * Each `@import` is an extra round trip in the browser, and the design system
 * is deliberately split across twenty small files, so the split is a source
 * concern that should not reach production. Order is preserved exactly,
 * because with cascade layers the order is the architecture.
 */
export async function inlineImports(
  entry: string,
  read: (path: string) => Promise<string>,
): Promise<string> {
  const included = new Set<string>()

  const expand = async (path: string): Promise<string> => {
    if (included.has(path)) return ''
    included.add(path)

    const source = await read(path)
    const directory = dirname(path)

    const replacements = await Promise.all(
      [...source.matchAll(IMPORT)].map(async (match) => {
        const target = match[2] ?? match[4] ?? ''
        const resolved = join(directory, target)

        try {
          return { match: match[0], css: await expand(resolved) }
        } catch (cause) {
          throw new Error(
            `Could not resolve "${target}" imported from "${path}": ${(cause as Error).message}`,
            { cause },
          )
        }
      }),
    )

    return replacements.reduce(
      (css, { match, css: contents }) => css.replace(match, () => contents),
      source,
    )
  }

  return expand(entry)
}

/**
 * Bundles a stylesheet from disk. Paths inside inlineImports stay relative to
 * the entry point, so the entry's directory is the only absolute path involved.
 */
export async function bundleCss(entryPath: string): Promise<string> {
  const root = dirname(entryPath)
  const entry = entryPath.slice(root.length + 1)

  return inlineImports(entry, (path) => readFile(join(root, path), 'utf8'))
}

/**
 * Strips a stylesheet down to what a browser needs.
 *
 * The design system is heavily commented on purpose, and roughly a third of the
 * source is prose explaining why a rule exists. That is worth keeping in the
 * repository and not worth sending to every visitor, so it comes out here
 * rather than out of the source.
 *
 * This is a minifier for CSS this project actually writes: it removes comments
 * and collapses whitespace, and it does not attempt to rewrite selectors,
 * merge rules or shorten colours. It walks the string rather than running a
 * regular expression over it, because comment markers appear inside strings
 * and url() values and a naive pattern eats them.
 */
export function minifyCss(source: string): string {
  let output = ''
  let index = 0

  while (index < source.length) {
    const character = source[index]!

    if (character === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2)
      index = end === -1 ? source.length : end + 2
      continue
    }

    if (character === '"' || character === "'") {
      const end = findStringEnd(source, index)
      output += source.slice(index, end)
      index = end
      continue
    }

    if (/\s/.test(character)) {
      const next = skipWhitespace(source, index)
      // A single space survives only where it separates two values; around
      // punctuation it never carries meaning.
      if (needsSpace(output.at(-1), source[next])) output += ' '
      index = next
      continue
    }

    // The semicolon on the last declaration of a block is optional.
    if (character === '}' && output.endsWith(';')) output = output.slice(0, -1)

    output += character
    index += 1
  }

  return output.trim()
}

const PUNCTUATION = new Set(['{', '}', ';', ':', ',', '>', '~', '+', '(', ')', undefined])

function needsSpace(before: string | undefined, after: string | undefined): boolean {
  return !PUNCTUATION.has(before) && !PUNCTUATION.has(after)
}

function skipWhitespace(source: string, from: number): number {
  let index = from
  while (index < source.length && /\s/.test(source[index]!)) index += 1

  return index
}

function findStringEnd(source: string, start: number): number {
  const quote = source[start]
  let index = start + 1

  while (index < source.length) {
    if (source[index] === '\\') index += 2
    else if (source[index] === quote) return index + 1
    else index += 1
  }

  return source.length
}

/** A short, stable content hash, used to make asset URLs cacheable forever. */
export function fingerprint(contents: string | Uint8Array): string {
  return createHash('sha256').update(contents).digest('hex').slice(0, 8)
}

export function fingerprintedPath(path: string, hash: string): string {
  const dot = path.lastIndexOf('.')

  return dot === -1 ? `${path}.${hash}` : `${path.slice(0, dot)}.${hash}${path.slice(dot)}`
}

/**
 * Joins the client scripts into a single module.
 *
 * Each source becomes a block, which gives it its own scope, so two scripts
 * may declare the same name without colliding. That is the whole of the
 * bundler this site needs: the scripts are small, standalone, and none of them
 * imports another.
 *
 * Scripts may export their pure helpers so the test suite can import and check
 * them. Those exports have no meaning in the browser and are illegal inside a
 * block, so the keyword is removed on the way in; the declaration it was
 * attached to is left exactly as it was.
 */
export function bundleClientScripts(scripts: readonly ClientScript[]): string {
  return scripts
    .map((script) => {
      if (/^[ \t]*import[\s{*]/m.test(script.source)) {
        throw new Error(
          `Client script "${script.name}" uses a top level import. Scripts are concatenated, not bundled, so each one must stand alone.`,
        )
      }

      return `/* ${script.name} */\n{\n${stripExports(script.source).trimEnd()}\n}\n`
    })
    .join('\n')
}

function stripExports(source: string): string {
  return source
    .replace(/^[ \t]*export[ \t]+(?=(?:async[ \t]+)?(?:function|class|const|let|var)\b)/gm, '')
    .replace(/^[ \t]*export[ \t]*\{[^}]*\}[ \t]*;?[ \t]*$/gm, '')
    .replace(/^[ \t]*export[ \t]+default[ \t]+/gm, '')
}
