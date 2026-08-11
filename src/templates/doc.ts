import { mirrorPathForRoute } from '../forge/agents/index.ts'
import { attrs, html, raw, type Raw } from '../forge/render/index.ts'
import type { Heading, NavState, RenderedPage, SiteConfig } from '../forge/types.ts'
import { icons } from './icons.ts'

/** How an archived page introduces itself. Assembled by the render module. */
export type DocArchiveContext = {
  readonly version: string
  readonly label: string
  readonly currentVersion: string
  readonly currentRoute: string
}

export type DocContext = {
  readonly site: SiteConfig
  readonly page: RenderedPage
  readonly nav: NavState
  readonly archive?: DocArchiveContext | undefined
}

export function docLayout(context: DocContext): Raw {
  const { page, nav, archive } = context
  const toc = page.headings.filter((heading) => heading.depth === 2 || heading.depth === 3)

  /* The landing page's own prose already says what the banner says, and the
     two were appearing 250px apart with the H1 wedged between them. */
  const note =
    archive !== undefined && page.route !== `/docs/${archive.version}`
      ? archiveNote(archive)
      : ''

  return html`<div class="docs">
    <nav class="docs__nav" aria-label="Documentation">${docsSidebar(nav)}</nav>

    <div class="docs__body">
      <article class="docs__article">
        ${note}

        <header class="article__header">
          <p class="article__breadcrumb">
            ${archive === undefined
              ? html`<a href="/docs/quickstart">Docs</a>`
              : /* The label, not the line: the breadcrumb is uppercased by its
                   style, which turns "1.x" into "1.X"; "1.21.0" survives it. */
                html`<a href="/docs/${archive.version}">Docs ${archive.label}</a>`}
            ${nav.groupTitle === undefined ? '' : html`<span aria-hidden="true">/</span>
            <span>${nav.groupTitle}</span>`}
          </p>
        </header>

        ${toc.length > 2 ? inlineToc(toc) : ''}

        <div class="prose">${raw(page.html)}</div>

        ${articleFooter(context)} ${pager(nav)}
      </article>

      <div class="docs__toc">
        ${copyAsMarkdown(page.route)}
        ${toc.length > 1 ? html`<nav aria-label="On this page">${tocList(toc)}</nav>` : ''}
      </div>
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

/**
 * Hands the reader the page's own markdown, for pasting into a model. It sits
 * above the contents because it is about this page as a whole, the same thing
 * the contents list describes.
 *
 * Copying needs the clipboard API, so the control is hidden until the document
 * is marked as scripted. Without script the head still advertises the same file
 * and the docs index explains the convention.
 */
function copyAsMarkdown(route: string): Raw {
  return html`<button
    type="button"
    class="copy-md"
    data-copy-markdown
    data-markdown-src="${mirrorPathForRoute(route)}"
  >
    <span class="copy-md__icon">${icons.copy}</span>
    <span class="copy-md__label">Copy as markdown</span>
  </button>`
}

function tocList(headings: readonly Heading[]): Raw {
  return html`<p class="toc__title">${icons.contents}On this page</p>
    <ul class="toc__list" role="list">
      ${headings.map(
        (heading) => html`<li class="toc__item toc__item--${heading.depth}">
          <a class="toc__link" href="#${heading.id}" data-toc-link>${heading.text}</a>
        </li>`,
      )}
    </ul>`
}

/**
 * The same contents as the sidebar's, for the widths where the sidebar is
 * gone. It carries the navigation landmark the sidebar version has: the two
 * are mutually exclusive at 1180px, so only one is ever in the tree, and
 * without this a narrow viewport lost a landmark that a wide one offers.
 */
function inlineToc(headings: readonly Heading[]): Raw {
  return html`<details class="toc-inline">
    <summary class="toc-inline__summary">${icons.disclosure}On this page</summary>
    <nav class="toc-inline__panel" aria-label="On this page">${tocList(headings)}</nav>
  </details>`
}

/**
 * Tells the reader where they are standing before the content starts, and
 * offers the way back. The link goes to this page's current equivalent, not to
 * the docs landing page, because the reader was already on the right topic.
 */
function archiveNote(archive: DocArchiveContext): Raw {
  return html`<aside class="archive-note" aria-label="Archived documentation">
    <p>
      This page documents <strong>Gacela ${archive.label}</strong>, the last release of the
      ${archive.version} line. It is kept as an archive and no longer updated.
      <a href="${archive.currentRoute}">Read the current version</a> for Gacela
      ${archive.currentVersion}.
    </p>
  </aside>`
}

function articleFooter(context: DocContext): Raw {
  const editUrl = `${context.site.siteRepository}/edit/main/content/${context.page.source}`

  return html`<footer class="article__footer">
    ${context.archive === undefined
      ? html`<a href="${editUrl}" target="_blank" rel="noreferrer"
          >Edit this page on GitHub<span class="visually-hidden"> (opens in a new tab)</span></a
        >`
      : /* A frozen page must not invite edits: the archive's one rule is that
           nothing in it changes. */
        ''}
    <a href="${context.site.repository}/issues/new" target="_blank" rel="noreferrer"
      >Report a problem<span class="visually-hidden"> (opens in a new tab)</span></a
    >
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
