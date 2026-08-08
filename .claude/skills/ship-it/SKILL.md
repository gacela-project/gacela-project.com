---
name: ship-it
description: The pre-merge verification ritual for gacela-project.com. Use before opening a pull request or merging to master, since master deploys straight to production with no staging environment.
---

# Shipping to production

`master` is production. A merge deploys. There is no staging environment and no manual gate, so verification happens
before the merge or it does not happen.

## 1. The mechanical check

```bash
npm run check
```

This is exactly what CI runs: `typecheck`, `vitest run`, `build`, `lint:links`. If it fails locally it will fail in CI,
and if it passes locally CI should be a formality.

Do not proceed past a failure by rerunning. Read the output.

## 2. Look at the site

```bash
npm run preview
```

Open it. Not the diff, the site.

- The page you changed, plus the home page and one documentation page.
- Light theme and dark theme.
- Desktop and a narrow viewport.

Reload with a hard refresh. Content-hashed assets make stale caches unlikely, but the thing you are debugging is always
the one you did not check.

## 3. The checks the tooling cannot do

- **Does the content still say the right thing?** For documentation changes, verify the code samples against
  `../gacela/src`. The framework is the source of truth.
- **Did any URL change?** If so, there must be a redirect in `site.config.ts`. Existing URLs are a promise; search
  engines and other people's bookmarks depend on them.
- **Is anything slower or heavier?** Compare `dist/` sizes against the previous build if you added assets, scripts or
  fonts.
- **Is the first paint still correct with JavaScript disabled?** Turn it off and reload.

## 4. Commit and open the pull request

Commits are small and single-purpose. Content changes and presentation changes go in separate commits, because they are
reviewed differently and reverted separately.

Message format:

```
<area>: <what changed, imperative, lowercase>

<why, if it is not obvious from the diff>
```

Areas: `docs`, `design`, `forge`, `ci`, `content`, `chore`.

The pull request description says what changed, why, and what you verified. If a screenshot would answer the reviewer's
first question, include one, for both themes.

## 5. After the merge

Watch the deploy workflow finish, then load the production URL and confirm the change is live. A deploy is not done when
the workflow is green; it is done when you have seen the result in production.

## When something is wrong in production

Revert first, investigate afterwards. `git revert` the merge commit, push to `master`, and let the deploy roll it back.
A revert is cheap; a broken documentation site while you debug is not.
