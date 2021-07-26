+++
template = "section.html"
+++

# Dependency Provider

The communication between different modules it's done via their Facades because they are the main entry point of a
module. The main difference between Factories and Dependency Providers is that Factories are responsible for in-module
dependencies, while Dependency Providers are responsible for module-to-module dependencies.

## Defining the dependencies

```php
<?php # src/Comment/CommentFactory.php

use Gacela\Framework\AbstractFactory;

/**
 * @method CommentConfig getConfig()
 */
final class CommentFactory extends AbstractFactory
{
    public function createSpamChecker(): SpamChecker
    {
        return new SpamChecker(
            HttpClient::create(),
            $this->getConfig()->getSpamCheckerEndpoint(),
            $this->getAnotherFacade()
        );
    }

    private function getAnotherFacade(): AnotherFacade
    {
        return $this->getProvidedDependency(
            DependencyProvider::FACADE_ANOTHER_MODULE
        );
    }
}
```

```php
<?php # src/Comment/CommentDependencyProvider.php

final class CommentDependencyProvider extends AbstractDependencyProvider
{
    public const FACADE_ANOTHER_MODULE = 'FACADE_ANOTHER_MODULE';

    public function provideModuleDependencies(Container $container): void
    {
        $this->addFacadeAnother($container);
    }

    private function addFacadeAnother(Container $container): void
    {
        $container->set(
            self::FACADE_ANOTHER_MODULE,
            function (Container $container): AnotherFacade {
                return $container->getLocator()->get(AnotherFacade::class);
            }
        );
    }
}
```
