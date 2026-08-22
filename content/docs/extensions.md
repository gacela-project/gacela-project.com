---
title: Extensions and plugins
description: Run post-bootstrap logic, decorate services, extend configuration, and register application handlers.
---

# Extensions and plugins

Use the narrowest extension point that matches the job:

| Need                                          | Extension point           |
|-----------------------------------------------|---------------------------|
| Run setup after bootstrap                     | Plugin                    |
| Decorate or alter one service                 | `extendService()`         |
| Decorate a service in one module only         | `extendProviderService()` |
| Collect every implementation of one interface | `addPluginStack()`        |
| Add a reusable configuration bundle           | `extendGacelaConfig()`    |
| Resolve keyed domain handlers                 | Handler registry          |

## Plugins

```php
addPlugin(callable|class-string $plugin);
addPlugins(array $list);
```

Run custom logic right after bootstrapping gacela by adding plugins using the `addPlugin` method.

```php
<?php # index.php

Gacela::bootstrap(__DIR__, function (GacelaConfig $config) {
  // using a callable
  $config->addPlugin(function (RouterInterface $router) {
    $router->configure(function (Routes $routes) {
      $routes->get('/uri', YourController::class, 'uriAction');
    });
  });

  // or using a class name
  $config->addPlugin(ApiRoutesPlugin::class);
});
```

The class must be invokable, and it has autoload capabilities: all dependencies will be resolved automatically as soon
as you have defined them using [bindings](/docs/bindings). The same applies to the callable arguments above.

For example, having this other class `ApiRoutesPlugin` somewhere else:

```php
<?php # ApiRoutesPlugin.php

final class ApiRoutesPlugin
{
  public function __invoke(RouterInterface $router): void
  {
    $router->configure(function (Routes $routes): void {
      $routes->get('{name}', HelloController::class);
    });
  }
}
```

## Plugin stacks [since 2.3]

```php
addPluginStack(string $contract, array $plugins);
```

A plugin runs once at bootstrap. A **plugin stack** is the other shape: every implementation of one interface, in
declaration order, resolved lazily and read back typed. Declare the extension point with the interface it accepts:

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->addPluginStack(Discount::class, [
        StaffDiscount::class,
        TenPercentOff::class,
    ]);
};
```

Read it in the Factory with `getPluginStack()`, which returns a `PluginStack`: countable, iterable, and typed through
the contract.

```php [Checkout/CheckoutFactory.php]
final class CheckoutFactory extends AbstractFactory
{
    public function createDiscounts(): PluginStack
    {
        return $this->getPluginStack(Discount::class);
    }
}
```

```php [Checkout/CheckoutFacade.php]
public function priceOf(int $cents): int
{
    foreach ($this->getFactory()->createDiscounts() as $discount) {
        $cents = $discount->apply($cents);
    }

    return $cents;
}
```

Order is observable, so declaration order is the order the members run in. Repeated `addPluginStack()` calls for one
contract **append**, which is how a project adds a member to a stack a package declared; a class declared by both keeps
the position the first declarer gave it.

Members resolve on first use, not at registration. A class that does not exist, or that does not implement the
contract, throws then. Run [`doctor`](/docs/cli#doctor) to find both at diagnostic time instead.

Pick a stack over the alternatives when the contract is an interface and you want all of it:

| Question the consumer asks             | Use                                                            |
|----------------------------------------|----------------------------------------------------------------|
| Which implementation matches this key? | [Handler registry](#handler-registry)                          |
| Give me all of these                   | [Tags](/docs/getting-dependencies#collect-implementations)      |
| Give me every implementation, typed    | `addPluginStack()`                                             |

## Extend Service

```php
extendService(string $id, Closure $service);
```

Extend any service functionality. The `extendService()` receives the service name that will be defined in any
`Provider`, and a `callable` which receives the service itself as 1st arg, and the `Container` as 2nd arg.

### An example

Consider we have a module with these `Provider`, `Factory` and `Facade`.

The `Provider` has a service defined `'ARRAY_OBJ'` which is an `ArrayObject` with values `[1, 2]` (see
`Module/Provider.php`)

We "extend" that service `'ARRAY_OBJ'` and appending `3` (see `gacela.php`)

Its state when using the Facade and resolving that will be `[1, 2, 3]` (see `index.php`)

```php
<?php 

/************************************************************************/
# Module/Provider.php
final class Provider extends AbstractProvider
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
    return $this->getProvidedDependency(Provider::ARRAY_OBJ);
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
return function (GacelaConfig $config) {
  $config->extendService(
    Provider::ARRAY_OBJ,
    function (ArrayObject $arrayObject, Container $container) {
      $arrayObject->append(3);
    }
  );
};

/************************************************************************/
# index.php
$facade = new Module\Facade();
$facade->getArrayAsObject(); // === new ArrayObject([1, 2, 3])
```

## Extend one Provider's service [since 2.3]

```php
extendProviderService(string $providerClass, string $id, Closure $service);
```

`extendService()` wraps an id **wherever it is registered**. Two modules reusing an un-namespaced key such as
`'LABEL'` both get wrapped, which is rarely what you meant. `extendProviderService()` names the Provider and wraps the
id only there:

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->extendProviderService(
        CatalogProvider::class,
        CatalogProvider::LABEL,
        static fn (array $labels): array => [...$labels, 'wrapped'],
    );
};
```

The Catalog module now sees the wrapped value. A Checkout module registering its own `'LABEL'` is untouched.

The closure takes the same two arguments as `extendService()`: the service, and the module's `Container`. Extensions
stack in declaration order. Naming a Provider the application does not have changes nothing rather than failing.

This is also the narrower diagnostic. [`doctor`](/docs/cli#doctor) reports an id the **named** Provider never `set()`s,
where an app-wide extension on a mistyped id can only be reported as matching nothing anywhere.

## Extend Gacela Config

```php
extendGacelaConfig(string $configClass);
extendGacelaConfigs(array $list);
```

Extend `GacelaConfig` from different places using the `extendGacelaConfig` method.

The class must be invokable, and it will receive the GacelaConfig object. For example:

```php
<?php # index.php

Gacela::bootstrap(__DIR__, function (GacelaConfig $config) {
  $config->extendGacelaConfig(RouterConfig::class);
});
```

The invokable config class, defined elsewhere:

```php
<?php

final class RouterConfig
{
  public function __invoke(GacelaConfig $config): void
  {
    $router = new Router();

    $config->addBinding(Router::class, $router);
    $config->addBinding(RouterInterface::class, $router);
  }
}
```

## Handler Registry

```php
addHandlerRegistry(string $registryKey, array<string|int,class-string> $handlers);
```

Declare a build-time dispatch table. The registry is resolvable from the container under `$registryKey` and returns a
`HandlerRegistry` that lazy-instantiates each handler through the container on first access. Registries are frozen after
boot. There is no runtime `register()` method.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addHandlerRegistry(PaymentGatewayInterface::class, [
    'stripe' => StripeGateway::class,
    'paypal' => PaypalGateway::class,
  ]);
};
```

## Health Check Registration

```php
addHealthCheck(class-string|ModuleHealthCheckInterface $check);
```

Register a per-module health check. All registered checks are aggregated by the `doctor` command and the
`HealthChecker`. See the full [Module health checks](/docs/health-checks) page.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addHealthCheck(DatabaseHealthCheck::class);
  $config->addHealthCheck(new CacheHealthCheck($redis));
};
```
