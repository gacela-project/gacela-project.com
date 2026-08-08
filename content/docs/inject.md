---
title: Inject attribute
description: "Opt-in constructor injection with the Inject attribute, including per-project implementation overrides."
---

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
2. **Default value**: if the parameter declares a default, it is used
3. **Contextual binding**: a `when()->needs()->give()` rule targeting this consumer
4. **Global binding**: `addBinding(CacheInterface::class, RedisCache::class)`
5. **Autowire**: the container tries to instantiate the type hint
6. **Exception**: `DependencyNotFoundException` when no concrete can be resolved (or `DependencyInvalidArgumentException` for a missing type hint or an unresolvable scalar)

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

In Symfony apps, the `gacela-project/symfony-bridge` package routes `#[Inject]` parameters through Gacela's container via a compiler pass. See [Symfony bridge](/docs/other-frameworks#symfony-bridge) for setup.
