---
name: architecture
description: Forge module boundaries and how modules may depend on each other
globs: ["src/forge/**", "tests/**"]
---

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
