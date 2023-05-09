+++
title = "Bootstrap"
weight = 1
+++

## Initializing Gacela

Gacela should be bootstrapped using the `Gacela::bootstrap` function.<br>
- The first parameter is the application root directory and is mandatory
- The second one is an optional `Closure(GacelaConfig)` configuration

```php
<?php # index.php

Gacela::bootstrap(__DIR__);

# OR
 
Gacela::bootstrap(
  __DIR__, 
  function (GacelaConfig $config): void { /*...*/ }
);
```

### The `gacela.php` file

You can define the configuration as the second parameter in the `Gacela::bootstrap()` in your `index.php` or, alternatively,
you can create a `gacela.php` file in your application root directory which returns a `Closure(GacelaConfig)` function.

```php
<?php # gacela.php

return function (GacelaConfig $config): void { ... };
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

> **Note**: If you are working "on top" of another project which is using gacela, you can always define your custom
> `gacela.php` file and define your `GacelaConfig` configuration, which will be combined with the `gacela.php` of
> the vendor project itself.

## GacelaConfig

As we just mentioned, you can customize some Gacela behaviours while bootstrapping without the need of a `gacela.php` in the
root of your project, however, if this file exists, it will be combined with the configuration from `Gacela::bootstrap()`.<br/>
It is not mandatory but recommended having a `gacela.php` file in order to decouple and centralize the custom Gacela configuration.

In other words, you can modify some Gacela behaviour from two different places:

1. Directly with `Gacela::bootstrap()`
2. Or using `gacela.php`

### Application Config

Using the GacelaConfig object you can add different paths and use different config file types, even with custom config
readers. The `PhpConfigReader` is used by default.

#### Config PHP files
```php
<?php # gacela.php

return function (GacelaConfig $config): void {
  $config->addAppConfig(
    path: 'config/*.php',
    pathLocal: 'config/local.php',
    reader: PhpConfigReader::class
  );
};
```

You can add as many application configuration as you need using `addAppConfig()`.

- `path`: this is the path of the folder which contains your application configuration. You can use ? or * in order to
  match 1 or multiple characters. Check [glob()](https://www.php.net/manual/en/function.glob.php) function for more info.
- `pathLocal`: this is the last file loaded, which means, it will override the previous configuration, so you can
  easily add it to your .gitignore and set your local config values in case you want to have something different for
  some cases.
- `reader`: Define the reader class which will read and parse the config files. It must implement `ConfigReaderInterface`.

Multiple and different environment config files

```php
<?php # gacela.php

return function (GacelaConfig $config): void {
  $config->addAppConfig('config/.env', '', EnvConfigReader::class);
  $config->addAppConfig('config/*.custom', '', CustomConfigReader::class);
  $config->addAppConfig('config/*.php', 'config/local.php');
};
```

**Hint**: there is a shortcut to specify a "default php config":
```php
<?php # index.php
Gacela::bootstrap(__DIR__, GacelaConfig::withPhpConfigDefault());
```

### Bindings

You can define a map between an interface and the concrete class that you want to create (or use) when that interface is
found during the process of **auto-wiring** in any Factory's Module dependencies via its constructor. Let's see an example:

The `addBinding()` method will let you bind a class with another class
`interface => concreteClass|callable|string-class` that you want to resolve. For example:

```php
<?php # gacela.php

return function (GacelaConfig $config): void {
  $config->addBinding(AbstractString::class, StringClass::class);
  $config->addBinding(ClassInterface::class, new ConcreteClass(/* args */));
  $config->addBinding(ComplexInterface::class, new class() implements Foo {/** logic */});
  $config->addBinding(FromCallable::class, fn() => new StringClass('From callable'));
};
```

In the example above, whenever `OneInterface::class` is found then `OneConcrete::class` will be resolved.

#### Using externalServices

Add the external service using `addExternalService(string, string|object|callable)`. Eg:

```php
<?php # index.php

Gacela::bootstrap(__DIR__, function (GacelaConfig $config): void {
  $config->addExternalService('concreteClass', ConcreteClass::class);
  $config->addExternalService('concreteInstance', $concreteInstance);
});
```

This way we can access the value of that key `'concreteClass'` in the `gacela.php` from `$config->getExternalService(string)`.
For example:
```php
<?php # gacela.php

return function (GacelaConfig $config): void {
  $config->addBinding(
    AnInterface::class, 
    $config->getExternalService('concreteClass')
  );

  $config->addBinding(
    AnotherInterface::class, 
    $config->getExternalService('concreteInstance')
  );
}
```

In the example above, whenever `AnInterface` is found then `ConcreteClass::class` will be resolved.
The same for `AnotherInterface`, the `$concreteInstance` will be used.

### Suffix Types

Apart from the known Gacela suffix classes: `Factory`, `Config`, and `DependencyProvider`, you can define other suffixes to be
resolved for your different modules. You can do this by adding custom gacela resolvable types.

```php
<?php # gacela.php

return function (GacelaConfig $config): void {
  $config->addSuffixTypeFacade('EntryPoint');
  $config->addSuffixTypeFactory('Creator');
  $config->addSuffixTypeConfig('Conf');
  $config->addSuffixTypeDependencyProvider('Binder');
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
└── Binder.php      # this is the `DependencyProvider` 
```

### Project Namespaces

You can add your project namespaces to be able to resolve gacela classes with priorities.

Gacela will start looking on your project namespaces when trying to resolve any gacela resolvable classes, eg:
`Facade`, `Factory`, `Config`, or `DependencyProvider`.

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

return function (GacelaConfig $config): void {
  $config->setProjectNamespaces(['Main']);
};
```

Because you have defined `Main` as your project namespace, when you use the `ModuleA\Facade` from vendor, that Facade
will load the Factory from `src/Main/ModuleA/Factory` and not `vendor/third-party/ModuleA/Factory` because `Main` has
priority (over `third-party`, in this case).

**TL;DR**: You can override gacela resolvable classes by copying the directory structure from vendor modules in your
project namespaces.

### Gacela File Cache

When the method `setFileCacheEnabled()` is `true`, a new `.gacela/cache` folder will be created in the root of
your project with the resolved classes.

> You can customize the file cache directory name considering the root app directory. This is the first argument you pass
> when bootstrapping gacela: `Gacela::bootstrap(__DIR__)`.

```php
<?php # gacela.php

return function (GacelaConfig $config): void {
  $config->setFileCacheEnabled(true);
  $config->setFileCacheDirectory('.gacela/cache');
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
### Listening internal gacela events

Gacela has an internal event-listener system that dispatches a variety of events.
These are read-only events interesting for tracing, debugging or act on them as you want.

#### Register a generic listener to all internal gacela events

```php
<?php # gacela.php

return function (GacelaConfig $config): void {
  $config->registerGenericListener(
    function (GacelaEventInterface $event): void {
      echo $event->toString();
    }
  );
};
```

#### Register a specific listener to one internal gacela event

```php
<?php # gacela.php

return function (GacelaConfig $config): void {
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

If you are working with integration tests, this option can be helpful to avoid false-positives, as `Gacela` works as a global singleton pattern to store the resolved dependencies. This value by default is `false`.

```php
<?php # gacela.php
return function (GacelaConfig $config): void {
  $config->shouldResetInMemoryCache();
};
```

### Extend Service

You are able to extend any service functionality. The `extendService()` receives the service name that will be defined in any `DependencyProvider`, and a `callable` which receives the service itself as 1st arg, and the `Container` as 2nd arg.

#### An example
Consider we have a module with these `DependencyProvider`, `Factory` and `Facade`. 

The `DependencyProvider` has a service defined `'ARRAY_OBJ'` which is an `ArrayObject` with values `[1, 2]` (see `Module/DependencyProvider.php`)

We "extend" that service `'ARRAY_OBJ'` and appending `3` (see `gacela.php`)

Its state when using the Facade and resolving that will be `[1, 2, 3]` (see `index.php`)

```php
<?php 
/************************************************************************/
# Module/DependencyProvider.php
final class DependencyProvider extends AbstractDependencyProvider
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
    return $this->getProvidedDependency(DependencyProvider::ARRAY_OBJ);
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
Gacela::bootstrap(__DIR__, function (GacelaConfig $config): void {
  $config->extendService(
    DependencyProvider::ARRAY_OBJ,
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

### Extend Config

You can extend GacelaConfig from multiple and different places by adding the class name using the `addExtendConfig` method.

The class must be invokable, and it will receive the GacelaConfig object. For example:

```php
<?php
# index.php
Gacela::bootstrap(__DIR__, function (GacelaConfig $config) {
  $config->addExtendConfig(RouterConfig::class);
});

### Having this other class somewhere else:
final class RouterConfig
{
  public function __invoke(GacelaConfig $config): void
  {
    $config->addBinding(Router::class, new Router());
  }
}
```

## A complete example using gacela.php

```php
<?php # gacela.php
return function (GacelaConfig $config): void {
  $config
    // Define different config sources.
    ->addAppConfig('config/*.php', 'config/override.php')

    // Allow overriding gacela resolvable types.
    ->addSuffixTypeFacade('FacadeFromBootstrap')
    ->addSuffixTypeFactory('FactoryFromBootstrap')
    ->addSuffixTypeConfig('ConfigFromBootstrap')
    ->addSuffixTypeDependencyProvider('DependencyProviderFromBootstrap')

    // Define the mapping between interfaces and concretions,
    // so Gacela services will auto-resolve them automatically.
    ->addBinding(GeneratorInterface::class, ConcreteGenerator::class)
    ->addBinding(
      CustomInterface::class,
      $config->getExternalService('CustomClassKey')
    )
    
    // Define your project namespace resolve gacela classes with priorities.
    ->setProjectNamespaces(['App'])
    
    // Enable Gacela file cache system with a custom cache directory.
    ->setFileCacheEnabled(true)
    ->setFileCacheDirectory('.gacela/cache')
    
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
    );
};
```
