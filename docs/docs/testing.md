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
| `captureContainerState()` | Snapshot the current container (bindings, services, caches) |
| `restoreContainerState()` | Roll back to the last snapshot taken by `captureContainerState()` |
| `containerTempDir()` | Return a per-test temporary directory, auto-cleaned after the test |

### Snapshot and restore

Use `captureContainerState()` / `restoreContainerState()` when a test mutates the container but subsequent assertions need the original state:

```php
public function testServiceOverride(): void
{
    $this->captureContainerState();

    Gacela::bootstrap(__DIR__, function (GacelaConfig $config) {
        $config->addBinding(LoggerInterface::class, NullLogger::class);
    });

    // ... assertions with NullLogger ...

    $this->restoreContainerState();

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
    // directory cleaned up automatically after test
}
```

## Tips

- Prefer `resetContainer()` in a `#[Before]` method over `setUp()`. It makes the intent explicit and works alongside other `setUp` logic.
- For integration tests that need the full bootstrap, call `Gacela::bootstrap()` inside the test and `resetContainer()` in teardown.
- `ContainerFixture` replaces the older pattern of calling `$config->resetInMemoryCache()` inside `gacela.php` for tests.
