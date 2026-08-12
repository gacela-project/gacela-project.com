---
title: Caching
description: Choose between Gacela’s framework cache, cacheable Facade methods, and value-cache primitives.
---

# Caching

Gacela caches at three different levels. Each solves a different problem. They compose, they don't replace one another.

| Layer                                                       | What it caches                                                 | Where              | Typical use                                                            |
|-------------------------------------------------------------|----------------------------------------------------------------|--------------------|------------------------------------------------------------------------|
| [Framework resolution](#layer-1-framework-resolution-cache) | Resolved facades, factories, configs, merged config            | Memory or disk     | Always on, pick the mode per environment                               |
| [Cacheable methods](#layer-2-cacheable-facade-methods)      | Return values of facade methods                                | Memory (pluggable) | Expensive, deterministic reads                                         |
| [Value primitives](#layer-3-value-primitives)               | Arbitrary key → value data, optionally with a dependency graph | Disk               | Your code needs its own cache (compilers, pipelines, parsed artifacts) |

## Layer 1: Framework resolution cache

Gacela resolves classes by convention: `Facade` → `Factory` → `Provider` → `Config`. Those lookups walk namespaces and
files, and the merged configuration is reassembled from every `config/*.php` file. All of it is memoised once per
process, and can additionally be persisted to disk between runs.

- **In-memory** (default): `InMemoryCache` holds resolved class names for the life of the process.
- **On-disk**: `ClassNamePhpCache`, `CustomServicesPhpCache`, and `MergedConfigCache` persist the same data in
  project-scoped PHP files. Filenames include an application-root hash, preventing applications that share a cache
  directory from serving each other's data; merged config files are also scoped by `APP_ENV`.

Enable and tune the file cache at bootstrap with `enableFileCache()`.
[Bootstrap > File cache](/docs/bootstrap#file-cache) covers the API, how the cache directory is resolved, and the
`GACELA_CACHE_DIR` environment variable.

With the file cache enabled, the merged configuration **auto-warms on the first miss**: the first bootstrap persists the
app- and environment-scoped merged-config file, so later bootstraps skip globbing and parsing config files—no manual
`cache:warm` is required for that layer.

In a **read-only environment** (e.g. a read-only project root inside a build sandbox) the file caches degrade gracefully
to in-memory instead of failing the bootstrap: writes become no-ops, no raw PHP warnings are emitted, and any pre-warmed
cache files already on disk stay readable. Warm-at-build / run-read-only deployments keep their cache hits.

Typical wiring:

- **Development**: file cache **off**. Edits take effect immediately.
- **Production**: file cache **on**, pre-populated with `vendor/bin/gacela cache:warm`, directory baked into the image.
  Re-deploy (or `cache:clear`) to refresh.
- **Tests**: call `resetInMemoryCache()` between suites so resolution state doesn't bleed.

See also: [Opcache preload](/docs/opcache-preload) for getting PHP itself to cache Gacela's own source files.

## Layer 2: Cacheable facade methods

Cache the *result* of a facade method with the `#[Cacheable]` attribute and `$this->cached()`. `CacheableTrait` is built
into `AbstractFacade`, no extra `use` needed. Storage is `InMemoryCacheStorage` by default, which means entries die with
the request on PHP-FPM; for cross-request caching swap in a shared backend (APCu, Redis, PSR-16) via
`CacheableConfig::setStorage()`.

Full reference, including keys, invalidation, TTL overrides, and the storage contract:
[Cacheable methods](/docs/cacheable-methods).

## Layer 3: Value primitives

When *your code* needs a cache (compiled artifacts, parsed data, or a build pipeline), use
`Gacela\Framework\Cache\FileCache`: one atomically written file per key, per-entry TTLs, batched writes, and stats. When
invalidating one entry should cascade to every entry derived from it, wrap it in `ScopedCache`, its dependency-aware
decorator.

Full reference: [FileCache and ScopedCache](/docs/file-cache).

## Picking a layer

- Make Gacela's own resolution faster → Layer 1, `enableFileCache()` + `cache:warm`.
- Memoise a specific facade method → Layer 2, [`#[Cacheable]`](/docs/cacheable-methods).
- Cache arbitrary application data → Layer 3, [`FileCache`](/docs/file-cache).
- Same, but invalidation must cascade → Layer 3,
  [`ScopedCache`](/docs/file-cache#scopedcache-dependency-aware-decorator).
