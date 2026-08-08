---
title: Gacela
description: Gacela is a PHP framework for building applications out of modules that stay genuinely separate. Every module exposes the same four classes, and other modules only ever call the Facade.
layout: home
---

::: code-group

```php [src/Module/Facade.php]
namespace Module;

use Gacela\Framework\AbstractFacade;

/**
 * @method Factory getFactory()
 */
final class Facade extends AbstractFacade
{
    public function greet(string $name): string
    {
        return $this->getFactory()
            ->createGreeter()
            ->greet($name);
    }
}
```

```php [src/Module/Factory.php]
namespace Module;

use Gacela\Framework\AbstractFactory;
use Module\Service\Greeter;

final class Factory extends AbstractFactory
{
    public function createGreeter(): Greeter
    {
        return new Greeter();
    }
}
```

```php [src/Module/Service/Greeter.php]
namespace Module\Service;

final class Greeter
{
    public function greet(string $name): string
    {
        return "Hi, $name!";
    }
}
```

```php [example.php]
use Gacela\Framework\Gacela;
use Module\Facade;

require __DIR__ . '/vendor/autoload.php';

# Gacela must be bootstrapped on the entry point of your application
Gacela::bootstrap(__DIR__);

$facade = new Facade();
echo $facade->greet('Alice'); # Hi, Alice!
```

:::
