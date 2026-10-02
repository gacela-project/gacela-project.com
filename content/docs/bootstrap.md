---
title: Bootstrap
description: Bootstrap Gacela and configure environments, application paths, caches, and container behavior.
---

# Bootstrap

Call `Gacela::bootstrap()` once in each application entry point, before resolving a Facade. Pass the application root as
the first argument and an optional `Closure(GacelaConfig)` as the second.

```php
<?php # index.php

use Gacela\Framework\Bootstrap\GacelaConfig;
use Gacela\Framework\Gacela;

require __DIR__ . '/vendor/autoload.php';

Gacela::bootstrap(__DIR__, static function (GacelaConfig $config): void {
    // Optional application-wide configuration.
});
```

## Choose where configuration lives

Use the bootstrap closure for runtime values specific to one entry point. Use `gacela.php` for shared application
configuration under version control. When both exist, Gacela combines them.

```php
<?php # gacela.php

use Gacela\Framework\Bootstrap\GacelaConfig;

return static function (GacelaConfig $config): void {
    // Shared application configuration.
};
```

## Environment-specific bootstrap

Set `APP_ENV` to load a matching file after `gacela.php`:

- `APP_ENV=dev` loads `gacela-dev.php`
- `APP_ENV=prod` loads `gacela-prod.php`
- `APP_ENV=staging` loads `gacela-staging.php`

The environment file can add settings or override those from the default file.

Application config follows the same pattern; see [environment-specific config files](/docs/config#config-files-for-different-environments).

::: info Extending a Gacela-based package
An application's `gacela.php` is combined with configuration discovered in vendor packages, so the application can
override or extend package defaults.
:::

## GacelaConfig

`GacelaConfig` controls application-wide behavior. This page covers bootstrap concerns. The dedicated references
cover deeper wiring:

- [Bindings](/docs/bindings): bindings, factories, tags, resolution hooks, aliases, contextual bindings, and definitions
- [Getting dependencies](/docs/getting-dependencies): which configuration mechanism to use for each intent
- [Extensions & Plugins](/docs/extensions): plugins, extendService, extendGacelaConfig, handler registry
- [Module Customization](/docs/customization): suffix types, project namespaces, events

### File cache

```php
enableFileCache(?string $dir = null);             // default: system temp directory
setFileCache(bool $enabled, ?string $dir = null); // default: system temp directory
```

The file cache is off by default. Enable it in production to keep resolved class names and merged configuration
between requests.

A configured directory is relative to the application root. Even a leading `/` stays under the app; use
`GACELA_CACHE_DIR` for an external absolute path. Cache filenames include a hash of the application root, so several
applications can safely share the default system temporary directory.

```php
<?php # gacela.php

return static function (GacelaConfig $config): void {
    $config->enableFileCache('.gacela/cache');
};
```

The project config can also control the cache:

```php
<?php # config/default.php

use Gacela\Framework\ClassResolver\Cache\GacelaFileCache;

return [GacelaFileCache::KEY_ENABLED => true];
```

### Application config

```php
addAppConfig(string $path, string $pathLocal = '', $reader = null);
```

`addAppConfig()` registers config sources. PHP is the default format; other formats need a `ConfigReaderInterface`
implementation.

#### PHP config files

```php
<?php # gacela.php

return static function (GacelaConfig $config): void {
    $config->addAppConfig(
        path: 'config/*.php',
        pathLocal: 'config/local.php',
        reader: PhpConfigReader::class,
    );
};
```

- `path` accepts [`glob()`](https://www.php.net/manual/en/function.glob.php) patterns and loads matching files in
  order.
- `pathLocal` loads last, which suits ignored, developer-specific overrides.
- `reader` parses the source and must implement `ConfigReaderInterface`.

Register several formats when the application needs them:

```php
<?php # gacela.php

return static function (GacelaConfig $config): void {
    $config->addAppConfig('config/.env', '', EnvConfigReader::class);
    $config->addAppConfig('config/*.custom', '', CustomConfigReader::class);
    $config->addAppConfig('config/*.php', 'config/local.php');
};
```

For the conventional PHP setup:

```php
<?php # index.php
Gacela::bootstrap(__DIR__, GacelaConfig::defaultPhpConfig());
```

### Application module paths

```php
setAppModulePaths(array $paths): self
```

Restrict which directories Gacela scans to discover application modules. This scan powers the console commands
`list:modules`, `debug:modules`, `cache:warm`, and `doctor`.

```php
<?php # gacela.php

return static function (GacelaConfig $config): void {
    $config->setAppModulePaths(['src']);
};
```

- Paths can be absolute or relative to the application root
- Missing paths are skipped with a warning at scan time
- When unset, the entire application root is scanned

On a large code base, this narrows the scan to your module directories, so `cache:warm` and the discovery commands
skip unrelated folders.

### Container scopes

Gacela creates one application container and a child scope for each module's Provider registrations. App-wide wiring
runs once per bootstrap. Provider keys stay private to their module, and app-wide bindings resolve within the
requesting module's scope.

## Production baseline

Start with the smallest shared configuration that fits the application. Add bindings, plugins, listeners or custom
discovery only when a concrete need appears.

```php
<?php # gacela.php

use Gacela\Framework\Bootstrap\GacelaConfig;

return static function (GacelaConfig $config): void {
    $config
        ->addAppConfig('config/*.php', 'config/local.php')
        ->setAppModulePaths(['src'])
        ->enableFileCache('.gacela/cache');
};
```

## Runtime access

Three entry points work only after `Gacela::bootstrap()` has run: `Gacela::rootDir()`, `Gacela::container()` and
`Config::getInstance()`. Before that, each throws `Gacela\Framework\Exception\GacelaNotBootstrappedException` with
the message `Did you forget to call Gacela::bootstrap()?`.

```php
use Gacela\Framework\Exception\GacelaNotBootstrappedException;

try {
    $container = Gacela::container();
} catch (GacelaNotBootstrappedException) {
    // Nothing is wired yet. Degrade rather than fail.
}
```

Catch it to degrade gracefully. `debug:dependencies` does this when asked about a project that never bootstrapped.
`Config::getInstance()` joined the other two in 2.3. Before that, it threw a bare `RuntimeException` naming an
internal method, so a handler written for exactly this condition missed the most common case.

### Gacela::rootDir ()

Returns the application root passed to `bootstrap()`.

### Gacela::get (string::class)

Returns a registered service or `null` when it is missing.

### Gacela::getRequired (string::class)

Returns a registered service or throws `ServiceNotFoundException`. The error includes close-name suggestions.

```php
try {
    $facade = Gacela::getRequired(UserFacade::class);
} catch (ServiceNotFoundException $e) {
    // Typo'd service name? The message contains suggestions.
}
```

`Locator::getRequiredSingleton()` is the equivalent shortcut when you work with the locator directly.

### Gacela::container ()

Returns the application container. Prefer Facades in application code; direct access is for tooling and focused tests.

### Gacela::resetCache ()

Clears the in-process and file-backed resolution caches, so the next `Gacela::bootstrap()` starts clean. It does
**not** clear an external backend registered through `CacheableConfig::setStorage()`; use the method-cache API for that.
See [`resetInMemoryCache()`](/docs/customization#reset-inmemorycache) for the bootstrap-time equivalent.
