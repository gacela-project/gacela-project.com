---
title: FileCache and ScopedCache
description: Cache your own data on disk with atomic writes, per-entry TTLs, batching, and dependency-aware invalidation.
---

# FileCache and ScopedCache

When *your code* needs a cache (compiled artifacts, parsed data, a build pipeline), use
`Gacela\Framework\Cache\FileCache`. It is the value layer of [Gacela's caching](/docs/caching). The framework puts
nothing in it; your application decides the keys, the values and the lifetimes.

## FileCache

```php
use Gacela\Framework\Cache\FileCache;

$cache = new FileCache('/var/cache/myapp');

$cache->put('user:42', $user, ttl: 600);
$cache->get('user:42');     // $user, or null after TTL expiry
$cache->forget('user:42');
$cache->clear();
```

- One `.php` file per key (SHA1-hashed), written atomically through a staged `.tmp` and `rename`.
- `writeContentsAtomically(string $file, string $content): bool` writes already-rendered content to a path, with the
  same staged `.tmp` and `rename` guarantees as `put()`. The higher-level `writeAtomically()` wraps it.
- Each entry has its own TTL. `ttl: 0` means forever; a negative TTL writes an entry that has already expired.
  `InMemoryCacheStorage` follows the same rule as of 2.1. See
  [the TTL contract](/docs/cacheable-methods#the-ttl-contract-a-backend-must-implement).
- `beginBatch()` / `commitBatch()` hold writes back for a single flush under the index lock. Use them to warm many
  entries at once.
- `stats()` returns the entry count, total bytes, and the oldest and newest timestamps.
- No torn reads: a concurrent reader sees either the previous file or the new one, never a half-written one.

## ScopedCache: dependency-aware decorator

When invalidating one entry should also remove every entry derived from it, wrap `FileCache` in `ScopedCache`:

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

- `get`, `put` and `has` go straight to the underlying `FileCache`, with zero overhead on the hot path.
- The dependency graph is stored next to the values (`.gacela-scoped-cache-graph.php`) and survives process restarts.
- `dependsOn()` rejects a cycle at once: self, two-node or transitive.
- One writer at a time: when several processes race on `dependsOn()`, edges added between load and persist may be lost.
  The value store underneath stays safe to read under concurrency either way.

## See also

- [Caching](/docs/caching): the three caching layers and how to pick one
- [Cacheable methods](/docs/cacheable-methods): caching Facade method results instead of raw values
