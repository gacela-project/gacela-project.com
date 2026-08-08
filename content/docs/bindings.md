---
title: Bindings
description: "Bind interfaces to implementations, with contextual bindings, aliases, protected values and factory services."
---

# Bindings

Gacela's container supports several binding strategies. All are configured via `GacelaConfig`, either in `gacela.php` or the `Gacela::bootstrap()` closure.

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

### addBindingIf

```php
addBindingIf(string $key, string|object|callable $value);
```

Bind a key **only if it is not already bound**. This is what a plugin uses to register a default: the application, or any binding registered earlier, keeps the last word.

```php
<?php # in a plugin

$config->addBindingIf(LoggerInterface::class, NullLogger::class);
```

Use `addBinding()` when your wiring must win, and `addBindingIf()` when it is a fallback somebody else may reasonably want to replace.

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

Contextual bindings win over the global `addBinding()` for the same interface. For a per-parameter alternative driven by an attribute, see [`#[Inject]`](/docs/inject).

## Tagged Services

```php
tag(string|array $ids, string $tag);
```

Group service identifiers under a label, so a module can ask for "every service tagged X" without knowing who registered them. Resolve the group with `Container::tagged($tag)`, which instantiates each id lazily, in the order it was tagged.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->tag([EmailValidator::class, SmsValidator::class], 'validators');
};
```

```php
# in a Provider
$container->set('validators', static fn(Container $c) => $c->tagged('validators'));
```

Declared in `gacela.php`, a tag reaches every module's container, so any module can consume it. A module that wants to **add** to a tag calls `Container::tag()` in its own Provider instead: that stays local to that module's container, which is what stops one module's contribution from leaking into a sibling's.

Repeated calls add to a tag rather than replacing it, and an id tagged twice is still yielded once.

::: info
A tag and a [handler registry](/docs/extensions#handler-registry) solve neighbouring problems. A registry is keyed and answers "the handler for *this* key", which is what a command bus needs. A tag is unkeyed and answers "every implementation of this", which is what validators and listeners need.
:::

## Definitions

```php
loadDefinitions(string|array $definitions);
```

Register a whole set of bindings from **data** rather than from a sequence of method calls, so wiring that is generated, shared between environments, or reviewed as a diff does not have to be written as code.

Pass the definitions inline, or the path of a `.php` file returning an array, or a `.json` file holding an object:

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->loadDefinitions([
    LoggerInterface::class => FileLogger::class,
    Database::class => ['singleton' => DatabasePool::class],
    'db.dsn' => ['value' => 'pgsql://localhost/app'],
  ]);

  $config->loadDefinitions(__DIR__ . '/services.json');
};
```

Every entry calls the registration method it stands for, so a definition behaves exactly like the imperative call it replaces.

::: warning
Order matters. Sources are applied as declared and **after** the imperative registrations, so a definitions file overrides `addBinding()`. That is what makes a per-environment override file useful, and what will surprise you if you expected the opposite. Tags accumulate rather than override.
:::

The path is used as given: unlike [`enableFileCache()`](/docs/caching) it is not rebased under the application root, so write it with `__DIR__`. A missing or unparsable file throws rather than leaving the wiring half applied.

YAML is deliberately unsupported, since neither the container nor Gacela will take a runtime dependency on a parser for it. Pass `Yaml::parseFile('services.yaml')` as the array instead.

Like `addBinding()`, definitions loaded here apply app-wide. A module that wants definitions of its own calls `Container::load()` in its Provider.

## After Resolving

```php
afterResolving(string $id, Closure $callback);
```

Run a callback on an instance once the container has resolved it. The callback receives the instance and the container, and callbacks run in registration order.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->afterResolving(
    LoggerAwareInterface::class,
    static fn(LoggerAwareInterface $service) => $service->setLogger($logger),
  );
};
```

`$id` may name an **interface**, which is the point: the match is made against the resolved instance rather than by looking the requested id up in a map, so one registration covers every implementation. A concrete class name works too, and matches only that class.

::: warning
The hook fires **once per resolution, not once per instance**. A shared instance fetched three times runs the callback three times, on the same object, so the callback has to be idempotent. Setting a property is safe; appending to a collection, incrementing a counter or registering a listener will repeat.
:::

Hooks fire on container-level resolution: `get()`, `getOrFail()` and `make()`. A class the container autowires as a nested constructor dependency is not resolved at that level, so hooks do not fire for it. A callback that throws removes the instance from the container rather than leaving a half-wired one behind for the next caller.

Three tools sit close together here, and they answer different questions:

| Tool | What it does |
| --- | --- |
| `afterResolving()` | Calls something **on** the instance. The instance is unchanged. |
| [`extendService()`](/docs/extensions#extend-service) | **Replaces** what comes out. Right for decoration. |
| [Event listeners](/docs/customization#listening-to-internal-events) | **Observe** only. `BindingRegisteredEvent` fires at registration, not at resolution. |

## Lifetime attributes

The container reads three class-level attributes, so a class can declare its own lifetime instead of every consumer having to know it.

```php
use Gacela\Container\Attribute\Factory;
use Gacela\Container\Attribute\Lazy;
use Gacela\Container\Attribute\Singleton;

#[Singleton]
final class ConnectionPool {}

#[Factory]
final class RequestId {}

#[Lazy]
final class ReportRenderer {}
```

- `#[Singleton]`: the container caches one instance and reuses it.
- `#[Factory]`: a new instance on every request. The attribute equivalent of [factory services](#factory-services).
- `#[Lazy]`: construction is deferred until the instance is first used. The container returns a lazy ghost, a real instance of the right type whose constructor has not run; touching any property or method initialises it. Worth it for an expensive service a given request may never reach.

::: warning
`#[Lazy]` is not the attribute form of [`addLazy()`](#lazy-services), despite the name. `addLazy()` defers a closure out of bootstrap and returns a **new instance on every resolve**. `#[Lazy]` is about *when* a class is constructed, not how many times.
:::

::: info
`#[Lazy]` needs PHP 8.4 for native lazy objects. On 8.3 the class is constructed eagerly instead, which is unobservable apart from the timing.
:::
