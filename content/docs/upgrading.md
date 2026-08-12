---
title: Upgrading Gacela
description: Move from 1.21 to 2.0, then on to 2.1 and 2.2; PHP and container requirements, removed APIs, declared service accessors, and what to verify.
---

# Upgrading Gacela

## From 1.21 to 2.0

Gacela 2.0 raises the PHP floor, moves to `gacela-project/container` 2.x, removes three deprecated aliases, and makes
undeclared pillar accessors visible to static analysis. Version 1.21.0 is the final 1.x release, and its documentation
is kept as an archive at [/docs/1.x](/docs/1.x).

### Before upgrading

Prepare the application while it still runs on 1.21:

```bash
composer require gacela-project/gacela:^1.21
vendor/bin/gacela doctor
vendor/bin/gacela cache:clear
```

Run the test suite with `error_reporting(E_ALL)` so Gacela deprecations are visible. Search explicitly for the trait
removal, which cannot emit a use-time deprecation:

```bash
rg "DocBlockResolverAwareTrait" src/
```

Then require the new major:

```bash
composer require gacela-project/gacela:^2.0
```

### Requirements

- PHP is now **8.3 or newer**, up from 8.1.
- `gacela-project/container` is now `^2.0.2`.
- Symfony development integrations support `^7.0 || ^8.0`; projects pinned to Symfony 6 must upgrade.

### Removed APIs

| Removed in 2.0                        | Replacement                  |
|---------------------------------------|------------------------------|
| `AbstractDependencyProvider`          | `AbstractProvider`           |
| `GacelaConfig::addMappingInterface()` | `GacelaConfig::addBinding()` |
| `DocBlockResolverAwareTrait`          | `ServiceResolverAwareTrait`  |

#### Rename dependency providers completely

Change the class, parent, and filename:

```diff
-// src/MyModule/MyModuleDependencyProvider.php
-final class MyModuleDependencyProvider extends AbstractDependencyProvider
+// src/MyModule/MyModuleProvider.php
+final class MyModuleProvider extends AbstractProvider
```

The filename matters because Gacela discovers pillars by convention. A class renamed without its file silently stops
resolving. Running `doctor` on 1.21 detects the mismatch before the old resolver is removed.

`provideModuleDependencies()` remains the imperative registration method. `#[Provides]` remains the attribute-first
alternative.

#### Rename bindings and the resolver trait

```diff
-$config->addMappingInterface(MyInterface::class, MyImplementation::class);
+$config->addBinding(MyInterface::class, MyImplementation::class);

-use Gacela\Framework\DocBlockResolverAwareTrait;
+use Gacela\Framework\ServiceResolverAwareTrait;
```

Both are mechanical renames with the same behavior.

### Declare pillar accessors

The PHPStan suppression for undeclared magic accessors is gone. Declare each accessor with `#[ServiceMap]`:

```php
use Gacela\Framework\ServiceResolver\ServiceMap;
use Gacela\Framework\ServiceResolverAwareTrait;

#[ServiceMap(method: 'getFacade', className: BillingFacade::class)]
final class BillingController
{
    use ServiceResolverAwareTrait;
}
```

A `@method BillingFacade getFacade()` annotation still helps IDEs, but runtime resolution through docblocks or scanned
`use` statements is deprecated in 2.0 and will be removed in 3.0. Add the attribute even when retaining the docblock.

Psalm users must register the 2.0 plugin separately from the existing XInclude:

```xml

<plugins>
  <pluginClass class="Gacela\Psalm\Plugin"/>
</plugins>
```

### Container compatibility

Gacela's container now decorates the final 2.x container and continues to implement `ContainerInterface`. Code
type-hinting the concrete inner container should accept its interface instead:

```diff
-function configure(\Gacela\Container\Container $container): void
+function configure(\Gacela\Container\ContainerInterface $container): void
```

Module containers are now scopes of one application container. App-wide configuration is walked once per bootstrap,
while Provider registrations and instances remain isolated per module scope.

### Other targeted changes

- `ConsoleFacade::getContainerStats()` and `ConsoleFactory::getContainerStats()` now return a final readonly
  `ContainerStats` object, not an array. Use properties such as `registeredServices` and `processMemoryBytes`, plus
  `processMemoryFormatted()`; this replaces the misleading `memoryUsageFormatted()` name.
- `CacheWarmedEvent::failedCount()` now counts actual resolution failures. Use the new `skippedCount()` for pillar
  classes a module simply does not contain.
- Typed class constants on `AbstractSetupGacela` and `ConfigInterface` can expose incompatible overrides at compile
  time.
- `Gacela::resetCache()` no longer clears a cache backend registered through `CacheableConfig::setStorage()`.

### New in 2.0

- `GacelaConfig::loadDefinitions()` loads wiring from arrays, PHP files, or JSON files.
- `GacelaConfig::afterResolving()` runs idempotent callbacks after top-level container resolution.
- `GacelaConfig::tag()` groups services into lazy iterables.
- `Gacela\Framework\Attribute\Inject` is the preferred import and supports constructor parameters, properties, and
  setters.
- `#[Lazy]` is honored by `AbstractFactory::make()`; native lazy behavior requires PHP 8.4 and falls back safely to
  eager construction on 8.3.
- Dependency-tree output now follows applied bindings and marks nodes as `binding`, `instance`, `autowired`, or
  `unresolvable`.

After migration, run the test suite, PHPStan or Psalm, and `vendor/bin/gacela doctor --strict`.

## Moving on to 2.1

2.1 is a drop-in upgrade from 2.0: no removed APIs, no signature changes, no configuration to rewrite.

```bash
composer require gacela-project/gacela:^2.1
```

Two things are worth picking up deliberately:

- **[Static analysis](/docs/static-analysis) now runs the architecture rules under Psalm as well as PHPStan**, each as
  its own suppressible issue class. Psalm users get the full rule set from the plugin they already register, and both
  analysers gain a second cross-module check that resolves a call's receiver by type. Expect new findings on the first
  run.
- **`cache:warm` exits non-zero when a warmup fails.** A deploy step that ignored the exit code was silently green
  before, and will start failing on the problems it was already printing.

Two fixes change behavior you may have worked around: `ttl: 0` means "no expiry" in `InMemoryCacheStorage` as it always
did in `FileCache`, and resolution hooks registered in `gacela.php` now fire inside module scopes as well as at the app
level.

## Moving on to 2.2

2.2 is a drop-in upgrade from 2.1: no removed APIs, no signature changes, no configuration to rewrite.

```bash
composer require gacela-project/gacela:^2.2
```

Everything new is opt-in: a [config schema](/docs/config#declaring-a-config-schema), a
[module dependency rules file](/docs/static-analysis#declaring-which-modules-may-depend-on-which),
[module doubles in tests](/docs/testing#replacing-another-module),
[published scaffolding stubs](/docs/cli#stubs-publish), and the
[Symfony bundle and Laravel provider](/docs/framework-integration). Three things are worth knowing before the upgrade:

- **The Symfony and Laravel bridges now actually reach your vendor directory.** `.gitattributes` stripped both from the
  dist archive and their namespaces sat in `autoload-dev`, so nothing under `Gacela\SymfonyBridge` or
  `Gacela\LaravelBridge` was installable before 2.2. If you copied bridge classes into your project or pinned a path
  repository to work around that, drop the workaround and register the bundle or provider instead.
- **PHPStan users on [phpstan/extension-installer](https://github.com/phpstan/extension-installer) get Gacela's rules
  automatically** from this release on. A project that deliberately ran without `phpstan-gacela.neon` will see new
  findings on the first run; opt out per package via `extra."phpstan/extension-installer".ignore`.
- **A `#[ServiceMap]` accessor whose mapped class the analysing process cannot autoload is now typed** instead of
  silently falling back to `mixed`, so PHPStan may report calls it previously ignored.
