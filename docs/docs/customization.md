# Module Customization

Advanced configuration options for customizing how Gacela discovers and resolves module classes.

## Suffix Types

```php
addSuffixTypeFacade(string $suffix);
addSuffixTypeFactory(string $suffix);
addSuffixTypeConfig(string $suffix);
addSuffixTypeProvider(string $suffix);
```

Apart from the known Gacela suffix classes: `Factory`, `Config`, and `Provider`, you can define other suffixes to be
resolved for your different modules. You can do this by adding custom gacela resolvable types.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->addSuffixTypeFacade('EntryPoint');
  $config->addSuffixTypeFactory('Creator');
  $config->addSuffixTypeConfig('Conf');
  $config->addSuffixTypeProvider('Binder');
};
```

In the example above, you'll be able to create a gacela module with these file names:

```bash
ExampleModule
├── Domain
│   └── YourLogicClass.php
├── EntryPoint.php  # this is the `Facade`
├── Creator.php     # this is the `Factory`
├── Conf.php        # this is the `Config`
└── Binder.php      # this is the `Provider` 
```

## Project Namespaces

```php
setProjectNamespaces(array $list);
```

You can add your project namespaces to be able to resolve gacela classes with priorities.

Gacela will start looking on your project namespaces when trying to resolve any gacela resolvable classes, eg:
`Facade`, `Factory`, `Config`, or `Provider`.

Let's visualize it with an example. Consider this structure:
```
├── gacela.php
├── index.php # entry point
├── src
│   └── Main
│       └── ModuleA
│           └── Factory.php
└── vendor
    └── third-party
        └── ModuleA
            ├── Facade.php
            └── Factory.php
```

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->setProjectNamespaces(['Main']);
};
```

Because you have defined `Main` as your project namespace, when you use the `ModuleA\Facade` from vendor, that Facade
will load the Factory from `src/Main/ModuleA/Factory` and not `vendor/third-party/ModuleA/Factory` because `Main` has
priority (over `third-party`, in this case).

**TL;DR**: You can override gacela resolvable classes by copying the directory structure from vendor modules in your
project namespaces.

## Listening to internal events

```php
registerGenericListener(callable $listener);
registerSpecificListener(string $event, callable $listener);
```

Gacela has an internal event-listener system that dispatches a variety of events.
These are read-only events interesting for tracing, debugging or act on them as you want.

### Register a generic listener

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->registerGenericListener(
    function (GacelaEventInterface $event) {
      echo $event->toString();
    }
  );
};
```

### Register a specific listener

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->registerSpecificListener(
    ResolvedClassCreatedEvent::class, 
    function (GacelaEventInterface $event): void {
      echo $event->toString();
    }
  );
};
```

### Supported events

#### Gacela\Framework\Event\ClassResolver\ClassNameFinder
- ClassNameInvalidCandidateFoundEvent
- ClassNameNotFoundEvent
- ClassNameCachedFoundEvent
- ClassNameValidCandidateFoundEvent

#### Gacela\Framework\Event\ConfigReader
- ReadPhpConfigEvent

#### Gacela\Framework\Event\ClassResolver
- AbstractGacelaClassResolverEvent
- ResolvedClassCachedEvent
- ResolvedClassCreatedEvent
- ResolvedCreatedDefaultClassEvent
- ResolvedClassTriedFromParentEvent

#### Gacela\Framework\Event\ClassResolver\Cache
- ClassNameCacheCachedEvent
- ClassNamePhpCacheCreatedEvent
- ClassNameInMemoryCacheCreatedEvent
- CustomServicesCacheCachedEvent
- CustomServicesPhpCacheCreatedEvent
- CustomServicesInMemoryCacheCreatedEvent

## Reset InMemoryCache

```php
resetInMemoryCache();
```

If you are working with integration tests, this option can be helpful to avoid false-positives, as `Gacela` works as a global singleton pattern to store the resolved dependencies.

```php
<?php # gacela.php

return function (GacelaConfig $config) {
  $config->resetInMemoryCache();
};
```
