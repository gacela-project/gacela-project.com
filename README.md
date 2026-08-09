<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="public/full-gacela-logo-dark.svg">
        <img alt="Gacela" src="public/full-gacela-logo.svg" width="340">
    </picture>
</p>

<h1 align="center">gacela-project.com</h1>

<p align="center">
    The website and documentation for <a href="https://github.com/gacela-project/gacela">Gacela</a>,
    the framework for building modular PHP applications.
</p>

---

## What this is

A static site built by **Forge**, a small purpose-built generator that lives in this repository, and styled by
**Facet**, a hand-written design system with no CSS framework behind it.

Two runtime dependencies, no bundler, no client framework. Pages are HTML that works before a single byte of JavaScript
loads; the JavaScript that does load is a few kilobytes of progressive enhancement.

|                   |                                                                   |
|-------------------|-------------------------------------------------------------------|
| **Generator**     | `src/forge` — TypeScript, run directly by Node's type stripping   |
| **Design system** | `src/design` — CSS custom properties + `@layer`, light and dark   |
| **Content**       | `content/` — Markdown, the docs kept in sync with the Gacela repo |
| **Dependencies**  | `markdown-it` (Markdown), `shiki` (syntax highlighting)           |
| **Tests**         | `tests/` — Vitest, unit tests for every generator module          |
| **Deploy**        | GitHub Actions → GitHub Pages, on every push to `main`            |

## Getting started

```bash
npm ci        # install
npm run dev   # dev server with live reload on http://localhost:4321
npm run build # production build into dist/
npm run check # typecheck + tests + build + link check (what CI runs)
```

Node **22.18+** is required: the generator is TypeScript executed directly by Node, with no compile step.

## Repository layout

```text
content/            Markdown source
  docs/               documentation pages, carried over byte for byte
  pages/              home, about, team, used-in, licence, styleguide, 404
public/             copied verbatim to the site root (fonts, favicon, logos, CNAME)
data/               gacela.json, the framework version a workflow keeps current
src/
  forge/            the static site generator
    cli/              build, dev, preview and lint-links entry points
    content/          file loading, frontmatter, the page model
    markdown/         markdown-it pipeline: containers, code groups, anchors, toc
    nav/              sidebar model, prev/next, the active page
    render/           escaping primitives and page assembly
    search/           search index construction
    assets/           import inlining, minification, content hashing
    audit/            internal link and anchor validation
    pipeline.ts       composition: the only module that knows about the others
  design/           the Facet design system (CSS)
  client/           progressive enhancement: theme, search, copy, toc
  templates/        page layouts and the document shell
tests/              Vitest suites, mirroring src/forge
site.config.ts      single source of truth for nav, metadata and redirects
```

The design system documents itself at [`/styleguide`](https://gacela-project.com/styleguide), rendered from the same
tokens the rest of the site uses.

## How the docs stay in sync

The documentation pages in `content/docs` are the canonical, human-edited source for gacela-project.com. The
`sync-gacela-version` workflow keeps the displayed framework version aligned with the latest Gacela release, and
`docs-drift-guard` flags public API that appears in release notes but nowhere in the docs.

## Deployment

Merging to `main` runs `ci.yml` (typecheck, tests, build, link check) and then `deploy.yml`, which publishes `dist/`
to GitHub Pages. Production is [gacela-project.com](https://gacela-project.com).

## Contributing

Issues and pull requests are welcome. Run `npm run check` before opening one: it is exactly what CI runs, so a green
local check means a green pipeline.

## License

MIT. See [LICENSE](LICENSE).
