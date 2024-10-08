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

As we just mentioned, you can customize some Gacela behaviours while bootstrapping without the need of a `gacela.php` in the
root of your project, however, if this file exists, it will be combined with the configuration from `Gacela::bootstrap()`.<br/>
It is not mandatory but recommended having a `gacela.php` file in order to decouple and centralize the custom Gacela configuration.

In other words, you can modify some Gacela behaviour from two different places:

1. Directly with `Gacela::bootstrap()`
2. Or using `gacela.php`

### File Cache

```php
enableFileCache(string $directory = '.gacela/cache');
setFileCache(bool $enabled, string $directory = '.gacela/cache');
```
The gacela file cache is disabled by default. You can enable it using the `enableFileCache()` or `setFileCache`.

This will generate a file with all resolved classes by gacela will be cached resulting in a faster execution next time.

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

### Bindings

```php
addBinding(string $key, string|object|callable $value);
```

You can define a map between a type (class or interface) and the concrete class that you want to create (or use) when a certain type is found during the process of **auto-wiring** in a Gacela `Plugin` or `Locator's container` from any `Provider`.

The `addBinding()` method will let you bind a class with another class
`interface => concreteClass|callable|string-class` that you want to resolve. For example:

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addBinding(AbstractString::class, StringClass::class);
  $config->addBinding(ClassInterface::class, new ConcreteClass(/* args */));
  $config->addBinding(ComplexInterface::class, new class() implements Foo {/** logic */});
  $config->addBinding(FromCallable::class, fn() => new StringClass('From callable'));
};
```

In the example above, whenever `OneInterface::class` is found then `OneConcrete::class` will be resolved.

#### Using externalServices

```php
addExternalService(string $key, $value);
```

Add the external service using `addExternalService(string, string|object|callable)`.
This is useful to share objects between the initial bootstrap callable and the `gacela.php` config files. Eg:

```php
<?php # index.php

$instance = ...;

Gacela::bootstrap(__DIR__, function (GacelaConfig $config) use ($instance) {
  $config->addExternalService('concreteClass', ConcreteClass::class);
  $config->addExternalService('concreteInstance', $instance);
});
```

This way we can access the value of that key `'concreteClass'` in the `gacela.php` from `$config->getExternalService(string)`.
For example:
```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $instance = $config->getExternalService('concreteInstance');

  $config->addBinding(AnInterface::class, $instance);
  $config->addBinding(AnotherInterface::class, $instance);
}
```

In the example above, whenever `AnInterface` is found then `ConcreteClass::class` will be resolved.
The same for `AnotherInterface`, the `$concreteInstance` will be used.

### Plugins

```php
addPlugin(callable|class-string $plugin);
addPlugins(array $list);
```

You can run custom logic right after bootstrapping gacela from different places by adding plugins using the `addPlugin` method.

```php
<?php # index.php

Gacela::bootstrap(__DIR__, function (GacelaConfig $config) {
  // using a callable
  $config->addPlugin(function (RouterInterface $router) {
    $router->configure(function (Routes $routes) {
      $routes->get('/uri', YourController::class, 'uriAction');
    });
  });

  // or using a class name
  $config->addPlugin(ApiRoutesPlugin::class);
});
```

The class must be invokable, and it has autoload capabilities: all dependencies will be resolved automatically as soon as you have defined them using [bindings](#bindings). The same applies to the callable arguments above.

For example, having this other class `ApiRoutesPlugin` somewhere else:
```php
<?php # ApiRoutesPlugin.php

final class ApiRoutesPlugin
{
  public function __invoke(RouterInterface $router): void
  {
    $router->configure(function (Routes $routes): void {
      $routes->get('{name}', HelloController::class);
    });
  }
}
```

### Suffix Types

```php
addSuffixTypeFacade(string $suffix);
addSuffixTypeFactory(string $suffix);
addSuffixTypeConfig(string $suffix);
addSuffixTypeProvider(string $suffix);
```

Apart from the known Gacela suffix classes: `Factory`, `Config`, and `Provider`, you can define other suffixes to be
resolved for your different modules. You can do this by adding custom gacela resolvable types.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addSuffixTypeFacade('EntryPoint');
  $config->addSuffixTypeFactory('Creator');
  $config->addSuffixTypeConfig('Conf');
  $config->addSuffixTypeProvider('Binder');
};
```

In the example above, you'll be able to create a gacela module with these file names:

```bash
ExampleModule
├── Domain
│   └── YourLogicClass.php
├── EntryPoint.php  # this is the `Facade`
├── Creator.php     # this is the `Factory`
├── Conf.php        # this is the `Config`
└── Binder.php      # this is the `Provider` 
```

### Project Namespaces

```php
setProjectNamespaces(array $list);
```

You can add your project namespaces to be able to resolve gacela classes with priorities.

Gacela will start looking on your project namespaces when trying to resolve any gacela resolvable classes, eg:
`Facade`, `Factory`, `Config`, or `Provider`.

Let's visualize it with an example. Consider this structure:
```
├── gacela.php
├── index.php # entry point
├── src
│   └── Main
│       └── ModuleA
│           └── Factory.php
└── vendor
    └── third-party
        └── ModuleA
            ├── Facade.php
            └── Factory.php
```

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->setProjectNamespaces(['Main']);
};
```

Because you have defined `Main` as your project namespace, when you use the `ModuleA\Facade` from vendor, that Facade
will load the Factory from `src/Main/ModuleA/Factory` and not `vendor/third-party/ModuleA/Factory` because `Main` has
priority (over `third-party`, in this case).

**TL;DR**: You can override gacela resolvable classes by copying the directory structure from vendor modules in your
project namespaces.

### Listening internal gacela events

```php
registerGenericListener(callable $listener);
registerSpecificListener(string $event, callable $listener);
```

Gacela has an internal event-listener system that dispatches a variety of events.
These are read-only events interesting for tracing, debugging or act on them as you want.

#### Register a generic listener to all internal gacela events

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->registerGenericListener(
    function (GacelaEventInterface $event) {
      echo $event->toString();
    }
  );
};
```

#### Register a specific listener to one internal gacela event

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->registerSpecificListener(
    ResolvedClassCreatedEvent::class, 
    function (GacelaEventInterface $event): void {
      echo $event->toString();
    }
  );
};
```

#### List of supported events

##### Gacela\Framework\Event\ClassResolver\ClassNameFinder
- ClassNameInvalidCandidateFoundEvent
- ClassNameNotFoundEvent
- ClassNameCachedFoundEvent
- ClassNameValidCandidateFoundEvent

##### Gacela\Framework\Event\ConfigReader
- ReadPhpConfigEvent

##### Gacela\Framework\Event\ClassResolver
- AbstractGacelaClassResolverEvent
- ResolvedClassCachedEvent
- ResolvedClassCreatedEvent
- ResolvedCreatedDefaultClassEvent
- ResolvedClassTriedFromParentEvent

##### Gacela\Framework\Event\ClassResolver\Cache
- ClassNameCacheCachedEvent
- ClassNamePhpCacheCreatedEvent
- ClassNameInMemoryCacheCreatedEvent
- CustomServicesCacheCachedEvent
- CustomServicesPhpCacheCreatedEvent
- CustomServicesInMemoryCacheCreatedEvent

### Reset internal InMemoryCache

```php
resetInMemoryCache();
```

If you are working with integration tests, this option can be helpful to avoid false-positives, as `Gacela` works as a global singleton pattern to store the resolved dependencies.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->resetInMemoryCache();
};
```

### Extend Service

```php
extendService(string $id, Closure $service);
```

You are able to extend any service functionality. The `extendService()` receives the service name that will be defined in any `Provider`, and a `callable` which receives the service itself as 1st arg, and the `Container` as 2nd arg.

#### An example

Consider we have a module with these `Provider`, `Factory` and `Facade`.

The `Provider` has a service defined `'ARRAY_OBJ'` which is an `ArrayObject` with values `[1, 2]` (see `Module/Provider.php`)

We "extend" that service `'ARRAY_OBJ'` and appending `3` (see `gacela.php`)

Its state when using the Facade and resolving that will be `[1, 2, 3]` (see `index.php`)

```php
<?php 

/************************************************************************/
# Module/Provider.php
final class Provider extends AbstractProvider
{
  public const ARRAY_OBJ = 'ARRAY_OBJ';

  public function provideModuleDependencies(Container $container): void
  {
    $container->set(self::ARRAY_OBJ, new ArrayObject([1, 2]));
  }
}

/************************************************************************/
# Module/Factory.php
final class Factory extends AbstractFactory
{
  public function getArrayAsObject(): ArrayObject
  {
    return $this->getProvidedDependency(Provider::ARRAY_OBJ);
  }
}

/************************************************************************/
# Module/Facade.php
final class Facade extends AbstractFacade
{
  public function getArrayAsObject(): ArrayObject
  {
    return $this->getFactory()->getArrayAsObject();
  }
}

/************************************************************************/
# gacela.php
Gacela::bootstrap(__DIR__, function (GacelaConfig $config) {
  $config->extendService(
    Provider::ARRAY_OBJ,
    function (ArrayObject $arrayObject, Container $container) {
      $arrayObject->append(3);
    }
  );
});

/************************************************************************/
# index.php
$facade = new Module\Facade();
$facade->getArrayAsObject(); // === new ArrayObject([1, 2, 3])
```

### Extend Gacela Config

```php
extendGacelaConfig(string $configClass);
extendGacelaConfigs(array $list);
```

You can extend `GacelaConfig` from different places using the `extendGacelaConfig` method.

The class must be invokable, and it will receive the GacelaConfig object. For example:

```php
<?php # index.php

Gacela::bootstrap(__DIR__, function (GacelaConfig $config) {
  $config->extendGacelaConfig(RouterConfig::class);
});

### Having this other class somewhere else:
final class RouterConfig
{
  public function __invoke(GacelaConfig $config): void
  {
    $router = new Router();

    $config->addBinding(Router::class, $router);
    $config->addBinding(RouterInterface::class, $router);
  }
}
```

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

Get a located binding or singleton already loaded considering the existing container dependencies on runtime.