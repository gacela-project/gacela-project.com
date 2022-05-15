+++
title = "DependencyProvider"
weight = 6
+++

The communication between different modules it's done via their Facades because they are the main entry point of a
module. 

### Factory vs DependencyProvider

The main difference between Factories and Dependency Providers:
- Factories are responsible for in-module dependencies, 
- while Dependency Providers are responsible for module-to-module dependencies.

### Setting a provided dependency

```php
<?php # src/Sales/SalesDependencyProvider.php

use Gacela\Framework\AbstractDependencyProvider;

final class SalesDependencyProvider extends AbstractDependencyProvider
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

### Factory using a provided dependency

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
            DependencyProvider::FACADE_COMMENT
        );
    }
}
```

### The Facade uses the Factory

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