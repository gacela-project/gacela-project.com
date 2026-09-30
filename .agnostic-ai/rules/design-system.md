---
name: design-system
description: How to add a component to Facet and check both themes
globs: ["src/design/**", "src/templates/**", "content/pages/design-system.md"]
---

Facet is documented at `/design-system` in the running site, which is generated from the same tokens the site uses. When
adding a component:

1. Add its tokens to `src/design/tokens.css` if it needs new ones.
2. Add the component CSS to `src/design/components/`.
3. Add it to the design system page so it stays visible and reviewable.

Dark mode is a token swap, never a separate stylesheet. Both themes must be checked before shipping any visual change.
