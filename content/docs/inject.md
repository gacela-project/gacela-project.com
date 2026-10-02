---
title: Inject attribute
description: Inject services into constructors, properties, or setters when type-based autowiring is not enough.
---

# Inject attribute

Use `#[Inject]` when type-based autowiring cannot express the dependency. It forces a concrete implementation, marks
container-owned wiring for tooling, or injects a property or setter on a class whose constructor you cannot change.

## Quick start

```php
use Gacela\Framework\Attribute\Inject;

final class CatalogService
{
    public function __construct(
        #[Inject] private readonly LoggerInterface $logger,
        #[Inject(RedisCache::class)] private readonly CacheInterface $cache,
    ) {}
}
```

- A bare `#[Inject]` resolves the parameter by its type, like autowiring but explicit.
- `#[Inject(RedisCache::class)]` forces a specific implementation, whatever the global binding says.

Import `Gacela\Framework\Attribute\Inject` in 2.0. It extends the container attribute, so both imports work side by
side while an application migrates.

## Property and setter injection

Gacela 2.0 also injects properties and one-argument setter methods. Use this for a vendor or framework class whose
constructor is fixed:

```php
final class CatalogController extends VendorController
{
    #[Inject]
    private LoggerInterface $logger;

    #[Inject(RedisCache::class)]
    public function setCache(CacheInterface $cache): void
    {
        $this->cache = $cache;
    }
}
```

Private, protected, and inherited properties work. For classes your application owns, prefer constructor injection:
the dependencies stay visible in the signature.

Readonly, untyped, scalar-typed, and static properties cannot be injected. A promoted property goes through its
constructor parameter and is not injected twice. Property and setter cycles still throw `CircularDependencyException`.

## Resolution order

`#[Inject(Target::class)]` is third in the container's resolution order: after `make()` overrides and named contextual
bindings, before defaults, type-based contextual bindings, and global bindings.
[Bindings > Resolution order](/docs/bindings#resolution-order) has the full list, including the "defaults win over type
bindings" pitfall.

## Inspecting with `debug:dependencies`

The `debug:dependencies` command tags `#[Inject]` parameters, so you can check the wiring at a glance:

```bash
vendor/bin/gacela debug:dependencies App\\Catalog\\CatalogService --tree
```

```
✓ $logger  LoggerInterface   (inject)
✓ $cache   CacheInterface    (inject -> App\Cache\RedisCache)
```

The one-level view lists constructor parameters. `--tree` follows transitive dependencies through the container's
applied bindings and contextual bindings. Each node is marked `binding`, `instance`, `autowired`, or `unresolvable`.
Cycles are marked and cut. The command reports a broken graph instead of throwing, so it stays useful for diagnosis.

## When to use `#[Inject]` vs bindings

| Scenario                                        | Approach                                      |
|-------------------------------------------------|-----------------------------------------------|
| Global default for an interface                 | `addBinding()` in `gacela.php`                |
| One class needs a different implementation      | `#[Inject(Concrete::class)]` on the parameter |
| Multiple classes need the same override         | `when()->needs()->give()` contextual binding  |
| Constructor is controlled by a vendor/framework | `#[Inject]` on a property or setter           |

`#[Inject]` is opt-in. Classes without it still resolve through autowiring and bindings.

## Symfony integration

In a Symfony app, the `gacela-project/symfony-bridge` package routes `#[Inject]` parameters through Gacela's container
with a compiler pass. See [the Symfony bundle](/docs/framework-integration#the-inject-compiler-pass) for setup.
