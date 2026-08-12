---
title: Testing
description: Test Gacela applications with isolated container state, temporary directories, and lifecycle-event assertions.
---

# Testing

Gacela ships two PHPUnit helpers for tests: `GacelaTestCase`, the recommended base class for tests that bootstrap a
Gacela app, and `ContainerFixture`, the lower-level trait it builds on. PHPUnit is a suggested development dependency,
not a Gacela runtime dependency, so require it in your application when using these helpers.

## GacelaTestCase

`GacelaTestCase` is the recommended base class for tests that bootstrap a Gacela app. It extends PHPUnit's `TestCase`,
uses the [`ContainerFixture`](#containerfixture) trait internally, and takes care of teardown for you. Reach for
`ContainerFixture` directly only when you can't extend this class.

### Setup

```php
use Gacela\Framework\Testing\GacelaTestCase;

final class CheckoutTest extends GacelaTestCase
{
    public function test_facade_resolves_payment_gateway(): void
    {
        $this->bootstrapGacelaWithConfig(__DIR__, ['retries' => 3]);

        (new CheckoutFacade())->pay();

        $this->assertServiceResolved(PaymentGateway::class);
    }
}
```

No `#[Before]` or `resetContainer()` call needed. `bootstrapGacela()` / `bootstrapGacelaWithConfig()` reset the
in-memory cache before bootstrapping, and `tearDown()` resets the container and clears recorded events automatically, so
state never leaks between tests.

### Available methods

| Method                                                                  | Description                                                                                                                                                                    |
|-------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `bootstrapGacela(string $appRootDir, ?Closure $configFn = null)`        | Bootstrap Gacela from a clean in-memory state and start recording lifecycle events dispatched from this point onward. Optional closure receives `GacelaConfig` for extra setup |
| `bootstrapGacelaWithConfig(string $appRootDir, array $configKeyValues)` | Bootstrap with the given config key-values in one call (calls `addAppConfigKeyValues()` internally). The most common override in tests                                         |
| `recordedGacelaEvents()`                                                | All `GacelaEventInterface` events recorded since the last bootstrap, in dispatch order                                                                                         |
| `recordedGacelaEventsOf(string $eventClass)`                            | The recorded events of one type, in dispatch order                                                                                                                             |
| `assertServiceResolved(string $serviceId)`                              | Assert the container instantiated the given service id since the last bootstrap                                                                                                |
| `assertBindingRegistered(string $id)`                                   | Assert a binding, alias or contextual binding was registered under the given id since the last bootstrap                                                                       |

::: tip Event-backed assertions
`assertServiceResolved()` and `assertBindingRegistered()` read from Gacela's own lifecycle events
(`ServiceResolvedEvent` and `BindingRegisteredEvent`), recorded automatically from `bootstrapGacela()` onward. See
the [events catalog](/docs/events) for the full list, and fall back to `recordedGacelaEvents()` /
`recordedGacelaEventsOf()` for anything the two helpers don't cover.
:::

### Asserting on recorded events

Use `recordedGacelaEventsOf()` for anything more specific than "was a service resolved" — counting events, or reading a
payload off one:

```php
use Gacela\Framework\Event\Config\ConfigKeyReadEvent;
use Gacela\Framework\Event\Container\ServiceResolvedEvent;
use Gacela\Framework\Testing\GacelaTestCase;

final class CheckoutEventsTest extends GacelaTestCase
{
    public function test_payment_gateway_is_resolved_once(): void
    {
        $this->bootstrapGacela(__DIR__);

        (new CheckoutFacade())->pay();
        (new CheckoutFacade())->pay();

        self::assertCount(1, $this->recordedGacelaEventsOf(ServiceResolvedEvent::class));
    }

    public function test_retries_key_is_read_from_config(): void
    {
        $this->bootstrapGacelaWithConfig(__DIR__, ['retries' => 3]);

        (new CheckoutFacade())->pay();

        $events = $this->recordedGacelaEventsOf(ConfigKeyReadEvent::class);

        self::assertSame('retries', $events[0]->key());
    }
}
```

### Asserting on bindings

```php
use Gacela\Framework\Testing\GacelaTestCase;

final class LoggingBindingTest extends GacelaTestCase
{
    public function test_logger_binding_is_registered(): void
    {
        $this->bootstrapGacela(__DIR__, function (GacelaConfig $config) {
            $config->addBinding(LoggerInterface::class, NullLogger::class);
        });

        $this->assertBindingRegistered(LoggerInterface::class);
    }
}
```

## Replacing another module [since 2.2]

Testing module A in isolation means replacing module B. A container binding only works when B's Facade arrives through
a Provider, and a consumer that writes `new BlogFacade()` leaves nothing to bind. So the seam is the **Factory** every
Facade resolves:

```php
$this->swapModuleFactory(BlogFacade::class, new class() extends BlogFactory {
    public function createPostReader(): PostReader
    {
        return new InMemoryPostReader(['a post']);
    }
});

(new CheckoutFacade())->summary();  // reaches the double, not the real Blog
```

- `swapModuleFactory()`, `swapModuleConfig()` and `swapModuleProvider()` all take the **Facade** class: that is the
  name a consumer already knows, and the one the resolver derives a module's pillars from.
- Any object of the right pillar type works: an anonymous subclass, or a PHPUnit stub
  (`$this->createStub(BlogFactory::class)`).
- The swap survives repeated resolutions, and applies to a module that was already resolved earlier in the same test.
- Swapping the same module twice keeps the last double.
- Every swap is dropped by `resetContainer()`, which `GacelaTestCase` already runs in `tearDown()`, so the next test
  sees the real module again whatever order the suite runs in.

Naming a class that is not a Facade, the Factory itself or a typo, throws a `ModuleDoubleException` rather than
registering a double nothing would ever read.

This replaces reaching into `AnonymousGlobal::overrideExistingResolvedClass()`, which needed the resolver's key format
and left the Facade's memoised Factory in place.

## ContainerFixture

The trait provides helpers to reset, snapshot and restore the container state so tests don't bleed into each other. The
[module swap helpers](#replacing-another-module) above live here too, so they are available under either entry point.

### Setup

```php
use Gacela\Framework\Testing\ContainerFixture;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\TestCase;

final class MyTest extends TestCase
{
    use ContainerFixture;

    #[Before]
    protected function setUpContainer(): void
    {
        $this->resetContainer();
    }
}
```

### Available methods

| Method                                               | Description                                                                                                                                          |
|------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `resetContainer()`                                   | Wipe the container and all static caches. Clean slate for the next test                                                                              |
| `captureContainerState()`                            | Return a `ContainerSnapshot` of config values, application root, cache directory and the in-memory class-name cache (not resolved service instances) |
| `restoreContainerState(ContainerSnapshot $snapshot)` | Restore a snapshot previously returned by `captureContainerState()`                                                                                  |
| `containerTempDir()`                                 | Return a per-test temporary directory, removed at process shutdown (or synchronously via `cleanupContainerTempDirs()`)                               |

### Snapshot and restore

Use `captureContainerState()` / `restoreContainerState()` when a test mutates the container but subsequent assertions
need the original state:

```php
public function testServiceOverride(): void
{
    $snapshot = $this->captureContainerState();

    Gacela::bootstrap(__DIR__, function (GacelaConfig $config) {
        $config->addBinding(LoggerInterface::class, NullLogger::class);
    });

    // ... assertions with NullLogger ...

    $this->restoreContainerState($snapshot);

    // container is back to its pre-override state
}
```

`restoreContainerState()` puts back **every** field the snapshot captured: config values, application root and cache
directory as well as the class-name cache. Until 2.1 it restored only the class-name cache, which left
`Config::getInstance()` throwing after a restore. A snapshot taken before `Gacela::bootstrap()` restores nothing rather
than inventing a config instance the test never had, and restoring constructs no service object.

### Temporary directories

`containerTempDir()` returns a unique temporary directory for the current test. Use it for file-cache tests, artifact
storage, or anything that writes to disk:

```php
public function testFileCacheWrite(): void
{
    $cache = new FileCache($this->containerTempDir());
    $cache->put('key', 'value', ttl: 60);

    self::assertSame('value', $cache->get('key'));
    // temp dirs are removed at process shutdown; call cleanupContainerTempDirs() for synchronous per-test cleanup
}
```

## Test hygiene

- Prefer `resetContainer()` in a `#[Before]` method over `setUp()`. It makes the intent explicit and works alongside
  other `setUp` logic.
- For integration tests that need the full bootstrap, call `Gacela::bootstrap()` inside the test and `resetContainer()`
  in teardown.
- `ContainerFixture` replaces the older pattern of calling `$config->resetInMemoryCache()` inside `gacela.php` for
  tests.
