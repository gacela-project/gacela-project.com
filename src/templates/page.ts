import { html, raw, type Raw } from '../forge/render/index.ts'
import type { RenderedPage } from '../forge/types.ts'

/** A standalone page: about, team, used in, licence, styleguide. */
export function pageLayout(page: RenderedPage): Raw {
  return html`<div class="container container--prose">
    <article class="section">
      <div class="prose">${raw(page.html)}</div>
    </article>
  </div>`
}

export function notFoundLayout(): Raw {
  return html`<div class="container cta section">
    <p class="eyebrow">404</p>
    <h1 class="cta__title">That page moved on</h1>
    <p class="section__lede">
      The address you followed does not match anything on this site. The documentation index is
      probably where you were heading.
    </p>
    <div class="cta__links">
      <a class="button button--primary" href="/docs/quickstart">Go to the documentation</a>
      <a class="button" href="/">Back to the home page</a>
    </div>
  </div>`
}
