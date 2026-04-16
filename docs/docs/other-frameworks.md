# Other Frameworks

Gacela is very extensible. This means, you can use it within another framework like Laravel or Symfony, for example.
You need to bootstrap Gacela at the same time you are initializing the framework, usually, in the entry point of your application.

::: tip
For example in Symfony `public/index.php` and `bin/console`.

Or, in the case of Laravel, `/bootstrap/app.php`.
:::

## Example projects

- Symfony: [https://github.com/gacela-project/symfony-gacela-example](https://github.com/gacela-project/symfony-gacela-example)
- Laravel: [https://github.com/gacela-project/laravel-gacela-example](https://github.com/gacela-project/laravel-gacela-example)

## Symfony bridge

The `gacela/symfony-bridge` package provides a compiler pass that routes `#[Inject]` parameters through Gacela's container in Symfony apps.

Install the bridge:

```bash
composer require gacela/symfony-bridge
```

Register the compiler pass in your kernel or bundle:

```php
use Gacela\SymfonyBridge\DependencyInjection\GacelaInjectCompilerPass;

final class AppKernel extends Kernel
{
    protected function build(ContainerBuilder $container): void
    {
        $container->addCompilerPass(new GacelaInjectCompilerPass());
    }
}
```

The compiler pass rewrites Symfony service definitions so constructor parameters annotated with `#[Inject]` resolve via Gacela's container (`[@gacela.container, 'get']`). If a parameter already has a Symfony argument configured, the build fails with a clear conflict message.

See the [Inject attribute](/docs/inject) page for the full `#[Inject]` reference.

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