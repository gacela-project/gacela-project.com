---
name: deployment
description: main deploys to production through Netlify with no staging
alwaysApply: true
---

`main` is production. Netlify builds it from `netlify.toml`, running `npm run build` and publishing `dist/` to
gacela-project.com; the apex record points at Netlify and the repository has no GitHub Pages site. Netlify keeps
serving the last successful deploy, so a failed build shows up as a site that has quietly stopped updating rather
than as an error. There is no staging environment, so do not merge anything that has not passed `npm run check`
locally.
