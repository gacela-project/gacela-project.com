import type { MarkdownIt, StateInline } from 'markdown-it'

import { escapeHtml } from './escape.ts'

/**
 * Version badges: `[since 1.9]` marks the release a feature first appeared in.
 *
 * The docs describe the latest Gacela release only; this marker is the whole
 * of the versioning story between majors. It renders as an inline pill and is
 * deliberately not a text token, so heading ids, the table of contents and
 * the search index never see the words "Since 1.9".
 */

const SINCE = /^\[since ([0-9]+\.[0-9]+(?:\.[0-9]+)?)\]/

export function sincePlugin(md: MarkdownIt): void {
  md.inline.ruler.before('link', 'since', sinceRule)

  md.renderer.rules['since_badge'] = (tokens, index) => {
    const version = (tokens[index]?.meta as { version?: string } | undefined)?.version ?? ''

    /* The plain badge, not the accent one: the header's release pill is the
       same class of information, and a version marker must not outshine the
       links in the sentence it annotates. */
    return `<span class="badge badge--since">Since ${escapeHtml(version)}</span>`
  }
}

function sinceRule(state: StateInline, silent: boolean): boolean {
  if (state.src.charCodeAt(state.pos) !== 0x5b /* [ */) return false

  const match = SINCE.exec(state.src.slice(state.pos))
  if (match === null) return false

  // `[since 1.9](...)` and `[since 1.9][...]` are links, not badges.
  const following = state.src.charAt(state.pos + match[0].length)
  if (following === '(' || following === '[') return false

  if (!silent) {
    const token = state.push('since_badge', '', 0)
    token.meta = { version: match[1] }
    token.markup = match[0]
  }

  state.pos += match[0].length

  return true
}
