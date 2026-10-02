---
title: Shipping a Gacela package
description: Let a Composer package configure the Gacela application that installs it, and decide which packages may.
---

# Shipping a Gacela package [since 2.4]

A Composer package can contribute to a Gacela application by being installed. It declares its configuration in its own
`composer.json`:

```json [composer.json]
{
    "name": "acme/invoice-audit",
    "extra": {
        "gacela": {
            "config": "config/gacela.php"
        }
    }
}
```

That file returns the same thing a project's own `gacela.php` returns, a `callable(GacelaConfig): void`:

```php [config/gacela.php]
<?php

declare(strict_types=1);

use Acme\InvoiceAudit\AuditChannel;
use Gacela\Framework\Bootstrap\GacelaConfig;

return static function (GacelaConfig $config): void {
    $config->addPluginStack(NotificationChannelInterface::class, [AuditChannel::class]);
};
```

There is no second config format and no registration API to learn. The consuming application writes nothing:

```bash
composer require acme/invoice-audit
```

## Read the security note first

::: warning A discovered config is code that runs at boot
It is arbitrary PHP, executed inside `Gacela::bootstrap()`, in your application's process, with everything your
application can reach. That is the same bargain a Laravel service provider registered through
`extra.laravel.providers` asks for, and `composer require` is the whole of the installation step.
:::

`GacelaConfig::dontDiscover()` is the control:

```php [gacela.php]
return static function (GacelaConfig $config): void {
    // Named packages: the file is never opened.
    $config->dontDiscover(['acme/legacy-invoicing']);

    // Everything, installed now or later: no package's file is opened at all.
    $config->dontDiscover(['*']);
};
```

Naming a package means its config is never read, not that its effects are undone afterwards. `dontDiscover(['*'])` is
checked before the manifest is touched, so a project that wants nothing but its own `gacela.php` deciding what runs at
boot pays nothing for the feature and reads nothing from `vendor/`.

Both forms are read from the bootstrap closure and from `gacela.php`, and they accumulate across the two. **They cannot
be read from `gacela-{APP_ENV}.php`**: an environment file is merged after the packages, so an opt-out written there
would arrive once the code it refuses had already run. `doctor` reports one written there.

## What a package can contribute

Everything on `GacelaConfig`. In practice:

| Kind                 | Methods                                                                                             |
|----------------------|-----------------------------------------------------------------------------------------------------|
| bindings             | `addBinding()`, `addFactory()`, `addLazy()`, `addProtected()`, `addAlias()`                          |
| extension points     | `addPluginStack()`, `addHandlerRegistry()`, `tag()`, `extendService()`, `extendProviderService()`   |
| behaviour at boot    | `addPlugin()`, `registerSpecificListener()`, `registerGenericListener()`                            |
| declarations         | `declareConfigSchema()`, `declareDtoSchema()`, `addResolvableType()`, `addSuffixType*()`            |
| configuration values | `addAppConfigKeyValue()`                                                                            |
| health               | `addHealthCheck()`                                                                                  |

Or by attribute, with no line in the config file: a class in the package's `autoload.psr-4` directories can carry
[`#[Plugin]`](/docs/extensions#plugin-stacks), [`#[Tag]`](/docs/bindings#service-tags) or
[`#[AsListener]`](/docs/events#your-own-events), and joins as an application class would. Only the package's own psr-4
namespaces are read, and only for a package that is discovered. The package still needs `extra.gacela.config`, even if
the file it names configures nothing. [since 2.5]

Two things a package should not reach for:

- **`addAppConfig()`**: a config path resolves against the application root, which the package knows nothing about.
  Ship `addAppConfigKeyValue()` defaults instead, and let the application's own config layers override them.
- **`setProjectNamespaces()` and `setAppModulePaths()`**: these describe the application, and the merger replaces the
  module paths rather than appending, so a package setting them would take the application's own list away.

## Merge order

```text
bootstrap closure  →  package 1  →  package 2  →  …  →  gacela.php  →  gacela-{APP_ENV}.php
```

Packages are merged in **Composer's installed order**, and the project's own configuration is merged after all of
them, so **the project always has the last word**. Overriding a default a package set is one line in `gacela.php`:

```php
$config->addBinding(AuditSinkInterface::class, OurOwnSink::class);
```

Between two packages that declare the same thing, the later-installed one wins. Do not rely on that: installed order
is decided by Composer's dependency graph, and it can change under a `composer update` that touches neither package.

For anything appended rather than replaced, such as a plugin stack, a tag or a listener list, being merged first means
being **first in the list**. A package's channel runs before the application's own.

## A broken declaration does not stop the boot

`composer require` must never be able to stop an application from booting, so a declaration that cannot do what it
says is skipped rather than fatal: the file named by `extra.gacela.config` is missing, or it does not return a
`callable(GacelaConfig)`. Both are silent at boot and reported by the `discovered packages` check of
[`doctor`](/docs/cli#doctor), which also reports a `dontDiscover()` entry that refuses nothing.

An application root with no `vendor/composer/installed.json` discovers nothing, silently. That is a checkout with no
install, or a fixture directory used as an app root, and it is not a fault.

## Seeing what a boot picked up

- [`debug:container --stats`](/docs/cli#debug-container) names each discovered package, the file that ran and what
  it declared, and the refused ones too. `--json` carries the same under a `packages` key.
- `debug:events` lists a listener a package registered like one the application registered.
- `doctor` gives the verdict.
- `PackageConfigMergedEvent` fires once per discovered package, with `packageName()`, `configFile()` and
  `position()`, the 1-based place in the merge order. It is dispatched after the whole configuration is assembled, so
  a listener in `gacela.php` hears it.

## What it costs

The resolved list of config files is cached in the cache directory, keyed by the size and modification time of
`vendor/composer/installed.json`, so a `composer install` invalidates it and nothing else has to. The warm path is a
`stat` and an `include` of a small PHP array. An application where no package declares the key pays one `stat`.

`setFileCache(false)` switches the cache off, and every boot re-reads the manifest. `dontDiscover(['*'])` reads
nothing, so there is nothing to cache. `cache:warm` and `cache:clear` treat the file like every other cache file.

## Checklist for a package author

1. `extra.gacela.config` in `composer.json`, pointing at a file that returns `callable(GacelaConfig): void`.
2. `require` on `gacela-project/gacela`, so the package declares what it imports. `doctor` checks this too.
3. Publish your extension points as interfaces and declare the stacks yourself:
   `addPluginStack(YourContract::class, [YourDefault::class])`. A consuming application appends to the same stack by
   naming the interface.
4. Bind defaults, do not enforce them. The application is merged last; document which binding to override.
5. Keep the config file declarative. It runs during `Gacela::bootstrap()`, in somebody else's process: read no
   configuration, touch no network, write no files.
6. Say in your README that installing the package runs code at boot, and that `dontDiscover(['your/package'])` is how
   a consumer declines.

The [upstream guide](https://github.com/gacela-project/gacela/blob/main/docs/packages.md) has the report formats and
the reasoning behind each rule.
