---
title: Caching
description: Choose between Gacela’s framework cache, cacheable Facade methods, and value-cache primitives.
---

# Caching

Gacela caches at three different levels. Each solves a different problem. They compose, they don't replace one another.

| Layer | What it caches | Where | Typical use |
|---|---|---|---|
| [Framework resolution](#layer-1-framework-resolution-cache) | Resolved facades, factories, configs, merged config | Memory or disk | Always on, pick the mode per environment |
| [Cacheable methods](#layer-2-cacheable-facade-methods) | Return values of facade methods | Memory (pluggable) | Expensive, deterministic reads |
| [Value primitives](#layer-3-value-primitives) | Arbitrary key → value data, optionally with a dependency graph | Disk | Your code needs its own cache (compilers, pipelines, parsed artifacts) |

## Layer 1: Framework resolution cache

Gacela resolves classes by convention: `Facade` → `Factory` → `Provider` → `Config`. Those lookups walk namespaces and files, and the merged configuration is reassembled from every `config/*.php` file. All of it is memoised once per process, and can additionally be persisted to disk between runs.

- **In-memory** (default): `InMemoryCache` holds resolved class names for the life of the process.
- **On-disk**: `ClassNamePhpCache`, `CustomServicesPhpCache`, and `MergedConfigCache` persist the same data in project-scoped PHP files. In 2.0 every filename includes a hash of the application root, preventing two applications sharing the default cache directory from serving each other's data; merged config files are also scoped by `APP_ENV`.

Module containers are scopes of one application container in 2.0. They also share an in-process constructor-plan cache, so classes used by several modules are reflected once while bindings, tags, instances, and Provider registrations remain scoped. Persisting constructor plans was measured as a net loss and is not enabled automatically.

Configure at bootstrap:

```php
use Gacela\Framework\Bootstrap\GacelaConfig;
use Gacela\Framework\Gacela;

Gacela::bootstrap(__DIR__, static function (GacelaConfig $config): void {
    $config->enableFileCache();                  // use the default cache dir
    // $config->enableFileCache('var/cache');    // relative to the app root
    // $config->setFileCache(false);             // explicitly off
    // $config->resetInMemoryCache();            // wipe static caches (tests)
});
```

A configured path is resolved relative to the application root—even a leading slash does not escape it. Use the `GACELA_CACHE_DIR` environment variable for a genuinely absolute directory outside the project; it takes precedence and is used verbatim.

With the file cache enabled, the merged configuration **auto-warms on the first miss**: the first bootstrap persists the app- and environment-scoped merged-config file, so later bootstraps skip globbing and parsing config files—no manual `cache:warm` is required for that layer.

In a **read-only environment** (e.g. a read-only project root inside a build sandbox) the file caches degrade gracefully to in-memory instead of failing the bootstrap: writes become no-ops, no raw PHP warnings are emitted, and any pre-warmed cache files already on disk stay readable. Warm-at-build / run-read-only deployments keep their cache hits.

Typical wiring:

- **Development**: file cache **off**. Edits take effect immediately.
- **Production**: file cache **on**, pre-populated with `vendor/bin/gacela cache:warm`, directory baked into the image. Re-deploy (or `cache:clear`) to refresh.
- **Tests**: call `resetInMemoryCache()` between suites so resolution state doesn't bleed.

See also: [Opcache preload](/docs/opcache-preload) for getting PHP itself to cache Gacela's own source files.

## Layer 2: Cacheable facade methods

Cache the *result* of a facade method with the `#[Cacheable]` attribute. `CacheableTrait` is built into `AbstractFacade`, no extra `use` needed. Full reference: [Cacheable methods](/docs/cacheable-methods).

```php
use Gacela\Framework\AbstractFacade;
use Gacela\Framework\Attribute\Cacheable;

final class CatalogFacade extends AbstractFacade
{
    #[Cacheable(ttl: 3600)]
    public function getPopularProducts(): array
    {
        return $this->cached(fn (): array =>
            $this->getFactory()->createRepository()->fetchPopular(),
        );
    }
}
```

Storage is `InMemoryCacheStorage` by default, which means entries die with the request on PHP-FPM. For cross-request caching swap in a shared backend (APCu, Redis, PSR-16) via `CacheableConfig::setStorage()`.

```php
CatalogFacade::clearMethodCacheFor('getPopularProducts'); // one method, any args
CatalogFacade::clearMethodCache();                        // the whole shared store
```

`clearMethodCache()` is not facade-scoped: it calls `clear()` on the shared storage backend. `Gacela::resetCache()` only clears Gacela's default in-memory method cache and deliberately leaves a custom APCu/Redis backend registered through `CacheableConfig::setStorage()` alone.

## Layer 3: Value primitives

When *your code* needs a cache (compiled artifacts, parsed data, or a build pipeline), use `Gacela\Framework\Cache\FileCache`:

```php
use Gacela\Framework\Cache\FileCache;

$cache = new FileCache('/var/cache/myapp');

$cache->put('user:42', $user, ttl: 600);
$cache->get('user:42');     // $user, or null after TTL expiry
$cache->forget('user:42');
$cache->clear();
```

- One `.php` file per key (SHA1-hashed), written atomically via staged `.tmp` + `rename`.
- `writeContentsAtomically(string $file, string $content): bool` — atomically writes already-rendered content to a path, with the same staged-`.tmp` + `rename` guarantees as `put()`. The higher-level `writeAtomically()` wraps it.
- TTL per entry; `ttl: 0` means forever.
- `beginBatch()` / `commitBatch()` defer writes behind a single index-locked flush. Useful for warming many entries at once.
- `stats()` returns entry count, total bytes, and oldest/newest timestamps.
- Safe against torn reads: concurrent readers see either the previous file or the new one, never a half-written one.

### ScopedCache: dependency-aware decorator

When invalidating one entry should cascade to every downstream entry that derived from it, wrap `FileCache` in `ScopedCache`:

```php
use Gacela\Framework\Cache\FileCache;
use Gacela\Framework\Cache\ScopedCache;

$cache = new ScopedCache(new FileCache('/var/cache/myapp'));

$cache->put('ns:core', $envCore);
$cache->put('file:a.php', $compiledA);
$cache->put('fragment:a#1', $fragment);

$cache->dependsOn('file:a.php', 'ns:core');
$cache->dependsOn('fragment:a#1', 'file:a.php');

$cache->invalidate('ns:core');          // cascades: file:a.php and fragment:a#1 also go
$cache->invalidateLeaf('file:a.php');   // only this key; dependents stay valid
```

- `get` / `put` / `has` delegate straight to the underlying `FileCache`. Zero overhead on the hot path.
- The dependency graph is persisted alongside the values (`.gacela-scoped-cache-graph.php`) and survives process restarts.
- Cycles are rejected eagerly at `dependsOn()`: self, two-node, and transitive.
- Single-writer concurrency: multiple processes racing on `dependsOn()` may lose edges added between load and persist.

## Picking a layer

- Make Gacela's own resolution faster → Layer 1, `enableFileCache()` + `cache:warm`.
- Memoise a specific facade method → Layer 2, `#[Cacheable]`.
- Cache arbitrary application data → Layer 3, `FileCache`.
- Same, but invalidation must cascade → Layer 3, `ScopedCache`.
