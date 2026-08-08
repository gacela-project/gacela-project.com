import { html, raw, type Raw } from '../forge/render/index.ts'
import type { RenderedPage, SiteConfig } from '../forge/types.ts'
import { icons } from './icons.ts'
import { moduleDiagram } from './module-diagram.ts'

export type HomeContext = {
  readonly site: SiteConfig
  readonly page: RenderedPage
}

/** Things a reader is likely to want next, once the shape of a module lands. */
const CAPABILITIES = [
  {
    title: 'Dependency injection',
    summary: 'Contextual bindings, aliases, protected values and factory services.',
    route: '/docs/bindings',
  },
  {
    title: 'Caching',
    summary: 'Three layers: framework resolution, cacheable methods and a file cache.',
    route: '/docs/caching',
  },
  {
    title: 'CLI commands',
    summary: 'cache:warm, doctor, debug:dependencies and profile:report.',
    route: '/docs/gacela-script',
  },
  {
    title: 'Health checks',
    summary: 'Per-module status for the doctor command and for HTTP endpoints.',
    route: '/docs/health-checks',
  },
  {
    title: 'The Inject attribute',
    summary: 'Opt-in constructor injection, with per-project implementation overrides.',
    route: '/docs/inject',
  },
  {
    title: 'Static analysis',
    summary: 'PHPStan and Psalm extensions that understand Facades and Factories.',
    route: '/docs/static-analysis',
  },
  {
    title: 'Framework integration',
    summary: 'Run Gacela modules inside Symfony, Laravel or no framework at all.',
    route: '/docs/other-frameworks',
  },
  {
    title: 'Testing',
    summary: 'Swap a module’s bindings for the duration of a test and put them back.',
    route: '/docs/testing',
  },
] as const

export function homeLayout(context: HomeContext): Raw {
  return html`${hero()} ${walkthrough(context.page)} ${capabilities()} ${closing()}`
}

function hero(): Raw {
  return html`<section class="hero">
    <div class="container container--wide">
      <div class="hero__grid">
        <div>
          <h1 class="hero__title">Every module has <em>one door</em>.</h1>

          <p class="hero__lede">
            Gacela is a framework for building modular PHP applications. Every module exposes the
            same four classes, and the rest of your code only ever calls the Facade. What lives
            behind it stays yours to change.
          </p>

          <div class="hero__actions">
            <a class="button button--primary" href="/docs/quickstart">
              Read the quickstart
              <span class="button__arrow" aria-hidden="true">&rarr;</span>
            </a>
            <a class="button" href="/about">Why modules</a>
          </div>

          <p class="hero__install">
            <span class="hero__install-prompt" aria-hidden="true">$</span>
            <span data-copy-text>composer require gacela-project/gacela</span>
            <button
              type="button"
              class="hero__install-copy"
              data-copy
              aria-label="Copy the install command"
            >
              ${icons.copy}
            </button>
          </p>
        </div>

        ${moduleDiagram()}
      </div>
    </div>
  </section>`
}

/**
 * The body of content/pages/index.md, which is the three-file example. The code
 * lives in content rather than in this template so that it is edited the same
 * way every other sample on the site is.
 */
function walkthrough(page: RenderedPage): Raw {
  return html`<section class="section">
    <div class="container">
      <div class="section__head">
        <p class="eyebrow">Quickstart</p>
        <h2 class="section__title">A working module is three files</h2>
        <p class="section__lede">
          A Facade in front, a Factory wiring one service behind it, and a single bootstrap call at
          your entry point. The Facade finds its sibling Factory on its own, so there is nothing to
          register and nothing to configure.
        </p>
      </div>

      <div class="prose prose--code">${raw(page.html)}</div>
    </div>
  </section>`
}

function capabilities(): Raw {
  return html`<section class="section">
    <div class="container">
      <div class="section__head">
        <p class="eyebrow">Reference</p>
        <h2 class="section__title">What else is in the box</h2>
        <p class="section__lede">
          The four classes are the whole of the required surface. Everything below is optional, and
          none of it changes how a module is written.
        </p>
      </div>

      <ul class="index-list" role="list">
        ${CAPABILITIES.map(
          (item) => html`<li class="index-list__item">
            <a class="index-list__link" href="${item.route}">
              <span>
                <span class="index-list__title">${item.title}</span>
                <span class="index-list__summary">${item.summary}</span>
              </span>
              <span class="index-list__arrow" aria-hidden="true">&rarr;</span>
            </a>
          </li>`,
        )}
      </ul>
    </div>
  </section>`
}

function closing(): Raw {
  return html`<section class="section">
    <div class="container cta">
      <p class="eyebrow">Get started</p>
      <h2 class="cta__title">Write your first module</h2>
      <p class="section__lede">
        Install the package, create four files, and call the Facade. The quickstart takes about five
        minutes and leaves you with a module you can build on.
      </p>
      <div class="cta__links">
        <a class="button button--primary" href="/docs/quickstart">
          Read the quickstart
          <span class="button__arrow" aria-hidden="true">&rarr;</span>
        </a>
        <a class="button" href="/used-in">See who uses Gacela</a>
      </div>
    </div>
  </section>`
}
