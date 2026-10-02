---
title: Shipping a Gacela package
description: Let a Composer package configure the Gacela application that installs it, and decide which packages may.
---

# Shipping a Gacela package [since 2.4]

A Composer package can contribute to a Gacela application just by being installed. The package declares its
configuration in its own `composer.json`:

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
It is arbitrary PHP, run inside `Gacela::bootstrap()`, in your application's process, with access to everything your
application can reach. A Laravel service provider registered through `extra.laravel.providers` asks for the same
trust, and `composer require` is the whole installation step.
:::

`GacelaConfig::dontDiscover()` controls it:

```php [gacela.php]
return static function (GacelaConfig $config): void {
    // Named packages: the file is never opened.
    $config->dontDiscover(['acme/legacy-invoicing']);

    // Everything, installed now or later: no package's file is opened at all.
    $config->dontDiscover(['*']);
};
```

Naming a package means its config is never read. It does not undo effects afterwards. `dontDiscover(['*'])` is
checked before the manifest is touched. A project that wants only its own `gacela.php` to decide what runs at boot
pays nothing for the feature and reads nothing from `vendor/`.

Both forms work in the bootstrap closure and in `gacela.php`, and they add up across the two. **They cannot be read
from `gacela-{APP_ENV}.php`**: an environment file is merged after the packages, so an opt-out written there would
arrive after the code it refuses had already run. `doctor` reports one written there.

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

A package can also contribute by attribute, with no line in the config file. A class in the package's
`autoload.psr-4` directories can carry [`#[Plugin]`](/docs/extensions#plugin-stacks),
[`#[Tag]`](/docs/bindings#service-tags) or [`#[AsListener]`](/docs/events#your-own-events), and joins like an
application class. Gacela reads only the package's own psr-4 namespaces, and only for a discovered package. The package
still needs `extra.gacela.config`, even if the file it names configures nothing. [since 2.5]

Two things a package should not use:

- **`addAppConfig()`**: a config path resolves against the application root, which the package knows nothing about.
  Ship `addAppConfigKeyValue()` defaults instead, and let the application's own config layers override them.
- **`setProjectNamespaces()` and `setAppModulePaths()`**: these describe the application. The merger replaces the
  module paths rather than appending, so a package setting them would remove the application's own list.

## Merge order

```text
bootstrap closure  →  package 1  →  package 2  →  …  →  gacela.php  →  gacela-{APP_ENV}.php
```

Packages merge in **Composer's installed order**, and the project's own configuration merges after all of them, so
**the project always has the last word**. Overriding a package default takes one line in `gacela.php`:

```php
$config->addBinding(AuditSinkInterface::class, OurOwnSink::class);
```

When two packages declare the same thing, the later-installed one wins. Do not rely on that: Composer's dependency
graph decides installed order, and it can change under a `composer update` that touches neither package.

For anything appended rather than replaced (such as a plugin stack, a tag or a listener list), merging first means being **first
in the list**. A package's channel runs before the application's own.

## A broken declaration does not stop the boot

`composer require` must never stop an application from booting. A declaration that cannot do what it says is
skipped, not fatal: the file named by `extra.gacela.config` is missing, or it does not return a `callable(GacelaConfig)`.
Both are silent at boot. The `discovered packages` check of [`doctor`](/docs/cli#doctor) reports them, and also reports
a `dontDiscover()` entry that refuses nothing.

An application root with no `vendor/composer/installed.json` discovers nothing, silently. That is a checkout with no
install, or a fixture directory used as an app root. It is not a fault.

## Seeing what a boot picked up

- [`debug:container --stats`](/docs/cli#debug-container) names each discovered package, the file that ran and what
  it declared, plus the refused ones. `--json` carries the same under a `packages` key.
- `debug:events` lists a listener a package registered the same way as one the application registered.
- `doctor` gives the verdict.
- `PackageConfigMergedEvent` fires once per discovered package, with `packageName()`, `configFile()` and
  `position()` (the 1-based place in the merge order). It is dispatched after the whole configuration is assembled, so
  a listener in `gacela.php` hears it.

## What it costs

Gacela caches the resolved list of config files in the cache directory, keyed by the size and modification time of
`vendor/composer/installed.json`. A `composer install` invalidates it, and nothing else has to. The warm path is a
`stat` and an `include` of a small PHP array. An application where no package declares the key pays one `stat`.

`setFileCache(false)` turns the cache off, so every boot re-reads the manifest. `dontDiscover(['*'])` reads
nothing, so there is nothing to cache. `cache:warm` and `cache:clear` treat the file like every other cache file.

## Checklist for a package author

1. `extra.gacela.config` in `composer.json`, pointing at a file that returns `callable(GacelaConfig): void`.
2. `require` on `gacela-project/gacela`, so the package declares what it imports. `doctor` checks this too.
3. Publish your extension points as interfaces and declare the stacks yourself:
   `addPluginStack(YourContract::class, [YourDefault::class])`. A consuming application appends to the same stack by
   naming the interface.
4. Bind defaults; do not enforce them. The application merges last, so document which binding to override.
5. Keep the config file declarative. It runs during `Gacela::bootstrap()`, in somebody else's process: read no
   configuration, touch no network, write no files.
6. State in your README that installing the package runs code at boot, and that `dontDiscover(['your/package'])` is how
   a consumer declines.

The [upstream guide](https://github.com/gacela-project/gacela/blob/main/docs/packages.md) has the report formats and
the reasoning behind each rule.
