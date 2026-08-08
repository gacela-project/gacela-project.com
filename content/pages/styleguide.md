---
title: Facet styleguide
description: The design system behind gacela-project.com, rendered from the same tokens the site itself uses.
unlisted: true
---

# Facet

The design system this site is built from. Every swatch, size and component below is
rendered from the tokens in `src/design/tokens.css`, so if a token breaks, it breaks here
where somebody will see it.

Check this page in both themes before shipping a visual change.

## Colour

Colour is authored in OKLCH and expressed with `light-dark()`, so the two themes are one
palette at two lightness ranges rather than two stylesheets. Nothing outside `tokens.css`
may contain a colour literal.

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

Brass is the only accent, and it is deliberately rare: it marks the one thing on a screen
that matters most, and nothing else. If two brass elements compete in a viewport, one of
them is wrong.

<div class="sg-grid">
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--accent)"></div><span class="sg-swatch__name">--accent</span><span class="sg-swatch__use">Links, active state</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--accent-wash)"></div><span class="sg-swatch__name">--accent-wash</span><span class="sg-swatch__use">Selected backgrounds</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--info)"></div><span class="sg-swatch__name">--info</span><span class="sg-swatch__use">Note callouts</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--warning)"></div><span class="sg-swatch__name">--warning</span><span class="sg-swatch__use">Warning callouts</span></div>
  <div class="sg-swatch"><div class="sg-swatch__chip" style="background: var(--danger)"></div><span class="sg-swatch__name">--danger</span><span class="sg-swatch__use">Danger callouts</span></div>
</div>

## Typography

Three faces, each with one job. Raleway carries display type, Heebo carries reading, and
JetBrains Mono does every label on the site, which is what gives the pages their annotated,
drawing-like quality.

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

A 4px grid that opens up as it climbs. Space encodes relatedness: less inside a group,
more between groups.

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
  <a class="button button--primary" href="/styleguide">Primary <span class="button__arrow" aria-hidden="true">&rarr;</span></a>
  <a class="button" href="/styleguide">Secondary</a>
  <a class="button button--ghost" href="/styleguide">Ghost</a>
  <span class="badge">Badge</span>
  <span class="badge badge--accent">Accent badge</span>
</div>

## Callouts

Four kinds, distinguished by the colour of the rail and by their label, never by colour
alone.

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

## Code

A framed block with a mono caption bar rather than a filled slab, so a page of
documentation does not become a stack of grey rectangles. The syntax palette is part of
the design system: keywords take the brass accent, because keywords are structure.

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

Parallel files become tabs. The tabs are radio inputs and labels, so they switch with no
JavaScript at all:

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

Inline `code` sits in prose without breaking the line rhythm.

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

| Class | File | Responsibility |
| --- | --- | --- |
| Facade | `Facade.php` | The entry point, and the only public surface |
| Factory | `Factory.php` | Creates the module's own services |
| Provider | `Provider.php` | Resolves dependencies from other modules |
| Config | `Config.php` | Reads the project's configuration |

### Quotes

> The Facade is the entry point of your module.

## Links

Internal links such as [the Factory](/docs/factory) sit in the accent colour. External
links such as [Packagist](https://packagist.org/packages/gacela-project/gacela) look the
same but carry `rel="noreferrer"`.
