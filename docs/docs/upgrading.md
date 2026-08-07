# Upgrading from 1.21 to 2.0

Gacela 2.0 raises the PHP floor, moves to `gacela-project/container` 2.x, removes three deprecated aliases, and makes undeclared pillar accessors visible to static analysis. Version 1.21.0 is the final 1.x release.

## Before upgrading

Prepare the application while it still runs on 1.21:

```bash
composer require gacela-project/gacela:^1.21
vendor/bin/gacela doctor
vendor/bin/gacela cache:clear
```

Run the test suite with `error_reporting(E_ALL)` so Gacela deprecations are visible. Search explicitly for the trait removal, which cannot emit a use-time deprecation:

```bash
rg "DocBlockResolverAwareTrait" src/
```

Then require the new major:

```bash
composer require gacela-project/gacela:^2.0
```

## Requirements

- PHP is now **8.3 or newer**, up from 8.1.
- `gacela-project/container` is now `^2.0.2`.
- Symfony development integrations support `^7.0 || ^8.0`; projects pinned to Symfony 6 must upgrade.

## Removed APIs

| Removed in 2.0 | Replacement |
|---|---|
| `AbstractDependencyProvider` | `AbstractProvider` |
| `GacelaConfig::addMappingInterface()` | `GacelaConfig::addBinding()` |
| `DocBlockResolverAwareTrait` | `ServiceResolverAwareTrait` |

### Rename dependency providers completely

Change the class, parent, and filename:

```diff
-// src/MyModule/MyModuleDependencyProvider.php
-final class MyModuleDependencyProvider extends AbstractDependencyProvider
+// src/MyModule/MyModuleProvider.php
+final class MyModuleProvider extends AbstractProvider
```

The filename matters because Gacela discovers pillars by convention. A class renamed without its file silently stops resolving. Running `doctor` on 1.21 detects the mismatch before the old resolver is removed.

`provideModuleDependencies()` remains the imperative registration method. `#[Provides]` remains the attribute-first alternative.

### Rename bindings and the resolver trait

```diff
-$config->addMappingInterface(MyInterface::class, MyImplementation::class);
+$config->addBinding(MyInterface::class, MyImplementation::class);

-use Gacela\Framework\DocBlockResolverAwareTrait;
+use Gacela\Framework\ServiceResolverAwareTrait;
```

Both are mechanical renames with the same behavior.

## Declare pillar accessors

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

A `@method BillingFacade getFacade()` annotation still helps IDEs, but runtime resolution through docblocks or scanned `use` statements is deprecated in 2.0 and will be removed in 3.0. Add the attribute even when retaining the docblock.

Psalm users must register the 2.0 plugin separately from the existing XInclude:

```xml
<plugins>
    <pluginClass class="Gacela\Psalm\Plugin"/>
</plugins>
```

## Container compatibility

Gacela's container now decorates the final 2.x container and continues to implement `ContainerInterface`. Code type-hinting the concrete inner container should accept its interface instead:

```diff
-function configure(\Gacela\Container\Container $container): void
+function configure(\Gacela\Container\ContainerInterface $container): void
```

Module containers are now scopes of one application container. App-wide configuration is walked once per bootstrap, while Provider registrations and instances remain isolated per module scope.

## Other targeted changes

- `ConsoleFacade::getContainerStats()` and `ConsoleFactory::getContainerStats()` now return a final readonly `ContainerStats` object, not an array. Use properties such as `registeredServices` and `processMemoryBytes`, plus `processMemoryFormatted()`; this replaces the misleading `memoryUsageFormatted()` name.
- `CacheWarmedEvent::failedCount()` now counts actual resolution failures. Use the new `skippedCount()` for pillar classes a module simply does not contain.
- Typed class constants on `AbstractSetupGacela` and `ConfigInterface` can expose incompatible overrides at compile time.
- `Gacela::resetCache()` no longer clears a cache backend registered through `CacheableConfig::setStorage()`.

## New in 2.0

- `GacelaConfig::loadDefinitions()` loads wiring from arrays, PHP files, or JSON files.
- `GacelaConfig::afterResolving()` runs idempotent callbacks after top-level container resolution.
- `GacelaConfig::tag()` groups services into lazy iterables.
- `Gacela\Framework\Attribute\Inject` is the preferred import and supports constructor parameters, properties, and setters.
- `#[Lazy]` is honored by `AbstractFactory::make()`; native lazy behavior requires PHP 8.4 and falls back safely to eager construction on 8.3.
- Dependency-tree output now follows applied bindings and marks nodes as `binding`, `instance`, `autowired`, or `unresolvable`.

After migration, run the test suite, PHPStan or Psalm, and `vendor/bin/gacela doctor --strict`.
