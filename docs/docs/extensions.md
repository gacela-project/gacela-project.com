# Extensions & Plugins

Gacela provides several extension points to run custom logic after bootstrap, modify service behavior, and register domain-specific handlers.

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

The class must be invokable, and it has autoload capabilities: all dependencies will be resolved automatically as soon as you have defined them using [bindings](/docs/bindings). The same applies to the callable arguments above.

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

## Extend Service

```php
extendService(string $id, Closure $service);
```

Extend any service functionality. The `extendService()` receives the service name that will be defined in any `Provider`, and a `callable` which receives the service itself as 1st arg, and the `Container` as 2nd arg.

### An example

Consider we have a module with these `Provider`, `Factory` and `Facade`.

The `Provider` has a service defined `'ARRAY_OBJ'` which is an `ArrayObject` with values `[1, 2]` (see `Module/Provider.php`)

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
Gacela::bootstrap(__DIR__, function (GacelaConfig $config) {
  $config->extendService(
    Provider::ARRAY_OBJ,
    function (ArrayObject $arrayObject, Container $container) {
      $arrayObject->append(3);
    }
  );
});

/************************************************************************/
# index.php
$facade = new Module\Facade();
$facade->getArrayAsObject(); // === new ArrayObject([1, 2, 3])
```

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

### Having this other class somewhere else:
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

Declare a build-time dispatch table. The registry is resolvable from the container under `$registryKey` and returns a `HandlerRegistry` that lazy-instantiates each handler through the container on first access. Registries are frozen after boot — there is no runtime `register()` method.

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

Register a per-module health check. All registered checks are aggregated by the `doctor` command and the `HealthChecker`. See the full [Module health checks](/docs/health-checks) page.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addHealthCheck(DatabaseHealthCheck::class);
  $config->addHealthCheck(new CacheHealthCheck($redis));
};
```
