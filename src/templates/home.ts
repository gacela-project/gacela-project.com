import { html, raw, type Raw } from '../forge/render/index.ts'
import type { RenderedPage, SiteConfig } from '../forge/types.ts'
import { icons } from './icons.ts'
import { moduleDiagram } from './module-diagram.ts'
import { debugGraph, debugModule, doctor, listModules } from './phel-sessions.ts'
import { terminal, type TerminalSession } from './terminal.ts'

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
    route: '/docs/cli',
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
  return html`${hero()} ${overview()} ${walkthrough(context.page)} ${inPractice()} ${capabilities()} ${closing()}`
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
 * A poster and a link, so YouTube hears nothing from the page until the reader
 * presses play. src/client/video.js turns the click into the player.
 */
function overview(): Raw {
  const title = 'Gacela in 60 seconds'

  return html`<section class="section">
    <div class="container container--wide">
      <div class="section__head">
        <p class="eyebrow">Overview</p>
        <h2 class="section__title">${title}</h2>
      </div>

      <a
        class="video"
        href="https://www.youtube.com/watch?v=lzhg6-nuTVM"
        data-video="lzhg6-nuTVM"
        data-video-title="${title}"
      >
        <img
          class="video__poster"
          src="/video/gacela-in-60-seconds.webp"
          width="1258"
          height="708"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span class="video__play">${icons.play} <span class="video__label">Play video<span class="visually-hidden">: ${title}</span></span></span>
      </a>
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

const PROOFS: readonly {
  readonly title: string
  readonly summary: string
  readonly route: string
  readonly link: string
  readonly session: TerminalSession
}[] = [
  {
    title: 'One shape, seventeen times',
    summary:
      'Every module has a Facade and a Factory, and most add a Config and a Provider. Read one module and you know where to look in all of them.',
    route: '/docs/cli#list-modules',
    link: 'list:modules',
    session: listModules,
  },
  {
    title: 'Dependencies you can print',
    summary:
      'Modules reach each other through Facades, so Gacela can draw the graph. Here the console module wires fourteen others, and two modules depend on nothing.',
    route: '/docs/cli#debug-graph',
    link: 'debug:graph',
    session: debugGraph,
  },
  {
    title: 'Look inside one module',
    summary:
      'See the four classes Gacela resolved for a module and every service its Provider declares with #[Provides].',
    route: '/docs/cli#debug-module',
    link: 'debug:module',
    session: debugModule,
  },
  {
    title: 'Checks that name the fix',
    summary:
      'doctor checks module paths, class names, caches and package manifests. On this run it caught a dependency that composer.json never declares, and said where it belongs.',
    route: '/docs/cli#doctor',
    link: 'doctor',
    session: doctor,
  },
]

/**
 * The quickstart shows one module; this shows seventeen. Every block is real
 * output from one codebase, so the claims beside them can be checked.
 */
function inPractice(): Raw {
  return html`<section class="section">
    <div class="container container--wide">
      <div class="section__head">
        <p class="eyebrow">In practice</p>
        <h2 class="section__title">A real codebase, from the command line</h2>
        <p class="section__lede">
          Phel is a Lisp that compiles to PHP. Its compiler, REPL, formatter and language server
          are among its seventeen Gacela modules. This is what the Gacela CLI reports on it.
        </p>
      </div>

      <div class="proof-list">
        ${PROOFS.map(
          (proof) => html`<article class="proof">
            <div class="proof__copy">
              <h3 class="proof__title">${proof.title}</h3>
              <p class="proof__summary">${proof.summary}</p>
              <a class="proof__link" href="${proof.route}">
                <code>${proof.link}</code> in the CLI reference
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
            ${terminal(proof.session)}
          </article>`,
        )}
      </div>
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
