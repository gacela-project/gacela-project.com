import type { MarkdownIt, StateBlock, StateCore } from 'markdown-it'

import { escapeHtml } from './escape.ts'

/**
 * Fenced containers: `::: tip`, `::: warning`, `::: code-group` and friends.
 *
 * markdown-it has no container syntax of its own and the usual plugin for it
 * would be a third runtime dependency, so the block rule lives here. It is
 * about sixty lines, which is the trade this project makes on purpose.
 */

const CALLOUTS: Record<string, string> = {
  tip: 'Tip',
  info: 'Note',
  warning: 'Warning',
  danger: 'Danger',
}

const CODE_GROUP = 'code-group'
const MARKER = ':::'
const OPENING = /^:::[ \t]*([a-z-]+)[ \t]*(.*)$/

export function containerPlugin(md: MarkdownIt): void {
  md.block.ruler.before('fence', 'container', containerRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })

  md.core.ruler.push('code_groups', collapseCodeGroups)

  md.renderer.rules['container_open'] = (tokens, index) => {
    const token = tokens[index]
    const name = token?.info ?? 'info'
    const declared = (token?.meta as { title?: string } | undefined)?.title
    const title = declared !== undefined && declared !== '' ? declared : (CALLOUTS[name] ?? name)

    return (
      `<aside class="callout callout--${escapeHtml(name)}">` +
      `<p class="callout__title">${escapeHtml(title)}</p>`
    )
  }

  md.renderer.rules['container_close'] = () => '</aside>\n'
}

function containerRule(state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean {
  const start = state.bMarks[startLine]! + state.tShift[startLine]!
  const max = state.eMarks[startLine]!

  if (state.sCount[startLine]! - state.blkIndent >= 4) return false
  if (state.src.slice(start, start + MARKER.length) !== MARKER) return false

  const opening = OPENING.exec(state.src.slice(start, max).trimEnd())
  if (opening === null) return false

  const name = opening[1]!
  if (name !== CODE_GROUP && CALLOUTS[name] === undefined) return false

  if (silent) return true

  const closingLine = findClosingLine(state, startLine, endLine)

  const parentMax = state.lineMax
  state.lineMax = closingLine

  const open = state.push('container_open', 'div', 1)
  open.info = name
  open.meta = { title: opening[2]?.trim() ?? '' }
  open.markup = MARKER
  open.block = true
  open.map = [startLine, closingLine]

  state.md.block.tokenize(state, startLine + 1, closingLine)

  const close = state.push('container_close', 'div', -1)
  close.markup = MARKER
  close.block = true

  state.lineMax = parentMax
  // Step past the closing marker, unless the container ran to the end of input.
  state.line = closingLine < endLine ? closingLine + 1 : closingLine

  return true
}

/** Finds the `:::` that closes this container, allowing containers to nest. */
function findClosingLine(state: StateBlock, startLine: number, endLine: number): number {
  let depth = 1

  for (let line = startLine + 1; line < endLine; line++) {
    const text = state.src.slice(state.bMarks[line]! + state.tShift[line]!, state.eMarks[line]!).trim()

    if (!text.startsWith(MARKER)) continue

    if (text === MARKER) {
      depth -= 1
      if (depth === 0) return line
    } else if (OPENING.test(text)) {
      depth += 1
    }
  }

  // Unterminated containers run to the end of the document rather than failing
  // the build: a missing `:::` is a formatting slip, not a broken page.
  return endLine
}

/**
 * Replaces a `code-group` container and its fences with a single token, so the
 * renderer can emit one tab strip and one stack of panels instead of trying to
 * reason about a flat run of tokens.
 */
function collapseCodeGroups(state: StateCore): void {
  const tokens = state.tokens

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token?.type !== 'container_open' || token.info !== CODE_GROUP) continue

    const end = tokens.findIndex(
      (candidate, at) => at > index && candidate.type === 'container_close',
    )
    if (end === -1) continue

    const fences = tokens.slice(index + 1, end).filter((candidate) => candidate.type === 'fence')

    const group = new state.Token('code_group', 'div', 0)
    group.block = true
    group.meta = { fences }

    tokens.splice(index, end - index + 1, group)
  }
}
