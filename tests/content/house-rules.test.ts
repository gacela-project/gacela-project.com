import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The rules the old site enforced in scripts/check-docs.mjs, kept when the
 * generator replaced it.
 *
 * These hold today, so the value is not in finding a problem now; it is that
 * nothing else notices when one stops holding. A missing description silently
 * inherits the site's, which reads as if the page were described when it is
 * not, and a second H1 reads as a second document to anything parsing the
 * outline.
 */

const CONTENT = ['content/docs', 'content/pages'] as const

type Page = { readonly file: string; readonly frontmatter: string; readonly body: string }

const pages: readonly Page[] = CONTENT.flatMap((dir) =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const source = readFileSync(`${dir}/${name}`, 'utf8')
      const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source)

      return {
        file: `${dir}/${name}`,
        frontmatter: match?.[1] ?? '',
        body: (match?.[2] ?? source).replace(/```[\s\S]*?```/g, ''),
      }
    }),
)

/* The two pages whose H1 comes from the template rather than the body: the
   home page's is the hero headline, and the 404 has no body at all. */
const H1_FROM_LAYOUT = new Set(['content/pages/index.md', 'content/pages/404.md'])

describe('content house rules', () => {
  it('finds every page', () => {
    expect(pages.length).toBeGreaterThan(24)
  })

  it.each(pages.map((page) => [page.file, page] as const))('%s declares a title', (_file, page) => {
    expect(page.frontmatter).toMatch(/^title:\s*\S/m)
  })

  it.each(pages.map((page) => [page.file, page] as const))(
    '%s declares a description',
    (_file, page) => {
      expect(page.frontmatter).toMatch(/^description:\s*\S/m)
    },
  )

  /* The description is the meta description and the search result's subtitle,
     both of which are sentences wherever else they appear. */
  it.each(pages.map((page) => [page.file, page] as const))(
    '%s ends its description with a full stop',
    (_file, page) => {
      const description = /^description:\s*(.+)$/m.exec(page.frontmatter)?.[1]?.trim()

      expect(description?.endsWith('.')).toBe(true)
    },
  )

  it.each(
    pages.filter((page) => !H1_FROM_LAYOUT.has(page.file)).map((page) => [page.file, page] as const),
  )('%s has exactly one H1', (_file, page) => {
    expect(page.body.match(/^# /gm) ?? []).toHaveLength(1)
  })

  it.each([...H1_FROM_LAYOUT].map((file) => [file] as const))(
    '%s takes its H1 from the layout instead',
    (file) => {
      const page = pages.find((candidate) => candidate.file === file)

      expect(page?.body.match(/^# /gm) ?? []).toHaveLength(0)
    },
  )
})
