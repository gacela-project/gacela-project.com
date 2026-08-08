---
title: Testing
description: Isolate the container between tests with the ContainerFixture trait for PHPUnit.
---

# Testing

Gacela ships a `ContainerFixture` trait for PHPUnit that handles container isolation between tests.

## ContainerFixture

The trait provides helpers to reset, snapshot and restore the container state so tests don't bleed into each other.

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
