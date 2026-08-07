---
title: Framework integration
description: Bootstrap Gacela inside Laravel or Symfony while keeping framework services at the module boundary.
---

# Framework integration

Gacela runs beside Laravel or Symfony rather than replacing them. The host framework owns HTTP, console, and lifecycle integration; Gacela owns module boundaries. Bridge only the services that cross between those responsibilities.

::: tip Where to bootstrap
- **Symfony** — `public/index.php` and `bin/console`
- **Laravel** — `bootstrap/app.php`
:::

## Example projects

Cloneable minimal integrations:

- **Laravel** — [gacela-project/laravel-gacela-example](https://github.com/gacela-project/laravel-gacela-example)
- **Symfony** — [gacela-project/symfony-gacela-example](https://github.com/gacela-project/symfony-gacela-example)

## Laravel

Bootstrap Gacela in `bootstrap/app.php`, then call module [Facades](/docs/facade) from Laravel entry points. Keep Laravel services behind interfaces registered through [bindings](/docs/bindings). The [Laravel example](https://github.com/gacela-project/laravel-gacela-example) contains the complete setup.

## Symfony

### Symfony bridge preview

The bridge teaches Symfony's container to honor Gacela's [`#[Inject]`](/docs/inject) attribute on Symfony-managed commands and controllers.

::: warning Preview, not an installable release
`gacela-project/symfony-bridge` currently lives in the [Gacela repository](https://github.com/gacela-project/gacela/tree/main/symfony-bridge) and is not published on Packagist. Do not add it to production Composer requirements yet. The stable approach is constructor injection with services explicitly shared between the two containers.
:::

When evaluating the bridge from the monorepo, register its compiler pass in the kernel or bundle:

```php
use Gacela\SymfonyBridge\GacelaInjectCompilerPass;
use Symfony\Component\DependencyInjection\ContainerBuilder;

final class AppKernel extends Kernel
{
    protected function build(ContainerBuilder $container): void
    {
        $container->addCompilerPass(new GacelaInjectCompilerPass());
    }
}
```

At compile time, the pass rewrites `#[Inject]` constructor parameters to resolve through Gacela. It rejects parameters that already have an explicit Symfony argument, preventing ambiguous ownership.

See the [Inject attribute](/docs/inject) page for the full `#[Inject]` reference.

### Share Symfony's Doctrine EntityManager

Bind `EntityManagerInterface::class` to Symfony's managed service so Gacela modules share the same connection and transactions:

```php
<?php # public/index.php

// ...
$kernel = new \App\Kernel($_SERVER['APP_ENV']);

Gacela::bootstrap($appRootDir, function (GacelaConfig $config) use ($kernel) {
    $config->addBinding(ProductRepositoryInterface::class, ProductRepository::class);

    $config->addBinding(
        EntityManagerInterface::class,
        static fn () => $kernel->getContainer()->get('doctrine.orm.entity_manager'),
    );
});
// ...
```

Modules that type-hint `EntityManagerInterface` now receive Symfony's managed instance. Symfony remains responsible for its lifecycle and configuration.
