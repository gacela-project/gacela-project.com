---
title: Framework integration
description: Run Gacela inside Laravel or Symfony with the bridges that ship in the framework package, or bootstrap by hand and share services explicitly.
---

# Framework integration

Gacela runs beside Laravel or Symfony, not instead of them. The host framework owns HTTP, the console and the
lifecycle. Gacela owns module boundaries. Bridge only the services that cross between the two.

Both bridges ship **inside the framework package**, so there is nothing extra to require: `composer require
gacela-project/gacela` brings them along. They are versioned with the framework and marked experimental, so their API
may change between minors.

## Symfony: the GacelaBundle [since 2.2]

```php [config/bundles.php]
return [
    Gacela\SymfonyBridge\GacelaBundle::class => ['all' => true],
];
```

That alone gives you four things:

1. **Gacela bootstrapped from the kernel**, with the project dir as the application root, honouring `gacela.php`.
   Every boot bootstraps again, so a kernel rebooted inside one process (functional tests do it all the time) runs on
   its own configuration, not the previous boot's.
2. **Symfony services reachable from Gacela**: the ones you list, and only those.
3. **Gacela's console commands in `bin/console`**, under a `gacela:` prefix.
4. **`cache:warmup` warms Gacela's caches too**, so a deploy has one warmup step instead of two.

It also registers the `#[Inject]` compiler pass, described below. And it resets Gacela's request state on Symfony's
`kernel.reset`, so a worker such as FrankenPHP or RoadRunner starts each request clean. [since 2.6] See
[long-running runtimes](/docs/long-running-runtimes).

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

Every key is validated at compile time: a mistyped one fails the build instead of quietly configuring nothing. Leave
`cache_dir` and `file_cache` unset to keep Gacela's own defaults.

### External services

`external_services` maps a key to a Symfony service id. The kind of key decides how far the service travels:

```yaml
gacela:
    external_services:
        Psr\Log\LoggerInterface: 'monolog.logger'   # a type: also bound
        report_mailer: 'app.mailer'                 # a plain key: external service only
```

A key that **names a class or interface** also becomes a Gacela [binding](/docs/bindings), so it resolves on its own:
through `Gacela::get()`, through autowiring, through [`#[Inject]`](/docs/inject).

A key that names **no type** stays an external service. A binding maps a *type* to an implementation, and
`report_mailer` is not a type. Your own `gacela.php` reads it when it declares bindings:

```php [gacela.php]
$config->addBinding(MailerInterface::class, $config->getExternalService('report_mailer'));
```

Either way, a service locator fetches the service only when Gacela asks for it. Listing one does not construct it, so
booting the kernel stays as cheap as before.

### Commands

The prefix has a reason: Symfony's MakerBundle owns the whole `make:*` namespace, so an unprefixed `make:module` would
collide with it.

```bash
bin/console gacela:make:module App/Blog
bin/console gacela:doctor
bin/console list gacela
```

Set `register_commands: false` to leave `bin/console` alone and keep using `vendor/bin/gacela`.

### The `#[Inject]` compiler pass

Symfony autowires constructor parameters through its own container, and only Gacela's container recognises
`#[Inject]`. On a class Symfony manages, most often a `Command`, `#[Inject]` had no effect: Symfony's autowiring claimed
the parameter first.

`GacelaInjectCompilerPass` walks every service definition at compile time and checks each constructor parameter for
`#[Inject]`. It rewrites that argument so Symfony resolves it through Gacela's container. If both containers claim the
same parameter, the build fails and names the service and parameter.

A service built by a factory is left to its factory, and a `parent:` service is read through its parent, so the
attribute holds there too. [since 2.7]

The bundle registers the pass for you. To use it without the bundle:

```php
use Gacela\SymfonyBridge\GacelaInjectCompilerPass;

$container->addCompilerPass(new GacelaInjectCompilerPass());
$container->set('gacela.container', Gacela::container());
```

Register the Gacela container as a Symfony service named `gacela.container`, so the rewritten arguments can resolve
through it at runtime.

## Laravel: the GacelaServiceProvider [since 2.2]

```php [bootstrap/providers.php]
return [
    Gacela\LaravelBridge\GacelaServiceProvider::class,
];
```

The same four things, against Laravel's lifecycle:

1. **Gacela bootstrapped when the application boots**, with `base_path()` as the application root, honouring
   `gacela.php`. Every boot bootstraps again, so an application rebooted inside one process runs on its own
   configuration. Octane boots each worker once and reuses it, so a request-scoped Laravel service listed in
   `external_services` keeps whatever the worker's first boot captured.
2. **Laravel services reachable from Gacela**: the ones you list, and only those.
3. **Gacela's console commands in `artisan`**, under a `gacela:` prefix.
4. **`artisan optimize` warms Gacela's caches too**, so a deploy has one optimize step instead of two.
   `optimize:clear` clears them again.

The provider also resets Gacela's request state on each Octane `RequestReceived` and `RequestTerminated`. A request
that throws out of Octane's gateway leaks nothing into the next one. [since 2.6] See
[long-running runtimes](/docs/long-running-runtimes).

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

Every key is validated when the provider boots, and a mistyped one is named instead of quietly configuring nothing.
Laravel has no compile step, so boot is the earliest the check can run. External services follow the same rule as in
the Symfony bundle: a key that names a type is also bound, a plain key stays an external service, and either way the
service is fetched lazily from Laravel's container. Commands carry the `gacela:` prefix because artisan owns `make:*`.

### `#[Inject]` on Laravel-resolved services

Laravel autowires constructor parameters through its own container, so Gacela's `#[Inject]` used to have no effect on a
class Laravel manages: a controller, a job, a command. The bridge closes that gap in two ways.

**On a constructor parameter**, use the bridge's attribute with an explicit class. It implements Laravel's
`ContextualAttribute` contract, so Laravel itself resolves the parameter through Gacela. It also extends the Gacela
attribute, so Gacela honours it on the classes *it* builds. One attribute, both containers:

```php
use Gacela\LaravelBridge\Attribute\Inject;

public function __construct(
    #[Inject(ProductFacade::class)] private ProductFacade $facade,
) {
}
```

The class is required there, because Laravel gives a contextual attribute no parameter to read a type from. Leave it
off and you get an error with directions, not a silently autowired substitute.

**On a property or a setter**, the bare form works, because the member carries the type. The provider listens to
`afterResolving` and injects into every instance Laravel builds. It honours the attribute under either namespace:

```php
use Gacela\Container\Attribute\Inject;

final class SyncStock implements ShouldQueue
{
    #[Inject]
    private ProductFacade $facade;
}
```

It refuses a `readonly` property by name, because it cannot be written after construction. It refuses a static or
non-public setter the same way.

A property that holds null, such as `?ProductFacade $facade = null`, is injected, as Gacela's own container does. A
value the constructor set is kept. [since 2.7]

## Bootstrapping by hand

The bridges are a convenience, not a requirement. Bootstrapping from your entry point still works, and it is the right
call when you want full control over the boundary:

::: tip Where to bootstrap
- **Symfony**: `public/index.php` and `bin/console`
- **Laravel**: `bootstrap/app.php`
:::

Bind a host service explicitly so Gacela modules share the same instance. Symfony's Doctrine EntityManager is the
classic case: one connection and one transaction scope, shared:

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

Modules that type-hint `EntityManagerInterface` now receive Symfony's managed instance. Symfony still owns its
lifecycle and configuration.

## Example projects

Cloneable minimal integrations:

- **Laravel**: [gacela-project/laravel-gacela-example](https://github.com/gacela-project/laravel-gacela-example)
- **Symfony**: [gacela-project/symfony-gacela-example](https://github.com/gacela-project/symfony-gacela-example)
