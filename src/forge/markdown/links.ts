import type { MarkdownIt, StateCore, Token } from 'markdown-it'

/**
 * Records the internal links on a page, and hardens the external ones.
 *
 * The recorded list is what the link checker validates, which is the only
 * reason the site can promise that no documentation link is dead.
 */
export function linksPlugin(md: MarkdownIt): void {
  md.core.ruler.push('links', (state: StateCore) => {
    const env = state.env as { links?: string[] }
    const links: string[] = []

    const visit = (tokens: Token[]): void => {
      for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index]
        if (token === undefined) continue

        if (token.type === 'link_open') {
          /* markdown-it types an attribute as string | number, since a plugin
             may set one to a number. An href only ever arrives as text. */
          const href = String(token.attrGet('href') ?? '')

          if (isInternal(href)) {
            links.push(href)
          } else if (isExternal(href)) {
            /* A link that leaves the site opens beside it rather than in place,
               so a reader following a reference out of the documentation still
               has the page they were reading. rel carries noreferrer, which
               implies noopener, so the new tab gets no handle on this one. */
            token.attrSet('rel', 'noreferrer')
            token.attrSet('target', '_blank')
            announceNewTab(state, tokens, index)
          }
        }

        if (token.children != null) visit(token.children)
      }
    }

    visit(state.tokens)
    env.links = links
  })
}

/**
 * Adds "opens in a new tab" to the end of an external link's text, for a
 * reader who is told where a link goes rather than shown.
 *
 * A new tab moves someone somewhere they did not ask to go, and the back
 * button no longer returns them: seeing it happen is the warning, so anyone
 * not seeing it needs telling. The words go inside the link, where they are
 * part of its name, and are html_inline rather than text so that the search
 * index and the excerpts, which read the words of a page, do not read this.
 */
function announceNewTab(state: StateCore, tokens: Token[], openIndex: number): void {
  const closeIndex = findLinkClose(tokens, openIndex)
  if (closeIndex === undefined) return

  const hint = new state.Token('html_inline', '', 0)
  hint.content = '<span class="visually-hidden"> (opens in a new tab)</span>'

  tokens.splice(closeIndex, 0, hint)
}

/** The link_close that ends the link opened at openIndex, links being nestable. */
function findLinkClose(tokens: readonly Token[], openIndex: number): number | undefined {
  let depth = 0

  for (let index = openIndex + 1; index < tokens.length; index++) {
    const type = tokens[index]?.type

    if (type === 'link_open') depth++
    else if (type === 'link_close') {
      if (depth === 0) return index
      depth--
    }
  }

  return undefined
}

function isInternal(href: string): boolean {
  return href.startsWith('/')
}

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href)
}
