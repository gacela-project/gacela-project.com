import MarkdownIt from 'markdown-it'
import type { Token } from 'markdown-it'

import { codePlugin } from './code.ts'
import { containerPlugin } from './containers.ts'
import { headingsPlugin } from './headings.ts'
import { createSyntaxHighlighter } from './highlight.ts'
import { linksPlugin } from './links.ts'
import { sincePlugin } from './since.ts'
import type { Heading } from '../types.ts'

export type RenderContext = {
  /** The content file this markdown came from, used in error messages. */
  readonly source: string
}

export type RenderResult = {
  readonly html: string
  readonly headings: readonly Heading[]
  readonly links: readonly string[]
  readonly text: string
}

export type MarkdownRenderer = {
  render(markdown: string, context: RenderContext): RenderResult
}

export async function createMarkdownRenderer(): Promise<MarkdownRenderer> {
  const highlighter = await createSyntaxHighlighter()

  const md = new MarkdownIt({
    // Content is authored in this repository, so raw HTML is a feature.
    html: true,
    linkify: false,
    typographer: false,
  })

  containerPlugin(md)
  codePlugin(md, highlighter)
  headingsPlugin(md)
  linksPlugin(md)
  sincePlugin(md)

  return {
    render(markdown, context) {
      const env: Record<string, unknown> = { source: context.source }
      const tokens = md.parse(markdown, env)

      return {
        html: md.renderer.render(tokens, md.options, env),
        headings: (env['headings'] as Heading[] | undefined) ?? [],
        links: (env['links'] as string[] | undefined) ?? [],
        text: extractText(tokens),
      }
    },
  }
}

/**
 * Readable text for the search index and for excerpts: prose only, with code
 * samples left out. A search that matches inside a code block sends the reader
 * to a result they cannot recognise.
 */
function extractText(tokens: readonly Token[]): string {
  const parts: string[] = []

  const walk = (list: readonly Token[]): void => {
    for (const token of list) {
      if (token.type === 'fence' || token.type === 'code_block' || token.type === 'code_group') {
        continue
      }

      if (token.type === 'text' || token.type === 'code_inline') {
        parts.push(token.content)
      } else if (token.type === 'inline' && token.children != null) {
        walk(token.children)
        parts.push(' ')
      } else if (token.children != null) {
        walk(token.children)
      }
    }
  }

  walk(tokens)

  return parts.join('').replace(/\s+/g, ' ').trim()
}
