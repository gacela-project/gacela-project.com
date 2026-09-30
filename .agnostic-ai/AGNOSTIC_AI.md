# gacela-project.com

Working rules for this repository. Read this before changing anything.

## What this project is

The website for **Gacela**, a PHP framework for modular applications. It is a static site produced by a generator that
lives in this repo (`src/forge`, "Forge") and styled by a design system that also lives in this repo (`src/design`,
"Facet").

The site exists to make Gacela understandable. Documentation accuracy outranks visual ambition; visual quality outranks
feature count.

## Commands

```bash
npm run dev         # dev server, live reload, http://localhost:4321
npm run build       # production build into dist/
npm run preview     # serve dist/ as it will be served in production
npm test            # vitest, watch mode
npm run typecheck   # tsc --noEmit
npm run lint:links  # validate every internal link and anchor in dist/
npm run check       # typecheck + tests + build + link check: mirrors CI exactly
```

Always run `npm run check` before declaring work finished. Do not report a task as complete on the strength of a passing
build alone.

## Where these rules live

`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.codex/` and `.agents/` are generated from `.agnostic-ai/` by `agnostic-ai sync`
and are not committed. Change policy, agents, skills and hooks under `.agnostic-ai/`, then run `agnostic-ai sync`.
Paths in rules, agents and skills are relative to the repository root.
