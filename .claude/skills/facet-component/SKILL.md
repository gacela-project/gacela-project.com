---
name: facet-component
description: Add or change a component in the Facet design system. Use when building any new visual element for the site, or when a component needs new tokens, states or a dark-theme fix.
---

# Adding a component to Facet

Facet is the design system in `src/design`. It is plain CSS: custom properties for tokens, `@layer` for cascade control,
and one file per component. There is no framework and no build step, so the cascade order is the architecture.

## Layer order

```css
@layer reset, tokens, base, layout, components, utilities;
```

A component belongs in `components`. If you find yourself writing `!important` or a long selector chain to win
specificity, you are in the wrong layer.

## Steps

**1. Check whether it already exists.** `ls src/design/components/` first. Most "new" components are an existing one
with a modifier.

**2. Tokens before CSS.** Every colour, space, radius, shadow and type size must be a token. If the component needs a
value that has no token, add the token to `src/design/tokens.css` in the right scale, and define it for both themes. A
raw hex, `rgb()` or `oklch()` outside `tokens.css` is a bug and the convention guard hook will tell you so.

Semantic tokens beat literal ones: `--surface-raised` rather than `--gray-100`. The literal scale exists so the semantic
layer has something to point at.

**3. Write the component.**

```css
/* src/design/components/callout.css */
@layer components {
  .callout {
    /* component-scoped variables first, so modifiers only override these */
    --callout-accent: var(--color-accent);

    padding: var(--space-4) var(--space-5);
    border-inline-start: 2px solid var(--callout-accent);
    background: var(--surface-sunken);
    border-radius: var(--radius-sm);
  }

  .callout--warning {
    --callout-accent: var(--color-warning);
  }
}
```

Rules: one class per component with a `--modifier` convention, no element selectors that reach outside the component,
logical properties (`padding-inline`, `border-inline-start`) rather than physical ones, and `:focus-visible` styling on
anything interactive.

**4. Register it.** Add the `@import` to `src/design/index.css` in layer order.

**5. Both themes.** Dark is a token swap, never a second stylesheet. Load the page in both and check: surfaces still
separate from the background, borders are visible without glowing, and text contrast holds at 4.5:1.

**6. Add it to the styleguide.** `content/pages/styleguide.md` renders every component in every state. A component that
is not on that page will drift, because nobody will see it break. Show the default, each modifier, and the states that
matter (hover, focus, disabled, empty, overflowing).

**7. Check responsiveness without media queries first.** `clamp()`, `min()`,
`grid-template-columns: repeat(auto-fit, minmax(…, 1fr))` and container queries solve most layout problems more robustly
than breakpoints. Reach for a media query when the layout genuinely needs to change shape, not merely to resize.

## Before you call it done

- `npm run build` and look at the real page, at 1440px, 768px and 375px.
- Tab to the component. Focus must be visible.
- Disable JavaScript. It must still look right.
- Any animation under 300ms, and inside a `prefers-reduced-motion: no-preference` guard.
