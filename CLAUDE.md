# CLAUDE.md

Working rules for this repository. Read this before changing anything.

## What this project is

The website for **Gacela**, a PHP framework for modular applications. It is a static site produced by a generator that
lives in this repo (`src/forge`, "Forge") and styled by a design system that also lives in this repo (`src/design`,
"Facet").

The site exists to make Gacela understandable. Documentation accuracy outranks visual ambition; visual quality outranks
feature count.

## Non-negotiables

1. **Dependency budget: two runtime dependencies.** `markdown-it` and `shiki`. Adding a third requires a written
   justification in the PR description explaining what could not be written in under ~200 lines. No CSS framework, no
   client framework, no bundler.
2. **The site works without JavaScript.** Every page renders, every link navigates, all content is readable with scripts
   disabled. JavaScript is enhancement only: search, theme toggle, mobile nav, TOC highlighting, copy buttons.
3. **The documentation content is stable.** `content/docs/*.md` mirrors the upstream Gacela documentation. Do not
   rewrite, reword, restructure, or "improve" the prose in those files unless explicitly asked. Presentation may change
   freely; text may not.
4. **Tests come first for generator logic.** Anything in `src/forge` that transforms data (parsing, slugging, nav
   building, indexing, link resolving) gets a Vitest test written before the implementation.
5. **No dead links.** `npm run lint:links` must pass. It is part of `npm run check`.

## Commands

```bash
npm run dev         # dev server, live reload, http://localhost:4321
npm run build       # production build into dist/
npm run preview     # serve dist/ as it will be served in production
npm test            # vitest, watch mode
npm run typecheck   # tsc --noEmit
npm run lint:links  # validate every internal link and anchor in dist/
npm run check       # typecheck + tests + build + link check — mirrors CI exactly
```

Always run `npm run check` before declaring work finished. Do not report a task as complete on the strength of a passing
build alone.

## Architecture

Forge is organised the way Gacela itself organises code: small modules with one public entry point each, private
internals, and no reaching across module boundaries.

```
src/forge/
  cli/        entry points; the only place that touches process.argv or exits
  content/    filesystem -> Page objects (frontmatter, body, route)
  markdown/   Page body -> HTML (markdown-it pipeline and its plugins)
  nav/        site.config.ts + Pages -> navigation tree, prev/next, breadcrumbs
  render/     Page + nav -> full HTML document (templates live in src/templates)
  search/     Pages -> search index JSON
  assets/     copy and content-hash CSS/JS/static files
  pipeline.ts orchestration: the only module that knows about all the others
```

Rules that follow from that:

- A module exports through its `index.ts`. Import `../nav/index.ts`, never `../nav/internal/tree.ts`.
- Modules do not read the filesystem outside `content/` and `assets/`.
- `pipeline.ts` composes; it contains no transformation logic of its own.
- Pure functions by default. If something needs I/O, it takes the data as an argument rather than reading it.

## Conventions

- **TypeScript, ESM, `.ts` extensions in imports.** Node runs the source directly via type stripping — there is no build
  step for the generator. That means: no enums, no parameter properties, no namespaces, nothing that needs code
  generation. `erasableSyntaxOnly` is on and will tell you.
- **`type` imports are explicit** (`verbatimModuleSyntax`).
- **No default exports** except in `src/templates`, where a file is one template.
- **Strict null handling.** `noUncheckedIndexedAccess` is on; index access is `T | undefined` and must be narrowed.
- **CSS**: `@layer reset, tokens, base, layout, components, utilities`. Colours, spacing, type sizes and radii come from
  tokens in `src/design/tokens.css`. A raw hex value outside that file is a bug.
- **No em dashes in prose.** Use a comma, a colon, or a full stop.

## Content

- `content/docs/*.md` — documentation. Frontmatter: `title`, optional `description`, optional `order`.
- `content/pages/*.md` — standalone pages. Frontmatter adds `layout`.
- Navigation is declared in `site.config.ts`, not inferred from the filesystem. A doc that is not in the nav is still
  built and reachable, but will be reported by `lint:links` as orphaned.
- Internal links are written as absolute site paths (`/docs/facade`), without file extensions.

## Design system

Facet is documented at `/styleguide` in the running site, which is generated from the same tokens the site uses. When
adding a component:

1. Add its tokens to `src/design/tokens.css` if it needs new ones.
2. Add the component CSS to `src/design/components/`.
3. Add it to the styleguide page so it stays visible and reviewable.

Dark mode is a token swap, never a separate stylesheet. Both themes must be checked before shipping any visual change.

## Deployment

`main` is production. Push to `main` runs CI and, if green, deploys `dist/` to GitHub Pages at gacela-project.com.
There is no staging environment, so do not merge anything that has not passed `npm run check` locally.

## Working style in this repo

- Prefer deleting code over adding options.
- If a change touches both content and presentation, split it into two commits.
- When something is unclear about Gacela's behaviour, read `../gacela` (the framework source) rather than guessing. The
  docs describe real APIs and must stay true to them.
