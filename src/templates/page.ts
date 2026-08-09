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
 * The page for an address that answers nothing.
 *
 * It does not say the page moved, because usually nothing did: a 404 is a
 * typo, or somebody else's stale link, far more often than it is a page that
 * went somewhere. Claiming otherwise sent readers looking for a redirect that
 * was never written.
 *
 * The way out is three plain links rather than two buttons. A button is a
 * recommendation, and offering two competing ones from a dead end recommends
 * nothing; the same row on the home page gave its buttons up for the same
 * reason. Search goes unmentioned as a control and named as a place, because
 * the bar is sticky and its search box is already on screen.
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
