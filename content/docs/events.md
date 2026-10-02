---
title: Events
description: Observe bootstrap, configuration, container, cache, and module lifecycle activity without changing module code.
---

# Events

Gacela dispatches **read-only lifecycle events** as it boots, resolves services, reads config and manages caches. Listen
to them for tracing, profiling, debugging or metrics, without touching your module code.

::: tip Zero-cost when nobody listens
Dispatch costs nothing when nobody listens. Every dispatch site first checks `hasListeners()` and, with no listeners,
does not build the event at all.
:::

## Registering listeners

Register listeners on `GacelaConfig`, in `gacela.php` or in the `Gacela::bootstrap()` closure.

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

A specific listener matches by inheritance: it runs for the class it names and for every event that extends or
implements it. One listener on `AbstractGacelaClassResolverEvent` covers all four resolver events. [since 2.4]

Every event implements `GacelaEventInterface`, which exposes `toString(): string` for logging. Concrete events add typed
accessors, listed in the catalog below.

## Your own events [since 2.4]

A module can dispatch its own events through the same dispatcher. That is how one module reacts to another without
depending on it. The event is a class that implements `GacelaEventInterface`. The dispatcher is an ordinary dependency:
a Factory asks for it with `getProvidedDependency(EventDispatcherInterface::class)`. The code that announces the event
guards the dispatch the way the framework does:

```php
if ($this->events->hasListeners(InvoiceIssued::class)) {
    $this->events->dispatch(new InvoiceIssued($number, $customerName));
}
```

Register the listener with `registerSpecificListener()` like any other, or put `#[AsListener]` on a public method of
the class that reacts: [since 2.5]

```php
use Gacela\Framework\Attribute\AsListener;

final class NotificationFacade extends AbstractFacade
{
    #[AsListener]
    public function onInvoiceIssued(InvoiceIssued $event): void
    {
        $this->getFactory()->createInvoiceMailer()->send($event);
    }
}
```

The first parameter's type names the event, or `#[AsListener(InvoiceIssued::class)]` names it explicitly. Attribute
listeners run after the ones in `gacela.php`, and only for events a module dispatches through its provided dispatcher.
The framework's own events never reach them. `vendor/bin/gacela debug:events` lists your events beside the framework's,
and [`debug:plugins`](/docs/cli#debug-plugins) lists the `#[AsListener]` methods. The
[upstream guide](https://github.com/gacela-project/gacela/blob/main/docs/events.md#your-own-events) covers the tradeoffs and the test helpers.

## Lifecycle event catalog

The high-level events of a bootstrap, in the order you meet them.

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
which is a valid module shape. Alert on failures, not on skips.

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

Gacela also dispatches fine-grained events during class resolution and cache bookkeeping. Use them to trace *why* a
class resolved the way it did. The class-resolution events share the `AbstractGacelaClassResolverEvent` base, so one
`instanceof` catches them all.

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

Turn the whole system off. No listener fires, and Gacela swaps in a no-op dispatcher:

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->disableEventListeners();
};
```

This setting wins over registrations: listeners stay configured but silently do not run. When a production listener
seems inactive, check `disableEventListeners()` first.

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

Install your own with `setEventDispatcher()`. That is how a hosted application routes Gacela's events onto the bus it
already has: [since 2.3]

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->setEventDispatcher(new MyDispatcher($myBus));
};
```

It also accepts a PSR-14 `Psr\EventDispatcher\EventDispatcherInterface`, such as Symfony's or Laravel's, and wraps it,
so you need no adapter. PSR-14 cannot say what it listens to, so the wrapper answers `true` from `hasListeners()` and
every dispatch site allocates its event. For a narrower answer, implement Gacela's interface yourself. [since 2.4]

A supplied dispatcher composes with the listeners registered beside it. The configured listeners run first, in
registration order. Then your dispatcher gets the event if its `hasListeners()` says yes. [since 2.4]

Return `false` from `hasListeners()` for the event classes you do not care about, and the framework skips allocating
them. That keeps the resolution hot path cheap.

A supplied dispatcher **takes precedence over `disableEventListeners()`**. That switch governs the dispatcher Gacela
would build, and Gacela does not build this one. Use `setEventDispatcher()` when the events should leave Gacela, and
[`disableEventListeners()`](#disabling-events) when they should not happen at all.

## See also

- [Testing](/docs/testing): `GacelaTestCase` records these events and turns them into assertions
  (`assertServiceResolved()`, `assertBindingRegistered()`).
- [Module Customization](/docs/customization#lifecycle-listeners): where listeners fit among the other `gacela.php`
  hooks.
- [Bootstrap](/docs/bootstrap): the full `GacelaConfig` surface.
