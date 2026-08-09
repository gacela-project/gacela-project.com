import { describe, expect, it } from 'vitest'

import { GENERATION_PATH, injectLiveReload } from '../../src/forge/cli/live-reload.ts'

describe('injectLiveReload', () => {
  it('puts the watcher last in the body, after the page it watches', () => {
    const html = injectLiveReload('<html><body><p>Facade</p></body></html>')

    expect(html.indexOf('<script')).toBeGreaterThan(html.indexOf('<p>Facade</p>'))
    expect(html.indexOf('</script>')).toBeLessThan(html.indexOf('</body>'))
  })

  it('asks the server for the generation it serves', () => {
    const html = injectLiveReload('<html><body></body></html>')

    expect(html).toContain(GENERATION_PATH)
  })

  it('still reaches a document that closes no body', () => {
    const html = injectLiveReload('<p>fragment</p>')

    expect(html).toContain('<p>fragment</p>')
    expect(html).toContain('<script')
  })

  it('leaves the page it was given otherwise intact', () => {
    const page = '<html><head><title>Facade</title></head><body><h1>Facade</h1></body></html>'

    expect(injectLiveReload(page)).toContain('<head><title>Facade</title></head>')
  })
})
