---
title: Module customization
description: Customize Gacela pillar suffixes, project namespaces, module paths, and discovery behavior.
---

# Module customization

These options change Gacela's naming and discovery conventions. Keep the defaults for new applications; customize them when integrating an established structure or overriding a vendor module.

## Custom pillar suffixes

The defaults are `Facade`, `Factory`, `Provider`, and `Config`. Register alternatives when the project already uses different names:

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

Use this for targeted vendor customization while preserving the vendor Facade API. Mirror only the module path and pillar being replaced.

## Module scan paths

Restrict discovery when modules live under known directories:

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->setAppModulePaths(['src']);
};
```

This speeds up `list:modules`, `debug:modules`, `cache:warm`, and `doctor` by excluding unrelated directories. Paths may be absolute or relative to the application root.

## Lifecycle listeners

Use `registerGenericListener()` for all events or `registerSpecificListener()` for one event class. Listeners are best suited to tracing, profiling, and metrics; they should not contain business behavior.

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

`resetInMemoryCache()` clears state before bootstrap. Prefer [`GacelaTestCase`](/docs/testing#gacelatestcase) or `ContainerFixture` in tests because they also clean up after each test.

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->resetInMemoryCache();
};
```

For long-running processes that must clear all runtime and file-backed resolution caches, use [`Gacela::resetCache()`](/docs/bootstrap#gacela-resetcache).
