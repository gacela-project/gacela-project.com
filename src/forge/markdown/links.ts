import type { MarkdownIt, StateCore } from 'markdown-it'

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

    const visit = (tokens: readonly { type: string; children?: unknown; attrGet?: unknown }[]) => {
      for (const token of tokens) {
        const typed = token as {
          type: string
          children?: typeof tokens | null
          attrGet(name: string): string | null
          attrSet(name: string, value: string): void
        }

        if (typed.type === 'link_open') {
          const href = typed.attrGet('href') ?? ''

          if (isInternal(href)) {
            links.push(href)
          } else if (isExternal(href)) {
            typed.attrSet('rel', 'noreferrer')
          }
        }

        if (typed.children != null) visit(typed.children)
      }
    }

    visit(state.tokens)
    env.links = links
  })
}

function isInternal(href: string): boolean {
  return href.startsWith('/')
}

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href)
}
