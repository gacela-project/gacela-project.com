+++
title = "Symfony"
weight = 7
+++

### Example: Symfony & Gacela

[https://github.com/gacela-project/symfony-gacela-example](https://github.com/gacela-project/symfony-gacela-example)

### Accessing a Doctrine-Repository from a Gacela-Factory

The Gacela Factory has auto-wiring that will resolve its dependencies.
The only exception is for interfaces, because there is no way to discover what want to inject there.
For this purpose, you need to define the mapping between the interfaces and to what do you want them to be resolved.

```php
<?php # index.php

namespace Symfony\Component\HttpKernel\Kernel;
# ...
$kernel = new Kernel($_SERVER['APP_ENV'], (bool)$_SERVER['APP_DEBUG']);

Gacela::bootstrap(
  __DIR__, 
  function (GacelaConfig $config) use ($kernel): void {
    $config->addExternalService('symfony/kernel', $kernel);
  }
);
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
one". A new one wouldn't have all services and stuff already defined as the original one would have.

> Extra: using the `fn() => ...` as value when doing `addMappingInterface()` allows us to delay the execution of getContainer() to when it is really needed i.e. "lazy loading".
