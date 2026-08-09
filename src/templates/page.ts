import { html, raw, type Raw } from '../forge/render/index.ts'
import type { RenderedPage } from '../forge/types.ts'

/** A standalone page: about, team, used in, licence, design system. */
export function pageLayout(page: RenderedPage): Raw {
  return html`<div class="container container--prose">
    <article class="section">
      <div class="prose">${raw(page.html)}</div>
    </article>
  </div>`
}

/**
 * The page for an address that answers nothing. It does not claim the page
 * moved, because a 404 is usually a typo or somebody else's stale link.
 *
 * Three plain links rather than two buttons, which from a dead end would be two
 * recommendations and so none. Search is named as a place, not offered again:
 * the bar is sticky and already carries it.
 */
export function notFoundLayout(): Raw {
  return html`<div class="container cta">
    <p class="eyebrow">404</p>
    <h1 class="cta__title">Nothing at this address</h1>
    <p class="section__lede">
      The link you followed is out of date, or was never right. Search is in the bar at the top of
      every page, and these are where most readers are going.
    </p>
    <p class="cta__links">
      <a href="/docs">Documentation</a>
      <span aria-hidden="true">&middot;</span>
      <a href="/docs/quickstart">Quickstart</a>
      <span aria-hidden="true">&middot;</span>
      <a href="/">Home</a>
    </p>
  </div>`
}
