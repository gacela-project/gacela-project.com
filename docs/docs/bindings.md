# Bindings

Gacela's container supports several binding strategies. All are configured via `GacelaConfig` — either in `gacela.php` or the `Gacela::bootstrap()` closure.

## addBinding

```php
addBinding(string $key, string|object|callable $value);
```

Define a map between a type (class or interface) and the concrete class that you want to create (or use) when a certain type is found during the process of **auto-wiring** in a Gacela `Plugin` or `Locator's container` from any `Provider`.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addBinding(AbstractString::class, StringClass::class);
  $config->addBinding(ClassInterface::class, new ConcreteClass(/* args */));
  $config->addBinding(ComplexInterface::class, new class() implements Foo {/** logic */});
  $config->addBinding(FromCallable::class, fn() => new StringClass('From callable'));
};
```

In the example above, whenever `OneInterface::class` is found then `OneConcrete::class` will be resolved.

### Using externalServices

```php
addExternalService(string $key, $value);
```

Add the external service using `addExternalService(string, string|object|callable)`.
This is useful to share objects between the initial bootstrap callable and the `gacela.php` config files. Eg:

```php
<?php # index.php

$instance = ...;

Gacela::bootstrap(__DIR__, function (GacelaConfig $config) use ($instance) {
  $config->addExternalService('concreteClass', ConcreteClass::class);
  $config->addExternalService('concreteInstance', $instance);
});
```

This way we can access the value of that key `'concreteClass'` in the `gacela.php` from `$config->getExternalService(string)`.
For example:
```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $instance = $config->getExternalService('concreteInstance');

  $config->addBinding(AnInterface::class, $instance);
  $config->addBinding(AnotherInterface::class, $instance);
}
```

In the example above, whenever `AnInterface` is found then `ConcreteClass::class` will be resolved.
The same for `AnotherInterface`, the `$concreteInstance` will be used.

## Factory Services

```php
addFactory(string $id, Closure $factory);
```

Unlike regular bindings (which are singletons), factory services return a new instance every time they are resolved from the container.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addFactory('session', fn () => new SessionHandler());
};
```

Every call to `$container->get('session')` returns a fresh `SessionHandler`.

## Protected Services

```php
addProtected(string $id, Closure $service);
```

Store a closure **without invoking it**. Useful for callable configurations or lazy factories you want to trigger by hand.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addProtected('db.factory', fn () => new Database());
};
```

```php
$factory = $container->get('db.factory'); // the closure itself
$db      = $factory();                    // invoke when needed
```

Protected services cannot be extended via `extendService()`.

## Service Aliases

```php
addAlias(string $alias, string $id);
```

Reference the same service with a different name (useful for short names or backward-compatibility).

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addBinding(LoggerInterface::class, FileLogger::class);
  $config->addAlias('logger', LoggerInterface::class);
};
```

Both `$container->get(LoggerInterface::class)` and `$container->get('logger')` resolve to the same instance.

## Contextual Bindings

```php
when(string|array $concrete)->needs(string $abstract)->give(string|object|callable $concrete);
```

Provide different implementations of an interface depending on **which class is requesting it**.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->when(UserController::class)
    ->needs(LoggerInterface::class)
    ->give(FileLogger::class);

  $config->when(AdminController::class)
    ->needs(LoggerInterface::class)
    ->give(DatabaseLogger::class);

  // Bind multiple consumers at once
  $config->when([ApiController::class, WebController::class])
    ->needs(CacheInterface::class)
    ->give(RedisCache::class);
};
```

Contextual bindings win over the global `addBinding()` for the same interface.
