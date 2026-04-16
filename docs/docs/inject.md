# Inject attribute

Opt-in constructor injection with the `#[Inject]` attribute. Declare what a class needs directly on its constructor parameters. Gacela's container resolves them automatically.

## Quick start

```php
use Gacela\Container\Attribute\Inject;

final class CatalogService
{
    public function __construct(
        #[Inject] private readonly LoggerInterface $logger,
        #[Inject(RedisCache::class)] private readonly CacheInterface $cache,
    ) {}
}
```

- A bare `#[Inject]` resolves the parameter by its type (same as autowiring, but explicit).
- `#[Inject(RedisCache::class)]` forces a specific implementation regardless of the global binding.

## Resolution order

When a parameter carries `#[Inject]`, the container resolves it following this chain:

1. **Explicit override**: the class passed to the attribute (`#[Inject(RedisCache::class)]`)
2. **Contextual binding**: a `when()->needs()->give()` rule targeting this consumer
3. **Global binding**: `addBinding(CacheInterface::class, RedisCache::class)`
4. **Autowire**: the container tries to instantiate the type hint
5. **Default value**: if the parameter has a default, use it
6. **Exception**: `UnresolvableParameterException` with a clear message

## Inspecting with `debug:dependencies`

The `debug:dependencies` command tags `#[Inject]` parameters so you can verify wiring at a glance:

```bash
vendor/bin/gacela debug:dependencies App\\Catalog\\CatalogService
```

```
✓ $logger  LoggerInterface   (inject)
✓ $cache   CacheInterface    (inject -> App\Cache\RedisCache)
```

## When to use `#[Inject]` vs bindings

| Scenario | Approach |
|----------|----------|
| Global default for an interface | `addBinding()` in `gacela.php` |
| One class needs a different implementation | `#[Inject(Concrete::class)]` on the parameter |
| Multiple classes need the same override | `when()->needs()->give()` contextual binding |

`#[Inject]` is opt-in. Classes without it continue to resolve via the usual autowiring and binding chain.

## Symfony integration

In Symfony apps, the `gacela/symfony-bridge` package routes `#[Inject]` parameters through Gacela's container via a compiler pass. See [Symfony bridge](/docs/other-frameworks#symfony-bridge) for setup.
