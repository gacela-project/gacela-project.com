+++
template = "section.html"
+++

# Facade

## Entering your module

The Facade uses the Factory to create the module's domain instances and executes the desired behaviour from them.

```php
<?php # src/Calculator/FacadeInterface.php

interface FacadeInterface
{
  public function sum(): void;
}
```

```php
<?php # src/Calculator/Facade.php

/**
 * @method Factory getFactory()
 */
final class Facade extends AbstractFacade implements FacadeInterface
{
    public function sum(int ...$numbers): int
    {
        $this->getFactory()
            ->createAdder()
            ->add(...$numbers);
    }
}
```

A Facade is a "ready to use" thing:

```php
<?php

$facade = new Facade();
$result = $facade->sum(2, 3);
```

The Facade uses the Factory to create the module's domain instances and executes the desired behaviour from them.
