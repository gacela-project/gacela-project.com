---
name: docs-page
description: Add, move or remove a documentation page on gacela-project.com. Use when creating a new doc, renaming an existing one, or reorganising the docs navigation, so that nav, redirects, search and links all stay consistent.
---

# Working with documentation pages

Documentation lives in `content/docs/*.md`. Navigation is declared explicitly in
`site.config.ts`, not inferred from the filesystem, because the reading order is an editorial decision.

## Adding a page

**1. Create the file.** `content/docs/<slug>.md`, where the slug is the URL segment:
lowercase, hyphenated, no dates, no numbers.

```markdown
---
title: Service Map
description: One sentence, under 160 characters, that will be the meta description and the search result summary.
---

# Service Map

Opening paragraph that answers "what is this and when do I need it" before any code.
```

The `title` is used in navigation and the `<title>` tag. The `# H1` is what readers see; keep them the same unless the
nav needs a shorter form.

**2. Put it in the navigation.** Add an entry to the right group in `site.config.ts`. The groups exist to teach an
order, so place it where a newcomer would meet it, not alphabetically.

**3. Link to it from somewhere.** A page reachable only through the sidebar is a page nobody finds. Link from the pages
that raise the question it answers.

## Writing conventions

- **Internal links are absolute site paths without extensions**: `/docs/factory`, and
  `/docs/provider#provides-attribute` for anchors. Never relative, never `.md`.
- **Code fences carry a language**, and optionally a filename label:

  ````markdown
  ```php [src/Module/Facade.php]
  ```
  ````

- **Callouts** use container syntax, with `tip`, `info`, `warning` or `danger`:

  ```markdown
  ::: tip
  Content of the callout.
  :::
  ```

- **Tabs** for parallel alternatives, one fence per tab:

  ````markdown
  ::: code-group
  ```php [Facade.php]
  ```
  ```php [Factory.php]
  ```
  :::
  ````

- Every code sample must be real. Class names, methods and attributes have to exist in
  `../gacela/src`. Grep before you write.
- Sentences short, second person, present tense. No em dashes.

## Renaming or removing a page

URLs are public API. When a page changes address:

1. Add the old path to `redirects` in `site.config.ts`, pointing at the new one.
2. Update the nav entry.
3. Grep the whole of `content/` for the old path and fix every reference, including anchors.
4. Run `npm run lint:links`, which fails on dead internal links and reports pages that are built but absent from the
   nav.

## Anchors

Heading slugs are generated from heading text. Changing a heading changes its anchor and breaks any link pointing at it.
After editing headings, grep for the old anchor across
`content/` and fix the references, then let `lint:links` confirm.

## Before you call it done

```bash
npm run check   # typecheck, tests, build, link check
```

Then read the page in the browser. Documentation that has not been read in its rendered form has not been written.
