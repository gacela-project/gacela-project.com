import { describe, expect, it } from 'vitest'

import { buildSearchIndex, serializeSearchIndex } from '../../src/forge/search/index.ts'
import type { Collection, Frontmatter, Heading, RenderedPage } from '../../src/forge/types.ts'

type PageOverrides = {
  source?: string
  collection?: Collection
  route?: string
  frontmatter?: Frontmatter
  body?: string
  html?: string
  headings?: readonly Heading[]
  text?: string
  links?: readonly string[]
}

function makePage(overrides: PageOverrides = {}): RenderedPage {
  return {
    source: overrides.source ?? 'docs/facade.md',
    collection: overrides.collection ?? 'docs',
    route: overrides.route ?? '/docs/facade',
    frontmatter: overrides.frontmatter ?? { title: 'Facade' },
    body: overrides.body ?? '',
    html: overrides.html ?? '',
    headings: overrides.headings ?? [],
    text: overrides.text ?? '',
    links: overrides.links ?? [],
  }
}

describe('buildSearchIndex', () => {
  it('returns nothing for no pages', () => {
    expect(buildSearchIndex([])).toEqual([])
  })

  it('makes one document for a page without headings', () => {
    const docs = buildSearchIndex([
      makePage({ html: '<p>The Facade is the only entry point of a module.</p>' }),
    ])

    expect(docs).toEqual([
      {
        route: '/docs/facade',
        title: 'Facade',
        crumb: 'Docs / Facade',
        text: 'The Facade is the only entry point of a module.',
      },
    ])
  })

  it('separates block level text instead of running it together', () => {
    const docs = buildSearchIndex([makePage({ html: '<p>alpha</p><p>beta</p><ul><li>gamma</li></ul>' })])

    expect(docs[0]?.text).toBe('alpha beta gamma')
  })

  it('keeps inline elements glued to the words around them', () => {
    const docs = buildSearchIndex([
      makePage({ html: '<p>Call <code>Facade</code>::method() on it.</p>' }),
    ])

    expect(docs[0]?.text).toBe('Call Facade::method() on it.')
  })

  it('splits a page into one document per h2 and h3 section', () => {
    const docs = buildSearchIndex([
      makePage({
        html: [
          '<p>Intro paragraph.</p>',
          '<h2 id="setup">Setup</h2>',
          '<p>Install it first.</p>',
          '<h3 id="composer">With Composer</h3>',
          '<p>Run composer require gacela-project/gacela.</p>',
          '<h2 id="usage">Usage</h2>',
          '<p>Call the facade.</p>',
        ].join('\n'),
      }),
    ])

    expect(docs.map((doc) => doc.route)).toEqual([
      '/docs/facade',
      '/docs/facade#setup',
      '/docs/facade#composer',
      '/docs/facade#usage',
    ])
    expect(docs.map((doc) => doc.title)).toEqual(['Facade', 'Setup', 'With Composer', 'Usage'])
    expect(docs[1]?.text).toBe('Install it first.')
    expect(docs[2]?.text).toBe('Run composer require gacela-project/gacela.')
    expect(docs[3]?.text).toBe('Call the facade.')
  })

  it('gives the page document the whole page text, headings included', () => {
    const docs = buildSearchIndex([
      makePage({
        html: '<p>Intro paragraph.</p><h2 id="setup">Setup</h2><p>Install it first.</p>',
      }),
    ])

    expect(docs[0]?.text).toBe('Intro paragraph. Setup Install it first.')
  })

  it('builds a breadcrumb from the page title and the heading trail', () => {
    const docs = buildSearchIndex([
      makePage({
        html: [
          '<h2 id="factory">Getting the factory</h2>',
          '<p>Ask the abstract facade.</p>',
          '<h3 id="lazy">Lazy creation</h3>',
          '<p>It is created once.</p>',
        ].join(''),
      }),
    ])

    expect(docs.map((doc) => doc.crumb)).toEqual([
      'Docs / Facade',
      'Facade / Getting the factory',
      'Facade / Getting the factory / Lazy creation',
    ])
  })

  it('drops the missing h2 from the trail when an h3 comes first', () => {
    const docs = buildSearchIndex([
      makePage({ html: '<h3 id="orphan">Orphan</h3><p>No parent heading.</p>' }),
    ])

    expect(docs[1]?.crumb).toBe('Facade / Orphan')
  })

  it('uses the page title alone as the crumb outside the docs collection', () => {
    const docs = buildSearchIndex([
      makePage({
        collection: 'pages',
        source: 'pages/about.md',
        route: '/about',
        frontmatter: { title: 'About' },
        html: '<p>Gacela is a framework.</p><h2 id="why">Why</h2><p>Because modules.</p>',
      }),
    ])

    expect(docs.map((doc) => doc.crumb)).toEqual(['About', 'About / Why'])
  })

  it('skips unlisted pages', () => {
    const docs = buildSearchIndex([
      makePage({
        route: '/docs/secret',
        frontmatter: { title: 'Secret', unlisted: true },
        html: '<h2 id="hidden">Hidden</h2><p>Not indexed.</p>',
      }),
      makePage({ html: '<p>Indexed.</p>' }),
    ])

    expect(docs.map((doc) => doc.route)).toEqual(['/docs/facade'])
  })

  it('indexes a page that is explicitly listed', () => {
    const docs = buildSearchIndex([
      makePage({ frontmatter: { title: 'Facade', unlisted: false }, html: '<p>Indexed.</p>' }),
    ])

    expect(docs).toHaveLength(1)
  })

  it('caps the text of every document at 600 characters', () => {
    const long = 'lorem ipsum dolor sit amet '.repeat(80)
    const docs = buildSearchIndex([
      makePage({ html: `<p>${long}</p><h2 id="more">More</h2><p>${long}</p>` }),
    ])

    for (const doc of docs) {
      expect(doc.text.length).toBeLessThanOrEqual(600)
    }
    expect(docs[0]?.text.endsWith('…')).toBe(true)
    expect(docs[0]?.text).not.toContain('  ')
  })

  it('does not truncate text that already fits', () => {
    const docs = buildSearchIndex([makePage({ html: '<p>Short enough.</p>' })])

    expect(docs[0]?.text).toBe('Short enough.')
  })

  it('truncates on a word boundary', () => {
    const docs = buildSearchIndex([makePage({ html: `<p>${'abcde '.repeat(200)}</p>` })])

    expect(docs[0]?.text.endsWith('abcde…')).toBe(true)
  })

  it('decodes HTML entities in text', () => {
    const docs = buildSearchIndex([
      makePage({
        html: '<p>Config &amp; providers, &lt;Facade&gt;, &#39;quoted&#39;, &#x2026; and&nbsp;space.</p>',
      }),
    ])

    expect(docs[0]?.text).toBe("Config & providers, <Facade>, 'quoted', … and space.")
  })

  it('does not treat an escaped tag inside a code block as markup', () => {
    const docs = buildSearchIndex([
      makePage({ html: '<pre><code>&lt;?php echo $facade-&gt;run();</code></pre>' }),
    ])

    expect(docs[0]?.text).toBe('<?php echo $facade->run();')
  })

  it('leaves an unknown entity alone', () => {
    const docs = buildSearchIndex([makePage({ html: '<p>a &frobnicate; b</p>' })])

    expect(docs[0]?.text).toBe('a &frobnicate; b')
  })

  it('strips markup out of heading text', () => {
    const docs = buildSearchIndex([
      makePage({
        html: '<h2 id="factory">Getting the <code>Factory</code> <a class="anchor" href="#factory">#</a></h2><p>Body.</p>',
      }),
    ])

    expect(docs[1]?.title).toBe('Getting the Factory #')
    expect(docs[1]?.crumb).toBe('Facade / Getting the Factory #')
  })

  it('decodes entities in heading text', () => {
    const docs = buildSearchIndex([
      makePage({ html: '<h2 id="cfg">Config &amp; Provider</h2><p>Body.</p>' }),
    ])

    expect(docs[1]?.title).toBe('Config & Provider')
  })

  it('takes the section id from page.headings when the markup has none', () => {
    const docs = buildSearchIndex([
      makePage({
        html: '<h2>Getting the factory</h2><p>Body.</p>',
        headings: [{ depth: 2, id: 'getting-the-factory', text: 'Getting the factory' }],
      }),
    ])

    expect(docs[1]?.route).toBe('/docs/facade#getting-the-factory')
  })

  it('skips a section that cannot be linked to', () => {
    const docs = buildSearchIndex([
      makePage({ html: '<h2>Unlinkable</h2><p>Body.</p><h2 id="ok">Linkable</h2><p>Body.</p>' }),
    ])

    expect(docs.map((doc) => doc.route)).toEqual(['/docs/facade', '/docs/facade#ok'])
  })

  it('keeps repeated heading text pointing at distinct ids', () => {
    const docs = buildSearchIndex([
      makePage({
        html: '<h2>Example</h2><p>One.</p><h2>Example</h2><p>Two.</p>',
        headings: [
          { depth: 2, id: 'example', text: 'Example' },
          { depth: 2, id: 'example-1', text: 'Example' },
        ],
      }),
    ])

    expect(docs.map((doc) => doc.route)).toEqual([
      '/docs/facade',
      '/docs/facade#example',
      '/docs/facade#example-1',
    ])
  })

  it('keeps a section that has a heading but no body', () => {
    const docs = buildSearchIndex([makePage({ html: '<h2 id="empty">Empty</h2>' })])

    expect(docs[1]).toEqual({
      route: '/docs/facade#empty',
      title: 'Empty',
      crumb: 'Facade / Empty',
      text: '',
    })
  })

  it('leaves h1 and h4 inside the section they belong to', () => {
    const docs = buildSearchIndex([
      makePage({
        html: '<h1>Facade</h1><h2 id="setup">Setup</h2><h4>Detail</h4><p>Body.</p>',
      }),
    ])

    expect(docs).toHaveLength(2)
    expect(docs[1]?.text).toBe('Detail Body.')
  })

  it('ignores script, style and svg content', () => {
    const docs = buildSearchIndex([
      makePage({
        html:
          '<p>Visible.</p><script>const secret = 1</script><style>.a{color:red}</style>' +
          '<svg viewBox="0 0 4 4"><path d="M0 0h4v4"/></svg>',
      }),
    ])

    expect(docs[0]?.text).toBe('Visible.')
  })

  it('ignores HTML comments', () => {
    const docs = buildSearchIndex([makePage({ html: '<p>Visible.<!-- hidden note --></p>' })])

    expect(docs[0]?.text).toBe('Visible.')
  })

  it('falls back to the h1 when there is no frontmatter title', () => {
    const docs = buildSearchIndex([
      makePage({ frontmatter: {}, html: '<h1>The <em>Facade</em></h1><p>Body.</p>' }),
    ])

    expect(docs[0]?.title).toBe('The Facade')
  })

  it('falls back to the route when there is no title at all', () => {
    const docs = buildSearchIndex([
      makePage({ frontmatter: {}, route: '/docs/service-map', html: '<p>Body.</p>' }),
    ])

    expect(docs[0]?.title).toBe('Service map')
    expect(docs[0]?.crumb).toBe('Docs / Service map')
  })

  it('falls back to the stripped body text when there is no html', () => {
    const docs = buildSearchIndex([makePage({ html: '', text: '  Plain   text  ' })])

    expect(docs[0]?.text).toBe('Plain text')
  })

  it('indexes several pages in the order they arrive', () => {
    const docs = buildSearchIndex([
      makePage({ route: '/docs/facade', html: '<p>One.</p>' }),
      makePage({
        route: '/docs/factory',
        frontmatter: { title: 'Factory' },
        html: '<h2 id="di">Dependencies</h2><p>Two.</p>',
      }),
    ])

    expect(docs.map((doc) => doc.route)).toEqual([
      '/docs/facade',
      '/docs/factory',
      '/docs/factory#di',
    ])
  })
})

describe('serializeSearchIndex', () => {
  it('writes compact JSON that parses back to the documents', () => {
    const docs = buildSearchIndex([
      makePage({ html: '<p>Body.</p><h2 id="a">A</h2><p>More.</p>' }),
    ])
    const json = serializeSearchIndex(docs)

    expect(json).not.toContain('\n')
    expect(json.startsWith('[{')).toBe(true)
    expect(JSON.parse(json)).toEqual(docs)
  })

  it('writes an empty array for an empty index', () => {
    expect(serializeSearchIndex([])).toBe('[]')
  })
})
