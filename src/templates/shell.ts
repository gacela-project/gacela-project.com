import { attrs, html, raw, render, type Raw } from '../forge/render/index.ts'
import type { SiteConfig } from '../forge/types.ts'
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

    <!-- The mark is drawn as an outline, and an outline does not survive being
         16 pixels wide: its stroke lands at a tenth of a pixel and the tab shows
         nothing at all. The icons are the same mark with its facets filled,
         which still reads as an animal at 16. -->
    <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <!-- Saved to a home screen, iOS ignores the two above and screenshots the
         page without this. It is opaque on purpose: a transparent icon is
         composited on black there. -->
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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
    <main id="main" class="page">${context.main}</main>
    ${siteFooter(context)}
    ${searchDialog()}
  </body>
</html>`)}\n`
}

/**
 * The release the site documents, linking to its notes on GitHub.
 *
 * The number alone is a poor accessible name, so the hidden half of the label
 * says what it is a version of and where the link goes. The href is built from
 * the same value the badge prints, which is the one in data/gacela.json, so the
 * link cannot point at a release the site does not claim to document.
 */
function versionLink(context: ShellContext, className: string): Raw {
  const { site, version } = context

  return html`<a
    class="badge ${className}"
    href="${site.repository}/releases/tag/${version}"
    target="_blank"
    rel="noreferrer"
    >${version}<span class="visually-hidden"> release notes (opens in a new tab)</span></a
  >`
}

/**
 * The navigation, for a screen too narrow to hold it in the bar.
 *
 * A details element again, so it opens, closes and announces itself without
 * script. The panel covers the viewport rather than pushing the page down,
 * and the button that opened it stays on top as the way back out, which is
 * why it is one control that changes glyph rather than two.
 */
function navDrawer(context: ShellContext): Raw {
  const { site, route } = context

  return html`<details class="nav-drawer" data-nav-drawer>
    <summary class="nav-drawer__toggle" aria-label="Menu">
      <span class="nav-drawer__glyph nav-drawer__glyph--open">${icons.menu}</span>
      <span class="nav-drawer__glyph nav-drawer__glyph--close">${icons.close}</span>
    </summary>

    <div class="nav-drawer__panel">
      <div class="nav-drawer__bar">
        <a class="header__brand" href="/" aria-label="${site.title}, home">
          ${gacelaMark({ className: 'header__mark' })}
          <span class="header__wordmark">${site.title}</span>
        </a>

        ${searchTrigger({ className: 'nav-drawer__search' })}
      </div>

      <nav class="nav-drawer__nav" aria-label="Site">
        <ul class="nav-drawer__list" role="list">
          ${site.headerLinks.map((link) =>
            link.route === '/docs'
              ? html`<li>
                    <a class="nav-drawer__link" href="${link.route}"${attrs({ 'aria-current': link.route === route ? 'page' : null })}>${link.title}</a>
                  </li>
                  <li>
                    <details class="nav-drawer__group">
                      <summary class="nav-drawer__link nav-drawer__group-summary">
                        <span>Reference</span>
                        ${icons.plus}
                      </summary>
                      ${site.sidebar.slice(1).map(
                        (group) => html`<div class="nav-drawer__subgroup">
                          <p class="nav-drawer__subtitle">${group.title}</p>
                          <ul class="nav-drawer__sublist" role="list">
                            ${group.items.map(
                              (item) => html`<li>
                                <a class="nav-drawer__sublink" href="${item.route}"${attrs({ 'aria-current': item.route === route ? 'page' : null })}>${item.title}</a>
                              </li>`,
                            )}
                          </ul>
                        </div>`,
                      )}
                    </details>
                  </li>`
              : html`<li><a class="nav-drawer__link" href="${link.route}"${attrs({ 'aria-current': link.route === route ? 'page' : null })}>${link.title}</a></li>`,
          )}
          <li><a class="nav-drawer__link" href="/team"${attrs({ 'aria-current': route === '/team' ? 'page' : null })}>Team</a></li>
        </ul>
      </nav>

      <div class="nav-drawer__appearance">
        <span>Appearance</span>
        ${themeToggle()}
      </div>

      <div class="nav-drawer__socials">
        ${versionLink(context, 'nav-drawer__version')}
        <a
          class="icon-button"
          href="${site.repository}"
          target="_blank"
          rel="noreferrer"
          aria-label="Gacela on GitHub (opens in a new tab)"
          >${icons.github}</a
        >
        <a
          class="icon-button"
          href="https://x.com/gacela_project"
          target="_blank"
          rel="noreferrer"
          aria-label="Gacela on X (opens in a new tab)"
          >${icons.x}</a
        >
      </div>
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
              ${attrs({ 'aria-current': link.route === route ? 'page' : null })}
              >${link.title}</a
            >
            ${link.route === '/docs' ? referenceMenu(site, route) : ''}`,
        )}
      </nav>

      ${versionLink(context, 'header__version')}

      <div class="header__actions">
        ${themeToggle()}
        <span class="header__socials">
          <a
            class="icon-button"
            href="${site.repository}"
            target="_blank"
            rel="noreferrer"
            aria-label="Gacela on GitHub (opens in a new tab)"
            >${icons.github}</a
          >
          <a
            class="icon-button"
            href="https://x.com/gacela_project"
            target="_blank"
            rel="noreferrer"
            aria-label="Gacela on X (opens in a new tab)"
            >${icons.x}</a
          >
        </span>
      </div>

      ${navDrawer(context)}
    </div>
  </header>`
}

/**
 * The documentation tree, in the header.
 *
 * A details element, so it opens, closes and announces its state with no
 * JavaScript at all. The first sidebar group is left out: the "Get started"
 * link beside it already leads there, and repeating it inside would make the
 * panel argue with its own neighbour.
 */
function referenceMenu(site: SiteConfig, route: string): Raw {
  return html`<details class="header__menu" data-header-menu>
    <summary class="header__link header__menu-summary">
      <span>Reference</span>
      ${icons.chevronDown}
    </summary>

    <div class="header__menu-panel">
      ${site.sidebar.slice(1).map(
        (group) => html`<div class="header__menu-group">
          <p class="header__menu-title">${group.title}</p>
          <ul class="header__menu-list" role="list">
            ${group.items.map(
              (item) => html`<li>
                <a class="header__menu-link" href="${item.route}"${attrs({ 'aria-current': item.route === route ? 'page' : null })}>${item.title}</a>
              </li>`,
            )}
          </ul>
        </div>`,
      )}
    </div>
  </details>`
}

/**
 * The same control wherever it appears, so the bar and the drawer's bar draw
 * it identically and it does not move when one gives way to the other.
 */
function searchTrigger(options: { readonly className?: string } = {}): Raw {
  // The visible label collapses at narrow widths, so the accessible name is
  // set explicitly rather than left to whichever text happens to survive.
  return html`<button
    type="button"
    class="search-trigger ${options.className ?? ''}"
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
  const { site } = context
  const year = new Date().getFullYear()

  return html`<footer class="footer">
    <div class="footer__inner">
      <div>
        <a class="footer__brand" href="/">
          ${gacelaMark({ className: 'footer__mark' })}
          <span class="footer__wordmark">${site.title}</span>
        </a>
        <p class="footer__tagline">${site.tagline}</p>
      </div>

      <!-- No heading. It read "Project" over the only list in the footer, so it
           named a category with nothing to tell it apart from, and put an h2
           into the outline for five words.

           GitHub and X are not here either. The bar is sticky, so its two icons
           are on screen at the moment this footer is being read, and a link
           cannot be easier to reach than one that never left. What is left is
           what the chrome does not already carry: the two pages on this site,
           and the package. -->
      <div>
        <ul class="footer__list" role="list">
          <li><a class="footer__link" href="/team">Team</a></li>
          <li><a class="footer__link" href="/license">License</a></li>
          <li>
            <a class="footer__link" href="${site.packagist}" target="_blank" rel="noreferrer"
              >Packagist<span class="visually-hidden"> (opens in a new tab)</span></a
            >
          </li>
        </ul>
        <p class="footer__copyright">&copy; 2021&ndash;${year} ${site.title}. All rights reserved.</p>
      </div>
    </div>
  </footer>`
}

function isActive(route: string, target: string): boolean {
  if (target.startsWith('/docs')) return route.startsWith('/docs')

  return route === target
}
