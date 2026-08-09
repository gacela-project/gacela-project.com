import { describe, expect, it } from 'vitest'
import { attrs, classes, html, raw, render } from '../../src/forge/render/index.ts'

describe('html', () => {
  it('escapes interpolated values by default', () => {
    expect(render(html`<p>${'<script>'}</p>`)).toBe('<p>&lt;script&gt;</p>')
  })

  it('escapes quotes so a value is safe inside an attribute', () => {
    expect(render(html`<a title="${'a" onclick="x'}">`)).toBe('<a title="a&quot; onclick=&quot;x">')
  })

  it('leaves raw values alone', () => {
    expect(render(html`<div>${raw('<b>bold</b>')}</div>`)).toBe('<div><b>bold</b></div>')
  })

  it('joins arrays with no separator, so a mapped list needs no join call', () => {
    expect(render(html`<ul>${[raw('<li>a</li>'), raw('<li>b</li>')]}</ul>`)).toBe(
      '<ul><li>a</li><li>b</li></ul>',
    )
  })

  it('renders nothing for null, undefined and false', () => {
    expect(render(html`<p>${null}${undefined}${false}</p>`)).toBe('<p></p>')
  })

  it('renders zero, because zero is a value', () => {
    expect(render(html`<p>${0}</p>`)).toBe('<p>0</p>')
  })

  it('nests, since a template is itself raw', () => {
    const inner = html`<b>${'&'}</b>`

    expect(render(html`<p>${inner}</p>`)).toBe('<p><b>&amp;</b></p>')
  })

  it('escapes a value that arrives as a number without altering it', () => {
    expect(render(html`<span>${42}</span>`)).toBe('<span>42</span>')
  })
})

describe('classes', () => {
  it('joins the truthy names', () => {
    expect(classes('a', false, undefined, 'b')).toBe('a b')
  })

  it('returns an empty string when nothing applies', () => {
    expect(classes(false, undefined)).toBe('')
  })
})

describe('attrs', () => {
  it('renders present attributes with a leading space', () => {
    expect(render(attrs({ id: 'x', 'data-y': '1' }))).toBe(' id="x" data-y="1"')
  })

  it('omits null, undefined and false attributes', () => {
    expect(render(attrs({ id: null, hidden: false, title: undefined }))).toBe('')
  })

  it('renders true as a bare boolean attribute', () => {
    expect(render(attrs({ checked: true }))).toBe(' checked')
  })

  it('escapes attribute values', () => {
    expect(render(attrs({ title: 'a"b' }))).toBe(' title="a&quot;b"')
  })

  // The bug this guards: attrs used to return a plain string, which html`` then
  // escaped, turning every attribute it produced into inert text.
  it('survives interpolation into a template without being escaped', () => {
    expect(render(html`<a${attrs({ 'aria-current': 'page' })}>x</a>`)).toBe(
      '<a aria-current="page">x</a>',
    )
  })
})
