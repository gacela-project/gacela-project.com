import { raw, type Raw } from '../forge/render/index.ts'

/**
 * Inline icons.
 *
 * A handful of 24x24 line glyphs, drawn here rather than pulled from an icon
 * package: eight icons is not worth a dependency, and inlining them means they
 * inherit `currentColor` and cost no request.
 */

const stroke = (body: string): Raw =>
  raw(
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" ` +
      `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`,
  )

export const icons = {
  search: stroke('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),

  sun: stroke(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4' +
      'M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  ),

  moon: stroke('<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z"/>'),

  monitor: stroke('<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>'),

  chevronDown: stroke('<path d="m6 9 6 6 6-6"/>'),

  menu: stroke('<path d="M4 7h16M4 12h16M4 17h16"/>'),

  close: stroke('<path d="M6 6l12 12M18 6L6 18"/>'),

  /** Turns into a minus when its details opens, so one glyph shows both states. */
  plus: raw(
    '<svg class="plus-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.75" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M4 12h16"/><path class="plus-glyph__bar" d="M12 4v16"/></svg>',
  ),

  /** The one disclosure affordance on the site; it rotates when its details opens. */
  disclosure: raw(
    '<svg class="disclosure-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="m6 9 6 6 6-6"/></svg>',
  ),

  arrowRight: stroke('<path d="M4 12h15m-6-7 7 7-7 7"/>'),

  /**
   * Three lines of decreasing length, for the table of contents. Drawn on a
   * 16 grid rather than the 24 the rest use: at this size the hairline weight
   * is the point of it, and rescaling would coarsen it.
   */
  contents: raw(
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" ' +
      'stroke-linecap="square" aria-hidden="true">' +
      '<path d="M1.83301 7.99992H14.1663M1.83301 3.83325H14.1663M1.83301 12.1666H7.66634"/></svg>',
  ),

  copy: stroke(
    '<rect x="9" y="9" width="12" height="12" rx="2"/>' +
      '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  ),

  github: raw(
    '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
      '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 ' +
      '0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 ' +
      '1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 ' +
      '0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 ' +
      '1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 ' +
      '1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>',
  ),

  x: raw(
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8' +
      'l-5.3-7-6.1 7H1.4l7.9-9.1L1 2h7l4.8 6.4L18.2 2Zm-1.2 18h1.9L7.1 3.9H5.1L17 20Z"/></svg>',
  ),
} as const satisfies Record<string, Raw>
