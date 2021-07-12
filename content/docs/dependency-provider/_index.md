+++
template = "section.html"
+++

# DependencyProvider

## Defining the dependencies

This is the place where you can define the dependencies that a particular module has with other modules. This is helpful
to define the different services from the module's container. The container has access to the locator which is shared
within all modules, and it can reuse the same instances from all facades.

```php
<?php # src/Calculator/Factory.php

final class Factory extends AbstractFactory
{
    public function createAdder(): AdderInterface
    {
        return new Adder(
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
<?php # src/Calculator/DependencyProvider.php

final class DependencyProvider extends AbstractDependencyProvider
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
