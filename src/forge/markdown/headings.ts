import type { MarkdownIt, StateCore, Token } from 'markdown-it'

import { escapeHtml } from './escape.ts'
import { createSlugger } from './slug.ts'
import type { Heading } from '../types.ts'

/**
 * Gives every heading a stable id, an anchor link, and an entry in the page's
 * heading list.
 *
 * The anchor is rendered for everyone rather than injected by script, so a
 * reader without JavaScript can still copy a link to a section.
 */
export function headingsPlugin(md: MarkdownIt): void {
  md.core.ruler.push('headings', (state: StateCore) => {
    const env = state.env as { headings?: Heading[] }
    const headings: Heading[] = []
    const slug = createSlugger()

    for (let index = 0; index < state.tokens.length; index++) {
      const open = state.tokens[index]
      if (open?.type !== 'heading_open') continue

      const inline = state.tokens[index + 1]
      if (inline === undefined) continue

      const text = plainText(inline)
      const id = slug(text)

      open.attrSet('id', id)
      headings.push({ depth: Number(open.tag.slice(1)), id, text })

      inline.children ??= []
      inline.children.push(anchorToken(state, id))
    }

    env.headings = headings
  })
}

function anchorToken(state: StateCore, id: string): Token {
  const token = new state.Token('html_inline', '', 0)
  token.content =
    `<a class="heading-anchor" href="#${escapeHtml(id)}" aria-hidden="true" tabindex="-1">#</a>`

  return token
}

/** The words of a heading, with the markup that decorated them removed. */
function plainText(inline: Token): string {
  const parts: string[] = []

  const walk = (tokens: readonly Token[]): void => {
    for (const token of tokens) {
      if (token.type === 'text' || token.type === 'code_inline') parts.push(token.content)
      else if (token.children !== null && token.children !== undefined) walk(token.children)
    }
  }

  walk(inline.children ?? [])

  return parts.join('').trim()
}
