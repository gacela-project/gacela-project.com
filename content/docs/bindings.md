---
title: Bindings and container services
description: Configure bindings, service lifetimes, aliases, tags, hooks, contextual wiring, and definitions.
---

# Bindings and container services

Use application-wide bindings when a dependency policy applies across modules. For a dependency owned by one module, prefer its [Provider](/docs/provider). All bindings are configured through `GacelaConfig`, either in `gacela.php` or the `Gacela::bootstrap()` closure.

| Need | API | Lifetime |
|---|---|---|
| Map an interface or ID to a service | `addBinding()` | Shared in its container scope |
| Create a new value for every resolution | `addFactory()` | New instance |
| Defer an expensive factory | `addLazy()` | New instance; deferred |
| Store a closure as a value | `addProtected()` | The closure itself |
| Use a different implementation for one consumer | `when()->needs()->give()` | Follows the supplied service |
| Collect implementations | `tag()` | Lazy iterable |

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

In the example above, whenever `AbstractString` is found then `StringClass` will be resolved.

### Runtime values from bootstrap

```php
addExternalService(string $key, $value);
```

Use external services to share runtime objects between the bootstrap closure and `gacela.php`. For example:

```php
<?php # index.php

$instance = ...;

Gacela::bootstrap(__DIR__, function (GacelaConfig $config) use ($instance) {
  $config->addExternalService('concreteClass', ConcreteClass::class);
  $config->addExternalService('concreteInstance', $instance);
});
```

Read the same instance from `gacela.php`:
```php
<?php # gacela.php

return static function (GacelaConfig $config): void {
  $instance = $config->getExternalService('concreteInstance');

  $config->addBinding(AnInterface::class, $instance);
  $config->addBinding(AnotherInterface::class, $instance);
};
```

In the example above, both `AnInterface` and `AnotherInterface` resolve to the same shared `$instance` pulled from `getExternalService('concreteInstance')`.

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

Every call to `$container->get('session')` returns a fresh `SessionHandler`. The closure may type-hint `Container` to resolve its own dependencies.

## Lazy Services

```php
addLazy(string $id, Closure $factory);
```

Runtime behaviour is the same as `addFactory` — the closure is deferred out of bootstrap and runs on **every** resolve, returning a new instance each time — but the name documents the intent: skip building an expensive service until something first asks for it.

```php
<?php # gacela.php

use Gacela\Framework\Container\Container;

return function (GacelaConfig $config) {
  $config->addLazy(ReportBuilder::class, fn (Container $c) =>
    new ReportBuilder($c->get(DatabaseInterface::class))
  );
};
```

Nothing is built at bootstrap; the first `$container->get(ReportBuilder::class)` invokes the closure, and each later resolve builds a fresh instance. Reach for `addLazy` over `addFactory` when the intent is deferring a costly construction; they are otherwise interchangeable.

Gacela 2.0 also honors the container's `#[Lazy]` class attribute and `Container::lazy()`. These return an instance whose constructor is deferred until the object is used on PHP 8.4+. On PHP 8.3 the same declaration is accepted but construction is eager. Unlike `addLazy()`, the class-level lazy service follows the class's normal lifetime rather than acting as a fresh-instance factory.

```php
use Gacela\Container\Attribute\Lazy;

#[Lazy]
final class ExpensiveReport
{
    // ...
}
```

The attribute is honored by normal container resolution and `AbstractFactory::make()`.

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

## Resolution hooks

```php
afterResolving(string $id, Closure $callback);
```

Run a callback against a resolved object without replacing it:

```php
$config->afterResolving(
    LoggerAwareInterface::class,
    static fn (LoggerAwareInterface $service) => $service->setLogger($logger),
);
```

The id may be an interface, so one hook can cover every implementation. Hooks fire in registration order for top-level `get()`, `getOrFail()`, and `make()` resolutions, but not for a nested constructor dependency.

A hook runs **once per resolution, not once per instance**. Fetching a shared service three times runs the callback three times on the same object, so callbacks must be safe to repeat. A callback that throws evicts the affected instance. Use `extendService()` when you need to replace or decorate the returned object, and an event listener when you only need to observe resolution.

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

Contextual bindings win over the global `addBinding()` for the same interface. For a per-parameter alternative driven by an attribute, see [`#[Inject]`](/docs/inject).

### Binding scalar parameters by name

```php
when(string $concrete)->needs(string $parameterName)->give(mixed $value);
```

`needs()` accepts a parameter name string of the form `'$parameterName'` (note the leading `$`), binding a scalar value to that constructor parameter **by name** instead of by type.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->when(RetryingHttpClient::class)
    ->needs('$maxRetries')   // constructor parameter named $maxRetries
    ->give(30);              // inject the scalar 30
};
```

Class and interface names passed to `needs()` bind by type; a `'$name'` string binds that scalar constructor parameter by name instead. `give()` accepts the scalar directly (int, string, bool, array, etc.) and injects it as-is.

Contextual bindings apply to Gacela pillar classes (Factories, Configs, and Providers) as well as ordinary autowired classes.

## Definitions as data

`loadDefinitions()` registers wiring from an inline array, a PHP file returning an array, or a JSON file:

```php
$config->loadDefinitions([
    LoggerInterface::class => FileLogger::class,
    Database::class => ['singleton' => DatabasePool::class],
    'db.dsn' => ['value' => 'pgsql://localhost/app'],
    'logger' => ['alias' => LoggerInterface::class],
    Metrics::class => [
        'singleton' => Metrics::class,
        'tags' => ['reporters'],
    ],
]);

$config->loadDefinitions(__DIR__ . '/config/services.json');
```

Sources apply in declaration order and **after** imperative registrations, so later sources override earlier ones and definitions override `addBinding()`. Tags accumulate instead of replacing prior entries. Paths are used exactly as passed, so use `__DIR__`; missing, unreadable, or invalid files throw.

Definitions loaded through `GacelaConfig` are app-wide. A Provider can keep definitions within its own module scope with `$container->load([...])` or `$container->loadFile(__DIR__ . '/services.php')`. Each registered id emits `BindingRegisteredEvent`, like an imperative binding. YAML is not built in; parse it yourself and pass the resulting array:

```php
$config->loadDefinitions(Yaml::parseFile(__DIR__ . '/services.yaml'));
```

## Service tags

Group services under a label when a consumer needs every implementation:

```php
$config->tag(
    [NotEmptyValidator::class, EmailValidator::class],
    'validators',
);
```

Resolve the iterable with `$container->tagged('validators')`. `taggedByKey()` and `taggedKeys()` are also forwarded by Gacela 2.0. App-wide tags reach every module scope; a tag added with `$container->tag()` from a Provider stays local to that module. Repeated registrations accumulate and duplicate ids are yielded once.

Use tags for an unkeyed set you iterate. Use [`addHandlerRegistry()`](/docs/extensions#handler-registry) when callers select one handler by business key.

## Advanced container surface

Gacela 2.0 forwards the complete container 2.x API. Most applications should use the higher-level configuration above, but advanced integrations can call:

- `provides()`, `taggedByKey()`, `taggedKeys()`, `lazy()`, and `createScope()`.
- `writeCompiledCache()`, `writeCompiledFactories()`, `useCompiledFactories()`, and `compileReport()` for opt-in compiled constructor plans.
- `getStats()` for the legacy untyped array or `stats()` for the stable `ContainerStats` object.

Compiled plans are intentionally off by default: loading a 300-class plan file measured slower than reflecting those classes in the 2.0 release tests. The shared in-process `PlanCache` removes repeated reflection across module scopes without disk I/O. `resetStaticCaches()` is available for explicit low-level cleanup; normal application code should use `Gacela::resetCache()` or `cache:clear`.

## Array access on the container

```php
Container implements ArrayAccess
```

The main [`Container`](/docs/bootstrap#gacela-container) implements PHP's `ArrayAccess`, giving terse sugar over the usual `get()` / `set()` / `has()` operations.

```php
<?php

$container = Gacela::container();

$container[LoggerInterface::class] = FileLogger::class; // assignment   → register a binding
$logger = $container[LoggerInterface::class];           // offsetGet    → resolve the service
isset($container[LoggerInterface::class]);              // offsetExists → can get() resolve it?
unset($container[LoggerInterface::class]);              // offsetUnset  → remove the binding
```

It is purely ergonomic. In container 2.x, `has()` follows PSR-11 semantics: it returns true when `get()` can resolve the id, including an autowirable unregistered class. Use `provides()` when you specifically need to know whether this container owns a binding or instance.
