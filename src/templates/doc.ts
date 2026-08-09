import { attrs, html, raw, type Raw } from '../forge/render/index.ts'
import type { Heading, NavState, RenderedPage, SiteConfig } from '../forge/types.ts'
import { icons } from './icons.ts'

export type DocContext = {
  readonly site: SiteConfig
  readonly page: RenderedPage
  readonly nav: NavState
}

export function docLayout(context: DocContext): Raw {
  const { page, nav } = context
  const toc = page.headings.filter((heading) => heading.depth === 2 || heading.depth === 3)

  return html`<div class="docs">
    <nav class="docs__nav" aria-label="Documentation">${docsSidebar(nav)}</nav>

    <div class="docs__body">
      <article class="docs__article">
        <header class="article__header">
          <p class="article__breadcrumb">
            <a href="/docs/quickstart">Docs</a>
            ${nav.groupTitle === undefined ? '' : html`<span aria-hidden="true">/</span>
            <span>${nav.groupTitle}</span>`}
          </p>
        </header>

        ${toc.length > 2 ? inlineToc(toc) : ''}

        <div class="prose">${raw(page.html)}</div>

        ${articleFooter(context)} ${pager(nav)}
      </article>

      ${toc.length > 1 ? html`<nav class="docs__toc" aria-label="On this page">${tocList(toc)}</nav>` : ''}
    </div>
  </div>`
}

/** The documentation sidebar. Also used inside the mobile disclosure. */
export function docsSidebar(nav: NavState): Raw {
  return html`${nav.groups.map(
    (group) => html`<div class="sidebar__group">
      <p class="sidebar__group-title">${group.title}</p>
      <ul class="sidebar__list" role="list">
        ${group.items.map(
          (item) => html`<li>
            <a
              class="sidebar__link"
              href="${item.route}"
              ${attrs({ 'aria-current': item.route === nav.current?.route ? 'page' : null })}
              >${item.title}</a
            >
          </li>`,
        )}
      </ul>
    </div>`,
  )}`
}

function tocList(headings: readonly Heading[]): Raw {
  return html`<p class="toc__title">On this page</p>
    <ul class="toc__list" role="list">
      ${headings.map(
        (heading) => html`<li class="toc__item toc__item--${heading.depth}">
          <a class="toc__link" href="#${heading.id}" data-toc-link>${heading.text}</a>
        </li>`,
      )}
    </ul>`
}

function inlineToc(headings: readonly Heading[]): Raw {
  return html`<details class="toc-inline">
    <summary class="toc-inline__summary">${icons.disclosure}On this page</summary>
    <div class="toc-inline__panel">${tocList(headings)}</div>
  </details>`
}

function articleFooter(context: DocContext): Raw {
  const editUrl = `${context.site.siteRepository}/edit/main/content/${context.page.source}`

  return html`<footer class="article__footer">
    <a href="${editUrl}" rel="noreferrer">Edit this page on GitHub</a>
    <a href="${context.site.repository}/issues/new" rel="noreferrer">Report a problem</a>
  </footer>`
}

function pager(nav: NavState): Raw {
  if (nav.previous === undefined && nav.next === undefined) return raw('')

  return html`<nav class="pager" aria-label="Documentation pages">
    ${nav.previous === undefined
      ? ''
      : html`<a class="pager__link pager__link--previous" href="${nav.previous.route}" rel="prev">
          <span class="pager__direction">Previous</span>
          <span class="pager__title">${nav.previous.title}</span>
        </a>`}
    ${nav.next === undefined
      ? ''
      : html`<a class="pager__link pager__link--next" href="${nav.next.route}" rel="next">
          <span class="pager__direction">Next</span>
          <span class="pager__title">${nav.next.title}</span>
        </a>`}
  </nav>`
}
