---
title: Upgrading Gacela
description: Move from 1.21 to 2.0, then through 2.1 to 2.6: PHP and container requirements, removed APIs, declared service accessors, and what to verify.
---

# Upgrading Gacela

## From 1.21 to 2.0

Gacela 2.0 raises the PHP floor, moves to `gacela-project/container` 2.x, removes three deprecated aliases, and makes
static analysis report undeclared pillar accessors. 1.21.0 is the final 1.x release. Its documentation lives on as an
archive at [/docs/1.x](/docs/1.x).

### Before upgrading

Prepare the application while it still runs on 1.21:

```bash
composer require gacela-project/gacela:^1.21
vendor/bin/gacela doctor
vendor/bin/gacela cache:clear
```

Run the test suite with `error_reporting(E_ALL)` so you see Gacela's deprecations. The trait removal emits no
deprecation when used, so search for it:

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
- Symfony development integrations support `^7.0 || ^8.0`. A project pinned to Symfony 6 must upgrade.

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

The filename matters: Gacela discovers pillars by convention, so a class renamed without its file silently stops
resolving. `doctor` on 1.21 detects the mismatch before the old resolver is gone.

`provideModuleDependencies()` is still the imperative way to register, and `#[Provides]` the attribute-first one.

#### Rename bindings and the resolver trait

```diff
-$config->addMappingInterface(MyInterface::class, MyImplementation::class);
+$config->addBinding(MyInterface::class, MyImplementation::class);

-use Gacela\Framework\DocBlockResolverAwareTrait;
+use Gacela\Framework\ServiceResolverAwareTrait;
```

Both are mechanical renames. Behavior does not change.

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

A `@method BillingFacade getFacade()` annotation still helps IDEs. But resolving at runtime through docblocks or
scanned `use` statements is deprecated in 2.0 and goes away in 3.0. Add the attribute even if you keep the docblock.

On Psalm, register the 2.0 plugin in addition to the existing XInclude:

```xml

<plugins>
  <pluginClass class="Gacela\Psalm\Plugin"/>
</plugins>
```

### Container compatibility

Gacela's container now decorates the final 2.x container and still implements `ContainerInterface`. Code that
type-hints the concrete inner container should accept the interface instead:

```diff
-function configure(\Gacela\Container\Container $container): void
+function configure(\Gacela\Container\ContainerInterface $container): void
```

Module containers are now scopes of one application container. Gacela walks app-wide configuration once per
bootstrap. Provider registrations and instances stay isolated per module scope.

### Other targeted changes

- `ConsoleFacade::getContainerStats()` and `ConsoleFactory::getContainerStats()` now return a final readonly
  `ContainerStats` object, not an array. Use properties such as `registeredServices` and `processMemoryBytes`, and
  `processMemoryFormatted()`, which replaces the misleading `memoryUsageFormatted()`.
- `CacheWarmedEvent::failedCount()` now counts only real resolution failures. The new `skippedCount()` counts pillar
  classes a module does not contain.
- Typed class constants on `AbstractSetupGacela` and `ConfigInterface` can expose incompatible overrides at compile
  time.
- `Gacela::resetCache()` no longer clears a cache backend registered through `CacheableConfig::setStorage()`.

### New in 2.0

- `GacelaConfig::loadDefinitions()` loads wiring from arrays, PHP files, or JSON files.
- `GacelaConfig::afterResolving()` runs idempotent callbacks after a top-level container resolution.
- `GacelaConfig::tag()` groups services into lazy iterables.
- `Gacela\Framework\Attribute\Inject` is the preferred import and supports constructor parameters, properties, and
  setters.
- `AbstractFactory::make()` honors `#[Lazy]`. Native lazy objects need PHP 8.4; on 8.3 it falls back safely to eager
  construction.
- The dependency tree output now follows applied bindings and marks each node as `binding`, `instance`, `autowired`,
  or `unresolvable`.

After migrating, run the test suite, PHPStan or Psalm, and `vendor/bin/gacela doctor --strict`.

## Moving on to 2.1

2.1 is a drop-in upgrade from 2.0: no removed APIs, no signature changes, no configuration to rewrite.

```bash
composer require gacela-project/gacela:^2.1
```

Two changes deserve attention:

- **[Static analysis](/docs/static-analysis) now runs the architecture rules under Psalm as well as PHPStan**, each as
  its own suppressible issue class. Psalm users get the full rule set from the plugin they already register. Both
  analysers gain a second cross-module check that resolves a call's receiver by type. Expect new findings on the first
  run.
- **`cache:warm` exits non-zero when a warmup fails.** A deploy step that ignored the exit code stayed green before. Now
  it fails on the problems it was already printing.

Two fixes change behavior you may have worked around. In `InMemoryCacheStorage`, `ttl: 0` now means "no expiry", as it
always did in `FileCache`. Resolution hooks registered in `gacela.php` now fire inside module scopes as well as at the
app level.

## Moving on to 2.2

2.2 is a drop-in upgrade from 2.1: no removed APIs, no signature changes, no configuration to rewrite.

```bash
composer require gacela-project/gacela:^2.2
```

Everything new is opt-in: a [config schema](/docs/config#declaring-a-config-schema), a
[module dependency rules file](/docs/module-boundaries#declaring-which-modules-may-depend-on-which),
[module doubles in tests](/docs/testing#replacing-another-module),
[published scaffolding stubs](/docs/cli#stubs-publish), and the
[Symfony bundle and Laravel provider](/docs/framework-integration). Know three things before you upgrade:

- **The Symfony and Laravel bridges now reach your vendor directory.** Before 2.2, `.gitattributes` stripped both from
  the dist archive and their namespaces sat in `autoload-dev`, so nothing under `Gacela\SymfonyBridge` or
  `Gacela\LaravelBridge` was installable. If you copied bridge classes into your project or pinned a path repository to
  work around that, drop the workaround and register the bundle or provider.
- **PHPStan users on [phpstan/extension-installer](https://github.com/phpstan/extension-installer) get Gacela's rules
  automatically** from this release on. A project that deliberately ran without `phpstan-gacela.neon` will see new
  findings on the first run; opt out per package via `extra."phpstan/extension-installer".ignore`.
- **A `#[ServiceMap]` accessor is now typed even when the analysing process cannot autoload its mapped class.** It no
  longer falls back silently to `mixed`, so PHPStan may report calls it ignored before.

## Moving on to 2.3

```bash
composer require gacela-project/gacela:^2.3
```

2.3 removes no API. Two scaffolder changes affect scripts, not application code:

- **[`make:module` and `make:file`](/docs/cli#code-generation) refuse to write over existing files.** They check every
  target before writing the first, so a run that would replace something writes nothing and exits `1`. A script that
  regenerates a module in place now fails there. Add `--force` if you mean to replace.
- **`make:file` refuses a kind Gacela does not have.** `Repository` used to produce a `Factory`, and `Controller` a
  `Provider`. Abbreviations of the four pillars still work. Anything else exits `1`. Declare a real kind with
  `addResolvableType()` instead.

## Moving on to 2.4

```bash
composer require gacela-project/gacela:^2.4
```

Most of 2.4 is new and opt-in: [your own events](/docs/events#your-own-events),
[`#[PublicApi]`](/docs/module-boundaries#what-a-module-exports), [module test slices](/docs/testing#testing-one-module),
[`debug:events`](/docs/cli#debug-events), [`migrate:service-map`](/docs/cli#migrate-service-map), and
[package discovery](/docs/packages). Eight changes can alter what an existing project observes; the upstream
[upgrade guide](https://github.com/gacela-project/gacela/blob/main/UPGRADE.md#23--24) has each one in full.

- **A specific listener matches by inheritance.** A listener registered against an interface or an abstract parent
  matched nothing before. It now runs for every event below that type.
- **A supplied dispatcher composes with your listeners.** With `setEventDispatcher()`, the configured listeners run
  first, then your dispatcher gets the event. Before, one side was silently dropped.
- **A custom `#[Cacheable]` key is scoped to its class and method.** The stored key is now `Class::method::` plus the
  template, so a persistent backend runs one cold pass after the upgrade.
- **The opt-in cross-module rules report less.** Classes marked `#[PublicApi]`, and classes under a `Shared`,
  `Transfer`, `Dto` or `Event` sub-namespace, are a module's public API and are no longer reported.
- **A wildcard config path no longer reads environment files into the base layer.** With `addAppConfig('config/*.php')`,
  `config/app-prod.php` is now only the `APP_ENV=prod` layer of `config/app.php`. A key set only in an environment file
  is no longer readable outside that environment. If the file cache is on, run `cache:clear` after deploying.
- **`doctor` warns about a listener target no event can match**, usually a class missing
  `implements GacelaEventInterface`. Under `--strict` that fails the run.
- **A pillar's constructor sees the whole of `gacela.php`.** Definitions, `afterResolving()` hooks, tags and the
  id-keyed verbs now reach the container that builds Facades, Factories, Configs and Providers.
  `debug:modules --check` reads that container too, so it can report faults it used to miss.
- **An installed package can configure your application.** Gacela merges a package that declares `extra.gacela.config`
  before your own `gacela.php`. `$config->dontDiscover(['*'])` turns that off.

## Moving on to 2.5

```bash
composer require gacela-project/gacela:^2.5
```

Nothing to rewrite. New in 2.5: [`#[Plugin]` and `#[Tag]`](/docs/extensions#plugin-stacks),
[`#[AsListener]`](/docs/events#your-own-events), [`debug:plugins`](/docs/cli#debug-plugins),
[`agents:install`](/docs/coding-agents), and [`Gacela::resetRequestState()`](/docs/long-running-runtimes) for
long-running workers. Two things change on the first run after the upgrade:

- **The merged config cache rebuilds once.** With the file cache on, a cache written on a miss now records the config
  files it read. Editing one of those files or an `addAppConfig()` declaration rebuilds it on the next bootstrap. A
  cache written by `cache:warm` is still served unchecked. Older cache files are not read.
- **The discovered-package list is read from `installed.json` once more**, because the cache now records each
  package's psr-4 directories.

## Moving on to 2.6

```bash
composer require gacela-project/gacela:^2.6
```

Nothing to rewrite. New in 2.6:
[`addConfigCacheWatch()` and `enableVerifiedConfigCacheWarm()`](/docs/caching#layer-1-framework-resolution-cache) for
the merged config cache, `#[AsListener]` methods in [`debug:events`](/docs/cli#debug-events), and a request state reset
that the [Symfony bundle and the Laravel bridge](/docs/long-running-runtimes) do for you. Reading a plugin stack that
`gacela.php` never declared now names the [`#[Plugin]`](/docs/extensions#plugin-stacks) classes waiting for it. The
`gacela.suffixExtends` [rule](/docs/static-analysis#what-is-checked) reports less: it checks a `*Factory`, `*Config` or
`*Provider` only in a namespace that has a Facade.
