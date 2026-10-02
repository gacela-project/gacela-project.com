---
title: Bindings and container services
description: Configure bindings, service lifetimes, aliases, tags, hooks, contextual wiring, and definitions.
---

# Bindings and container services

Use application-wide bindings when a dependency policy applies across modules. For a dependency one module owns,
prefer that module's [Provider](/docs/provider). You configure all bindings through `GacelaConfig`, in `gacela.php` or
the `Gacela::bootstrap()` closure.

| Need                                            | API                       | Lifetime                      |
|-------------------------------------------------|---------------------------|-------------------------------|
| Map an interface or ID to a service             | `addBinding()`            | Shared in its container scope |
| Create a new value for every resolution         | `addFactory()`            | New instance                  |
| Defer an expensive factory                      | `addLazy()`               | New instance; deferred        |
| Store a closure as a value                      | `addProtected()`          | The closure itself            |
| Use a different implementation for one consumer | `when()->needs()->give()` | Follows the supplied service  |
| Collect implementations                         | `tag()`                   | Lazy iterable                 |

## addBinding

```php
addBinding(string $key, string|object|callable $value);
```

Map a type (class or interface) to the concrete class to create (or use) when **auto-wiring** meets that type, in a
Gacela `Plugin` or in the `Locator's container` from any `Provider`.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addBinding(AbstractString::class, StringClass::class);
  $config->addBinding(ClassInterface::class, new ConcreteClass(/* args */));
  $config->addBinding(ComplexInterface::class, new class() implements Foo {/** logic */});
  $config->addBinding(FromCallable::class, fn() => new StringClass('From callable'));
};
```

Here, whenever auto-wiring meets `AbstractString`, it resolves `StringClass`.

### Runtime values from bootstrap

```php
addExternalService(string $key, $value);
```

External services share runtime objects between the bootstrap closure and `gacela.php`:

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

Both `AnInterface` and `AnotherInterface` now resolve to the same shared `$instance` from
`getExternalService('concreteInstance')`.

## Factory Services

```php
addFactory(string $id, Closure $factory);
```

Unlike regular bindings (which are singletons), a factory service returns a new instance every time the container
resolves it.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addFactory('session', fn () => new SessionHandler());
};
```

Every `$container->get('session')` returns a fresh `SessionHandler`. The closure may type-hint `Container` to resolve
its own dependencies.

## Lazy Services

```php
addLazy(string $id, Closure $factory);
```

At runtime it behaves like `addFactory`: the closure stays out of bootstrap and runs on **every** resolve, returning a
new instance each time. The name documents the intent: skip building an expensive service until something first asks
for it.

```php
<?php # gacela.php

use Gacela\Framework\Container\Container;

return function (GacelaConfig $config) {
  $config->addLazy(ReportBuilder::class, fn (Container $c) =>
    new ReportBuilder($c->get(DatabaseInterface::class))
  );
};
```

Nothing is built at bootstrap. The first `$container->get(ReportBuilder::class)` invokes the closure, and each later
resolve builds a fresh instance. Choose `addLazy` over `addFactory` when you mean to defer a costly construction;
otherwise they are interchangeable.

Gacela 2.0 also honors the container's `#[Lazy]` class attribute and `Container::lazy()`. On PHP 8.4+, these return an
instance whose constructor runs only when the object is first used. On PHP 8.3 the same declaration is accepted, but
construction is eager. Unlike `addLazy()`, the class-level lazy service follows the class's normal lifetime instead of
acting as a fresh-instance factory.

```php
use Gacela\Container\Attribute\Lazy;

#[Lazy]
final class ExpensiveReport
{
    // ...
}
```

Normal container resolution and `AbstractFactory::make()` both honor the attribute.

## Protected Services

```php
addProtected(string $id, Closure $service);
```

Store a closure **without invoking it**. Use it for callable configurations, or for lazy factories you trigger by
hand.

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

You cannot extend a protected service with `extendService()`.

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

The id may be an interface, so one hook can cover every implementation. Hooks fire in registration order for top-level
`get()`, `getOrFail()` and `make()` resolutions, but not for a nested constructor dependency.

Hooks registered in `gacela.php` are app-wide. **The scoped containers that module Factories use inherit them**, so a
hook fires for a service resolved inside a module as well as for one resolved from the app container. Before 2.1 the
module scope started with no hooks and silently skipped them.

A hook runs **once per resolution, not once per instance**. Fetching a shared service three times runs the callback
three times on the same object, so callbacks must be safe to repeat. A callback that throws evicts the affected
instance. To replace or decorate the returned object, use `extendService()`. To only observe resolution, use an event
listener.

## Service Aliases

```php
addAlias(string $alias, string $id);
```

Reference the same service by another name, for short names or backward compatibility.

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

Provide a different implementation of an interface depending on **which class requests it**.

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

Contextual bindings win over the global `addBinding()` for the same interface. For a per-parameter alternative driven by
an attribute, see [`#[Inject]`](/docs/inject).

### Binding scalar parameters by name

```php
when(string $concrete)->needs(string $parameterName)->give(mixed $value);
```

`needs()` also accepts a parameter name in the form `'$parameterName'` (note the leading `$`). It binds a scalar value
to that constructor parameter **by name** instead of by type.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->when(RetryingHttpClient::class)
    ->needs('$maxRetries')   // constructor parameter named $maxRetries
    ->give(30);              // inject the scalar 30
};
```

A class or interface name passed to `needs()` binds by type. A `'$name'` string binds that scalar constructor parameter
by name. `give()` takes the scalar directly (int, string, bool, array, etc.) and injects it as-is.

Contextual bindings apply to Gacela pillar classes (Factories, Configs and Providers) as well as to ordinary autowired
classes.

## Resolution order

This order applies wherever the container autowires a constructor: `AbstractFactory::make()`, Factory constructors,
plugins, and classes carrying [`#[Inject]`](/docs/inject). For a parameter `$p` on `Consumer`, the container tries:

1. A runtime override passed to `make()` under `$p`'s name.
2. A named contextual binding: `when(Consumer::class)->needs('$p')->give(...)`.
3. The explicit target in `#[Inject(Target::class)]`.
4. The parameter's default value.
5. A type-based contextual binding for `Consumer`.
6. A global `addBinding()` for the type.
7. Recursive autowiring when the type is an instantiable class.
8. `DependencyNotFoundException` when nothing can resolve it.

::: warning Defaults win over type bindings
`__construct(?Engine $engine = null)` resolves to `null` even when `Engine` has a global binding, because defaults are
checked first. Remove the default or use `#[Inject]` when the container should fill the parameter. Nullability alone
does not produce `null`: `?Engine $engine` without a default still throws if unresolved.
:::

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

Sources apply in declaration order and **after** imperative registrations. Later sources override earlier ones, and
definitions override `addBinding()`. Tags accumulate instead of replacing earlier entries. Paths are used exactly as
passed, so use `__DIR__`. Missing, unreadable or invalid files throw.

Definitions loaded through `GacelaConfig` are app-wide. A Provider can keep definitions in its own module scope with
`$container->load([...])` or `$container->loadFile(__DIR__ . '/services.php')`. Each registered id emits
`BindingRegisteredEvent`, like an imperative binding. YAML is not built in: parse it yourself and pass the resulting
array:

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

Resolve the iterable with `$container->tagged('validators')`. Gacela 2.0 also forwards `taggedByKey()` and
`taggedKeys()`. App-wide tags reach every module scope. A tag added with `$container->tag()` from a Provider stays local
to that module. Repeated registrations accumulate, and duplicate ids are yielded once.

`#[Tag('validators')]` on a class adds it to a tag without naming it in `gacela.php`. `tagged()` yields the ids
`gacela.php` tagged first, then the attribute members by class name, then what the module's own Provider tagged. The
[upstream guide](https://github.com/gacela-project/gacela/blob/main/docs/getting-a-dependency.md) explains how the
classes are found. [since 2.5]

Use tags for an unkeyed set you iterate. Use [`addHandlerRegistry()`](/docs/extensions#handler-registry) when callers
pick one handler by business key.

## Advanced container surface

Gacela 2.0 forwards the complete container 2.x API. Most applications use the higher-level configuration above.
Advanced integrations can call:

- `provides()`, `taggedByKey()`, `taggedKeys()`, `lazy()`, and `createScope()`.
- `writeCompiledCache()`, `writeCompiledFactories()`, `useCompiledFactories()`, and `compileReport()` for opt-in
  compiled constructor plans.
- `getStats()` for the legacy untyped array or `stats()` for the stable `ContainerStats` object.

Compiled plans are off by default on purpose: in the 2.0 release tests, loading a 300-class plan file measured slower
than reflecting those classes. The shared in-process `PlanCache` removes repeated reflection across module scopes
without disk I/O. `resetStaticCaches()` exists for explicit low-level cleanup. Normal application code uses
`Gacela::resetCache()` or `cache:clear`.

## Array access on the container

```php
Container implements ArrayAccess
```

The main [`Container`](/docs/bootstrap#gacela-container) implements PHP's `ArrayAccess`, a short syntax for the usual
`get()` / `set()` / `has()` operations.

```php
<?php

$container = Gacela::container();

$container[LoggerInterface::class] = FileLogger::class; // assignment   → register a binding
$logger = $container[LoggerInterface::class];           // offsetGet    → resolve the service
isset($container[LoggerInterface::class]);              // offsetExists → can get() resolve it?
unset($container[LoggerInterface::class]);              // offsetUnset  → remove the binding
```

It is syntax only. In container 2.x, `has()` follows PSR-11 semantics: it returns true when `get()` can resolve the id,
including an autowirable unregistered class. Use `provides()` when you need to know whether this container owns a
binding or instance.
