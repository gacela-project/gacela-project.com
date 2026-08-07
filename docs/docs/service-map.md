---
title: Service Map
description: Resolve typed Gacela services from controllers, commands, and other classes created outside Gacela’s container.
---

# Service Map

Gacela resolves sibling pillars (Facade → Factory → Config → Provider) by convention. The **`#[ServiceMap]` attribute** declares that another class can resolve a Gacela service on demand—for example, a controller accessing a Facade without constructor injection.

`#[ServiceMap]` is the required forward-compatible runtime declaration. It is understood by the bundled PHPStan extension and the 2.0 Psalm plugin.

## Basic usage

```php
use Gacela\Framework\ServiceResolver\ServiceMap;
use Gacela\Framework\ServiceResolverAwareTrait;

#[ServiceMap(method: 'getFacade', className: UserFacade::class)]
final class UserController
{
    use ServiceResolverAwareTrait;

    public function show(int $id): array
    {
        return $this->getFacade()->findUser($id);
    }
}
```

The attribute is repeatable. Declare every resolvable service the class needs:

```php
#[ServiceMap(method: 'getFacade',     className: UserFacade::class)]
#[ServiceMap(method: 'getCatalog',    className: CatalogFacade::class)]
#[ServiceMap(method: 'getLogger',     className: LoggerInterface::class)]
final class DashboardController
{
    use ServiceResolverAwareTrait;

    public function index(): array
    {
        return [
            'user'    => $this->getFacade()->current(),
            'top'     => $this->getCatalog()->popular(),
        ];
    }
}
```

Each `__call()` dispatch is cached. The resolver pool is static across the process, so repeated calls are essentially free.

## DocBlock migration aid

An IDE-friendly `@method` can live beside the attribute:

```php
/** @method UserFacade getFacade() */
#[ServiceMap(method: 'getFacade', className: UserFacade::class)]
final class UserController
{
    use ServiceResolverAwareTrait;
}
```

If the attribute is absent, 2.0 can still resolve from the docblock or scan the caller's imports, but that cold resolution raises `E_USER_DEPRECATED`; both fallbacks are removed in 3.0. `DocBlockResolverAwareTrait` itself was removed in 2.0—use `ServiceResolverAwareTrait`.

## Relationship with the container

`#[ServiceMap]` is a thin sugar on top of the Locator. The service is ultimately resolved through the main container, respecting every binding, alias, contextual binding and `AnonymousGlobal` declaration registered in `gacela.php`.

If you are authoring a class managed by another container (Symfony, Laravel), prefer constructor injection with [`#[Inject]`](/docs/inject). `#[ServiceMap]` is targeted at classes instantiated outside of Gacela where constructor injection is not practical.

## Limitations

- The `__call()` dispatch means IDEs need the attribute (or `@method`) to autocomplete. Both are read by PhpStorm's Symfony plugin out of the box.
- Protected services (`addProtected()`) cannot be resolved through `#[ServiceMap]`. They are stored as raw closures and the container will not instantiate them.
- PHPStan reports an accessor that declares neither `#[ServiceMap]` nor `@method`. Psalm needs the [2.0 plugin](/docs/static-analysis#psalm) to infer the attribute's return type instead of treating the call as `mixed`.
