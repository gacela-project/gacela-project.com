+++
template = "section.html"
+++

# Factory

## Creating your objects

The Factory is the place where you create your domain services and objects. It is accessible only by the Facade.

```php
<?php
# src/Calculator/Factory.php

/**
 * @method Config getConfig()
 */
final class Factory extends AbstractFactory
{
    public function createAdder(): AdderInterface
    {
        return new Adder(
            // ...
        );
    }
}
```