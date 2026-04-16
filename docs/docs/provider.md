# Provider

The communication between different modules it's done via their Facades because they are the main entry point of a
module.

## Factory vs Provider

The main difference between Factories and Providers:
- Factories are responsible for in-module dependencies,
- while Providers are responsible for module-to-module dependencies.

## Setting a provided dependency

```php
<?php # src/Sales/SalesProvider.php

use Gacela\Framework\AbstractProvider;

final class SalesProvider extends AbstractProvider
{
    public const FACADE_COMMENT = 'FACADE_COMMENT';

    public function provideModuleDependencies(Container $container): void
    {
        $this->addCommentFacade($container);
    }

    private function addCommentFacade(Container $container): void
    {
        $container->set(
            self::FACADE_COMMENT,
            function (Container $container) {
                return $container->getLocator()->get(CommentFacade::class);
            }
        );
    }
}
```

## Factory using a provided dependency

```php
<?php # src/Sales/SalesFactory.php

use Gacela\Framework\AbstractFactory;

/**
 * @method SalesConfig getConfig()
 */
final class SalesFactory extends AbstractFactory
{
    public function createOrderCommentSaver(): FooService
    {
        return new OrderCommentSaver(
            $this->getCommentFacade()
        );
    }

    private function getOtherFacade(): OtherFacade
    {
        return $this->getProvidedDependency(
            Provider::FACADE_COMMENT
        );
    }
}
```

## The Facade uses the Factory

In the end, the Factory will be used by the module's Facade:

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

## `#[Provides]` attribute

::: tip Since 1.14
Replace stringly-typed `$container->set(KEY, fn () => ...)` boilerplate with a declarative method-level attribute.
:::

Instead of overriding `provideModuleDependencies()`, annotate methods with `#[Provides('ID')]`. Each method is wrapped in a lazy closure and auto-injected with `Container` when declared in the signature.

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

With `#[Provides]`, `provideModuleDependencies()` becomes non-abstract — providers can go attribute-only or mix both styles.

### Mixing with `provideModuleDependencies()`

You can use attributes alongside the traditional method. Attribute-registered services are resolved first, then `provideModuleDependencies()` runs as before:

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