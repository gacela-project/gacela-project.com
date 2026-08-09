import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from '../../src/forge/content/index.ts'

describe('parseFrontmatter', () => {
  it('returns the whole document as body when there is no frontmatter', () => {
    const result = parseFrontmatter('# Facade\n\nText.')

    expect(result.frontmatter).toEqual({})
    expect(result.body).toBe('# Facade\n\nText.')
  })

  it('reads scalar keys and strips the block from the body', () => {
    const result = parseFrontmatter('---\ntitle: Facade\ndescription: The door\n---\n# Facade\n')

    expect(result.frontmatter).toEqual({ title: 'Facade', description: 'The door' })
    expect(result.body).toBe('# Facade\n')
  })

  it('unquotes values so a colon inside a title survives', () => {
    const result = parseFrontmatter('---\ntitle: "Gacela: the door"\nlayout: \'home\'\n---\nbody')

    expect(result.frontmatter.title).toBe('Gacela: the door')
    expect(result.frontmatter.layout).toBe('home')
  })

  it('reads booleans as booleans', () => {
    const result = parseFrontmatter('---\nunlisted: true\n---\nbody')

    expect(result.frontmatter.unlisted).toBe(true)
  })

  it('ignores comments and blank lines inside the block', () => {
    const result = parseFrontmatter('---\n# a comment\n\ntitle: Config\n---\nbody')

    expect(result.frontmatter).toEqual({ title: 'Config' })
  })

  it('leaves a horizontal rule in the body alone', () => {
    const result = parseFrontmatter('Intro\n\n---\n\nMore text')

    expect(result.frontmatter).toEqual({})
    expect(result.body).toBe('Intro\n\n---\n\nMore text')
  })

  it('tolerates windows line endings', () => {
    const result = parseFrontmatter('---\r\ntitle: Factory\r\n---\r\n# Factory\r\n')

    expect(result.frontmatter.title).toBe('Factory')
    expect(result.body.trimStart()).toBe('# Factory\n')
  })

  it('treats an unterminated block as body text rather than throwing', () => {
    const result = parseFrontmatter('---\ntitle: Broken\n\nstill going')

    expect(result.frontmatter).toEqual({})
    expect(result.body).toBe('---\ntitle: Broken\n\nstill going')
  })

  it('rejects keys it does not know about so typos surface at build time', () => {
    expect(() => parseFrontmatter('---\ntitel: Facade\n---\nbody')).toThrow(/titel/)
  })
})
