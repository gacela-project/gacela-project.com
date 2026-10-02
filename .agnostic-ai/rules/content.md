---
name: content
description: Content files, navigation, internal links and doc versioning
globs: ["content/**", "site.config.ts"]
# Forge reads every file under content/ as a page, so Codex keeps this rule in
# the root AGENTS.md instead of a nested content/AGENTS.md.
x-codex:
  alwaysApply: true
---

- `content/docs/*.md`: documentation. Frontmatter: `title`, optional `description`, optional `order`.
- `content/pages/*.md`: standalone pages. Frontmatter adds `layout`.
- Navigation is declared in `site.config.ts`, not inferred from the filesystem. A doc that is not in the nav is still
  built and reachable, but will be reported by `lint:links` as orphaned.
- Internal links are written as absolute site paths (`/docs/facade`), without file extensions.

### Doc versioning

The documentation at `/docs` always describes the latest Gacela release. There is exactly one living doc tree:
Gacela ships a minor almost weekly, and versioning docs per release is the failure mode every major docs site
(Symfony, Laravel, Docusaurus) has walked back from.

- A feature that arrived in a specific release is marked inline with `[since X.Y]`, which renders as a version badge
  and stays out of heading ids and the search index.
- Behaviour changes between releases live in `content/docs/upgrading.md`.
- When a major ships, the outgoing line is frozen once as a markdown snapshot under `content/docs/<line>/` (the 1.x
  line lives in `content/docs/1.x/`, taken from the last commit that documented 1.21.0) and registered in
  `site.config.ts` under `archives`. Archived pages are rendered by the current pipeline, so they keep the living
  design, but they are chrome-wrapped as an archive: a banner, a canonical link to the current equivalent, their own
  frozen sidebar, and no presence in search, the sitemap or the llms files.
- **A frozen snapshot is never edited.** A typo in `content/docs/1.x/` stays there; the only acceptable diffs to an
  archive are mechanical ones forced by generator changes, and even those need a reason in the PR.
