import { describe, expect, it } from 'vitest'

import { render } from '../../src/forge/render/index.ts'
import { terminal } from '../../src/templates/terminal.ts'

const source = { href: 'https://example.com/tree/abc', label: 'example@abc' }

const session = (output: string) => render(terminal({ command: 'vendor/bin/gacela doctor', output, source }))

describe('terminal', () => {
  it('prints the command after a prompt that is not part of the copyable text', () => {
    const markup = session('')

    expect(markup).toContain('<span class="code-block__prompt" aria-hidden="true">$ </span>vendor/bin/gacela doctor')
    expect(markup).toContain('vendor/bin/gacela doctor')
  })

  it('escapes the output, which is text a program printed', () => {
    expect(session('Phel\\Api -> <none> & more')).toContain('Phel\\Api -&gt; &lt;none&gt; &amp; more')
  })

  it('marks passing and warning lines so they can be told apart without colour', () => {
    const markup = session('✓ module paths\n    1 path scanned\n⚠ package manifests')

    expect(markup).toContain('<span class="code-block__pass">✓ module paths</span>')
    expect(markup).toContain('<span class="code-block__warn">⚠ package manifests</span>')
    expect(markup).toContain('    1 path scanned')
  })

  it('shows lines left out of an excerpt as a muted ellipsis', () => {
    expect(session('a\n…\nb')).toContain('<span class="code-block__elided">…</span>')
  })

  it('links the caption to the exact source the output came from, and says so', () => {
    const markup = session('')

    expect(markup).toContain('href="https://example.com/tree/abc"')
    expect(markup).toContain('<span class="visually-hidden">Output recorded at </span>example@abc')
  })

  it('lets a keyboard reach the output, which can scroll sideways', () => {
    expect(session('')).toContain('<pre tabindex="0">')
  })

  it('wraps long lines only when the session asks for it', () => {
    expect(session('')).not.toContain('code-block--wrap')
    expect(
      render(terminal({ command: 'x', output: 'y', source, wrap: true })),
    ).toContain('class="code-block code-block--terminal code-block--wrap"')
  })
})
