---
title: Framework integration
description: Run Gacela inside Laravel or Symfony with the bridges that ship in the framework package, or bootstrap by hand and share services explicitly.
---

# Framework integration

Gacela runs beside Laravel or Symfony rather than replacing them. The host framework owns HTTP, console, and lifecycle
integration; Gacela owns module boundaries. Bridge only the services that cross between those responsibilities.

Both bridges ship **inside the framework package**, so there is nothing extra to require: `composer require
gacela-project/gacela` brings them along. They are versioned with the framework and marked experimental, so their API
may still change between minors.

## Symfony: the GacelaBundle [since 2.2]

```php [config/bundles.php]
return [
    Gacela\SymfonyBridge\GacelaBundle::class => ['all' => true],
];
```

That alone gives you four things:

1. **Gacela bootstrapped from the kernel**, with the project dir as the application root, honouring `gacela.php`.
   Every boot bootstraps again, so a kernel rebooted inside one process (functional tests do it constantly) runs on
   its own configuration rather than the previous boot's.
2. **Symfony services reachable from Gacela**: the ones you list, and only those.
3. **Gacela's console commands in `bin/console`**, under a `gacela:` prefix.
4. **`cache:warmup` warms Gacela's caches too**, so a deploy has one warmup step instead of two.

Plus the `#[Inject]` compiler pass, described below.

```yaml [config/packages/gacela.yaml]
gacela:
    app_root_dir: '%kernel.project_dir%'   # where gacela.php lives
    cache_dir: '%kernel.cache_dir%/gacela'
    file_cache: true
    project_namespaces: ['App']
    external_services:
        logger: 'monolog.logger'
        entity_manager: 'doctrine.orm.entity_manager'
    register_commands: true
    command_prefix: 'gacela:'
```

Every key is validated at compile time: a mistyped one fails the build instead of quietly configuring nothing.
`cache_dir` and `file_cache` left unset leave Gacela's own defaults in place.

### External services

`external_services` maps a key to a Symfony service id. What the key *is* decides how far the service travels:

```yaml
gacela:
    external_services:
        Psr\Log\LoggerInterface: 'monolog.logger'   # a type: also bound
        report_mailer: 'app.mailer'                 # a plain key: external service only
```

A key that **names a class or interface** additionally becomes a Gacela [binding](/docs/bindings), so it resolves on
its own: through `Gacela::get()`, through autowiring, through [`#[Inject]`](/docs/inject).

A key that names **no type** stays an external service, which is what your own `gacela.php` reads when it declares
bindings, because a binding maps a *type* to an implementation and `report_mailer` is not one:

```php [gacela.php]
$config->addBinding(MailerInterface::class, $config->getExternalService('report_mailer'));
```

Either way the service is fetched through a service locator when Gacela asks for it, so listing one does not construct
it: booting the kernel stays as cheap as it was.

### Commands

The prefix is not decoration: Symfony's MakerBundle owns the whole `make:*` namespace, so an unprefixed `make:module`
would collide with it.

```bash
bin/console gacela:make:module App/Blog
bin/console gacela:doctor
bin/console list gacela
```

Set `register_commands: false` to leave `bin/console` alone and keep using `vendor/bin/gacela`.

### The `#[Inject]` compiler pass

Symfony autowires constructor parameters through its own container, and Gacela's `#[Inject]` attribute is recognised by
Gacela's container only. On a class managed by Symfony, most often a `Command`, writing `#[Inject]` therefore had no
effect: Symfony's autowire claimed the parameter first.

`GacelaInjectCompilerPass` walks every service definition at compile time, looks at each constructor parameter for
`#[Inject]`, and rewrites the argument so Symfony resolves that slot through Gacela's container instead. If both
containers claim the same parameter, the build fails naming the service and parameter.

The bundle registers the pass for you. To use it without the bundle:

```php
use Gacela\SymfonyBridge\GacelaInjectCompilerPass;

$container->addCompilerPass(new GacelaInjectCompilerPass());
$container->set('gacela.container', Gacela::container());
```

The Gacela container must be registered as a Symfony service named `gacela.container` so the rewritten arguments can
resolve through it at runtime.

## Laravel: the GacelaServiceProvider [since 2.2]

```php [bootstrap/providers.php]
return [
    Gacela\LaravelBridge\GacelaServiceProvider::class,
];
```

The same four things, against Laravel's lifecycle:

1. **Gacela bootstrapped when the application boots**, with `base_path()` as the application root, honouring
   `gacela.php`. Every boot bootstraps again, so an application rebooted inside one process runs on its own
   configuration. Note that Octane boots each worker once and reuses it: a request-scoped Laravel service listed in
   `external_services` stays whatever the worker's first boot captured.
2. **Laravel services reachable from Gacela**: the ones you list, and only those.
3. **Gacela's console commands in `artisan`**, under a `gacela:` prefix.
4. **`artisan optimize` warms Gacela's caches too**, so a deploy has one optimize step instead of two.
   `optimize:clear` clears them again.

```bash
php artisan vendor:publish --tag=gacela-config
```

```php [config/gacela.php]
return [
    'enabled' => true,
    'app_root_dir' => null,          // where gacela.php lives; null means base_path()
    'cache_dir' => null,             // null leaves Gacela's own default in place
    'file_cache' => null,            // null leaves Gacela's own default in place
    'project_namespaces' => ['App'],
    'external_services' => [
        'logger' => 'log',
        Psr\Log\LoggerInterface::class => 'log',
    ],
    'register_commands' => true,
    'command_prefix' => 'gacela:',
];
```

Every key is validated when the provider boots, naming a mistyped one instead of quietly configuring nothing. Laravel
has no compile step, so boot is the earliest the check can run. External services follow the same rule as the Symfony
bundle: a key that names a type is also bound, a plain key stays an external service, and either way the service is
fetched from Laravel's container lazily. Commands carry the `gacela:` prefix because artisan owns `make:*`.

### `#[Inject]` on Laravel-resolved services

Laravel autowires constructor parameters through its own container, so Gacela's `#[Inject]` used to have no effect on a
class managed by Laravel: a controller, a job, a command. The bridge closes that gap twice over.

**On a constructor parameter**, use the bridge's attribute with an explicit class. It implements Laravel's
`ContextualAttribute` contract, so Laravel itself resolves the parameter through Gacela, and because it extends the
Gacela attribute, Gacela honours it too on the classes *it* builds. One attribute, both containers:

```php
use Gacela\LaravelBridge\Attribute\Inject;

public function __construct(
    #[Inject(ProductFacade::class)] private ProductFacade $facade,
) {
}
```

The class is required there: Laravel hands a contextual attribute no parameter to read a type from. Leaving it off
fails with directions, not with a silently autowired substitute.

**On a property or a setter**, the bare form works, since the type is on the member. The provider listens to
`afterResolving` and injects into every instance Laravel builds, honouring the attribute under either namespace:

```php
use Gacela\Container\Attribute\Inject;

final class SyncStock implements ShouldQueue
{
    #[Inject]
    private ProductFacade $facade;
}
```

A `readonly` property is refused by name, since it cannot be written after construction, and so is a static or
non-public setter.

## Bootstrapping by hand

The bridges are convenience, not a requirement. Bootstrapping directly from your entry point keeps working and stays
the right call when you want full control over the boundary:

::: tip Where to bootstrap
- **Symfony**: `public/index.php` and `bin/console`
- **Laravel**: `bootstrap/app.php`
:::

Bind a host service explicitly so Gacela modules share the same instance. Symfony's Doctrine EntityManager is the
classic case, sharing one connection and one transaction scope:

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

Modules that type-hint `EntityManagerInterface` now receive Symfony's managed instance. Symfony remains responsible for
its lifecycle and configuration.

## Example projects

Cloneable minimal integrations:

- **Laravel** — [gacela-project/laravel-gacela-example](https://github.com/gacela-project/laravel-gacela-example)
- **Symfony** — [gacela-project/symfony-gacela-example](https://github.com/gacela-project/symfony-gacela-example)
