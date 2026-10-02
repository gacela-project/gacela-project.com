---
title: Module customization
description: Customize Gacela pillar suffixes, project namespaces, module paths, and discovery behavior.
---

# Module customization

These options change Gacela's naming and discovery conventions. Keep the defaults in a new application. Change them
to fit an existing structure or to override a vendor module.

## Custom pillar suffixes

The defaults are `Facade`, `Factory`, `Provider`, and `Config`. If your project already uses other names, register
them:

```php [gacela.php]
use Gacela\Framework\Bootstrap\GacelaConfig;

return static function (GacelaConfig $config): void {
    $config
        ->addSuffixTypeFacade('EntryPoint')
        ->addSuffixTypeFactory('Creator')
        ->addSuffixTypeProvider('Binder')
        ->addSuffixTypeConfig('Settings');
};
```

Gacela then recognizes this module:

```text
ExampleModule/
├── EntryPoint.php  # Facade role
├── Creator.php     # Factory role
├── Binder.php      # Provider role
└── Settings.php    # Config role
```

Custom suffixes add to the defaults. The default suffixes still resolve.

## Declaring a kind of your own [since 2.3]

The four suffix methods above are shortcuts for one method. `addResolvableType()` declares a class kind that resolves
by suffix, exactly like the pillars:

```php
addResolvableType(string $kind, ?string $abstractClass = null, array $suffixes = []);
```

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->addResolvableType('Exporter', AbstractExporter::class, ['Exporter', 'Feed']);
};
```

`$suffixes` defaults to the kind's own name. Every listed suffix resolves, so `Report/ReportExporter.php` and
`Invoice/Feed.php` are both found.

Reach the resolved class through `DeclaredTypeResolverAwareTrait`:

```php [Report/ReportFactory.php]
use Gacela\Framework\AbstractFactory;
use Gacela\Framework\DeclaredTypeResolverAwareTrait;

final class ReportFactory extends AbstractFactory
{
    use DeclaredTypeResolverAwareTrait;

    public function createExportedReport(): string
    {
        /** @var ReportExporter $exporter */
        $exporter = $this->getResolvedType('Exporter');

        return $exporter->export();
    }
}
```

`getResolvedType()` is memoized per instance and returns `null` when the module has no class of that kind. To write
`getExporter()` instead, wrap that call in a method of your own.

A declared kind behaves like a pillar everywhere else: the file cache holds it, the test seam
`overrideExistingResolvedClass()` replaces it, and [`make:file`](/docs/cli#make-file) generates one.

```bash
vendor/bin/gacela make:file App/Wallet Exporter   # generates App/Wallet/WalletExporter.php
```

Gacela ships no template for a kind it does not know, so `make:file` needs your own stub at
`stubs/gacela/exporter-maker.txt`. See [`stubs:publish`](/docs/cli#stubs-publish).

One suffix belongs to one kind. Gacela refuses a suffix that another kind already claims. It also refuses, at merge
time, two configuration sources that claim the same suffix for different kinds.

## Project namespace priority

`setProjectNamespaces()` gives application classes priority over matching vendor module classes.

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->setProjectNamespaces(['App']);
};
```

With both files below, a vendor `ModuleA\Facade` resolves the application Factory, because `App` has priority:

```text
src/App/ModuleA/Factory.php
vendor/acme/package/src/ModuleA/Factory.php
```

Use it to customize part of a vendor module and keep its Facade API. Mirror only the module path and the pillar you
replace.

## Module scan paths

Limit discovery to known directories with `setAppModulePaths(['src'])`. This speeds up `list:modules`,
`debug:modules`, `cache:warm`, and `doctor`. The full reference is
[Bootstrap > Application module paths](/docs/bootstrap#application-module-paths).

## Custom scaffolding templates [since 2.2]

`make:module` and `make:file` generate code from templates that ship with Gacela. Publish them into the project, and
the generators use your copy of each file instead:

```bash
vendor/bin/gacela stubs:publish
```

They land in `stubs/gacela/` by default. If your project keeps templates elsewhere, point `setStubsDir()` there:

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->setStubsDir('resources/stubs');
};
```

See [`stubs:publish`](/docs/cli#stubs-publish) for the placeholders a stub must keep, and how `doctor` reports a stub
that lost them.

## Lifecycle listeners

Use `registerGenericListener()` for all events, or `registerSpecificListener()` for one event class. Listeners suit
tracing, profiling, and metrics. Keep business behavior out of them.

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->registerSpecificListener(
        ResolvedClassCreatedEvent::class,
        static function (ResolvedClassCreatedEvent $event): void {
            // Record resolution telemetry.
        },
    );
};
```

See [Events](/docs/events) for the event catalog and typed payloads.

## Reset InMemoryCache

`resetInMemoryCache()` clears state before bootstrap. In tests, prefer [`GacelaTestCase`](/docs/testing#gacelatestcase)
or `ContainerFixture`: they also clean up after each test.

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->resetInMemoryCache();
};
```

In a long-running process that must clear every runtime and file-backed resolution cache, use
[`Gacela::resetCache()`](/docs/bootstrap#gacela-resetcache).
