import { describe, expect, it } from 'vitest'
import { createSlugger, slugify } from '../../src/forge/markdown/index.ts'

describe('slugify', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slugify('Getting started')).toBe('getting-started')
  })

  it('drops punctuation rather than encoding it', () => {
    expect(slugify('Why decoupling?')).toBe('why-decoupling')
  })

  it('keeps the anchors the previous site published', () => {
    expect(slugify('#[Provides] attribute')).toBe('provides-attribute')
    expect(slugify('Factory services')).toBe('factory-services')
    expect(slugify('Gacela in a file')).toBe('gacela-in-a-file')
  })

  it('strips inline code markers and link syntax from heading text', () => {
    expect(slugify('The `Facade` class')).toBe('the-facade-class')
    expect(slugify('See [the Factory](/docs/factory)')).toBe('see-the-factory')
  })

  it('collapses runs of separators and trims the ends', () => {
    expect(slugify('  Extensions  &  Plugins  ')).toBe('extensions-plugins')
    expect(slugify('--Config--')).toBe('config')
  })

  it('keeps digits', () => {
    expect(slugify('PHP 8.1 and up')).toBe('php-8-1-and-up')
  })

  it('transliterates accents so routes stay ascii', () => {
    expect(slugify('Jesús Valera')).toBe('jesus-valera')
  })

  it('falls back to a stable name when nothing survives', () => {
    expect(slugify('???')).toBe('section')
  })
})

describe('createSlugger', () => {
  it('suffixes repeats so every anchor on a page is unique', () => {
    const slug = createSlugger()

    expect(slug('Usage')).toBe('usage')
    expect(slug('Usage')).toBe('usage-1')
    expect(slug('Usage')).toBe('usage-2')
  })

  it('keeps separate sluggers independent', () => {
    const first = createSlugger()
    const second = createSlugger()

    expect(first('Usage')).toBe('usage')
    expect(second('Usage')).toBe('usage')
  })
})
