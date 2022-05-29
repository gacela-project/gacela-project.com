+++
title = "Bootstrap"
weight = 1
+++

## Initializing Gacela

Gacela should be bootstrapped using the `Gacela::bootstrap` function.<br>
- The first parameter is the application root directory and is mandatory.
- The second one is an optional `Closure(GacelaConfig)` configuration.

```php
<?php # index.php

Gacela::bootstrap($appRootDir, function (GacelaConfig $config): void { ... });
```

### The `gacela.php` file

You can define the configuration as second parameter in the `Gacela::bootstrap()` in your `index.php` or, alternatively,
you can create a `gacela.php` file in your application root directory which returns a `Closure(GacelaConfig)` function.

```php
<?php # gacela.php

return function (GacelaConfig $config): void { ... };
```

## GacelaConfig

As we just mention, you can customize some Gacela behaviours while bootstrapping without the need of a `gacela.php` in the
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
<?php
$configFn = function (GacelaConfig $config): void {
    $config->addAppConfig(
        path: 'config/*.php',
        pathLocal: 'config/local.php',
        reader: PhpConfigReader::class 
    );
};
```

You can add to `addAppConfig()` method as many config locations as you want.

- `path`: this is the path of the folder which contains your application configuration. You can use ? or * in order to
  match 1 or multiple characters. Check [glob()](https://www.php.net/manual/en/function.glob.php) function for more info.
- `pathLocal`: this is the last file loaded, which means, it will override the previous configuration, so you can
  easily add it to your .gitignore and set your local config values in case you want to have something different for
  some cases.
- `reader`: Define the reader class which will read and parse the config files. It must implement `ConfigReaderInterface`.

Multiple and different environment config files

```php
<?php
$configFn = function (GacelaConfig $config): void {
    $config->addAppConfig('config/.env', '', EnvConfigReader::class);
    $config->addAppConfig('config/*.custom', '', CustomConfigReader::class);
    $config->addAppConfig('config/*.php', 'config/local.php');
};
```

### Mapping Interfaces

You can define a map between an interface and the concrete class that you want to create (or use) when that interface is
found during the process of **auto-wiring** in any Factory's Module dependencies via its constructor. Let's see an example:

The `addMappingInterface()` let you bind a class with another class
`interface => concreteClass|callable|string-class` that you want to resolve. For example:

```php
<?php
$configFn = function (GacelaConfig $config): void {
    $config->addMappingInterface(AbstractString::class, StringClass::class);
    $config->addMappingInterface(ClassInterface::class, new ConcreteClass(/*args*/));
    $config->addMappingInterface(ComplexInterface::class, new class() implements Foo { /** logic */ });
    $config->addMappingInterface(FromCallable::class, fn() => new StringClass('From callable'));
};
```

In the example above, whenever `OneInterface::class` is found then `OneConcrete::class` will be resolved.

#### Using externalServices

First, we set global services as a key-value array from the `GacelaConfig->setExternalServices()`.
In this example `'concreteClass'`:

```php
<?php # index.php
$configFn = function (GacelaConfig $config): void {
    $config->setExternalServices(['concreteClass' => ConcreteClass::class]);
}
Gacela::bootstrap($appRootDir, $setup);
```

This way we can access the value of that key `'concreteClass'` in the `gacela.php` from `$config->getExternalService()`.
For example:
```php
<?php # gacela.php
return function (GacelaConfig $config): void {
    $config->addMappingInterface(
        AnInterface::class,
        $config->getExternalService('concreteClass')
    );
}
```

In the example above, whenever `AnInterface::class` is found then `ConcreteClass::class` will be resolved.

### Suffix Types

Apart from the known Gacela suffix classes: `Factory`, `Config`, and `DependencyProvider`, you can define other suffixes to be
resolved for your different modules. You can do this by adding custom gacela resolvable types.

```php
<?php
$configFn = function (GacelaConfig $config): void {
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
└── Conf.php        # this is the `Config`
└── Binder.php      # this is the `DependencyProvider` 
```

### Reset Cache

This flag will remove the cache from the auto-resolved services when the `Gacela::bootstrap()` method is executed.
If you are working with integration tests, this option can be helpful to avoid false-positives, as `Gacela` works as a
global singleton pattern to store the resolved dependencies.

```php
<?php
$configFn = function (GacelaConfig $config): void {
    $config->setResetCache(false);
};
```

## A complete example using gacela.php

```php
<?php
$configFn = function (GacelaConfig $config): void {
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
        ->addMappingInterface(GeneratorInterface::class, ConcreteGenerator::class)
        ->addMappingInterface(
            CustomInterface::class,
            $config->getExternalService('CustomClassKey')
        )

        // Remove the cache from Gacela when Gacela::bootstrap() is executed,
        // this is very handy for some integration tests.
        ->setResetCache(false);
};
```

### Accessing a Doctrine-Repository from a Gacela-Factory

The Gacela Factory has auto-wiring that will resolve its dependencies.
The only exception is for interfaces, because there is no way to discover what want to inject there.
For this purpose, you need to define the mapping between the interfaces and to what do you want them to be resolved.

```php
<?php # index.php

namespace Symfony\Component\HttpKernel\Kernel;
# ...
$kernel = new Kernel($_SERVER['APP_ENV'], (bool)$_SERVER['APP_DEBUG']);

$configFn = function (GacelaConfig $config) use ($kernel): void {
    $config->addExternalService('symfony/kernel', $kernel);
}

Gacela::bootstrap($appRootDir, $configFn);
```

```php
<?php # gacela.php

return function (GacelaConfig $config): void {
    $config->addAppConfig('.env*', '.env.local', EnvConfigReader::class);

    $config->addMappingInterface(
        ProductRepositoryInterface::class,
        ProductRepository::class
    );

    /** 
     * Using $config we can get the service that we added in `index.php`
     * 
     * @var Kernel $kernel
     */
    $kernel = $config->getExternalService('symfony/kernel');

    $config->addMappingInterface(
        EntityManagerInterface::class,
        fn () => $kernel->getContainer()->get('doctrine.orm.entity_manager')
    );
};
```

In our current example (using Symfony) we want to use the doctrine service from the `kernel.container` and not just "a new
one". A new one wouldn't have all services and stuff already define as the original one would have.

> Extra: using the `fn() => ...` as value when doing `addMappingInterface()` is to delay the execution of getContainer()
> till later when is really needed as a "lazy loading".
