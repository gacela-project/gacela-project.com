import { classes, html, raw, render, type Raw } from '../forge/render/index.ts'

export type TerminalSession = {
  readonly command: string
  readonly output: string
  readonly source: { readonly href: string; readonly label: string }
  /** For output with no table in it: wrap long lines the way a terminal would. */
  readonly wrap?: boolean
}

/**
 * A recorded command and what it printed, in the code block frame. The pass and
 * warning marks are Gacela's own; they get a class so colour can back them up,
 * but the glyph alone still carries the meaning.
 */
export function terminal(session: TerminalSession): Raw {
  const lines = session.output.split('\n').map(outputLine)

  // Built as one string: whitespace between these tags would print inside <pre>.
  const body =
    `<span class="code-block__prompt" aria-hidden="true">$</span> ${render(session.command)}` +
    (session.output === '' ? '' : `\n${lines.join('\n')}`)

  return html`<figure class="${classes('code-block', 'code-block--terminal', session.wrap === true && 'code-block--wrap')}">
    <figcaption class="code-block__caption">
      <span>Terminal</span>
      <a class="code-block__source" href="${session.source.href}"
        ><span class="visually-hidden">Output recorded at </span>${session.source.label}</a
      >
    </figcaption>
    <pre tabindex="0"><code>${raw(body)}</code></pre>
  </figure>`
}

function outputLine(line: string): string {
  const text = render(line)

  if (line.startsWith('✓')) return `<span class="code-block__pass">${text}</span>`
  if (line.startsWith('⚠')) return `<span class="code-block__warn">${text}</span>`
  if (line.trim() === '…') return `<span class="code-block__elided">${text}</span>`

  return text
}
