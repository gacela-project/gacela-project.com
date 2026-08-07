# Bootstrap

Gacela should be bootstrapped using the `Gacela::bootstrap` function.
- The first parameter is the application root directory and is mandatory
- The second one is an optional `Closure(GacelaConfig)` configuration

```php
<?php # index.php

Gacela::bootstrap(__DIR__);

# OR
 
Gacela::bootstrap(
  __DIR__, 
  function (GacelaConfig $config) { /*...*/ }
);
```

### The `gacela.php` file

You can define the configuration as the second parameter in the `Gacela::bootstrap()` in your `index.php` or, alternatively,
you can create a `gacela.php` file in your application root directory which returns a `Closure(GacelaConfig)` function.

```php
<?php # gacela.php

return function (GacelaConfig $config) { ... };
```

### Different environments

You can define a **gacela configuration file** for different environments using the `APP_ENV` environment variable.
Where you have a Gacela file with the suffix of the environment in the file name, it will load that configuration.

For example:
- `APP_ENV=dev` -> will load `gacela-dev.php`
- `APP_ENV=prod` -> will load `gacela-prod.php`
- `APP_ENV=anything` -> will load `gacela-anything.php`

The loading of this particular file will happen after the default `gacela.php` (if exists). So it will override (or add)
the possible values you might have defined in the default `gacela.php` file.

(A similar behaviour already exists for your app config files. See: [Config files for diff env](/docs/config/#config-files-for-different-environments).)

::: info
If you are working "on top" of another project which is using gacela, you can always define your custom
`gacela.php` file and define your `GacelaConfig` configuration, which will be combined with the `gacela.php` of
the vendor project itself.
:::

## GacelaConfig

You can customize Gacela behaviours while bootstrapping without the need of a `gacela.php` in the
root of your project, however, if this file exists, it will be combined with the configuration from `Gacela::bootstrap()`.
It is not mandatory but recommended having a `gacela.php` file in order to decouple and centralize the custom Gacela configuration.

You can modify Gacela behaviour from two different places:

1. Directly with `Gacela::bootstrap()`
2. Or using `gacela.php`

The full GacelaConfig API is documented across these pages:

- [Bindings](/docs/bindings): bindings, factories, tags, resolution hooks, aliases, contextual bindings, and definitions
- [Getting dependencies](/docs/getting-dependencies): which configuration mechanism to use for each intent
- [Extensions & Plugins](/docs/extensions): plugins, extendService, extendGacelaConfig, handler registry
- [Module Customization](/docs/customization): suffix types, project namespaces, events

### File Cache

```php
enableFileCache(?string $dir = null);             // default: system temp directory
setFileCache(bool $enabled, ?string $dir = null); // default: system temp directory
```
The gacela file cache is disabled by default. You can enable it using the `enableFileCache()` or `setFileCache`.

This will generate a file with all resolved classes by gacela will be cached resulting in a faster execution next time.

A configured directory is relative to the application root. A leading `/` is still rooted under the app; use `GACELA_CACHE_DIR` for an external absolute path. In 2.0, cache filenames include an app-root hash so applications can safely share the default system temp directory.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->enableFileCache();

  // or using the setter method
  $config->setFileCache(true|false);
};
```

You can also enable or disable the gacela file cache system via your project config values.

```php
<?php # config/default.php

use Gacela\Framework\ClassResolver\Cache\GacelaFileCache;

return [
  GacelaFileCache::KEY_ENABLED => true|false,
];
```

### Application Config

```php
addAppConfig(string $path, string $pathLocal = '', $reader = null);
```

Using the GacelaConfig object you can add different paths and use different config file types, even with custom config
readers. The `PhpConfigReader` is used by default.

#### Config PHP files
```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addAppConfig(
    path: 'config/*.php',
    pathLocal: 'config/local.php',
    reader: PhpConfigReader::class
  );
};
```

You can add as many application configuration as you need using `addAppConfig()`.

- `path`: this is the path of the folder which contains your application configuration. You can use ? or * in order to
  match 1 or multiple characters. Check [glob()](https://www.php.net/manual/en/function.glob.php) function for more info
- `pathLocal`: this is the last file loaded, which means, it will override the previous configuration, so you can
  easily add it to your .gitignore and set your local config values in case you want to have something different for
  some cases
- `reader`: Define the reader class which will read and parse the config files. It must implement `ConfigReaderInterface`

Multiple and different environment config files

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addAppConfig('config/.env', '', EnvConfigReader::class);
  $config->addAppConfig('config/*.custom', '', CustomConfigReader::class);
  $config->addAppConfig('config/*.php', 'config/local.php');
};
```

**Hint**: there is a shortcut to specify a "default php config":
```php
<?php # index.php
Gacela::bootstrap(__DIR__, GacelaConfig::defaultPhpConfig());
```

### Application Module Paths

```php
setAppModulePaths(array $paths): self
```

Restrict which directories are scanned when Gacela discovers application modules. This scan powers the console commands `list:modules`, `debug:modules`, `cache:warm`, and `doctor`.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->setAppModulePaths(['src/Domain', 'src/Infrastructure']);
};
```

- Paths can be absolute or relative to the application root
- Missing paths are skipped with a warning at scan time
- When unset, the entire application root is scanned

On large code bases this narrows the scan to your module directories, so `cache:warm` and the discovery commands skip unrelated folders.

### Container scopes in 2.0

Gacela now creates one application container and gives each module a child scope carrying that module's Provider registrations. App-wide `gacela.php` wiring is applied once per bootstrap instead of once per Factory. A module cannot see a sibling's Provider keys, and app-wide bindings resolved from two module scopes still produce independently scoped instances.

## A complete example using gacela.php

```php
<?php # gacela.php
return function (GacelaConfig $config) {
  $config
    // Define different config sources.
    ->addAppConfig('config/*.php', 'config/override.php')

    // Allow overriding gacela resolvable types.
    ->addSuffixTypeFacade('FacadeFromBootstrap')
    ->addSuffixTypeFactory('FactoryFromBootstrap')
    ->addSuffixTypeConfig('ConfigFromBootstrap')
    ->addSuffixTypeProvider('ProviderFromBootstrap')

    // Define the mapping between interfaces and concretions,
    // so Gacela services will auto-resolve them automatically.
    ->addBinding(GeneratorInterface::class, ConcreteGenerator::class)
    ->addBinding(CustomInterface::class, $config->getExternalService('key'))

    // Run custom logic right after bootstrapping gacela
    ->addPlugin(ApiRoutesPlugin::class)

    // Define your project namespace resolve gacela classes with priorities.
    ->setProjectNamespaces(['App'])

    // Restrict module discovery to specific directories.
    ->setAppModulePaths(['src/Domain', 'src/Infrastructure'])
    
    // Enable Gacela file cache system with a custom cache directory.
    ->enableFileCache('.gacela/cache')
    
    // Listening all internal gacela events
    ->registerGenericListener(
      function (GacelaEventInterface $event): void {
        echo $event->toString();
      }
    )
    // Listening a concrete internal gacela event
    ->registerSpecificListener(
      ResolvedClassCreatedEvent::class, 
      function (GacelaEventInterface $event): void {
        echo $event->toString();
      }
    )
    // Extending the functionality of a particular service
    ->extendService(
      'any-service-name',
      static function (ServiceType $service): void {
        // you can retrieve/alter any functionality of the $service  
      }
    )
    // Add additional gacela configuration
    ->extendGacelaConfig(RouterConfig::class);
};
```

## Additional

### Gacela::rootDir()

Get the application root dir set when bootstrapping gacela.

### Gacela::get(string::class)

Get a located binding or singleton already loaded considering the existing container dependencies on runtime. Returns `null` when the service is not registered.

### Gacela::getRequired(string::class)

Same as `Gacela::get()` but throws `ServiceNotFoundException` when the service is missing. The exception message includes did-you-mean suggestions built from the registered service names.

```php
try {
    $facade = Gacela::getRequired(UserFacade::class);
} catch (ServiceNotFoundException $e) {
    // Typo'd service name? The message contains suggestions.
}
```

`Locator::getRequiredSingleton()` is the equivalent shortcut when working with the locator directly.

### Gacela::container()

Get the main dependency injection container created during bootstrap. Useful for tooling (e.g. `debug:container`) and for tests that need direct container access.

### Gacela::resetCache()

Wipe Gacela's in-process resolution caches, file-backed cache copies, merged-config memo, config-file glob cache, and shared constructor-plan cache so the next `Gacela::bootstrap()` starts clean. It does **not** clear an external cache backend registered through `CacheableConfig::setStorage()`; use the method-cache APIs when that is intentional. Handy in tests and long-running workers. See also [`resetInMemoryCache()`](/docs/customization#reset-inmemorycache) for the bootstrap-time equivalent.
