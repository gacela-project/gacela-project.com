import { beforeAll, describe, expect, it } from 'vitest'
import { createMarkdownRenderer, type MarkdownRenderer } from '../../src/forge/markdown/index.ts'

let renderer: MarkdownRenderer

beforeAll(async () => {
  renderer = await createMarkdownRenderer()
})

const render = (markdown: string) => renderer.render(markdown, { source: 'docs/test.md' })

describe('headings', () => {
  it('gives every heading an id and an anchor link', () => {
    const { html } = render('## Getting started')

    expect(html).toContain('id="getting-started"')
    expect(html).toContain('href="#getting-started"')
    expect(html).toContain('class="heading-anchor"')
  })

  it('collects headings for the table of contents', () => {
    const { headings } = render('# Facade\n\n## Usage\n\n### Details\n\n#### Too deep')

    expect(headings).toEqual([
      { depth: 1, id: 'facade', text: 'Facade' },
      { depth: 2, id: 'usage', text: 'Usage' },
      { depth: 3, id: 'details', text: 'Details' },
      { depth: 4, id: 'too-deep', text: 'Too deep' },
    ])
  })

  it('uses the text of a heading, not its markup, as the heading label', () => {
    const { headings } = render('## The `Facade` class')

    expect(headings[0]?.text).toBe('The Facade class')
    expect(headings[0]?.id).toBe('the-facade-class')
  })

  it('disambiguates repeated headings', () => {
    const { headings } = render('## Usage\n\ntext\n\n## Usage')

    expect(headings.map((heading) => heading.id)).toEqual(['usage', 'usage-1'])
  })

  it('hides the anchor from assistive technology, since the heading is the label', () => {
    const { html } = render('## Usage')

    expect(html).toContain('aria-hidden="true"')
  })
})

describe('code', () => {
  it('highlights a fenced block and frames it', () => {
    const { html } = render('```php\n<?php echo 1;\n```')

    expect(html).toContain('class="code-block"')
    expect(html).toContain('<pre')
    expect(html).toContain('class="syn-keyword"')
  })

  it('shows the language of an unlabelled block', () => {
    const { html } = render('```bash\ncomposer require gacela-project/gacela\n```')

    expect(html).toContain('class="code-block__lang"')
    expect(html).toContain('bash')
  })

  it('uses a bracketed filename as the caption', () => {
    const { html } = render('```php [src/Module/Facade.php]\n<?php\n```')

    expect(html).toContain('class="code-block__caption"')
    expect(html).toContain('src/Module/Facade.php')
  })

  it('accepts the legacy "source" fence flag without printing it', () => {
    const { html } = render('```php source\n<?php\n```')

    expect(html).toContain('class="code-block"')
    expect(html).not.toContain('source')
  })

  it('falls back to plain text for a language shiki does not know', () => {
    const { html } = render('```notalanguage\nhello\n```')

    expect(html).toContain('class="code-block"')
    expect(html).toContain('hello')
  })

  it('escapes html inside code so a sample cannot inject markup', () => {
    const { html } = render('```html\n<script>alert(1)</script>\n```')

    // The escaped form varies (&lt; or &#x3C;); what matters is that no tag survives.
    expect(html).not.toContain('<script')
    expect(html).toContain('script')
  })

  it('gives every block a copy button', () => {
    const { html } = render('```bash\nls\n```')

    expect(html).toContain('class="code-block__copy"')
  })
})

describe('containers', () => {
  it('renders a tip as a callout', () => {
    const { html } = render('::: tip\nRemember this.\n:::')

    expect(html).toContain('class="callout callout--tip"')
    expect(html).toContain('Remember this.')
  })

  it('supports info, warning and danger', () => {
    expect(render('::: info\nx\n:::').html).toContain('callout--info')
    expect(render('::: warning\nx\n:::').html).toContain('callout--warning')
    expect(render('::: danger\nx\n:::').html).toContain('callout--danger')
  })

  it('uses a custom title when one is given', () => {
    const { html } = render('::: warning Careful\nx\n:::')

    expect(html).toContain('Careful')
  })

  it('renders markdown inside the callout', () => {
    const { html } = render('::: tip\nSee the [Factory](/docs/factory).\n:::')

    expect(html).toContain('href="/docs/factory"')
  })

  it('turns a code group into tabs with one radio per file', () => {
    const { html } = render(
      '::: code-group\n```php [Facade.php]\n<?php\n```\n\n```php [Factory.php]\n<?php\n```\n:::',
    )

    expect(html).toContain('class="code-group"')
    expect(html).toContain('Facade.php')
    expect(html).toContain('Factory.php')
    expect(html.match(/type="radio"/g)).toHaveLength(2)
    expect(html).toContain('checked')
  })

  it('gives each code group on a page a distinct radio group name', () => {
    const { html } = render(
      '::: code-group\n```php [A.php]\n<?php\n```\n:::\n\n::: code-group\n```php [B.php]\n<?php\n```\n:::',
    )

    const names = [...html.matchAll(/name="([^"]+)"/g)].map((match) => match[1])

    expect(new Set(names).size).toBe(2)
  })
})

describe('links', () => {
  it('collects internal links so they can be checked', () => {
    const { links } = render('See [Factory](/docs/factory) and [anchor](/docs/provider#provides).')

    expect(links).toEqual(['/docs/factory', '/docs/provider#provides'])
  })

  it('does not collect external links', () => {
    const { links } = render('[Packagist](https://packagist.org/packages/gacela-project/gacela)')

    expect(links).toEqual([])
  })

  it('marks external links so they open safely', () => {
    const { html } = render('[X](https://example.com)')

    expect(html).toContain('rel="noreferrer"')
  })

  it('sends external links to a new tab', () => {
    const { html } = render('[X](https://example.com)')

    expect(html).toContain('target="_blank"')
  })

  it('says so, for a reader who cannot see the tab open', () => {
    const { html } = render('[X](https://example.com)')

    expect(html).toContain('<span class="visually-hidden"> (opens in a new tab)</span></a>')
  })

  it('keeps that hint out of the indexed text', () => {
    const { text } = render('[X](https://example.com)')

    expect(text).not.toContain('opens in a new tab')
  })

  it('leaves internal links untouched', () => {
    const { html } = render('[Factory](/docs/factory)')

    expect(html).toContain('<a href="/docs/factory">')
  })

  it('keeps anchors and relative links in the same tab, and unannounced', () => {
    const { html } = render('[Provides](/docs/provider#provides) and [top](#top)')

    expect(html).not.toContain('target="_blank"')
    expect(html).not.toContain('opens in a new tab')
  })
})

describe('text extraction', () => {
  it('returns readable text with markup and code blocks removed', () => {
    const { text } = render('# Facade\n\nThe **entry point**.\n\n```php\n<?php echo 1;\n```\n')

    expect(text).toContain('Facade')
    expect(text).toContain('The entry point.')
    expect(text).not.toContain('<?php')
    expect(text).not.toContain('**')
  })

  it('collapses whitespace', () => {
    const { text } = render('One\n\n\nTwo')

    expect(text).toBe('One Two')
  })
})

describe('tables', () => {
  it('renders github style tables', () => {
    const { html } = render('| a | b |\n| - | - |\n| 1 | 2 |')

    expect(html).toContain('<table>')
    expect(html).toContain('<th>')
  })
})

describe('heading anchors', () => {
  it('leaves no text inside the anchor, so headings stay clean for text extraction', () => {
    const { html } = render('## Getting started')

    // The "#" glyph is generated by CSS. If it were in the markup it would end
    // up in the search index, in excerpts, and in anything a reader copies.
    expect(html).toContain('tabindex="-1"></a>')
    expect(html).not.toContain('>#</a>')
  })
})

describe('syntax token classes', () => {
  it('rewrites shiki inline styles into design system classes', () => {
    const { html } = render('```php\n<?php final class A {}\n```')

    expect(html).toContain('class="syn-keyword"')
    expect(html).not.toContain('style="color:var(--syn-token-')
  })

  it('drops the redundant foreground style, which the block already sets', () => {
    const { html } = render('```php\n<?php $a = 1;\n```')

    expect(html).not.toContain('var(--syn-foreground)')
  })
})

describe('syntax markup weight', () => {
  it('unwraps spans left with no attributes', () => {
    const { html } = render('```php\n<?php $a = 1;\n```')

    expect(html).not.toContain('<span>')
  })
})
