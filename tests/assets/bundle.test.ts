import { describe, expect, it } from 'vitest'
import {
  bundleClientScripts,
  fingerprint,
  fingerprintedPath,
  inlineImports,
} from '../../src/forge/assets/index.ts'

const reader = (files: Record<string, string>) => async (path: string) => {
  const contents = files[path]
  if (contents === undefined) throw new Error(`missing ${path}`)
  return contents
}

describe('inlineImports', () => {
  it('replaces an import with the contents of the imported file', async () => {
    const css = await inlineImports(
      'index.css',
      reader({ 'index.css': "@import url('a.css');\nbody { color: red; }", 'a.css': '.a {}' }),
    )

    expect(css).toContain('.a {}')
    expect(css).toContain('body { color: red; }')
    expect(css).not.toContain('@import')
  })

  it('keeps the order of the source file, so cascade order survives', async () => {
    const css = await inlineImports(
      'index.css',
      reader({
        'index.css': "@import url('a.css');\n@import url('b.css');",
        'a.css': '.a {}',
        'b.css': '.b {}',
      }),
    )

    expect(css.indexOf('.a {}')).toBeLessThan(css.indexOf('.b {}'))
  })

  it('follows imports recursively', async () => {
    const css = await inlineImports(
      'index.css',
      reader({
        'index.css': "@import url('a.css');",
        'a.css': "@import url('nested/b.css');",
        'nested/b.css': '.b {}',
      }),
    )

    expect(css).toContain('.b {}')
  })

  it('resolves nested imports relative to the file that declares them', async () => {
    const css = await inlineImports(
      'index.css',
      reader({
        'index.css': "@import url('components/a.css');",
        'components/a.css': "@import url('b.css');",
        'components/b.css': '.b {}',
      }),
    )

    expect(css).toContain('.b {}')
  })

  it('includes a file imported twice only once', async () => {
    const css = await inlineImports(
      'index.css',
      reader({
        'index.css': "@import url('a.css');\n@import url('b.css');",
        'a.css': "@import url('shared.css');",
        'b.css': "@import url('shared.css');",
        'shared.css': '.shared {}',
      }),
    )

    expect(css.match(/\.shared \{\}/g)).toHaveLength(1)
  })

  it('accepts both quoted and url() import syntax', async () => {
    const css = await inlineImports(
      'index.css',
      reader({ 'index.css': '@import "a.css";\n@import url(b.css);', 'a.css': '.a {}', 'b.css': '.b {}' }),
    )

    expect(css).toContain('.a {}')
    expect(css).toContain('.b {}')
  })

  it('leaves the layer declaration in place at the top', async () => {
    const css = await inlineImports(
      'index.css',
      reader({ 'index.css': "@layer reset, components;\n@import url('a.css');", 'a.css': '.a {}' }),
    )

    expect(css.trimStart().startsWith('@layer reset, components;')).toBe(true)
  })

  it('does not touch url() references that are not imports', async () => {
    const css = await inlineImports(
      'index.css',
      reader({ 'index.css': "@font-face { src: url('/fonts/x.woff2'); }" }),
    )

    expect(css).toContain("url('/fonts/x.woff2')")
  })

  it('reports which file an unreadable import came from', async () => {
    await expect(
      inlineImports('index.css', reader({ 'index.css': "@import url('gone.css');" })),
    ).rejects.toThrow(/index\.css/)
  })
})

describe('fingerprint', () => {
  it('is stable for the same contents', () => {
    expect(fingerprint('body {}')).toBe(fingerprint('body {}'))
  })

  it('changes when the contents change', () => {
    expect(fingerprint('body {}')).not.toBe(fingerprint('body { }'))
  })

  it('is short enough to read in a filename', () => {
    expect(fingerprint('body {}')).toMatch(/^[a-z0-9]{8}$/)
  })

  it('accepts binary contents', () => {
    expect(fingerprint(new Uint8Array([1, 2, 3]))).toMatch(/^[a-z0-9]{8}$/)
  })
})

describe('fingerprintedPath', () => {
  it('puts the hash before the extension', () => {
    expect(fingerprintedPath('assets/styles.css', 'abcd1234')).toBe('assets/styles.abcd1234.css')
  })

  it('handles a name with several dots', () => {
    expect(fingerprintedPath('assets/app.min.js', 'abcd1234')).toBe('assets/app.min.abcd1234.js')
  })
})

describe('bundleClientScripts', () => {
  it('concatenates sources into one module', () => {
    const bundle = bundleClientScripts([
      { name: 'a.js', source: 'const x = 1' },
      { name: 'b.js', source: 'const y = 2' },
    ])

    expect(bundle).toContain('const x = 1')
    expect(bundle).toContain('const y = 2')
  })

  it('scopes each source so two files can declare the same name', () => {
    const bundle = bundleClientScripts([
      { name: 'a.js', source: 'const shared = 1' },
      { name: 'b.js', source: 'const shared = 2' },
    ])

    expect(() => new Function(bundle)).not.toThrow()
  })

  it('labels each section with its source file', () => {
    const bundle = bundleClientScripts([{ name: 'theme.js', source: 'const x = 1' }])

    expect(bundle).toContain('theme.js')
  })

  it('rejects a source that uses a top level import, which concatenation cannot support', () => {
    expect(() =>
      bundleClientScripts([{ name: 'a.js', source: "import x from './b.js'\n" }]),
    ).toThrow(/a\.js/)
  })

  it('drops the export keyword, which is illegal inside a block', () => {
    const bundle = bundleClientScripts([
      { name: 'a.js', source: 'export function score(n) { return n }\nexport const LIMIT = 8\n' },
    ])

    expect(bundle).not.toContain('export')
    expect(bundle).toContain('function score(n) { return n }')
    expect(bundle).toContain('const LIMIT = 8')
    expect(() => new Function(bundle)).not.toThrow()
  })

  it('drops a standalone export list', () => {
    const bundle = bundleClientScripts([
      { name: 'a.js', source: 'const a = 1\nconst b = 2\nexport { a, b }\n' },
    ])

    expect(bundle).not.toContain('export')
    expect(() => new Function(bundle)).not.toThrow()
  })

  it('leaves the word export alone inside a string or comment', () => {
    const bundle = bundleClientScripts([
      { name: 'a.js', source: 'const label = "export me"\n' },
    ])

    expect(bundle).toContain('"export me"')
  })
})
