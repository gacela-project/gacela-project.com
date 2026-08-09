import { html, raw, type Raw } from '../forge/render/index.ts'

/**
 * One Gacela module, drawn as what it actually is.
 *
 * The boundary is a closed box, and three of the four classes sit on it: the
 * Facade where calls come in, the Provider where the module reaches sideways to
 * its neighbours, and the Config where it reads the project's settings. Only
 * the Factory, and everything it builds, is interior and unreachable from
 * outside. That is the entire argument for the framework, so the drawing makes
 * it rather than an adjective does.
 *
 * Selecting a class is a radio group, which means this works with the keyboard,
 * works with no JavaScript, and needs no state management to speak of. What you
 * click is the box itself: each one wears an HTML label, laid over the drawing
 * and driving the radio underneath. There is no legend under the diagram,
 * because a list of the same four names is a second place to look at the moment
 * the reader is already looking at the first.
 */

export type Box = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * The drawing's own coordinate space, cropped to the ink. Both the rects and
 * the labels over them are expressed in it, so neither can drift from the
 * other.
 */
export const VIEW_BOX = { x: 0, y: 56, width: 780, height: 344 } as const

/**
 * The mark that says a box can be chosen: hollow on the three you can pick,
 * filled on the one you are reading about.
 *
 * A drawing gives a reader no reason to think it can be touched, and the hint
 * under it only speaks to whoever reads it. This says the same thing in the
 * shape everyone already knows, and it is not a metaphor: these boxes really
 * are a radio group, so the drawing now looks like what it is.
 *
 * The dot takes a column at the leading edge of the box and the label centres
 * in what is left, so the two are placed from one set of numbers rather than
 * nudged until they look right.
 */
const DOT_INSET = 14
const DOT_RADIUS = 4.5
const DOT_COLUMN = 22

/** Where each class sits. Read by the drawing and by the label over it. */
export const CLASS_BOXES = {
  facade: { x: 126, y: 142, width: 104, height: 50 },
  factory: { x: 290, y: 142, width: 104, height: 50 },
  provider: { x: 548, y: 250, width: 124, height: 50 },
  config: { x: 272, y: 306, width: 104, height: 48 },
} as const satisfies Record<string, Box>

/**
 * A box as percentages of the viewBox, handed to CSS as custom properties.
 *
 * The SVG scales with its container, so a label pinned in percentages of the
 * same box stays over its rect at every width, with no measuring at runtime and
 * nothing to recompute when the drawing is rescaled.
 */
export function overlayVars(box: Box): string {
  const pct = (value: number): string => `${Number((value * 100).toFixed(4))}%`

  return [
    `--x:${pct((box.x - VIEW_BOX.x) / VIEW_BOX.width)}`,
    `--y:${pct((box.y - VIEW_BOX.y) / VIEW_BOX.height)}`,
    `--w:${pct(box.width / VIEW_BOX.width)}`,
    `--h:${pct(box.height / VIEW_BOX.height)}`,
  ].join(';')
}

type Part = {
  readonly id: keyof typeof CLASS_BOXES
  readonly name: string
  readonly route: string
  readonly note: Raw
}

const PARTS: readonly Part[] = [
  {
    id: 'facade',
    name: 'Facade',
    route: '/docs/facade',
    note: html`<strong>The only door.</strong> Every other module in your application talks to this
      module through its Facade, and through nothing else. Change what is behind it freely: nobody
      outside can depend on what they cannot reach.`,
  },
  {
    id: 'factory',
    name: 'Factory',
    route: '/docs/factory',
    note: html`<strong>Wires the inside.</strong> The Factory builds this module's own services and
      hands them their dependencies. It is where object construction lives, so your domain classes
      never have to know how they were made.`,
  },
  {
    id: 'provider',
    name: 'Provider',
    route: '/docs/provider',
    note: html`<strong>Reaches outside.</strong> When the module needs something another module
      owns, the Provider resolves it. Extra-dependencies enter here and nowhere else, which keeps
      the coupling in one readable file.`,
  },
  {
    id: 'config',
    name: 'Config',
    route: '/docs/config',
    note: html`<strong>Reads the settings.</strong> The Config gives the Factory typed access to the
      project's configuration files, so a value can change per environment without any class inside
      the module learning where it came from.`,
  },
]

export function moduleDiagram(): Raw {
  return html`<figure class="diagram">
    ${PARTS.map(
      (part, index) => html`<input
        type="radio"
        name="module-part"
        id="part-${part.id}"
        ${raw(index === 0 ? 'checked' : '')}
      />`,
    )}

    <div class="diagram__frame">
      <div class="diagram__stage" role="group" aria-label="The four classes of a module">
        ${drawing()}
        ${PARTS.map(
          (part) => html`<label
            class="diagram__hit"
            data-part="${part.id}"
            for="part-${part.id}"
            style="${overlayVars(CLASS_BOXES[part.id])}"
            ><span class="visually-hidden">${part.name}</span></label
          >`,
        )}
      </div>
    </div>

    <figcaption class="diagram__caption">
      ${PARTS.map(
        (part) => html`<p class="diagram__note">
          ${part.note} <a href="${part.route}">Read about the ${part.name}</a>
        </p>`,
      )}
    </figcaption>
  </figure>`
}

/**
 * One class, drawn in its box.
 *
 * The label is the class rather than its file. Every one of these lives in a
 * .php file, so the extension told the reader nothing that separated one box
 * from another, and four repetitions of it cost enough width to push the type
 * down a size. Where the code sits is already on the sheet: the boundary is
 * labelled src/Checkout and the Config reads config/*.php.
 *
 * The box and the label both come from the one set of coordinates, so the text
 * cannot drift out of the rectangle it names.
 */
function classPart(id: keyof typeof CLASS_BOXES): Raw {
  const box = CLASS_BOXES[id]
  const part = PARTS.find((candidate) => candidate.id === id)

  if (part === undefined) throw new Error(`The drawing has a box for "${id}" but no class.`)

  const middle = box.y + box.height / 2

  return html`<g class="part part--class part--${id}">
    <rect
      class="part__box"
      x="${box.x}"
      y="${box.y}"
      width="${box.width}"
      height="${box.height}"
    />
    <circle class="part__dot" cx="${box.x + DOT_INSET}" cy="${middle}" r="${DOT_RADIUS}" />
    <text class="part__name" x="${box.x + (DOT_COLUMN + box.width) / 2}" y="${middle + 1}">
      ${part.name}
    </text>
  </g>`
}

/**
 * The viewBox is cropped to the drawing rather than starting at the origin: the
 * ink runs from y=66 to y=388, so a 0..420 box carried 98 units of empty space,
 * which at render size left the hero's right column 159px taller than its left
 * and opened a hole under the headline. Cropping moves no coordinate.
 */
function drawing(): Raw {
  return html`<svg
    class="diagram__svg"
    viewBox="0 56 780 344"
    role="img"
    aria-label="A Gacela module drawn as a closed boundary. Three classes sit on the boundary itself: the Facade on the left, where every call from another module arrives; the Provider on the right, which resolves what the module needs from its neighbours; and the Config at the bottom, which reads the project configuration files. Inside the boundary the Factory builds the module's own services and domain classes, and nothing outside can reach them."
  >
    <defs>
      <marker
        id="diagram-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 Z" class="diagram__arrowhead" />
      </marker>
    </defs>

    <!-- The module boundary. Three of the four classes sit ON it: the Facade
         where calls come in, the Provider where the module reaches sideways to
         its neighbours, and the Config where it reads the project's settings.
         Only the Factory is entirely interior. -->
    <rect class="diagram__boundary" x="170" y="90" width="440" height="240" rx="8" />
    <text class="diagram__label" x="170" y="78">src/Checkout</text>

    <text class="diagram__label" x="26" y="146">any module</text>
    <path class="diagram__flow" d="M26,168 H120" marker-end="url(#diagram-arrow)" />

    ${classPart('facade')}

    <path class="diagram__flow" d="M232,167 H284" marker-end="url(#diagram-arrow)" />

    ${classPart('factory')}

    <path class="diagram__flow" d="M396,167 H444" marker-end="url(#diagram-arrow)" />

    <g class="part part--outside">
      <rect class="part__box" x="450" y="134" width="140" height="66" />
      <text class="part__name" x="520" y="160">your services</text>
      <text class="part__name" x="520" y="180">your domain</text>
    </g>

    <path class="diagram__flow" d="M324,304 V198" marker-end="url(#diagram-arrow)" />

    ${classPart('config')}

    <text class="diagram__label" x="272" y="384">config/*.php</text>
    <path class="diagram__flow" d="M324,372 V358" marker-end="url(#diagram-arrow)" />

    <path class="diagram__flow" d="M566,248 L370,198" marker-end="url(#diagram-arrow)" />

    ${classPart('provider')}

    <text class="diagram__label" x="678" y="258">other modules</text>
    <path class="diagram__flow" d="M676,275 H762" marker-end="url(#diagram-arrow)" />
  </svg>`
}
