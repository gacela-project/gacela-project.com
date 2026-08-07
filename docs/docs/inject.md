# Inject attribute

Use `#[Inject]` when ordinary type-based autowiring cannot express the dependency: to force a concrete implementation, mark container-owned wiring for tooling, or inject a property/setter on a class whose constructor you cannot change.

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

- A bare `#[Inject]` resolves the parameter by its type (same as autowiring, but explicit).
- `#[Inject(RedisCache::class)]` forces a specific implementation regardless of the global binding.

`Gacela\Framework\Attribute\Inject` is the preferred 2.0 import. It extends the container attribute, so both imports can coexist while an application migrates.

## Property and setter injection

Gacela 2.0 also supports properties and one-argument setter methods. This is useful for vendor or framework classes whose constructor is fixed:

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

Private, protected, and inherited properties work. Constructor injection remains preferable for application-owned classes because dependencies stay visible in the signature.

Readonly, untyped, scalar-typed, and static properties cannot be injected. A promoted property is handled through its constructor parameter and is not injected twice. Property/setter cycles still throw `CircularDependencyException`.

## Resolution order

For a parameter `$p` on `Consumer`, the container resolves in this order:

1. A runtime override passed to `make()` under `$p`'s name.
2. A named contextual binding: `when(Consumer::class)->needs('$p')->give(...)`.
3. The explicit target in `#[Inject(Target::class)]`.
4. The parameter's default value.
5. A type-based contextual binding for `Consumer`.
6. A global `addBinding()` for the type.
7. Recursive autowiring when the type is an instantiable class.
8. `DependencyNotFoundException` when nothing can resolve it.

::: warning Defaults win over type bindings
`__construct(?Engine $engine = null)` resolves to `null` even when `Engine` has a global binding, because defaults are checked first. Remove the default or use `#[Inject]` when the container should fill the parameter. Nullability alone does not produce `null`: `?Engine $engine` without a default still throws if unresolved.
:::

## Inspecting with `debug:dependencies`

The `debug:dependencies` command tags `#[Inject]` parameters so you can verify wiring at a glance:

```bash
vendor/bin/gacela debug:dependencies App\\Catalog\\CatalogService --tree
```

```
✓ $logger  LoggerInterface   (inject)
✓ $cache   CacheInterface    (inject -> App\Cache\RedisCache)
```

The one-level view describes constructor parameters. `--tree` follows transitive dependencies using the container's applied bindings and contextual bindings. Each node is marked `binding`, `instance`, `autowired`, or `unresolvable`; cycles are marked and cut. The command reports broken graphs instead of throwing so it remains useful as a diagnostic.

## When to use `#[Inject]` vs bindings

| Scenario | Approach |
|----------|----------|
| Global default for an interface | `addBinding()` in `gacela.php` |
| One class needs a different implementation | `#[Inject(Concrete::class)]` on the parameter |
| Multiple classes need the same override | `when()->needs()->give()` contextual binding |
| Constructor is controlled by a vendor/framework | `#[Inject]` on a property or setter |

`#[Inject]` is opt-in. Classes without it continue to resolve through ordinary autowiring and bindings.

## Symfony integration

In Symfony apps, the `gacela-project/symfony-bridge` package routes `#[Inject]` parameters through Gacela's container via a compiler pass. See [Symfony bridge](/docs/other-frameworks#symfony-bridge) for setup.
