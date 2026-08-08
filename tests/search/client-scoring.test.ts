/**
 * The client is plain JavaScript with no build step, so it cannot be imported
 * as a typed module. It is loaded here the way a browser loads it: by URL. The
 * pure helpers it exports are the part worth testing; everything else in the
 * file touches the DOM and is only wired up when `document` exists.
 */

import { describe, expect, it } from 'vitest'

import type { SearchDocument } from '../../src/forge/types.ts'

const client = await import(new URL('../../src/client/search.js', import.meta.url).href)

const scoreDocument = client.scoreDocument as (doc: SearchDocument, query: string) => number
const searchDocuments = client.searchDocuments as (
  docs: readonly SearchDocument[],
  query: string,
  limit?: number,
) => SearchDocument[]
const excerptHtml = client.excerptHtml as (text: string, query: string) => string

function doc(title: string, text = '', route = '/docs/x', crumb = 'Docs / X'): SearchDocument {
  return { route, title, crumb, text }
}

describe('scoreDocument', () => {
  it('scores nothing for an empty query', () => {
    expect(scoreDocument(doc('Facade', 'text'), '')).toBe(0)
    expect(scoreDocument(doc('Facade', 'text'), '   ')).toBe(0)
  })

  it('scores nothing when no term appears anywhere', () => {
    expect(scoreDocument(doc('Facade', 'The entry point'), 'kubernetes')).toBe(0)
  })

  it('ranks an exact phrase in the title above every other match', () => {
    const exact = scoreDocument(doc('Getting the factory'), 'getting the factory')
    const allTerms = scoreDocument(doc('Factory: getting things'), 'getting factory')
    const inText = scoreDocument(doc('Provider', 'getting the factory'), 'getting the factory')

    expect(exact).toBeGreaterThan(allTerms)
    expect(allTerms).toBeGreaterThan(inText)
  })

  it('ranks all terms in the title above all terms in the text', () => {
    const inTitle = scoreDocument(doc('Config and bindings', 'unrelated'), 'config bindings')
    const inText = scoreDocument(doc('Unrelated', 'config comes before bindings'), 'config bindings')

    expect(inTitle).toBeGreaterThan(inText)
  })

  it('ranks all terms above a partial match', () => {
    const all = scoreDocument(doc('Unrelated', 'config and bindings live here'), 'config bindings')
    const partial = scoreDocument(doc('Unrelated', 'config lives here'), 'config bindings')

    expect(all).toBeGreaterThan(partial)
    expect(partial).toBeGreaterThan(0)
  })

  it('is case and whitespace insensitive', () => {
    expect(scoreDocument(doc('Facade'), 'facade')).toBe(scoreDocument(doc('Facade'), '  FaCaDe  '))
  })

  it('prefers the shorter of two titles that match the same way', () => {
    const short = scoreDocument(doc('Facade'), 'facade')
    const long = scoreDocument(doc('Facade and everything that surrounds it'), 'facade')

    expect(short).toBeGreaterThan(long)
  })

  it('matches a term that only appears as a prefix of a longer word', () => {
    expect(scoreDocument(doc('Configuration'), 'config')).toBeGreaterThan(0)
  })
})

describe('searchDocuments', () => {
  const index: readonly SearchDocument[] = [
    doc('Provider', 'Wires dependencies into the container', '/docs/provider'),
    doc('Facade', 'The only entry point of a module', '/docs/facade'),
    doc('Getting the facade', 'How to reach the facade', '/docs/facade#get'),
    doc('Config', 'Reads facade settings', '/docs/config'),
  ]

  it('returns nothing for an empty query', () => {
    expect(searchDocuments(index, '')).toEqual([])
  })

  it('drops documents that do not match', () => {
    expect(searchDocuments(index, 'facade').map((d) => d.route)).not.toContain('/docs/provider')
  })

  it('ranks the best match first', () => {
    expect(searchDocuments(index, 'facade')[0]?.route).toBe('/docs/facade')
  })

  it('caps the result list at eight', () => {
    const many = Array.from({ length: 30 }, (_, i) => doc(`Facade ${i}`, 'facade', `/docs/${i}`))

    expect(searchDocuments(many, 'facade')).toHaveLength(8)
  })

  it('honours an explicit limit', () => {
    expect(searchDocuments(index, 'facade', 2)).toHaveLength(2)
  })
})

describe('excerptHtml', () => {
  it('marks the matched term', () => {
    expect(excerptHtml('The Facade is the entry point', 'facade')).toBe(
      'The <mark>Facade</mark> is the entry point',
    )
  })

  it('marks the whole phrase rather than each term', () => {
    expect(excerptHtml('Call the abstract facade here', 'abstract facade')).toBe(
      'Call the <mark>abstract facade</mark> here',
    )
  })

  it('escapes HTML in the source text', () => {
    expect(excerptHtml('<b>facade</b> & "co"', 'facade')).toBe(
      '&lt;b&gt;<mark>facade</mark>&lt;/b&gt; &amp; &quot;co&quot;',
    )
  })

  it('never emits an unescaped angle bracket around the mark', () => {
    const html = excerptHtml('<script>alert(1)</script> facade', 'facade')

    expect(html).not.toContain('<script>')
    expect(html).toContain('<mark>facade</mark>')
  })

  it('windows the text around the first match', () => {
    const text = `${'padding word '.repeat(40)}needle ${'tail word '.repeat(40)}`
    const html = excerptHtml(text, 'needle')

    expect(html.length).toBeLessThan(280)
    expect(html).toContain('<mark>needle</mark>')
    expect(html.startsWith('…')).toBe(true)
    expect(html.endsWith('…')).toBe(true)
  })

  it('starts at the beginning when the match is already near it', () => {
    const html = excerptHtml(`facade ${'word '.repeat(80)}`, 'facade')

    expect(html.startsWith('<mark>facade</mark>')).toBe(true)
  })

  it('returns the plain text when nothing matches', () => {
    expect(excerptHtml('Nothing to see', 'facade')).toBe('Nothing to see')
  })

  it('survives regex metacharacters in the query', () => {
    expect(excerptHtml('Use $config->get() here', '$config->get(')).toContain('<mark>')
  })

  it('handles an empty text', () => {
    expect(excerptHtml('', 'facade')).toBe('')
  })
})
