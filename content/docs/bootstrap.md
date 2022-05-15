+++
title = "Bootstrap"
weight = 1
+++

## Initializing Gacela

Gacela should be bootstrapped using the `Gacela::bootstrap` function.<br>
- The first parameter is the application root directory and is mandatory.
- The second one is an optional `callable(GacelaConfig)` configuration.

```php
<?php # index.php

Gacela::bootstrap($appRootDir);
```

## callable(GacelaConfig)

You can customize some Gacela behaviours while bootstrapping without the need of a `gacela.php` in the root of your project,
however, if this file exists, it will be combined with the configuration from `Gacela::bootstrap()`.<br/>
It is not mandatory but recommended having a `gacela.php` file in order to decouple and centralize the custom Gacela configuration.

In other words, you can modify some Gacela behaviour from two different places:

1. Directly with `Gacela::bootstrap()`
2. Or using `gacela.php`

The default behaviour for the `callable(GacelaConfig)` when you don't define anything. 

### Directly passing it as 2nd argument to `Gacela::bootstrap()`

```php
<?php # index.php

// This is the default configuration.
$configFn = function (GacelaConfig $config) {
    $config->addAppConfig(
        'config/*.php',
        'config/override.php',
        PhpConfigReader::class
    );
});

Gacela::bootstrap($appRootDir, $configFn);
```

### Using `gacela.php` returning a `callable(GacelaConfig)` function. 

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
        ->addSuffixTypeDependencyProvider('DependencyProviderFromBootstrap')

        // Define the mapping between interfaces and concretions,
        // so Gacela services will auto-resolve them automatically.
        ->addMappingInterface(GeneratorInterface::class, ConcreteGenerator::class)
        ->addMappingInterface(CustomInterface::class, $config->getExternalService('CustomClassKey'));
};
```

## A complete example using gacela.php

### Accessing a Doctrine-Repository from a Gacela-Factory

The Gacela Factory has auto-wiring that will resolve its dependencies.
The only exception is for interfaces, because there is no way to discover what want to inject there.
For this purpose, you need to define the mapping between the interfaces and to what do you want them to be resolved.

```php
<?php # index.php

namespace Symfony\Component\HttpKernel\Kernel;
# ...
$kernel = new Kernel($_SERVER['APP_ENV'], (bool)$_SERVER['APP_DEBUG']);

$configFn = fn (GacelaConfig $config) => $config
    ->addExternalService('symfony/kernel', $kernel);

Gacela::bootstrap($appRootDir, $configFn);
```

```php
<?php # gacela.php

return function (GacelaConfig $config) {
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

In our current example (using symfony) we want to use the doctrine service from the kernel.container and not just "a new
one". A new one wouldn't have all services and stuff already define as the original one would have.

> Extra: using the fn() => ... as value when doing addMappingInterface() is to delay the execution of getContainer() till
> later when is really needed as a "lazy loading".