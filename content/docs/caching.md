---
title: Caching
description: Pick between Gacela’s framework cache, cacheable Facade methods, and value-cache primitives.
---

# Caching

Gacela caches at three levels. Each solves a different problem. They work together; none replaces another.

| Layer                                                       | What it caches                                                 | Where              | Typical use                                                            |
|-------------------------------------------------------------|----------------------------------------------------------------|--------------------|------------------------------------------------------------------------|
| [Framework resolution](#layer-1-framework-resolution-cache) | Resolved facades, factories, configs, merged config            | Memory or disk     | Always on, pick the mode per environment                               |
| [Cacheable methods](#layer-2-cacheable-facade-methods)      | Return values of facade methods                                | Memory (pluggable) | Expensive, deterministic reads                                         |
| [Value primitives](#layer-3-value-primitives)               | Arbitrary key → value data, optionally with a dependency graph | Disk               | Your code needs its own cache (compilers, pipelines, parsed artifacts) |

## Layer 1: Framework resolution cache

Gacela resolves classes by convention: `Facade` → `Factory` → `Provider` → `Config`. Those lookups walk namespaces and
files, and the merged configuration is rebuilt from every `config/*.php` file. Gacela memoises all of it once per
process, and can also persist it to disk between runs.

- **In-memory** (default): `InMemoryCache` holds resolved class names for the life of the process.
- **On-disk**: `ClassNamePhpCache`, `CustomServicesPhpCache`, and `MergedConfigCache` persist the same data in
  project-scoped PHP files. Filenames include a hash of the application root, so applications that share a cache
  directory never serve each other's data. Merged config files are also scoped by `APP_ENV`.

Turn on and tune the file cache at bootstrap with `enableFileCache()`.
[Bootstrap > File cache](/docs/bootstrap#file-cache) covers the API, how Gacela picks the cache directory, and the
`GACELA_CACHE_DIR` environment variable.

With the file cache on, the merged configuration **auto-warms on the first miss**. The first bootstrap persists the
app- and environment-scoped merged-config file, and later bootstraps skip globbing and parsing config files. That layer
needs no manual `cache:warm`.

Gacela trusts the two kinds of file differently. A merged-config file written by `cache:warm` is a deploy artifact:
Gacela serves it without looking at the config files until the next `cache:warm` or `cache:clear`. A file written on a
miss also records the config files it read. An edited, added or removed file, or a changed `addAppConfig()` declaration,
rebuilds it on the next bootstrap. [since 2.5]

Two settings change that. [since 2.6]

```php
$config->addConfigCacheWatch('src/Config/*.php');
$config->enableVerifiedConfigCacheWarm();
```

`addConfigCacheWatch(...$paths)` adds files whose change rebuilds the cache even when no config file changed. Use it
for values your own code computes, such as a config class whose output is stored. Each path is a file or a glob,
relative to the app root or absolute anywhere (a global Composer install, or `phar://` inside a PHAR). A glob also
counts files added or removed. A directory counts only files added or removed directly in it, not edits to them, so
name the files.

`enableVerifiedConfigCacheWarm()` makes `cache:warm` write the checked kind instead of the trusted one. Use it for a
tool whose users warm the cache while they still edit config. It costs a `stat` per source on each bootstrap.

In a **read-only environment**, such as a read-only project root inside a build sandbox, the file caches fall back to
in-memory instead of failing the bootstrap. Writes become no-ops, PHP emits no raw warnings, and pre-warmed cache files
already on disk stay readable. A deployment that warms at build time and runs read-only keeps its cache hits.

Typical wiring:

- **Development**: file cache **off**. Edits take effect immediately.
- **Production**: file cache **on**, pre-populated with `vendor/bin/gacela cache:warm`, directory baked into the image.
  Re-deploy (or `cache:clear`) to refresh.
- **Tests**: call `resetInMemoryCache()` between suites so resolution state does not leak.

To make PHP itself cache Gacela's source files, see [Opcache preload](/docs/opcache-preload).

## Layer 2: Cacheable facade methods

Cache the *result* of a facade method with the `#[Cacheable]` attribute and `$this->cached()`. `AbstractFacade` already
includes `CacheableTrait`, so you need no extra `use`. The default storage is `InMemoryCacheStorage`, so on PHP-FPM
entries die with the request. To cache across requests, swap in a shared backend (APCu, Redis, PSR-16) with
`CacheableConfig::setStorage()`.

[Cacheable methods](/docs/cacheable-methods) is the full reference: keys, invalidation, TTL overrides, and the storage
contract.

## Layer 3: Value primitives

When *your code* needs a cache (compiled artifacts, parsed data, a build pipeline), use
`Gacela\Framework\Cache\FileCache`. It writes one file per key atomically, with per-entry TTLs, batched writes, and
stats. When invalidating one entry must cascade to every entry derived from it, wrap it in `ScopedCache`, its
dependency-aware decorator.

Full reference: [FileCache and ScopedCache](/docs/file-cache).

## Picking a layer

- Speed up Gacela's own resolution: Layer 1, `enableFileCache()` + `cache:warm`.
- Memoise one facade method: Layer 2, [`#[Cacheable]`](/docs/cacheable-methods).
- Cache any application data: Layer 3, [`FileCache`](/docs/file-cache).
- The same, with cascading invalidation: Layer 3,
  [`ScopedCache`](/docs/file-cache#scopedcache-dependency-aware-decorator).
