import { html, raw, type Raw } from '../forge/render/index.ts'
import type { RenderedPage, SiteConfig } from '../forge/types.ts'
import { icons } from './icons.ts'
import { moduleDiagram } from './module-diagram.ts'

export type HomeContext = {
  readonly site: SiteConfig
  readonly page: RenderedPage
}

/**
 * What the previous site called "Beyond the basics". The wording is theirs; the
 * one change is the Provides link, which pointed at an anchor that does not
 * exist on either site.
 */
const CAPABILITIES = [
  {
    title: 'Container DI',
    summary: 'Bindings, tags, hooks, definitions, scopes and lazy services',
    route: '/docs/bindings#factory-services',
  },
  {
    title: 'Caching',
    summary: 'Three layers: framework resolution, cacheable methods, file cache',
    route: '/docs/caching',
  },
  {
    title: 'Tooling',
    summary: 'cache:warm, doctor, debug:module, debug:graph, profile:report',
    route: '/docs/gacela-script',
  },
  {
    title: 'Lifecycle events',
    summary: 'Zero-cost bootstrap, config, container and cache events for tracing',
    route: '/docs/events',
  },
  {
    title: 'Health checks',
    summary: 'Per-module status for the doctor CLI and HTTP endpoints',
    route: '/docs/health-checks',
  },
  {
    title: 'Inject attribute',
    summary: '#[Inject] on constructors, properties and setters',
    route: '/docs/inject',
  },
  {
    title: 'Provides attribute',
    summary: 'Declarative #[Provides] for provider service registration',
    route: '/docs/provider#more-provides-patterns',
  },
  {
    title: 'Testing',
    summary: 'GacelaTestCase: bootstrap isolation and event-backed assertions',
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
          <h1 class="hero__title">Build <em>modular</em> PHP applications.</h1>

          <p class="hero__lede">
            Split your application into modules that talk through one door.
            Everything behind it stays private.
          </p>

          <div class="hero__actions">
            <a class="button button--primary" href="/docs">
              Browse the documentation
              <span class="button__arrow" aria-hidden="true">&rarr;</span>
            </a>
            <a class="button" href="/used-in">See production code</a>
          </div>
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
    <div class="container container--wide">
      <div class="section__head">
        <p class="eyebrow">Quickstart</p>
        <h2 class="section__title">A module in three files</h2>
        <p class="section__lede">
          This is the whole ceremony: a Facade in front, a Factory wiring a service behind it, and
          one bootstrap call at your entry point. The Facade resolves its sibling Factory
          automatically.
        </p>
      </div>

      <div class="prose prose--code">${raw(page.html)}</div>
    </div>
  </section>`
}

function capabilities(): Raw {
  return html`<section class="section">
    <div class="container container--wide">
      <div class="section__head">
        <p class="eyebrow">Features</p>
        <h2 class="section__title">Beyond the basics</h2>
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
    <div class="container container--wide cta">
      <p class="eyebrow">Get started</p>
      <h2 class="cta__title">Start your first module</h2>

      <p class="hero__install">
        <span class="hero__install-prompt" aria-hidden="true">$</span>
        <span data-copy-text>composer require gacela-project/gacela:^2.2</span>
        <button
          type="button"
          class="hero__install-copy"
          data-copy
          aria-label="Copy the install command"
        >
          ${icons.copy}
        </button>
      </p>

      <p class="cta__links">
        <a href="/docs/quickstart">Read the quickstart</a>
        <span aria-hidden="true">&middot;</span>
        <a href="/docs/upgrading#from-1-21-to-2-0">Upgrade from 1.21</a>
        <span aria-hidden="true">&middot;</span>
        <a href="/used-in">See who uses Gacela</a>
      </p>
    </div>
  </section>`
}
