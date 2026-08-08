import type { MarkdownIt, Token } from 'markdown-it'

import { escapeHtml } from './escape.ts'
import type { Highlighter } from './highlight.ts'

/**
 * Code blocks and code groups.
 *
 * A fence info string can carry a language, an optional `[filename]` caption
 * and the legacy `source` flag the previous site used:
 *
 *     ```php [src/Module/Facade.php]
 *     ```php source
 */

const COPY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="9" y="9" width="12" height="12" rx="2"/>' +
  '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'

export type FenceInfo = {
  readonly language: string
  readonly caption: string | undefined
}

export function parseFenceInfo(info: string): FenceInfo {
  const trimmed = info.trim()
  if (trimmed === '') return { language: 'text', caption: undefined }

  const captioned = /^(\S+)\s*\[([^\]]+)\]/.exec(trimmed)
  if (captioned !== null) {
    return { language: captioned[1]!, caption: captioned[2]!.trim() }
  }

  return { language: trimmed.split(/\s+/)[0] ?? 'text', caption: undefined }
}

export function codePlugin(md: MarkdownIt, highlighter: Highlighter): void {
  md.renderer.rules['fence'] = (tokens, index) => {
    const token = tokens[index]
    if (token === undefined) return ''

    return renderCodeBlock(token, highlighter)
  }

  md.renderer.rules['code_group'] = (tokens, index, _options, env) => {
    const fences = (tokens[index]?.meta?.fences ?? []) as Token[]

    return renderCodeGroup(fences, highlighter, nextGroupId(env))
  }
}

function renderCodeBlock(token: Token, highlighter: Highlighter): string {
  const { language, caption } = parseFenceInfo(token.info)
  const highlighted = highlighter.highlight(token.content, language)

  const heading =
    caption === undefined
      ? `<div class="code-block__caption"><span class="code-block__lang">${escapeHtml(language)}</span></div>`
      : `<div class="code-block__caption"><span>${escapeHtml(caption)}</span>` +
        `<span class="code-block__lang">${escapeHtml(language)}</span></div>`

  return (
    `<div class="code-block">${heading}${highlighted}` +
    `<button type="button" class="code-block__copy" data-copy aria-label="Copy code to clipboard">` +
    `${COPY_ICON}</button></div>\n`
  )
}

function renderCodeGroup(fences: readonly Token[], highlighter: Highlighter, id: string): string {
  if (fences.length === 0) return ''

  const labels = fences.map((fence, position) => {
    const { language, caption } = parseFenceInfo(fence.info)
    return caption ?? `${language} ${position + 1}`
  })

  const inputs = labels
    .map(
      (label, position) =>
        `<input type="radio" name="${id}" id="${id}-${position}"` +
        `${position === 0 ? ' checked' : ''} aria-label="${escapeHtml(label)}">`,
    )
    .join('')

  const tabs = labels
    .map(
      (label, position) =>
        `<label class="code-group__tab" for="${id}-${position}">${escapeHtml(label)}</label>`,
    )
    .join('')

  const panels = fences
    .map((fence) => `<div class="code-group__panel">${renderCodeBlock(fence, highlighter)}</div>`)
    .join('')

  return (
    `<div class="code-group">${inputs}` +
    `<div class="code-group__tabs">${tabs}</div>` +
    `<div class="code-group__panels">${panels}</div></div>\n`
  )
}

/**
 * Radio groups need a name that is unique within the page, and the renderer is
 * the only place that knows how many groups it has already emitted.
 */
function nextGroupId(env: unknown): string {
  const scope = env as { codeGroups?: number }
  scope.codeGroups = (scope.codeGroups ?? 0) + 1

  return `cg-${scope.codeGroups}`
}
