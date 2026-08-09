---
title: Facet design system
description: The design system behind gacela-project.com, rendered from the same tokens the site itself uses.
unlisted: true
---

# Facet

The design system this site is built from. Every swatch, size and component below is rendered from the tokens in
`src/design/tokens.css`, so if a token breaks, it breaks here where somebody will see it.

Check this page in both themes before shipping a visual change.

## Color

Color is authored in OKLCH and expressed with `light-dark()`, so the two themes are one palette at two lightness ranges
rather than two stylesheets. Nothing outside `tokens.css`
may contain a color literal.

The palette has one hue, 251, and it is the mark's own: `#123456`, the blue the gazelle is drawn in, measures
`oklch(0.3192 0.0725 251)`. Every surface and every ink is that color at another lightness, and `--navy-700` is the
brand value itself to the last decimal.

### Surfaces

<div class="sg-grid">
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--canvas)"></div><span class="sg-swatch__name">--canvas</span><span class="sg-swatch__use">The page itself</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--surface)"></div><span class="sg-swatch__name">--surface</span><span class="sg-swatch__use">Cards and panels</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--surface-sunken)"></div><span class="sg-swatch__name">--surface-sunken</span><span class="sg-swatch__use">Code, footer, wells</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--surface-raised)"></div><span class="sg-swatch__name">--surface-raised</span><span class="sg-swatch__use">Dialogs and popovers</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--surface-inverse)"></div><span class="sg-swatch__name">--surface-inverse</span><span class="sg-swatch__use">Backdrops</span></div>
</div>

### Ink

<div class="sg-grid">
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--text-strong)"></div><span class="sg-swatch__name">--text-strong</span><span class="sg-swatch__use">Headings, emphasis</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--text)"></div><span class="sg-swatch__name">--text</span><span class="sg-swatch__use">Body copy</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--text-muted)"></div><span class="sg-swatch__name">--text-muted</span><span class="sg-swatch__use">Labels, captions</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--border)"></div><span class="sg-swatch__name">--border</span><span class="sg-swatch__use">Visible edges</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--border-subtle)"></div><span class="sg-swatch__name">--border-subtle</span><span class="sg-swatch__use">Hairline separators</span></div>
</div>

### Accent and semantics

The project's blue is the only accent, and it is deliberately rare: it marks the one thing on a screen that matters
most, and nothing else. If two accent elements compete in a viewport, one of them is wrong.

The accent shares the ink's hue exactly, so it has only chroma to separate itself with: the ink ramp stays under 0.045
and the accent runs 0.11 to 0.15. That gap is what makes an active sidebar item read as active, and it is the reason the
ink is kept as gray as it is.

<div class="sg-grid">
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--accent)"></div><span class="sg-swatch__name">--accent</span><span class="sg-swatch__use">Links, active state</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--accent-wash)"></div><span class="sg-swatch__name">--accent-wash</span><span class="sg-swatch__use">Selected backgrounds</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--info)"></div><span class="sg-swatch__name">--info</span><span class="sg-swatch__use">Note callouts</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--warning)"></div><span class="sg-swatch__name">--warning</span><span class="sg-swatch__use">Warning callouts</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--danger)"></div><span class="sg-swatch__name">--danger</span><span class="sg-swatch__use">Danger callouts</span></div>
</div>

## Typography

Three faces, each with one job. Raleway carries display type, Heebo carries reading, and JetBrains Mono does every label
on the site, which is what gives the pages their annotated, drawing-like quality.

<div class="sg-scale">
  <div class="sg-scale__item"><span class="sg-scale__label">--text-4xl</span><span class="sg-scale__sample" style="font-family: var(--font-display); font-size: var(--text-4xl); font-weight: 700; letter-spacing: var(--tracking-tight)">One door per module</span></div>
  <div class="sg-scale__item"><span class="sg-scale__label">--text-3xl</span><span class="sg-scale__sample" style="font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 700">Section heading</span></div>
  <div class="sg-scale__item"><span class="sg-scale__label">--text-2xl</span><span class="sg-scale__sample" style="font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 700">Page heading</span></div>
  <div class="sg-scale__item"><span class="sg-scale__label">--text-xl</span><span class="sg-scale__sample" style="font-family: var(--font-display); font-size: var(--text-xl); font-weight: 600">Subsection</span></div>
  <div class="sg-scale__item"><span class="sg-scale__label">--text-lg</span><span class="sg-scale__sample" style="font-size: var(--text-lg)">Lede paragraph</span></div>
  <div class="sg-scale__item"><span class="sg-scale__label">--text-base</span><span class="sg-scale__sample" style="font-size: var(--text-base)">Body copy, the default</span></div>
  <div class="sg-scale__item"><span class="sg-scale__label">--text-md</span><span class="sg-scale__sample" style="font-size: var(--text-md)">Secondary copy</span></div>
  <div class="sg-scale__item"><span class="sg-scale__label">--text-2xs</span><span class="sg-scale__sample" style="font-family: var(--font-mono); font-size: var(--text-2xs); letter-spacing: var(--tracking-label); text-transform: uppercase">Mono label</span></div>
</div>

## Space

A 4px grid that opens up as it climbs. Space encodes relatedness: less inside a group, more between groups.

<div class="sg-space">
  <div class="sg-space__item"><div class="sg-space__bar" style="inline-size: var(--space-1)"></div><span class="sg-scale__label">1</span></div>
  <div class="sg-space__item"><div class="sg-space__bar" style="inline-size: var(--space-2)"></div><span class="sg-scale__label">2</span></div>
  <div class="sg-space__item"><div class="sg-space__bar" style="inline-size: var(--space-3)"></div><span class="sg-scale__label">3</span></div>
  <div class="sg-space__item"><div class="sg-space__bar" style="inline-size: var(--space-4)"></div><span class="sg-scale__label">4</span></div>
  <div class="sg-space__item"><div class="sg-space__bar" style="inline-size: var(--space-5)"></div><span class="sg-scale__label">5</span></div>
  <div class="sg-space__item"><div class="sg-space__bar" style="inline-size: var(--space-6)"></div><span class="sg-scale__label">6</span></div>
  <div class="sg-space__item"><div class="sg-space__bar" style="inline-size: var(--space-7)"></div><span class="sg-scale__label">7</span></div>
  <div class="sg-space__item"><div class="sg-space__bar" style="inline-size: var(--space-8)"></div><span class="sg-scale__label">8</span></div>
</div>

## Buttons

<div class="sg-row">
  <a class="button button--primary" href="/design-system">Primary <span class="button__arrow" aria-hidden="true">&rarr;</span></a>
  <a class="button" href="/design-system">Secondary</a>
  <a class="button button--ghost" href="/design-system">Ghost</a>
  <span class="badge">Badge</span>
  <span class="badge badge--accent">Accent badge</span>
</div>

## Callouts

Four kinds, distinguished by the color of the rail and by their label, never by color alone.

::: tip
Written as `::: tip`. Used for advice that saves the reader time.
:::

::: info
Written as `::: info`. Used for context that is worth knowing but not urgent.
:::

::: warning
Written as `::: warning`. Used where a reader can lose work or time.
:::

::: danger
Written as `::: danger`. Used where a reader can break production.
:::

## Card grid

Routes into a section, for a reader who has arrived without a destination. Cards take a column each while they fit and
fall to one when they do not, so the same markup works in the documentation column and on a full-width page.

<div class="card-grid">
  <a class="card-grid__card" href="/design-system">
    <strong>A card</strong>
    <span>A heading and one sentence. Anything longer belongs in an index list.</span>
  </a>
  <a class="card-grid__card" href="/design-system">
    <strong>A second card</strong>
    <span>Hover moves the border to the accent and the heading with it; focus draws a ring.</span>
  </a>
  <a class="card-grid__card" href="/design-system">
    <strong>A card with a longer heading that wraps onto two lines</strong>
    <span>Cards in a row match the tallest, so an uneven set stays aligned.</span>
  </a>
</div>

## Index list

The workhorse of the marketing pages. A table of contents rather than a grid of cards, because a framework's feature set
is a reference, and a reference should be scannable in one column pass. The arrow appears on hover and on focus; only
the title takes the accent.

<ul class="index-list" role="list">
  <li class="index-list__item">
    <a class="index-list__link" href="/design-system">
      <span>
        <span class="index-list__title">An entry</span>
        <span class="index-list__summary">One line of summary, long enough to say what the page covers</span>
      </span>
      <span class="index-list__arrow" aria-hidden="true">&rarr;</span>
    </a>
  </li>
  <li class="index-list__item">
    <a class="index-list__link" href="/design-system">
      <span>
        <span class="index-list__title">A second entry</span>
        <span class="index-list__summary">Two columns while they fit, one when they do not</span>
      </span>
      <span class="index-list__arrow" aria-hidden="true">&rarr;</span>
    </a>
  </li>
</ul>

## Stat row

A few figures that establish scale before the prose about them starts. Three or four entries is the useful range; past
that a table reads better.

<div class="stat-row">
  <div class="stat-row__stat"><strong>17+</strong><span>application modules</span></div>
  <div class="stat-row__stat"><strong>PHP 8.4</strong><span>declared platform</span></div>
  <div class="stat-row__stat"><strong>MIT</strong><span>open-source license</span></div>
</div>

## Code

A framed block with a mono caption bar rather than a filled slab, so a page of documentation does not become a stack of
gray rectangles. The syntax palette is part of the design system, and it deliberately avoids the accent: keywords sit on
the navy ramp, strings on teal, functions on violet and constants on amber. A hundred accent-colored keywords on a page
would leave nothing for the eight marks that carry real signal.

```php [src/Checkout/Facade.php]
namespace App\Checkout;

use Gacela\Framework\AbstractFacade;

/**
 * @method Factory getFactory()
 */
final class Facade extends AbstractFacade
{
    public function placeOrder(Basket $basket): OrderId
    {
        return $this->getFactory()
            ->createOrderPlacer()
            ->place($basket);
    }
}
```

A block with no caption shows only its language:

```bash
composer require gacela-project/gacela
```

Parallel files become tabs. The tabs are radio inputs and labels, so they switch with no JavaScript at all:

::: code-group

```php [Facade.php]
final class Facade extends AbstractFacade
{
}
```

```php [Factory.php]
final class Factory extends AbstractFactory
{
}
```

:::

## Prose

### Lists

- Modules interact with each other only via their Facade
- The Factory manages the intra-dependencies of the module
- The Provider resolves the extra-dependencies of the module

1. Install the package
2. Create the four classes
3. Bootstrap Gacela at your entry point

### Tables

Hairline rules only. A filled header band would out-shout the headings around it.

| Class    | File           | Responsibility                               |
|----------|----------------|----------------------------------------------|
| Facade   | `Facade.php`   | The entry point, and the only public surface |
| Factory  | `Factory.php`  | Creates the module's own services            |
| Provider | `Provider.php` | Resolves dependencies from other modules     |
| Config   | `Config.php`   | Reads the project's configuration            |

### Quotes

> The Facade is the entry point of your module.

## Documentation furniture

Two components every documentation page carries. The pager closes the page with its neighbours in reading order; the
inline table of contents is the same list as the sidebar TOC, folded into a disclosure for the widths where the sidebar
is gone.

The disclosure below is therefore only visible under 1180px, which is the point the sidebar TOC takes over. Narrow the
window to review it.

<nav class="pager" aria-label="Design system example">
  <a class="pager__link pager__link--previous" href="/design-system" rel="prev">
    <span class="pager__direction">Previous</span>
    <span class="pager__title">The page before</span>
  </a>
  <a class="pager__link pager__link--next" href="/design-system" rel="next">
    <span class="pager__direction">Next</span>
    <span class="pager__title">The page after</span>
  </a>
</nav>

<details class="toc-inline">
  <summary class="toc-inline__summary"><svg class="disclosure-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>On this page</summary>
  <div class="toc-inline__panel">
    <p class="toc__title">On this page</p>
    <ul class="toc__list" role="list">
      <li class="toc__item toc__item--2"><a class="toc__link" href="#color">A second-level heading</a></li>
      <li class="toc__item toc__item--3"><a class="toc__link" href="#surfaces">A third-level heading, indented</a></li>
    </ul>
  </div>
</details>

## Links

Internal links such as [the Factory](/docs/factory) sit in the accent color. External links such
as [Packagist](https://packagist.org/packages/gacela-project/gacela) look the same, but they open in a new tab and say
so: they carry `target="_blank"`,
`rel="noreferrer"`, and a visually hidden "(opens in a new tab)" so the announcement is not left to sighted users alone.
