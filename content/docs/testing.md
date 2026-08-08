---
title: Testing
description: Isolate the container between tests with the ContainerFixture trait for PHPUnit.
---

# Testing

Gacela ships two PHPUnit helpers: a `GacelaTestCase` base class for tests that bootstrap an
application, and the `ContainerFixture` trait it is built on, for tests that already extend
something else.

## GacelaTestCase

Extend `GacelaTestCase` when a test needs a bootstrapped Gacela application. It removes the reset
boilerplate: every bootstrap starts from clean in-memory state, and `tearDown()` drops the Gacela
singletons so nothing leaks into the next test.

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

### Bootstrapping and assertions

| Method | Description |
|--------|-------------|
| `bootstrapGacela(string $appRootDir, ?Closure $configFn = null)` | Bootstrap from a root directory, optionally configuring it with a `GacelaConfig` closure |
| `bootstrapGacelaWithConfig(string $appRootDir, array $configKeyValues)` | Bootstrap with config key-values, for the common case of a test that only needs a few settings |
| `recordedGacelaEvents()` | Every framework event recorded since the bootstrap |
| `recordedGacelaEventsOf(string $eventClass)` | Only the recorded events of one class |
| `assertServiceResolved(string $serviceId)` | Assert the container resolved that service |
| `assertBindingRegistered(string $id)` | Assert a binding was registered for that id |

Every bootstrap records the framework [lifecycle events](/docs/customization#supported-events),
which is what the two assertions read. That makes them assertions about what the container
actually did, rather than about what it holds now.

`GacelaTestCase` uses `ContainerFixture` internally, so everything below is available on it too.

## ContainerFixture

The trait provides helpers to reset, snapshot and restore the container state so tests don't bleed into each other. Use it directly when a test already extends another base class and cannot extend `GacelaTestCase`.

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

### Isolation helpers

| Method | Description |
|--------|-------------|
| `resetContainer()` | Wipe the container and all static caches. Clean slate for the next test |
| `captureContainerState()` | Return a `ContainerSnapshot` of config values and the in-memory class-name cache (not resolved service instances) |
| `restoreContainerState(ContainerSnapshot $snapshot)` | Restore a snapshot previously returned by `captureContainerState()` |
| `containerTempDir()` | Return a per-test temporary directory, removed at process shutdown (or synchronously via `cleanupContainerTempDirs()`) |

### Snapshot and restore

Use `captureContainerState()` / `restoreContainerState()` when a test mutates the container but subsequent assertions need the original state:

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

### Temporary directories

`containerTempDir()` returns a unique temporary directory for the current test. Use it for file-cache tests, artifact storage, or anything that writes to disk:

```php
public function testFileCacheWrite(): void
{
    $cache = new FileCache($this->containerTempDir());
    $cache->put('key', 'value', ttl: 60);

    self::assertSame('value', $cache->get('key'));
    // temp dirs are removed at process shutdown; call cleanupContainerTempDirs() for synchronous per-test cleanup
}
```

## Tips

- Prefer `resetContainer()` in a `#[Before]` method over `setUp()`. It makes the intent explicit and works alongside other `setUp` logic.
- For integration tests that need the full bootstrap, call `Gacela::bootstrap()` inside the test and `resetContainer()` in teardown.
- `ContainerFixture` replaces the older pattern of calling `$config->resetInMemoryCache()` inside `gacela.php` for tests.
