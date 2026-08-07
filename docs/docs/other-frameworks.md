---
title: Framework integration
description: "Run Gacela inside an existing Laravel or Symfony app: bootstrap from your entry point, honor #[Inject] through Symfony's container with the bridge, and share host services like Doctrine's EntityManager."
head:
  - - meta
    - property: og:title
      content: "Using Gacela with Laravel and Symfony"
  - - meta
    - property: og:description
      content: "Bootstrap Gacela inside Laravel or Symfony, wire #[Inject] through Symfony's container with the bridge, and share host services like Doctrine's EntityManager."
---

# Framework integration

Gacela can run inside an existing Laravel or Symfony application. Bootstrap it beside the host framework, then bridge only the services that cross the boundary. Your Gacela [modules](/docs/quickstart) remain independent of the host framework.

::: tip Where to bootstrap
- **Symfony** — `public/index.php` and `bin/console`
- **Laravel** — `bootstrap/app.php`
:::

## Example projects

Working, minimal integrations you can clone and run:

- **Laravel** — [gacela-project/laravel-gacela-example](https://github.com/gacela-project/laravel-gacela-example)
- **Symfony** — [gacela-project/symfony-gacela-example](https://github.com/gacela-project/symfony-gacela-example)

## Laravel

Bootstrap Gacela in `bootstrap/app.php`, then call your modules' [Facades](/docs/facade) anywhere in the app. Interface-to-implementation wiring uses the same [bindings](/docs/bindings) as standalone Gacela — no Laravel-specific glue required. The [example project](https://github.com/gacela-project/laravel-gacela-example) shows a complete setup.

## Symfony

### Symfony bridge

The `gacela-project/symfony-bridge` package ships a compiler pass that teaches Symfony's own container to honor Gacela's [`#[Inject]`](/docs/inject) attribute on **Symfony-managed** services — typically `Command` and `Controller` classes. Without it, Symfony's autowiring claims the constructor parameter first and Gacela never gets a chance to resolve it.

::: warning Not yet on Packagist
`gacela-project/symfony-bridge` is not published on Packagist yet — it currently lives inside the [gacela monorepo](https://github.com/gacela-project/gacela/tree/main/symfony-bridge). The `composer require` below will work once the package is released.
:::

Install the bridge:

```bash
composer require gacela-project/symfony-bridge
```

Register the compiler pass in your kernel or bundle:

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

At compile time the pass walks every service definition and rewrites each constructor parameter annotated with `#[Inject]` so Symfony resolves that slot via Gacela's container (`[@gacela.container, 'get']`) instead of its own autowiring. If a parameter already has a Symfony argument configured, the build fails with a clear conflict message naming the service and parameter.

See the [Inject attribute](/docs/inject) page for the full `#[Inject]` reference.

### Share Symfony's Doctrine EntityManager

Bind `EntityManagerInterface::class` to Symfony's `'doctrine.orm.entity_manager'` service, so your Gacela modules resolve the **same** managed entity manager the framework already configures:

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

Now any module that type-hints `EntityManagerInterface` receives Symfony's managed instance — its connection, transactions and configuration all stay under Symfony's control.
