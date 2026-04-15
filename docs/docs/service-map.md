# Service Map

Gacela resolves sibling pillars (Facade → Factory → Config → Provider) by convention. From `1.12.0` onwards, the **`#[ServiceMap]` attribute** is the preferred way to declare that a class should be able to resolve an additional Gacela service on demand — for example, accessing a Facade from inside a Symfony `Command` without constructor injection.

`#[ServiceMap]` replaces the older DocBlock `@method` dance. Both work; the attribute is more discoverable, survives PHPStan/Psalm out of the box (with [the bundled configs](/docs/static-analysis)), and is friendlier to static tooling.

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

The attribute is repeatable — declare every resolvable service the class needs:

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

Each `__call()` dispatch is cached — the resolver pool is static across the process, so repeated calls are essentially free.

## DocBlock alternative

The `@method` form is still fully supported and produces identical runtime behaviour. It's useful for legacy code bases and for PHP versions without attribute support:

```php
/**
 * @method UserFacade getFacade()
 */
final class UserController
{
    use ServiceResolverAwareTrait;
}
```

The trait was renamed from `DocBlockResolverAwareTrait` to `ServiceResolverAwareTrait` in `1.12.0`. The old name still works, but new code should use the new trait.

## Relationship with the container

`#[ServiceMap]` is a thin sugar on top of the Locator — the service is ultimately resolved through the main container, respecting every binding, alias, contextual binding and `AnonymousGlobal` declaration registered in `gacela.php`.

If you are authoring a class managed by another container (Symfony, Laravel), prefer constructor injection with `#[Inject]` (see [Container configuration](https://github.com/gacela-project/gacela/blob/main/docs/container-configuration.md)) — `#[ServiceMap]` is targeted at classes instantiated outside of Gacela where constructor injection is not practical.

## Limitations

- The `__call()` dispatch means IDEs need the attribute (or `@method`) to autocomplete. Both are read by PhpStorm's Symfony plugin out of the box.
- Protected services (`addProtected()`) cannot be resolved through `#[ServiceMap]` — they are stored as raw closures and the container will not instantiate them.
- Static analysis may still flag magic calls; use the [PHPStan / Psalm configs](/docs/static-analysis) shipped with Gacela to suppress them.
