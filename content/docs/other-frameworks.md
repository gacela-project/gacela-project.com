+++
title = "Other Frameworks"
weight = 7
+++

Gacela is very extensible. This means, you can use it within another framework like Laravel or Symfony, for example.
You need to bootstrap Gacela at the same time you are initializing the framework, usually, in the entry point of your application.

>  For example in Symfony `public/index.php` and `bin/console`. 
> 
> Or, in the case of Laravel, `/bootstrap/app.php`.

## Example projects

- Symfony: [https://github.com/gacela-project/symfony-gacela-example](https://github.com/gacela-project/symfony-gacela-example)
- Laravel: [https://github.com/gacela-project/laravel-gacela-example](https://github.com/gacela-project/laravel-gacela-example)

## Tricks

#### Use Symfony Doctrine Entity Manager

Create a binding between the `EntityManagerInterface::class` and the `'doctrine.orm.entity_manager'` from the Symfony Kernel.
This way 
```php
<?php # public/index.php

// ...
$kernel = new \App\Kernel($_SERVER['APP_ENV']);

Gacela::bootstrap($appRootDir, function(GacelaConfig $config) use ($kernel) {
    
    $config->addBinding(ProductRepositoryInterface::class, ProductRepository::class);

    $config->addBinding(
        EntityManagerInterface::class,
        static fn() => $kernel->getContainer()->get('doctrine.orm.entity_manager')
    );
});
// ...
```
