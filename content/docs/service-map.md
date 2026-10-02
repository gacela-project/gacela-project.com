---
title: Service Map
description: Resolve typed Gacela services from controllers, commands, and other classes created outside Gacela’s container.
---

# Service Map

Gacela resolves sibling pillars (Facade → Factory → Config → Provider) by convention. The **`#[ServiceMap]` attribute**
lets any other class resolve a Gacela service on demand, such as a controller that reaches a Facade without
constructor injection.

`#[ServiceMap]` is the required, forward-compatible runtime declaration. The bundled PHPStan extension and the 2.0 Psalm
plugin both understand it.

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

The attribute is repeatable. Declare every service the class resolves:

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

Each `__call()` dispatch is cached, and the resolver pool is static across the process, so repeated calls cost almost
nothing.

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

Without the attribute, 2.0 can still resolve from the docblock or scan the caller's imports. That cold resolution
raises `E_USER_DEPRECATED`, and 3.0 removes both fallbacks. `DocBlockResolverAwareTrait` itself was removed in 2.0: use
`ServiceResolverAwareTrait`.

## Relationship with the container

`#[ServiceMap]` is a thin layer over the Locator. The main container resolves the service, honouring every binding,
alias, contextual binding and `AnonymousGlobal` declaration in `gacela.php`.

For a class that another container manages (Symfony, Laravel), prefer constructor injection with
[`#[Inject]`](/docs/inject). `#[ServiceMap]` targets classes created outside Gacela, where constructor injection is not
practical.

## Limitations

- Because dispatch goes through `__call()`, IDEs need the attribute (or `@method`) to autocomplete. PhpStorm's Symfony
  plugin reads both out of the box.
- `#[ServiceMap]` cannot resolve protected services (`addProtected()`). They are stored as raw closures, and the
  container does not instantiate them.
- PHPStan reports an accessor that declares neither `#[ServiceMap]` nor `@method`. Psalm needs the
  [2.0 plugin](/docs/static-analysis#psalm) to infer the attribute's return type instead of treating the call as
  `mixed`.
