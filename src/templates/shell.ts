import { attrs, html, raw, render, type Raw } from '../forge/render/index.ts'
import type { NavState, SiteConfig } from '../forge/types.ts'
import { icons } from './icons.ts'
import { gacelaMark } from './marks.ts'

export type ShellAssets = {
  readonly css: string
  readonly js: string
  readonly fonts: readonly string[]
}

/**
 * Internal routes the site chrome links to from every page. The link audit
 * treats these as navigation, so a page reached only from the footer is not
 * reported as orphaned.
 */
export const SHELL_ROUTES: readonly string[] = [
  '/',
  '/docs/quickstart',
  '/docs/facade',
  '/docs/bindings',
  '/docs/gacela-script',
  '/about',
  '/used-in',
  '/team',
  '/license',
]

export type ShellContext = {
  readonly site: SiteConfig
  readonly assets: ShellAssets
  readonly version: string
  readonly route: string
  readonly title: string
  readonly description: string
  readonly nav: NavState
  /**
   * The documentation sidebar, when there is one. It is folded into the mobile
   * disclosure below the breakpoint where the sidebar column disappears.
   */
  readonly docsNav?: Raw
  readonly main: Raw
  /**
   * Named on the body as a data attribute rather than a class. Layout names
   * such as "docs" collide with component class names, and a body that
   * accidentally matches a grid rule rearranges the entire page.
   */
  readonly layout: string
}

/**
 * Applies the stored theme before the first paint.
 *
 * This is the one inline script on the site. It has to be inline and it has to
 * be in the head: anywhere else and the page paints in the wrong theme first.
 * It also marks the document as scripted, which is how enhancement-only
 * controls know they are safe to show.
 */
const THEME_SCRIPT = raw(`
try {
  var t = localStorage.getItem('theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) {}
document.documentElement.dataset.js = '';
`)

export function documentShell(context: ShellContext): string {
  const { site, assets, title, description, route } = context
  const canonical = `${site.origin}${route === '/' ? '' : route}`

  return `<!doctype html>\n${render(html`<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />

    <script>${THEME_SCRIPT}</script>

    ${context.assets.fonts.map(
      (font) =>
        raw(`<link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin />`),
    )}
    <link rel="stylesheet" href="${assets.css}" />

    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="icon" href="/gacela-logo.svg" type="image/svg+xml" />
    <link rel="sitemap" type="application/xml" href="/sitemap.xml" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${site.title}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${site.origin}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />

    <script type="module" src="${assets.js}" defer></script>
  </head>
  <body${attrs({ 'data-layout': context.layout })}>
    <a class="skip-link" href="#main">Skip to content</a>
    ${siteHeader(context)}
    ${mobileNav(context)}
    <main id="main" class="page">${context.main}</main>
    ${siteFooter(context)}
    ${searchDialog()}
  </body>
</html>`)}\n`
}

function mobileNav(context: ShellContext): Raw {
  const isDocs = context.docsNav !== undefined

  return html`<details class="mobile-nav">
    <summary class="mobile-nav__summary">
      ${icons.disclosure}
      <span>${isDocs ? 'Documentation' : 'Menu'}</span>
      ${isDocs && context.nav.current !== undefined
        ? html`<span aria-hidden="true">/</span>
            <span class="mobile-nav__current">${context.nav.current.title}</span>`
        : ''}
    </summary>

    <div class="mobile-nav__panel">
      <nav aria-label="Site">
        <ul class="mobile-nav__primary" role="list">
          ${context.site.headerLinks.map(
            (link) => html`<li>
              <a class="mobile-nav__link" href="${link.route}">${link.title}</a>
            </li>`,
          )}
          <li><a class="mobile-nav__link" href="/team">Team</a></li>
          <li>
            <a class="mobile-nav__link" href="${context.site.repository}" rel="noreferrer">GitHub</a>
          </li>
        </ul>
      </nav>

      ${isDocs
        ? html`<nav class="mobile-nav__docs" aria-label="Documentation">${context.docsNav}</nav>`
        : ''}
    </div>
  </details>`
}

function siteHeader(context: ShellContext): Raw {
  const { site, route } = context

  return html`<header class="header">
    <div class="header__inner">
      <a class="header__brand" href="/" aria-label="${site.title}, home">
        ${gacelaMark({ className: 'header__mark' })}
        <span class="header__wordmark">${site.title}</span>
      </a>

      ${searchTrigger()}

      <div class="header__spacer"></div>

      <nav class="header__nav" aria-label="Main">
        ${site.headerLinks.map(
          (link) => html`<a
            class="header__link"
            href="${link.route}"
            ${raw(isActive(route, link.route) ? 'data-active' : '')}
            >${link.title}</a
          >`,
        )}
      </nav>

      <div class="header__actions">
        ${themeToggle()}
        <a class="icon-button" href="${site.repository}" rel="noreferrer" aria-label="Gacela on GitHub"
          >${icons.github}</a
        >
      </div>
    </div>
  </header>`
}

function searchTrigger(): Raw {
  // The visible label collapses at narrow widths, so the accessible name is
  // set explicitly rather than left to whichever text happens to survive.
  return html`<button
    type="button"
    class="search-trigger"
    data-search-trigger
    aria-label="Search the documentation"
  >
    ${icons.search}
    <span class="search-trigger__label">Search</span>
    <kbd class="search-trigger__hint" data-search-hint>&#8984;K</kbd>
  </button>`
}

/**
 * Three radios rather than a two-state button: "system" is a real choice, and
 * it is the default, so it needs somewhere to live.
 */
function themeToggle(): Raw {
  const options = [
    { value: 'light', label: 'Light theme', icon: icons.sun },
    { value: 'dark', label: 'Dark theme', icon: icons.moon },
    { value: 'system', label: 'Match system theme', icon: icons.monitor },
  ]

  return html`<fieldset class="theme-toggle" data-theme-toggle>
    <legend class="visually-hidden">Colour theme</legend>
    ${options.map(
      (option) => html`<label class="theme-toggle__option" title="${option.label}">
        <input type="radio" name="theme" value="${option.value}" />
        <span class="visually-hidden">${option.label}</span>
        ${option.icon}
      </label>`,
    )}
  </fieldset>`
}

function searchDialog(): Raw {
  return html`<dialog class="search-dialog" data-search-dialog aria-label="Search documentation">
    <form class="search-dialog__form" method="dialog" role="search">
      <span class="search-dialog__icon">${icons.search}</span>
      <input
        class="search-dialog__input"
        type="search"
        placeholder="Search the documentation"
        aria-label="Search the documentation"
        autocomplete="off"
        spellcheck="false"
        data-search-input
      />
      <button type="submit" class="search-dialog__close" data-search-close>esc</button>
    </form>
    <p class="search-dialog__empty" data-search-empty hidden>No matches.</p>
    <ul class="search-dialog__results" role="list" data-search-results></ul>
    <p class="visually-hidden" role="status" aria-live="polite" data-search-status></p>
    <div class="search-dialog__footer">
      <span>&uarr;&darr; to navigate</span><span>&crarr; to open</span><span>esc to close</span>
    </div>
  </dialog>`
}

function siteFooter(context: ShellContext): Raw {
  const { site, version } = context
  const year = new Date().getFullYear()

  return html`<footer class="footer">
    <div class="footer__inner">
      <div>
        <a class="footer__brand" href="/">
          ${gacelaMark({ className: 'footer__mark' })}
          <span class="footer__wordmark">${site.title}</span>
        </a>
        <p class="footer__tagline">${site.description}</p>
        <p class="footer__meta">
          <span class="badge">PHP 8.3+</span>
          <span class="badge">MIT</span>
          <span class="badge badge--accent">v${version}</span>
        </p>
      </div>

      <div>
        <h2 class="footer__group-title">Documentation</h2>
        <ul class="footer__list" role="list">
          <li><a class="footer__link" href="/docs/quickstart">Quickstart</a></li>
          <li><a class="footer__link" href="/docs/facade">Core concepts</a></li>
          <li><a class="footer__link" href="/docs/bindings">Configuration</a></li>
          <li><a class="footer__link" href="/docs/gacela-script">CLI commands</a></li>
        </ul>
      </div>

      <div>
        <h2 class="footer__group-title">Project</h2>
        <ul class="footer__list" role="list">
          <li><a class="footer__link" href="/about">About Gacela</a></li>
          <li><a class="footer__link" href="/used-in">Used in</a></li>
          <li><a class="footer__link" href="/team">Team</a></li>
          <li>
            <a class="footer__link" href="${site.packagist}" rel="noreferrer">Packagist</a>
          </li>
        </ul>
      </div>
    </div>

    <div class="footer__legal">
      <span>&copy; 2021&ndash;${year} Jose Maria Valera Reales and Jesus Valera Reales</span>
      <span class="footer__socials">
        <a class="icon-button" href="${site.repository}" rel="noreferrer" aria-label="GitHub"
          >${icons.github}</a
        >
        <a class="icon-button" href="https://x.com/gacela_project" rel="noreferrer" aria-label="X"
          >${icons.x}</a
        >
      </span>
      <a href="/license">MIT License</a>
    </div>
  </footer>`
}

function isActive(route: string, target: string): boolean {
  if (target.startsWith('/docs')) return route.startsWith('/docs')

  return route === target
}
