---
title: Extensions and plugins
description: Run post-bootstrap logic, decorate services, extend configuration, and register application handlers.
---

# Extensions and plugins

Pick the narrowest extension point for the job:

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

A plugin runs custom logic right after Gacela boots. Add one with `addPlugin()`.

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

A plugin class must be invokable. Gacela resolves its dependencies automatically, as long as you define them as
[bindings](/docs/bindings). The same applies to a callable's arguments.

For example, `ApiRoutesPlugin` in its own file:

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

A plugin runs once at bootstrap. A **plugin stack** is different: it holds every implementation of one interface, in
declaration order, resolved lazily and read back typed. Declare it with the interface it accepts:

```php [gacela.php]
return static function (GacelaConfig $config): void {
    $config->addPluginStack(Discount::class, [
        StaffDiscount::class,
        TenPercentOff::class,
    ]);
};
```

Read it in the Factory with `getPluginStack()`. It returns a `PluginStack`: countable, iterable, and typed through the
contract.

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

Order matters: members run in declaration order. Repeated `addPluginStack()` calls for one contract **append**. That
is how a project adds a member to a stack a package declared. A class declared by both keeps the position its first
declarer gave it.

Members resolve on first use, not at registration. A class that does not exist, or does not implement the contract,
throws at that point. Run [`doctor`](/docs/cli#doctor) to find both at diagnostic time instead.

A member can also join from its own class with `#[Plugin]`, with no line in `gacela.php`: [since 2.5]

```php
use Gacela\Framework\Attribute\Plugin;

#[Plugin(Discount::class, priority: 10)]
final class LoyaltyDiscount implements Discount {}
```

You still declare the stack, empty if the attributes fill it: `addPluginStack(Discount::class, [])`. Reading a stack
nobody declared throws, and the message names the `#[Plugin]` classes waiting for it. [since 2.6] Declared members
come first, then attribute members by `priority`, highest first. `cache:warm --attributes` stores them, and
[`debug:plugins`](/docs/cli#debug-plugins) lists every member and where it was declared. The
[upstream guide](https://github.com/gacela-project/gacela/blob/main/docs/getting-a-dependency.md#typed--every-implementation-of-one-interface)
covers scanning rules and caching.

Pick a stack when the contract is an interface and you want every implementation of it:

| Question the consumer asks             | Use                                                            |
|----------------------------------------|----------------------------------------------------------------|
| Which implementation matches this key? | [Handler registry](#handler-registry)                          |
| Give me all of these                   | [Tags](/docs/getting-dependencies#collect-implementations)      |
| Give me every implementation, typed    | `addPluginStack()`                                             |

## Extend Service

```php
extendService(string $id, Closure $service);
```

`extendService()` alters any service. It takes the service id defined in any `Provider`, and a `callable` that
receives the service as its first argument and the `Container` as its second.

### An example

Take a module with this `Provider`, `Factory` and `Facade`:

- The `Provider` defines the service `'ARRAY_OBJ'`, an `ArrayObject` holding `[1, 2]` (see `Module/Provider.php`).
- `gacela.php` extends `'ARRAY_OBJ'` and appends `3`.
- Resolving it through the Facade returns `[1, 2, 3]` (see `index.php`).

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

`extendService()` wraps an id **wherever it is registered**. If two modules reuse an un-namespaced key such as
`'LABEL'`, both get wrapped, which is rarely what you want. `extendProviderService()` names the Provider and wraps the
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

The closure takes the same two arguments as `extendService()`: the service and the module's `Container`. Extensions
stack in declaration order. Naming a Provider the application does not have changes nothing; it does not fail.

It also gives a narrower diagnostic. [`doctor`](/docs/cli#doctor) reports an id the **named** Provider never `set()`s.
An app-wide extension on a mistyped id can only be reported as matching nothing anywhere.

## Extend Gacela Config

```php
extendGacelaConfig(string $configClass);
extendGacelaConfigs(array $list);
```

`extendGacelaConfig()` extends `GacelaConfig` from other places. The class must be invokable, and it receives the
`GacelaConfig` object:

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

Declare a build-time dispatch table. The container resolves it under `$registryKey` as a `HandlerRegistry`, which
instantiates each handler through the container on first access. Registries are frozen after boot: there is no runtime
`register()` method.

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

Register a per-module health check. The `doctor` command and the `HealthChecker` aggregate every registered check.
The [Module health checks](/docs/health-checks) page has the details.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addHealthCheck(DatabaseHealthCheck::class);
  $config->addHealthCheck(new CacheHealthCheck($redis));
};
```
