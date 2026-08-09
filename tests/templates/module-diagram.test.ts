import { describe, expect, it } from 'vitest'

import { CLASS_BOXES, VIEW_BOX, moduleDiagram, overlayVars } from '../../src/templates/module-diagram.ts'
import { render } from '../../src/forge/render/index.ts'

/**
 * The four class boxes are drawn in the SVG's own coordinates and are made
 * clickable by an HTML label laid over each one. The label is positioned in
 * percentages of the same viewBox, which is what keeps the two in register at
 * every width, so the arithmetic that converts between them is worth pinning.
 */
describe('overlayVars', () => {
  it('places a box by its share of the viewBox', () => {
    expect(overlayVars(CLASS_BOXES.facade)).toBe('--x:16.1538%;--y:25%;--w:13.3333%;--h:14.5349%')
  })

  it('puts a box at the very start of the viewBox at the origin', () => {
    expect(overlayVars({ x: VIEW_BOX.x, y: VIEW_BOX.y, width: 78, height: 34.4 })).toBe(
      '--x:0%;--y:0%;--w:10%;--h:10%',
    )
  })

  it('measures the top from the viewBox, which does not start at zero', () => {
    const box = { x: 0, y: VIEW_BOX.y + VIEW_BOX.height / 2, width: 10, height: 10 }

    expect(overlayVars(box)).toContain('--y:50%')
  })
})

describe('moduleDiagram', () => {
  it('gives every class box a label that drives its radio', () => {
    const html = render(moduleDiagram())

    for (const id of Object.keys(CLASS_BOXES)) {
      expect(html).toContain(`for="part-${id}"`)
      expect(html).toContain(`data-part="${id}"`)
    }
  })

  it('no longer carries a legend under the drawing', () => {
    const html = render(moduleDiagram())

    expect(html).not.toContain('diagram__legend')
    expect(html).not.toContain('diagram__choice')
  })

  it('names each box for the class, not the file it lives in', () => {
    const html = render(moduleDiagram())

    for (const name of ['Facade', 'Factory', 'Provider', 'Config']) {
      expect(html).toContain(`>\n      ${name}\n    </text>`)
      expect(html).not.toContain(`${name}.php`)
    }
  })

  it('marks every class box as one of a set to choose from', () => {
    const html = render(moduleDiagram())

    expect(html.match(/class="part__dot"/g)).toHaveLength(4)
  })

  it('puts the dot on the vertical centre of its box', () => {
    const html = render(moduleDiagram())
    const { facade } = CLASS_BOXES

    expect(html).toContain(`cy="${facade.y + facade.height / 2}"`)
  })

  it('leaves the label room for the dot rather than centring over it', () => {
    const html = render(moduleDiagram())
    const { facade } = CLASS_BOXES
    const centreOfWholeBox = facade.x + facade.width / 2

    expect(html).not.toContain(`class="part__name" x="${centreOfWholeBox}"`)
  })

  /* The dot on each box carries this now, in the place the reader is looking.
     A line of instructions in the corner said the same thing further away. */
  it('says the boxes can be chosen without a line of instructions', () => {
    const html = render(moduleDiagram())

    expect(html).not.toContain('diagram__hint')
    expect(html.match(/class="part__dot"/g)).toHaveLength(4)
  })
})
