---
title: Cacheable facade methods
description: Cache Facade method results with explicit TTLs, keys, storage, and invalidation.
---

# Cacheable facade methods

The `#[Cacheable]` attribute caches a facade method's result for a given TTL.

`AbstractFacade` includes `CacheableTrait`, so every Facade can use `#[Cacheable]` and `$this->cached()` directly.

## Quick start

```php
use Gacela\Framework\Attribute\Cacheable;
use Gacela\Framework\AbstractFacade;

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

Later calls within the TTL return the cached value without running the callback.

## How it works

`#[Cacheable]` is only metadata. The caching happens inside `$this->cached(...)`, which:

1. Reads the attribute through reflection (memoised per `Class::method`).
2. Builds a cache key from the class, method, and arguments.
3. Returns the cached value on hit, or runs the callback and stores the result on miss.

By default, `cached()` infers the method name and arguments from the caller's stack frame. Pass them explicitly on
performance-sensitive paths or for calls routed through a helper. See [Opting out of backtrace](#opting-out-of-backtrace).

::: tip Generic return type
`cached()` is generic (`@template T`), so static analysis infers the return type from the callback. You need no
call-site annotation or cast.
:::

## Arguments shape the cache key

Each set of arguments gets its own cache entry.

```php
#[Cacheable(ttl: 600)]
public function findUser(int $id): User
{
    return $this->cached(fn (): User =>
        $this->getFactory()->createRepository()->find($id),
    );
}

$facade->findUser(1); // runs callback, caches under key ending in "::1"
$facade->findUser(1); // cache hit
$facade->findUser(2); // runs callback, separate entry
```

A single `int` or `string` argument goes into the key directly (`Facade::method::42`). Anything else (arrays, objects,
several arguments) falls back to `md5(serialize(...))`.

## Custom key templates

Use `key` with `{N}` placeholders to put the Nth argument into the cache key. This gives readable keys in an external
cache.

A template names an entry inside the declaring class and method, never across them. The stored key is `Class::method::`
followed by the interpolated template, so two classes using the same template keep separate entries. [since 2.4]

```php
#[Cacheable(ttl: 3600, key: 'user:{0}')]
public function getUser(int $id): array
{
    return $this->cached(fn (): array =>
        $this->getFactory()->createRepository()->find($id),
    );
}
```

A plain string with no placeholders ignores the arguments: every call shares one entry.

## Clearing the cache

```php
// Clear all entries for a specific method (any args)
CatalogFacade::clearMethodCacheFor('getPopularProducts');

// Clear the whole shared storage backend, across every facade
CatalogFacade::clearMethodCache();
```

`clearMethodCacheFor()` matches the exact `Class::method::` prefix. Passing `'get'` does **not** clear every method
whose name starts with `get`. It reaches an entry written under a custom `key:` template like any other, because those
keys carry the same prefix. [since 2.4]

`clearMethodCache()` calls `clear()` on the shared backend; it is not scoped to the facade class. Prefer the
method-specific call unless you mean to clear every application entry.

`Gacela::resetCache()` clears only the default in-process method storage. It does not clear an external backend
registered through `CacheableConfig::setStorage()`; call `clearMethodCache()` for that.

## Pluggable storage backend

By default, the cache lives in process memory through `InMemoryCacheStorage`. On PHP-FPM, entries die with the
request. That is fine for batch jobs and long-running workers, but close to a no-op for typical web traffic.

Swap in any backend that implements `CacheStorageInterface`, such as APCu, Redis or a PSR-16 adapter:

```php
use Gacela\Framework\Attribute\CacheableConfig;

CacheableConfig::setStorage(new RedisCacheStorage($redis));
```

```php
interface CacheStorageInterface
{
    public function has(string $key): bool;
    public function get(string $key, mixed $default = null): mixed;
    public function set(string $key, mixed $value, int $ttl): void;
    public function delete(string $key): void;
    public function clear(): void;
    public function deleteByPrefix(string $prefix): void;
}
```

Call `CacheableConfig::setStorage()` once at bootstrap. Every facade using `CacheableTrait` shares that backend.

### The TTL contract a backend must implement

| `$ttl` | Meaning                                                          |
|--------|------------------------------------------------------------------|
| `> 0`  | The entry expires that many seconds from now                     |
| `0`    | The entry is stored **without expiry**, not "expire immediately" |
| `< 0`  | The entry is already expired when written, so no read returns it |

Zero is the case to read twice. `FileCache` has always treated it as "no expiry", and its own default TTL is `0`. A
backend that computes `time() + $ttl` unconditionally stores an entry that is expired before `set()` returns.
Both built-in backends follow the table above; `InMemoryCacheStorage` was corrected to match in 2.1.

## TTL overrides per method

Override the TTL declared on the attribute without changing code. This helps tune hot paths per environment.

```php
CacheableConfig::setTtlOverrides([
    CatalogFacade::class . '::getPopularProducts' => 60,   // tighten in staging
    UserFacade::class . '::getUser' => 86400,              // loosen in prod
]);
```

The override applies on the next `set()`. Existing entries keep their original expiry until evicted.

## Opting out of backtrace

`cached()` calls `debug_backtrace()` (limit 2) to infer the method name and arguments. Next to a typical expensive
method (DB, HTTP), the cost is negligible. Pass `$method` and `$args` explicitly when:

- The cached operation is very fast and the overhead matters.
- The method takes very large arguments (frame-construction cost scales with argument count).
- `cached()` is called from a private helper, not from the attributed method.

```php
#[Cacheable(ttl: 3600)]
public function getUser(int $id): array
{
    return $this->cached(
        fn (): array => $this->getFactory()->createRepository()->find($id),
        __METHOD__,
        [$id],
    );
}
```

## Caching `null`

A method that returns `null` is cached correctly: repeated calls do **not** re-run the callback. `CacheableTrait` tells
"cached null" from "cache miss" with a sentinel, so `Optional`-style return types work as expected.

## Limitations

- **Per-process by default.** Entries in `InMemoryCacheStorage` do not outlive the request on PHP-FPM. Use a shared
  backend (APCu, Redis) for cross-request caching.
- **Serialization.** The default key and miss detection rely on `serialize()` for non-scalar arguments. Arguments
  holding closures or resources cannot be serialized and throw.
- **Memoised attribute metadata.** Gacela reflects the `#[Cacheable]` attribute once per `Class::method` and keeps it
  for the life of the process. Changing the attribute at runtime has no effect; change the code and redeploy.
