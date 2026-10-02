---
title: Provider
description: Declare the cross-module and infrastructure services a module is allowed to consume.
---

# Provider

The Provider handles **cross-module dependencies**. When your module needs something from another module, you wire it
in the Provider, always through the other module's [Facade](/docs/facade).

::: tip Factory vs Provider
- **Factory** → creates objects *inside* your module (intra-module)
- **Provider** → brings in dependencies *from other modules* (inter-module)
:::

::: warning `register()` is final
Do not override `AbstractProvider::register()`. Register services through `#[Provides]` or
`provideModuleDependencies()`.
:::

## Start from the consuming service

Let the service constructor show that the Sales module needs the Comment module. The Factory asks for the other
module's Facade interface. It does not decide how to locate it.

```php [src/Sales/SalesFactory.php]
<?php

declare(strict_types=1);

namespace App\Sales;

use App\Comment\CommentFacadeInterface;
use Gacela\Framework\AbstractFactory;

final class SalesFactory extends AbstractFactory
{
    public function createOrderCommentSaver(): OrderCommentSaver
    {
        return new OrderCommentSaver(
            $this->getProvidedDependency(CommentFacadeInterface::class),
        );
    }
}
```

## Satisfy the boundary in the Provider

Now connect that interface to the Comment module's Facade. `#[Provides]` keeps the dependency local to the Sales
module and resolves it lazily.

```php [src/Sales/SalesProvider.php]
<?php

declare(strict_types=1);

namespace App\Sales;

use App\Comment\CommentFacade;
use App\Comment\CommentFacadeInterface;
use Gacela\Framework\AbstractProvider;
use Gacela\Framework\Attribute\Provides;
use Gacela\Framework\Container\Container;

final class SalesProvider extends AbstractProvider
{
    #[Provides(CommentFacadeInterface::class)]
    public function commentFacade(Container $container): CommentFacadeInterface
    {
        return $container->getLocator()->getRequired(CommentFacade::class);
    }
}
```

## Complete call path

The caller still sees only the Sales Facade. The dependency shows up only when you follow the implementation inward:
**Facade → Factory → Provider → Comment Facade**.

```php
<?php # src/Sales/SalesFacade.php

namespace App\Sales;

use Gacela\Framework\AbstractFacade;

/**
 * @method SalesFactory getFactory()
 */
final class SalesFacade extends AbstractFacade
{
    public function saveComment(Comment $comment): int
    {
        return $this->getFactory()
            ->createOrderCommentSaver()
            ->save($comment);
    }
}
```

## More `#[Provides]` patterns

`#[Provides]` also accepts string IDs and non-Facade services. Gacela wraps each method in a lazy closure and passes it
the `Container` when the signature declares one.

```php
<?php # src/Sales/SalesProvider.php

use Gacela\Framework\AbstractProvider;
use Gacela\Framework\Attribute\Provides;
use Gacela\Framework\Container\Container;

final class SalesProvider extends AbstractProvider
{
    #[Provides('COMMANDS')]
    public function commands(): array
    {
        return [new SyncCommand()];
    }

    #[Provides('FACADE_COMMENT')]
    public function commentFacade(Container $container): CommentFacade
    {
        return $container->getLocator()->get(CommentFacade::class);
    }
}
```

`provideModuleDependencies()` is not abstract, so a Provider can be attribute-only or mix both styles.

### Mixing with `provideModuleDependencies()`

You can use attributes alongside the traditional method. Attribute services are registered first, then
`provideModuleDependencies()` runs as before:

```php
final class SalesProvider extends AbstractProvider
{
    #[Provides('COMMANDS')]
    public function commands(): array
    {
        return [new SyncCommand()];
    }

    public function provideModuleDependencies(Container $container): void
    {
        $container->set('LEGACY_SERVICE', fn () => new LegacyAdapter());
    }
}
```
