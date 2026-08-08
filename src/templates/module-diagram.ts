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
 * works with no JavaScript, and needs no state management to speak of.
 */

type Part = {
  readonly id: string
  readonly name: string
  readonly file: string
  readonly route: string
  readonly note: Raw
}

const PARTS: readonly Part[] = [
  {
    id: 'facade',
    name: 'Facade',
    file: 'Facade.php',
    route: '/docs/facade',
    note: html`<strong>The only door.</strong> Every other module in your application talks to this
      module through its Facade, and through nothing else. Change what is behind it freely: nobody
      outside can depend on what they cannot reach.`,
  },
  {
    id: 'factory',
    name: 'Factory',
    file: 'Factory.php',
    route: '/docs/factory',
    note: html`<strong>Wires the inside.</strong> The Factory builds this module's own services and
      hands them their dependencies. It is where object construction lives, so your domain classes
      never have to know how they were made.`,
  },
  {
    id: 'provider',
    name: 'Provider',
    file: 'Provider.php',
    route: '/docs/provider',
    note: html`<strong>Reaches outside.</strong> When the module needs something another module
      owns, the Provider resolves it. Extra-dependencies enter here and nowhere else, which keeps
      the coupling in one readable file.`,
  },
  {
    id: 'config',
    name: 'Config',
    file: 'Config.php',
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
        aria-label="Show the ${part.name}"
      />`,
    )}

    <div class="diagram__frame">${drawing()}</div>

    <div class="diagram__legend" role="group" aria-label="The four classes of a module">
      ${PARTS.map(
        (part) => html`<label class="diagram__choice" for="part-${part.id}">
          <span class="diagram__choice-name">${part.name}</span>
          <span class="diagram__choice-file">${part.file}</span>
        </label>`,
      )}
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

function drawing(): Raw {
  return html`<svg
    class="diagram__svg"
    viewBox="0 0 780 420"
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

    <g class="part part--class part--facade">
      <rect class="part__box" x="126" y="142" width="104" height="50" />
      <text class="part__name" x="178" y="168">Facade</text>
    </g>

    <path class="diagram__flow" d="M232,167 H284" marker-end="url(#diagram-arrow)" />

    <g class="part part--class part--factory">
      <rect class="part__box" x="290" y="142" width="104" height="50" />
      <text class="part__name" x="342" y="168">Factory</text>
    </g>

    <path class="diagram__flow" d="M396,167 H444" marker-end="url(#diagram-arrow)" />

    <g class="part part--outside">
      <rect class="part__box" x="450" y="134" width="140" height="66" />
      <text class="part__name" x="520" y="160">your services</text>
      <text class="part__name" x="520" y="180">your domain</text>
    </g>

    <path class="diagram__flow" d="M324,304 V198" marker-end="url(#diagram-arrow)" />

    <g class="part part--class part--config">
      <rect class="part__box" x="272" y="306" width="104" height="48" />
      <text class="part__name" x="324" y="331">Config</text>
    </g>

    <text class="diagram__label" x="272" y="384">config/*.php</text>
    <path class="diagram__flow" d="M324,372 V358" marker-end="url(#diagram-arrow)" />

    <path class="diagram__flow" d="M566,248 L370,198" marker-end="url(#diagram-arrow)" />

    <g class="part part--class part--provider">
      <rect class="part__box" x="548" y="250" width="124" height="50" />
      <text class="part__name" x="610" y="276">Provider</text>
    </g>

    <text class="diagram__label" x="678" y="258">other modules</text>
    <path class="diagram__flow" d="M676,275 H762" marker-end="url(#diagram-arrow)" />
  </svg>`
}
