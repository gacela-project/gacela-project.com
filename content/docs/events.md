---
title: Events
description: Observe bootstrap, configuration, container, cache, and module lifecycle activity without changing module code.
---

# Events

Gacela dispatches **read-only lifecycle events** as it boots, resolves services, reads config and manages caches. Listen
to them for tracing, profiling, debugging or metrics — without touching your module code.

::: tip Zero-cost when nobody listens
Event dispatch is free when nothing listens. Every dispatch site first checks `hasListeners()` and skips building the
event entirely when there are no listeners.
:::

## Registering listeners

Listeners are registered on `GacelaConfig`, in `gacela.php` or the `Gacela::bootstrap()` closure.

### A generic listener — every event

```php
registerGenericListener(callable $listener);
```

```php
<?php # gacela.php

use Gacela\Framework\Event\GacelaEventInterface;

return function (GacelaConfig $config) {
  $config->registerGenericListener(
    function (GacelaEventInterface $event): void {
      error_log($event->toString());
    }
  );
};
```

### A specific listener — one event type

```php
registerSpecificListener(string $event, callable $listener);
```

```php
<?php # gacela.php

use Gacela\Framework\Event\Bootstrap\GacelaBootstrapFinishedEvent;

return function (GacelaConfig $config) {
  $config->registerSpecificListener(
    GacelaBootstrapFinishedEvent::class,
    function (GacelaBootstrapFinishedEvent $event): void {
      error_log(sprintf('Bootstrap took %.2f ms', $event->durationMs()));
    }
  );
};
```

Every event implements `GacelaEventInterface`, which exposes `toString(): string` for logging. Concrete events add typed
accessors — see the catalog below.

## Lifecycle event catalog

The high-level events dispatched over a bootstrap, in the order you meet them.

### `Gacela\Framework\Event\Bootstrap`

| Event                          | Dispatched when              | Accessors              |
|--------------------------------|------------------------------|------------------------|
| `GacelaBootstrapStartedEvent`  | `Gacela::bootstrap()` begins | `appRootDir(): string` |
| `GacelaBootstrapFinishedEvent` | bootstrap has finished       | `durationMs(): float`  |

### `Gacela\Framework\Event\Config`

| Event                    | Dispatched when                       | Accessors         |
|--------------------------|---------------------------------------|-------------------|
| `ConfigInitializedEvent` | the merged configuration is assembled | `keyCount(): int` |
| `ConfigKeyReadEvent`     | a config key is read                  | `key(): string`   |
| `ConfigKeyNotFoundEvent` | a requested config key is missing     | `key(): string`   |

### `Gacela\Framework\Event\Container`

| Event                    | Dispatched when                                      | Accessors      |
|--------------------------|------------------------------------------------------|----------------|
| `BindingRegisteredEvent` | a binding, alias or contextual binding is registered | `id(): string` |
| `ServiceResolvedEvent`   | a service id is instantiated (once per id)           | `id(): string` |

### `Gacela\Framework\Event\Provider`

| Event                     | Dispatched when                   | Accessors                                         |
|---------------------------|-----------------------------------|---------------------------------------------------|
| `ProviderRegisteredEvent` | a module's Provider is registered | `providerClass(): string`, `moduleName(): string` |

### `Gacela\Framework\Event\Cache`

| Event               | Dispatched when                         | Accessors                                                         |
|---------------------|-----------------------------------------|-------------------------------------------------------------------|
| `CacheClearedEvent` | a cache file is removed (`cache:clear`) | `cacheFile(): string`                                             |
| `CacheWarmedEvent`  | `cache:warm` finishes                   | `moduleCount(): int`, `failedCount(): int`, `skippedCount(): int` |

`failedCount()` counts pillar classes found but not resolved. `skippedCount()` counts pillars a module does not contain,
which is a valid module shape. Alert on failures, not skips.

## Recipes

### Time the bootstrap

```php
<?php # gacela.php

use Gacela\Framework\Event\Bootstrap\GacelaBootstrapFinishedEvent;

return function (GacelaConfig $config) {
  $config->registerSpecificListener(
    GacelaBootstrapFinishedEvent::class,
    fn (GacelaBootstrapFinishedEvent $e) => Metrics::timing('gacela.bootstrap_ms', $e->durationMs()),
  );
};
```

### Log every resolved class

```php
<?php # gacela.php

use Gacela\Framework\Event\ClassResolver\AbstractGacelaClassResolverEvent;
use Gacela\Framework\Event\GacelaEventInterface;

return function (GacelaConfig $config) {
  $config->registerGenericListener(function (GacelaEventInterface $event): void {
    if ($event instanceof AbstractGacelaClassResolverEvent) {
      error_log($event->toString());
    }
  });
};
```

### Alert on missing config keys

```php
<?php # gacela.php

use Gacela\Framework\Event\Config\ConfigKeyNotFoundEvent;

return function (GacelaConfig $config) {
  $config->registerSpecificListener(
    ConfigKeyNotFoundEvent::class,
    fn (ConfigKeyNotFoundEvent $e) => error_log("Missing config key: {$e->key()}"),
  );
};
```

## Lower-level resolver & cache events

Beyond the lifecycle events above, Gacela dispatches fine-grained events during class resolution and cache bookkeeping.
Reach for these when tracing *why* a class resolved the way it did. The class-resolution events share the
`AbstractGacelaClassResolverEvent` base, so a single `instanceof` catches them all.

#### `Gacela\Framework\Event\ClassResolver`

- `AbstractGacelaClassResolverEvent` (base type)
- `ResolvedClassCreatedEvent`
- `ResolvedClassCachedEvent`
- `ResolvedCreatedDefaultClassEvent`
- `ResolvedClassTriedFromParentEvent`

#### `Gacela\Framework\Event\ClassResolver\ClassNameFinder`

- `ClassNameValidCandidateFoundEvent`
- `ClassNameInvalidCandidateFoundEvent`
- `ClassNameCachedFoundEvent`
- `ClassNameNotFoundEvent`

#### `Gacela\Framework\Event\ClassResolver\Cache`

- `ClassNameCacheCachedEvent`
- `ClassNamePhpCacheCreatedEvent`
- `ClassNameInMemoryCacheCreatedEvent`
- `CustomServicesCacheCachedEvent`
- `CustomServicesPhpCacheCreatedEvent`
- `CustomServicesInMemoryCacheCreatedEvent`

#### `Gacela\Framework\Event\ConfigReader`

- `ReadPhpConfigEvent`

## Disabling events

Turn the whole system off — no listeners fire, and Gacela swaps in a no-op dispatcher:

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->disableEventListeners();
};
```

This setting wins over registrations: listeners remain configured but silently do not run. Check
`disableEventListeners()` first when a production listener appears inactive.

## Custom dispatcher

Gacela's default dispatcher implements `EventDispatcherInterface`:

```php
interface EventDispatcherInterface
{
    public function dispatch(object $event): void;

    // Whether any listener would receive an event of the given class,
    // so hot-path dispatch sites can skip allocating the event.
    public function hasListeners(string $eventClass): bool;
}
```

Install your own with `setEventDispatcher()`, which is how a hosted application routes Gacela's events onto the bus it
already has: [since 2.3]

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->setEventDispatcher(new Psr14Bridge($myBus));
};
```

Return `false` from `hasListeners()` for the event classes you do not care about and the framework skips allocating
them, which is what keeps the resolution hot path cheap.

A supplied dispatcher **takes precedence over `disableEventListeners()`**. That switch governs the dispatcher Gacela
would build, and this one it does not build. Reach for `setEventDispatcher()` when the events should leave Gacela, and
for [`disableEventListeners()`](#disabling-events) when they should not happen at all.

## See also

- [Testing](/docs/testing) — `GacelaTestCase` records these events and turns them into assertions
  (`assertServiceResolved()`, `assertBindingRegistered()`).
- [Module Customization](/docs/customization#lifecycle-listeners) — where listeners fit among the other `gacela.php`
  hooks.
- [Bootstrap](/docs/bootstrap) — the full `GacelaConfig` surface.
