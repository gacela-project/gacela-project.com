---
name: non-negotiables
description: The five rules no change may break
alwaysApply: true
---

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
