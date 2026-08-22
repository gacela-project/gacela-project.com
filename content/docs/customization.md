---
title: Module customization
description: Customize Gacela pillar suffixes, project namespaces, module paths, and discovery behavior.
---

# Module customization

These options change Gacela's naming and discovery conventions. Keep the defaults for new applications; customize them
when integrating an established structure or overriding a vendor module.

## Custom pillar suffixes

The defaults are `Facade`, `Factory`, `Provider`, and `Config`. Register alternatives when the project already uses
different names:

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

Gacela will then recognize this module:

```text
ExampleModule/
├── EntryPoint.php  # Facade role
├── Creator.php     # Factory role
├── Binder.php      # Provider role
└── Settings.php    # Config role
```

Custom suffixes are additive. Default suffixes continue to resolve.

## Declaring a kind of your own [since 2.3]

The four suffix verbs above are sugar over one method. `addResolvableType()` declares a class kind that resolves by
suffix exactly as the pillars do:

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

`getResolvedType()` is memoized per instance and returns `null` when the module has no class of that kind. A project
that would rather write `getExporter()` puts one method over that call.

A declared kind behaves like a pillar everywhere else: the file cache holds it, the test seam
`overrideExistingResolvedClass()` replaces it, and [`make:file`](/docs/cli#make-file) generates one.

```bash
vendor/bin/gacela make:file App/Wallet Exporter   # generates App/Wallet/WalletExporter.php
```

Nothing ships as a template for a kind Gacela does not know, so `make:file` needs a stub of your own at
`stubs/gacela/exporter-maker.txt`. See [`stubs:publish`](/docs/cli#stubs-publish).

One suffix belongs to one kind. Declaring a suffix another kind already claims is refused, and two configuration
sources each claiming the same suffix for a different kind are refused when they are merged.

## Project namespace priority

`setProjectNamespaces()` gives application classes priority over matching vendor module classes.

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->setProjectNamespaces(['App']);
};
```

Given both files below, a vendor `ModuleA\Facade` resolves the application Factory because `App` has priority:

```text
src/App/ModuleA/Factory.php
vendor/acme/package/src/ModuleA/Factory.php
```

Use this for targeted vendor customization while preserving the vendor Facade API. Mirror only the module path and
pillar being replaced.

## Module scan paths

Restrict discovery to known directories with `setAppModulePaths(['src'])`, which speeds up `list:modules`,
`debug:modules`, `cache:warm`, and `doctor`. The full reference is
[Bootstrap > Application module paths](/docs/bootstrap#application-module-paths).

## Custom scaffolding templates [since 2.2]

`make:module` and `make:file` generate from templates that ship with Gacela. Publish them into the project and the
generators use yours instead, per file:

```bash
vendor/bin/gacela stubs:publish
```

They land in `stubs/gacela/` by default; point `setStubsDir()` somewhere else when the project keeps templates
elsewhere:

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->setStubsDir('resources/stubs');
};
```

See [`stubs:publish`](/docs/cli#stubs-publish) for the placeholders a stub must keep and how `doctor` reports
one that lost them.

## Lifecycle listeners

Use `registerGenericListener()` for all events or `registerSpecificListener()` for one event class. Listeners are best
suited to tracing, profiling, and metrics; they should not contain business behavior.

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

`resetInMemoryCache()` clears state before bootstrap. Prefer [`GacelaTestCase`](/docs/testing#gacelatestcase) or
`ContainerFixture` in tests because they also clean up after each test.

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->resetInMemoryCache();
};
```

For long-running processes that must clear all runtime and file-backed resolution caches, use [
`Gacela::resetCache()`](/docs/bootstrap#gacela-resetcache).
